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
          width: '75vw',
          height: '75vh',
          maxWidth: '800px',
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
            longitude: 14,
            latitude: 50,
            zoom: 3.5
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
          minZoom={3.5}
          maxZoom={3.5}
        >
          <ScaleControl position="bottom-left" />
        </Map>
      </div>
    </div>
  );
}
