'use-strinct'
const GCP = require('../../libs/gcloud');
const GroupBy = require('lodash.groupby');
const QueryGenerator = require('../../libs/queryGenerator')
const MySQL = require('../../libs/mySQL')

/**
 * Obtiene datos de GCP.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getDataGcp = async (context) => {

    try {

        /* EJECUTAR BIGQUERYS */
        context.log("OBTENIENDO INFORMACIÓN DE GCP");

        /* BIGQUERYS */
        const sql_folios_recepcionados = `WITH maestro_ordenes AS( SELECT Distinct(folio) as folio, RECEPCIONADA, FECHA_RECEPCION as recepcion, MODALIDAD as tipo_abastecimiento, ESTADO_DO as estado_do, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 ) SELECT Distinct(svl_finanzas.folio) as folio, CASE svl_finanzas.fulfillment_type WHEN 'null' THEN null ELSE svl_finanzas.fulfillment_type END AS fulfillment_type, maestro_ordenes.tipo_abastecimiento, maestro_ordenes.estado_do, maestro_ordenes.recepcion FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas as svl_finanzas LEFT JOIN maestro_ordenes ON maestro_ordenes.folio = svl_finanzas.folio`;
        const folios_recepcionados = { query: sql_folios_recepcionados, location: 'US' };

        let canceladosToArray = [];

        const [rs] = await GCP.select(folios_recepcionados);

        /* INICIO RECORRIDO POR FOLIO */
        context.log("INICIO LECTURA DE DATA OBTENIDA");

        /* ITERACIÓN DATA RS */
        for (const data of rs) {

            data.folio = data.folio.c.join("");
            data.fulfillment_type = data.fulfillment_type;
            data.tipo_abastecimiento = (data.tipo_abastecimiento ? data.tipo_abastecimiento : '');
            data.estado_do = (data.estado_do ? data.estado_do : '');
            data.recepcion = (data.recepcion ? data.recepcion.value.replace('T', ' ').substr(0, 19) : null);

            // FOLIOS CANCELADOS
            if ((data.estado_do.toString() == "Cancelled" && data.recepcion == null || data.recepcion == "") || (data.tipo_abastecimiento == "VEV" || data.tipo_abastecimiento == "NOVIOS" || data.tipo_abastecimiento == "TIENDA"))
                canceladosToArray.push(data)

        }

        /* RETORNO RESPUESTA */
        return canceladosToArray

    } catch (error) {

        /* RETORNO EXCEPCIÓN */
        return { error }

    }

};

/**
 * Actualizar data en base de datos finanzas.
 * @param {[Json]} data: Arreglo de objeto que tiene la información de ventas.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.updateData = async (context, data) => {

    try {

        /** DIVIDIR OBJETO. */
        context.log('DIVIDIENDO VENTAS');

        let cont = 0;
        let result;
        let query;
        let divider = 10000;

        let splitSalesGroups = await QueryGenerator.divideScriptByGroup(data, divider);

        /** ACTUALIZANDO DATA. */
        context.log('ACTUALIZANDO VENTAS');
        if (splitSalesGroups.length > 1) {
            for (const spliterSale of splitSalesGroups) {
                query = `UPDATE sales SET term = folio, folio = '-4', updatedAt = getDate() FROM sales WHERE origin = 'SVL' AND (closeout_number IS NULL OR closeout_number = 0) AND folio IN (${await QueryGenerator.objectToStringByIdentifier(spliterSale, "folio")})`;
                result = await MySQL.updateSale(query);
                cont++
                context.log(`Grupo ${cont}: ${result} updated.`);

                if (result.error)
                    throw result.error;
            }
        } else {
            query = `UPDATE sales SET term = folio, folio = '-4', updatedAt = getDate() FROM sales WHERE origin = 'SVL' AND (closeout_number IS NULL OR closeout_number = 0) AND folio IN (${await QueryGenerator.objectToStringByIdentifier(data, "folio")})`;
            result = await MySQL.updateSale(query);
            context.log(`Folios: ${result} updated.`);
            cont++

            if (result.error)
                throw result.error;
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