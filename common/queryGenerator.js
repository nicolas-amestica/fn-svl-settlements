'use strict';

/**
 * Función que procesa arreglo de objetos de un elemento y concatena en un string para utilizarlo en una consulta SQL.
 * @param {[Json]} data: Arreglo de objetos de un elemento.
 * @return {json}: Respuesta JSON de la función que retorna el resultado de la concatenación del elemento de arreglo de objeto.
 */
module.exports.inQueryGenerator = async (data) => {

    try {

        /** DECLARAR VARIABLE QUE ALMACENA LA CADENA. */
        let cadena = [];
        
        /** ITERAR OBJETO. */
        data.forEach(obj => {
            Object.entries(obj).forEach(([key, value]) => {
                cadena.push(value)
            });
        });

        /** UNIR VALORES POR EL SEPARADOR INDICADO. */
        let sData = cadena.join("','")

        /** AGREGAR COMILLAS A LOS EXTREMOS DE LA AVARIABLE. */
        sData = `'${sData}'`;

        /** RETORNO RESPUESTA. */
        return sData;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};

/**
 * Función que procesa arreglo simple de string y concatena en un string para utilizarlo en una consulta SQL.
 * @param {[String]} data: Arreglo de string.
 * @return {json}: Respuesta JSON de la función que retorna el resultado de la concatenación del arreglo devolviendo un string para SQL.
 */
module.exports.inQueryGeneratorString = async (data) => {

    try {

        /** UNIR VALORES POR EL SEPARADOR INDICADO. */
        let sData = data.join(`','`)

        /** AGREGAR COMILLAS A LOS EXTREMOS DE LA AVARIABLE. */
        sData = `'${sData}'`;

        /** RETORNO RESPUESTA. */
        return sData

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

}

/**
 * Función que procesa arreglo de objeto, lo separa en bloques, cada bloque concatena los ruts en un string para utilizarlo en una consulta SQL.
 * @param {[String]} data: Arreglo de string.
 * @return {json}: Retorna arreglo de bloques con rut listos para utilizarlos en una consulta SQL.
 */
module.exports.divideScriptByRut = async (salesGroup) => {

    try {

        /** DECLARAR VARIABLE QUE ALMACENA CADENA DE STRING Y BLOQUES. */
        let bloques = [];
        let arrCadena = [];

        /** ITERA EL OBJETO Y ALMACENA LOS RUT EN VARIABLE ARRCADENA. */
        for (const sales of Object.keys(salesGroup)) {
            arrCadena.push(salesGroup[sales].RUT);
        }

        /** DIVIDIR CADENA EN BLOQUES DE ACUERDO A LO QUE SE INDIQUE. */
        if (arrCadena.length > 0) {
            const LONGITUD_PEDAZOS = 15000; /** INDICA LA CANTIDAD TOTAL QUE TENDRAN LOS BLOQUES. */
            for (let i = 0; i < arrCadena.length; i += LONGITUD_PEDAZOS) {
                /** DIVIDE LA CADENA EN UN BLOQUE. */
                let pedazo = arrCadena.slice(i, i + LONGITUD_PEDAZOS);
                /** EL BLOQUE LOS UNE Y GENERA UNA CADENA PARA QUE PUEDA SER UTILIZADA EN CONSULTA SQL. */
                let cadenaRut = await this.inQueryGeneratorString(pedazo)
                /** AGREGA LA CADENA AL BLOQUE. */
                bloques.push(cadenaRut);
            }
        }

        /** RETORNO RESPUESTA. */
        return bloques;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error

    }

}