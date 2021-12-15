'use strict';
const fs = require('fs');
const MySQL = require('../../libs/mySQL');
const FileManager = require('../../libs/fileManager');
const GCP = require('../../libs/gcloud');
const DateFormat = require('dateformat');

/**
 * Obtiene los folios desde la base de datos de finanzas.
 * @return {Json}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataFinance = async (context) => {

    try {

        context.log('OBTENIENDO INFORMACIÓN');

        /** QUERY. */
        const query = `SELECT folio, CASE WHEN fulfillment_type IS NULL THEN 'null' WHEN fulfillment_type = '' THEN 'null' ELSE fulfillment_type END AS 'fulfillment_type', CASE WHEN category IS NULL THEN 'null' WHEN category = '' THEN 'null' ELSE category END AS 'category', sku FROM sales WHERE origin = 'SVL' AND folio NOT IN ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11') AND quantity > 0 AND (closeout_number = 0 OR closeout_number IS NULL)`;

        /** EJECUCIÓN DE QUERY. */
        const data = await MySQL.getDataFinances(query);
        if (data.error)
            throw data.error

        /** CERRAR CONEXIÓN A SQL. */
        let con = await MySQL.closeConnection();
        if(con.error)
            throw con.error

        /** RETORNO RESPUESTA. */
        return {
            name: `tmp_data_finanzas_${DateFormat(new Date(), "yyyymmddHMM")}`,
            data: data
        }

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Exportar data a archivo csv.
 * @param {Json} data: Objeto que contiene propiedades data y name.
 * @return {[Json]}: Retorna JSON con nombre y ruta del archivo creado, si falla retorna excepción.
 */
module.exports.exportToCSV = async (context, data) => {

    try {

        context.log('EXPORTANDO DATOS A CSV');

        /** VALIDAR QUE LA VARIABLE DATA TENGA CONTENIDO. */
        if (Object.keys(data.data).length == 0)
            throw 'No existen datos a exportar.';

        /** CREAR CARPETA TEMPORAL. */
        const dir = `./${process.env.TMP_FOLDER}`;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);

        /** ITERAR ARCHIVO PARA QUE PUEDA SER EXPORTADO A CSV. */
        data = await FileManager.exportDataToCSV(data.data, data.name);
        if (data.error)
            throw data.error

        /** RETORNO RESPUESTA. */
        return data;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

}

/**
 * Guardar datos desde el archivo csv a bigquery.
 * @param {String} filePath: Variable que contiene la ruta del archivo csv.
 * @return {Json}: Retorna JSON con resultado del proceso de bigquery.
 */
module.exports.updateGCP = async (context, filePath) => {

    try {

        context.log('ACTUALIZANDO DATOS EN GCP');

        /** VALIDAR QUE LA VARIABLE DE ENTRADA TENGA CONTENIDO. */
        if (filePath.length == 0)
            throw 'No existe archivo de origen para actualizar.';

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
        let data = await GCP.insertDataFromLocalFile(options);
        if (data.error)
            throw data.error;

        /** RETORNO RESPUESTA. */
        return data;

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

        return true;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

}