'use strict';
const fs = require('fs');
const FileManager = require('../../libs/fileManager');
const DateFormat = require('dateformat');
const BlobStorage = require('../../libs/blobStorage');
const Email = require('../../libs/email');
const GCP = require('../../libs/gcloud');
const path = require("path");

/**
 * Obtiene los folios desde la base de datos de GCP mediante bigquery.
 * @return {[Json]}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataGcp = async (context) => {

    try {

        context.log('OBTENIENDO INFORMACIÓN');

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

        const [pending] = await GCP.select(pending_job);
        const [category] = await GCP.select(category_job);

        /** RETORNO RESPUESTA. */
        return [{
            name: `${process.env.N_PENDIENTES_LIQUIDAR_FILE}_${DateFormat(new Date(), "yymmddHMM")}`,
            data: pending
        }, {
            name: `${process.env.N_SIN_CATEGORIA_FILE}_${DateFormat(new Date(), "yymmddHMM")}`,
            data: category
        }]

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Exportar los datos de finanzas a un archivo csv. Este es almacenado en la carpeta temporal tmp ubicada en la raíz del proyecto.
 * @param {[Json]} data: Arreglo de objetos que contiene data, name y header.
 * @param {String} fileName: Nombre del archivo a generar.
 * @return {String}: Respuesta String que indica la ruta y nombre del archivo que se generó, si falla envía una expceción.
 */
module.exports.exportToXlsxFromObject = async (context, data, fileName) => {

    try {

        context.log('EXPORTANDO DATA A XLSX');

        /** VALIDAR QUE LA VARIABLE DAT TENGA CONTENIDO. */
        if (data.length == 0)
            throw 'No existen datos a exportar.';

        /** CREAR CARPETA TEMPORAL. */
        const dir = `./${process.env.TMP_FOLDER}`;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** CREAR NOMBRE DEL ARCHIVO A BASE DE FECHA NUMÉRICA. */
        const fullFileName = `${fileName}_${DateFormat(new Date(), "yyyymmddHMM")}`;

        /** ENVIAR A EXPORTAR DATA A UN ARCHIVO XLSX. */
        const result = await FileManager.exportToXlsxFromObject(data, fullFileName);
        if (result.error)
            throw result.error

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

}

/**
 * Subir archivo a Azure Blob Storage.
 * @param {String} fullFileName: Nombre del archivo a subir.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del upload del archivo (incluye URL), incluye respuesta satisfactoria o fallo.
 */
module.exports.uploadFileFromPath = async (context, fullFileName) => {

    try {

        context.log('SUBIENDO ARCHIVO A BLOB STORAGE');

        /** DEFINIR NOMBRE DEL ARCHIVO A GUARDAR. */
        let fileName = path.basename(fullFileName);

        /** ENVIAR A SUBIR ARCHIVO AL BLOB STORAGE. */
        let result = await BlobStorage.uploadFileFromLocal(process.env.AZURE_BLOBSTORAGE_NAME, fileName, `${process.env.TMP_FOLDER}${fileName}`);
        if (result.error)
            throw result.error

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

}

/**
 * Función que envía correo según los parámetros que se configuren.
 * @param {Json} file: Json que contiene la url del archivo local y el nombre del archivo.
 * @return {Json}: Respuesta JSON de la función que retorna el resultado del envío del email, incluye respuesta satisfactoria o fallo.
 */
module.exports.sendEmail = async (context, file) => {

    try {

        context.log('ENVIANDO ARCHIVO POR CORREO');

        if (!file.url)
            throw 'No se ha podido obtener la url del archivo.';

        let from = process.env.SENDGRID_MAIL_FROM;
        let to = process.env.SENDGRID_MAIL_TO;
        let cc = process.env.SENDGRID_MAIL_CC;
        let bcc = process.env.SENDGRID_MAIL_BCC;

        // /** CONFIGURAR PARÁMETROS DEL EMAIL. */
        // const message = {
        //     from: from,
        //     to: to.split(','),
        //     // cc: cc.split(','),
        //     // bcc: bc.split(','),
        //     subject: `Informe Preliquidación ${dateFormat(new Date(), "yyyy-mm-dd")}`,
        //     html: `Estimados,<br><br>
        //     En el siguiente enlace podrá descargar el informe preliquidación<br><br>
        //     <a href='${file.url}'>DESCARGAR</a><br><br>
        //     Atte.<br>
        //     ${process.env.NOMBRE_INFORMA}`,
        // }

        // /** LLAMADA A MÉTODO QUE ENVÍA EMAIL ENVIÁNDOLE DOS PARÁMETROS. */
        // let result = await Email.sendFromSendgrid(message);

         /** CONFIGURAR PARÁMETROS DEL EMAIL. */
         let configEmail = {
            from: from,
            to: to.split(','),
            // cc: process.env.SENDGRID_MAIL_CC,
            // bcc: process.env.SENDGRID_MAIL_BCC,
            subject: `Informe SKU ${DateFormat(new Date(), "yyyy-mm-dd")}`,
            template: 'settlement',
            context: {
                dear: 'Estimados(as),',
                message: 'En el siguiente enlace podrá descargar el informe SKU:',
                urlTag: { url: file.url, name: (path.basename(file.url, '.xlsx')) },
                greeting: 'Atte.',
                sender: `${process.env.NOMBRE_INFORMA}`
            }
        }

        /** CONFIGURAR PARÁMETROS DE HBS. */
        const optionsHBS = {
            partialsDir: 'shared/views/email',
            viewPath: '../shared/views/email'
        }

        /** LLAMADA A MÉTODO QUE ENVÍA EMAIL ENVIÁNDOLE DOS PARÁMETROS. */
        let result = await Email.sendFromGmail(configEmail, optionsHBS);
        if (result.error)
            throw result.error;

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

}

/**
 * Eliminar directorio de carpeta temporal.
 * @return {boolean}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.deleteFolder = async (context) => {

    try {

        context.log('ELIMINANDO DIRECTORIO TEMPORAL');

        /** ELIMINAR CARPETA TEMPORALES. */
        fs.rmdirSync(process.env.TMP_FOLDER, { recursive: true });

        /** RETORNO RESPUESTA. */
        return true;

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error }

    }

}