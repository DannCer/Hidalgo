import internacional from '../../assets/pdf/Marco legal_Internacional.pdf'
import nacional from '../../assets/pdf/Marco legal_Nacional.pdf'
import estatal from '../../assets/pdf/Marco legal_Estatal.pdf'
import acta from '../../assets/pdf/Acta Consejo Técnico.pdf'
import programa from '../../assets/pdf/Sintesis de PHE2040 de Hidalgo_Final OK_.pdf'
import anp1 from '../../assets/pdf/Anexo_1.pdf'
import anp2 from '../../assets/pdf/Anexo_2.pdf'
import acta3 from '../../assets/pdf/Anexo_3.pdf'
import proceso from '../../assets/pdf/Informe final de las dos etapas.docx.pdf'
import capasBase from '../../assets/img/CB/1 (5).jpg';
import poblkacion from '../../assets/img/CB/1 (7).jpg';
import macro from '../../assets/img/CB/1 (4).jpg'
import img01 from '../../assets/img/Eje1/TECOCOMULCO (2).jpg';
import img02 from '../../assets/img/Eje1/TECOCOMULCO (1).jpg';
import img03 from '../../assets/img/Eje1/TECOCOMULCO (5).jpg';
import img04 from '../../assets/img/Eje1/ESCURRIEMIENTO.jpg';
import img05 from '../../assets/img/Eje1/TECOCOMULCO (3).jpg';
import img06 from '../../assets/img/Eje1/TECOCOMULCO (4).jpg';
import organismosO from '../../assets/img/Eje2/PLANTA TRATAMIENTO  (4).jpg'
import AguaP from '../../assets/img/Eje2/AguaP.jpeg'
import Alcantarillado from '../../assets/img/Eje2/Alcantarillado.jpeg'
import AguasR from '../../assets/img/Eje2/PLANTA TRATAMIENTO  (3).jpg'
import Inspeccion from '../../assets/img/Eje2/InspeccionV.jpeg'
import Reuso from '../../assets/img/Eje2/PLANTA TRATAMIENTO  (5).jpg'
import Usos from '../../assets/img/Eje3/UsosAgua2.webp'
import Distritos from '../../assets/img/Eje3/unidadesriego.jpeg'
import Eficiencias from '../../assets/img/Eje3/crae.jpeg'
import climatologica from '../../assets/img/Eje4/SMN.jfif'
import Hidormetricas from '../../assets/img/Eje4/Estaciones_Hidrom.jpg'
import Presas from '../../assets/img/Eje4/PRESA  (1).jpg'
import Atlas from '../../assets/img/Eje4/EFECTOS INUNDACION  (1).jpeg'
import Ordenamiento from '../../assets/img/Eje4/PRESA  (3).jpg'
import Infraestructura from '../../assets/img/Eje4/EFECTOS INUNDACION  (2).jpg'
import fenomenos from '../../assets/img/Eje4/EFECTOS INUNDACION  (1).jpg'
import Recaudacion from '../../assets/img/Eje5/IMG_4675.jpg'
import Presupuesto from '../../assets/img/Eje5/IMG_4673.jpg'
import Centros from '../../assets/img/Eje5/IMG_4099.jpg'
import Marco from '../../assets/img/Eje5/NormasOf.webp'
import Centro from '../../assets/img/Eje5/Centros.jpg'
import Proceso from '../../assets/img/Eje5/IMG_4102.jpg'
import programaHidrico from '../../assets/img/ProgramaHidrico/programahidrico.png'
import Lorem from '../../assets/img/Lorem_Picsum.png'


const CRS = {
    WGS84: 'EPSG:4326',
    WEB_MERCATOR: 'EPSG:3857',
    LCC_6362: 'EPSG:6362'
};

const GEOM_TYPES = {
    POINT: 'point',
    POLYGON: 'polygon',
    LINE: 'line'
};

export const accordionData = [
    {
        title: 'Contexto geográfico y demográfico',
        id: 'contexto',
        cards: [
            {
                image: capasBase,
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
                image: poblkacion,
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
                image: macro,
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
    {
        title: 'Programa Estatal Hídrico 2040 de Hidalgo',
        id: 'programa-hidrico',
        cards: [
            {
                image: programaHidrico,
                title: 'Programa estatal hídrico',
                links: [

                    {
                        text: 'Programa estatal hídrico',
                        path: programa,
                        target: '_blank',
                    }
                    ,
                ]
            },
        ]
    },
    {
        title: 'Eje 1. Conservación hídrica y salud de los ecosistemas',
        id: 'eje1',
        cards: [
            {
                image: img01,
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
                image: img02,
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
                image: img03,
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
                                path: anp2,
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
                        path: anp1,
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
                image: img04,
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
                image: img05,
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
                image: img06,
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
    {
        title: 'Eje 2. Acceso universal y sustentable al agua y saneamiento',
        id: 'eje2',
        cards: [
            {
                image: organismosO,
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
                image: AguaP,
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
                image: Alcantarillado,
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
                image: AguasR,
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
                image: Inspeccion,
                title: 'Inspección y vigilancia',
                links: [
                    {
                        text: 'Inspección y vigilancia',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            },
            {
                image: Reuso,
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
    {
        title: 'Eje 3. Uso responsable y sostenible del agua',
        id: 'eje3',
        cards: [
            {
                image: Usos,
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
                image: Distritos,
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
                    }
                ]
            },
            {
                image: Eficiencias,
                title: 'Eficiencias en el uso del agua',
                links: [
                    {
                        text: 'Eficiencias en el uso del agua',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            }
        ]
    },
    {
        title: 'Eje 4. Resiliencia y adaptación a fenómenos hidrometeorológicos',
        id: 'eje4',
        cards: [
            {
                image: climatologica,
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
                image: Hidormetricas,
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
                image: Presas,
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
                image: Atlas,
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
                image: Ordenamiento,
                title: 'Programas de ordenamiento ecológico territorial',
                links: [
                    {
                        text: 'Programas de ordenamiento ecológico territorial',
                        path: 'https://bitacora.semarnath.gob.mx/ordenamientos.html'
                    }
                ]
            },
            {
                image: Infraestructura,
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
                image: fenomenos,
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
    {
        title: 'Eje 5. Gobernanza hídrica participativa y transparente',
        id: 'eje5',
        cards: [
            {
                image: Recaudacion,
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
                image: Presupuesto,
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
                image: Centros,
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
                                text: 'Acta de conformación',
                                path: acta,
                                target: '_blank',
                            },
                            {
                                text: 'Estrategía de atención',
                                path: acta3,
                                target: '_blank',
                            }
                        ]
                    }
                ]
            },
            {
                image: Centro,
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
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            },
            {
                image: Proceso,
                title: 'Proceso para la integración del Programa Hídrico del Estado de Hidalgo',
                links: [
                    {
                        text: 'Proceso para la integración del Programa Hídrico del Estado de Hidalgo',
                        path: proceso,
                        target: '_blank',
                    }
                ]
            },
            {
                image: Marco,
                title: 'Marco legal',
                links: [
                    {
                        text: 'Internacional',
                        path: internacional,
                        target: '_blank',
                    },
                    {
                        text: 'Nacional',
                        path: nacional,
                        target: '_blank',
                    },
                    {
                        text: 'Estatal',
                        path: estatal,
                        target: '_blank',
                    },

                ]
            },
            {
                image: img06,
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
    {
        title: 'Cartografía',
        id: 'cartografia',
        cards: [
            {
                image: Lorem,
                title: 'Zonificación por acuífero',
                links: [
                    {
                        text: 'Acuíferos',
                        path: '/observatorio',
                        layerName: 'Hidalgo:cart_zonifacuifero',
                        crs: CRS.WEB_MERCATOR,
                        geomType: GEOM_TYPES.POLYGON
                    }
                ]
            },
            {
                image: Lorem,
                title: 'Acuíferos de Hidalgo',
                links: [
                    {
                        text: 'Acuíferos de Hidalgo',
                        action: 'openVisorAcuiferos',
                    },
                ]
            },
            {
                image: Lorem,
                title: 'Cuerpos de agua',
                links: [
                    {
                        text: 'Cuerpos de  agua',
                        path: '/observatorio',
                        layerName: ''
                    }
                ]
            }
        ]
    },
];
