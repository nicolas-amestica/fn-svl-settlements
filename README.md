# FN-SVL-SETTLEMENTS
## Proyecto NodeJS serverless de automatización de proceso de liquidación.
### Las tecnologías utilizadas son:
- Azure function core tools.
- Nodejs v14.17.3
### Endpoints:
El proyecto contiene los siguientes endpoints:

#### GET: skuReport:
Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía email con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas.
```sh
El endpoint no contiene body.
El endpoint tiene un params con clave code y valor 
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