/**
 * @fileoverview Componente principal para visualizar y manipular tablas de atributos.
 * Renderiza una tabla interactiva con datos de capas WFS, incluyendo:
 * - Paginación con scroll infinito
 * - Búsqueda en tiempo real
 * - Ordenamiento de columnas
 * - Exportación a Excel
 * - Filtrado avanzado
 * 
 * @module components/map/AttributeTableContent
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { fetchWfsLayer } from '../../utils/wfsService';
import { formatDisplayValue } from '../../utils/dataUtils';
import { saveAs } from 'file-saver';
import '../../styles/attributeTableContent.css';

/**
 * Componente para visualizar datos tabulares de capas geográficas
 * Maneja grandes volúmenes de datos con paginación optimizada
 * 
 * @component
 * @param {string} layerName - Nombre de la capa WFS a consultar
 * @param {string|null} [filter=null] - Filtro CQL para aplicar a los datos
 * @returns {JSX.Element} Tabla interactiva con controles de datos
 */
const AttributeTableContent = ({ layerName, filter = null }) => {
  // Estados para gestión de datos
  const [features, setFeatures] = useState([]); // Características geográficas
  const [headers, setHeaders] = useState([]); // Encabezados de columnas
  const [isLoading, setIsLoading] = useState(false); // Estado de carga
  const [error, setError] = useState(null); // Mensajes de error
  const [totalFeatures, setTotalFeatures] = useState(0); // Total de registros
  const [fetchedCount, setFetchedCount] = useState(0); // Registros cargados
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' }); // Configuración de ordenamiento

  // Constante para paginación: 10,000 registros por lote
  const FEATURES_PER_PAGE = 10000;

  /**
   * Obtiene datos de la capa WFS con paginación
   * @async
   * @param {boolean} [isInitialLoad=true] - Indica si es carga inicial
   * @param {string|null} [customFilter=filter] - Filtro opcional para la consulta
   * @returns {Promise<void>}
   */
  const fetchData = async (isInitialLoad = false, customFilter = filter) => {
    if (!layerName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const startIndex = isInitialLoad ? 0 : fetchedCount;
      
      // Consulta al servicio WFS con paginación
      const data = await fetchWfsLayer(layerName, customFilter, FEATURES_PER_PAGE, startIndex);

      if (data?.features) {
        if (isInitialLoad) {
          // Carga inicial: establecer datos y extraer encabezados
          setFeatures(data.features);
          if (data.features.length > 0) {
            const properties = data.features[0].properties;
            // Filtrar columnas geométricas (no relevantes para tabla)
            const validHeaders = Object.keys(properties).filter(
              key => key.toLowerCase() !== 'geom' && key.toLowerCase() !== 'geometry'
            );
            setHeaders(validHeaders);
          }
        } else {
          // Carga adicional: agregar al conjunto existente
          setFeatures(prev => [...prev, ...data.features]);
        }
        
        setTotalFeatures(data.totalFeatures || 0);
        setFetchedCount(startIndex + data.features.length);
      }
    } catch (err) {
      console.error('Error en fetchData:', err);
      setError('No se pudo cargar la información de esta capa.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Efecto para cargar datos cuando cambia la capa o el filtro
   * Reinicia todos los estados para nueva consulta
   */
  useEffect(() => {
    // Limpiar estados previos
    setFeatures([]);
    setHeaders([]);
    setFetchedCount(0);
    setTotalFeatures(0);
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'ascending' });

    // Cargar datos si hay una capa definida
    if (layerName) {
      fetchData(true, filter);
    }
  }, [layerName, filter]);

  /**
   * Carga el siguiente lote de datos (paginación)
   */
  const handleLoadMore = () => fetchData(false, filter);

  /**
   * Calcula características filtradas y ordenadas de manera eficiente
   * Utiliza useMemo para evitar recálculos innecesarios
   */
  const sortedAndFilteredFeatures = useMemo(() => {
    let filtered = features;
    
    // Aplicar filtro de búsqueda si existe
    if (searchTerm) {
      const filter = searchTerm.toLowerCase();
      filtered = features.filter(f =>
        Object.values(f.properties).some(v =>
          String(v).toLowerCase().includes(filter)
        )
      );
    }

    // Aplicar ordenamiento si está configurado
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a.properties[sortConfig.key] ?? '';
        const valB = b.properties[sortConfig.key] ?? '';

        // Detectar si los valores son numéricos para ordenamiento adecuado
        const isNumeric = !isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '';

        if (isNumeric) {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        } else {
          // Ordenamiento alfabético insensible a mayúsculas
          if (String(valA).toLowerCase() < String(valB).toLowerCase()) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (String(valA).toLowerCase() > String(valB).toLowerCase()) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, features, sortConfig]);

  /**
   * Configura el ordenamiento por columna
   * @param {string} key - Nombre de la columna a ordenar
   */
  const requestSort = (key) => {
    let direction = 'ascending';
    // Alternar dirección si es la misma columna
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Determina si hay más datos por cargar
  const hasMoreData = totalFeatures > fetchedCount;

  /**
   * Exporta los datos visibles a formato Excel
   * @async
   */
  const exportToExcel = async () => {
    if (!sortedAndFilteredFeatures.length) return;

    try {
      // Importación dinámica para reducir tamaño inicial del bundle
      const XLSX = await import('xlsx');

      // Preparar datos formateados para exportación
      const dataToExport = sortedAndFilteredFeatures.map(feature => {
        const row = {};
        headers.forEach(header => {
          row[header] = formatDisplayValue(feature.properties[header], header);
        });
        return row;
      });

      // Crear libro y hoja de Excel
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

      // Generar y descargar archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

      saveAs(data, `${layerName || 'export'}.xlsx`);

    } catch (error) {
      console.error("Error cargando el módulo de Excel:", error);
    }
  };

  // ========== ESTADOS DE INTERFAZ ==========

  // Estado: Carga inicial
  if (isLoading && features.length === 0)
    return (
      <div className="text-center my-3">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">
          Cargando datos...
          {filter && <div className="text-muted small">Aplicando filtro: {filter}</div>}
        </p>
      </div>
    );

  // Estado: Error
  if (error) return <Alert variant="danger">{error}</Alert>;

  // Estado: Sin datos
  if (features.length === 0 && !isLoading)
    return (
      <div className="text-center text-muted my-3">
        <p>No se encontraron datos para mostrar en esta capa.</p>
        {filter && (
          <div className="filter-info mt-2 p-3" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px'
          }}>
            <strong>⚠️ Con filtro aplicado:</strong>
            <code className="ms-2">{filter}</code>
            <br />
            <small>No hay datos que coincidan con este filtro.</small>
          </div>
        )}
      </div>
    );

  // ========== INTERFAZ PRINCIPAL ==========
  return (
    <div className="d-flex flex-column h-100">
      {/* Barra de herramientas: búsqueda y exportación */}
      <Form.Group controlId="tableSearch" className="mb-3 d-flex gap-2">
        <Form.Control
          type="text"
          placeholder="Buscar en la tabla..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar en la tabla de atributos"
        />
        <Button
          variant="success"
          onClick={exportToExcel}
          disabled={sortedAndFilteredFeatures.length === 0}
          aria-label="Exportar tabla a Excel"
        >
          Exportar a Excel
        </Button>
      </Form.Group>

      {/* Contenedor de tabla con scroll */}
      <div className="table-scroll-container flex-grow-1" style={{ minHeight: 0 }}>
        <Table striped bordered hover responsive size="sm">
          <thead className="sticky-header">
            <tr>
              {headers.map(header => (
                <th
                  key={header}
                  onClick={() => requestSort(header)}
                  className="sortable-header"
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && requestSort(header)}
                  aria-label={`Ordenar por ${header}`}
                >
                  {header}
                  {sortConfig.key === header && (
                    <span className={`sort-indicator ${sortConfig.direction}`}>
                      <svg
                        className="sort-arrow"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M7 14l5-5 5 5z" />
                      </svg>
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredFeatures.map((feature, index) => (
              <tr key={feature.id || index}>
                {headers.map(header => (
                  <td key={`${feature.id}-${header}`}>
                    {formatDisplayValue(feature.properties[header], header)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Mensaje de búsqueda sin resultados */}
      {sortedAndFilteredFeatures.length === 0 && searchTerm && (
        <p className="text-center text-muted">No hay resultados para su búsqueda.</p>
      )}

      {/* Pie de tabla: información y controles */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <small>
          {searchTerm
            ? `Mostrando ${sortedAndFilteredFeatures.length} resultados`
            : `Mostrando ${fetchedCount} de ${totalFeatures} elementos`}
          {filter && !searchTerm && ' (filtrados)'}
        </small>
        
        {/* Botón para cargar más datos (solo si no hay búsqueda activa) */}
        {hasMoreData && !searchTerm && (
          <Button 
            variant="primary" 
            onClick={handleLoadMore} 
            disabled={isLoading}
            aria-label="Cargar más registros"
          >
            {isLoading ? 'Cargando...' : `Cargar ${FEATURES_PER_PAGE} más`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AttributeTableContent;