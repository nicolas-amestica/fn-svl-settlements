# Generar reporte InformeSKU

## Objetivo:

Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía email con el enlace del archivo.
Específicamente, busca todos los folios que cumplan, parcialmente, los requerimietos para ser liquidados y que no tengan categoría.

## Utilización:

Las características del endpoint son las siguientes:

### IV.- GET: {host}/api/finances/settlement/skuReport:

Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía correo con el enlace del archivo.
Debe tener conexión a la base de datos de finanzas.

```sh
El endpoint tiene un params con clave 'code' y valor ''
```