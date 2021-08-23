'use-strinct'
const finalReport = require('./management/getFinalReports');

/**
 * Genera reporte csv de folios pendientes por liquidar, ventas liouidadas y sellers liquidados, para luego subirlos a un blob storage y enviar enlaces vía email.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.getDataFinalReport = async () => {

    try {

        /** OBTENER FOLIOS PENDIENTES DE FINANZAS. */
        let getDataPending = await finalReport.getDataPending();
        if (getDataPending.error !== undefined)
            return getDataPending;

        /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
        getDataPending = await finalReport.exportToCSV(getDataPending);
        if (getDataPending.error !== undefined)
            return getDataPending;

        /** OBTENER VENTAS LIQUIDADAS DE FINANZAS. */
        let getDataSales = await finalReport.getDataSales();
        if (getDataSales.error !== undefined)
            return getDataSales;

        /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
        getDataSales = await finalReport.exportToCSV(getDataSales);
        if (getDataSales.error !== undefined)
            return getDataSales;

        /** OBTENER SELLERS LIQUIDADOS DE FINANZAS. */
        let getDataSellers = await finalReport.getDataSellers();
        if (getDataSellers.error !== undefined)
            return getDataSellers;

        /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
        getDataSellers = await finalReport.exportToCSV(getDataSellers);
        if (getDataSellers.error !== undefined)
            return getDataSellers;

        /** ENVIAR EMAIL CON ENLACES DE DESCARGAS DE LOS ARCHIVOS. */
        const resultSendEmail = await finalReport.sendEmail({ getDataPending, getDataSales, getDataSellers })
        if (resultSendEmail.error !== undefined)
            return resultSendEmail;

        /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
        const resultDeleteFile = await finalReport.deleteFile()
        if (resultDeleteFile.error !== undefined)
            throw resultDeleteFile;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Reportes generados correctamente.', data: { getDataPending, getDataSales, getDataSellers } }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        // fs.rmdirSync(process.env.TMP_FOLDER, { recursive: true });
        return error;

    }

};