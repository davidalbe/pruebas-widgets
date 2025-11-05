// src/App.jsx
import React, { useRef } from 'react';
import Map, { ScaleControl } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

const STYLE_URL = '/styles/estilo-mapa.json';
const EUROPE_CODES = [
  'ALB', 'AND', 'ARM', 'AUT', 'AZE', 'BEL', 'BGR', 'BIH', 'BLR', 'CHE', 'CYP', 'CZE', 'DEU', 'DNK',
  'ESP', 'EST', 'FIN', 'FRA', 'GBR', 'GEO', 'GRC', 'HRV', 'HUN', 'IRL', 'ISL', 'ITA', 'KOS', 'LIE',
  'LTU', 'LUX', 'LVA', 'MCO', 'MDA', 'MKD', 'MLT', 'MNE', 'NLD', 'NOR', 'POL', 'PRT', 'ROU', 'RUS',
  'SMR', 'SRB', 'SVK', 'SVN', 'SWE', 'TUR', 'UKR', 'VAT'
];

const EUROPE_FILTER = ['in', 'ADM0_A3', ...EUROPE_CODES];

function getHighlightFilter(code = '') {
  return ['all', ['in', 'ADM0_A3', ...EUROPE_CODES], ['==', 'ADM0_A3', code]];
}

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

            const highlightLayerId = 'europe-hover-highlight';
            const interactiveLayerId = 'europe-hover-target';

            if (!map.getLayer(interactiveLayerId)) {
              map.addLayer(
                {
                  id: interactiveLayerId,
                  type: 'fill',
                  source: 'maplibre',
                  'source-layer': 'countries',
                  filter: EUROPE_FILTER,
                  paint: {
                    'fill-opacity': 0
                  }
                },
                'countries-boundary'
              );
            }

            if (!map.getLayer(highlightLayerId)) {
              map.addLayer(
                {
                  id: highlightLayerId,
                  type: 'fill',
                  source: 'maplibre',
                  'source-layer': 'countries',
                  filter: getHighlightFilter(),
                  paint: {
                    'fill-color': '#2D6CDF',
                    'fill-opacity': 0.6
                  }
                },
                'countries-boundary'
              );
            }

            let hoveredCountryCode = null;

            const handleMouseMove = (event) => {
              const feature = event.features?.[0];
              const code = feature?.properties?.ADM0_A3;
              map.getCanvas().style.cursor = feature ? 'pointer' : '';
              if (!code || code === hoveredCountryCode) {
                return;
              }
              hoveredCountryCode = code;
              map.setFilter(highlightLayerId, getHighlightFilter(code));
            };

            const handleMouseLeave = () => {
              hoveredCountryCode = null;
              map.getCanvas().style.cursor = '';
              map.setFilter(highlightLayerId, getHighlightFilter());
            };

            map.on('mousemove', interactiveLayerId, handleMouseMove);
            map.on('mouseleave', interactiveLayerId, handleMouseLeave);
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
