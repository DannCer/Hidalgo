import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { fetchWfsLayer } from '../../utils/wfsService';
import { saveAs } from 'file-saver';
import '../styles/attributeTableContent.css'

const AttributeTableContent = ({ layerName, filter = null }) => { // ✅ Agregar filter como prop
  const [features, setFeatures] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalFeatures, setTotalFeatures] = useState(0);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const FEATURES_PER_PAGE = 10000;

  // ✅ MODIFICADO: Aceptar filtro como parámetro
  const fetchData = async (isInitialLoad = false, customFilter = filter) => {
    if (!layerName) return;
    setIsLoading(true);
    setError(null);
    try {
      const startIndex = isInitialLoad ? 0 : fetchedCount;

      // ✅ USAR EL FILTRO: pasar el filtro a fetchWfsLayer
      const data = await fetchWfsLayer(layerName, customFilter, FEATURES_PER_PAGE, startIndex);

      if (data?.features) {
        if (isInitialLoad) {
          setFeatures(data.features);
          if (data.features.length > 0) {
            const properties = data.features[0].properties;
            const validHeaders = Object.keys(properties).filter(
              key => key.toLowerCase() !== 'geom' && key.toLowerCase() !== 'geometry'
            );
            setHeaders(validHeaders);
          }
        } else {
          setFeatures(prev => [...prev, ...data.features]);
        }
        setTotalFeatures(data.totalFeatures || 0);
        setFetchedCount(startIndex + data.features.length);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información de esta capa.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ MODIFICADO: Recargar datos cuando cambia el filtro
  useEffect(() => {
    setFeatures([]);
    setHeaders([]);
    setFetchedCount(0);
    setTotalFeatures(0);
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'ascending' });

    if (layerName) {
      fetchData(true, filter);
    }
  }, [layerName, filter]); // ✅ Agregar filter como dependencia

  const handleLoadMore = () => fetchData(false, filter);

  // MODIFICADO: Combinamos el filtrado y el ordenamiento en un solo useMemo
  const sortedAndFilteredFeatures = useMemo(() => {
    // 1. Filtrar primero
    let filtered = features;
    if (searchTerm) {
      const filter = searchTerm.toLowerCase();
      filtered = features.filter(f =>
        Object.values(f.properties).some(v =>
          String(v).toLowerCase().includes(filter)
        )
      );
    }

    // 2. Luego ordenar los resultados filtrados
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a.properties[sortConfig.key] ?? '';
        const valB = b.properties[sortConfig.key] ?? '';

        // Comprobación para ordenar numéricamente si es posible
        const isNumeric = !isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '';

        if (isNumeric) {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        } else {
          // Ordenamiento de texto
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

  // NUEVO: Función para manejar el clic en el encabezado
  const requestSort = (key) => {
    let direction = 'ascending';
    // Si se hace clic en la misma columna, se invierte la dirección
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const hasMoreData = totalFeatures > fetchedCount;

  // ... (la función exportToExcel se mantiene igual, pero ahora usará los datos ordenados)
  const exportToExcel = async () => { // 1. Agregamos 'async'
    if (!sortedAndFilteredFeatures.length) return;

    try {
      // 2. Importación dinámica: Vite dividirá esto en un archivo separado
      const XLSX = await import('xlsx');

      const dataToExport = sortedAndFilteredFeatures.map(feature => {
        const row = {};
        headers.forEach(header => {
          row[header] = feature.properties[header];
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

      // Usamos layerName para el nombre del archivo
      saveAs(data, `${layerName || 'export'}.xlsx`);

    } catch (error) {
      console.error("Error cargando el módulo de Excel:", error);
    }
  };

  //  Componente para mostrar información del filtro
  const FilterInfo = () => {
    if (!filter) return null;

    return (
      <div className="filter-info mb-3" style={{
        padding: '10px',
        backgroundColor: '#e8f5e8',
        border: '1px solid #4caf50',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>🎯 Filtro aplicado:</strong>
        <code className="ms-2" style={{ backgroundColor: '#f1f8e9', padding: '2px 6px', borderRadius: '3px' }}>
          {filter}
        </code>
        <span className="ms-2 text-muted">
          • Mostrando datos filtrados por quincena
        </span>
      </div>
    );
  };

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

  if (error) return <Alert variant="danger">{error}</Alert>;

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

  return (
    <>
      <div className="d-flex flex-column h-100">
        {/* ✅ MOSTRAR INFORMACIÓN DEL FILTRO */}
        <FilterInfo />

        <Form.Group controlId="tableSearch" className="mb-3 d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Buscar en la tabla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="success"
            onClick={exportToExcel}
            disabled={sortedAndFilteredFeatures.length === 0}
          >
            Exportar a Excel
          </Button>
        </Form.Group>

        <div className="table-scroll-container flex-grow-1" style={{ minHeight: 0 }}>
          <Table striped bordered hover responsive size="sm">
            <thead className="sticky-header">
              <tr>
                {headers.map(header => (
                  <th
                    key={header}
                    onClick={() => requestSort(header)}
                    className="sortable-header"
                  >
                    {header}
                    {/* NUEVO: Indicador SVG minimalista */}
                    {sortConfig.key === header && (
                      <span className={`sort-indicator ${sortConfig.direction}`}>
                        <svg
                          className="sort-arrow"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
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
                      {String(feature.properties[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {sortedAndFilteredFeatures.length === 0 && searchTerm && (
          <p className="text-center text-muted">No hay resultados para su búsqueda.</p>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small>
            {searchTerm
              ? `Mostrando ${sortedAndFilteredFeatures.length} resultados`
              : `Mostrando ${fetchedCount} de ${totalFeatures} elementos`}
            {filter && !searchTerm && ' (filtrados)'}
          </small>
          {hasMoreData && !searchTerm && (
            <Button variant="primary" onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? 'Cargando...' : `Cargar ${FEATURES_PER_PAGE} más`}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default AttributeTableContent;