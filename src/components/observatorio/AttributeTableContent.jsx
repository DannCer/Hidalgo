import React, { useState, useEffect, useMemo } from 'react';
import { Table, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { fetchWfsLayer } from '../../utils/wfsService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../styles/attributeTableContent.css'

const AttributeTableContent = ({ layerName }) => {
  const [features, setFeatures] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalFeatures, setTotalFeatures] = useState(0);
  const [fetchedCount, setFetchedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const FEATURES_PER_PAGE = 10000;

  // ... (la función fetchData se mantiene igual)
  const fetchData = async (isInitialLoad = false) => {
    if (!layerName) return;
    setIsLoading(true);
    setError(null);
    try {
      const startIndex = isInitialLoad ? 0 : fetchedCount;
      const data = await fetchWfsLayer(layerName, null, FEATURES_PER_PAGE, startIndex);
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

  useEffect(() => {
    fetchData(true);
    // NUEVO: Reiniciar el ordenamiento cuando cambia la capa
    setSortConfig({ key: null, direction: 'ascending' });
  }, [layerName]);

  const handleLoadMore = () => fetchData(false);

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
  const exportToExcel = () => {
    if (!sortedAndFilteredFeatures.length) return;
    const dataToExport = sortedAndFilteredFeatures.map(f => {
      const row = {};
      headers.forEach(h => (row[h] = f.properties[h]));
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `${layerName.replace(':', '_')}_atributos.xlsx`);
  };

  if (isLoading && features.length === 0)
    return (
      <div className="text-center my-3"><Spinner animation="border" variant="primary" /><p className="mt-2">Cargando datos...</p></div>
    );

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (features.length === 0 && !isLoading)
    return <p className="text-center text-muted my-3">No se encontraron datos para mostrar en esta capa.</p>;

  return (
    <>
      <div className="d-flex flex-column h-100">
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