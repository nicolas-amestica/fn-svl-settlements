'use-strinct'
const gcp = require('../../libs/gcloud');
const async = require('async');
const XlsxPopulate = require('xlsx-populate');
const dateFormat = require('dateformat');
const email = require('../../libs/email');

/**
 * Obtiene datos de GCP, genera archivo y envía emails.
 * @param {Json} context: Json que contiene el contexto del azure function.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getDataGcp = async (context) => {

    try {

        /* BIGQUERYS */
        const sql_folios_recepcionados = `WITH maestro_ordenes AS( SELECT Distinct(folio) as folio, RECEPCIONADA, FECHA_RECEPCION as recepcion, MODALIDAD as tipo_abastecimiento, ESTADO_DO as estado_do, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 ) SELECT Distinct(svl_finanzas.folio) as folio, CASE svl_finanzas.fulfillment_type WHEN 'null' THEN null ELSE svl_finanzas.fulfillment_type END AS fulfillment_type, maestro_ordenes.tipo_abastecimiento, maestro_ordenes.estado_do, maestro_ordenes.recepcion FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas as svl_finanzas LEFT JOIN maestro_ordenes ON maestro_ordenes.folio = svl_finanzas.folio`;
        const sql_categorias_dwh = `WITH db_mrk_productos AS( SELECT Distinct(ID_SKU) AS id_sku, ID_SUBCLASE FROM flb-rtl-dtl-marketplace-corp.datalake_retail.dbmark_lk_productos_inv WHERE CTIP_PRD = 'L' AND DATE(_PARTITIONTIME) > date_sub(current_date, interval 5 day) ) SELECT db_mrk_productos.ID_SKU AS id_sku, db_mrk_productos.ID_SUBCLASE AS id_subclase, svl_finanzas.folio AS folio, svl_finanzas.fulfillment_type AS fulfillment_type FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas AS svl_finanzas JOIN db_mrk_productos ON svl_finanzas.sku = db_mrk_productos.ID_SKU WHERE svl_finanzas.category = 'null'`;
        const sql_folios_faltantes = `SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND RECEPCIONADA=1 UNION ALL SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND estado_svl IN ('delivered','sent','outForDelivery') AND modalidad_svl ='cross_docking_with_3pl' UNION ALL SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND MODALIDAD IN ('FBF') AND FECHA_SALIDA_FBF IS NOT NULL`;

        const folios_recepcionados = { query: sql_folios_recepcionados, location: 'US' };
        const categorias_dwh = { query: sql_categorias_dwh, location: 'US' };
        const folios_faltantes = { query: sql_folios_faltantes, location: 'US' };

        let pendienteArray = [];
        let pendienteArray2 = [];
        let pendienteToArray = [];
        let sindespachoArray = [];
        let sindespachoArray2 = [];
        let sindespachoToArray = [];
        let sinCategoriaToArray = [];
        let canceladosToArray = [];

        /* EJECUTAR BIGQUERYS */
        console.log("EJECUTANDO BIGQUERY");

        const [rsin] = await gcp.select(categorias_dwh);
        const [rs] = await gcp.select(folios_recepcionados);
        const [rsfa] = await gcp.select(folios_faltantes);

        /* INICIO RECORRIDO POR FOLIO */
        console.log("INICIO LECTURA DE DATA OBTENIDA");

        /* ITERACIÓN DATA RS */
        for (const data of rs) {

            data.folio = data.folio.c.join("");
            data.fulfillment_type = data.fulfillment_type;
            data.tipo_abastecimiento = (data.tipo_abastecimiento ? data.tipo_abastecimiento : '');
            data.estado_do = (data.estado_do ? data.estado_do : '');
            data.recepcion = (data.recepcion ? data.recepcion.value.replace('T', ' ').substr(0, 19) : null);

            // FOLIOS PENDIENTES
            if ((data.recepcion != null && data.recepcion != "") && data.tipo_abastecimiento.toString() == "FBS") {
                pendienteArray.push(data.folio)
                pendienteToArray.push(data);
            }

            // FOLIOS SIN DESPACHO
            if (data.tipo_abastecimiento != null && data.tipo_abastecimiento != "" && (data.fulfillment_type == null || data.fulfillment_type == "")) {
                sindespachoArray.push(data.folio);
                sindespachoToArray.push(data);
            }

            // FOLIOS CANCELADOS
            if ((data.estado_do.toString() == "Cancelled" && data.recepcion == null || data.recepcion == "") || (data.tipo_abastecimiento == "VEV" || data.tipo_abastecimiento == "NOVIOS" || data.tipo_abastecimiento == "TIENDA"))
                canceladosToArray.push(data)

        }

        /* ITERACIÓN DATA RSFA */
        for (const data of rsfa) {

            data.recepcion = data.RECEPCION.value.replace('T', ' ').substr(0, 19);

            if (!pendienteArray.includes(data.folio.toString())) {
                if (data.OMS_ABAST.toString() == "FBS") {
                    if (!pendienteArray2.includes(data.folio)) {
                        pendienteArray2.push(data.folio);
                        pendienteToArray.push(data)
                    }
                }
            }

            // FOLIOS SIN DESPACHO
            if (!sindespachoArray.includes(data.folio.toString())) {
                if (data.OMS_ABAST != null && data.OMS_ABAST != "") {

                    if (!sindespachoArray2.includes(data.folio)) {
                        sindespachoArray2.push(data.folio);
                        sindespachoToArray.push(data);
                    }
                }
            }

        }

        /* ITERACIÓN DATA RSIN */
        for (const data of rsin) {

            // FOLIOS SIN CATEGORIA
            data.folio = data.folio.c.join("");
            data.sku = data.id_sku.c.join("");
            sinCategoriaToArray.push(data);

        }

        /* RETORNO RESPUESTA */
        return [
            {total_pendientes: pendienteToArray.length},
            {total_categoria: sinCategoriaToArray.length},
            {total_sinDespacho: sindespachoToArray.length},
            {total_cancelados: canceladosToArray.length}
        ]

    } catch (error) {

        console.log(error);
        return { error }

    }

};