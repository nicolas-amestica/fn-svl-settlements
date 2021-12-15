# Inserción de sku de productos a finanzas

## Objetivo:

Toma los skus del día anterior y los inserta en la base de datos de finanzas.

## Utilización:

Las características del endpoint son las siguientes:

### I.- GET: {host}/api/finances/settlement/skuUpdater:

Insertar sku, category, name, seller_sku y facility de la base de datos de productos en tabla skus de la base de datos de finanzas.
Debe tener conexión a la base de datos de productos y finanzas.

```sh
El endpoint tiene un params con clave 'code' y valor ''
```