const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?)?Z?$/;

export const formatDisplayValue = (value, propertyName = '') => {
  if (value == null || value === '') return '';

  const stringValue = String(value).trim();

  if (ISO_DATE_REGEX.test(stringValue)) {
    try {
      const cleanDate = stringValue.replace('Z', '').replace('T00:00:00.000', '').replace('T00:00:00', '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        const [year, month, day] = cleanDate.split('-');
        return `${day}/${month}/${year}`;
      }
      const date = new Date(stringValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
    } catch (e) {
      return stringValue.replace('Z', '').replace('T00:00:00.000', '');
    }
  }

  return stringValue;
};

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


  return `${fieldName}='${normalized}'`;
};

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

export const areQuincenasEqual = (q1, q2) => {
  const n1 = normalizeQuincena(q1);
  const n2 = normalizeQuincena(q2);
  return n1 === n2;
};

export const isValidQuincena = (quincena, quincenaList) => {
  if (!quincena || !Array.isArray(quincenaList) || quincenaList.length === 0) {
    return false;
  }

  const normalized = normalizeQuincena(quincena);
  const normalizedList = quincenaList.map(normalizeQuincena);

  return normalizedList.includes(normalized);
};

export const getQuincenaIndex = (quincena, quincenaList) => {
  if (!quincena || !Array.isArray(quincenaList)) return -1;

  const normalized = normalizeQuincena(quincena);
  const normalizedList = quincenaList.map(normalizeQuincena);

  return normalizedList.indexOf(normalized);
};

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

export const sortQuincenas = (quincenas, ascending = true) => {
  if (!Array.isArray(quincenas)) return [];

  const sorted = [...quincenas].sort((a, b) => {
    const dateA = new Date(normalizeQuincena(a));
    const dateB = new Date(normalizeQuincena(b));
    return ascending ? dateA - dateB : dateB - dateA;
  });

  return sorted;
};