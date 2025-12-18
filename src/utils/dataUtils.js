/**
 * @fileoverview Utilidades para procesamiento y formateo de datos.
 * 
 * Este módulo contiene funciones helper para:
 * - Formateo de valores para visualización
 * - Normalización y validación de quincenas (fechas)
 * - Creación de filtros CQL
 * - Funciones de debounce
 * 
 * @module utils/dataUtils
 */

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Expresión regular para detectar fechas ISO 8601.
 * Soporta formatos: YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS, con o sin 'Z'
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?)?Z?$/;

// ============================================================================
// FORMATEO DE VALORES
// ============================================================================

/**
 * Formatea un valor para mostrar en la UI.
 * 
 * Convierte fechas ISO a formato legible (dd/mm/yyyy) y
 * maneja valores nulos/vacíos.
 * 
 * @param {*} value - Valor a formatear
 * @param {string} [propertyName=''] - Nombre del campo (para lógica específica)
 * @returns {string} Valor formateado
 * 
 * @example
 * formatDisplayValue('2024-01-15T00:00:00.000Z')
 * // '15/01/2024'
 * 
 * formatDisplayValue(null)
 * // ''
 */
export const formatDisplayValue = (value, propertyName = '') => {
  // Manejar valores nulos o vacíos
  if (value == null || value === '') return '';

  const stringValue = String(value).trim();

  // Detectar y formatear fechas ISO
  if (ISO_DATE_REGEX.test(stringValue)) {
    try {
      // Limpiar sufijos de hora y zona horaria
      const cleanDate = stringValue
        .replace('Z', '')
        .replace('T00:00:00.000', '')
        .replace('T00:00:00', '');
      
      // Si es fecha simple (YYYY-MM-DD), convertir a dd/mm/yyyy
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        const [year, month, day] = cleanDate.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Para fechas con hora, usar toLocaleDateString
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
    } catch (e) {
      // Si falla el parsing, devolver limpio sin Z
      return stringValue.replace('Z', '').replace('T00:00:00.000', '');
    }
  }

  return stringValue;
};

// ============================================================================
// FUNCIONES DE QUINCENA (TIMELINE DE SEQUÍAS)
// ============================================================================

/**
 * Normaliza el formato de una quincena.
 * 
 * Las quincenas pueden venir en diferentes formatos desde GeoServer
 * (con Z, con timestamp, etc.). Esta función las normaliza a formato
 * limpio YYYY-MM-DD.
 * 
 * @param {string|null} quincena - Quincena a normalizar
 * @returns {string|null} Quincena normalizada o null si es inválida
 * 
 * @example
 * normalizeQuincena('2024-01-15T00:00:00.000Z')
 * // '2024-01-15'
 */
export const normalizeQuincena = (quincena) => {
  if (!quincena) return null;

  try {
    const normalized = quincena.toString()
      .replace('Z', '')
      .replace('T00:00:00.000', '')
      .trim();

    return normalized || null;
  } catch (error) {
    console.error('❌ Error normalizando quincena:', error);
    return null;
  }
};

/**
 * Crea un filtro CQL para consultar sequías por quincena.
 * 
 * @param {string} quincena - Quincena a filtrar
 * @param {string} [fieldName='Quincena'] - Nombre del campo en GeoServer
 * @returns {string|null} Filtro CQL o null si hay error
 * 
 * @example
 * createSequiaFilter('2024-01-15')
 * // "Quincena='2024-01-15'"
 */
export const createSequiaFilter = (quincena, fieldName = 'Quincena') => {
  if (!quincena) {
    console.warn('⚠️ createSequiaFilter: quincena no proporcionada');
    return null;
  }

  const normalized = normalizeQuincena(quincena);
  if (!normalized) {
    console.warn('⚠️ createSequiaFilter: quincena inválida después de normalizar');
    return null;
  }

  // Formato de filtro CQL estándar
  return `${fieldName}='${normalized}'`;
};

/**
 * Compara si dos quincenas son iguales (después de normalizar).
 * 
 * @param {string} q1 - Primera quincena
 * @param {string} q2 - Segunda quincena
 * @returns {boolean} true si son iguales
 */
export const areQuincenasEqual = (q1, q2) => {
  const n1 = normalizeQuincena(q1);
  const n2 = normalizeQuincena(q2);
  return n1 === n2;
};

/**
 * Valida si una quincena existe en la lista de quincenas disponibles.
 * 
 * @param {string} quincena - Quincena a validar
 * @param {string[]} quincenaList - Lista de quincenas válidas
 * @returns {boolean} true si es válida
 */
export const isValidQuincena = (quincena, quincenaList) => {
  if (!quincena || !Array.isArray(quincenaList) || quincenaList.length === 0) {
    return false;
  }

  const normalized = normalizeQuincena(quincena);
  const normalizedList = quincenaList.map(normalizeQuincena);

  return normalizedList.includes(normalized);
};

/**
 * Obtiene el índice de una quincena en la lista.
 * 
 * @param {string} quincena - Quincena a buscar
 * @param {string[]} quincenaList - Lista de quincenas
 * @returns {number} Índice (0-based) o -1 si no se encuentra
 */
export const getQuincenaIndex = (quincena, quincenaList) => {
  if (!quincena || !Array.isArray(quincenaList)) return -1;

  const normalized = normalizeQuincena(quincena);
  const normalizedList = quincenaList.map(normalizeQuincena);

  return normalizedList.indexOf(normalized);
};

/**
 * Formatea una quincena para mostrar en la UI.
 * 
 * @param {string} quincena - Quincena a formatear
 * @param {string} [format='short'] - Formato: 'short', 'long', 'iso'
 * @returns {string} Quincena formateada
 * 
 * @example
 * formatQuincena('2024-01-15', 'long')
 * // '15 de enero de 2024'
 */
export const formatQuincena = (quincena, format = 'short') => {
  const normalized = normalizeQuincena(quincena);
  if (!normalized) return 'N/A';

  try {
    const date = new Date(normalized);

    switch (format) {
      case 'long':
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case 'short':
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

      case 'iso':
      default:
        return normalized;
    }
  } catch (error) {
    console.error('❌ Error formateando quincena:', error);
    return normalized;
  }
};

/**
 * Ordena un array de quincenas cronológicamente.
 * 
 * @param {string[]} quincenas - Array de quincenas
 * @param {boolean} [ascending=true] - Orden ascendente
 * @returns {string[]} Array ordenado
 */
export const sortQuincenas = (quincenas, ascending = true) => {
  if (!Array.isArray(quincenas)) return [];

  const sorted = [...quincenas].sort((a, b) => {
    const dateA = new Date(normalizeQuincena(a));
    const dateB = new Date(normalizeQuincena(b));
    return ascending ? dateA - dateB : dateB - dateA;
  });

  return sorted;
};

// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

/**
 * Crea una función debounced.
 * 
 * La función debounced solo se ejecuta después de que haya pasado
 * el tiempo especificado sin nuevas llamadas.
 * 
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced con método cancel()
 * 
 * @example
 * const debouncedSearch = debounce(search, 300);
 * debouncedSearch('query'); // Se ejecutará después de 300ms sin llamadas
 * debouncedSearch.cancel(); // Cancela la ejecución pendiente
 */
export const debounce = (func, wait) => {
  let timeout;

  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  // Método para cancelar ejecución pendiente
  debounced.cancel = function() {
    clearTimeout(timeout);
  };

  return debounced;
};