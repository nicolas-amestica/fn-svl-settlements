'use-strinct'
const BlobStorage = require('../../libs/blobStorage');
const dateFormat = require('dateformat');
const Email = require('../../libs/email');
const MySQL = require('../../libs/mySQL');
const FileManager = require('../../libs/fileManager');
const fs = require('fs');
const path = require("path");

/**
 * Obtiene datos de finanzas.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getData = async () => {

    try {

        console.log('OBTENIENDO INFORMACIÓN');

        /** QUERY */
        let query = `SELECT * FROM [sales] AS [sale] WHERE [sale].[origin] = N'SVL' AND [sale].[quantity] > 0 AND [sale].[folio] NOT IN (N'0', N'-1', N'-2', N'-3', N'-4', N'-6', N'-7', N'-8', N'-9', N'-10', N'-11') AND [sale].[category] IS NOT NULL AND ([sale].[fulfillment_type] = N'FBF' OR ([sale].[fulfillment_type] = N'FBS' AND ([sale].[reception_time] IS NOT NULL AND [sale].[reception_time] < getdate()))) AND ([sale].[closeout_number] IS NULL OR [sale].[closeout_number] = 0) AND [sale].[date_of_sale] <= getdate() AND ([sale].[commission_value] IS NOT NULL AND [sale].[commission_value] != 0)`;

        /** EJECUTAR QUERY. */
        let data = await MySQL.getDataFinances(query);
        if (data.error)
            throw data.error

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /** RETORNO RESPUESTA. */
        return [{
            name: 'InformePreliquidacion',
            data,
        }]

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error }

    }

};

/**
 * Genera informe preliquidación y envía emails.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.exportToXlsx = async (data) => {

    try {

        console.log('GENERANDO INFORME');

        /** VALIDAR QUE LA VARIABLE DATA TENGA CONTENIDO. */
        if (data.length == 0)
            throw 'No existen datos a exportar.';

        /** CREAR CARPETA TEMPORAL. */
        const dir = `./${process.env.TMP_FOLDER}`;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** CREAR NOMBRE DEL ARCHIVO A BASE DE FECHA NUMÉRICA. */
        const fileName = `InformePreliquidacion_${dateFormat(new Date(), "yyyymmddHMM")}`;

        /** GENERAR ARCHIVO XLSX. */
        const xlsx = await FileManager.exportToXlsxFromObject(data, fileName);
        if (xlsx.error)
            throw 'No se ha podido generar archivo xlsx.';

        /** RETORNO RESPUESTA. */
        return xlsx

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error }

    }

};

/**
 * Subir archivo a Azure Blob Storage.
 * @param {String} fullFileName: Nombre del archivo a subir.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del upload del archivo (incluye URL), incluye respuesta satisfactoria o fallo.
 */
module.exports.uploadFileFromPath = async (fullFileName) => {

    try {

        console.log('SUBIENDO ARCHIVO A BLOB STORAGE');

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
module.exports.sendEmail = async (file) => {

    try {

        console.log('ENVIANDO ARCHIVO POR CORREO');

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
            subject: `Informe Preliquidación ${dateFormat(new Date(), "yyyy-mm-dd")}`,
            template: 'settlement',
            context: {
                dear: 'Estimados(as),',
                message: 'En el siguiente enlace podrá descargar el informe preliquidación:',
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
            throw result;

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
module.exports.deleteFile = async () => {

    try {

        console.log('ELIMINANDO DIRECTORIO TEMPORAL');

        /** ELIMINAR CARPETA TEMPORALES. */
        fs.rmdirSync(process.env.TMP_FOLDER, { recursive: true });

        /** RETORNO RESPUESTA. */
        return true;

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error }

    }

}