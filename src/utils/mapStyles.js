import L from 'leaflet';

// --- CONSTANTES DE COLORES Y RANGOS ---
const COLORS = {
  // Colores base
  WATER: '#2E86C1',
  PROTECTED_AREA: '#239B56',
  WETLAND: '#A9DFBF',
  EMERGENCY: '#F1C40F',
  DISCHARGE: '#8E44AD',
  ORANGE: '#ff7800',
  GRAY: '#8A9597',
  LIGHT_GRAY: '#f0f0f0',
  BORDER_GRAY: '#cccccc',
  BLACK: '#000000',
  RED: '#ff0000',
  GREEN: '#106836ff',
  LIGHT_GREEN: '#2ec16bff',
  LIGHT_ORANGE: '#FFDAB5',
  MEDIUM_ORANGE: '#FDB871',
  DARK_ORANGE: '#F28F27',
  DARKEST_ORANGE: '#D45B07',
  YELLOW: '#FFFF00',
  WHITE: '#ffffff',
  DEFAULT: '#A02142',
  COMISIONES_CUENCA: '#3498DB',
  COMITES_CUENCA: '#2ECC71',
  COTAS: '#9B59B6'
};

// Paleta de precipitación
const PRECIPITATION_COLORS = {
  VERY_HIGH: '#08306b',
  HIGH: '#2171b5',
  MEDIUM: '#4c8eb9ff',
  LOW: '#a7d6f1ff'
};

const POPULATION_RANGES = {
  MUNICIPIO: [13000, 20000, 38000],
  LOCALIDAD: [30, 150, 400]
};

// --- DEFINICIÓN DE ESTILOS BASE ---

// Estilos base para reutilización
const basePointStyle = {
  radius: 6,
  color: COLORS.BLACK,
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

const basePolygonStyle = {
  color: COLORS.BLACK,
  weight: 1,
  fillOpacity: 0.7
};

const outlineStyle = {
  fillOpacity: 0,
  weight: 2
};

// -- Estilos para PUNTOS --
const stylePointDefault = {
  ...basePointStyle,
  fillColor: COLORS.DEFAULT
};

const styleSup = {
  ...basePointStyle,
  fillColor: COLORS.LIGHT_GREEN
};

const styleSub = {
  ...basePointStyle,
  fillColor: COLORS.WATER
};

const stylePointYellow = {
  ...basePointStyle,
  fillColor: COLORS.EMERGENCY
};

const stylePointPurple = {
  ...basePointStyle,
  fillColor: COLORS.DISCHARGE
};

const stylePresa = {
  ...basePointStyle,
  fillColor: '#a7d6f1ff'
};

const styleIPresa = {
  ...basePointStyle,
  fillColor: '#2d25a5ff'
};


// -- Estilos para POLÍGONOS --
const styleOutlineRed = {
  ...outlineStyle,
  color: COLORS.RED
};

const styleANP = {
  ...basePolygonStyle,
  fillColor: COLORS.PROTECTED_AREA
};

const stylePolygonWetland = {
  ...basePolygonStyle,
  fillColor: COLORS.WETLAND
};

const styleDisponibilidadC = {
  ...basePolygonStyle,
  fillColor: COLORS.GREEN
};

const styleVedaCuencas = {
  ...basePolygonStyle,
  fillColor: COLORS.LIGHT_GREEN
};

const styleHidrantes = {
  ...basePolygonStyle,
  fillColor: COLORS.DISCHARGE
};

const styleComisionesCuenca = {
  ...basePolygonStyle,
  fillColor: COLORS.COMISIONES_CUENCA
};

const styleComitesCuenca = {
  ...basePolygonStyle,
  fillColor: COLORS.COMITES_CUENCA
};

const styleCotas = {
  ...basePolygonStyle,
  fillColor: COLORS.COTAS
};

const styleConsejoCuenca = {
  ...basePolygonStyle,
  fillColor: COLORS.DEFAULT
};

// --- FUNCIONES DE ESTILO DINÁMICO ---

/**
 * Estilo para censo de municipios basado en población
 */
const styleCensoMunicipio = (feature) => {
  const poblacion = parseFloat(feature.properties['Población total']) || 0;
  let fillColor;

  if (poblacion > POPULATION_RANGES.MUNICIPIO[2]) {
    fillColor = COLORS.DARKEST_ORANGE;
  } else if (poblacion > POPULATION_RANGES.MUNICIPIO[1]) {
    fillColor = COLORS.DARK_ORANGE;
  } else if (poblacion > POPULATION_RANGES.MUNICIPIO[0]) {
    fillColor = COLORS.MEDIUM_ORANGE;
  } else {
    fillColor = COLORS.LIGHT_ORANGE;
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

/**
 * Estilo para ordenamiento de acuíferos
 */
const styleOrdenamientoAcuiferos = (feature) => {
  const ordenamiento = feature.properties['Tipo de Ordenamiento'];
  let fillColor;

  if (ordenamiento === 'Veda') {
    fillColor = COLORS.LIGHT_GREEN;
  } else if (ordenamiento === 'Acuerdo general') {
    fillColor = COLORS.DISCHARGE;
  } else {
    fillColor = COLORS.LIGHT_GRAY;
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

/**
 * Estilo para precipitación
 */
const stylePrecipitacion = (feature) => {
  const precip = parseFloat(feature.properties['Anual (mm)']) || 0;
  let fillColor;

  if (precip > 850) {
    fillColor = PRECIPITATION_COLORS.VERY_HIGH;
  } else if (precip > 500) {
    fillColor = PRECIPITATION_COLORS.HIGH;
  } else if (precip > 350) {
    fillColor = PRECIPITATION_COLORS.MEDIUM;
  } else {
    fillColor = PRECIPITATION_COLORS.LOW;
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};


const styleCuencasDisponibilidad = (feature) => {
  const dispo = feature.properties.situacion;
  let fillColor;

  if (dispo === 'Con disponibilidad') {
    fillColor = COLORS.GREEN;
  } else {
    fillColor = COLORS.RED;
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleDisponibilidadAcuiferos = (feature) => {
  const dispo = feature.properties.Situación;
  let fillColor;

  if (dispo === 'Con Disponibilidad') {
    fillColor = COLORS.WATER;
  } else {
    fillColor = COLORS.RED;
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}



const styleEficienciaCloracion = (feature) => {
  const eficiencia = parseFloat(feature.properties['Eficiencia de cloración (%)']) || 0;
  let fillColor;

  if (eficiencia >= 95) {
    fillColor = '#006d2c';
  } else if (eficiencia >= 90) {
    fillColor = '#2ca25f';
  } else if (eficiencia >= 85) {
    fillColor = '#66c2a4';
  } else if (eficiencia >= 75) {
    fillColor = '#b2e2e2';
  } else {
    fillColor = '#edf8fb';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}

const styleCoberturaAlcantarillado = (feature) => {
  const cobertura = parseFloat(feature.properties['Cobertura (%)']) || 0;
  let fillColor;

  if (cobertura >= 95) {
    fillColor = '#704214';
  } else if (cobertura >= 90) {
    fillColor = '#a08162';
  } else if (cobertura >= 85) {
    fillColor = '#cfc0b1';
  } else {
    fillColor = '#ffffff';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}


const styleRecaudacionExtraccion = (feature) => {
  const recaudacion = parseFloat(feature.properties.Total) || 0;
  let fillColor;

  if (recaudacion > 2) {
    fillColor = '#3f007d';
  } else if (recaudacion > 0.2) {
    fillColor = '#7c76b6';
  } else if (recaudacion > 0.001) {
    fillColor = '#c9cae3';
  } else {
    fillColor = '#fcfbfd';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}


const sytleRecaudacionCobro = (feature) => {
  const recaudacion = parseFloat(feature.properties.Total) || 0;
  let fillColor;

  if (recaudacion > 4) {
    fillColor = '#ff0000';
  } else if (recaudacion > 0.3) {
    fillColor = '#ff5555';
  } else if (recaudacion > 0.009) {
    fillColor = '#ffaaaa';
  } else {
    fillColor = '#fcfbfd';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}

const styleusosSB = (feature) => {
  const uso = parseFloat(feature.properties['Total SB (hm³)']) || 0;
  let fillColor;

  if (uso > 9.7) {
    fillColor = '#457428';
  } else if (uso > 2.6) {
    fillColor = '#638e2d';
  } else if (uso > 0.5) {
    fillColor = '#81a832';
  } else if (uso > 0) {
    fillColor = '#81a832';
  } else {
    fillColor = '#ffffff';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}

const styleusosSP = (feature) => {
  const uso = parseFloat(feature.properties['Total SP (hm³)']) || 0;
  let fillColor;

  if (uso > 37.3) {
    fillColor = '#457428';
  } else if (uso > 6.8) {
    fillColor = '#638e2d';
  } else if (uso > 1.5) {
    fillColor = '#81a832';
  } else if (uso > 0.7) {
    fillColor = '#9ec237';
  } else if (uso > 0) {
    fillColor = '#bcdc3c';
  } else {
    fillColor = '#ffffff';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}


const styleCultivos = (feature) => {
  const cultivo = parseFloat(feature.properties['Producción agrícola (Toneladas)']) || 0;
  let fillColor;

  if (cultivo > 994722) {
    fillColor = '#00441b';
  } else if (cultivo > 159951) {
    fillColor = '#7bc77c';
  } else {
    fillColor = '#f7fcf5';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleVolumenes = (feature) => {
  const rawVolumen = feature.properties['Volumen distribuido (hm³)'];
  const volumen = parseFloat(String(rawVolumen).replace(',', '.')) || 0;

  let fillColor;

  if (volumen > 346) {
    fillColor = '#00441b';
  } else if (volumen > 32) {
    fillColor = '#7bc77c';
  } else {
    fillColor = '#f7fcf5';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleMacrorregiones = (feature) => {
  const mregion = feature.properties.Macrorregión;
  let fillColor;

  if (mregion === 'Actopan') {
    fillColor = '#d7191c';
  } else if (mregion === 'Apan') {
    fillColor = '#e44b33';
  } else if (mregion === 'Huejutla') {
    fillColor = '#f07c4a';
  } else if (mregion === 'Huichapan') {
    fillColor = '#fdae61';
  } else if (mregion === 'Ixmiquilpan') {
    fillColor = '#fec980';
  } else if (mregion === 'Jacala') {
    fillColor = '#fee4a0';
  } else if (mregion === 'Mineral de la Reforma') {
    fillColor = '#ffffbf';
  } else if (mregion === 'Pachuca') {
    fillColor = '#e3f4b6';
  } else if (mregion === 'Tizayuca') {
    fillColor = '#c7e8ad';
  } else if (mregion === 'Tula') {
    fillColor = '#abdda4';
  } else if (mregion === 'Tulancingo') {
    fillColor = '#80bfab';
  } else if (mregion === 'Zacualtipan') {
    fillColor = '#56a1b3';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleoOperadores = (feature) => {
  const organismo = feature.properties['Tipo de Prestador'];
  let fillColor;

  if (organismo === 'Centralizado') {
    fillColor = '#72d55c';
  } else if (organismo === 'OPD paraestatal') {
    fillColor = '#ba49d0';
  } else if (organismo === 'OPD paramunicipal') {
    fillColor = '#74c1e8';
  } else {
    fillColor = '#d5794e';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleCobPotable = (feature) => {
  const potable = parseFloat(feature.properties['Cobertura (%)']) || 0;
  let fillColor;

  if (potable > 97.5) {
    fillColor = '#0073cb';
  } else if (potable > 95) {
    fillColor = '#0bb9e2';
  } else {
    fillColor = '#16fff9';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleptarNoMunicipales = (feature) => {
  const ptar = feature.properties['Proceso de Tratamiento'];
  let fillColor;

  if (ptar === 'Anaerobio') {
    fillColor = '#d7191c';
  } else if (ptar === 'Biologico') {
    fillColor = '#e44b33';
  } else if (ptar === 'Dual') {
    fillColor = '#f07c4a';
  } else if (ptar === 'Lodos activados') {
    fillColor = '#fdae61';
  } else if (ptar === 'Otros') {
    fillColor = '#fec980';
  } else if (ptar === 'Primario') {
    fillColor = '#fee4a0';
  } else if (ptar === 'Reactor enzimático') {
    fillColor = '#ffffbf';
  } else if (ptar === 'Tanque Imhoff') {
    fillColor = '#e3f4b6';
  } else if (ptar === 'Tanque séptico') {
    fillColor = '#c7e8ad';
  } else if (ptar === 'Terciario') {
    fillColor = '#abdda4';
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};

const styleProduccion = (feature) => {
  const produccion = parseFloat(feature.properties['Productividad física (Kg/m³)']) || 0;
  let fillColor;

  if (produccion > 5.86) {
    fillColor = '#00441b';
  } else if (produccion > 4.3) {
    fillColor = '#2a924b';
  } else if (produccion > 3.04) {
    fillColor = '#7bc77c';
  } else if (produccion > 2.59) {
    fillColor = '#c9eac2';
  } else {
    fillColor = '#f7fcf5';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}

const styleProduccionE = (feature) => {
  const produccion = parseFloat(feature.properties['Productividad económica (pesos constantes de 2012/m³)']) || 0;
  let fillColor;

  if (produccion > 11.5) {
    fillColor = '#ff0000';
  } else if (produccion > 6.5) {
    fillColor = '#ff4040';
  } else if (produccion > 4.5) {
    fillColor = '#ff8080';
  } else if (produccion > 4) {
    fillColor = '#ffbfbf';
  } else {
    fillColor = '#ffffff';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}

const styleHidrometeorologicos = (feature) => {
  const uso = parseFloat(feature.properties.Total) || 0;
  let fillColor;

  if (uso >= 7) {
    fillColor = '#bd0026';
  } else if (uso >= 5) {
    fillColor = '#f45629';
  } else if (uso >= 2) {
    fillColor = '#feb751';
  } else {
    fillColor = '#ffffb2';
  }
  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
}

const styleRiesgoGenerico = (feature, propertyName) => {
  const nivel = feature.properties[propertyName];
  let fillColor;

  switch (nivel) {
    case 'Muy alto':
      fillColor = '#e41a1c';
      break;
    case 'Alto':
      fillColor = '#ff7f00';
      break;
    case 'Medio':
      fillColor = '#fdff7a';
      break;
    case 'Bajo':
      fillColor = '#4daf4a';
      break;
    case 'Muy bajo':
      fillColor = '#a6cee3';
      break;
    default:
      fillColor = '#f0f0f0';
  }

  return { ...basePolygonStyle, fillColor, color: COLORS.BLACK };
};

// Función específica para Tornado
const styleTornado = (feature) => {
  const nivel = feature.properties['Tornado'];
  let fillColor;

  if (nivel === 'Con tornado') {
    fillColor = '#935200';
  } else {
    fillColor = '#bababa'; // 'Sin tornado'
  }

  return { ...basePolygonStyle, fillColor, color: COLORS.BLACK };
};


const styleSequias = (feature) => {
  const nivel = feature.properties.Sequía;

  // ✅ DEBUG: Verificar qué datos están llegando
  console.log('🎨 Aplicando estilo sequías:', {
    quincena: feature.properties.Quincena,
    nivel: nivel,
    featureId: feature.id
  });

  let fillColor;

  switch (nivel) {
    case 'Sequía Excepcional':
      fillColor = '#730000';
      break;
    case 'Sequía Extrema':
      fillColor = 'red';
      break;
    case 'Sequía Severa':
      fillColor = '#e69800';
      break;
    case 'Sequía Moderada':
      fillColor = '#e69800';
      break;
    case 'Anormalmente Seco':
      fillColor = 'yellow';
      break;
    case 'Sin Sequía':
      fillColor = '#dadaeb';
      break;
    default:
      fillColor = 'gray';
      console.warn('⚠️ Nivel de sequía desconocido:', nivel);
  }

  return {
    ...basePolygonStyle,
    fillColor,
    color: COLORS.BLACK
  };
};



/**
 * Estilo para calidad del agua
 */
const pointCalidad = (feature, latlng) => {
  const calidad = feature.properties.Semaforo;
  let fillColor;

  if (calidad === 'Rojo') {
    fillColor = COLORS.RED;
  } else if (calidad === 'Amarillo') {
    fillColor = COLORS.YELLOW;
  } else {
    fillColor = COLORS.LIGHT_GREEN;
  }

  return L.circleMarker(latlng, {
    ...basePointStyle,
    fillColor,
    fillOpacity: 0.9
  });
};


/**
 * Estilo para censo de localidades
 */
const pointToLayerCensoLocalidad = (feature, latlng) => {
  const poblacion = parseFloat(feature.properties['Población total']) || 0;
  let fillColor;

  if (poblacion > POPULATION_RANGES.LOCALIDAD[2]) {
    fillColor = COLORS.DARKEST_ORANGE;
  } else if (poblacion > POPULATION_RANGES.LOCALIDAD[1]) {
    fillColor = COLORS.DARK_ORANGE;
  } else if (poblacion > POPULATION_RANGES.LOCALIDAD[0]) {
    fillColor = COLORS.MEDIUM_ORANGE;
  } else {
    fillColor = COLORS.LIGHT_ORANGE;
  }

  return L.circleMarker(latlng, {
    ...basePointStyle,
    fillColor,
    fillOpacity: 0.9
  });
};

// --- FUNCIONES DE LAYER SIMPLES ---
const pointToLayerGeneric = (feature, latlng) => L.circleMarker(latlng, stylePointDefault);
const pointSuperficial = (feature, latlng) => L.circleMarker(latlng, styleSup);
const pointSubterraneo = (feature, latlng) => L.circleMarker(latlng, styleSub);
const pointToLayerEmergencias = (feature, latlng) => L.circleMarker(latlng, stylePointYellow);
const pointToLayerDescargas = (feature, latlng) => L.circleMarker(latlng, stylePointPurple);
const pointToLayerEClimatologicas = (feature, latlng) => L.circleMarker(latlng, styleSub);
const pointToLayerEHidrometricas = (feature, latlng) => L.circleMarker(latlng, styleSup);
const pointToLayerPresas = (feature, latlng) => L.circleMarker(latlng, stylePresa);
const pointToLayerIPresas = (feature, latlng) => L.circleMarker(latlng, styleIPresa);

// --- FUNCIÓN PRINCIPAL DE ESTILOS ---
export function getLayerOptions(layerName, variant = null) {
  if (layerName === 'Hidalgo:03_drprodfisica') {
    const activeVariant = variant || 'Productividad física (Kg/m³)'; // por defecto
    const styleFunction =
      activeVariant === 'Productividad física (Kg/m³)'
        ? styleProduccion
        : styleProduccionE; // define ambos estilos arriba
    return { style: styleFunction };
  }
  if (layerName === 'Hidalgo:03_usoconsuntivo') {
    const activeVariant = variant || 'Total SB (hm³)'; // por defecto
    const styleFunction =
      activeVariant === 'Total SB (hm³)'
        ? styleusosSB
        : styleusosSP; // define ambos estilos arriba
    return { style: styleFunction };
  }
  if (!layerName) {
    console.warn('Layer name is undefined or null');
    return {
      style: { ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY }
    };
  }

  // Configuración base para todas las capas - SIN HOVER
  const baseOptions = {
    onEachFeature: (feature, layer) => {
    }
  };

  // Asignación de estilos específicos por capa
  switch (layerName) {
    // Contexto Geográfico y Socioeconómico
    case 'Hidalgo:00_Estado':
      return {
        ...baseOptions,
        style: {
          color: '#1b2631',
          weight: 4,
          fillColor: '#dce5ebff',
          fillOpacity: 0.25
        }
      };
    case 'Hidalgo:00_Municipios':
      return { ...baseOptions, style: styleOutlineRed };
    case 'Hidalgo:00_Localidades':
      return { ...baseOptions, pointToLayer: pointToLayerGeneric };
    case 'Hidalgo:00_Censoestado':
      return { ...baseOptions, style: { ...basePolygonStyle, fillColor: COLORS.DARKEST_ORANGE } };
    case 'Hidalgo:00_Censomunicipio':
      return { ...baseOptions, style: styleCensoMunicipio };
    case 'Hidalgo:00_Censolocalidad':
      return { ...baseOptions, pointToLayer: pointToLayerCensoLocalidad };
    case 'Hidalgo:00_macrorregiones':
      return { ...baseOptions, style: styleMacrorregiones };

    // Eje 1. Conservación hídrica
    case 'Hidalgo:01_precipitacion':
      return { ...baseOptions, style: stylePrecipitacion };
    case 'Hidalgo:01_dispcuencas':
      return { ...baseOptions, style: styleCuencasDisponibilidad };
    case 'Hidalgo:01_dispacuiferos':
      return { ...baseOptions, style: styleDisponibilidadAcuiferos };
    case 'Hidalgo:01_spsitios':
      return { ...baseOptions, pointToLayer: pointSuperficial };
    case 'Hidalgo:01_sbsitios':
      return { ...baseOptions, pointToLayer: pointSubterraneo };
    case 'Hidalgo:01_sbcalidadagua':
      return { ...baseOptions, pointToLayer: pointCalidad };
    case 'Hidalgo:01_spcalidadagua':
      return { ...baseOptions, pointToLayer: pointCalidad };
    case 'Hidalgo:01_ANP':
      return { ...baseOptions, style: styleANP };
    case 'Hidalgo:01_humedales':
      return { ...baseOptions, style: stylePolygonWetland };
    case 'Hidalgo:01_ehyca':
      return { ...baseOptions, pointToLayer: pointToLayerEmergencias };
    case 'Hidalgo:01_descargas':
      return { ...baseOptions, pointToLayer: pointToLayerDescargas };
    case 'Hidalgo:01_cuencavedas':
      return { ...baseOptions, style: styleVedaCuencas };
    case 'Hidalgo:01_cuencareservas':
      return { ...baseOptions, style: styleDisponibilidadC };
    case 'Hidalgo:01_acuiferosord':
      return { ...baseOptions, style: styleOrdenamientoAcuiferos };

    // Acceso universal y sustentable al agua y saneamiento
    case 'Hidalgo:02_potabilizadoras':
      return { ...baseOptions, pointToLayer: pointToLayerGeneric };
    case 'Hidalgo:02_abastecimiento':
      return { ...baseOptions, style: styleHidrantes };
    case 'Hidalgo:02_alcantarillado':
      return { ...baseOptions, style: styleCoberturaAlcantarillado };
    case 'Hidalgo:02_cloracionmpio':
      return { ...baseOptions, style: styleEficienciaCloracion };
    case 'Hidalgo:02_ptarmunicipales':
      return { ...baseOptions, pointToLayer: pointToLayerGeneric };
    case 'Hidalgo:02_orgoperadores':
      return { ...baseOptions, style: styleoOperadores };
    case 'Hidalgo:02_cobaguapotable':
      return { ...baseOptions, style: styleCobPotable };
    case 'Hidalgo:02_ptarnomunicipales':
      return { ...baseOptions, style: styleptarNoMunicipales };


    //Uso responsable y sostenibilida del agua
    case 'Hidalgo:03_usoconsuntivo':
      return { ...baseOptions, style: styleusosSB };
    case 'Hidalgo:03_drcultivos':
      return { ...baseOptions, style: styleCultivos };
    case 'Hidalgo:03_drvolumenes':
      return { ...baseOptions, style: styleVolumenes };
    case 'Hidalgo:03_drprodfisica':
      return { ...baseOptions, style: styleProduccion };


    //Resilencia y adaptación a fenómenos hidrometeorológicos

    case 'Hidalgo:04_climatologicas':
      return { ...baseOptions, pointToLayer: pointToLayerEClimatologicas };
    case 'Hidalgo:04_hidrometricas':
      return { ...baseOptions, pointToLayer: pointToLayerEHidrometricas };
    case 'Hidalgo:04_presas':
      return { ...baseOptions, pointToLayer: pointToLayerPresas };
    case 'Hidalgo:04_infrapresas':
      return { ...baseOptions, pointToLayer: pointToLayerIPresas };
    case 'Hidalgo:04_hidrometeorologicos':
      return { ...baseOptions, style: styleHidrometeorologicos };
    case 'Hidalgo:04_riesgosmunicipales': {
      const activeVariant = variant || 'Sequía';
      let styleFunction;

      switch (activeVariant) {
        case 'Tornado':
          styleFunction = styleTornado;
          break;

        case 'Sequía':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Sequía');
          break;
        case 'Onda de calor':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Onda de calor');
          break;
        case 'Bajas temperaturas':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Bajas temperaturas');
          break;
        case 'Tormenta eléctrica':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Tormenta eléctrica');
          break;
        case 'Ciclón tropical':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Ciclón tropical');
          break;
        case 'Nevada':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Nevada');
          break;
        case 'Granizada':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Granizada');
          break;
        case 'Inundación':
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Inundación');
          break;

        default:
          // Fallback por si acaso
          styleFunction = (feature) => styleRiesgoGenerico(feature, 'Sequía');
      }

      return { ...baseOptions, style: styleFunction };
    }

    case 'Hidalgo:04_sequias':
      return { ...baseOptions, style: styleSequias };


    // Gobernanza y gestión integrada del agua
    case 'Hidalgo:05_recextraccion':
      return { ...baseOptions, style: styleRecaudacionExtraccion };
    case 'Hidalgo:05_recobro':
      return { ...baseOptions, style: sytleRecaudacionCobro };
    case 'Hidalgo:05_consejocuenca':
      return { ...baseOptions, style: styleConsejoCuenca };
    case 'Hidalgo:05_comiscuenca':
      return { ...baseOptions, style: styleComisionesCuenca };
    case 'Hidalgo:05_comitescuenca':
      return { ...baseOptions, style: styleComitesCuenca };
    case 'Hidalgo:05_cotas':
      return { ...baseOptions, style: styleCotas };

    default:
      console.warn(`⚠️ Estilo no definido para capa: ${layerName}`);
      return {
        ...baseOptions,
        style: { ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY }
      };
  }
};

// --- DEFINICIÓN DE LA LEYENDA ---
export const legendData = {
  // Contexto Geográfico y Socioeconómico
  'Hidalgo:00_Estado': {
    title: 'Límite Estatal',
    type: 'polygon',
    items: [{ color: '#dce5ebff', borderColor: COLORS.BLACK, label: 'Límite Estatal' }]
  },
  'Hidalgo:00_Municipios': {
    title: 'Límites Municipales',
    type: 'polygon',
    items: [{ color: 'transparent', borderColor: COLORS.RED, label: 'Límite' }]
  },
  'Hidalgo:00_Localidades': {
    title: 'Localidades',
    type: 'point',
    items: [{ color: COLORS.DEFAULT, borderColor: COLORS.BLACK, label: 'Localidad' }]
  },
  'Hidalgo:00_Censoestado': {
    title: 'Censo Estatal',
    type: 'polygon',
    items: [{ color: COLORS.DARKEST_ORANGE, borderColor: COLORS.BORDER_GRAY, label: 'Estado' }]
  },
  'Hidalgo:00_Censomunicipio': {
    title: 'Población por Municipio',
    type: 'polygon',
    items: [
      { color: COLORS.LIGHT_ORANGE, borderColor: COLORS.BORDER_GRAY, label: 'Menos de 13,000' },
      { color: COLORS.MEDIUM_ORANGE, borderColor: COLORS.BORDER_GRAY, label: '13,000 - 20,000' },
      { color: COLORS.DARK_ORANGE, borderColor: COLORS.BORDER_GRAY, label: '20,000 - 38,000' },
      { color: COLORS.DARKEST_ORANGE, borderColor: COLORS.BORDER_GRAY, label: 'Más de 38,000' },
    ]
  },
  'Hidalgo:00_Censolocalidad': {
    title: 'Población por Localidad',
    type: 'point',
    items: [
      { color: COLORS.LIGHT_ORANGE, label: 'Menos de 30' },
      { color: COLORS.MEDIUM_ORANGE, label: '30 - 150' },
      { color: COLORS.DARK_ORANGE, label: '150 - 400' },
      { color: COLORS.DARKEST_ORANGE, label: 'Más de 400' },
    ]
  },
  'Hidalgo:00_macrorregiones': {
    title: 'Regiones',
    type: 'polygon',
    items: [
      { color: '#d7191c', borderColor: COLORS.BORDER_GRAY, label: 'Actopan' },
      { color: '#e44b33', borderColor: COLORS.BORDER_GRAY, label: 'Apan' },
      { color: '#f07c4a', borderColor: COLORS.BORDER_GRAY, label: 'Huejutla' },
      { color: '#fdae61', borderColor: COLORS.BORDER_GRAY, label: 'Huichapan' },
      { color: '#fec980', borderColor: COLORS.BORDER_GRAY, label: 'Ixmiquilpan' },
      { color: '#fee4a0', borderColor: COLORS.BORDER_GRAY, label: 'Jacala' },
      { color: '#ffffbf', borderColor: COLORS.BORDER_GRAY, label: 'Mineral de la Reforma' },
      { color: '#e3f4b6', borderColor: COLORS.BORDER_GRAY, label: 'Pachuca' },
      { color: '#c7e8ad', borderColor: COLORS.BORDER_GRAY, label: 'Tizayuca' },
      { color: '#abdda4', borderColor: COLORS.BORDER_GRAY, label: 'Tula' },
      { color: '#80bfab', borderColor: COLORS.BORDER_GRAY, label: 'Tulancingo' },
      { color: '#56a1b3', borderColor: COLORS.BORDER_GRAY, label: 'Zacualtipan' }
    ],
  },

  // Eje 1. Conservación hídrica
  'Hidalgo:01_precipitacion': {
    title: 'Precipitación',
    type: 'polygon',
    items: [
      { color: '#08306b', borderColor: COLORS.BORDER_GRAY, label: 'Mayor a 850 mm/año' },
      { color: '#2171b5', borderColor: COLORS.BORDER_GRAY, label: '500 - 850 mm/año' },
      { color: '#4c8eb9ff', borderColor: COLORS.BORDER_GRAY, label: '350 - 500 mm/año' },
      { color: '#a7d6f1ff', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 350 mm/año' }
    ]
  },
  'Hidalgo:01_dispcuencas': {
    title: 'Disponibilidad Cuencas',
    type: 'polygon',
    items: [
      { color: COLORS.GREEN, borderColor: COLORS.BORDER_GRAY, label: 'Con disponibilidad' },
      { color: COLORS.RED, borderColor: COLORS.BORDER_GRAY, label: 'Sin disponibilidad' }]
  },
  'Hidalgo:01_dispacuiferos': {
    title: 'Disponibilidad Acuíferos',
    type: 'polygon',
    items: [
      { color: COLORS.WATER, borderColor: COLORS.BORDER_GRAY, label: 'Con disponibilidad' },
      { color: COLORS.RED, borderColor: COLORS.BORDER_GRAY, label: 'Sin disponibilidad' }]
  },
  'Hidalgo:01_spsitios': {
    title: 'Sitios de Monitoreo',
    type: 'point',
    items: [{ color: COLORS.LIGHT_GREEN, label: 'Superficiales' },
    { color: COLORS.WATER, label: 'Subterráneos' }
    ]
  },
  'Hidalgo:01_sbsitios': {
    type: 'point',
    items: []
  },
  'Hidalgo:01_sbcalidadagua': {
    title: 'Parámetros',
    type: 'point',
    items: [
      { color: COLORS.RED, label: 'Rojo' },
      { color: COLORS.YELLOW, label: 'Amarillo' },
      { color: COLORS.LIGHT_GREEN, label: 'Verde' }
    ]
  },
  'Hidalgo:01_spcalidadagua': {
    type: 'point',
    items: []
  },
  'Hidalgo:01_ANP': {
    title: 'Áreas Naturales Protegidas',
    type: 'polygon',
    items: [{ color: COLORS.PROTECTED_AREA, borderColor: COLORS.BORDER_GRAY, label: 'ANP' }]
  },
  'Hidalgo:01_humedales': {
    title: 'Humedales',
    type: 'polygon',
    items: [{ color: COLORS.WETLAND, borderColor: COLORS.BORDER_GRAY, label: 'Humedal' }]
  },
  'Hidalgo:01_ehyca': {
    title: 'Emergencias Hidroecológicas',
    type: 'point',
    items: [{ color: COLORS.EMERGENCY, label: 'Punto de Emergencia' }]
  },
  'Hidalgo:01_descargas': {
    title: 'Descargas de Aguas Residuales',
    type: 'point',
    items: [{ color: COLORS.DISCHARGE, label: 'Punto de Descarga' }]
  },
  'Hidalgo:01_cuencavedas': {
    title: 'Vedas en Cuencas',
    type: 'polygon',
    items: [{ color: COLORS.LIGHT_GREEN, borderColor: COLORS.BORDER_GRAY, label: 'Veda' }]
  },
  'Hidalgo:01_cuencareservas': {
    title: 'Reservas en Cuencas',
    type: 'polygon',
    items: [{ color: COLORS.GREEN, borderColor: COLORS.BORDER_GRAY, label: 'Reserva' }]
  },
  'Hidalgo:01_acuiferosord': {
    title: 'Ordenamiento de Acuíferos',
    type: 'polygon',
    items: [
      { color: COLORS.LIGHT_GREEN, borderColor: COLORS.BORDER_GRAY, label: 'Veda' },
      { color: COLORS.DISCHARGE, borderColor: COLORS.BORDER_GRAY, label: 'Acuerdo General' }
    ]
  },

  // Acceso universal y sustentable al agua y saneamiento
  'Hidalgo:02_potabilizadoras': {
    title: 'Plantas Potabilizadoras',
    type: 'point',
    items: [{ color: COLORS.DEFAULT, label: 'Planta Potabilizadora' }]
  },
  'Hidalgo:02_abastecimiento': {
    title: 'Servicios de suministro de agua potable gestionados de manera segura',
    type: 'polygon',
    items: [{ color: COLORS.DISCHARGE, borderColor: COLORS.BORDER_GRAY, label: 'Servicios de suministro de agua potable' }]
  },
  'Hidalgo:02_alcantarillado': {
    title: 'Redes de Alcantarillado',
    type: 'polygon',
    items: [
      { color: '#704214', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 95%' },
      { color: '#a08162', borderColor: COLORS.BORDER_GRAY, label: '90% - 95%' },
      { color: '#cfc0b1', borderColor: COLORS.BORDER_GRAY, label: '85% - 90%' },
      { color: '#ffffff', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 85%' }
    ]
  },
  'Hidalgo:02_cloracionmpio': {
    title: 'Eficiencia de Cloración (Municipio)',
    type: 'polygon',
    items: [
      { color: '#006d2c', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 95%' },
      { color: '#2ca25f', borderColor: COLORS.BORDER_GRAY, label: '90% - 95%' },
      { color: '#66c2a4', borderColor: COLORS.BORDER_GRAY, label: '85% - 90%' },
      { color: '#b2e2e2', borderColor: COLORS.BORDER_GRAY, label: '75% - 85%' },
      { color: '#edf8fb', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 75%' }
    ]
  },
  'Hidalgo:02_ptarmunicipales': {
    title: 'Plantas de Tratamiento de Aguas Residuales Municipales',
    type: 'point',
    items: [{ color: COLORS.DEFAULT, label: 'Planta de Tratamiento' }]
  },
  'Hidalgo:02_orgoperadores': {
    title: 'Organismos Operadores',
    type: 'polygon',
    items: [
      { color: '#72d55c', borderColor: COLORS.BORDER_GRAY, label: 'Centralizado' },
      { color: '#ba49d0', borderColor: COLORS.BORDER_GRAY, label: 'OPD paraestatal' },
      { color: '#74c1e8', borderColor: COLORS.BORDER_GRAY, label: 'OPD paramunicipal' },
      { color: '#d5794e', borderColor: COLORS.BORDER_GRAY, label: 'Sin Organismo Operador' }
    ]
  },
  'Hidalgo:02_cobaguapotable': {
    title: 'Cobertura de Agua Potable',
    type: 'polygon',
    items: [
      { color: '#0073cb', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 97.5%' },
      { color: '#0bb9e2', borderColor: COLORS.BORDER_GRAY, label: '95% - 95%' },
      { color: '#16fff9', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 95%' }
    ]
  },
  'Hidalgo:02_ptarnomunicipales': {
    title: 'Plantas de Tratamiento de Aguas Residuales No Municipales',
    type: 'polygon',
    items: [
      { color: '#d7191c', borderColor: COLORS.BORDER_GRAY, label: 'Anaerobio' },
      { color: '#e44b33', borderColor: COLORS.BORDER_GRAY, label: 'Biologico' },
      { color: '#f07c4a', borderColor: COLORS.BORDER_GRAY, label: 'Dual' },
      { color: '#fdae61', borderColor: COLORS.BORDER_GRAY, label: 'Lodos activados' },
      { color: '#fec980', borderColor: COLORS.BORDER_GRAY, label: 'Otros' },
      { color: '#fee4a0', borderColor: COLORS.BORDER_GRAY, label: 'Primario' },
      { color: '#ffffbf', borderColor: COLORS.BORDER_GRAY, label: 'Reactor enzimático' },
      { color: '#e3f4b6', borderColor: COLORS.BORDER_GRAY, label: 'Tanque Imhoff' },
      { color: '#c7e8ad', borderColor: COLORS.BORDER_GRAY, label: 'Tanque séptico' },
      { color: '#abdda4', borderColor: COLORS.BORDER_GRAY, label: 'Terciario' }
    ]
  },

  //Uso responsable y sostenible del agua

  'Hidalgo:03_usoconsuntivo': {
    title: 'Usos Consuntivos ',
    type: 'polygon',
    variants: {
      'Total SB (hm³)': {
        items: [
          { color: '#457428', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 9.7 Hm³' },
          { color: '#638e2d', borderColor: COLORS.BORDER_GRAY, label: '9.7 - 2.6 Hm³' },
          { color: '#81a832', borderColor: COLORS.BORDER_GRAY, label: '2.6 - 0.5 Hm³' },
          { color: '#9ec237', borderColor: COLORS.BORDER_GRAY, label: 'Menor o igual a 0.5 Hm³' },
          { color: '#ffffff', borderColor: COLORS.BORDER_GRAY, label: 'Sin uso' }
        ],
        note: 'Volumen total superficial y subterráneo.',
      },

      'Total SP (hm³)': {
        items: [
          { color: '#457428', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 37.3 Hm³' },
          { color: '#638e2d', borderColor: COLORS.BORDER_GRAY, label: '37.3 - 6.8 Hm³' },
          { color: '#81a832', borderColor: COLORS.BORDER_GRAY, label: '6.8 - 1.5 Hm³' },
          { color: '#9ec237', borderColor: COLORS.BORDER_GRAY, label: '1.5 - 0.7 Hm³' },
          { color: '#bcdc3c', borderColor: COLORS.BORDER_GRAY, label: 'menor a 0.7 Hm³' },
          { color: '#ffffff', borderColor: COLORS.BORDER_GRAY, label: 'Sin uso' }

        ],
        note: 'Volumen total superficial.',
      },
    },
  },

  'Hidalgo:03_drcultivos': {
    title: 'Producción de Cultivos',
    type: 'polygon',
    items: [
      { color: '#00441b', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 994,722 ' },
      { color: '#7bc77c', borderColor: COLORS.BORDER_GRAY, label: '994,722 - 159,951 ' },
      { color: '#f7fcf5', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 159,951 ' }
    ]
  },
  'Hidalgo:03_drvolumenes': {
    title: 'Volumen Distribuido',
    type: 'polygon',
    items: [
      { color: '#00441b', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 346 hm³' },
      { color: '#7bc77c', borderColor: COLORS.BORDER_GRAY, label: '346 hm³ - 32 hm³' },
      { color: '#f7fcf5', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 32 hm³' }
    ]
  },

  'Hidalgo:03_drprodfisica': {
    title: 'Producción agrícola',
    type: 'polygon',
    variants: {
      'Productividad física (Kg/m³)': {
        items: [
          { color: '#00441b', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 5.86 kg/m³' },
          { color: '#2a924b', borderColor: COLORS.BORDER_GRAY, label: '5.86 - 4.3 kg/m³' },
          { color: '#7bc77c', borderColor: COLORS.BORDER_GRAY, label: '4.3 - 3.04 kg/m³' },
          { color: '#c9eac2', borderColor: COLORS.BORDER_GRAY, label: '3.04 - 2.59 kg/m³' },
          { color: '#f7fcf5', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 2.59 kg/m³' }
        ],
        note: 'Producción física (kilo por metro cúbico)',
      },
      'Productividad económica (pesos constantes de 2012/m³)': {
        items: [
          { color: '#ff0000', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 11.5 pesos/m³' },
          { color: '#ff4040', borderColor: COLORS.BORDER_GRAY, label: '11.5 - 6.5 pesos/m³' },
          { color: '#ff8080', borderColor: COLORS.BORDER_GRAY, label: '6.5 - 4.5 pesos/m³' },
          { color: '#ffbfbf', borderColor: COLORS.BORDER_GRAY, label: '4.5 - 4 pesos/m³' },
          { color: '#ffffff', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 4 pesos/m³' }
        ],
        note: 'Producción económica (valor de producción en pesos)',
      },
    },
  },

  //Resiliencia y adaptación a fenómenos hidrometeorológicos
  'Hidalgo:04_climatologicas': {
    title: 'Climatológicas',
    type: 'point',
    items: [
      { color: COLORS.WATER, borderColor: COLORS.BORDER_GRAY, label: 'Estaciones Climatológicas' }
    ]
  },
  'Hidalgo:04_hidrometricas': {
    title: 'Hidrometricas',
    type: 'point',
    items: [
      { color: COLORS.LIGHT_GREEN, borderColor: COLORS.BORDER_GRAY, label: 'Estaciones Hidrométricas' }
    ]
  },
  'Hidalgo:04_presas': {
    title: 'Presas',
    type: 'point',
    items: [
      { color: '#a7d6f1ff', borderColor: COLORS.BORDER_GRAY, label: 'Presas' }
    ]
  },
  'Hidalgo:04_infrapresas': {
    title: 'Infraestructura de Presas',
    type: 'point',
    items: [
      { color: '#08306b', borderColor: COLORS.BORDER_GRAY, label: 'Presas' }
    ]
  },
  'Hidalgo:04_riesgosmunicipales': {
    title: 'Riesgos Municipales',
    type: 'polygon',
    variants: {
      'Sequía': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Onda de calor': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Bajas temperaturas': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Tormenta eléctrica': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Ciclón tropical': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Nevada': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Granizada': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
      'Tornado': {
        items: [
          { color: '#935200', borderColor: COLORS.BORDER_GRAY, label: 'Con tornado' },
          { color: '#bababa', borderColor: COLORS.BORDER_GRAY, label: 'Sin tornado' },
        ]
      },
      'Inundación': {
        items: [
          { color: '#e41a1c', borderColor: COLORS.BORDER_GRAY, label: 'Muy Alto' },
          { color: '#ff7f00', borderColor: COLORS.BORDER_GRAY, label: 'Alto' },
          { color: '#fdff7a', borderColor: COLORS.BORDER_GRAY, label: 'Medio' },
          { color: '#4daf4a', borderColor: COLORS.BORDER_GRAY, label: 'Bajo' },
          { color: '#a6cee3', borderColor: COLORS.BORDER_GRAY, label: 'Muy Bajo' }
        ]
      },
    },
  },
  'Hidalgo:04_sequias': {
    title: 'Sequías',
    type: 'polygon',
    items: [
      { color: '#730000', borderColor: COLORS.BORDER_GRAY, label: 'Sequía Excepcional' },
      { color: 'red', borderColor: COLORS.BORDER_GRAY, label: 'Sequía Extrema' },
      { color: '#e69800', borderColor: COLORS.BORDER_GRAY, label: 'Sequía Severa' },
      { color: '#e69800', borderColor: COLORS.BORDER_GRAY, label: 'Sequía Moderada' },
      { color: 'yellow', borderColor: COLORS.BORDER_GRAY, label: 'Anormalmente Seco' },
      { color: '#dadaeb', borderColor: COLORS.BORDER_GRAY, label: 'Sin sequía' }
    ]
  },
  'Hidalgo:04_hidrometeorologicos': {
    title: 'Fenómenos hidrometeorológicos',
    type: 'polygon',
    items: [
      { color: '#bd0026', borderColor: COLORS.BORDER_GRAY, label: 'Mayor o igual a 7' },
      { color: '#f45629', borderColor: COLORS.BORDER_GRAY, label: '7 - 5' },
      { color: '#feb751', borderColor: COLORS.BORDER_GRAY, label: '5 - 2' },
      { color: '#ffffb2', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 2' }
    ]
  },

  // Gobernanza hidrica participativa y transparente
  'Hidalgo:05_recextraccion': {
    title: 'Recaudación por Extracción',
    type: 'polygon',
    items: [
      { color: '#3f007d', borderColor: COLORS.BORDER_GRAY, label: 'Mayor a 2 mdp' },
      { color: '#7c76b6', borderColor: COLORS.BORDER_GRAY, label: '0.2 - 2 mdp' },
      { color: '#c9cae3', borderColor: COLORS.BORDER_GRAY, label: '0.001 - 0.2 mdp' },
      { color: '#fcfbfd', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 0.001 mdp' }
    ]
  },

  'Hidalgo:05_recobro': {
    title: 'Recaudación por Cobro',
    type: 'polygon',
    items: [
      { color: '#ff0000', borderColor: COLORS.BORDER_GRAY, label: 'Mayor a 4 mdp' },
      { color: '#ff5555', borderColor: COLORS.BORDER_GRAY, label: '0.3 - 4 mdp' },
      { color: '#ffaaaa', borderColor: COLORS.BORDER_GRAY, label: '0.009 - 0.3 mdp' },
      { color: '#fcfbfd', borderColor: COLORS.BORDER_GRAY, label: 'Menor a 0.009 mdp' }
    ]
  },
  'Hidalgo:05_consejocuenca': {
    title: 'Consejos de Cuenca',
    type: 'polygon',
    items: [{ color: COLORS.DEFAULT, borderColor: COLORS.BORDER_GRAY, label: 'Consejo' }]
  },
  'Hidalgo:05_comiscuenca': {
    title: 'Comisiones de Cuenca',
    type: 'polygon',
    items: [{ color: COLORS.COMISIONES_CUENCA, borderColor: COLORS.BORDER_GRAY, label: 'Comisión' }]
  },
  'Hidalgo:05_comitescuenca': {
    title: 'Comités de Cuenca',
    type: 'polygon',
    items: [{ color: COLORS.COMITES_CUENCA, borderColor: COLORS.BORDER_GRAY, label: 'Comité' }]
  },
  'Hidalgo:05_cotas': {
    title: 'Comités Técnicos de Agua Subterránea',
    type: 'polygon',
    items: [{ color: COLORS.COTAS, borderColor: COLORS.BORDER_GRAY, label: 'COTAS' }]
  },
};

export { COLORS, POPULATION_RANGES, PRECIPITATION_COLORS };