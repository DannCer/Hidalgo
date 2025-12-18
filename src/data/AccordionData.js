/**
 * @fileoverview Datos de configuración del acordeón del menú de capas.
 * 
 * Define la estructura jerárquica del menú lateral del visor de mapas:
 * - Secciones (acordeón principal)
 * - Tarjetas (cards dentro de cada sección)
 * - Enlaces (capas, documentos o acciones)
 * 
 * Cada enlace puede ser:
 * - Una capa del GeoServer (con layerName, crs, geomType)
 * - Un documento PDF (con path y target: '_blank')
 * - Un enlace externo (con path a URL externa)
 * - Una acción especial (con action: 'openVisorAcuiferos', 'openVisorFertilidad', 'openVisorInfografias')
 * - Un dropdown con sublinks
 * 
 * @module data/AccordionData
 */

// ============================================================================
// CONSTANTES DE SISTEMAS DE REFERENCIA DE COORDENADAS
// ============================================================================

/**
 * Sistemas de Referencia de Coordenadas (CRS) utilizados.
 * @constant {Object}
 * @property {string} WGS84 - Sistema geodésico mundial (EPSG:4326)
 * @property {string} WEB_MERCATOR - Proyección Web Mercator (EPSG:3857)
 * @property {string} LCC_6362 - Cónica Conforme de Lambert México (EPSG:6362)
 */
const CRS = {
    WGS84: 'EPSG:4326',
    WEB_MERCATOR: 'EPSG:3857',
    LCC_6362: 'EPSG:6362'
};

// ============================================================================
// CONSTANTES DE TIPOS DE GEOMETRÍA
// ============================================================================

/**
 * Tipos de geometría para las capas.
 * @constant {Object}
 * @property {string} POINT - Geometría de punto
 * @property {string} POLYGON - Geometría de polígono
 * @property {string} LINE - Geometría de línea
 */
const GEOM_TYPES = {
    POINT: 'point',
    POLYGON: 'polygon',
    LINE: 'line'
};

// ============================================================================
// DATOS DEL ACORDEÓN
// ============================================================================

/**
 * Estructura de datos del acordeón del menú de capas.
 * 
 * Organizado en 9 secciones principales:
 * 1. Introducción - Presentación del Observatorio y autoridades
 * 2. Contexto geográfico y demográfico - Capas base, población y regiones
 * 3. Programa Estatal Hídrico 2040 de Hidalgo - Documento del programa
 * 4. Eje 1: Conservación hídrica y salud de los ecosistemas - Cantidad, calidad, conservación y ordenamiento
 * 5. Eje 2: Acceso universal y sustentable al agua y saneamiento - Cobertura y tratamiento
 * 6. Eje 3: Uso responsable y sostenible del agua - Usos consuntivos, riego y eficiencias
 * 7. Eje 4: Resiliencia y adaptación a fenómenos hidrometeorológicos - Riesgos, presas y estaciones
 * 8. Eje 5: Gobernanza hídrica participativa y transparente - Gestión, participación y marco legal
 * 9. Cartografía - Capas adicionales, acuíferos e infografías
 * 
 * @constant {Array<AccordionSection>}
 * 
 * @typedef {Object} AccordionSection
 * @property {string} title - Título de la sección
 * @property {string} id - Identificador único de la sección
 * @property {Array<Card>} cards - Tarjetas dentro de la sección
 * 
 * @typedef {Object} Card
 * @property {string} [image] - Ruta de la imagen de la tarjeta (opcional en cards descriptivas)
 * @property {string} title - Título de la tarjeta
 * @property {string} [id] - Identificador opcional
 * @property {Array<Link>} [links] - Enlaces de la tarjeta (opcional en cards descriptivas)
 * 
 * @typedef {Object} Link
 * @property {string} text - Texto del enlace
 * @property {string} [path] - Ruta de navegación, URL externa o ruta a PDF
 * @property {string|string[]} [layerName] - Nombre(s) de capa en GeoServer (puede ser array para capas múltiples)
 * @property {string} [crs] - Sistema de referencia de coordenadas (CRS.WGS84 o CRS.WEB_MERCATOR)
 * @property {string} [geomType] - Tipo de geometría (GEOM_TYPES.POINT, POLYGON o LINE)
 * @property {string} [target] - Target del enlace ('_blank' para nueva pestaña, usado en PDFs y enlaces externos)
 * @property {string} [action] - Acción especial a ejecutar ('openVisorAcuiferos', 'openVisorFertilidad', 'openVisorInfografias')
 * @property {string} [type] - Tipo de enlace ('dropdown' para menú desplegable)
 * @property {Array<Link>} [sublinks] - Sub-enlaces para dropdowns
 */
export const accordionData = [
    // =========================================================================
    // SECCIÓN 1: INTRODUCCIÓN
    // Presenta el Observatorio Estatal Hídrico y las autoridades principales
    // =========================================================================
    {
        title: 'Introducción',
        id: 'introduccion',
        cards: [
            {
                title: 'El Observatorio Estatal Hídrico es una herramienta tecnológica de gestión, dinámica e  incluyente, desarrollada con el apoyo de la Cooperación Técnica Alemana (GIZ) en el marco del proyecto público-privado Aguas Firmes, que integra información, en su primera etapa, de la CONAGUA, IMTA, CONABIO, CONANP, SEMARNATH, CEAA y PROESPA para fortalecer la implementación y seguimiento del Programa Estatal Hídrico 2040 de Hidalgo, instrumento de política pública que se centra en la gestión de soluciones sustentables para atender los desafíos y problemas relacionados con el agua en el estado, a corto, mediano y largo plazo, en un contexto de mayor gobernanza y equidad.',
                id: 'descripcion',
            },
            {
                image: '/assets/img/Introduccion/GobernadorMA.webp',
                title: 'Lic. Julio Menchaca Salazar Gobernador Constitucional del\nEstado de Hidalgo',
                id: 'gobernador',
                links: [
                    {
                        text: 'El Programa Estatal Hídrico 2040 de Hidalgo es un instrumento de planeación y acción que responde a los desafíos actuales y futuros del agua en nuestra entidad, con una visión de largo plazo, sustentabilidad y justicia territorial.',
                    },
                ]
            },
            {
                image: '/assets/img/Introduccion/SecretariaMA.webp',
                title: 'Mtra. Mónica Patricia Mixtega Trejo Secretaria de Medio Ambiente y Recursos Naturales de Hidalgo',
                id: 'secretaria',
                links: [
                    {
                        text: 'Desde la SEMARNATH impulsamos políticas públicas innovadoras, articuladas con los sectores gubernamental, social, académico y privado, que fortalezcan la protección de nuestros cuerpos de agua, acuíferos y ecosistemas hídricos, con un enfoque territorial incluyente y resiliente ante el cambio climático.',
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // SECCIÓN 2: CONTEXTO GEOGRÁFICO Y DEMOGRÁFICO
    // Capas base del estado, datos de población y regionalización
    // =========================================================================
    {
        title: 'Contexto geográfico y demográfico',
        id: 'contexto',
        cards: [
            {
                image: '/assets/img/CB/CapasBase.webp',
                title: 'Capas Base',
                id: 'capas-base',
                links: [
                    {
                        text: 'Estado',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_Estado',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Municipios',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_Municipios',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Localidades',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_Localidades',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/CB/Poblacion.webp',
                title: 'Población',
                id: 'poblacion',
                links: [
                    {
                        text: 'Censo por estado',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_Censoestado',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Censo por municipio',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_Censomunicipio',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Censo por localidad',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_Censolocalidad',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/CB/Regiones.webp',
                title: 'Regiones',
                id: 'regiones',
                links: [
                    {
                        text: 'Regiones',
                        path: '/observatorio',
                        layerName: 'Hidalgo:00_macrorregiones',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // SECCIÓN 3: PROGRAMA ESTATAL HÍDRICO 2040 DE HIDALGO
    // Documento principal del programa hídrico
    // =========================================================================
    {
        title: 'Programa Estatal Hídrico 2040 de Hidalgo',
        id: 'programa-hidrico',
        cards: [
            {
                image: '/assets/img/ProgramaHidrico/ProgramaHidrico.webp',
                title: 'Programa estatal hídrico',
                links: [
                    {
                        text: 'Programa estatal hídrico',
                        path: '/assets/pdf/Sintesis de PHE2040 de Hidalgo_Final OK_.pdf',
                        target: '_blank',
                    },
                ]
            },
        ]
    },

    // =========================================================================
    // SECCIÓN 4: EJE 1 - CONSERVACIÓN HÍDRICA Y SALUD DE LOS ECOSISTEMAS
    // Cantidad y calidad del agua, conservación, descargas y ordenamiento
    // =========================================================================
    {
        title: 'Eje 1. Conservación hídrica y salud de los ecosistemas',
        id: 'eje1',
        cards: [
            {
                image: '/assets/img/Eje1/CantidadRecursoHidrico.webp',
                title: 'Cantidad del recurso hídrico',
                id: 'cantidad-recurso',
                links: [
                    {
                        text: 'Precipitación',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_precipitacion',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Disponibilidad agua superficial y condición de cuencas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_dispcuencas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Disponibilidad agua subterránea y condición de acuíferos',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_dispacuiferos',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Eje1/CalidadRecursoHidrico.webp',
                title: 'Calidad del recurso hídrico',
                id: 'calidad-recurso',
                links: [
                    {
                        text: 'Sitios de monitoreo',
                        path: '/observatorio',
                        layerName: ['Hidalgo:01_spsitios', 'Hidalgo:01_sbsitios'],
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    },
                    {
                        text: 'Parámetros e indicadores de la calidad del agua',
                        path: '/observatorio',
                        layerName: ['Hidalgo:01_sbcalidadagua', 'Hidalgo:01_spcalidadagua'],
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/Eje1/ConservacionEcosistemas.webp',
                title: 'Conservación de ecosistemas',
                id: 'conservacion-ecosistemas',
                links: [
                    {
                        text: 'ANP',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_ANP',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Áreas destinadas voluntariamente a la conservación',
                        type: 'dropdown',
                        sublinks: [
                            {
                                text: 'Documento de ADVC',
                                path: '/assets/pdf/Anexo_2.pdf',
                                target: '_blank',
                            },
                            {
                                text: 'Áreas destinadas voluntariamente a la conservación',
                                path: '/observatorio',
                                layerName: 'Hidalgo:01_advc',
                                crs: CRS.WGS84,
                                geomType: GEOM_TYPES.POLYGON
                            }
                        ]
                    },
                    {
                        text: 'Áreas naturales protegidas estatales y municipales',
                        path: '/assets/pdf/Anexo_1.pdf',
                        target: '_blank',
                    },
                    {
                        text: 'Humedales',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_humedales',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Emergencias hidroecológicas y contingencias ambientales',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_ehyca',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/Eje1/DescargasAguasResiduales.webp',
                title: 'Descargas de aguas residuales',
                id: 'descargas-aguas',
                links: [
                    {
                        text: 'Descargas de aguas residuales (límites máximos permisibles)',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_descargas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/Eje1/OrdenamientoCuencas.webp',
                title: 'Ordenamiento de cuencas',
                id: 'ordenamiento-cuencas',
                links: [
                    {
                        text: 'Vedas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_cuencavedas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Reservas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_cuencareservas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Eje1/OrdenamientoAcuiferos.webp',
                title: 'Ordenamiento de acuíferos',
                id: 'ordenamiento-acuiferos',
                links: [
                    {
                        text: 'Vedas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_acuifvedas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Acuerdos',
                        path: '/observatorio',
                        layerName: 'Hidalgo:01_acuifacuerdogral',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // SECCIÓN 5: EJE 2 - ACCESO UNIVERSAL Y SUSTENTABLE AL AGUA Y SANEAMIENTO
    // Organismos operadores, cobertura de servicios y tratamiento de aguas
    // =========================================================================
    {
        title: 'Eje 2. Acceso universal y sustentable al agua y saneamiento',
        id: 'eje2',
        cards: [
            {
                image: '/assets/img/Eje2/OrganismosOperadores.webp',
                title: 'Organismos operadores',
                links: [
                    {
                        text: 'Organismos operadores (características principales)',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_orgoperadores',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Eje2/CoberturaAguaPotable.webp',
                title: 'Cobertura de agua potable',
                links: [
                    {
                        text: 'Cobertura de agua potable',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_cobaguapotable',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Plantas potabilizadoras',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_potabilizadoras',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    },
                    {
                        text: 'Captación agua lluvia',
                        path: '/observatorio',
                        layerName: ''
                    },
                    {
                        text: 'Servicios de suministro de agua potable gestionados de manera segura',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_abastecimiento',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Eficiencia de cloración',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_cloracionmpio',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON

                    }
                ]
            },
            {
                image: '/assets/img/Eje2/CoberturaAlcantarillado.webp',
                title: 'Cobertura de alcantarillado',
                links: [
                    {
                        text: 'Cobertura de alcantarillado',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_alcantarillado',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Eje2/CoberturaSaneamientoAguasResiduales.webp',
                title: 'Cobertura de saneamiento de aguas residuales',
                links: [
                    {
                        text: 'Plantas de tratamiento de aguas residuales (municipales)',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_ptarmunicipales',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    },
                    {
                        text: 'Plantas de tratamiento no municipales',
                        path: '/observatorio',
                        layerName: 'Hidalgo:02_ptarnomunicipales',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON

                    }
                ]
            },
            {
                image: '/assets/img/Eje2/InspeccionVigilancia.webp',
                title: 'Inspección y vigilancia',
                links: [
                    {
                        text: 'Inspección y vigilancia',
                        path: '/assets/pdf/Datos de inspección y vigilancia.pdf',
                        target: '_blank',
                    }
                ]
            },
            {
                image: '/assets/img/Eje2/ReusoAgua.webp',
                title: 'Reúso de agua',
                links: [
                    {
                        text: 'Reúso de agua',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // SECCIÓN 6: EJE 3 - USO RESPONSABLE Y SOSTENIBLE DEL AGUA
    // Usos consuntivos, distritos de riego y eficiencias
    // =========================================================================
    {
        title: 'Eje 3. Uso responsable y sostenible del agua',
        id: 'eje3',
        cards: [
            {
                image: '/assets/img/Eje3/UsosConsuntivos.webp',
                title: 'Usos Consuntivos',
                links: [
                    {
                        text: 'Usos Consuntivos ',
                        path: '/observatorio',
                        layerName: 'Hidalgo:03_usoconsuntivo',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Eje3/DistritosUnidadesRiego.webp',
                title: 'Distritos y unidades de riego',
                links: [
                    {
                        text: 'Cultivos y Producción',
                        path: '/observatorio',
                        layerName: 'Hidalgo:03_drcultivos',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Volúmenes distribuidos',
                        path: '/observatorio',
                        layerName: 'Hidalgo:03_drvolumenes',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Productividad física y económica',
                        path: '/observatorio',
                        layerName: 'Hidalgo:03_drprodfisica',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Fertilidad de suelos',
                        action: 'openVisorFertilidad',
                    },
                ]
            },
            {
                image: '/assets/img/Eje3/EficienciasUsoAgua.webp',
                title: 'Eficiencias en el uso del agua',
                links: [
                    {
                        text: 'Eficiencias en el uso del agua',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            },
        ]
    },

    // =========================================================================
    // SECCIÓN 7: EJE 4 - RESILIENCIA Y ADAPTACIÓN A FENÓMENOS HIDROMETEOROLÓGICOS
    // Atlas de riesgos, presas, estaciones de monitoreo y fenómenos extremos
    // =========================================================================
    {
        title: 'Eje 4. Resiliencia y adaptación a fenómenos hidrometeorológicos',
        id: 'eje4',
        cards: [
            {
                image: '/assets/img/Eje4/AtlasRiesgosMunicipales.webp',
                title: 'Atlas de riesgos municipales',
                links: [
                    {
                        text: 'Atlas de riesgos municipales',
                        path: 'https://bibliotecadigitaluplaph.hidalgo.gob.mx/'
                    },
                    {
                        text: 'Riesgos municipales',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_riesgosmunicipales',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON

                    }
                ]
            },
            {
                image: '/assets/img/Eje4/ProgramasOrdenamientoEcologicoTerritorial.webp',
                title: 'Programas de ordenamiento ecológico territorial',
                links: [
                    {
                        text: 'Programas de ordenamiento ecológico territorial',
                        path: 'https://bitacora.semarnath.gob.mx/ordenamientos.html'
                    }
                ]
            },
            {
                image: '/assets/img/Eje4/PresasAlmacenamiento.webp',
                title: 'Presas de almacenamiento',
                links: [
                    {
                        text: 'Presas de almacenamiento',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_presas',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    },
                    {
                        text: 'Infraestructura de presas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_infrapresas',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/Eje4/EstacionesClimatologicas.webp',
                title: 'Estaciones climatológicas',
                links: [
                    {
                        text: 'Estaciones climatológicas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_climatologicas',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/Eje4/EstacionesHidrometricas.webp',
                title: 'Estaciones hidrométricas',
                links: [
                    {
                        text: 'Estaciones hidrométricas',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_hidrometricas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POINT
                    }
                ]
            },
            {
                image: '/assets/img/Eje4/InfraestructuraHidraulicaProteccionPluvial.webp',
                title: 'Infraestructura hidráulica de protección y pluvial',
                links: [
                    {
                        text: 'Infraestructura hidráulica de protección y pluvial',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            },
            {
                image: '/assets/img/Eje4/FenomenosHidrometeorlogicosExtremos.webp',
                title: 'Fenómenos hidrometeorológicos extremos',
                links: [
                    {
                        text: 'Inundaciones',
                        path: '/observatorio',
                        layerName: ''
                    },
                    {
                        text: 'Sequías',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_sequias',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Declaratorias de fenómenos hidrometeorológicos',
                        path: '/observatorio',
                        layerName: 'Hidalgo:04_hidrometeorologicos',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // SECCIÓN 8: EJE 5 - GOBERNANZA HÍDRICA PARTICIPATIVA Y TRANSPARENTE
    // Gestión municipal, participación sectorial, recaudación y marco legal
    // =========================================================================
    {
        title: 'Eje 5. Gobernanza hídrica participativa y transparente',
        id: 'eje5',
        cards: [
            {
                image: '/assets/img/Eje5/GestionHidricaMunicipal.webp',
                title: 'Gestión hídrica municipal',
                links: [
                    {
                        text: 'Agenda común',
                        path: '/observatorio',
                        layerName: ''
                    },
                    {
                        text: 'Planeación y operación hídrica municipal',
                        path: '/observatorio',
                        layerName: ''
                    },
                    {
                        text: 'Espacios de Cultura del Agua',
                        path: '/assets/pdf/Cultura del Agua Hidalgo.pdf',
                        target: '_blank',
                    }
                ]
            },
            {
                image: '/assets/img/Eje5/ProcesoIntegracionProgramaHidrico.webp',
                title: 'Proceso para la integración del Programa Hídrico del Estado de Hidalgo',
                links: [
                    {
                        text: 'Proceso para la integración del Programa Hídrico del Estado de Hidalgo',
                        path: '/assets/pdf/Proceso de Integración PEH 2040.pdf',
                        target: '_blank',
                    }
                ]
            },
            {
                image: '/assets/img/Eje5/ParticipacionSectorial.webp',
                title: 'Participación sectorial',
                links: [
                    {
                        text: 'Consejos de cuenca',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_consejocuenca',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON

                    },
                    {
                        text: 'Comisiones de cuenca',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_comiscuenca',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Comités de cuenca',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_comitescuenca',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Comités Técnicos de Agua Subterránea',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_cotas',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Organizaciones Locales de Agua y Saneamiento',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_ola',
                        crs: CRS.WGS84,
                        geomType: GEOM_TYPES.POINT
                    },
                    {
                        text: 'Consejo Técnico de Sustentabilidad Hídrica',
                        type: 'dropdown',
                        sublinks: [
                            {
                                text: 'Estrategía de atención',
                                path: '/assets/pdf/Anexo_3.pdf',
                                target: '_blank',
                            },
                            {
                                text: 'Acta de conformación',
                                path: '/assets/pdf/Acta Consejo Técnico.pdf',
                                target: '_blank',
                            },
                        ]
                    }
                ]
            },
            {
                image: '/assets/img/Eje5/Recaudacion.webp',
                title: 'Recaudación',
                links: [
                    {
                        text: 'Recaudación por extracción',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_recextraccion',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    },
                    {
                        text: 'Recaudación por cobro',
                        path: '/observatorio',
                        layerName: 'Hidalgo:05_recobro',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Eje5/PresupuestoGestionAgua.webp',
                title: 'Presupuesto para la gestión del agua',
                links: [
                    {
                        text: 'Presupuesto para la gestión del agua',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            },
            {
                image: '/assets/img/Eje5/MarcoLegal.webp',
                title: 'Marco legal',
                links: [
                    {
                        text: 'Internacional',
                        path: '/assets/pdf/Marco legal_Internacional.pdf',
                        target: '_blank',
                    },
                    {
                        text: 'Nacional',
                        path: '/assets/pdf/Marco legal_Nacional.pdf',
                        target: '_blank',
                    },
                    {
                        text: 'Estatal',
                        path: '/assets/pdf/Marco legal_Estatal.pdf',
                        target: '_blank',
                    },

                ]
            },
            {
                image: '/assets/img/Eje1/OrdenamientoAcuiferos.webp',
                title: 'Sitios de interés',
                links: [
                    {
                        text: 'Apan, Paisaje y Resilencia',
                        path: 'https://www.apanresiliencia.org/'
                    },
                    {
                        text: 'CENAPRED',
                        path: 'http://www.atlasnacionalderiesgos.gob.mx/ '
                    },
                    {
                        text: 'Sistema de Alerta Temprana de Incendios Forestales (SATIF)',
                        path: 'https://incendios.conabio.gob.mx/'
                    },
                    {
                        text: 'Geoportal del Sistema Nacional de Información sobre Biodiversidad (CONABIO)',
                        path: 'http://geoportal.conabio.gob.mx/'
                    },
                    {
                        text: 'Sistema Nacional de Información del Agua (SINA)',
                        path: 'https://sinav30.conagua.gob.mx:8080/'
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // SECCIÓN 9: CARTOGRAFÍA
    // Capas adicionales, visor de acuíferos, regionalizaciones e infografías
    // =========================================================================
    {
        title: 'Cartografía',
        id: 'cartografia',
        cards: [
            {
                image: '/assets/img/Lorem_Picsum.png',
                title: 'Acuíferos de Hidalgo',
                links: [
                    {
                        text: 'Acuíferos de Hidalgo',
                        action: 'openVisorAcuiferos',
                    },
                ]
            },
            {
                image: '/assets/img/Lorem_Picsum.png',
                title: 'Regionalización por acuífero',
                links: [
                    {
                        text: 'Regionalización por acuífero',
                        path: '/observatorio',
                        layerName: 'Hidalgo:cart_zonifacuifero',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: '/assets/img/Lorem_Picsum.png',
                title: 'Regionalización por subcuenca',
                links: [
                    {
                        text: 'Regionalización por subcuenca',
                        path: '/observatorio',
                        layerName: '',
                    }
                ]
            },
            
            {
                image: '/assets/img/Lorem_Picsum.png',
                title: 'Cuerpos de agua',
                links: [
                    {
                        text: 'Cuerpos de  agua',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            },
            {
                image: '/assets/img/Lorem_Picsum.png',
                title: 'Infografías de fertilidad',
                links: [
                    {
                        text: 'Infografías',
                        action: 'openVisorInfografias',
                    },
                ]
            },
            {
                image: '/assets/img/Lorem_Picsum.png',
                title: 'Otras',
                links: [
                    {
                        text: 'Otras',
                        path: '/observatorio',
                        layerName: '',
                    }
                ]
            },
        ]
    },
];