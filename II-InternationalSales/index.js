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
    let data = await business.getDataFinance(context);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    data = await business.getDataUser(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** ACTUALIZAR DATA EN FINANZAS. */
    data = await business.updateInternationalSales(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** RETORNO DE RESPUESTA. */
    return context.res = Responses._200({
        message: "Datos actualizados correctamente.",
        data
    })

}