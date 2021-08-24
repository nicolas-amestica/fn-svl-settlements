'use-strinct'
const gcp = require('./management/gcpManagement');

/**
 * Genera archivo csv y vacía la data en bigquery.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports.svlPrincipal = async () => {

    try {

        /** OBTENER DATOS DE FINANZAS. */
        let data = await gcp.getDataFinance();
        if (data.error !== undefined)
            return data;

        /** EXPORTAR DATA A ARCHIVO CSV. */
        data = await gcp.exportToCSV(data);
        if (data.error !== undefined || data.warn !== undefined)
            return data;

        /** INSERTAR DATA DE ARCHIVO CSV A BIGQUERY. */
        // data = await gcp.updateGCP(data.path);
        // if (data.error !== undefined)
        //     return data;

        /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
        const deleteFolder = await gcp.deleteFolder()
        if (deleteFolder.error !== undefined)
            return deleteFolder;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Archivo insertado a BigQuery correctamente.', data }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};