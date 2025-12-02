import React, { useState } from 'react';
import { getShapefileDownloadUrl, downloadFile } from '../../utils/wfsService';
import { logger } from '../../config/env';

const DownloadButton = ({ layerName, displayName, className = '' }) => {
  const [isDownloading, setIsDownloading] = useState(false);

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
