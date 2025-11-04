// src/App.jsx
import React, { useRef } from 'react';
import Map, { ScaleControl } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

const STYLE_URL = '/styles/estilo-mapa.json';

export default function MapView() {
  const mapRef = useRef(null);

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          width: '70vw',
          height: '70vh',
          maxWidth: '900px',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          position: 'relative'
        }}
      >
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={STYLE_URL}
          initialViewState={{
            longitude: 17.65431710431244,
            latitude: 32.954120326746775,
            zoom: 0.8619833357855968
          }}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => {
            const map = mapRef.current?.getMap();
            if (!map) { return; }
            const labelLayers = ['countries-label', 'country-label', 'country-labels'];
            labelLayers.forEach((layerId) => {
              if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', 'none');
              }
            });
          }}
          dragPan={false}
          dragRotate={false}
          scrollZoom={false}
          doubleClickZoom={false}
          touchZoomRotate={false}
          keyboard={false}
          boxZoom={false}
          minZoom={0.8619833357855968}
          maxZoom={0.8619833357855968}
        >
          <ScaleControl position="bottom-left" />
        </Map>
      </div>
    </div>
  );
}
