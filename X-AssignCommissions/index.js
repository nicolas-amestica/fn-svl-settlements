'use strict';
const { Responses } = require('../libs/responses')
const business = require('./src/business');

/**
 * Función de inicio. Recibe los parámetros de entrada que vienen de http request de tipo raw/json.
 * @param {json} context: Variable de conexto, retorna resultados.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports = async function (context, req) {

    /** OBTENER DATOS DE VENTAS SIN CATEGORÍAS. */
    let data = await business.getFoliosIdWithoutCategory(context);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** ACTUALIZAR VENTAS SIN CATEGORÍAS. */
    let foliosWithoutCategory = await business.updateFoliosIdWithoutCategory(context, data);
    if (foliosWithoutCategory.error)
        return context.res = Responses._400({ error: foliosWithoutCategory.error });

    /** OBTENER DATOS VENTAS SIN PRODUCT COM. */
    data = await business.getFoliosIdsWithoutProductCOM(context);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** ACTUALIZAR VENTAS SIN PRODUCT COM. */
    let foliosWithoutProductCOM = await business.updateFoliosIdsWithoutProductCOM(context, data);
    if (foliosWithoutProductCOM.error)
        return context.res = Responses._400({ error: foliosWithoutProductCOM.error });

    /** ACTUALIZAR VENTAS SIN PRODUCT COM. */
    data = await business.assignCommissions(context);
    if (data.error)
        return context.res = Responses._400({ error: data.error });

    /** RETORNO DE RESPUESTA. */
    return context.res = Responses._200({
        message: "Datos actualizados correctamente.",
        data: {
            'Folios sin categoria': foliosWithoutCategory,
            'Folios sin product com': foliosWithoutProductCOM,
            'Asignar comision': data
        }
    })

}