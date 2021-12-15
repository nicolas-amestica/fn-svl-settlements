# Generar reporte GCP

## Objetivo:

Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía email con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas y GCP.

## Utilización:

Las características del endpoint son las siguientes:

### V.- GET: {host}/api/finances/settlement/generateGCPReport:

```sh
El endpoint tiene un params con clave 'code' y valor ''
```