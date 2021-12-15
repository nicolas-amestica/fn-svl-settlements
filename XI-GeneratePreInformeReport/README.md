# Generar Informe PreLiquidación

## Objetivo:

Generar reporte xlsx de los folios que se liquidarán, sube el archivo a blob storage y luego envía correo con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas.

## Utilización:
Las características del endpoint son las siguientes:

### XI.- GET: {host}/api/finances/v1/settlement/generatePreInformeReport:

```sh
El endpoint tiene un params con clave 'code' y valor ''
```