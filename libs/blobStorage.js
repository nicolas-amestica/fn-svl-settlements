'use strict';
const { BlobServiceClient } = require('@azure/storage-blob');

/**
 * Función que sube archivos locales al blob Storage de AZURE.
 * @param {String} containerName: Nombre del blobstorage.
 * @param {String} fileName: Nombre del arcvivo.
 * @param {String} filePath: Ruta del archivo.
 * @return {[Json]}: Respuesta JSON que contiene el detalle de la acción realizada (incluye la URL del archivo), si falla retorna expceción.
 */
module.exports.uploadFileFromLocal = async (containerName, fileName, filePath) => {

    try {

        /** CONFIGURACIÓN DEL BLOB STORAGE. */
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        /** SUBIR ARCHIVO. */
        let uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
        if (uploadBlobResponse.error)
            throw uploadBlobResponse.error

        /** AGREGAR URL DEL ARCHIVO A RESPUESTA. */
        uploadBlobResponse.url = blockBlobClient.url;

        /** QUITAR CONTENIDO ESPEFÍFICO A RESPUESTA ANTES DE ENVIAR. */
        delete uploadBlobResponse.contentMD5;

        /** RETORNA RESPUESTA. */
        return uploadBlobResponse;

    } catch (error) {

        /** RETORNA EXCEPCIÓN. */
        return { error }

    }

}