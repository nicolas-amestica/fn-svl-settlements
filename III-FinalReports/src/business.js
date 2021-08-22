'use-strinct'
const finalReport = require('./management/getFinalReports');

/**
 * Genera reporte de folios pendientes por liquidar.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.getDataFinalReport = async () => {

    try {

        /** OBTENER FOLIOS PENDIENTES DE FINANZAS. */
        const getDataPending = await finalReport.getDataPending();
        if (getDataPending.error !== undefined)
            return getDataPending;

        /** OBTENER VENTAS LIQUIDADAS DE FINANZAS. */
        const getDataSales = await finalReport.getDataSales();
        if (getDataSales.error !== undefined)
            return getDataSales;

        /** OBTENER SELLERS LIQUIDADOS DE FINANZAS. */
        const getDataSellers = await finalReport.getDataSellers();
        if (getDataSellers.error !== undefined)
            return getDataSellers;

        // /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
        const getExportFiles = await finalReport.exportToCSV({ getDataPending, getDataSales, getDataSellers });
        if (getExportFiles.error !== undefined)
            return getExportFiles;

        /** SUBIR ARCHIVO CSV AL BLOB STORAGE. */
        const resultUploadFiles = await finalReport.uploadFileFromPath(getExportFiles)
        if (resultUploadFiles === undefined)
            return resultUploadFiles;

        /** ENVIAR EMAIL. */
        // const resultSendEmail = await finalReport.sendEmail(resultUploadFile.url)
        // if (resultSendEmail.error !== undefined)
        //     return resultSendEmail;

        /** ELIMINAR ARCHIVO CSV DE CARPETA TEMPORAL. */
        const resultDeleteFile = await finalReport.deleteFile()
        if (resultDeleteFile.error !== undefined)
            throw resultDeleteFile;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Reportes generado correctamente.', data: resultUploadFiles }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        // fs.rmdirSync(process.env.TMP_FOLDER, { recursive: true });
        return error;

    }

};