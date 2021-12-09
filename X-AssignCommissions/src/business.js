'use-strinct'
const GCP = require('../../libs/gcloud');
const GroupBy = require('lodash.groupby');
const QueryGenerator = require('../../libs/queryGenerator')
const MySQL = require('../../libs/mySQL')

/**
 * Obtiene datos de ventas sin categoría.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getFoliosIdWithoutCategory = async () => {

    try {

        console.log("OBTENIENDO FOLIOS SIN CATEGORÍA");

        /* QUERY */
        const query = `SELECT s.id AS 'ID_FOLIO', sku.category AS 'SKU_CATEGORY' FROM sales s INNER JOIN skus sku ON s.sku = sku.sku AND s.category IS NULL AND sku.category IS NOT NULL AND (s.closeout_number IS NULL OR s.closeout_number = 0) AND s.origin = 'SVL'`;

        /* EJECUTAR QUERY */
        let result = await MySQL.getDataFinances(query);
        if (result.error)
            throw result.error

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /* RETORNO RESPUESTA */
        return result

    } catch (error) {

        return { error }

    }

};

/**
 * Actualizar data en base de datos finanzas.
 * @param {[Json]} data: Arreglo de objeto que tiene la información de finanzas.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.updateFoliosIdWithoutCategory = async (data) => {

    try {

        console.log('AGRUPANDO CATEGORÍAS');

        /** AGRUPAR CATEGORÍAS. */
        let groups = await GroupBy(data, 'SKU_CATEGORY');

        console.log('ACTUALIZANDO VENTAS');
        
        cont = 0;
        
        /** ACTUALIZAR DATA. */
        for (const category of Object.keys(groups)) {

            let result;
            let query;

            query = `UPDATE sales SET category = '${category}', updatedAt = getDate() WHERE id IN (${await QueryGenerator.objectToStringByIdentifier(groups[category], "ID_FOLIO")}) AND origin = 'SVL' AND category IS NULL AND (closeout_number IS NULL OR closeout_number = 0)`;
            result = await MySQL.updateSale(query);
            console.log(`${category}: ${result} updated.`);
            cont++

            if (result.error)
                throw result.error;

        }

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /** RETORNO RESPUESTA. */
        return { 'Total grupos a actualizar': Object.keys(groups).length, 'Total actualizadas': cont };

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Obtiene datos de ventas sin product com.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getFoliosIdsWithoutProductCOM = async () => {

    try {

        console.log("OBTENIENDO FOLIOS SIN PRODUCT COM");

        /* QUERY */
        const query = `SELECT id AS 'ID_FOLIO', ( SELECT TOP 1 prod.id FROM products prod INNER JOIN sales sal ON ( sku_category_code = (sal.category) OR sku_category_code = (( SELECT SUBSTRING(sal.category, 1, 7))) OR sku_category_code = (( SELECT SUBSTRING(sal.category, 1, 5))) OR sku_category_code = (( SELECT SUBSTRING(sal.category, 1, 3))) ) WHERE state = 'approved' and sal.id = sales.id ORDER BY sku_category_code DESC ) AS 'PRODUCT_COM' FROM sales WHERE origin = 'SVL' AND (commission_value IS NULL OR commission_value = 0 OR commission_value = -1) AND (category != '-1' OR category IS NOT NULL) AND gross_sale_income > 0 AND folio not in ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11') AND quantity > 0 AND (closeout_number = 0 OR closeout_number IS NULL) AND international = 0 AND (product_com is null or product_com = 0)`;

        /* EJECUTAR QUERY */
        let result = await MySQL.getDataFinances(query);
        if (result.error)
            throw result.error

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /* RETORNO RESPUESTA */
        return result

    } catch (error) {

        return { error }

    }

};

/**
 * Actualizar data en base de datos finanzas.
 * @param {[Json]} data: Arreglo de objeto que tiene la información de finanzas.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.updateFoliosIdsWithoutProductCOM = async (data) => {

    try {
        
        console.log('AGRUPANDO PRODUCT COM');

        /** AGRUPAR CATEGORÍAS. */
        let groups = await GroupBy(data, 'PRODUCT_COM');

        console.log('ACTUALIZANDO VENTAS SIN PRODUCT COM');
        
        cont = 0;
        
        /** ACTUALIZAR DATA. */
        for (const product_com of Object.keys(groups)) {

            let result;
            let query;

            query = `UPDATE sales SET product_com = ${product_com}, updatedAt = getDate() WHERE id IN (${await QueryGenerator.objectToStringByIdentifier(groups[product_com], "ID_FOLIO")}) AND origin = 'SVL' AND (product_com IS NULL OR product_com = 0) AND (closeout_number IS NULL OR closeout_number = 0)`;
            result = await MySQL.updateSale(query);
            console.log(`Product_com ${product_com}: ${result} updated.`);
            cont++

            if (result.error)
                throw result.error;

        }

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /** RETORNO RESPUESTA. */
        return { 'Total grupos a actualizar': Object.keys(groups).length, 'Total actualizadas': cont };

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Ejecuta un procedimiento almacenado que calcula comisiones a ventas.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.assignCommissions = async () => {

    try {

        console.log("CALCULANDO COMISIONES A VENTAS");

        /* QUERY */
        const query = `BEGIN EXEC SP_LIQUIDACION_MOD END`;

        /* EJECUTAR QUERY */
        let result = await MySQL.executeProcedureFinances(query);
        if (result.error)
            throw result.error

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /* RETORNO RESPUESTA */
        return result

    } catch (error) {

        return { error }

    }

};