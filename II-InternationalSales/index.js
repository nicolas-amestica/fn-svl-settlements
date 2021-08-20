'use strict';
const management = require('./src/business');

/**
 * Función de inicio.
 * @param {json} context: Variable de conexto, retorna resultados.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports = async function (context) {

    /** MÉTODO PARA ACTUALIZAR VENTAS INTERNACIONALES. */
    const result = await management.updateInternationalsales();

    /** RETORNO DE RESPUESTA. */
    context.res = result;

}