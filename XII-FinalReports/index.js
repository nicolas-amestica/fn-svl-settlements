'use-strinct'
const { Responses } = require('../libs/responses');
const business = require('./src/business');

/**
 * Genera csv, sube a blob storage y envía email con el enlace de descarga del reporte generado.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports = async function (context, req) {

    /** OBTENER FOLIOS PENDIENTES DE FINANZAS. */
    let getDataPending = await business.getDataPending();
    if (getDataPending.error)
        return context.res = Responses._400({ error: getDataPending.error });

    // /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
    // getDataPending = await business.exportToCSV(getDataPending);
    // if (getDataPending.error !== undefined)
    //     return getDataPending;

    // /** OBTENER VENTAS LIQUIDADAS DE FINANZAS. */
    // let getDataSales = await business.getDataSales();
    // if (getDataSales.error !== undefined)
    //     return getDataSales;

    // /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
    // getDataSales = await business.exportToCSV(getDataSales);
    // if (getDataSales.error !== undefined)
    //     return getDataSales;

    // /** OBTENER SELLERS LIQUIDADOS DE FINANZAS. */
    // let getDataSellers = await business.getDataSellers();
    // if (getDataSellers.error !== undefined)
    //     return getDataSellers;

    // /** EXPORTAR DATOS A ARCHIVO CSV EN CARPETA TEMPORAL. */
    // getDataSellers = await business.exportToCSV(getDataSellers);
    // if (getDataSellers.error !== undefined)
    //     return getDataSellers;

    // /** ENVIAR EMAIL CON ENLACES DE DESCARGAS DE LOS ARCHIVOS. */
    // const resultSendEmail = await business.sendEmail({ getDataPending, getDataSales, getDataSellers })
    // if (resultSendEmail.error !== undefined)
    //     return resultSendEmail;

    // /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
    // const resultDeleteFile = await business.deleteFile()
    // if (resultDeleteFile.error !== undefined)
    //     throw resultDeleteFile;

    /** RETORNO DE RESPUESTA. */
    return context.res = Responses._200({
        message: "Reportes generados correctamente.",
        data: {
            getDataPending
        }
    })

};