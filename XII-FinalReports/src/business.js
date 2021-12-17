'use strict';
const fs = require('fs');
const MySQL = require('../../libs/mySQL');
const FileManager = require('../../libs/fileManager');
const DateFormat = require('DateFormat');
const BlobStorage = require('../../libs/blobStorage');
const Email = require('../../libs/email');
const path = require('path');

/**
 * Obtiene los folios pendientes de finanzas.
 * @return {Json}: Retorna data y nombre en un objeto, si falla retorna excepción.
 */
module.exports.getDataPending = async (context) => {

    try {

        context.log('OBTENIENDO INFORMACIÓN DE FOLIOS PENDIENTES');

        /** QUERY. */
        let query = `SELECT sl.id, sl.closeout_number, sl.term, sl.rut, sl.quantity, sl.sku, REPLACE(REPLACE(REPLACE(TRIM(REPLACE(sk.seller_sku, '''', '')), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS seller_sku, REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sk.product_name, '''', ''), ';', ' '), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS description, sl.percentage, sl.gross_sale_income, sl.IVA_gross_income, sl.net_sale_income, sl.commission_value, sl.net_sale_to_bill, sl.IVA_to_bill, sl.gross_income_to_bill, sl.folio, CONVERT(VARCHAR, sl.createdAt, 120) AS createdAt, CONVERT(VARCHAR, sl.updatedAt, 120) AS updatedAt, CONVERT(VARCHAR, sl.date_of_sale, 120) AS date_of_sale, CONVERT(VARCHAR, sl.reception_time, 120) AS reception_time, sl.category, sl.origin, sl.fulfillment_type, sl.purchase_order, sl.sales_commission, sl.discount_value, sl.discounted_commission, sl.total_commission, REPLACE(REPLACE(REPLACE(REPLACE(sl.ticket_number, ';', ' '), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS ticket_number, sl.international, sl.business, sl.country FROM sales sl LEFT JOIN skus sk ON sl.sku = sk.sku WHERE sl.origin = 'SVL' AND sl.folio NOT IN ('0','-1','-2','-3','-4','-5','-6','-7','-8','-9','-10','-11') AND sl.quantity > 0 AND (sl.closeout_number = 0 OR sl.closeout_number IS NULL) AND sl.international = 0`;

        /** EJECUCIÓN DE QUERY. */
        let data = await MySQL.getDataFinances(query);
        if (data.error)
            return data.error;

        /** CERRAR CONEXIÓN A SQL. */
        let con = await MySQL.closeConnection();
        if (con.error)
            throw con.error

        /** RETORNO RESPUESTA. */
        return data

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Obtiene las ventas liquidadas de finanzas.
 * @return {Json}: Retorna data y nombre en un objeto, si falla retorna excepción.
 */
module.exports.getDataSales = async (context) => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS mySQL. */
        context.log('OBTENIENDO INFORMACIÓN DE VENTAS LIQUIDADAS');

        /** QUERY. */
        let query = `
            SELECT
                sal.id AS id,
                sal.closeout_number AS closeout_number,
                sal.term,
                sal.rut,
                REPLACE(REPLACE(REPLACE(TRIM(REPLACE(TRIM(s.seller_sku), '''', '')), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS seller_sku,
                sal.quantity,
                REPLACE(REPLACE(REPLACE(sal.sku, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS sku,
                REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sal.description, '''', ''), ';', ' '), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS description,
                sal.percentage AS percentage,
                sal.gross_sale_income AS gross_sale_income,
                sal.IVA_gross_income AS IVA_gross_income,
                sal.net_sale_income AS net_sale_income,
                sal.commission_value AS commission_value,
                sal.net_sale_to_bill AS net_sale_to_bill,
                sal.IVA_to_bill AS IVA_to_bill,
                sal.gross_income_to_bill AS gross_income_to_bill,
                sal.folio AS folio,
                CONVERT(VARCHAR, sal.createdAt, 120) AS createdAt,
                CONVERT(VARCHAR, sal.updatedAt, 120) AS updatedAt,
                CONVERT(VARCHAR, sal.date_of_sale, 120) AS date_of_sale,
                CONVERT(VARCHAR, sal.reception_time, 120) AS reception_time,
                sal.category AS category,
                sal.origin AS origin,
                sal.fulfillment_type AS fulfillment_type,
                sal.purchase_order AS purchase_order,
                sal.sales_commission AS sales_commission,
                sal.discount_value AS discount_value,
                sal.discounted_commission AS discounted_commission,
                sal.total_commission AS total_commission,
                REPLACE(REPLACE(REPLACE(REPLACE(sal.ticket_number, ';', ' '), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS ticket_number,
                sal.depth AS depth,
                sal.width AS width,
                sal.height AS height,
                sal.stock_management AS stock_management,
                sal.storage AS storage,
                sal.crossdock AS crossdock,
                sal.logistic_train AS logistic_train,
                sal.mks_ctipo AS mks_ctipo,
                sal.tienda_key AS tienda_key,
                sal.tienda_usu AS tienda_usu,
                sal.local_vent_key AS local_vent_key,
                sal.local_vent_usu AS local_vent_usu,
                sal.local_desp_key AS local_desp_key,
                sal.local_desp_usu AS local_desp_usu,
                sal.local_inter_key AS local_inter_key,
                sal.local_inter_usu AS local_inter_usu,
                sal.descto_item AS descto_item,
                sal.descto_prorrat AS descto_prorrat,
                sal.dispatch_type AS dispatch_type,
                sal.price_svl AS price_svl,
                sal.international AS international,
                sal.business AS business,
                sal.country AS country,
                clo.id AS id_clo,
                clo.number AS number_clo,
                clo.term AS term_clo,
                clo.rut AS rut_clo,
                clo.name AS name_clo,
                CONVERT(VARCHAR, clo.createdAt, 120) AS createdAt_clo,
                CONVERT(VARCHAR, clo.updatedAt, 120) AS updatedAt_clo,
                clo.gross_income_to_bill AS gross_income_to_bill_clo,
                clo.commission AS commission_clo,
                clo.gross_sale_income AS gross_sale_income_clo,
                clo.origin AS origin_clo,
                CONVERT(VARCHAR, clo.term_date, 120) AS term_date_clo,
                clo.business AS business_clo,
                clo.country AS country_clo
            FROM
                sales sal
                INNER JOIN closeouts clo ON sal.closeout_number = clo.[number]
                LEFT JOIN skus s ON sal.sku=s.sku
            WHERE
                1 = 1
                AND clo.origin = 'SVL'
                AND clo.term = '${DateFormat(new Date(), "yyyy-mm-dd")}'
        `;

        /** EJECUCIÓN DE QUERY. */
        let data = await MySQL.getDataFinances(query);
        if (data.error)
            throw data.error;

        /** CERRAR CONEXIÓN A SQL. */
        let con = await MySQL.closeConnection();
        if (con.error)
            throw con.error;

        /** RETORNO RESPUESTA. */
        return data

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Obtiene los sellers liquidados de finanzas.
 * @return {Json}: Retorna data y nombre en un objeto, si falla retorna excepción.
 */
module.exports.getDataSellers = async (context) => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        context.log('OBTENIENDO INFORMACIÓN DE SELLERS LIQUIDADOS');

        /** QUERY. */
        const query = `
            SELECT
                REPLACE(REPLACE(REPLACE(id, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS id,
                REPLACE(REPLACE(REPLACE(number, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS number,
                REPLACE(REPLACE(REPLACE(term, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS term,
                REPLACE(REPLACE(REPLACE(rut, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS rut,
                REPLACE(REPLACE(REPLACE(name, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS name,
                REPLACE(REPLACE(REPLACE(CAST(CAST(createdAt AS date) AS varchar), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS createdAt,
                REPLACE(REPLACE(REPLACE(CAST(CAST(updatedAt AS date) AS varchar), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS updatedAt,
                gross_income_to_bill,
                commission,
                gross_sale_income,
                REPLACE(REPLACE(REPLACE(origin, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS origin,
                REPLACE(REPLACE(REPLACE(CAST(CAST(term_date AS date) AS varchar), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS term_date,
                REPLACE(REPLACE(REPLACE(business, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS business,
                REPLACE(REPLACE(REPLACE(country, CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS country
            FROM
                closeouts
            WHERE
                term = '${DateFormat(new Date(), "yyyy-mm-dd")}'
        `;
        // term = '${DateFormat(new Date(), "yyyy-mm-dd")}'

        /** EJECUCIÓN DE QUERY. */
        let data = await MySQL.getDataFinances(query);
        if (data.error)
            throw data.error;

        /** CERRAR CONEXIÓN A SQL. */
        let con = await MySQL.closeConnection();
        if (con.error)
            throw con.error;

        /** RETORNO RESPUESTA. */
        return data

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Exportar y subir archivo de finanzas a un Blob Storage. Antes de subir el archivo al blob storage, éste es almacenado en la carpeta temporal tmp ubicada en la raíz del proyecto.
 * @param {Json} data: Objeto que contiene propiedades data y name.
 * @return {[Json]}: Retorna arreglo con nombres de los archivos creados (incluyento url), si falla retorna excepción.
 */
module.exports.exportToCSV = async (context, data, name) => {

    try {

        context.log('EXPORTANDO DATA A CSV');

        /** VALIDAR QUE LA VARIABLE DATA TENGA CONTENIDO. */
        if (Object.keys(data).length == 0)
            throw 'No existen datos a exportar.';

        /** CREAR CARPETA TEMPORAL. */
        const dir = `./${process.env.TMP_FOLDER}`;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** CREAR NOMBRE DEL ARCHIVO A BASE DE FECHA NUMÉRICA. */
        const fullFileName = `${name}_${DateFormat(new Date(), "yyyymmddHMM")}`;

        /** ITERAR ARCHIVO PARA QUE PUEDA SER EXPORTADO A CSV. */
        let result = await FileManager.exportDataToCSV(data, fullFileName);
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
 * Comprimir archivo.
 * @param {Json} context: Objeto de contexto Azure.
 * @param {Json} data: Objeto que contiene las propiedades 'data' y 'path' del archivo.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del upload del archivo (incluye URL), incluye respuesta satisfactoria o fallo.
 */
module.exports.compressingFile = async (context, data) => {

    try {

        context.log('COMPRIMIENDO ARCHIVO');

        /** VALIDAR QUE LA VARIABLE DATA TENGA CONTENIDO. */
        if (!data.path)
            throw 'No existe archivo para comprimir.';

        /** ENVIAR A COMPRIMIR ARCHIVO. */
        let resultado = await FileManager.compressingFile(data);
        if (resultado.error)
            throw resultado.error;

        /** RETORNO RESPUESTA. */
        return resultado;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error }

    }

}

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
        let fileName = path.basename(fullFileName.path);

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
 * Función que envía email según los parámetros que se configuren.
 * @param {[Json]} urlFiles: Arreglo de objeto con los datos (incluyendo la url) subidos al Blob Storage.
 * @return {Json}: Respuesta JSON de la función que retorna el resultado del envío del email, incluye respuesta satisfactoria o fallo.
 */
module.exports.sendEmail = async (context, urlFiles) => {

    try {

        context.log('ENVIANDO CORREO');

        let urlTag = [];

        /** VALIDA QUE EL PARÁMETRO DE ENTRADA TENGA CONTENIDO. */
        if (Object.keys(urlFiles).length == 0)
            throw 'No se ha podido obtener la url del archivo.'

        /** ITERAR ARREGLO DE OBJETO AGREGANDO URL Y NOMBRE A LA VARIABLE URLTAG. */
        for (const file of Object.keys(urlFiles))
            urlTag.push({url: urlFiles[file].url, name: (path.basename(urlFiles[file].url, '.xlsx')) })
        
        let from = process.env.SENDGRID_MAIL_FROM;
        let to = process.env.SENDGRID_MAIL_TO;
        // let cc = process.env.SENDGRID_MAIL_CC;
        // let bcc = process.env.SENDGRID_MAIL_BCC;

        // /** CONFIGURAR PARÁMETROS DEL EMAIL. */
        // const message = {
        //     from: from,
        //     to: to.split(','),
        //     subject: `PROCESO LIQUIDACIÓN ${DateFormat(new Date(), "yyyy-mm-dd")}`,
        //     html: `Estimados,<br><br>
        //     Ha finalizado el proceso liquidación, se adjunta enlaces con reportes finales:<br><br>
        //     1.- <a href='${urlTag[0].url}'>${urlTag[0].name}</a><br>
        //     2.- <a href='${urlTag[1].url}'>${urlTag[1].name}</a><br>
        //     3.- <a href='${urlTag[2].url}'>${urlTag[2].name}</a><br><br></br>    
        //     Atte.<br>
        //     ${process.env.NOMBRE_INFORMA}`,
        // }

        // /** LLAMADA A MÉTODO QUE ENVÍA EMAIL ENVIÁNDOLE DOS PARÁMETROS. */
        // let result = await Email.sendFromSendgrid(message);
        // if (result.error)
        //     throw result.error

        /** CONFIGURAR PARÁMETROS DEL EMAIL. */
        let configEmail = {
            from: from,
            to: to.split(','),
            // cc: process.env.SENDGRID_MAIL_CC,
            // bcc: process.env.SENDGRID_MAIL_BCC,
            subject: `PROCESO LIQUIDACIÓN ${DateFormat(new Date(), "yyyy-mm-dd")}`,
            template: 'settlement',
            context: {
                dear: 'Estimados,',
                message: 'Ha finalizado el proceso liquidación, se adjunta enlaces con reportes finales:',
                urlTag: urlTag,
                greeting: 'Atte.',
                sender: process.env.NOMBRE_INFORMA
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