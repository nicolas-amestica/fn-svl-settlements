'use-strinct'
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

/**
 * Insertar datos a bigquery.
 * @param {Json} options: Objeto que contiene la configuración de bigquery.
 * @return {Json}: Retorna JSON con resultado del proceso de bigquery.
 */
module.exports.insertDataFromLocalFile = async (options) => {

    try {

        /** CONFIGURAR METADATA PARA BIGQUEY. */
        const metadata = {
            sourceFormat: options.formatFile,
            skipLeadingRows: 1,
            schema: {
              fields: options.fields,
            },
            location: 'US',
            writeDisposition: options.type, /** WRITE_APPEND|WRITE_TRUNCATE */
        };

        /** EJECUTAR BIGQUEY. */
        const [job] = await bigquery
            .dataset(options.dataSet)
            .table(options.table)
            .load(options.filePath, metadata);

        /** RETORNA RESPUESTA. */
        return job;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { error };

    }

};