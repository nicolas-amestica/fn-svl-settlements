'use strict';
const join = require('join-array');

/**
 * Función que procesa arreglo de objetos de un elemento y concatena en un string para utilizarlo en una consulta SQL.
 * @param {[Json]} data: Arreglo de objetos de un elemento.
 * @return {String}: Retorna string con información unida y cada elemento separado por comillas simples y comas.
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
        return { error };

    }

};

/**
 * Función que procesa arreglo simple de string y concatena en un string para utilizarlo en una consulta SQL.
 * @param {[String]} data: Arreglo de string.
 * @return {String}: Retorna string con información unida y cada elemento separado por comillas simples y comas.
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
        return { error }

    }

}

/**
 * Función que procesa arreglo de objeto, lo separa en bloques, cada bloque concatena los ruts en un string para utilizarlo en una consulta SQL.
 * @param {[Json]} salesGroup: Arreglo de objetos con información en donde una de las propiedades debe ser rut.
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
        return { error }

    }

}

/**
 * Función que itera un arreglo de objetos y devuelve bloques de acuerdo al maxímo indicado.
 * @param {[Json]} data: Arreglo de objetos con información.
 * @param {Integer} longitud: Variable que indica el límite de cada bloque.
 * @return {[json]}: Retorna arreglo de bloques.
 */
module.exports.divideScriptByGroup = async (data, longitud) => {

    try {

        /** DECLARAR VARIABLE QUE ALMACENA CADENA DE STRING Y BLOQUES. */
        let bloques = [];

        /** DIVIDIR EN GRUPOS EL OBJETO JSON EN PARTES QUE SE INDIQUEN. */
        for (let i = 0; i < data.length; i += longitud) { /** INDICA LA CANTIDAD TOTAL QUE TENDRÁN LOS BLOQUES. */
            /** INDICA LOS LIMITES DEL GRUPO. */
            let pedazo = data.slice(i, i + longitud);
            /** AGREGA GRUPO A VARIABLE BLOQUE. */
            bloques.push(pedazo);
        }

        /** RETORNO RESPUESTA. */
        return bloques;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { error }

    }

}

/**
 * Función que itera un arreglo de objetos y devuelve bloques de acuerdo al maxímo indicado.
 * @param {[Json]} object: Arreglo de objetos con información.
 * @param {Integer} identity: Variable que con indicador a agrupar.
 * @return {[json]}: Retorna arreglo de string.
 */
module.exports.objectToStringByIdentifier = async (object, identity) => {

    try {

        var data = object.map(key => {
            return key[identity]
        });

        const config = {
            array: data,
            separator: `', '`,
            last: `', '`,
            max: 1000000
        };

        let cadena = join(config); 
        cadena = "'" + cadena + "'";

        return cadena

    } catch (error) {
        
        console.log(error);
        return { error }

    }

}