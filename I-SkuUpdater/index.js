'use-strict';
const { Responses } = require('../libs/responses')
const business = require('./src/business');

/**
 * Actualiza la tabla de skus de finanzas trayendo los skus de la base de datos de productos.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports.skuUpdater = async (context, req) => {

    /** OBTENER DATOS DE FINANZAS. */
    let data = await business.getDataFinances(context);
    if (data.error)
        return context.res = Responses._400({ error: data.error })

    /** OBTENER DATOS DE PRODUCTOS. */
    data = await business.getDataProducts(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data.error })

    /** INSERCIÓN DE DATOS DE PRODUCTOS EN FINANZAS. */
    data = await business.updateSku(context, data);
    if (data.error)
        return context.res = Responses._400({ error: data.error })

    /** RETORNO DE RESPUESTA. */
    context.res = Responses._200({
        message: `SKU's actualizados correctamente`,
        data
    })

};