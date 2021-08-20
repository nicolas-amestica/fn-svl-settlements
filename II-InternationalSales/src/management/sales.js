'use strict';
const sql = require("mssql");
const mySQL = require('../../../common/mySQL');
const queryGenerator = require('../../../common/queryGenerator');
const groupBy = require('lodash.groupby');


/**
 * Obtiene los folios desde la base de datos de finanzas.
 * @return {[Json]}: Respuesta JSON que contiene data y name de folios pendientes y sin sku, si falla retorna excepción.
 */
module.exports.getDataFinance = async () => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a finanzas.' }, error: {} };
        let pool = await sql.connect(mySQL.configFinanzas);

        /** QUERY. */
        const query = `
            SELECT
                DISTINCT rut AS RUT
            FROM
                sales
            WHERE
                origin = 'SVL'
                AND folio NOT IN ('0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8', '-9', '-10', '-11')
                AND quantity > 0
                AND (closeout_number = 0 OR closeout_number IS NULL)
                AND (international = -1 OR international IS NULL)
            `;

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 400, body: { error: 'No se pudo consultar los datos de finanzas.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** RETORNO RESPUESTA. */
        return { data: data.recordset }

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo obtener la información de la base de datos.', detalle: error }, error: {} };

    }

};

/**
 * Subir archivo a Azure Blob Storage.
 * @param {[Json]} objRuts: Arreglo de objetos con rut a consultar si es que son nacionales o internacionales.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del mapeo de rut nacionales e internacionales, incluye respuesta satisfactoria o fallo.
 */
module.exports.getDataUser = async (objRuts) => {

    try {

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        let valida = await mySQL.validarConexionUsuarios();
        if (valida.length > 0) return { status: 400, body: { error: 'No se pudo validar la conexión a usuarios.' }, error: {} };
        let pool = await sql.connect(mySQL.configUsuarios);

        /** QUERY. */
        const query = `
            SELECT
                companies.rut AS RUT,
                CASE
                    WHEN companies.svl_country_id = communes.country_id
                    THEN 0
                    ELSE 1
                END AS INTERNATIONAL
            FROM
                companies,
                communes
            WHERE
                companies.commune_id = communes.id
                AND companies.rut IN (${(await queryGenerator.inQueryGenerator(objRuts)).replace(/["]+/g, '')});
            `;

        /** EJECUCIÓN DE QUERY. */
        const data = await pool.request().query(query);
        if (!data)
            return { status: 400, body: { error: 'No se pudo consultar los datos de usuarios.' }, error: {} };

        /** CERRAR CONEXIÓN A SQL. */
        sql.close();

        /** QUITAR RUT DUPLICADOS. */
        let set = new Set(data.recordset.map(JSON.stringify))
        let internationalSales = Array.from(set).map(JSON.parse);

        /** RETORNO RESPUESTA. */
        return internationalSales;

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return { status: 400, body: { error: 'No se pudo obtener la información de la base de datos.', detalle: error }, error: {} };

    }

}

/**
 * Subir archivo a Azure Blob Storage.
 * @param {[Json]} internationalSales: Arreglo de objetos con ventas indicando si son nacionales o internacionales.
 * @return {json}: Respuesta JSON de la función que retorna el resultado del mapeo de rut nacionales e internacionales, incluye respuesta satisfactoria o fallo.
 */
module.exports.updateDataVentasInternacionales = async (internationalSales) => {

    try {

        let groups = groupBy(internationalSales , 'INTERNATIONAL');

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        // let valida = await conexion.validarConexionFinanzas();
        // if (valida.length > 0) throw valida;
        // const pool = new sql.ConnectionPool(conexion.configFinanzas);
        // const poolConnect = pool.connect();

        for (const group of Object.keys(groups)) {

            let result = await queryGenerator.divideScript(groups[group]);

            result.forEach(sRuts => {
                let query = `UPDATE sales SET international = ${group} WHERE RUT IN (${sRuts}) AND folio NOT IN ('0','-1','-2','-3','-4','-5','-6','-7','-8','-9','-10','-11') AND quantity > 0 AND (closeout_number IS NULL OR closeout_number = 0) AND origin = 'SVL' AND (international = -1 OR international IS NULL)`;
                // await poolConnect;
                // const request = pool.request();
                // const RESULT = await request.query(query);
            });

        };

        // Cerrar pool de conexión.
        // pool.close();

        /** RETORNO RESPUESTA. */
        return { TOTAL_GRUPOS: Object.keys(groups).length, TOTAL_SUBGRUPOS: cont};

    } catch (error) {

        /** RETORNO RESPUESTA. */
        console.log(error);
        return error;

    }

};