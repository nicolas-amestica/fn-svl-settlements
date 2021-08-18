'use-strinct'
const initialReport = require('./management/getInitialReport');

/**
 * Genera reporte de folios pendientes por liquidar.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.getReport = async () => {

    try {

        /** OBTENER DATOS DE FINANZAS. */
        const getDataFinance = await initialReport.getDataFinance();
        if (getDataFinance.error !== undefined || getDataFinance.warn !== undefined)
            return getDataFinance;

        /** EXPORTAR DATA A ARCHIVO XLSX. */
        const getExportFileToXlsx = await initialReport.exportToXlsxFromObject(getDataFinance, process.env.N_INFORME_SKU_FILE);
        if (getExportFileToXlsx.error !== undefined || getExportFileToXlsx.warn !== undefined)
            return getExportFileToXlsx;

        /** SUBIR ARCHIVO CSV AL BLOB STORAGE. */
        const resultUploadFile = await initialReport.uploadFileFromPath(getExportFileToXlsx)
        if (resultUploadFile.error !== undefined || resultUploadFile.warn !== undefined)
        return resultUploadFile;
        
        /** ELIMINAR ARCHIVO CSV DE CARPETA TEMPORAL. */
        const resultDeleteFile = await initialReport.deleteFile(getExportFileToXlsx)
        if (resultDeleteFile.error !== undefined || resultDeleteFile.warn !== undefined)
            throw resultDeleteFile;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Reporte generado correctamente.', data: resultUploadFile }};

    } catch (error) {

        /** CAPTURA ERROR. */
        return error;

    }

};