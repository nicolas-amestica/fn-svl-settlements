'use-strinct'
const GCP = require('../../libs/gcloud');
const GroupBy = require('lodash.groupby');
const QueryGenerator = require('../../libs/queryGenerator')
const MySQL = require('../../libs/mySQL')

/**
 * Obtiene datos de GCP.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getDataGcp = async () => {

    try {

        /* BIGQUERYS */
        const sql_folios_recepcionados = `WITH maestro_ordenes AS( SELECT Distinct(folio) as folio, RECEPCIONADA, FECHA_RECEPCION as recepcion, MODALIDAD as tipo_abastecimiento, ESTADO_DO as estado_do, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 ) SELECT Distinct(svl_finanzas.folio) as folio, CASE svl_finanzas.fulfillment_type WHEN 'null' THEN null ELSE svl_finanzas.fulfillment_type END AS fulfillment_type, maestro_ordenes.tipo_abastecimiento, maestro_ordenes.estado_do, maestro_ordenes.recepcion FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas as svl_finanzas LEFT JOIN maestro_ordenes ON maestro_ordenes.folio = svl_finanzas.folio`;
        const sql_folios_faltantes = `SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND RECEPCIONADA=1 UNION ALL SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND estado_svl IN ('delivered','sent','outForDelivery') AND modalidad_svl ='cross_docking_with_3pl' UNION ALL SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND MODALIDAD IN ('FBF') AND FECHA_SALIDA_FBF IS NOT NULL`;

        const folios_recepcionados = { query: sql_folios_recepcionados, location: 'US' };
        const folios_faltantes = { query: sql_folios_faltantes, location: 'US' };

        let sindespachoArray = [];
        let sindespachoArray2 = [];
        let sindespachoToArray = [];

        /* EJECUTAR BIGQUERYS */
        console.log("EJECUTANDO BIGQUERY");

        // const [rsin] = await gcp.select(categorias_dwh);
        const [rs] = await GCP.select(folios_recepcionados);
        const [rsfa] = await GCP.select(folios_faltantes);

        /* INICIO RECORRIDO POR FOLIO */
        console.log("INICIO LECTURA DE DATA OBTENIDA");

        /* ITERACIÓN DATA RS */
        for (const data of rs) {

            data.folio = data.folio.c.join("");
            data.fulfillment_type = data.fulfillment_type;
            data.tipo_abastecimiento = (data.tipo_abastecimiento ? data.tipo_abastecimiento : '');
            data.estado_do = (data.estado_do ? data.estado_do : '');
            data.recepcion = (data.recepcion ? data.recepcion.value.replace('T', ' ').substr(0, 19) : null);

            // FOLIOS SIN DESPACHO
            if (data.tipo_abastecimiento != null && data.tipo_abastecimiento != "" && (data.fulfillment_type == null || data.fulfillment_type == "")) {
                sindespachoArray.push(data.folio);
                sindespachoToArray.push(data);
            }

        }

        /* ITERACIÓN DATA RSFA */
        for (const data of rsfa) {

            data.recepcion = data.RECEPCION.value.replace('T', ' ').substr(0, 19);
            data.tipo_abastecimiento

            // FOLIOS SIN DESPACHO
            if (!sindespachoArray.includes(data.folio.toString())) {
                if (data.OMS_ABAST != null && data.OMS_ABAST != "") {

                    if (!sindespachoArray2.includes(data.folio)) {
                        sindespachoArray2.push(data.folio);
                        data.tipo_abastecimiento = data.OMS_ABAST;
                        sindespachoToArray.push(data);
                    }
                }
            }

        }

        /* RETORNO RESPUESTA */
        return sindespachoToArray

    } catch (error) {

        return { error }

    }

};

/**
 * Actualizar data en base de datos finanzas.
 * @param {[Json]} data: Arreglo de objeto que tiene la información de ventas.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.updateData = async (data) => {

    try {

        console.log('AGRUPANDO VENTAS');

        /** AGRUPAR FOLIOS POR CAMPO TIPO DESPACHO. */
        let groups = await GroupBy(data, 'tipo_abastecimiento');

        console.log('ACTUALIZANDO VENTAS');

        cont = 0;

        /** ACTUALIZAR DATA. */
        for (const sale of Object.keys(groups)) {

            let divide;
            let result;
            let divider = 10000;
            let query;

            if (groups[sale].length > divider) {
                divide = await QueryGenerator.divideScriptByGroup(groups[sale], divider);
                if (divide.length > 1) {
                    console.log(`Ventas ${sale} tiene ${divide.length} grupos a ejecutar con un total de ${groups[sale].length} ventas.`);
                    for (const dividerSale of divide) {
                        query = `UPDATE sales SET fulfillment_type = '${sale}', updatedAt = getDate() WHERE folio IN (${await QueryGenerator.objectToStringByIdentifier(dividerSale, "folio")}) AND (closeout_number IS NULL OR closeout_number = 0) AND origin = 'SVL'`;
                        result = await MySQL.updateSale(query);
                        cont++
                        console.log(`* ${sale}(${cont}): ${result} updated.`);

                        if (result.error)
                            throw result.error;
                    }
                }
            } else {
                query = `UPDATE sales SET fulfillment_type = '${sale}', updatedAt = getDate() WHERE folio IN (${await QueryGenerator.objectToStringByIdentifier(dividerSale, "folio")}) AND (closeout_number IS NULL OR closeout_number = 0) AND origin = 'SVL'`;
                result = await MySQL.updateSale(query);
                console.log(`${sale}: ${result} updated.`);
                cont++

                if (result.error)
                    throw result.error;
            }
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