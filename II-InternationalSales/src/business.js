'use-strinct'
const salesManagement = require('./management/sales');

/**
 * Obtiene las ventas que no tengan campo interncional y lo actualiza según corresponda.
 * @return {json}: Respuesta JSON que retorna la respuesta del proceso completo, si falla retorna excepción.
 */
module.exports.updateInternationalsales = async () => {

    try {

        /** OBTENER DATOS DE FINANZAS. */
        const resultDataFinance = await salesManagement.getDataFinance();
        if (resultDataFinance.error !== undefined || resultDataFinance.warn !== undefined)
            return resultDataFinance;

        /** LISTAR USUARIOS DE ACUERDO A LA LISTA DE RUT DE VENTAS OBTENIDAS EN EL PASO ANTERIOR. */
        const resultRutsInternational = await salesManagement.getDataUser(resultDataFinance.data);
        if (resultRutsInternational.error !== undefined || resultRutsInternational.warn !== undefined)
            return resultRutsInternational;

        /** ACTUALIZAR VENTAS INTERNACIONAL. */
        const resultUpdateSales = await salesManagement.updateDataVentasInternacionales(resultRutsInternational);
        if (resultUpdateSales.error !== undefined || resultUpdateSales.warn !== undefined)
            return resultUpdateSales;

        /** RETORNO DE RESPUESTA EXITOSA. */
        return { body: { message: 'Ventas nacionales actualizadas correctamente.', data: resultUpdateSales }};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};