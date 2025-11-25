// scripts/postbuild.js
import fs from "fs";
import path from "path";

const buildPath = path.join(process.cwd(), "build");
const webInfPath = path.join(buildPath, "WEB-INF");
const webXmlPath = path.join(webInfPath, "web.xml");

const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
                             http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">

    <display-name>React SPA</display-name>

    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
    </welcome-file-list>

    <error-page>
        <error-code>404</error-code>
        <location>/index.html</location>
    </error-page>
</web-app>`;

if (!fs.existsSync(webInfPath)) fs.mkdirSync(webInfPath);
fs.writeFileSync(webXmlPath, xmlContent);

