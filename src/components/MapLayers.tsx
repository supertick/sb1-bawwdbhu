import React from 'react';
import { LayersControl, TileLayer, WMSTileLayer } from 'react-leaflet';
import { useMapStore } from '../store/mapStore';

const MapLayers: React.FC = () => {
  const { selectedBaseLayer, enabledOverlays } = useMapStore();

  return (
    <LayersControl position="topright">
      {/* Base Layers */}
      <LayersControl.BaseLayer 
        checked={selectedBaseLayer === 'streets'} 
        name="Streets"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer 
        checked={selectedBaseLayer === 'satellite'} 
        name="Satellite"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com">Esri</a>'
        />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer 
        checked={selectedBaseLayer === 'terrain'} 
        name="Terrain"
      >
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
        />
      </LayersControl.BaseLayer>

      {/* Overlay Layers */}
      <LayersControl.Overlay 
        checked={enabledOverlays.includes('parcels')} 
        name="Parcel Boundaries"
      >
        <WMSTileLayer
          url="https://gis.vigo.in.gov/gis/rest/services/Parcel/MapServer/WMSServer"
          layers="0"
          format="image/png"
          transparent={true}
          opacity={0.7}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay 
        checked={enabledOverlays.includes('zoning')} 
        name="Zoning"
      >
        <WMSTileLayer
          url="https://gis.vigo.in.gov/gis/rest/services/Zoning/MapServer/WMSServer"
          layers="0"
          format="image/png"
          transparent={true}
          opacity={0.6}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay 
        checked={enabledOverlays.includes('flood')} 
        name="Flood Zones"
      >
        <WMSTileLayer
          url="https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/WMSServer"
          layers="0"
          format="image/png"
          transparent={true}
          opacity={0.5}
        />
      </LayersControl.Overlay>
    </LayersControl>
  );
};

export default MapLayers;