# 🌊 Observatorio Estatal Hídrico - Geovisor

Visor geográfico interactivo para la gestión y monitoreo de recursos hídricos del estado de Hidalgo, México.

---

## 📋 Descripción

El **Observatorio Estatal Hídrico** es una aplicación web que permite visualizar, analizar y descargar información geoespacial relacionada con los recursos hídricos del estado de Hidalgo. El geovisor se conecta a un servidor GeoServer para obtener capas WFS/WMS y presenta la información de manera interactiva sobre un mapa base.

### Temáticas disponibles

| Eje | Descripción |
|-----|-------------|
| 🗺️ **Contexto geográfico** | Municipios, localidades, regiones, población |
| 💧 **Eje 1: Conservación** | Calidad del agua, sitios de monitoreo, ANPs, humedales |
| 🚰 **Eje 2: Abastecimiento** | Presas, acueductos, plantas de tratamiento |
| 🌾 **Eje 3: Productividad** | Uso consuntivo, productividad agrícola, distritos de riego |
| 🏜️ **Eje 4: Riesgos** | Monitor de sequía con timeline histórico, inundaciones |
| 🏛️ **Eje 5: Gobernanza** | Consejos de cuenca, COTAS, marco legal |
| 🗺️ **Cartografía** | Acuíferos, zonificación, infografías |

---

## ✨ Características principales

- 🗺️ **Visualización de capas geográficas** con Leaflet y estilos dinámicos
- ⏱️ **Timeline interactivo** para datos temporales (sequías por quincena) con caché
- 📊 **Tablas de atributos** con filtros, búsqueda y exportación
- 📥 **Descarga de datos** en formatos Shapefile (ZIP) y Excel (XLSX)
- 🎨 **Leyendas dinámicas** que se adaptan a las capas activas
- 📱 **Diseño responsive** para escritorio y móviles
- 🖱️ **Popups informativos** con consultas espaciales al hacer clic
- 🔍 **Múltiples capas base** (satélite, calles, topográfico)
- 📖 **Diccionario de datos** para parámetros de calidad del agua
- 🖼️ **Visores de imágenes** para infografías y mapas de acuíferos

---

## 🛠️ Tecnologías

| Categoría | Tecnología | Uso |
|-----------|------------|-----|
| **Frontend** | React 18 | Componentes UI reactivos |
| **Build** | Vite 5 | Bundling y desarrollo |
| **Mapas** | Leaflet, React-Leaflet | Renderizado de mapas |
| **UI** | Bootstrap 5, React-Bootstrap | Estilos y componentes |
| **Geoespacial** | Turf.js, Proj4 | Análisis espacial y proyecciones |
| **Servidor** | GeoServer (WFS/WMS) | Servicios de mapas OGC |
| **Exportación** | SheetJS (xlsx), JSZip, FileSaver | Descarga de datos |
| **Iconos** | React-Icons, Lucide | Iconografía |

---

## 🏗️ Arquitectura del proyecto

```
geovisor/
├── public/
│   └── assets/
│       ├── fonts/            # Fuentes tipográficas
│       ├── images/           # Imágenes estáticas (infografías, logos)
│       └── pdf/              # Documentos PDF (reportes, anexos)
│
├── src/
│   ├── components/
│   │   ├── common/           # Componentes reutilizables
│   │   │   ├── AttributeTableButton.jsx   # Botón para abrir tabla
│   │   │   ├── DiccionarioButton.jsx      # Botón diccionario de datos
│   │   │   ├── DownloadButton.jsx         # Botón de descarga
│   │   │   ├── DraggableModalDialog.jsx   # Modal arrastrable
│   │   │   ├── HelpButton.jsx             # Botón de ayuda
│   │   │   ├── PdfViewerModal.jsx         # Visor de PDFs
│   │   │   └── VisorBaseImagenes.jsx      # Componente base para visores
│   │   │
│   │   ├── layout/           # Estructura de página
│   │   │   ├── Header.jsx              # Barra superior
│   │   │   ├── Footer.jsx              # Pie de página
│   │   │   ├── LayoutPrincipal.jsx     # Layout con footer
│   │   │   └── LayoutObservatorio.jsx  # Layout para el mapa (sin footer)
│   │   │
│   │   ├── map/              # Componentes del mapa
│   │   │   ├── MapView.jsx            # ⭐ Componente principal del mapa
│   │   │   ├── MapContent.jsx         # Contenido interno del mapa
│   │   │   ├── LayerMenu.jsx          # Menú lateral de capas
│   │   │   ├── Legend.jsx             # Leyenda dinámica
│   │   │   ├── Timeline.jsx           # Control de línea de tiempo
│   │   │   ├── GeoJsonLayers.jsx      # Renderizado de capas GeoJSON
│   │   │   ├── HighlightLayer.jsx     # Capa de resaltado (hover/click)
│   │   │   ├── PopupContent.jsx       # Contenido de popups
│   │   │   ├── BaseLayerControls.jsx  # Selector de capa base
│   │   │   ├── AttributeTableModal.jsx # Modal de tabla de atributos
│   │   │   ├── DiccionarioDatosModal.jsx # Modal diccionario
│   │   │   ├── Download.jsx           # Lógica de descarga
│   │   │   ├── VisorImagenesAcuiferos.jsx # Visor mapas de acuíferos
│   │   │   ├── VisorInfografias.jsx   # Visor de infografías municipales
│   │   │   └── VisorMapasFertilidad.jsx # Visor mapas de fertilidad
│   │   │
│   │   └── ui/               # Componentes UI genéricos
│   │       ├── Acordeon.jsx           # Acordeón del menú
│   │       └── InfoCard.jsx           # Tarjeta informativa
│   │
│   ├── config/
│   │   └── env.js            # ⭐ Configuración centralizada (lee .env)
│   │
│   ├── data/                 # Datos estáticos y configuración
│   │   ├── AccordionData.js  # ⭐ Definición de todas las capas
│   │   ├── parametrosSubterraneos.js  # Diccionario agua subterránea
│   │   └── parametrosSuperficiales.js # Diccionario agua superficial
│   │
│   ├── hooks/                # Custom hooks (lógica reutilizable)
│   │   ├── useLayerManagement.js  # ⭐ Gestión de capas activas
│   │   ├── useTimelineManager.js  # ⭐ Control del timeline con caché
│   │   ├── useSequiaData.js       # Carga de datos de sequías
│   │   ├── useBaseLayer.js        # Carga de capa base (estado)
│   │   ├── useHighlightManager.js # Gestión de resaltados
│   │   ├── usePopupManager.js     # Gestión de popups
│   │   ├── useTableModal.js       # Control del modal de tabla
│   │   ├── useVariants.js         # Variantes de visualización
│   │   ├── useNavigation.js       # Navegación con parámetros URL
│   │   ├── useInitialLayers.js    # Carga inicial de capas
│   │   └── useImageZoom.js        # Zoom en visores de imágenes
│   │
│   ├── pages/                # Páginas/rutas
│   │   ├── Principal.jsx     # Página de inicio (tarjetas)
│   │   ├── Observatorio.jsx  # Página del visor de mapas
│   │   ├── CoomingSoon.jsx   # Placeholder para secciones futuras
│   │   └── NotFound.jsx      # Página 404
│   │
│   ├── styles/               # Estilos CSS (por componente)
│   │   ├── variables.css     # Variables CSS globales
│   │   ├── global.css        # Estilos globales
│   │   └── *.css             # Estilos específicos
│   │
│   ├── utils/                # Utilidades y servicios
│   │   ├── wfsService.js     # ⭐ Comunicación con GeoServer
│   │   ├── dataUtils.js      # ⭐ Formateo y utilidades de datos
│   │   ├── constants.js      # Constantes globales
│   │   ├── layerStyleFactory.js # Generación de estilos de capas
│   │   ├── styleGenerators.js   # Funciones de estilo específicas
│   │   ├── legendData.js     # Configuración de leyendas
│   │   ├── baseStyles.js     # Estilos base para geometrías
│   │   └── colors.js         # Paletas de colores
│   │
│   ├── App.jsx               # Componente raíz con rutas
│   └── index.jsx             # Punto de entrada
│
├── .env.example              # Plantilla de variables
├── .env.development          # Variables de desarrollo
├── .env.production           # Variables de producción
├── package.json
├── vite.config.js
└── README.md
```

### Archivos clave (⭐)

| Archivo | Responsabilidad |
|---------|-----------------|
| `config/env.js` | Centraliza toda la configuración, lee variables de entorno |
| `data/AccordionData.js` | Define todas las capas, sus tipos de geometría y CRS |
| `hooks/useLayerManagement.js` | Gestiona activación/desactivación de capas |
| `hooks/useTimelineManager.js` | Controla el timeline de sequías con caché |
| `utils/wfsService.js` | Todas las peticiones a GeoServer (WFS/WMS) |
| `utils/dataUtils.js` | Formateo de datos, normalización de fechas |
| `components/map/MapView.jsx` | Orquesta todos los componentes del mapa |

---

## 📦 Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **GeoServer** >= 2.20 (con las capas configuradas)

---

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd geovisor
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

Crea un archivo `.env.development` (desarrollo) o `.env.production` (producción):

```bash
# ============================================
# GEOSERVER - Conexión al servidor de mapas
# ============================================
VITE_GEOSERVER_URL=http://localhost:8080    # URL base (sin /geoserver)
VITE_GEOSERVER_WORKSPACE=Hidalgo            # Workspace donde están las capas
VITE_WFS_TIMEOUT=30000                      # Timeout en ms para peticiones
VITE_MAX_FEATURES=5000                      # Límite de features por petición

# ============================================
# MAPA - Configuración inicial de Leaflet
# ============================================
VITE_MAP_CENTER_LAT=20.5                    # Latitud inicial
VITE_MAP_CENTER_LNG=-99                     # Longitud inicial
VITE_MAP_ZOOM=9.5                           # Zoom inicial
VITE_MAP_MIN_ZOOM=8.5                       # Zoom mínimo permitido
VITE_MAP_MAX_ZOOM=19                        # Zoom máximo permitido

# ============================================
# APLICACIÓN
# ============================================
VITE_APP_NAME=Observatorio del Agua de Hidalgo
VITE_DEBUG_MODE=true                        # Habilita logs en consola
VITE_APP_VERSION=1.0.0
```

### Configuración de GeoServer

El proyecto espera las siguientes capas en el workspace configurado:

| Prefijo | Tipo | Ejemplos |
|---------|------|----------|
| `00_` | Capas base | `00_Estado`, `00_Municipios`, `00_Localidades` |
| `01_` | Eje 1 - Conservación | `01_spsitios`, `01_sbsitios`, `01_ANP` |
| `02_` | Eje 2 - Abastecimiento | `02_presas`, `02_acueductos` |
| `03_` | Eje 3 - Productividad | `03_usoconsuntivo`, `03_productividad` |
| `04_` | Eje 4 - Riesgos | `04_sequias` (⚠️ requiere campo `Quincena`) |
| `05_` | Eje 5 - Gobernanza | `05_consejocuenca`, `05_cotas` |

#### Requisitos especiales para capa de sequías

La capa `04_sequias` debe tener:
- Campo `Quincena` con fechas en formato `YYYY-MM-DD`
- Campo `DI` con código de intensidad (D0, D1, D2, D3, D4)

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (hot reload) |
| `npm run build` | Build de producción optimizado |
| `npm run build:dev` | Build con configuración de desarrollo |
| `npm run preview` | Previsualiza el último build |
| `npm run preview:prod` | Build + preview de producción |

---

## 🔄 Flujo de datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Usuario                                      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │  LayerMenu    │       │    MapClick   │
            │  (activar/    │       │   (consulta   │
            │  desactivar)  │       │   espacial)   │
            └───────┬───────┘       └───────┬───────┘
                    │                       │
                    ▼                       ▼
            ┌───────────────────────────────────────┐
            │      useLayerManagement (hook)        │
            │  - activeLayers (estado)              │
            │  - loadingLayers (estado)             │
            │  - currentFilters (estado)            │
            └───────────────────┬───────────────────┘
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │         wfsService.js                 │
            │  - fetchWfsLayer()                    │
            │  - fetchFeaturesAtPoint()             │
            │  - getShapefileDownloadUrl()          │
            └───────────────────┬───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │   GeoServer   │       │   GeoServer   │
            │     WFS       │       │     WMS       │
            │  (features)   │       │  (leyendas)   │
            └───────────────┘       └───────────────┘
```

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

### Configuración de Apache

```apache
<VirtualHost *:80>
    ServerName observatorio.tudominio.com
    DocumentRoot /var/www/geovisor/dist
    
    <Directory /var/www/geovisor/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA fallback para React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Configuración de Nginx

```nginx
server {
    listen 80;
    server_name observatorio.tudominio.com;
    root /var/www/geovisor/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔧 Solución de problemas

### El mapa no carga capas

1. Verificar que GeoServer esté corriendo
2. Verificar la URL en `.env.development`
3. Revisar CORS en GeoServer (ver abajo)
4. Abrir DevTools > Network y buscar errores en peticiones WFS

### Error de CORS

Habilitar CORS en GeoServer:

**Opción 1: Desde la interfaz**
- Ir a **Settings > Global > CORS**
- Habilitar CORS

**Opción 2: Editar web.xml**
```xml
<filter>
    <filter-name>cross-origin</filter-name>
    <filter-class>org.eclipse.jetty.servlets.CrossOriginFilter</filter-class>
    <init-param>
        <param-name>allowedOrigins</param-name>
        <param-value>*</param-value>
    </init-param>
</filter>
```

### Build falla

```bash
# Limpiar cache y reinstalar
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Sequías no cargan

1. Verificar que la capa `04_sequias` existe en GeoServer
2. Verificar que tiene el campo `Quincena` con datos
3. Probar la petición directamente:
   ```
   http://tu-geoserver/geoserver/Hidalgo/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=Hidalgo:04_sequias&outputFormat=application/json&maxFeatures=1
   ```

---

## 📚 Documentación del código

El código está documentado con JSDoc. Los archivos principales incluyen:

- **Descripción general** del módulo al inicio (`@fileoverview`)
- **@param** y **@returns** para cada función
- **@example** con casos de uso
- Comentarios inline para lógica compleja

Para generar documentación HTML:

```bash
npm install -g jsdoc
jsdoc src -r -d docs
```

---

## 🔐 Consideraciones de seguridad

- Las credenciales de GeoServer nunca se almacenan en el frontend
- Las variables de entorno con `VITE_` son públicas (visibles en el bundle)
- Para capas protegidas, configurar autenticación en GeoServer
- Considerar implementar proxy si se requiere ocultar la URL de GeoServer

---

## 👥 Créditos

Desarrollado para la **Secretaría de Medio Ambiente y Recursos Naturales del Estado de Hidalgo (SEMARNATH)**

---

## 📄 Licencia

Este proyecto es software propietario desarrollado para SEMARNATH.

---

## 📝 Convenciones de código

- **Componentes**: PascalCase (`MapView.jsx`)
- **Hooks**: camelCase con prefijo `use` (`useLayerManagement.js`)
- **Utilidades**: camelCase (`wfsService.js`)
- **Constantes**: SCREAMING_SNAKE_CASE (`SEQUIA_COLORS`)
- **CSS**: kebab-case (`layer-menu.css`)
