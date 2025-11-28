import React from 'react';
import { LayersControl, TileLayer } from 'react-leaflet';

const { BaseLayer } = LayersControl;

const BaseLayerControls = () => {
  return (
    <LayersControl position="topright">
      <BaseLayer checked name="OpenStreetMap">
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
      </BaseLayer>
      <BaseLayer name="ESRI Satélite">
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      </BaseLayer>
      <BaseLayer name="ESRI Calles">
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      </BaseLayer>
      <BaseLayer name="Topográfico">
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
        />
      </BaseLayer>
    </LayersControl>
  );
};

export default BaseLayerControls;