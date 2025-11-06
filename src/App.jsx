// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { ScaleControl } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

const STYLE_URL = '/styles/estilo-mapa.json';

const EUROPEAN_COUNTRY_ISO_CODES = new Set([
  'ALB', 'AND', 'AUT', 'BEL', 'BGR', 'BIH', 'BLR', 'CHE', 'CYP', 'CZE', 'DEU', 'DNK',
  'ESP', 'EST', 'FIN', 'FRA', 'GBR', 'GRC', 'HRV', 'HUN', 'IRL', 'ISL', 'ITA', 'KOS',
  'LIE', 'LTU', 'LUX', 'LVA', 'MCO', 'MDA', 'MKD', 'MLT', 'MNE', 'NLD', 'NOR', 'POL',
  'PRT', 'ROU', 'RUS', 'SMR', 'SRB', 'SVK', 'SVN', 'SWE', 'TUR', 'UKR', 'VAT'
]);

export default function MapView() {
  const mapRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) { return undefined; }

    const hideLabelLayers = () => {
      const labelLayers = ['countries-label', 'country-label', 'country-labels'];
      labelLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });
    };

    const handleHoverLeave = () => {
      setHoverInfo(null);
      map.getCanvas().style.cursor = '';
    };

    const handleHoverMove = (event) => {
      const feature = event.features && event.features[0];

      if (!feature || !EUROPEAN_COUNTRY_ISO_CODES.has(feature.properties?.ADM0_A3)) {
        handleHoverLeave();
        return;
      }

      map.getCanvas().style.cursor = 'pointer';
      setHoverInfo({
        name: feature.properties?.NAME,
        x: event.point.x,
        y: event.point.y
      });
    };

    const onMapLoad = () => {
      hideLabelLayers();
      map.on('mousemove', 'countries-fill', handleHoverMove);
      map.on('mouseleave', 'countries-fill', handleHoverLeave);
    };

    if (map.isStyleLoaded()) {
      onMapLoad();
    } else {
      map.once('load', onMapLoad);
    }

    return () => {
      map.off('mousemove', 'countries-fill', handleHoverMove);
      map.off('mouseleave', 'countries-fill', handleHoverLeave);
      map.off('load', onMapLoad);
    };
  }, []);

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
        {hoverInfo && hoverInfo.name && (
          <div
            style={{
              position: 'absolute',
              left: hoverInfo.x + 12,
              top: hoverInfo.y + 12,
              backgroundColor: 'rgba(17, 24, 39, 0.85)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 6,
              pointerEvents: 'none',
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            {hoverInfo.name}
          </div>
        )}
      </div>
    </div>
  );
}
