'use strict';
const management = require('./src/business');

/**
 * Función de inicio. Recibe los parámetros de entrada que vienen de http request de tipo raw/json.
 * @param {json} context: Variable de conexto, retorna resultados.
 * @return {json}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports = async function (context) {

    /** MÉTODO PARA GENERAR REPORTE. */
    const result = await management.svlPrincipal();

    /** RETORNO DE RESPUESTA. */
    context.res = result;

}