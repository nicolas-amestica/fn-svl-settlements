# FN-SVL-SETTLEMENTS

## Proyecto NodeJS serverless de automatización de proceso de liquidación.

### Las tecnologías utilizadas son:

- Azure function core tools.
- Nodejs v14.17.3

### Endpoints:

El proyecto contiene los siguientes endpoints:

#### I.- GET: {host}/api/finances/settlement/skuUpdater:
Insertar sku, category, name, seller_sku y facility de la base de datos de productos en tabla skus de la base de datos de finanzas.
Debe tener conexión a la base de datos de productos y finanzas.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### II.- GET: {host}/api/finances/settlement/updateInternationalSales:
Identificar si las ventas pendientes de liquidar corresponden a ventas nacionales o internacionales.
Debe tener conexión a la base de datos de finanzas y usuarios.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### III.- GET: {host}/api/finances/settlement/SvlPrincipal:
Generar un update a bigquery con informacióm obtenida de finanzas.
Debe tener conexión a la base de datos de finanzas y BigQuery.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### IV.- GET: {host}/api/finances/settlement/skuReport:
Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía correo con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### V.- GET: {host}/api/finances/settlement/generateGCPReport:
Generar reporte xlsx de folios pendientes, sin cateogoría, sin despacho y cancelados desde GCP, luego envía correo con el archivo.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### VI.- GET: {host}/api/finances/v1/settlement/updatePendingGCP:
Actualiza los folios pendientes en finanzas con la data traida de GCP.
Debe tener conexión a la base de datos de finanzas y GCP.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### VII.- GET: {host}/api/finances/v1/settlement/updateCategoryGCP:
Actualiza los folios sin categoría en finanzas con la data traida de GCP.
Debe tener conexión a la base de datos de finanzas y GCP.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### VIII.- GET: {host}/api/finances/v1/settlement/updateCanceledGCP:
Actualiza los folios cancelados en finanzas con la data traida de GCP.
Debe tener conexión a la base de datos de finanzas y GCP.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### IX.- GET: {host}/api/finances/v1/settlement/updateDispatchGCP:
Actualiza los folios sin despacho en finanzas con la data traida de GCP.
Debe tener conexión a la base de datos de finanzas y GCP.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### X.- GET: {host}/api/finances/v1/settlement/assignCommissions:
Actualiza categoría, product_com y calcula descuentos y comisiones a las ventas.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### XI.- GET: {host}/api/finances/v1/settlement/generatePreInformeReport:
Generar reporte xlsx de los folios que se liquidarán, sube el archivo a blob storage y luego envía correo con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

#### XII.- GET: {host}/api/finances/settlement/finalReports:
Genera reportes finales de la liquidación, estos son: folios pendientes, ventas liquidadas y sellers loquidados.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint tiene un params con clave 'code' y valor ''
```

## INSTALACIÓN

### Instalar las siguientes dependencias:

#### Nodejs
Requiere [Node.js](https://nodejs.org/) v14.157.3.
```sh
- npm install
```
Modificar la hora de ejecución en function.js e iniciar proyecto.

```sh
npm start
```

#### Azure Functions Core Tools

Requiere [Azure Function Core Tools] (https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash%2Ckeda) v3
```sh
- brew tap azure/functions
```
```sh
- brew install azure-functions-core-tools@3
```
Si estás subiendo de versión desde la 2.0x instala lo siguiente:
```sh
- brew link --overwrite azure-functions-core-tools@3
```