'use strict';
const fs = require('fs');
const sql = require("mssql");
const mySQL = require('../../../common/mySQL');
const fileManager = require('../../../common/fileManager');
const dateFormat = require('dateformat');
const blobStorage = require('../../../common/blobStorage');
const email = require('../../../common/email');
const path = require('path');

/**
 * Obtiene los folios pendientes de finanzas.
 * @return {Json}: Retorna data y nombre en un objeto, si falla retorna excepción.
 */
module.exports.getDataPending = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS mySQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) return { status: 401, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configFinanzas);

        /** QUERY. */
        const query = `
            SELECT
                sl.id,
                sl.closeout_number,
                sl.term,
                sl.rut,
                sl.quantity,
                sl.sku,
                REPLACE(REPLACE(REPLACE(TRIM(REPLACE(sk.seller_sku, '''', '')), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS seller_sku,
                REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(sk.product_name, '''', ''), ';', ' '), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS description,
                sl.percentage,
                sl.gross_sale_income,
                sl.IVA_gross_income,
                sl.net_sale_income,
                sl.commission_value,
                sl.net_sale_to_bill,
                sl.IVA_to_bill,
                sl.gross_income_to_bill,
                sl.folio,
                CONVERT(VARCHAR, sl.createdAt, 120) AS createdAt,
                CONVERT(VARCHAR, sl.updatedAt, 120) AS updatedAt,
                CONVERT(VARCHAR, sl.date_of_sale, 120) AS date_of_sale,
                CONVERT(VARCHAR, sl.reception_time, 120) AS reception_time,
                sl.category,
                sl.origin,
                sl.fulfillment_type,
                sl.purchase_order,
                sl.sales_commission,
                sl.discount_value,
                sl.discounted_commission,
                sl.total_commission,
                REPLACE(REPLACE(REPLACE(REPLACE(sl.ticket_number, ';', ' '), CHAR(9), ''), CHAR(10), ''), CHAR(13), '') AS ticket_number,
                sl.international,
                sl.business,
                sl.country
            FROM
                sales sl
                LEFT JOIN skus sk ON sl.sku = sk.sku 
            WHERE
                sl.origin = 'SVL'
                AND sl.folio NOT IN ('0','-1','-2','-3','-4','-5','-6','-7','-8','-9','-10','-11')
                AND sl.quantity > 0
                AND (sl.closeout_number = 0 OR sl.closeout_number IS NULL)
                AND sl.international = 0
        `;

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 401, body: { error: 'No se pudo consultar los folios pendientes de finanzas.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** RETORNO RESPUESTA. */
        return { name: `${process.env.N_PENDIENTES_LIQUIDAR_FILE}_${dateFormat(new Date(), "yyyymmddHMM")}`, data: data.recordset };

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 401, body: { error: 'No se pudo seguir con la obtención de folios pendientes.', detalle: error }, error: {} };

    }

};

/**
 * Obtiene las ventas liquidadas de finanzas.
 * @return {Json}: Retorna data y nombre en un objeto, si falla retorna excepción.
 */
module.exports.getDataSales = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS mySQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configFinanzas);

        /** QUERY. */
        const query = `
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
                AND clo.term = '2021-08-20'
        `;
        // AND clo.term = '${dateFormat(new Date(), "yyyy-mm-dd")}'

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 400, body: { error: 'No se pudo consultar las ventas liquidadas de finanzas.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** RETORNO RESPUESTA. */
        return {name: `${process.env.N_SALES_FILE}_${dateFormat(new Date(), "yyyymmddHMM")}`, data: data.recordset }

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo seguir con la obtención de ventas liquidadas.', detalle: error }, error: {} };

    }

};

/**
 * Obtiene los sellers liquidados de finanzas.
 * @return {Json}: Retorna data y nombre en un objeto, si falla retorna excepción.
 */
module.exports.getDataSellers = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS mySQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configFinanzas);

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
                term = '2021-08-20'
        `;
        // term = '${dateFormat(new Date(), "yyyy-mm-dd")}'

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 400, body: { error: 'No se pudo consultar los sellers liquidados de finanzas.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** RETORNO RESPUESTA. */
        return { name: `${process.env.N_SELLERS_FILE}_${dateFormat(new Date(), "yyyymmddHMM")}`, data: data.recordset }

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo seguir con la obtención de sellers liquidados.', detalle: error }, error: {} };

    }

};

/**
 * Exportar y subir archivo de finanzas a un Blob Storage. Antes de subir el archivo al blob storage, éste es almacenado en la carpeta temporal tmp ubicada en la raíz del proyecto.
 * @param {Json} data: Objeto que contiene propiedades data y name.
 * @return {[Json]}: Retorna arreglo con nombres de los archivos creados (incluyento url), si falla retorna excepción.
 */
module.exports.exportToCSV = async (data) => {

    try {

        /** VALIDAR QUE LA VARIABLE DATA TENGA CONTENIDO. */
        if (Object.keys(data).length == 0)
            return { status: 401, body: { message: 'No existen datos a exportar.' }, error: {} };

        /** CREAR CARPETA TEMPORAL. */
        const dir = `./${process.env.TMP_FOLDER}`;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** ITERAR ARCHIVO PARA QUE PUEDA SER EXPORTADO A CSV. */
        data = await fileManager.exportDataToCSV(data.data, data.name);
        if (data.error)
            return { status: 401, body: { message: 'No se pudo exportar los archivos.', detalle: data.error }, error: {} };

        /** SUBE ARCHIVO ALMACENADO EN CARPETA TEMPORAL AL BLOB STORAGE. */
        data = await this.uploadFileFromPath(data.name);
        if (data.error)
            return { status: 401, body: { message: 'No se pudo subir el archivo.', detalle: data.error }, error: {} };

        /** RETORNO RESPUESTA. */
        return data;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 401, body: { error: 'No se pudo exportar los datos.', detalle: error }, error: {} };

    }

}

/**
 * Subir archivo a Azure Blob Storage.
 * @param {String} fileName: Arreglo de nombres de archivos.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del upload del archivo (incluye URL), incluye respuesta satisfactoria o fallo.
 */
module.exports.uploadFileFromPath = async (fileName) => {

    try {

        let result = await blobStorage.uploadFileFromLocal('reports', fileName, `${process.env.TMP_FOLDER}${fileName}`);
        if (!result)
            return { status: 401, body: { error: 'No se pudo subir archivos a blob storage' }, error: {} };

        /** RETORNO RESPUESTA. */
        return result;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudieron subir los archivos.', detalle: error }, error: {} };

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
            urlTag.push({url: urlFiles[file].url, name: (path.basename(urlFiles[file].url, '.csv')).toUpperCase() })
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
                message: 'Ha finalizado el proceso liquidación, se adjunta enlaces con reportes finales:',
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
 * Eliminar el archivo csv ubicado en carpeta temporal.
 * @return {[Json]}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
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