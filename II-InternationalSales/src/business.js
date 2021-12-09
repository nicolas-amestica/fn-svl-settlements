'use strict';
const MySQL = require('../../libs/mySQL');
const QueryGenerator = require('../../libs/queryGenerator');
const GroupBy = require('lodash.groupby');

/**
 * Obtiene los folios desde la base de datos de finanzas.
 * @return {[Json]}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataFinance = async () => {

    try {

        console.log('OBTENIENDO RUT VENTAS DE FINANZAS');

        /** QUERY. */
        const query = `SELECT DISTINCT rut AS RUT FROM sales WHERE origin = 'SVL' AND folio NOT IN ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11') AND quantity > 0 AND (closeout_number = 0 OR closeout_number IS NULL) AND (international = -1 OR international IS NULL)`;

        /** EJECUCIÓN DE QUERY. */
        const data = await MySQL.getDataFinances(query)
        if (data.error)
            throw data.error

        /** RETORNO RESPUESTA. */
        return data

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Obtiene companies desde la base de datos de usuarios.
 * @param {[Json]} objRuts: Arreglo de objetos con rut a consultar indicando si son companies nacionales o internacionales.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del mapeo de rut nacionales e internacionales, incluye respuesta satisfactoria o fallo.
 */
module.exports.getDataUser = async (objRuts) => {

    try {

        console.log('OBTENIENDO SELLERS');

        /** QUERY. */
        const query = `SELECT companies.rut AS RUT, CASE WHEN companies.svl_country_id = communes.country_id THEN 0 ELSE 1 END AS INTERNATIONAL FROM companies, communes WHERE companies.deleted_At IS NULL AND companies.commune_id = communes.id AND companies.rut IN (${(await QueryGenerator.inQueryGenerator(objRuts)).replace(/["]+/g, '')})`;

        /** EJECUCIÓN DE QUERY. */
        const data = await MySQL.getDataUsers(query)
        if (data.error)
            return data.error;

        /** QUITAR RUT DUPLICADOS. */
        let set = new Set(data.map(JSON.stringify))
        let internationalSales = Array.from(set).map(JSON.parse);

        /** RETORNO RESPUESTA. */
        return internationalSales;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

}

/**
 * Actualizar ventas indicando si son ventas nacionales o internacionales.
 * @param {[Json]} internationalSales: Arreglo de objetos con ventas indicando si son nacionales o internacionales.
 * @return {json}: Respuesta JSON de la función que retorna el resultado de la actualización del campo international de las ventas, si falla retorna excepción.
 */
module.exports.updateInternationalSales = async (internationalSales) => {

    try {

        console.log('ACTUALIZANDO VENTAS');

        /** AGRUPAR VENTAS POR CAMPO INTERNATIONAL. */
        let groups = GroupBy(internationalSales , 'INTERNATIONAL');

        let cont = 0;

        /** ACTUALIZAR DATA. */
        for (const international of Object.keys(groups)) {

            let divide;
            let result;
            let divider = 10000
            let query;

            if (groups[international].length > divider) {

                divide = await QueryGenerator.divideScriptByGroup(groups[international], divider);

                if (divide.length > 1) {
                    for (const dividerSale of divide) {
                        query = `UPDATE sales SET international = ${international} WHERE RUT IN (${await QueryGenerator.objectToStringByIdentifier(dividerSale, "RUT")}) AND folio NOT IN ('0','-1','-2','-3','-4','-5','-6','-7','-8','-9','-10','-11') AND quantity > 0 AND (closeout_number IS NULL OR closeout_number = 0) AND origin = 'SVL' AND (international = -1 OR international IS NULL)`;
                        result = await MySQL.updateSale(query);
                        cont++
                        console.log(`* Ventas ${international} (${cont}): ${result} updated.`);

                        if (result.error)
                            throw result.error;
                    }
                }
            } else {
                query = `UPDATE sales SET international = ${international} WHERE RUT IN (${await QueryGenerator.objectToStringByIdentifier(groups[international], "RUT")}) AND folio NOT IN ('0','-1','-2','-3','-4','-5','-6','-7','-8','-9','-10','-11') AND quantity > 0 AND (closeout_number IS NULL OR closeout_number = 0) AND origin = 'SVL' AND (international = -1 OR international IS NULL)`;
                result = await MySQL.updateSale(query);
                console.log(`Ventas ${international}: ${result} updated.`);
                cont++

                if (result.error)
                    throw result.error;
            }
        }

        /** RETORNO RESPUESTA. */
        return { 'Total grupos a actualizar': Object.keys(groups).length, 'Total ventas actualizadas': cont };

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};