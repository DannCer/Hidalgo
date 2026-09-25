#!/bin/bash
# Restaura los respaldos colocados en /backups (docker/db/backups en el host).
# Solo se ejecuta la PRIMERA vez que se crea el volumen de datos.
# Detecta el formato por contenido: pg_dump custom (-Fc, cabecera PGDMP)
# o SQL plano (.sql / .sql.gz), sin importar la extensión.
set -u
shopt -s nullglob

files=(/backups/*.sql /backups/*.sql.gz /backups/*.dump /backups/*.backup)
if [ ${#files[@]} -eq 0 ]; then
    echo "[restore] No hay respaldos en /backups, se omite."
    exit 0
fi

# Rol que aparece como dueño/permisos en el respaldo original
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -qc \
    "DO \$\$ BEGIN CREATE ROLE consulta NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END \$\$;"

for f in "${files[@]}"; do
    echo "[restore] Restaurando $f en $POSTGRES_DB ..."
    if [ "$(head -c 5 "$f")" = "PGDMP" ]; then
        pg_restore --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$f"
    elif [[ "$f" == *.gz ]]; then
        gunzip -c "$f" | psql -v ON_ERROR_STOP=0 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    else
        psql -v ON_ERROR_STOP=0 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
    fi
    echo "[restore] Terminado: $f (código $?)"
done
