'use strict';
const fs = require('fs').promises;
const ObjectsToCsv = require('objects-to-csv-file');

/**
 * Eliminar el archivo csv ubicado en carpeta temporal.
 * @param {String} filePath: Ruta del archivo que está en carpeta temporal.
 * @return {[Json]}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.deleteFile = async (filePath) => {

    try {

        /** FUNCIÓN QUE ELIMINA UN ARCHIVO A BASE DE UNA URL. */
        await fs.unlink(filePath);

        /** RETORNA RESPUESTA. */
        return true;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};

/**
 * Exportar datos a un archivo csv. Este es almacenado en la carpeta temporal tmp ubicada en la raíz del proyecto.
 * @param {[Json]} data: Arreglo de objetos.
 * @param {String} fileName: Nombre del archivo a generar.
 * @return {[Json]}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.exportDataToCSV = async (data, fileName) => {

    try {

        /** CREAR LA RUTA COMPLETA DE LA UBICACIÓN DEL ARCHIVO CSV. */
        const fullPathFile = `${process.env.TMP_FOLDER}${fileName}.csv`;

        /** CASTEAR DATA A CSV. */
        const csv = new ObjectsToCsv(data);
        if (!csv)
            throw 'No se pudieron serializar los datos.';

        /** GUARDAR DATA QUE ESTÁ EN LA VARIABLE CSV A UN ARCHIVO CSV. */
        const result = await csv.toDisk(fullPathFile, { header: true, delimiter: ';' });
        if (!result)
            throw 'No se pudo generar el archivo CSV.';

        /** RETORNA RESPUESTA. */
        return { name: `${fileName}.csv`, path: fullPathFile, result };

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};