'use strict';
const fs = require('fs');
const sql = require("mssql");
const mySQL = require('../../../common/mySQL');
const fileManager = require('../../../common/fileManager');
const gcp = require('../../../common/gcloud');
const dateFormat = require('dateformat');

/**
 * Obtiene los folios desde la base de datos de finanzas.
 * @return {Json}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataFinance = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configFinanzas);

        /** QUERY. */
        const query = `
            SELECT
                folio,
                fulfillment_type,
                category,
                sku 
            FROM
                sales 
            WHERE
                origin = 'SVL'
                AND folio NOT IN ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11') 
                AND quantity > 0
                AND (closeout_number = 0 OR closeout_number IS NULL)
        `;

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 400, body: { error: 'No se pudo consultar los datos de finanzas.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** RETORNO RESPUESTA. */
        return {
            name: `tmp_data_finanzas_${dateFormat(new Date(), "yyyymmddHMM")}`,
            data: data.recordset
        }    

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo obtener la información de la base de datos.', detalle: error }, error: {} };

    }

};

/**
 * Exportar data a archivo csv.
 * @param {Json} data: Objeto que contiene propiedades data y name.
 * @return {[Json]}: Retorna JSON con nombre y ruta del archivo creado, si falla retorna excepción.
 */
module.exports.exportToCSV = async (data) => {

    try {

        /** VALIDAR QUE LA VARIABLE DATA TENGA CONTENIDO. */
        if (Object.keys(data.data).length == 0)
            return { status: 202, body: { message: 'No existen datos a exportar.' }, warn: {} };

        /** CREAR CARPETA TEMPORAL. */
        const dir = `./${process.env.TMP_FOLDER}`;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** ITERAR ARCHIVO PARA QUE PUEDA SER EXPORTADO A CSV. */
        data = await fileManager.exportDataToCSV(data.data, data.name);
        if (data.error)
            return { status: 400, body: { message: 'No se pudo exportar los archivos.', detalle: data.error }, error: {} };

        /** RETORNO RESPUESTA. */
        return data;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo exportar los datos.', detalle: error }, error: {} };

    }

}

/**
 * Guardar datos desde el archivo csv a bigquery.
 * @param {String} filePath: Variable que contiene la ruta del archivo csv.
 * @return {Json}: Retorna JSON con resultado del proceso de bigquery.
 */
module.exports.updateGCP = async (filePath) => {

    try {

        /** VALIDAR QUE LA VARIABLE DE ENTRADA TENGA CONTENIDO. */
        if (filePath.length == 0)
            return { status: 400, body: { message: 'No existe archivo de origen para actualizar.' }, error: {} };

        /** CONFIGURAR OPCIONES DE GCP. */
        const options = {
            filePath,
            table: '_svl_finanzas',
            fields: [{
                name: "folio",
                type: "NUMERIC"
            }, {
                name: "fulfillment_type",
                type: "STRING"
            }, {
                name: "category",
                type: "STRING"
            }, {
                name: "sku",
                type: "NUMERIC"
            }],
            type: 'WRITE_TRUNCATE',
            formatFile: 'CSV',
            dataSet: 'pago_seller'
        }

        /** EJECUTAR BIGQUERY, SE ENVÍAN PARÀMETROS PARA POSTERIOR CONFIGURACIÓN DEL SERVICIO. */
        let data = await gcp.insertDataFromLocalFile(options);
        if (data.error)
            return { status: 400, body: { message: 'No se pudo ejecutar bigquery.', detalle: data.error }, error: {} };

        /** RETORNO RESPUESTA. */
        return data;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { message: 'No se pudo ejecutar bigquery.', detalle: data.error }, error: {} };

    }

}

/**
 * Eliminar directorio de carpeta temporal.
 * @return {boolean}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.deleteFolder = async () => {

    try {

        /** ELIMINAR CARPETA TEMPORALES. SE ENVÍA RUTA DEL DIRECTORIO Y BOOLEAN OBJECT SI NECESITA QUE SEA CON RECURSIVIDAD. */
        let data = fileManager.deleteFolder(process.env.TMP_FOLDER, { recursive: true });
        if (data.error)
            return { status: 400, body: { message: 'No se pudo eliminar el directorio.', detalle: data.error }, error: {} };

        return true;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: `No se pudo eliminar el directorio ${process.env.TMP_FOLDER}.`, detalle: error }, error: {} };

    }

}