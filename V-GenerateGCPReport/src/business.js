'use-strinct'
const gcp = require('../../libs/gcloud');
const async = require('async');
const XlsxPopulate = require('xlsx-populate');
const dateFormat = require('dateformat');
const email = require('../../libs/email');

/**
 * Obtiene datos de GCP, genera archivo y envía correo.
 * @param {Json} context: Json que contiene el contexto del azure function.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getDataGcp = async (context) => {

    try {

        /** BIGQUERYS */
        const sql_folios_recepcionados = `WITH maestro_ordenes AS (SELECT DISTINCT(folio) AS folio, RECEPCIONADA, FECHA_RECEPCION AS recepcion, MODALIDAD AS tipo_abastecimiento, ESTADO_DO AS estado_do, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0) SELECT DISTINCT(svl_finanzas.folio) AS folio, CASE svl_finanzas.fulfillment_type WHEN 'null' THEN null ELSE svl_finanzas.fulfillment_type END AS fulfillment_type, maestro_ordenes.tipo_abastecimiento, maestro_ordenes.estado_do, maestro_ordenes.recepcion FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas AS svl_finanzas LEFT JOIN maestro_ordenes ON maestro_ordenes.folio = svl_finanzas.folio`;
        const sql_categorias_dwh = `WITH db_mrk_productos AS( SELECT Distinct(ID_SKU) AS id_sku, ID_SUBCLASE FROM flb-rtl-dtl-marketplace-corp.datalake_retail.dbmark_lk_productos_inv WHERE CTIP_PRD = 'L' AND DATE(_PARTITIONTIME) > date_sub(current_date, interval 5 day)) SELECT db_mrk_productos.ID_SKU AS id_sku, db_mrk_productos.ID_SUBCLASE AS id_subclase, svl_finanzas.folio AS folio, svl_finanzas.fulfillment_type AS fulfillment_type FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas AS svl_finanzas JOIN db_mrk_productos ON svl_finanzas.sku = db_mrk_productos.ID_SKU WHERE svl_finanzas.category = 'null'`;
        const sql_folios_faltantes = `SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND RECEPCIONADA=1 UNION ALL SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND estado_svl IN ('delivered','sent','outForDelivery') AND modalidad_svl ='cross_docking_with_3pl' UNION ALL SELECT DISTINCT(folio), '' AS svl_abast, MODALIDAD AS OMS_ABAST, CASE WHEN fecha_recepcion IS NULL THEN DATE(fecha_compra) ELSE FECHA_RECEPCION END AS RECEPCION, ESTADO_DO, FECHA_COMPRA FROM flb-rtl-dtl-marketplace-corp.data_studio.maestro_ordenes WHERE DELIVERYSTART > "2020-01-01" AND liquidado=0 AND MODALIDAD IN ('FBF') AND FECHA_SALIDA_FBF IS NOT NULL`;

        const folios_recepcionados = { query: sql_folios_recepcionados, location: 'US', preserveNulls: true };
        const categorias_dwh = { query: sql_categorias_dwh, location: 'US', preserveNulls: true };
        const folios_faltantes = { query: sql_folios_faltantes, location: 'US', preserveNulls: true };

        /* VARIABLES PARA LA CONSTRUCCIÓN DEL EXCEL */
        let i = 2;
        let ii = 2;
        let iii = 2;
        let iiii = 2;
        let iiiii = 2;

        let A = "";
        let B = "";
        let C = "";
        let D = "";
        let E = "";
        let F = "";
        let G = "";
        let H = "";

        let pendienteArray = [];
        let sindespachoArray = [];
        let pendienteToArray = [];
        let sindespachoToArray = [];

        /* INICIO PROMESA PRINCIPAL CONEXION A GCP */
        context.log("EJECUTANDO BIGQUERYS");

        const [rsin] = await gcp.select(categorias_dwh);
        const [rs] = await gcp.select(folios_recepcionados);
        const [rsfa] = await gcp.select(folios_faltantes);
        
        context.log("CREANDO EXCEL");

        let workbook = await XlsxPopulate.fromBlankAsync();

        /* HEADERS EXCEL INICIO */
        const newSheet = workbook.addSheet('Total');
        newSheet.cell("A1").value("FOLIO");
        newSheet.cell("B1").value("SVL_ABAST");
        newSheet.cell("C1").value("OMS_ABAST");
        newSheet.cell("D1").value("ESTADO_DO");
        newSheet.cell("E1").value("RECEPCION");
        newSheet.cell("F1").value("RECEPCION_SAB");
        newSheet.cell("G1").value("RECEPCION_SRX");
        newSheet.cell("H1").value("RECEPCION_CXP");

        const newSheet2 = workbook.addSheet('Folios Pendientes');
        newSheet2.cell("A1").value("FOLIO");
        newSheet2.cell("B1").value("SVL_ABAST");
        newSheet2.cell("C1").value("OMS_ABAST");
        newSheet2.cell("D1").value("ESTADO_DO");
        newSheet2.cell("E1").value("RECEPCION");
        newSheet2.cell("F1").value("RECEPCION_SAB");
        newSheet2.cell("G1").value("RECEPCION_SRX");
        newSheet2.cell("H1").value("RECEPCION_CXP");

        const newSheet3 = workbook.addSheet('Folios Cancelados');
        newSheet3.cell("A1").value("FOLIO");
        newSheet3.cell("B1").value("SVL_ABAST");
        newSheet3.cell("C1").value("OMS_ABAST");
        newSheet3.cell("D1").value("ESTADO_DO");
        newSheet3.cell("E1").value("RECEPCION");
        newSheet3.cell("F1").value("RECEPCION_SAB");
        newSheet3.cell("G1").value("RECEPCION_SRX");
        newSheet3.cell("H1").value("RECEPCION_CXP");

        const newSheet4 = workbook.addSheet('Folios Sin Despacho');
        newSheet4.cell("A1").value("FOLIO");
        newSheet4.cell("B1").value("SVL_ABAST");
        newSheet4.cell("C1").value("OMS_ABAST");
        newSheet4.cell("D1").value("ESTADO_DO");
        newSheet4.cell("E1").value("RECEPCION");
        newSheet4.cell("F1").value("RECEPCION_SAB");
        newSheet4.cell("G1").value("RECEPCION_SRX");
        newSheet4.cell("H1").value("RECEPCION_CXP");

        const newSheet5 = workbook.addSheet('Sin Categorias');
        newSheet5.cell("A1").value("FOLIO");
        newSheet5.cell("B1").value("SKU");
        newSheet5.cell("C1").value("CATEGORY");
        /* HEADERS EXCEL FIN */

        /* INICIO RECORRIDO POR FOLIO */
        context.log("RECORRIENDO RS 1/3");

        async.eachSeries(rs, (data, callback) => {

            let folio = data.folio.c.join("");

            newSheet.cell("A" + i).value(folio);
            newSheet.cell("B" + i).value(data.fulfillment_type);
            newSheet.cell("C" + i).value(data.tipo_abastecimiento);
            newSheet.cell("D" + i).value(data.estado_do);

            if (data.recepcion) {
                newSheet.cell("E" + i).value(data.recepcion.value.replace('T', ' ').substr(0, 19));
                E = data.recepcion.value.replace('T', ' ').substr(0, 19);
            } else {
                E = null;
                newSheet.cell("E" + i).value("");
            }

            A = folio;
            B = data.fulfillment_type;

            if (data.estado_do) {
                D = data.estado_do;
            } else {
                D = "";
            }

            if (data.tipo_abastecimiento) {
                C = data.tipo_abastecimiento;
            } else {
                C = "";
            }

            //PENDIENTES
            if ((E != null && E != "") && C.toString() == "FBS") {
                pendienteArray.push(A);

                newSheet2.cell("A" + ii).value(A);
                newSheet2.cell("B" + ii).value(B);
                newSheet2.cell("C" + ii).value(C);
                newSheet2.cell("D" + ii).value(D);
                newSheet2.cell("E" + ii).value(E);
                newSheet2.cell("F" + ii).value(F);
                newSheet2.cell("G" + ii).value(G);
                newSheet2.cell("H" + ii).value(H);
                ii++;
            }

            //SIN DESPACHO
            if (C != null && C != "" && (B == null || B == "")) {
                sindespachoArray.push(A);

                newSheet4.cell("A" + iiii).value(A);
                newSheet4.cell("B" + iiii).value(B);
                newSheet4.cell("C" + iiii).value(C);
                newSheet4.cell("D" + iiii).value(D);
                newSheet4.cell("E" + iiii).value(E);
                newSheet4.cell("F" + iiii).value(F);
                newSheet4.cell("G" + iiii).value(G);
                newSheet4.cell("H" + iiii).value(H);
                iiii++;
            }

            //CANCELADOS
            if ( (D.toString() == "Cancelled" && E == null || E == "") || (C == "VEV" || C == "NOVIOS" || C == "TIENDA") ) {
                newSheet3.cell("A" + iii).value(A);
                newSheet3.cell("B" + iii).value(B);
                newSheet3.cell("C" + iii).value(C);
                newSheet3.cell("D" + iii).value(D);
                newSheet3.cell("E" + iii).value(E);
                newSheet3.cell("F" + iii).value(F);
                newSheet3.cell("G" + iii).value(G);
                newSheet3.cell("H" + iii).value(H);
                iii++;
            }

            i++;
            callback();
        }, (err, results) => {
            
            context.log("RECORRIENDO RSFA 2/3");

            async.eachSeries(rsfa, (data, callback) => {

                folio = data.folio;
                recepcion = data.RECEPCION.value.replace('T', ' ').substr(0, 19);

                //PENDIENTES
                if (!pendienteArray.includes(folio.toString())) {

                    if (data.OMS_ABAST.toString() == "FBS") {

                        if (!pendienteToArray.includes(folio)) {
                            pendienteToArray.push(folio);
                            newSheet2.cell("A" + ii).value(folio);
                            newSheet2.cell("B" + ii).value(data.svl_abast);
                            newSheet2.cell("C" + ii).value(data.OMS_ABAST);
                            newSheet2.cell("D" + ii).value(data.ESTADO_DO);
                            newSheet2.cell("E" + ii).value(recepcion);
                            ii++;
                        }
                    }
                }

                //SIN DESPACHO
                if (!sindespachoArray.includes(folio.toString())) {
                    if (data.OMS_ABAST != null && data.OMS_ABAST != "") {

                        if (!sindespachoToArray.includes(folio)) {
                            sindespachoToArray.push(folio);
                            newSheet4.cell("A" + iiii).value(folio);
                            newSheet4.cell("B" + iiii).value(data.svl_abast);
                            newSheet4.cell("C" + iiii).value(data.OMS_ABAST);
                            newSheet4.cell("D" + iiii).value(data.ESTADO_DO);
                            newSheet4.cell("E" + iiii).value(data.RECEPCION);
                            iiii++;
                        }
                    }
                }

                callback();
            }, (err, results) => {

                context.log("RECORRIENDO RSIN 3/3");

                async.eachSeries(rsin, (data, callback) => {
                    let folio = data.folio.c.join("");
                    let sku = data.id_sku.c.join("");
                    //SIN CATEGORIA
                    newSheet5.cell("A" + iiiii).value(folio);
                    newSheet5.cell("B" + iiiii).value(sku);
                    newSheet5.cell("C" + iiiii).value(data.id_subclase);
                    iiiii++;

                    callback();
                }, async (err, results) => {

                        /** ELIMINAR HOJA */
                        workbook.deleteSheet("Sheet1");

                        context.log("GENERANDO REPORTE EN BASE64.");

                        await workbook.outputAsync().
                            then(async (data) => {
                                const csv = new Buffer.from(data).toString('base64');
                                const buf = new Buffer.from(csv, "base64");

                                /**
                                 * Nicolas Améstica Vidal
                                 * 2021-11-23 17:38 hrs.
                                 * Enviar erchivo por email.
                                */

                                context.log("ENVIANDO REPORTE GCP POR CORREO.");

                                /** CONFIGURAR PARÁMETROS DEL EMAIL. */
                                let configEmail = {
                                    from: process.env.GMAIL_AUTH_USER,
                                    to: process.env.GMAIL_MAIL_TO,
                                    cc: process.env.GMAIL_MAIL_CC,
                                    bcc: process.env.GMAIL_MAIL_BCC,
                                    subject: `Archivo GCP ${dateFormat(new Date(), "yyyy-mm-dd")}`,
                                    template: 'settlement',
                                    attachments: {
                                        filename: `GCP_PorLiquidar_${dateFormat(new Date(), "yymmddHMMss")}.xlsx`,
                                        content: buf
                                    },
                                    context: {
                                        dear: 'Estimados,',
                                        message: 'Se ha generado resporte GCPPorLiquidar:',
                                        greeting: 'Atte.',
                                        sender: process.env.NOMBRE_INFORMA
                                    }
                                }

                                /** CONFIGURAR PARÁMETROS DE HBS. */
                                const optionsHBS = {
                                    partialsDir: 'shared/views/email',
                                    viewPath: '../shared/views/email',
                                }

                                /** LLAMADA A MÉTODO QUE ENVÍA EMAIL ENVIÁNDOLE DOS PARÁMETROS. */
                                let result = await email.sendFromGmail(configEmail, optionsHBS);
                                if (result.errno) {
                                    context.log('No se pudo enviar el email.');
                                    throw error;
                                }
                        })
                });

            });

        });

        /** RETORNO RESPUESTA */
        return "OK"

    } catch (error) {

        /** RETORNO EXCEPCIÓN */
        return { error }

    }

};