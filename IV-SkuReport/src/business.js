'use-strinct'
const initialReport = require('./management/getInitialReport');

/**
 * Genera csv, sube a blob storage y envía email con el enlace de descarga del reporte generado.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports.getReport = async () => {

    try {

        /** OBTENER DATOS DE FINANZAS. */
        let getDataFinance = await initialReport.getDataFinance();
        if (getDataFinance.error !== undefined || getDataFinance.warn !== undefined)
            return getDataFinance;

        /** EXPORTAR DATA A ARCHIVO XLSX. */
        getDataFinance = await initialReport.exportToXlsxFromObject(getDataFinance, process.env.N_INFORME_SKU_FILE);
        if (getDataFinance.error !== undefined || getDataFinance.warn !== undefined)
            return getDataFinance;

        /** SUBIR ARCHIVO CSV AL BLOB STORAGE. */
        const resultUploadFile = await initialReport.uploadFileFromPath(getDataFinance)
        if (resultUploadFile.error !== undefined || resultUploadFile.warn !== undefined)
            return resultUploadFile;

        /** ENVIAR EMAIL CON ENLACE DE DESCARGA DEL ARCHIVO. */
        const resultSendEmail = await initialReport.sendEmail({ resultUploadFile })
        if (resultSendEmail.error !== undefined)
            return resultSendEmail;

        /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
        const resultDeleteFile = await initialReport.deleteFile()
        if (resultDeleteFile.error !== undefined)
            return resultDeleteFile;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Reporte generado correctamente.', data: { resultUploadFile } }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};