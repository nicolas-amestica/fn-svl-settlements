'use-strinct'
const productsManagement = require('./management/skuUpdater');

/**
 * Actualiza la tabla de skus de finanzas trayendo los skus de la base de datos de productos.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports.skuUpdater = async () => {

    try {

        /** OBTENER DATOS DE PRODUCTOS. */
        let data = await productsManagement.getDataProducts();
        if (data.error !== undefined)
            return data;

        /** INSERCIÓN DE DATOS DE PRODUCTOS EN FINANZAS. */
        data = await productsManagement.updateSku(data);
        if (data.error !== undefined)
            return data;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: `SKU's actualizados correctamente.`, data }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};