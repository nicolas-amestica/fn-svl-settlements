'use-strinct'
const gcp = require('./management/gcpManagement');

/**
 * Genera archivo csv y vuelca la data de éste en GCP mediante un bigquery.
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
        data = await gcp.updateGCP(data.path);
        if (data.error !== undefined)
            return data;

        /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
        // const deleteFolder = await gcp.deleteFolder()
        // if (deleteFolder.error !== undefined)
        //     return deleteFolder;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Registros ingresados a BigQuery correctamente.', data: { "Total registros": data.outputRows, detalle: data } }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};