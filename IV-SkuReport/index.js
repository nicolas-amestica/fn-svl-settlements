'use-strinct'
const { Responses } = require('../libs/responses');
const business = require('./src/business');

/**
 * Genera csv, sube a blob storage y envía email con el enlace de descarga del reporte generado.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports = async function (context, req) {

    /** OBTENER DATOS DE GOOGLE CLOUD PLATFORM. */
    let data = await business.getDataGcp();
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** EXPORTAR DATA A ARCHIVO XLSX. */
    data = await business.exportToXlsxFromObject(data, process.env.N_INFORME_SKU_FILE);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** SUBIR ARCHIVO CSV AL BLOB STORAGE. */
    data = await business.uploadFileFromPath(data)
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** ENVIAR EMAIL CON ENLACE DE DESCARGA DEL ARCHIVO. */
    data = await business.sendEmail(data)
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** ELIMINAR DIRECTORIO PARA ARCHIVOS TEMPORALES. */
    const deleted = await business.deleteFolder()
    if (deleted.error)
        return context.res = Responses._400({ error: deleted.error });

    /** RETORNO DE RESPUESTA. */
    return context.res = Responses._200({
        message: "Reporte generado correctamente.",
        data
    })

};