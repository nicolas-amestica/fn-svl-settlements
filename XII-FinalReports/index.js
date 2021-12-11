'use-strinct'
const { Responses } = require('../libs/responses');
const business = require('./src/business');

/**
 * Genera csv, sube a blob storage y envía email con el enlace de descarga del reporte generado.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports = async function (context, req) {

    /** OBTENER FOLIOS PENDIENTES DE FINANZAS. */
    let data = await business.getDataPending();
    if (data.error)
        return context.res = Responses._400({ error: data.error });
    
    /** EXPORTAR DATOS A ARCHIVO XLSX EN CARPETA TEMPORAL. */
    data = await business.exportToXlsxFromObject(data, process.env.N_PENDIENTES_LIQUIDAR_FILE);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** SUBIR ARCHIVO XLSX AL BLOB STORAGE. */
    let getDataPending = await business.uploadFileFromPath(data)
    if (getDataPending.error)
        return context.res = Responses._400({ error: getDataPending.error });

    /** OBTENER VENTAS LIQUIDADAS DE FINANZAS. */
    data = await business.getDataSales();
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** EXPORTAR DATOS A ARCHIVO XLSX EN CARPETA TEMPORAL. */
    data = await business.exportToXlsxFromObject(data, process.env.N_SALES_FILE);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** SUBIR ARCHIVO XLSX AL BLOB STORAGE. */
    let getDataSales = await business.uploadFileFromPath(data)
    if (getDataSales.error)
        return context.res = Responses._400({ error: getDataSales.error });

    /** OBTENER SELLERS LIQUIDADOS DE FINANZAS. */
    data = await business.getDataSellers();
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** EXPORTAR DATOS A ARCHIVO XLSX EN CARPETA TEMPORAL. */
    data = await business.exportToXlsxFromObject(data, process.env.N_SELLERS_FILE);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** SUBIR ARCHIVO XLSX AL BLOB STORAGE. */
    let getDataSellers = await business.uploadFileFromPath(data)
    if (getDataSellers.error)
        return context.res = Responses._400({ error: getDataSellers.error });

    /** ENVIAR EMAIL CON ENLACES DE DESCARGAS DE LOS ARCHIVOS. */
    const resultSendEmail = await business.sendEmail({ getDataPending, getDataSales, getDataSellers })
    if (resultSendEmail.error)
        return context.res = Responses._400({ error: resultSendEmail.error });

    /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
    resultDeleteFile = await business.deleteFolder()
    if (resultDeleteFile.error)
        return context.res = Responses._400({ error: resultDeleteFile.error });

    /** RETORNO DE RESPUESTA. */
    return context.res = Responses._200({
        message: "Reportes generados correctamente.",
        data: resultSendEmail
    })

};