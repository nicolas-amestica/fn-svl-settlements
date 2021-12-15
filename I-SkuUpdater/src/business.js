'use strict'
const MySQL = require('../../libs/mySQL')
const QueryGenerator = require('../../libs/queryGenerator')

/**
 * Obtiene los skus faltantes en tabla skus comparándola con sales.
 * @param {Json} context: Objeto de contexto Azure.
 * @return {[Json]}: Retorna objeto JSON que contiene sku, code (category), name (product_name), seller_sku y facility, si falla retorna excepción.
 */
module.exports.getDataFinances = async (context) => {

    try {

        context.log('OBTENIENDO INFORMACIÓN DE FINANZAS');

        /** QUERY. */
        let query = `
            SELECT
                SKU_SALES AS SKU_FALTANTES
            FROM (
                    SELECT
                        DISTINCT
                        a.sku AS SKU_SKUS,
                        b.sku AS SKU_SALES
                    FROM
                        sales b
                        LEFT JOIN (
                            SELECT
                                sku
                            FROM
                                skus	
                        ) a ON b.sku=a.sku
                    WHERE
                        b.origin = 'SVL'
                        AND (b.closeout_number IS NULL OR b.closeout_number = 0)
                        AND b.folio NOT IN (N'0', N'-1', N'-2', N'-3', N'-4', N'-5', N'-6', N'-7', N'-8', N'-9', N'-10', N'-11')
                        AND b.quantity >= 0
                        AND b.category IS NULL
                ) TABLA1
            WHERE
                TABLA1.SKU_SKUS IS NULL
        `;

        /** EJECUCIÓN DE QUERY. */
        let data = await MySQL.getDataFinances(query);
        if (data.error)
            throw data.error

        /** CERRAR CONEXIÓN A SQL. */
        let con = await MySQL.closeConnection();
        if (con.error)
            throw con.error

        /** RETORNO RESPUESTA. */
        return data

    } catch (error) {

        /** CAPTURA EXCEPCIÓN */
        return { error };

    }

};

/**
 * Obtiene detalle de skus desde productos.
 * @param {Json} context: Objeto de contexto Azure.
 * @return {[Json]}: Retorna objeto JSON que contiene sku, code (category), name (product_name), seller_sku y facility, si falla retorna excepción.
 */
module.exports.getDataProducts = async (context, objSkus) => {

    try {

        context.log('OBTENIENDO INFORMACIÓN DE PRODUCTOS');

        /** QUERY. */
        let query = `
            SELECT
                PV.sku,
                C.code,
                TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(P.name, CHAR(9), ''), CHAR(10), ''), CHAR(13), ''), '''', ''), ';', ''), '"', '')) AS name,
                TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(PV.seller_sku, CHAR(9), ''), CHAR(10), ''), CHAR(13), ''), '''', ''), ';', ''), '"', '')) AS seller_sku,
                SUBSTRING(S.facility, 1, LEN(S.facility)-3) as facility
            FROM
                products P
                INNER JOIN product_variants PV ON (P.id = PV.product_id)
                INNER JOIN categories C ON (P.category_id = C.id)
                INNER JOIN stock_report S ON (PV.sku = S.sku)
            WHERE
                P.svl_country_id = 45
                AND P.business = 0
                AND PV.sku IS NOT NULL
                AND PV.sku IN (${await QueryGenerator.objectToStringByIdentifier(objSkus, 'SKU_FALTANTES')})
        `;

        /** EJECUCIÓN DE QUERY. */
        let data = await MySQL.getDataProducts(query);
        if (data.error)
            throw data.error;

        /** CERRAR CONEXIÓN A SQL. */
        let con = await MySQL.closeConnection();
        if (con.error)
            throw con.error

        /** RETORNO RESPUESTA. */
        return data

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Genera inserción de datos en tabla skus.
 * @param {Json} context: Objeto de contexto Azure.
 * @param {[Json]} data: Arreglo de objetos con datos de productos.
 * @return {json}: Retorna respuesta de transacción sql ejecutada correctamente con conteo de skus actualizados, si falla retorna excepción.
 */
module.exports.updateSku = async (context, data) => {

    try {

        /** DIVIDIR OBJETO. */
        context.log('DIVIDIENDO VENTAS');

        /** VALIDAR QUE LA VARIABLE DE ENTRADA TENGA CONTENIDO. */
        if (data.length == 0)
            throw 'No existen skus para actualizar.'

        let cont = 0;
        let result;
        let query;
        let divider = 1000;

        let splitSalesGroups = await QueryGenerator.divideScriptByGroup(data, divider);

        /** ACTUALIZANDO DATA. */
        context.log('ACTUALIZANDO SKUS');

        if (splitSalesGroups.length > 1) {
            for (const spliterSale of Object.keys(splitSalesGroups)) {

                query = `INSERT INTO skus (sku, category, product_name, seller_sku, facility) VALUES`;

                for (const product of Object.keys(splitSalesGroups[spliterSale])) {
                    query += ` ('${splitSalesGroups[spliterSale][product].sku}', '${splitSalesGroups[spliterSale][product].code}', '${splitSalesGroups[spliterSale][product].name}', '${splitSalesGroups[spliterSale][product].seller_sku}', '${splitSalesGroups[spliterSale][product].facility}'),`;
                }

                result = await MySQL.updateSale(query.slice(0, -1));
                if (result.error)
                    throw result.error;

                cont++
                context.log(`Grupo ${cont}: ${Object.keys(spliterSale).length} updated.`);
            }
        } else {

            query = `INSERT INTO skus (sku, category, product_name, seller_sku, facility) VALUES`;

            for (const product of Object.keys(data)) {
                query += ` ('${data[product].sku}', '${data[product].code}', '${data[product].name}', '${data[product].seller_sku}', '${data[product].facility}'),`;
            }

            result = await MySQL.updateSale(query.slice(0, -1));
            if (result.error)
                throw result.error;

            context.log(`Skus: ${result} updated.`);
            cont++
        }

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /** RETORNO RESPUESTA. */
        return { 'Total grupos a actualizar': Object.keys(splitSalesGroups).length, 'Total ejecutadas': cont };

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error };

    }

};