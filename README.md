# 🌊 Observatorio Estatal Hídrico - Geovisor

Visor geográfico interactivo para la gestión y monitoreo de recursos hídricos del estado de Hidalgo, México.

---

## 📋 Descripción

El **Observatorio Estatal Hídrico** es una aplicación web que permite visualizar, analizar y descargar información geoespacial relacionada con los recursos hídricos del estado de Hidalgo. El geovisor se conecta a un servidor GeoServer para obtener capas WFS/WMS y presenta la información de manera interactiva sobre un mapa base.

### Temáticas disponibles

- 🗺️ **Contexto geográfico y demográfico** - Municipios, localidades, regiones
- 💧 **Calidad del agua** - Sitios de monitoreo, parámetros e indicadores
- 🌾 **Uso del agua** - Uso consuntivo, productividad agrícola
- 🏜️ **Riesgos** - Monitor de sequía con línea de tiempo histórica
- 🌍 **Acuíferos** - Información de acuíferos del estado

---

## ✨ Características

- 🗺️ **Visualización de capas geográficas** con Leaflet
- ⏱️ **Timeline interactivo** para datos temporales (sequías por quincena)
- 📊 **Tablas de atributos** con filtros y búsqueda
- 📥 **Descarga de datos** en formatos Shapefile y Excel
- 🎨 **Leyendas dinámicas** que se adaptan a las capas activas
- 📱 **Diseño responsive** para escritorio y móviles
- 🖱️ **Popups informativos** al hacer clic en features
- 🔍 **Múltiples capas base** (satélite, calles, topográfico)
- 📖 **Diccionario de datos** para parámetros de calidad del agua

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 18, Vite 5 |
| **Mapas** | Leaflet, React-Leaflet |
| **UI** | Bootstrap 5, React-Bootstrap |
| **Geoespacial** | Turf.js, Proj4 |
| **Servidor de mapas** | GeoServer (WFS/WMS) |
| **Exportación** | SheetJS (xlsx), JSZip, FileSaver |

---

## 📦 Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **GeoServer** >= 2.20 (con las capas configuradas)

---

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.development

# Editar con tus valores
nano .env.development
```

### 3. Iniciar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## ⚙️ Configuración

### Variables de entorno

Crea un archivo `.env.development` (desarrollo) o `.env.production` (producción) en la raíz del proyecto:

```bash
# ============================================
# GEOSERVER
# ============================================
VITE_GEOSERVER_URL=http://localhost:8080
VITE_GEOSERVER_WORKSPACE=Hidalgo
VITE_WFS_TIMEOUT=30000
VITE_MAX_FEATURES=5000

# ============================================
# MAPA
# ============================================
VITE_MAP_CENTER_LAT=20.5
VITE_MAP_CENTER_LNG=-99
VITE_MAP_ZOOM=9.5
VITE_MAP_MIN_ZOOM=8.5
VITE_MAP_MAX_ZOOM=19

# ============================================
# APLICACIÓN
# ============================================
VITE_APP_NAME=Observatorio del Agua de Hidalgo
VITE_DEBUG_MODE=true
VITE_APP_VERSION=1.0.0
```

### Configuración de GeoServer

El proyecto espera las siguientes capas en el workspace `Hidalgo`:

| Capa | Descripción |
|------|-------------|
| `00_Estado` | Límite estatal |
| `00_Municipios` | División municipal |
| `00_Localidades` | Localidades puntuales |
| `04_sequias` | Monitor de sequía (temporal) |
| `01_sitios` | Sitios de monitoreo |
| ... | Ver `AccordionData.js` para lista completa |

---

## 📁 Estructura del proyecto

```
geovisor/
├── public/
│   └── assets/
│       ├── fonts/            # Fuentes tipográficas
│       ├── images/           # Imágenes estáticas
│       └── pdf/              # Documentos PDF
├── src/
│   ├── components/
│   │   ├── common/           # Componentes reutilizables (botones, modales)
│   │   ├── layout/           # Header, Footer, Layouts
│   │   ├── map/              # Componentes del mapa
│   │   │   ├── MapView.jsx   # Componente principal
│   │   │   ├── LayerMenu.jsx # Menú de capas
│   │   │   ├── Legend.jsx    # Leyenda dinámica
│   │   │   ├── Timeline.jsx  # Línea de tiempo
│   │   │   └── ...
│   │   └── ui/               # Componentes UI (InfoCard, Acordeon)
│   ├── config/
│   │   └── env.js            # Configuración centralizada
│   ├── data/                 # Datos estáticos
│   │   ├── AccordionData.js  # Estructura del menú de capas
│   │   └── parametros*.js    # Diccionario de parámetros
│   ├── hooks/                # Hooks personalizados
│   │   ├── useLayerManagement.js
│   │   ├── useTimelineManager.js
│   │   └── ...
│   ├── pages/                # Páginas/rutas
│   ├── styles/               # Estilos CSS
│   │   ├── variables.css     # Variables globales
│   │   ├── global.css        # Estilos globales
│   │   └── *.css             # Estilos por componente
│   ├── utils/                # Utilidades y servicios
│   │   ├── wfsService.js     # Servicio WFS/WMS
│   │   ├── layerStyleFactory.js
│   │   └── ...
│   ├── App.jsx
│   └── index.jsx
├── .env.example              # Plantilla de variables
├── .env.development          # Config desarrollo
├── .env.production           # Config producción
├── package.json
├── vite.config.js
└── README.md
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run build:dev` | Build con config de desarrollo |
| `npm run preview` | Previsualiza el último build |
| `npm run preview:prod` | Build + preview de producción |

---

## 🌐 Despliegue

### Build de producción

```bash
# 1. Configurar variables de producción
cp .env.example .env.production
nano .env.production  # Editar VITE_GEOSERVER_URL

# 2. Generar build
npm run build

# 3. Los archivos estarán en /dist
ls -la dist/
```

### Despliegue en servidor web

Los archivos de `/dist` pueden desplegarse en cualquier servidor web estático (Apache, Nginx, etc.).

### Configuración de Apache

```apache
<VirtualHost *:80>
    ServerName observatorio.tudominio.com
    DocumentRoot /var/www/geovisor/dist
    
    <Directory /var/www/geovisor/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA fallback
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

---

## 🔧 Solución de problemas

### El mapa no carga capas

1. Verificar que GeoServer esté corriendo
2. Verificar la URL en `.env.development`
3. Revisar CORS en GeoServer

### Error de CORS

Habilitar CORS en GeoServer:
- Ir a **Settings > Global > CORS**
- O configurar en el archivo `web.xml` del servidor

### Build falla

```bash
# Limpiar cache y reinstalar
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

---

## 👥 Créditos

Desarrollado para la **Secretaría de Medio Ambiente y Recursos Naturales del Estado de Hidalgo (SEMARNATH)**

---
