/**
 * @fileoverview Botón simple de descarga de Shapefile.
 * 
 * Versión simplificada del botón de descarga para una sola capa.
 * Para funcionalidad más completa, usar common/DownloadButton.
 * 
 * @module components/map/Download
 * @see module:components/common/DownloadButton
 */

import React, { useState } from 'react';
import { getShapefileDownloadUrl, downloadFile } from '../../utils/wfsService';
import { logger } from '../../config/env';

/**
 * Botón de descarga simple para una capa.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.layerName - Nombre de la capa a descargar
 * @param {string} [props.displayName] - Nombre para mostrar
 * @param {string} [props.className=''] - Clases CSS adicionales
 * @returns {JSX.Element} Botón de descarga
 */
const DownloadButton = ({ layerName, displayName, className = '' }) => {
  /** @type {[boolean, Function]} Estado de descarga en progreso */
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * Maneja la descarga del archivo Shapefile.
   * @async
   */
  const handleDownload = async () => {
    if (isDownloading || !layerName) return;

    setIsDownloading(true);
    try {
      const downloadUrl = getShapefileDownloadUrl(layerName);
      const filename = `${displayName || layerName.replace(':', '_')}.zip`;

      downloadFile(downloadUrl, filename);

    } catch (error) {
      logger.error('Error al descargar:', error);

    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading || !layerName}
      className={`download-btn ${className} ${isDownloading ? 'downloading' : ''}`}
      title={`Descargar ${displayName || layerName} como Shapefile`}
      aria-label={`Descargar capa ${displayName || layerName}`}
    >
      {isDownloading ? (
        <span className="download-spinner" aria-hidden="true">⏳</span>
      ) : (
        <span className="download-icon" aria-hidden="true">📥 SHP</span>
      )}
    </button>
  );
};

export default DownloadButton;
