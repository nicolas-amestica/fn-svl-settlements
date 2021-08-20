'use strict';

// RECIBER ARREGLO DE OBJETOS DE UN ELEMENTO Y DEVUELVE UN STRING CONCATENADO.
module.exports.inQueryGenerator = async (data) => {

    try {

        let cadena = [];
        
        data.forEach(obj => {
            Object.entries(obj).forEach(([key, value]) => {
                cadena.push(value)
            });
        });

        let sData = cadena.join("','")

        sData = `'${sData}'`;

        return sData;

    } catch (error) {

        console.log(error);
        return error;

    }

};

// RECIBER ARREGLO SIMPLE Y DEVUELVE UN STRING CONCATENADO.
module.exports.inQueryGeneratorString = async (data) => {

    try {

        let sData = data.join(`','`)
        sData = `'${sData}'`;

        return sData

    } catch (error) {

        return error;

    }

}

// DIVIDE ARREGLO DE OBJETOS POR RUT EN BLOQUES Y DEVUELVE CADENA CONCATENADA DE STRING RUT.
module.exports.divideScript = async (salesGroup) => {

    try {

        let bloques = [];
        let arrCadena = [];

        // ALMACENAR TODOS LAS ÓRDENES EN EL ARREGLO (AÚN NO SE DIVIDEN).
        for (const sales of Object.keys(salesGroup)) {
            arrCadena.push(salesGroup[sales].RUT);
        }

        // DIVIDIR ARREGLOS EN BLOQUES DE 15000 ÓRDENES.
        if (arrCadena.length > 0) {
            const LONGITUD_PEDAZOS = 15000; // Partir en arreglo de 10
            for (let i = 0; i < arrCadena.length; i += LONGITUD_PEDAZOS) {
                let pedazo = arrCadena.slice(i, i + LONGITUD_PEDAZOS);
                // SE AGREGA SCRIPT GENERADO EN ARREGLO.
                let cadenaRut = await this.inQueryGeneratorString(pedazo)
                bloques.push(cadenaRut);
            }
        }

        return bloques;

    } catch (error) {

        console.log(error);
        return error

    }

}