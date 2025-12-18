// scripts/postbuild.js
import fs from "fs";
import path from "path";

// 1. Definir rutas de directorios y archivos
const buildPath = path.join(process.cwd(), "build");          // Ruta de la carpeta 'build' del proyecto
const webInfPath = path.join(buildPath, "WEB-INF");          // Subdirectorio WEB-INF dentro de build
const webXmlPath = path.join(webInfPath, "web.xml");         // Ruta completa del archivo web.xml

// 2. Contenido XML para configuración de servidor (SPA - Single Page Application)
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
                             http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">

    <display-name>React SPA</display-name>                   <!-- Nombre descriptivo de la aplicación -->

    <!-- Archivo de bienvenida (se sirve por defecto al acceder a la raíz) -->
    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
    </welcome-file-list>

    <!-- Redirigir errores 404 a index.html para manejo de rutas del frontend -->
    <error-page>
        <error-code>404</error-code>
        <location>/index.html</location>
    </error-page>
</web-app>`;

// 3. Crear directorio WEB-INF si no existe
if (!fs.existsSync(webInfPath)) fs.mkdirSync(webInfPath);

// 4. Escribir el archivo web.xml con la configuración
fs.writeFileSync(webXmlPath, xmlContent);

/*
OBJETIVO DEL SCRIPT:
- Genera automáticamente un archivo web.xml en build/WEB-INF/
- Permite desplegar una SPA de React en servidores Java (Tomcat, etc.)
- Configura redirección de errores 404 a index.html para que el enrutamiento
  del frontend (React Router) funcione correctamente
- Se ejecuta típicamente después del build (ej: "postbuild" en package.json)

USO TÍPICO EN PACKAGE.JSON:
"scripts": {
  "build": "react-scripts build",
  "postbuild": "node scripts/postbuild.js"
}
*/