// src/utils/dataUtils.js

/**
 * Normaliza una quincena eliminando zonas horarias y timestamps
 * @param {string|Date} quincena - Quincena a normalizar
 * @returns {string|null} - Quincena normalizada o null si es inválida
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
 * Crea un filtro CQL para WFS basado en una quincena
 * ✅ CORREGIDO: Usa campo "Quincena" (con mayúscula)
 * @param {string} quincena - Quincena normalizada
 * @param {string} fieldName - Nombre del campo (por defecto 'Quincena')
 * @returns {string|null} - Filtro CQL o null si falla
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

  // ✅ Formato correcto: Quincena='2024-01-15'
  return `${fieldName}='${normalized}'`;
};

/**
 * Función debounce genérica con cancelación
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función debounced con método cancel
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
  
  debounced.cancel = function() {
    clearTimeout(timeout);
  };
  
  return debounced;
};

/**
 * Compara dos quincenas normalizadas
 * @param {string} q1 - Primera quincena
 * @param {string} q2 - Segunda quincena
 * @returns {boolean} - true si son iguales
 */
export const areQuincenasEqual = (q1, q2) => {
  const n1 = normalizeQuincena(q1);
  const n2 = normalizeQuincena(q2);
  return n1 === n2;
};

/**
 * Valida si una quincena está en la lista de quincenas disponibles
 * @param {string} quincena - Quincena a validar
 * @param {Array<string>} quincenaList - Lista de quincenas disponibles
 * @returns {boolean} - true si es válida
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
 * Obtiene el índice de una quincena en la lista
 * @param {string} quincena - Quincena a buscar
 * @param {Array<string>} quincenaList - Lista de quincenas
 * @returns {number} - Índice o -1 si no se encuentra
 */
export const getQuincenaIndex = (quincena, quincenaList) => {
  if (!quincena || !Array.isArray(quincenaList)) return -1;
  
  const normalized = normalizeQuincena(quincena);
  const normalizedList = quincenaList.map(normalizeQuincena);
  
  return normalizedList.indexOf(normalized);
};

/**
 * Formatea una quincena para display
 * @param {string} quincena - Quincena a formatear
 * @param {string} format - Formato deseado ('short', 'long', 'iso')
 * @returns {string} - Quincena formateada
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
 * Ordena un array de quincenas cronológicamente
 * @param {Array<string>} quincenas - Array de quincenas
 * @param {boolean} ascending - true para ascendente, false para descendente
 * @returns {Array<string>} - Array ordenado
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