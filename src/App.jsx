// src/App.jsx
import React, { useRef, useState } from 'react';
import Map, { Popup, ScaleControl } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

const STYLE_URL = '/styles/estilo-mapa.json';

export default function MapView() {
  const mapRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const handleMouseMove = (event) => {
    const hoveredFeature = event.features?.[0];

    if (!hoveredFeature) {
      setHoverInfo((current) => (current ? null : current));
      return;
    }

    const properties = hoveredFeature.properties || {};
    const countryName =
      properties.NAME ||
      properties.ADMIN ||
      properties.ABBREV ||
      properties.name ||
      properties.Name;

    if (!countryName) {
      setHoverInfo((current) => (current ? null : current));
      return;
    }

    setHoverInfo((current) => {
      const nextValue = {
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        name: countryName
      };

      if (
        current &&
        current.name === nextValue.name &&
        current.longitude === nextValue.longitude &&
        current.latitude === nextValue.latitude
      ) {
        return current;
      }

      return nextValue;
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

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
          interactiveLayerIds={['countries-fill']}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          cursor={hoverInfo ? 'pointer' : 'default'}
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
          {hoverInfo && (
            <Popup
              longitude={hoverInfo.longitude}
              latitude={hoverInfo.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              maxWidth="180px"
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  padding: '0.25rem 0.5rem'
                }}
              >
                {hoverInfo.name}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
