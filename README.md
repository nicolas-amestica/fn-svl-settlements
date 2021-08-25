# FN-SVL-SETTLEMENTS
## Proyecto NodeJS serverless de automatización de proceso de liquidación.
### Las tecnologías utilizadas son:
- Azure function core tools.
- Nodejs v14.17.3
### Endpoints:
El proyecto contiene los siguientes endpoints:
#### I.- GET: {host}/finances/settlement/skuUpdater:
Insertar sku, category, name, seller_sku y facility de la base de datos de productos en tabla skus de la base de datos de finanzas.
Debe tener conexión a la base de datos de productos y finanzas.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```
#### II.- GET: {host}/finances/settlement/updateInternationalSales:
Identificar si las ventas pendientes de liquidar corresponden a ventas nacionales o internacionales.
Debe tener conexión a la base de datos de finanzas y usuarios.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```
#### III.- GET: {host}/finances/settlement/SvlPrincipal:
Generar un update a bigquery con informacióm obtenida de finanzas.
Debe tener conexión a la base de datos de finanzas y BigQuery.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```
#### IV.- GET: {host}/finances/settlement/skuReport:
Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía email con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```
#### VII.- GET: {host}/finances/settlement/finalReports:
Generar reporte finales de la liquidación, estos son: folios pendientes, ventas liquidadas y sellers loquidados.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave 'code' y valor ''
```

## INSTALACIÓN
### Instalar las siguientes dependencias:
Requiere [Node.js](https://nodejs.org/) v14.157.3.
```sh
- npm install
```
Iniciar proyecto

```sh
npm start
```