#!/bin/sh
# Configura GeoServer vía REST (idempotente):
#  - workspace $GEOSERVER_WORKSPACE
#  - un datastore PostGIS por esquema usado en layers.txt
#  - publica cada capa de layers.txt con el nombre que espera el front
set -eu
apk add --no-cache curl >/dev/null

GS="http://geoserver:8080/geoserver/rest"
AUTH="$GEOSERVER_ADMIN_USER:$GEOSERVER_ADMIN_PASSWORD"
WS="$GEOSERVER_WORKSPACE"
LAYERS=/layers.txt

gs() { curl -sf -u "$AUTH" "$@"; }

echo "[gs-init] Esperando GeoServer..."
until gs "$GS/about/version.json" >/dev/null; do sleep 5; done

if ! gs "$GS/workspaces/$WS.json" >/dev/null; then
    echo "[gs-init] Creando workspace $WS"
    gs -XPOST -H 'Content-Type: application/json' \
        -d "{\"workspace\":{\"name\":\"$WS\"}}" "$GS/workspaces" >/dev/null
fi

for schema in $(grep -vE '^\s*(#|$)' "$LAYERS" | awk '{print $2}' | sort -u); do
    gs "$GS/workspaces/$WS/datastores/$schema.json" >/dev/null && continue
    echo "[gs-init] Creando datastore $schema"
    gs -XPOST -H 'Content-Type: application/json' "$GS/workspaces/$WS/datastores" -d "{
      \"dataStore\": {
        \"name\": \"$schema\",
        \"connectionParameters\": { \"entry\": [
          {\"@key\":\"dbtype\",\"\$\":\"postgis\"},
          {\"@key\":\"host\",\"\$\":\"db\"},
          {\"@key\":\"port\",\"\$\":\"5432\"},
          {\"@key\":\"database\",\"\$\":\"$POSTGRES_DB\"},
          {\"@key\":\"schema\",\"\$\":\"$schema\"},
          {\"@key\":\"user\",\"\$\":\"$POSTGRES_USER\"},
          {\"@key\":\"passwd\",\"\$\":\"$POSTGRES_PASSWORD\"},
          {\"@key\":\"Expose primary keys\",\"\$\":\"true\"}
        ]}
      }
    }" >/dev/null
done

grep -vE '^\s*(#|$)' "$LAYERS" | while read -r name schema native; do
    if gs "$GS/layers/$WS:$name.json" >/dev/null; then
        continue
    fi
    if gs -XPOST -H 'Content-Type: application/json' \
        -d "{\"featureType\":{\"name\":\"$name\",\"nativeName\":\"$native\"}}" \
        "$GS/workspaces/$WS/datastores/$schema/featuretypes" >/dev/null; then
        echo "[gs-init] ✔ $WS:$name  <-  $schema.$native"
    else
        echo "[gs-init] ✘ $WS:$name  <-  $schema.$native (no existe o sin geometría)"
    fi
done
echo "[gs-init] Listo."
