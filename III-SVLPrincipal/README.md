# Actualizar data con BigQuery

## Objetivo:

Generar un update a bigquery con informacióm obtenida de finanzas.
La información son folios con su respectivo sku, fullfilment_type y category.
Además, los folios son todos los que no han sido liquidados y con el campo cantidad mayor a 1.

## Utilización:

Las características del endpoint son las siguientes:

### III.- GET: {host}/api/finances/settlement/SvlPrincipal:

Generar un update a bigquery con informacióm obtenida de finanzas.
Debe tener conexión a la base de datos de finanzas y BigQuery.

```sh
El endpoint tiene un params con clave 'code' y valor ''
```