import React, { useState } from 'react';
import JSZip from 'jszip';
import { getShapefileDownloadUrl } from '../../utils/wfsService';

// Configuración del GeoServer
const GEO_SERVER_CONFIG = {
  WFS_BASE_URL: 'http://187.237.240.169/geoserver/Hidalgo/wfs',
  DEFAULT_FORMAT: 'shape-zip',
  DEFAULT_SRS: 'EPSG:4326',
};

// 📥 Función auxiliar para descargar un archivo
const fetchFileAsBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error al descargar ${url}`);
  return await response.blob();
};

// 💾 Descargar el ZIP combinado
const saveZipFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 🎯 Componente principal
const DownloadButton = ({
  layerName,
  displayName,
  className = '',
  format = 'shape-zip',
  cqlFilter = null, // ✅ Nueva prop para filtros
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading || !layerName) return;
    setIsDownloading(true);

    try {
      const layers = Array.isArray(layerName) ? layerName : [layerName];

      // Si solo hay una capa, descarga directamente
      if (layers.length === 1) {
        const url = getShapefileDownloadUrl(layers[0], format, cqlFilter); // ✅ Pasar cqlFilter
        window.open(url, '_blank');
        setIsDownloading(false);
        return;
      }

      // Si hay varias capas → crear ZIP combinado
      const zip = new JSZip();

      for (const name of layers) {
        const downloadUrl = getShapefileDownloadUrl(name, format, cqlFilter); // ✅ Pasar cqlFilter
        const layerShortName = name.split(':')[1] || name;        

        const blob = await fetchFileAsBlob(downloadUrl);

        // Extraemos el contenido del ZIP individual y lo metemos en el ZIP principal
        const layerZip = await JSZip.loadAsync(blob);
        layerZip.forEach((relativePath, file) => {
          zip.file(`${layerShortName}/${relativePath}`, file.async('blob'));
        });
      }

      const finalZip = await zip.generateAsync({ type: 'blob' });
      const filename = `${displayName || 'Capas'}.zip`;

      saveZipFile(finalZip, filename);
    } catch (error) {
      console.error('❌ Error al crear el ZIP combinado:', error);
      alert('Error al crear el archivo ZIP combinado.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || !layerName}
      className={`download-btn ${className} ${isDownloading ? 'downloading' : ''}`}
      title={`Descargar ${displayName || 'capa'} como Shapefile${cqlFilter ? ' (con filtro aplicado)' : ''}`}
    >
      {isDownloading ? (
        <>
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          <span className="ms-1">Empaquetando...</span>
        </>
      ) : (
        <>
          <span role="img" aria-label="descargar">📦</span>
          <span className="ms-1">SHP</span>
        </>
      )}
    </button>
  );
};

export default DownloadButton;
