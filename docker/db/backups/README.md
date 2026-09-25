# Respaldos de la base de datos

Coloca aquí los respaldos (`.sql`, `.sql.gz`, `.dump` o `.backup`). Se restauran
automáticamente en la base `${POSTGRES_DB}` **solo la primera vez** que se crea
el volumen `pgdata`.

Para volver a restaurar desde cero:

```bash
docker compose down -v   # borra los volúmenes (datos de BD y GeoServer)
docker compose up -d --build
```
