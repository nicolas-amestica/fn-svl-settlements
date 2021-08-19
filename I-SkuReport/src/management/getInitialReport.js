'use strict';
const fs = require('fs');
const sql = require("mssql");
const mySQL = require('../../../common/mySQL');
const fileManager = require('../../../common/fileManager');
const dateFormat = require('dateformat');
const blobStorage = require('../../../common/blobStorage');
const email = require('../../../common/email');
const path = require("path");

/**
 * Obtiene los folios desde la base de datos de finanzas.
 * @return {[Json]}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataFinance = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS mySQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configFinanzas);

        /** QUERY. */
        const queryPendientes = `
            SELECT
                folio AS FOLIO,
                CASE fulfillment_type
                    WHEN 'null'
                    THEN null
                    ELSE fulfillment_type
                END AS FULFILLMENT_TYPE
            FROM
                sales
            WHERE
                origin = 'SVL'
                AND folio NOT IN ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11')
                AND quantity > 0
                AND (closeout_number = 0 OR closeout_number IS NULL)
        `;

        /** EJECUCIÓN DE QUERY. */
        const dataPendientes = await pool.request().query(queryPendientes);
        if (!dataPendientes)
            return { status: 400, body: { error: 'No se pudo consultar los datos de finanzas.' }, error: {} };

        const querySinCategoria = `
            SELECT
                folio AS FOLIO,
                sku AS SKU,
                category AS CATEGORY
            FROM
                sales
            WHERE
                origin = 'SVL'
                AND folio NOT IN ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11')
                AND quantity > 0
                AND (closeout_number = 0 OR closeout_number IS NULL)
                AND category IS NULL
        `;

        /** EJECUCIÓN DE QUERY. */
        const dataSinCategoria = await pool.request().query(querySinCategoria);
        if (!dataSinCategoria)
            return { status: 400, body: { error: 'No se pudo consultar los datos de finanzas.' }, error: {} };

        /** RETORNO RESPUESTA. */
        return [
                {
                    name: `${process.env.N_PENDIENTES_LIQUIDAR_FILE}_${dateFormat(new Date(), "yymmddHMM")}`,
                    data: dataPendientes.recordset
                }, {
                    name: `${process.env.N_SIN_CATEGORIA_FILE}_${dateFormat(new Date(), "yymmddHMM")}`,
                    data: dataSinCategoria.recordset
                }
            ]

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
 * @param {String} urlFile: URL del archivo subido a Blob Storage.
 * @return {Json}: Respuesta JSON de la función que retorna el resultado del envío del email, incluye respuesta satisfactoria o fallo.
 */
 module.exports.sendEmail = async (urlFile) => {

    try {

        /** VALIDA QUE EL PARÁMETRO DE ENTRADA TENGA CONTENIDO. */
        if (urlFile.length == 0)
            return { status: 201, body: { message: 'No se pudo enviar el email.', detalle: 'No se ha podido obtener la url del archivo.' }};

        /** CONFIGURAR PARÁMETROS DEL EMAIL. */
        const configEmail = {
            from: process.env.GMAIL_AUTH_USER,
            to: process.env.SENDGRID_MAIL_TO,
            cc: process.env.SENDGRID_MAIL_CC,
            bcc: process.env.SENDGRID_MAIL_BCC,
            subject: `PROCESO LIQUIDACIÓN ${dateFormat(new Date(), "yyyy-mm-dd")}`,
            template: 'settlement',
            context: {
                dear: 'Estimados,',
                message: 'Se adjunta enlace con primer informe denominado InformeSKU de la liquidación:',
                url: urlFile,
                nameURL: 'INFORME_SKU',
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
 * Eliminar el archivo csv ubicado en carpeta temporal.
 * @param {String} filePath: Ruta del archivo que está en carpeta temporal.
 * @return {[Json]}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
 module.exports.deleteFile = async (filePath) => {

    try {

        /** ELIMINAR ARCHIVO DE CARPETA TEMPORALES. */
        let result = await fileManager.deleteFile(filePath);
        if (result.error)
            return { status: 201, body: { error: 'Imposible eliminar archivo.' }, error: {} };

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo seguir validando los folios.', detalle: error }, error: {} };

    }

}