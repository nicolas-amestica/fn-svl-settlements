# Generar reportes final de la liquidación

## Objetivo:

El objetivo de esta función es generar reporte final de liquidación de folios pendientes, ventas liquidadas y seller liquidados.
Específicamente, genera un reporte de todos los folios que cumplan, parcialmente, los requerimietos para ser liquidados. Genera otro reporte
de todas las ventas que se liquidaron el mismo día que se ejecuta la liquidación (ya que lo genera por fecha actual) y por último, genera
un reporte de los seller que fueron liquidados el mismo día que se ejecuta el endpoint.

Finalmente, sube los reportes a un blob storage y envía correo con enlaces para la descarga.

## Utilización:

Las características del endpoint son las siguientes:

### XII.- GET: {host}/api/finances/settlement/finalReports:

```sh
El endpoint tiene un params con clave 'code' y valor ''
```