# Generar reporte InformeSKU

##### Objetivo:

Generar reporte xlsx de los folios pendientes y folios sin categorías, sube el archivo a blob storage y luego envía email con el enlace del archivo.
Específicamente, busca todos los folios que cumplan, parcialmente, los requerimietos para ser liquidados y que no tengan categoría.

##### Utilización:
```sh
    El endpoint no contiene body.
    El endpoint tiene un params con clave code y valor
```