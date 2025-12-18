/**
 * @fileoverview Diccionario de parámetros de calidad de aguas subterráneas.
 * 
 * Define las descripciones de cada campo/columna de las tablas de
 * calidad del agua para sitios de monitoreo subterráneo (pozos,
 * manantiales, norias).
 * 
 * Los parámetros incluyen:
 * - Alcalinidad y conductividad
 * - SDT (Sólidos Disueltos Totales)
 * - Fluoruros y dureza
 * - Coliformes fecales
 * - Nitrógeno de nitratos
 * - Metales pesados (As, Cd, Cr, Hg, Pb, Mn, Fe)
 * 
 * @module data/parametrosSubterraneos
 */

/**
 * Diccionario de parámetros de calidad de aguas subterráneas.
 * Cada objeto contiene pares campo:descripción para la tabla de atributos
 * y el diccionario de datos del visor.
 * 
 * @constant {Array<Object>}
 * 
 * @example
 * // Uso en DiccionarioDatosModal
 * const datos = Object.entries(parametrosSubterraneos[0])
 *   .map(([parametro, descripcion]) => ({ parametro, descripcion }));
 */
const parametrosSubterraneos = [
  {
    "id": "Id de la tabla",
    "Periodo": "Período en que se realizó el muestreo",
    "Clave del sitio": "Clave del sitio para subterráneos",
    "Sitio": "Nombre del sitio para subterráneos",
    "Grupo": "Grupo del cuerpo de agua",
    "alc (mg/L)": "Valor de Alcalinidad Total, en miligramos por litro",
    "calidad alc": "Clasificación de la calidad del agua de acuerdo con el indicador Alcalinidad Total",
    "conduct (mS/cm)": "Valor de Conductividad en microSiemens por centímetro",
    "calidad conduct": "Clasificación de la calidad del agua de acuerdo con el indicador Conductividad",
    "sdt (mg/L)": "Valor de Sólidos Disueltos Totales, en miligramos por litro",
    "calidad sdt_ra": "Clasificación de la calidad del agua de acuerdo con el indicador de los Sólidos Disueltos Totales (Riego agrícola)",
    "calidad sdt_salin": "Clasificación de la calidad del agua de acuerdo con el indicador de los Sólidos Disueltos Totales (Salinización)",
    "fluoruros (mg/L)": "Valor de Fluoruros Totales (F-), en miligramos por litro",
    "calidad fluoruros": "Clasificación de la calidad del agua de acuerdo con el indicador Fluoruros Totales",
    "dur (mg/L)": "Valor de Dureza Total, en miligramos por litro",
    "calidad dur": "Clasificación de la calidad del agua de acuerdo con el indicador Dureza Total",
    "coli_fec (NMP/100_mL)": "Valor de Coliformes Fecales, en Número Más Probable por 100 mililitros",
    "calidad coli_fec": "Clasificación de la calidad del agua de acuerdo con el indicador Coliformes Fecales",
    "n_no3 (mg/L)": "Valor de Nitrógeno de Nitratos, en miligramos por litro",
    "calidad n_no3": "Clasificación de la calidad del agua de acuerdo con el indicador Nitrógeno de Nitratos",
    "as_tot (mg/L)": "Valor de Arsénico Total, en miligramos por litro",
    "calidad as": "Clasificación de la calidad del agua de acuerdo con el indicador Arsénico Total",
    "cd_tot (mg/L)": "Valor de Cadmio Total, en miligramos por litro",
    "calidad cd": "Clasificación de la calidad del agua de acuerdo con el indicador Cadmio Total",
    "cr_tot (mg/L)": "Valor de Cromo Total, en miligramos por litro",
    "calidad cr": "Clasificación de la calidad del agua de acuerdo con el indicador Cromo Total",
    "hg_tot (mg/L)": "Valor de Mercurio Total, en miligramos por litro",
    "calidad hg": "Clasificación de la calidad del agua de acuerdo con el indicador Mercurio Total",
    "pb_tot (mg/L)": "Valor de Plomo Total, en miligramos por litro",
    "calidad pb": "Clasificación de la calidad del agua de acuerdo con el indicador Plomo Total",
    "mn_tot (mg/L)": "Valor de Manganeso Total, en miligramos por litro",
    "calidad mn": "Clasificación de la calidad del agua de acuerdo con el indicador Manganeso Total",
    "fe_tot (mg/L)": "Valor de Hierro Total, en miligramos por litro",
    "calidad fe": "Clasificación de la calidad del agua de acuerdo con el indicador Hierro Total",
    "Semaforo": "Color de semáforo",
    "Contaminantes": "Contaminantes presentes en incumplimiento (Contaminados)",
    "cumple_alc": "Indica si cumple con la calidad de Baja, Media, o Alta para el Indicador Alcalinidad Total",
    "cumple_conduct": "Indica si cumple con la calidad de Excelente para riego, Buena para riego, o Permisible para riego, para el Indicador Conductividad",
    "cumple_sdt_ra": "Indica si cumple con la calidad de Excelente para riego, Cultivos sensibles o Cultivos con manejo especial, para el Indicador SDT (Riego agrícola)",
    "cumple_sdt_salin": "Indica si cumple con la calidad de Potable - Dulce o Ligeramente salobres, para el Indicador Sólidos Disueltos Totales (Salinización)",
    "cumple_fluoruros": "Indica si cumple con la calidad de Baja, Media, o Potable - Óptima, para el Indicador Fluoruros Totales",
    "cumple_dur": "Indica si cumple con la calidad de Potable - Suave, Potable - Moderadamente suave, o Potable - Dura, para el Indicador Dureza Total",
    "cumple_coli_fec": "Indica si cumple con la calidad de Potable - Excelente, o Buena calidad, Aceptable, para el Indicador Coliformes Fecales",
    "cumple_n_no3": "Indica si cumple con la calidad de Potable - Excelente o Potable - Buena calidad, para el Indicador Nitrógeno de Nitratos",
    "cumple_as": "Indica si cumple con la calidad de Potable - Excelente o Apta como FAAP, para el Indicador Arsénico Total",
    "cumple_cd": "Indica si cumple con la calidad de Potable - Excelente, para el Indicador Cadmio Total",
    "cumple_cr": "Indica si cumple con la calidad de Potable - Excelente, para el Indicador Cromo Total",
    "cumple_hg": "Indica si cumple con la calidad de Potable - Excelente, para el Indicador Mercurio Total",
    "cumple_pb": "Indica si cumple con la calidad de Potable - Excelente, para el Indicador Plomo Total",
    "cumple_mn": "Indica si cumple con la calidad de Potable - Excelente, para el Indicador Manganeso Total",
    "cumple_fe": "Indica si cumple con la calidad de Potable - Excelente, para el Indicador Hierro Total"
  }
];

export default parametrosSubterraneos;