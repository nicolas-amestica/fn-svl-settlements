'use strict';
// const AzureStorage = require('azure-storage');
const { BlobServiceClient } = require('@azure/storage-blob');

/**
 * Función que expone el establecimiento de la conexión al blob storage.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.uploadLocalFile = async (containerName, fileName, filePath) => {

    try {

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        let uploadBlobResponse = await blockBlobClient.uploadFile(filePath);

        if (uploadBlobResponse.error)
            throw uploadBlobResponse.error

        uploadBlobResponse.url = blockBlobClient.url;
        
        delete uploadBlobResponse.contentMD5;

        return uploadBlobResponse;

    } catch (error) {

        return error

    }

}