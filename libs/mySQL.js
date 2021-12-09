'use strict';
const sql = require('mssql')

/** VARIABLE QUE CONFIGURA LAS VARIABLES DE CONEXIÓN. */
let configFinanzas = {
    server: process.env.DB_HOST_FINANCES_HOST,
    database: process.env.DB_HOST_FINANCES_DBNAME,
    user: process.env.DB_HOST_FINANCES_USER,
    password: process.env.DB_HOST_FINANCES_PASSWORD,
    multipleStatements: true,
    requestTimeout: 180000,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};

let configFinanzasTEST = {
    server: process.env.DB_TEST_HOST_FINANCES_HOST,
    database: process.env.DB_TEST_HOST_FINANCES_DBNAME,
    user: process.env.DB_TEST_HOST_FINANCES_USER,
    password: process.env.DB_TEST_HOST_FINANCES_PASSWORD,
    multipleStatements: true,
    requestTimeout: 180000,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};

/** VARIABLE QUE CONFIGURA LAS VARIABLES DE CONEXIÓN. */
let configUsuarios = {
    server: process.env.DB_HOST_USERS_HOST,
    database: process.env.DB_HOST_USERS_DBNAME,
    user: process.env.DB_HOST_USERS_USER,
    password: process.env.DB_HOST_USERS_PASSWORD,
    multipleStatements: true,
    requestTimeout: 180000,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};

/** VARIABLE QUE CONFIGURA LAS VARIABLES DE CONEXIÓN. */
let configProductos = {
    server: process.env.DB_HOST_PRODUCTS_HOST,
    database: process.env.DB_HOST_PRODUCTS_DBNAME,
    user: process.env.DB_HOST_PRODUCTS_USER,
    password: process.env.DB_HOST_PRODUCTS_PASSWORD,
    multipleStatements: true,
    requestTimeout: 180000,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};

/**
 * Función que valida que todos los campos de la conexión existan.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.validarConexionFinanzas = async () => {

    let message = [];

    if (!configFinanzas.server)
        message.push("No está configurado el host del servidor de base de datos");

    if (!configFinanzas.database)
        message.push("No está configurado el nombre del servidor de base de datos");

    if (!configFinanzas.user)
        message.push("No está configurado el usuario del servidor de base de datos");

    if (!configFinanzas.password)
        message.push("No está configurada la clave del servidor de base de datos");

    return message;

}

/**
 * Función que valida que todos los campos de la conexión existan.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.validarConexionUsuarios = async () => {

    let message = [];

    if (!configUsuarios.server)
        message.push("No está configurado el host del servidor de base de datos");

    if (!configUsuarios.database)
        message.push("No está configurado el nombre del servidor de base de datos");

    if (!configUsuarios.user)
        message.push("No está configurado el usuario del servidor de base de datos");

    if (!configUsuarios.password)
        message.push("No está configurada la clave del servidor de base de datos");

    return message;

}

/**
 * Función que valida que todos los campos de la conexión existan.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.validarConexionProductos = async () => {

    let message = [];

    if (!configProductos.server)
        message.push("No está configurado el host del servidor de base de datos");

    if (!configProductos.database)
        message.push("No está configurado el nombre del servidor de base de datos");

    if (!configProductos.user)
        message.push("No está configurado el usuario del servidor de base de datos");

    if (!configProductos.password)
        message.push("No está configurada la clave del servidor de base de datos");

    return message;

}

/**
 * Función que ejecuta la consulta sql que se ingrese.
 * @param {String} query: String que contiene la query a ejecutar.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.updateSale = async (query) => {

    try {

        const conn = await sql.connect(configFinanzas);

        const result = await conn.request().query(query);

        sql.close();

        return result.rowsAffected[0];

    } catch (error) {

        return { error: error.originalError }

    }

};

/**
 * Función que ejecuta la consulta sql que se ingrese.
 * @param {String} query: String que contiene la query a ejecutar.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.getDataFinances = async (query) => {

    try {

        const conn = await sql.connect(configFinanzas);

        const result = await conn.request().query(query);

        sql.close();

        return result.recordset;

    } catch (error) {

        return { error: error.originalError }

    }

};

/**
 * Función que ejecuta la consulta sql que se ingrese.
 * @param {String} query: String que contiene la query a ejecutar.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
module.exports.executeProcedureFinances = async (query) => {

    try {

        const conn = await sql.connect(configFinanzas);

        const result = await conn.request().query(query);

        sql.close();

        return result;

    } catch (error) {

        return { error: error.originalError }

    }

};

/**
 * Función que ejecuta la consulta sql que se ingrese.
 * @param {String} query: String que contiene la query a ejecutar.
 * @return {String}: Respuesta de la función con la información procesada en la function, incluye respuesta satisfactoria o fallo.
 */
 module.exports.getDataUsers = async (query) => {

    try {

        const conn = await sql.connect(configUsuarios);

        const result = await conn.request().query(query);

        sql.close();

        return result.recordset;

    } catch (error) {

        return { error: error.originalError }

    }

};

/** EXPONER VARIABLES DE CONFIGURACIÓN DE LA CONEXIÓN A LA BASE DE DATOS. */
exports.configFinanzas = configFinanzas;
exports.configUsuarios = configUsuarios;
exports.configProductos = configProductos;