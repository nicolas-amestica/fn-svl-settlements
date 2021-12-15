'use strict';
const { Responses } = require('../libs/responses')
const business = require('./src/business');

/**
 * Función de inicio. Recibe los parámetros de entrada que vienen de http request de tipo raw/json.
 * @param {json} context: Variable de conexto, retorna resultados.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports = async function (context, req) {

    /** OBTENER DATOS DE FINANZAS. */
    let data = await business.getData(context);
    if (data.error)
        return context.res = Responses._400({ error: data })

    /** GENERAR INFORME. */
    data = await business.exportToXlsx(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data });

    /** SUBIR INFORME. */
    data = await business.uploadFileFromPath(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data });
    
    /** ENVIAR CORREO. */
    data = await business.sendEmail(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data });

    /** ELIMINAR DIRECTORIO TEMPORAL. */
    let deleted = await business.deleteFile(context);
    if (deleted.error)
        return context.res = Responses._400({ error: deleted });

    /** RETORNO DE RESPUESTA. */
    context.res = Responses._200({
        message: "Enviando Informe PreLiquidación a los emails de destino.",
        data
    })

}