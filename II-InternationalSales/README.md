# Actualizar ventas internacionales

## Objetivo:

Actualizar el campo international de las ventas de finanzas que no hayan sido liquidadas indicando si corresponden a ventas nacionales o internacionales.

## Utilización:

Las características del endpoint son las siguientes:

### II.- GET: {host}/api/finances/settlement/updateInternationalSales:
Identificar si las ventas pendientes de liquidar corresponden a ventas nacionales o internacionales.
Debe tener conexión a la base de datos de finanzas y usuarios.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```