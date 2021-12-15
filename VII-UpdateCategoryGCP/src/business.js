'use-strinct'
const GCP = require('../../libs/gcloud');
const GroupBy = require('lodash.groupby');
const QueryGenerator = require('../../libs/queryGenerator')
const MySQL = require('../../libs/mySQL')

/**
 * Obtiene datos de GCP.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.getDataGcp = async (context) => {

    try {

        /* EJECUTAR BIGQUERYS */
        context.log("OBTENIENDO INFORMACIÓN DE GCP");

        /* BIGQUERYS */
        const sql_categorias_dwh = `WITH db_mrk_productos AS( SELECT Distinct(ID_SKU) AS id_sku, ID_SUBCLASE FROM flb-rtl-dtl-marketplace-corp.datalake_retail.dbmark_lk_productos_inv WHERE CTIP_PRD = 'L' AND DATE(_PARTITIONTIME) > date_sub(current_date, interval 5 day) ) SELECT db_mrk_productos.ID_SKU AS id_sku, db_mrk_productos.ID_SUBCLASE AS id_subclase, svl_finanzas.folio AS folio, svl_finanzas.fulfillment_type AS fulfillment_type FROM flb-rtl-dtl-marketplace-corp.pago_seller._svl_finanzas AS svl_finanzas JOIN db_mrk_productos ON svl_finanzas.sku = db_mrk_productos.ID_SKU WHERE svl_finanzas.category = 'null'`;

        const categorias_dwh = { query: sql_categorias_dwh, location: 'US' };

        let sinCategoriaToArray = [];

        const [rsin] = await GCP.select(categorias_dwh);

        /* INICIO RECORRIDO POR FOLIO */
        context.log("INICIO LECTURA DE DATA OBTENIDA");

        /* ITERACIÓN DATA RSIN */
        for (const data of rsin) {

            // FOLIOS SIN CATEGORIA
            data.folio = data.folio.c.join("");
            data.sku = data.id_sku.c.join("");
            sinCategoriaToArray.push(data);

        }

        /* RETORNO RESPUESTA */
        return sinCategoriaToArray

    } catch (error) {

        /* RETORNO EXCEPCIÓN */
        return { error }

    }

};

/**
 * Actualizar data en base de datos finanzas.
 * @param {[Json]} data: Arreglo de objeto que tiene la información de los folios.
 * @return {Json}: Respuesta JSON que contiene respuesta del resultado de proceso, si falla retorna excepción.
 */
module.exports.updateData = async (context, data) => {

    try {

        context.log('AGRUPANDO VENTAS');

        /** AGRUPAR FOLIOS POR CAMPO CATEGORY. */
        let groups = await GroupBy(data, 'id_subclase');

        context.log('ACTUALIZANDO VENTAS');

        cont = 0;

        /** ACTUALIZAR DATA. */
        for (const sale of Object.keys(groups)) {

            let divide;
            let result;
            let divider = 10000
            let query;

            if (groups[sale].length > divider) {
                divide = await QueryGenerator.divideScriptByGroup(groups[sale], divider);
                if (divide.length > 1) {
                    context.log(`Categoría ${sale} tiene ${divide.length} grupos a ejecutar de un total de ${groups[sale].length} skus.`);
                    for (const dividerSale of divide) {
                        query = `UPDATE sales SET category = '${sale}', updatedAt = getDate() WHERE sku IN (${await QueryGenerator.objectToStringByIdentifier(dividerSale, "sku")}) AND origin = 'SVL' AND category IS NULL AND (closeout_number IS NULL OR closeout_number = 0)`;
                        result = await MySQL.updateSale(query);
                        cont++
                        context.log(`* ${sale} (${cont}): ${result} updated.`);

                        if (result.error)
                            throw result.error;
                    }
                }
            } else {
                query = `UPDATE sales SET category = '${sale}', updatedAt = getDate() WHERE sku IN (${await QueryGenerator.objectToStringByIdentifier(groups[sale], "sku")}) AND origin = 'SVL' AND category IS NULL AND (closeout_number IS NULL OR closeout_number = 0)`;
                result = await MySQL.updateSale(query);
                context.log(`${sale}: ${result} updated.`);
                cont++

                if (result.error)
                    throw result.error;
            }
        }

        let res = await MySQL.closeConnection();
        if (res.error)
            throw res.error

        /** RETORNO RESPUESTA. */
        return { 'Total grupos a actualizar': Object.keys(groups).length, 'Total actualizadas': cont };

    } catch (error) {

        /** RETORNO EXCEPCIÓN. */
        return { error };

    }

};