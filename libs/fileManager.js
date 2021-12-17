'use strict';
const fs = require('fs').promises;
const ObjectsToCsv = require('objects-to-csv-file');
const XLSX = require('xlsx')
const compressing = require('compressing');

/**
 * Eliminar el archivo csv ubicado en la ruta que se indique.
 * @param {String} filePath: Ruta del archivo.
 * @return {[Json]}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.deleteFile = async (filePath) => {

    try {

        /** FUNCIÓN QUE ELIMINA UN ARCHIVO. */
        await fs.unlink(filePath);

        /** RETORNA RESPUESTA. */
        return true;

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Eliminar directorio.
 * @param {String} folderPath: Ruta del directorio.
 * @param {Json} recursive: Json con variable recursive de tipo boolean que indica si es recursivo o no.
 * @return {boolean}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.deleteFolder = async (folderPath, recursive) => {

    try {

        /** FUNCIÓN QUE ELIMINA EL DIRECTORIO INDICADO SI ES RECURSIVO. */
        await fs.rmdir(folderPath, recursive);

        /** RETORNA RESPUESTA. */
        return true;

    } catch (error) {

        /** RETORNA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Exportar datos a un archivo csv.
 * @param {Json} data: Objeto que contiene la data a exportar.
 * @param {String} fileName: Nombre del archivo que se quiere generar.
 * @return {Json}: Retorna objeto JSON con nombre del archivo y ruta, si falla retorna expceción.
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
        return { name: `${fileName}.csv`, path: fullPathFile };

    } catch (error) {

        /** RETORNA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Exportar datos a un archivo csv. Este es almacenado en la carpeta temporal tmp ubicada en la raíz del proyecto.
 * @param {[Json]} data: Arreglo de objetos que contiene data, name.
 * @param {String} fileName: Nombre del archivo a generar.
 * @return {String}: Respuesta String que indica la ruta y nombre del archivo que se generó, si falla envía una expceción.
 */
module.exports.exportToXlsxFromObject = async (data, fileName) => {

    try {

        /** CREAR LIBRO XLSX. */
        const libro = XLSX.utils.book_new();

        /** ITERAR DATA DE OBJETOS Y ALMACENAR EN MEMORIA EN LIBRO. */
        for (const element of Object.keys(data)) {
            let ws = XLSX.utils.json_to_sheet(data[element].data)
            XLSX.utils.book_append_sheet(libro, ws, String(data[element].name))
        }

        /** ESCRIBIR LIBRO CON DATA XLSX */
        await XLSX.writeFile(libro, `${process.env.TMP_FOLDER}${fileName}.xlsx`);

        /** RETORNA RESPUESTA. */
        return `${process.env.TMP_FOLDER}${fileName}.xlsx`;

    } catch (error) {

        /** RETORNA EXCEPCIÓN. */
        return { error };

    }

};

/**
 * Comprimir archivo.
 * @param {Json} data: Objeto que contiene propiedades 'name' y 'path' (incluyen extensión).
 * @return {Json}: Retorna objeto JSON con nombre del archivo y ruta, si falla retorna expceción.
 */
module.exports.compressingFile = async (data) => {

    try {

        let extension = '.gzip';

        let result = await compressing.gzip.compressFile(data.path, `${data.path}${extension}`)

        if (result !== undefined)
            throw 'No se pudo comprimir el archivo';

        result = {
            name: `${data.name}${extension}`,
            path: `${data.path}${extension}`
        }

        return result

    } catch (error) {

        /** CAPTURA EXCEPCIÓN. */
        return { error };

    }

};