'use-strict';
const { Responses } = require('../libs/responses')
const business = require('./src/business');

/**
 * Función de inicio. Recibe los parámetros de entrada que vienen de http request de tipo raw/json.
 * @param {json} context: Variable de conexto, retorna resultados.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports = async function (context, req) {

    /** OBTENER DATOS DE GOOGLE CLOUD PLATFORM. */
    let data = await business.getDataGcp(context);
    if (data.error)
        return context.res = Responses._400({ error: data })

    /** RETORNO DE RESPUESTA. */
    context.res = Responses._200({
        message: "Enviando reporte GCP a los emails de destino.",
        data
    })

}