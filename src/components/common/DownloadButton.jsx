import React, { useState } from 'react';
import JSZip from 'jszip';
import { getShapefileDownloadUrl } from '../../utils/wfsService';
import { logger } from '../../config/env';

/**
 * Descarga un archivo desde una URL y lo convierte en Blob
 * @param {string} url - URL del archivo a descargar
 * @returns {Promise<Blob>} Blob del archivo descargado
 * @throws {Error} Si la descarga falla
 */
const fetchFileAsBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error al descargar ${url}`);
  return await response.blob();
};

/**
 * Crea y dispara la descarga de un archivo ZIP desde un Blob
 * @param {Blob} blob - Contenido del archivo ZIP
 * @param {string} filename - Nombre del archivo a descargar
 */
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

/**
 * Componente para descargar capas geográficas en formato Shapefile
 * Maneja descarga individual o múltiple con empaquetado en ZIP
 * 
 * @component
 * @param {string|string[]} layerName - Nombre(s) de la(s) capa(s) WFS
 * @param {string} [displayName] - Nombre amigable para mostrar
 * @param {string} [className=''] - Clases CSS adicionales
 * @param {string} [format='shape-zip'] - Formato de descarga
 * @param {string|null} [cqlFilter=null] - Filtro CQL para la descarga
 */
const DownloadButton = ({
  layerName,
  displayName,
  className = '',
  format = 'shape-zip',
  cqlFilter = null,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Maneja el proceso de descarga:
   * - Para una sola capa: abre en nueva pestaña
   * - Para múltiples capas: empaqueta en ZIP con estructura de carpetas
   */
  const handleDownload = async () => {
    // Evitar múltiples descargas simultáneas o sin capa definida
    if (isDownloading || !layerName) return;

    setIsDownloading(true);

    try {
      const layers = Array.isArray(layerName) ? layerName : [layerName];

      // CASO 1: Una sola capa - descarga directa
      if (layers.length === 1) {
        const url = getShapefileDownloadUrl(layers[0], format, cqlFilter);
        window.open(url, '_blank');
        return;
      }

      // CASO 2: Múltiples capas - crear ZIP estructurado
      const zip = new JSZip();

      // Descargar cada capa y agregarla al ZIP
      for (const name of layers) {
        const downloadUrl = getShapefileDownloadUrl(name, format, cqlFilter);
        // Extraer nombre corto de la capa (remover prefijo namespace)
        const layerShortName = name.split(':')[1] || name;

        const blob = await fetchFileAsBlob(downloadUrl);
        const layerZip = await JSZip.loadAsync(blob);

        // Copiar todos los archivos de cada capa a su propia carpeta
        layerZip.forEach((relativePath, file) => {
          zip.file(`${layerShortName}/${relativePath}`, file.async('blob'));
        });
      }

      // Generar y descargar el ZIP final
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
        // Estado: empaquetando
        <>
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          <span className="ms-1">Empaquetando...</span>
        </>
      ) : (
        // Estado: listo para descargar
        <>
          <span role="img" aria-label="descargar">📦</span>
          <span className="ms-1">SHP</span>
        </>
      )}
    </button>
  );
};

export default DownloadButton;