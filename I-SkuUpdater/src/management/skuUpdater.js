'use strict'
const sql = require("mssql")
const mySQL = require('../../../common/mySQL')
const queryGenerator = require('../../../common/queryGenerator')
const dateFormat = require('dateformat')

/**
 * Obtiene los skus desde la base de datos de productos.
 * @return {[Json]}: Retorna objeto JSON que contiene sku, code (category), name (product_name), seller_sku y facility, si falla retorna excepción.
 */
module.exports.getDataProducts = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        let valida = await mySQL.validarConexionProductos();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configProductos);

        /** QUERY. */
        const query = `
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
                AND P.deleted_at IS NULL
                AND P.created_at <= '${dateFormat(new Date(), "yyyy-mm-dd")}'
                AND P.created_at >= '${dateFormat((new Date() - 86400000), "yyyy-mm-dd")}'
        `;

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 400, body: { error: 'No se pudo consultar los datos de productos.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** RETORNO RESPUESTA. */
        return data.recordset

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo obtener la información de la base de datos de productos.', detalle: error }, error: {} };

    }

};

/**
 * Genera inserción de datos en tabla skus con datos desde la base de datos de productos.
 * @param {[Json]} data: Arreglo de objetos con datos de productos.
 * @return {json}: Retorna respuesta de transacción sql ejecutada correctamente con conteo de skus actualizados, si falla retorna excepción.
 */
module.exports.updateSku = async (data) => {

    /** VALIDAR QUE LA VARIABLE DE ENTRADA TENGA CONTENIDO. */
    if (data.length == 0)
        return { status: 200, body: { message: 'No existen skus para actualizar.' }, warn: {} };

    /** CREAR GRUPOS DE OBJETOS DE ACUERDO AL LIMITE QUE SE INDIQUE. */
    let groups = await queryGenerator.divideScriptByGroup(data, 1000);

    /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
    let valida = await mySQL.validarConexionFinanzas();
    if (valida.length > 0) throw valida;
    const pool = new sql.ConnectionPool(mySQL.configFinanzas);
    await pool.connect();

    try {

        /** CREAR E INICIAR TRANSACCIÓN. */
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {

            /** ITERAR GRUPOS Y EJECUTAR QUERY. */
            for (const group of Object.keys(groups)) {
                let query = `INSERT INTO skus (sku, category, product_name, seller_sku, facility) VALUES`;
                for (const product of Object.keys(groups[group])) { query += ` ('${groups[group][product].sku}', '${groups[group][product].code}', '${groups[group][product].name}', '${groups[group][product].seller_sku}', '${groups[group][product].facility}'),`; }
                let request = new sql.Request(transaction);
                let result = (await request.query(query.slice(0, -1))).recordset;
            }

            /** COMMIT. */
            await transaction.commit();

            /** RETORNO RESPUESTA. */
            return { total: data.length };

        } catch (error) {

            /** CAPTURA ERROR Y REALIZA ROLLBACK A OPERACIÓN. */
            await transaction.rollback();
            return { status: 400, body: { error: 'No se pudo ejecutar la inserción de datos en finanzas.', detalle: error }, error: {} };
        }

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo ejecutar la inserción de datos en finanzas.', detalle: error }, error: {} };

    } finally {

        /** FINALIZAR TRANSACCIÓN CERRANDO CONEXIÓN AL POOL. */
        await pool.close();

    }

};