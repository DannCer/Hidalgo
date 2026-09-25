# ---------- Etapa 1: build de la SPA ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variables VITE_* (se incrustan en el bundle en tiempo de build).
# GEOSERVER_URL vacío => peticiones relativas a /geoserver, que nginx
# reenvía al GeoServer real (sin problemas de CORS).
ARG VITE_GEOSERVER_URL=""
ARG VITE_GEOSERVER_WORKSPACE=Hidalgo
ARG VITE_WFS_TIMEOUT=30000
ARG VITE_MAX_FEATURES=5000
ARG VITE_DEBUG_MODE=false
ENV VITE_GEOSERVER_URL=$VITE_GEOSERVER_URL \
    VITE_GEOSERVER_WORKSPACE=$VITE_GEOSERVER_WORKSPACE \
    VITE_WFS_TIMEOUT=$VITE_WFS_TIMEOUT \
    VITE_MAX_FEATURES=$VITE_MAX_FEATURES \
    VITE_DEBUG_MODE=$VITE_DEBUG_MODE

RUN npm run build

# ---------- Etapa 2: servir con nginx ----------
FROM nginx:1.27-alpine

# URL del GeoServer al que se hace proxy (configurable en runtime)
ENV GEOSERVER_UPSTREAM=http://host.docker.internal:8080

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/WEB-INF

EXPOSE 80
