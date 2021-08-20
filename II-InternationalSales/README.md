# Actualizar ventas internacionales

## Objetivo:

### Actualizar el campo international de las ventas de finanzas que no hayan sido liquidadas indicando si corresponden a ventas nacionales o internacionales.
El objetivo es identificar los folios que deben ser liquidados dado que solo se deben liquidar los nacionales.

## Utilización:
Las características del endpoint son las siguientes:
### GET: {}/finances/settlement/updateInternationalSales:
Actualizar el campo international de las ventas de finanzas.
Debe tener conexión a la base de datos de finanzas y usuarios.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```