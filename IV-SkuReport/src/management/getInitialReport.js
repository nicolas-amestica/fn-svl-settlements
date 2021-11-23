'use strict';
const fs = require('fs');
const fileManager = require('../../../libs/fileManager');
const dateFormat = require('dateformat');
const blobStorage = require('../../../libs/blobStorage');
const email = require('../../../libs/email');
const gcp = require('../../../libs/gcloud');
const path = require("path");

/**
 * Obtiene los folios desde la base de datos de GCP mediante bigquery.
 * @return {[Json]}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataGcp = async () => {

    try {

        /** QUERYS. */
        const queryPending = `SELECT DISTINCT(CAST(folio AS STRING)) AS FOLIO, CASE fulfillment_type WHEN 'null' THEN null ELSE fulfillment_type END AS FULLFILMENT_TYPE FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas`;
        const queryCategory = `SELECT CAST(folio AS STRING) AS FOLIO, CAST(sku AS STRING) AS SKU FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas WHERE category = 'null' OR category IS NULL AND sku is not null AND sku != 0`;

        const pending_job = {
            query: queryPending,
            location: 'US',
            preserveNulls: true
        };

        const category_job = {
            query: queryCategory,
            location: 'US',
            preserveNulls: true
        };

        const [pending] = await gcp.select(pending_job);
        const [category] = await gcp.select(category_job);

        /** RETORNO RESPUESTA. */
        return [{
            name: `${process.env.N_PENDIENTES_LIQUIDAR_FILE}_${dateFormat(new Date(), "yymmddHMM")}`,
            data: pending
        }, {
            name: `${process.env.N_SIN_CATEGORIA_FILE}_${dateFormat(new Date(), "yymmddHMM")}`,
            data: category
        }]

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo obtener la información de la base de datos.', detalle: error }, error: {} };

    }

};

/**
 * Exportar los datos de finanzas a un archivo csv. Este es almacenado en la carpeta temporal tmp ubicada en la raíz del proyecto.
 * @param {[Json]} data: Arreglo de objetos que contiene data, name y header.
 * @param {String} fileName: Nombre del archivo a generar.
 * @return {String}: Respuesta String que indica la ruta y nombre del archivo que se generó, si falla envía una expceción.
 */
module.exports.exportToXlsxFromObject = async (data, fileName) => {

    try {

        /** VALIDAR QUE LA VARIABLE DAT TENGA CONTENIDO. */
        if (data.length == 0)
            return { status: 201, body: { message: 'No existen datos a exportar.' }, warn: {} };

        /** CREAR CARPETA TEMPORAL. */
        const dir = './tmp';
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** CREAR NOMBRE DEL ARCHIVO A BASE DE FECHA NUMÉRICA. */
        const fullFileName = `${fileName}_${dateFormat(new Date(), "yyyymmddHMM")}`;

        /** ENVIAR A EXPORTAR DATA A UN ARCHIVO XLSX. */
        const resultado = await fileManager.exportToXlsxFromObject(data, fullFileName);
        if (resultado.error)
            return { status: 400, body: { error: 'No se ha podido generar archivo xlsx.', detalle: resultado.error }, error: {} };

        /** RETORNO RESPUESTA. */
        return resultado;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo exportar los datos.', detalle: error }, error: {} };

    }

}

/**
 * Subir archivo a Azure Blob Storage.
 * @param {String} fullFileName: Nombre del archivo a subir.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del upload del archivo (incluye URL), incluye respuesta satisfactoria o fallo.
 */
module.exports.uploadFileFromPath = async (fullFileName) => {

    try {

        /** DEFINIR NOMBRE DEL ARCHIVO A GUARDAR. */
        let fileName = path.basename(fullFileName);

        /** ENVIAR A SUBIR ARCHIVO AL BLOB STORAGE. */
        let result = await blobStorage.uploadFileFromLocal('reports', fileName, `${process.env.TMP_FOLDER}${fileName}`);
        if (result.error)
            return { status: 400, body: { error: result.error }, error: {} };

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo subir el archivo.', detalle: error }, error: {} };

    }

}

/**
 * Función que envía email según los parámetros que se configuren.
 * @param {[Json]} urlFiles: Arreglo de objeto con los datos (incluyendo la url) subidos al Blob Storage.
 * @return {Json}: Respuesta JSON de la función que retorna el resultado del envío del email, incluye respuesta satisfactoria o fallo.
 */
module.exports.sendEmail = async (urlFiles) => {

    try {

        let urlTag = [];

        /** VALIDA QUE EL PARÁMETRO DE ENTRADA TENGA CONTENIDO. */
        if (Object.keys(urlFiles).length == 0)
            return { status: 401, body: { message: 'No se pudo enviar el email.', detalle: 'No se ha podido obtener la url del archivo.' }, error: {} };

        /** ITERAR ARREGLO DE OBJETO AGREGANDO URL Y NOMBRE A LA VARIABLE URLTAG. */
        for (const file of Object.keys(urlFiles)) {
            urlTag.push({url: urlFiles[file].url, name: (path.basename(urlFiles[file].url, '.xlsx')).toUpperCase() })
        }

        /** CONFIGURAR PARÁMETROS DEL EMAIL. */
        let configEmail = {
            from: process.env.GMAIL_AUTH_USER,
            to: process.env.SENDGRID_MAIL_TO,
            cc: process.env.SENDGRID_MAIL_CC,
            bcc: process.env.SENDGRID_MAIL_BCC,
            subject: `PROCESO LIQUIDACIÓN ${dateFormat(new Date(), "yyyy-mm-dd")}`,
            template: 'settlement',
            context: {
                dear: 'Estimados,',
                message: 'Se inicia proceso liquidación adjuntanto el informe inicial denominado InformeSKU:',
                urlTag: urlTag,
                greeting: 'Atte.',
                sender: 'Nicolás Améstica Vidal'
            }
        }

        /** CONFIGURAR PARÁMETROS DE HBS. */
        const optionsHBS = {
            partialsDir: 'shared/views/email',
            viewPath: '../shared/views/email'
        }

        /** LLAMADA A MÉTODO QUE ENVÍA EMAIL ENVIÁNDOLE DOS PARÁMETROS. */
        let result = await email.sendFromGmail(configEmail, optionsHBS);
        if (result.errno)
            return { status: 201, body: { message: 'No se pudo enviar el email.', detalle: result }};

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo enviar el mail.', detalle: error }, error: {} };

    }

}

/**
 * Eliminar directorio de carpeta temporal.
 * @return {boolean}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.deleteFile = async () => {

    try {

        /** ELIMINAR CARPETA TEMPORALES. */
        fs.rmdirSync(process.env.TMP_FOLDER, { recursive: true });

        return true;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: `No se pudo eliminar el directorio ${process.env.TMP_FOLDER}.`, detalle: error }, error: {} };

    }

}