import React, { useState } from 'react';
import JSZip from 'jszip';
import { getShapefileDownloadUrl } from '../../utils/wfsService';
import { logger } from '../../config/env';

const fetchFileAsBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error al descargar ${url}`);
  return await response.blob();
};

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

const DownloadButton = ({
  layerName,
  displayName,
  className = '',
  format = 'shape-zip',
  cqlFilter = null,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading || !layerName) return;

    setIsDownloading(true);

    try {
      const layers = Array.isArray(layerName) ? layerName : [layerName];

      // Una sola capa: descarga directa
      if (layers.length === 1) {
        const url = getShapefileDownloadUrl(layers[0], format, cqlFilter);
        window.open(url, '_blank');
        return;
      }

      // Múltiples capas: crear ZIP combinado
      const zip = new JSZip();

      for (const name of layers) {
        const downloadUrl = getShapefileDownloadUrl(name, format, cqlFilter);
        const layerShortName = name.split(':')[1] || name;

        const blob = await fetchFileAsBlob(downloadUrl);
        const layerZip = await JSZip.loadAsync(blob);

        layerZip.forEach((relativePath, file) => {
          zip.file(`${layerShortName}/${relativePath}`, file.async('blob'));
        });
      }

      const finalZip = await zip.generateAsync({ type: 'blob' });
      const filename = `${displayName || 'Capas'}${cqlFilter ? '_filtrado' : ''}.zip`;
      saveZipFile(finalZip, filename);

    } catch (error) {
      logger.error('Error al crear el ZIP:', error);
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
      title={`Descargar ${displayName || 'capa'} como Shapefile${cqlFilter ? ' (con filtro)' : ''}`}
      aria-label={`Descargar ${displayName || 'capa'}`}
    >
      {isDownloading ? (
        <>
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
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
