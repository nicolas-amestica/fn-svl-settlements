'use-strinct'
const { BigQuery } = require('@google-cloud/bigquery');

/**
 * Insertar datos a bigquery.
 * @param {Json} options: Objeto que contiene la configuración de bigquery.
 * @return {Json}: Retorna JSON con resultado del proceso de bigquery.
 */
module.exports.insertDataFromLocalFile = async (options) => {

    try {

        const bigquery = new BigQuery({ credentials: {
            private_key: process.env.private_key,
            client_email: process.env.client_email
        }});

        /** CONFIGURAR METADATA PARA BIGQUEY. */
        const metadata = {
            sourceFormat: options.formatFile,
            skipLeadingRows: 1,
            schema: {
              fields: options.fields,
            },
            location: 'US',
            writeDisposition: options.type, /** WRITE_APPEND|WRITE_TRUNCATE */
            fieldDelimiter: ';'
        };

        /** EJECUTAR BIGQUEY. */
        const [job] = await bigquery
            .dataset(options.dataSet)
            .table(options.table)
            .load(options.filePath, metadata);

        delete job.statistics.load.timeline;
        
        /** RETORNA RESPUESTA. */
        return job.statistics.load;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { error };

    }

};