import { COLORS } from './colors';

export const legendData = {
  // --- Contexto Geográfico y Socioeconómico ---
  'Hidalgo:00_Estado': {
    title: 'Estado de Hidalgo',
    type: 'polygon',
    items: [{ color: 'transparent', borderColor: COLORS.BLACK, label: 'Límite estatal' }],
    note: 'Fuente: INEGI 2024',
  },
  'Hidalgo:00_Municipios': {
    title: 'Municipios',
    type: 'polygon',
    items: [{ color: 'transparent', borderColor: COLORS.RED, label: 'Límite municipal' }],
    note: 'Fuente: INEGI 2024',
  },
  'Hidalgo:00_Localidades': {
    title: 'Localidades',
    type: 'point',
    items: [{ color: COLORS.DEFAULT, borderColor: COLORS.BLACK, label: 'Localidad' }],
    note: 'Fuente: INEGI 2020',
  },
  'Hidalgo:00_Censoestado': {
    title: 'Censo Estatal',
    type: 'polygon',
    items: [{ color: '#D45B07', label: 'Estado' }],
    note: 'Fuente: INEGI 2020',
  },
  'Hidalgo:00_Censomunicipio': {
    title: 'Población por Municipio (habitantes)',
    type: 'ranged-polygon',
    propertyName: 'Población total',
    items: [
      { value: 13000, color: '#FFDAB5', label: 'Menos de 13,000' },
      { value: 20000, color: '#FDB871', label: '13,000 - 20,000' },
      { value: 38000, color: '#F28F27', label: '20,001 - 38,000' },
      { value: Infinity, color: '#D45B07', label: 'Más de 38,001' },
    ],
    note: 'Fuente: INEGI 2020',
  },
  'Hidalgo:00_Censolocalidad': {
    title: 'Población por Localidad (habitantes)',
    type: 'ranged-point',
    propertyName: 'Población total',
    items: [
      { value: 249, color: '#FFDAB5', label: 'Menos de 249' },
      { value: 999, color: '#FDB871', label: '250 - 999' },
      { value: 4999, color: '#F28F27', label: '1,000 - 4,999' },
      { value: 29999, color: '#D45B07', label: '5,000 - 29,999' },
      { value: Infinity, color: '#d40707ff', label: 'Más de 30,000' },
    ],
    note: 'Fuente: INEGI 2020',
  },
  'Hidalgo:00_macrorregiones': {
    title: 'Regiones',
    type: 'categorical-polygon',
    propertyName: 'Región',
    items: [
      { label: 'Actopan', color: '#d7191c', },
      { label: 'Apan', color: '#e44b33', },
      { label: 'Huejutla', color: '#f07c4a', },
      { label: 'Huichapan', color: '#fdae61', },
      { label: 'Ixmiquilpan', color: '#fec980', },
      { label: 'Jacala', color: '#fee4a0', },
      { label: 'Mineral de la Reforma', color: '#ffffbf', },
      { label: 'Pachuca', color: '#e3f4b6', },
      { label: 'Tizayuca', color: '#c7e8ad', },
      { label: 'Tula', color: '#abdda4', },
      { label: 'Tulancingo', color: '#80bfab', },
      { label: 'Zacualtipan', color: '#56a1b3', }
    ],
    note: 'Fuente: SEMARNATH 2024',
  },

  // --- Eje 1. Conservación hídrica ---
  'Hidalgo:01_precipitacion': {
    title: 'Precipitación (mm/año)',
    type: 'ranged-polygon',
    propertyName: 'Anual (mm)',
    items: [
      { value: 350, color: '#a7d6f1ff', label: 'Menor a 350 ' },
      { value: 500, color: '#4c8eb9ff', label: '350 - 500 ' },
      { value: 850, color: '#2171b5', label: '501 - 850 ' },
      { value: Infinity, color: '#08306b', label: 'Mayor a 851 ' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_dispcuencas': {
    title: 'Disponibilidad Cuencas',
    type: 'categorical-polygon',
    propertyName: 'situacion',
    items: [
      { label: 'Con disponibilidad', color: COLORS.GREEN, },
      { label: 'Sin disponibilidad', color: COLORS.RED, }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_dispacuiferos': {
    title: 'Disponibilidad Acuíferos',
    type: 'categorical-polygon',
    propertyName: 'Situación',
    items: [
      { label: 'Con Disponibilidad', color: COLORS.WATER, },
      { label: 'Sin Disponibilidad', color: COLORS.RED, }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_sitios': {
    title: 'Sitios de Monitoreo',
    type: 'point',
    items: [
      { color: COLORS.LIGHT_GREEN, label: 'Superficiales' },
      { color: COLORS.WATER, label: 'Subterráneos' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },

  'Hidalgo:01_calidadagua': {
    title: 'Calidad del Agua',
    type: 'categorical-point',
    propertyName: 'Semaforo',
    items: [
      { label: 'Rojo', color: COLORS.RED },
      { label: 'Amarillo', color: COLORS.YELLOW },
      { label: 'Verde', color: COLORS.LIGHT_GREEN }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_ANP': {
    title: 'Áreas Naturales Protegidas',
    type: 'polygon',
    items: [{ color: COLORS.PROTECTED_AREA, label: 'ANP' }],
    note: 'Fuente: CONANP 2023',
  },
  'Hidalgo:01_advc': {
    title: 'Áreas destinadas voluntariamente a la conservación',
    type: 'polygon',
    items: [{ color: COLORS.PROTECTED_AREA, label: 'ADVC' }],
    note: 'Fuente: CONANP 2023',
  },
  'Hidalgo:01_humedales': {
    title: 'Humedales',
    type: 'polygon',
    items: [{ color: COLORS.WETLAND, label: 'Humedal' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_ehyca': {
    title: 'Emergencias Hidroecológicas',
    type: 'point',
    items: [{ color: COLORS.EMERGENCY, label: 'Punto de Emergencia' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_descargas': {
    title: 'Descargas de Aguas Residuales',
    type: 'point',
    items: [{ color: COLORS.DISCHARGE, label: 'Punto de Descarga' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_cuencavedas': {
    title: 'Vedas en Cuencas',
    type: 'polygon',
    items: [{ color: COLORS.LIGHT_GREEN, label: 'Veda' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_cuencareservas': {
    title: 'Reservas en Cuencas',
    type: 'polygon',
    items: [{ color: COLORS.GREEN, label: 'Reserva' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_acuifvedas': {
    title: 'Acuíferos en Veda',
    type: 'polygon',
    items: [
      { label: 'Veda', color: COLORS.LIGHT_GREEN, },
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:01_acuifacuerdogral': {
    title: 'Acuerdo general de Acuíferos',
    type: 'polygon',
    items: [
      { label: 'Acuerdo general', color: COLORS.DISCHARGE, }
    ],
    note: 'Fuente: CONAGUA 2023',
  },

  // --- Eje 2. Acceso universal y sustentable al agua y saneamiento ---
  'Hidalgo:02_potabilizadoras': {
    title: 'Plantas Potabilizadoras',
    type: 'point',
    items: [{ color: COLORS.DEFAULT, label: 'Planta Potabilizadora' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:02_abastecimiento': {
    title: 'Servicios de suministro de agua potable gestionados de manera segura',
    type: 'polygon',
    items: [{ color: COLORS.DISCHARGE, label: 'Servicios de suministro de agua potable' }],
    note: 'Fuente: INEGI 2024',
  },
  'Hidalgo:02_alcantarillado': {
    title: 'Redes de Alcantarillado',
    type: 'ranged-polygon',
    propertyName: 'Cobertura (%)',
    items: [
      { value: 85, color: COLORS.WHITE, label: 'Menor a 85%' },
      { value: 90, color: '#cfc0b1', label: '85% - 90%' },
      { value: 95, color: '#a08162', label: '90.1% - 95%' },
      { value: Infinity, color: '#704214', label: 'Mayor a 95.1%' }
    ],
    note: 'Fuente: INEGI 2020',
  },
  'Hidalgo:02_cloracionmpio': {
    title: 'Eficiencia de Cloración (Municipio)',
    type: 'ranged-polygon',
    propertyName: 'Eficiencia de cloración (%)',
    items: [
      { value: 75, color: '#edf8fb', label: 'Menor a 75%' },
      { value: 85, color: '#b2e2e2', label: '75% - 85%' },
      { value: 90, color: '#66c2a4', label: '85.1% - 90%' },
      { value: 95, color: '#2ca25f', label: '90.1% - 95%' },
      { value: Infinity, color: '#006d2c', label: 'Mayor a 95.1%' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:02_ptarmunicipales': {
    title: 'Plantas de Tratamiento de Aguas Residuales Municipales',
    type: 'categorical-point',
    propertyName: 'Proceso',
    items: [
      { label: 'FAFA + Filtro percolador', color: '#d7191c' },
      { label: 'FAFA + Humedales', color: '#e44b33' },
      { label: 'Filtro anaerobio de flujo ascendente (FAFA)', color: '#f07c4a' },
      { label: 'Filtro percolador', color: '#fdae61' },
      { label: 'Humedal', color: '#fec980' },
      { label: 'Lagunas aireadas', color: '#fee4a0' },
      { label: 'Lagunas de estabilización', color: '#ffffbf' },
      { label: 'Lagunas facultativas', color: '#e3f4b6' },
      { label: 'Lodos activados', color: '#c7e8ad' },
      { label: 'Lodos activados (aireación extendida)', color: '#abdda4' },
      { label: 'Otros', color: '#80bfab' },
      { label: 'RAFA + Filtro percolador', color: '#56a1b3' },
      { label: 'RAFA + Humedales', color: '#7759da' },
      { label: 'RAFA + Lodos Activados', color: '#80c963' },
      { label: 'RAFA + Reactor aerobio', color: '#d03922' },
      { label: 'Reactor anaerobio de flujo ascendente (RAFA)', color: '#2eded8' },
      { label: 'Tanque Imhoff', color: '#24aee5' },
      { label: 'Tanque séptico', color: '#2468ce' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:02_orgoperadores': {
    title: 'Organismos Operadores',
    type: 'categorical-polygon',
    propertyName: 'Tipo de Prestador',
    items: [
      { label: 'Centralizado', color: '#72d55c', },
      { label: 'OPD paraestatal', color: '#ba49d0', },
      { label: 'OPD paramunicipal', color: '#74c1e8', },
      { label: 'Sin Organismo Operador', color: '#ffff', }
    ],
    note: 'Fuente: INEGI 2022',
  },
  'Hidalgo:02_cobaguapotable': {
    title: 'Cobertura de Agua Potable',
    type: 'ranged-polygon',
    propertyName: 'Cobertura (%)',
    items: [
      { value: 95, color: '#16fff9', label: 'Menor a 95%' },
      { value: 97.5, color: '#0bb9e2', label: '95% - 97.5%' },
      { value: Infinity, color: '#0073cb', label: 'Mayor a 97.6%' }
    ],
    note: 'Fuente: INEGI 2020',
  },
  'Hidalgo:02_ptarnomunicipales': {
    title: 'Plantas de Tratamiento de Aguas Residuales No Municipales',
    type: 'categorical-polygon',
    propertyName: 'Proceso de Tratamiento',
    items: [
      { label: 'Anaerobio', color: '#d7191c', },
      { label: 'Biologico', color: '#e44b33', },
      { label: 'Dual', color: '#f07c4a', },
      { label: 'Lodos activados', color: '#fdae61', },
      { label: 'Otros', color: '#fec980', },
      { label: 'Primario', color: '#fee4a0', },
      { label: 'Reactor enzimático', color: '#ffffbf', },
      { label: 'Tanque Imhoff', color: '#e3f4b6', },
      { label: 'Tanque séptico', color: '#c7e8ad', },
      { label: 'Terciario', color: '#abdda4', }
    ],
    note: 'Fuente: CONAGUA 2023',
  },

  // --- Eje 3. Uso responsable y sostenible del agua ---
  'Hidalgo:03_usoconsuntivo': {
    title: 'Usos Consuntivos ',
    type: 'variant',
    variants: {
      'Total SB (hm³)': {
        type: 'ranged-polygon',
        propertyName: 'Total SB (hm³)',
        items: [
          { value: 0, color: COLORS.WHITE, label: 'Sin uso' },
          { value: 0.5, color: '#81a832', label: 'Menor o igual a 0.5 ' },
          { value: 2.6, color: '#638e2d', label: ' 0.51 - 2.6 ' },
          { value: Infinity, color: '#457428', label: 'Mayor a 2.7' },
        ],
        note: 'Fuente: CONAGUA 2023',
      },
      'Total SP (hm³)': {
        type: 'ranged-polygon',
        propertyName: 'Total SP (hm³)',
        items: [
          { value: 0, color: COLORS.WHITE, label: 'Sin uso' },
          { value: 0.7, color: '#bcdc3c', label: 'menor a 0.7 Hm³' },
          { value: 1.5, color: '#9ec237', label: '0.7 - 1.5 Hm³' },
          { value: 6.8, color: '#81a832', label: '1.51 - 6.8 Hm³' },
          { value: 37.3, color: '#638e2d', label: ' 6.81 - 37.3 Hm³' },
          { value: Infinity, color: '#457428', label: 'Mayor o igual a 37.31 Hm³' }
        ],
        note: 'Fuente: CONAGUA 2023',
      },
    },
  },
  'Hidalgo:03_drcultivos': {
    title: 'Producción de Cultivos',
    type: 'ranged-polygon',
    propertyName: 'Producción agrícola (Toneladas)',
    items: [
      { value: 159951, color: '#f7fcf5', label: 'Menor a 159,951 ' },
      { value: 994722, color: '#7bc77c', label: '159,952 - 994,722 ' },
      { value: Infinity, color: '#00441b', label: 'Mayor a 994,723 ' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:03_drvolumenes': {
    title: 'Volumen Distribuido',
    type: 'ranged-polygon',
    propertyName: ' Volumen distribuido (hm³)',
    items: [
      { value: 32, color: '#f7fcf5', label: 'Menor a 32 hm³' },
      { value: 346, color: '#7bc77c', label: '32.1 hm³ - 346 hm³' },
      { value: Infinity, color: '#00441b', label: 'Mayor a 346.1 hm³' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:03_drprodfisica': {
    title: 'Producción agrícola',
    type: 'variant',
    variants: {
      'Productividad física (Kg/m³)': {
        type: 'ranged-polygon',
        propertyName: 'Productividad física (Kg/m³)',
        items: [
          { value: 2.59, color: '#f7fcf5', label: 'Menor a 2.59 kg/m³' },
          { value: 3.04, color: '#c9eac2', label: '2.59 - 3.04 kg/m³' },
          { value: 4.3, color: '#7bc77c', label: '3.05 - 4.3 kg/m³' },
          { value: 5.86, color: '#2a924b', label: '4.31 - 5.86 kg/m³' },
          { value: Infinity, color: '#00441b', label: 'Mayor a 5.87 kg/m³' }
        ],
        note: 'Fuente: CONAGUA 2023',
      },
      'Productividad económica (pesos constantes de 2012/m³)': {
        type: 'ranged-polygon',
        propertyName: 'Productividad económica (pesos constantes de 2012/m³)',
        items: [
          { value: 4, color: COLORS.WHITE, label: 'Menor a 4 pesos/m³' },
          { value: 4.5, color: '#ffbfbf', label: '4 - 4.5 pesos/m³' },
          { value: 6.5, color: '#ff8080', label: '4.51 - 6.5 pesos/m³' },
          { value: 11.5, color: '#ff4040', label: '6.51 - 11.5 pesos/m³' },
          { value: Infinity, color: COLORS.RED, label: 'Mayora 11.51 pesos/m³' }
        ],
        note: 'Fuente: CONAGUA 2023',
      },
    },
  },

  // --- Eje 4. Resiliencia y adaptación a fenómenos hidrometeorológicos ---
  'Hidalgo:04_climatologicas': {
    title: 'Estaciones Climatológicas',
    type: 'point',
    items: [{ color: COLORS.WATER, label: 'Estaciones Climatológicas' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:04_hidrometricas': {
    title: 'Estaciones Hidrométricas',
    type: 'point',
    items: [{ color: COLORS.LIGHT_GREEN, label: 'Estaciones Hidrométricas' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:04_presas': {
    title: 'Presas',
    type: 'point',
    items: [{ color: '#a7d6f1ff', label: 'Presas' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:04_infrapresas': {
    title: 'Infraestructura de Presas',
    type: 'point',
    items: [{ color: '#2d25a5ff', label: 'Infraestructura de Presas' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:04_hidrometeorologicos': {
    title: 'Fenómenos hidrometeorológicos',
    type: 'ranged-polygon',
    propertyName: 'Total',
    items: [
      { value: 2, color: '#ffffb2', label: 'Menor a 2' },
      { value: 5, color: '#feb751', label: '2 - 5' },
      { value: 7, color: '#f45629', label: '5.1 - 7' },
      { value: Infinity, color: '#bd0026', label: 'Mayor a 7.1' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:04_riesgosmunicipales': {
    title: 'Riesgos Municipales',
    type: 'variant',
    variants: {
      'Sequía': {
        type: 'categorical-polygon',
        propertyName: 'Sequía',
        items: [
          { label: 'Muy alto', color: '#e41a1c', },
          { label: 'Alto', color: '#ff7f00', },
          { label: 'Medio', color: '#fdff7a', },
          { label: 'Bajo', color: '#4daf4a', },
          { label: 'Muy bajo', color: '#a6cee3', }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Onda de calor': {
        type: 'categorical-polygon',
        propertyName: 'Onda de calor',
        items: [
          { label: 'Muy alto', color: '#e41a1c', },
          { label: 'Alto', color: '#ff7f00', },
          { label: 'Medio', color: '#fdff7a', },
          { label: 'Bajo', color: '#4daf4a', },
          { label: 'Muy bajo', color: '#a6cee3', }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Bajas temperaturas': {
        type: 'categorical-polygon',
        propertyName: 'Bajas temperaturas',
        items: [
          { color: '#e41a1c', label: 'Muy Alto' },
          { color: '#ff7f00', label: 'Alto' },
          { color: '#fdff7a', label: 'Medio' },
          { color: '#4daf4a', label: 'Bajo' },
          { color: '#a6cee3', label: 'Muy Bajo' }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Tormenta eléctrica': {
        type: 'categorical-polygon',
        propertyName: 'Tormenta eléctrica',
        items: [
          { color: '#e41a1c', label: 'Muy Alto' },
          { color: '#ff7f00', label: 'Alto' },
          { color: '#fdff7a', label: 'Medio' },
          { color: '#4daf4a', label: 'Bajo' },
          { color: '#a6cee3', label: 'Muy Bajo' }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Ciclón tropical': {
        type: 'categorical-polygon',
        propertyName: 'Ciclón tropical',
        items: [
          { color: '#e41a1c', label: 'Muy Alto' },
          { color: '#ff7f00', label: 'Alto' },
          { color: '#fdff7a', label: 'Medio' },
          { color: '#4daf4a', label: 'Bajo' },
          { color: '#a6cee3', label: 'Muy Bajo' }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Nevada': {
        type: 'categorical-polygon',
        propertyName: 'Nevada',
        items: [
          { color: '#e41a1c', label: 'Muy Alto' },
          { color: '#ff7f00', label: 'Alto' },
          { color: '#fdff7a', label: 'Medio' },
          { color: '#4daf4a', label: 'Bajo' },
          { color: '#a6cee3', label: 'Muy Bajo' }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Granizada': {
        type: 'categorical-polygon',
        propertyName: 'Granizada',
        items: [
          { color: '#e41a1c', label: 'Muy Alto' },
          { color: '#ff7f00', label: 'Alto' },
          { color: '#fdff7a', label: 'Medio' },
          { color: '#4daf4a', label: 'Bajo' },
          { color: '#a6cee3', label: 'Muy Bajo' }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Tornado': {
        type: 'categorical-polygon',
        propertyName: 'Tornado',
        items: [
          { label: 'Con tornado', color: '#935200', },
          { label: 'Sin tornado', color: '#bababa', },
        ],
        note: 'Fuente: CENAPRED 2023',
      },
      'Inundación': {
        type: 'categorical-polygon',
        propertyName: 'Inundación',
        items: [
          { color: '#e41a1c', label: 'Muy Alto' },
          { color: '#ff7f00', label: 'Alto' },
          { color: '#fdff7a', label: 'Medio' },
          { color: '#4daf4a', label: 'Bajo' },
          { color: '#a6cee3', label: 'Muy Bajo' }
        ],
        note: 'Fuente: CENAPRED 2023',
      },
    },
  },
  'Hidalgo:04_sequias': {
    title: 'Sequías',
    type: 'categorical-polygon',
    propertyName: 'Sequía',
    items: [
      { label: 'Sequía Excepcional', color: '#730000', },
      { label: 'Sequía Extrema', color: COLORS.RED, },
      { label: 'Sequía Severa', color: '#e69800', },
      { label: 'Sequía Moderada', color: '#e69800', },
      { label: 'Anormalmente Seco', color: COLORS.YELLOW, },
      { label: 'Sin Sequía', color: '#dadaeb', }
    ],
    note: 'Fuente: CONAGUA 2025',
  },

  // --- Eje 5. Gobernanza hídrica participativa y transparente ---
  'Hidalgo:05_recextraccion': {
    title: 'Recaudación por Extracción',
    type: 'ranged-polygon',
    propertyName: 'Total mdp',
    items: [
      { value: 0.001, color: '#fcfbfd', label: 'Menor a 0.001 mdp' },
      { value: 0.2, color: '#c9cae3', label: '0.001 - 0.2 mdp' },
      { value: 2, color: '#7c76b6', label: '0.21 - 2 mdp' },
      { value: Infinity, color: '#3f007d', label: 'Mayor a 2.1 mdp' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:05_recobro': {
    title: 'Recaudación por Cobro',
    type: 'ranged-polygon',
    propertyName: 'Total mdp',
    items: [
      { value: 0.009, color: '#fcfbfd', label: 'Menor a 0.009 mdp' },
      { value: 0.3, color: '#ffaaaa', label: '0.009 - 0.3 mdp' },
      { value: 4, color: '#ff5555', label: '0.31 - 4 mdp' },
      { value: Infinity, color: COLORS.RED, label: 'Mayor a 4.1 mdp' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:05_consejocuenca': {
    title: 'Consejos de Cuenca',
    type: 'categorical-polygon',
    propertyName: 'Consejo de cuenca',
    items: [
      { label: 'Río Pánuco', color: '#81a832', },
      { label: 'Ríos Tuxpan al Jamapa', color: '#2ca25f', },
      { label: 'Valle de México', color: '#80c963', }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:05_comiscuenca': {
    title: 'Comisiones de Cuenca',
    type: 'polygon',
    items: [
      { color: COLORS.COMISIONES_CUENCA, label: 'Comisión' }
    ],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:05_comitescuenca': {
    title: 'Comités de Cuenca',
    type: 'polygon',
    items: [{ color: COLORS.COMITES_CUENCA, label: 'Comité' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:05_cotas': {
    title: 'Comités Técnicos de Agua Subterránea',
    type: 'polygon',
    items: [{ color: COLORS.COTAS, label: 'COTAS' }],
    note: 'Fuente: CONAGUA 2023',
  },
  'Hidalgo:05_ola': {
    title: 'Organizaciones locales de agua y saneamiento',
    type: 'point',
    items: [{ color: COLORS.DEFAULT, label: 'OLAS' }],
    note: 'Fuente: SEMARNATH 2025',
  },

  // --- Cartografía ---
  'Hidalgo:cart_zonifacuifero': {
    title: 'Regionalización por acuífero',
    type: 'categorical-polygon',
    propertyName: 'Acuifero',
    items: [
      { label: 'Valle de Tulancingo', color: '#FFDD73', },
      { label: 'Acaxochitlán', color: '#FFFF73', },
      { label: 'Álamo-Tuxpan', color: '#FFFF73', },
      { label: 'Valle del Mezquital', color: '#BEE8FF', },
      { label: 'Ajacuba', color: '#BEE8FF', },
      { label: 'Actopan-Santiago de Anaya', color: '#BEE8FF', },
      { label: 'Tepeji del Río', color: '#BEE8FF', },
      { label: 'Meztitlán', color: '#FFBEBE', },
      { label: 'Huasca-Zoquital', color: '#FFBEBE', },
      { label: 'Amajac', color: '#FFBEBE', },
      { label: 'Atotonilco-Jaltocán', color: '#C29ED7', },
      { label: 'Xochitlán-Huejutla', color: '#C29ED7', },
      { label: 'Atlapexco-Candelaria', color: '#C29ED7', },
      { label: 'Calabozo', color: '#C29ED7', },
      { label: 'Huichapan-Tecozautla', color: '#FF73DF', },
      { label: 'El Astillero', color: '#FF73DF', },
      { label: 'Chapantongo-Alfajayucan', color: '#FF73DF', },
      { label: 'Ixmiquilpan', color: '#FF73DF', },
      { label: 'Cuautitlán-Pachuca', color: '#CDAA66', },
      { label: 'Zimapán', color: '#C7D79E', },
      { label: 'Orizatlán', color: '#C7D79E', },
      { label: 'Tecocomulco', color: '#FF5500', },
      { label: 'Ápan', color: '#FF5500', }
    ],
    note: 'Fuente: SEMARNATH 2025',
  },

};
