# Actualizar data con GibQuery

## Objetivo:

### Generar un update a bigquery con informacióm obtenida de finanzas. Esta información son folios con su respectivo sku, fullfilment_type y category.
Además, los folios son todos los que no han sido liquidados y con el campo cantidad mayor a 1.

## Utilización:

Las características del endpoint son las siguientes:

### GET: {}/finances/settlement/SvlPrincipal:

Generar un update a bigquery con informacióm obtenida de finanzas.
Debe tener conexión a la base de datos de finanzas y BigQuery.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```