'use strict';
const sql = require("mssql");
const mySQL = require('../../../libs/mySQL');
const queryGenerator = require('../../../libs/queryGenerator');
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
 * Obtiene companies desde la base de datos de usuarios.
 * @param {[Json]} objRuts: Arreglo de objetos con rut a consultar indicando si son companies nacionales o internacionales.
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
                companies.deleted_At IS NULL
                AND companies.commune_id = communes.id
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
 * Actualizar ventas indicando si son ventas nacionales o internacionales.
 * @param {[Json]} internationalSales: Arreglo de objetos con ventas indicando si son nacionales o internacionales.
 * @return {json}: Respuesta JSON de la función que retorna el resultado de la actualización del campo international de las ventas, si falla retorna excepción.
 */
module.exports.updateDataVentasInternacionales = async (internationalSales) => {

    try {

        /** AGRUPAR VENTAS POR CAMPO INTERNATIONAL. */
        let groups = groupBy(internationalSales , 'INTERNATIONAL');

        /** CREAR CONEXIÓN A BASE DE DATOS MYSQL. */
        let valida = await mySQL.validarConexionFinanzas();
        if (valida.length > 0) throw valida;
        const pool = new sql.ConnectionPool(mySQL.configFinanzas);
        const poolConnect = pool.connect();

        let cont = 0;

        /** ITERAR GRUPOS. */
        for (const group of Object.keys(groups)) {

            /** ITERAR GRUPO Y LOS SUBAGRUPA EN BLOQUES DE 15000 PARA EVITAR QUE LA QUERY COLPASE EN EL WHERE IN (). */
            let result = await queryGenerator.divideScriptByRut(groups[group]);

            /** ITERAR SUBGRUPOS. */
            result.forEach(async sRuts => {

                cont = cont + sRuts.length;

                /** DECLARAR QUERY. */
                let query = `UPDATE sales SET international = ${group} WHERE RUT IN (${sRuts}) AND folio NOT IN ('0','-1','-2','-3','-4','-5','-6','-7','-8','-9','-10','-11') AND quantity > 0 AND (closeout_number IS NULL OR closeout_number = 0) AND origin = 'SVL' AND (international = -1 OR international IS NULL)`;

                /** EJECUTAR CONSULTA SQL. */
                await poolConnect;
                const request = pool.request();
                const resultSQL = await request.query(query);
            });

        };

        /** CERRAR POOL DE CONEXIÓN. */
        if (Object.keys(groups).length > 0)
            pool.close();

        /** RETORNO RESPUESTA. */
        return { TOTAL_GRUPOS: Object.keys(groups).length, TOTAL_RUTS: cont};

    } catch (error) {

        /** CAPTURA ERROR. */
        console.log(error);
        return error;

    }

};