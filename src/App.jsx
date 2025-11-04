// src/MapEurope.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { ScaleControl } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

// URL del estilo propio (servido desde /public/styles/estilo-mapa.json)
const STYLE_URL = '/styles/estilo-mapa.json';

// Datos GeoJSON (local -> fallback)
const LOCAL_GEOJSON = '/countries.geojson';
const FALLBACK_GEOJSON =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

export default function MapEurope() {
  const [worldData, setWorldData] = useState(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const mapRef = useRef(null);

  // Cargar GeoJSON y añadir propiedad 'score' (-3..+3)
  useEffect(() => {
    const load = async () => {
      let geo = null;
      for (const url of [LOCAL_GEOJSON, FALLBACK_GEOJSON]) {
        try {
          const r = await fetch(url, { cache: 'no-store' });
          if (r.ok) { geo = await r.json(); break; }
        } catch (_) {}
      }
      if (!geo) {
        console.error('No se pudo cargar countries.geojson');
        return;
      }
      const withScores = {
        ...geo,
        features: geo.features.map(f => ({
          ...f,
          properties: {
            ...f.properties,
            score: Math.floor(Math.random() * 7) - 3
          }
        }))
      };
      setWorldData(withScores);
    };
    load();
  }, []);

  // Inyectar los datos en la fuente del estilo base cuando el mapa y los datos estén listos
  useEffect(() => {
    if (!styleLoaded || !worldData) { return; }

    const map = mapRef.current?.getMap();
    if (!map) { return; }

    const baseSource = map.getSource('countries');
    if (baseSource && typeof baseSource.setData === 'function') {
      baseSource.setData(worldData);
    }
  }, [styleLoaded, worldData]);

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
        {/* Leyenda */}
        <div
          style={{
            position: 'absolute', zIndex: 2, top: 12, right: 12,
            background: 'rgba(255,255,255,0.95)', border: '1px solid #e5e5e5',
            borderRadius: 10, padding: '8px 10px', fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Score país</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 6 }}>
            <div style={{ width: 16, height: 10, background: '#8b0000' }} /> <span>−3</span>
            <div style={{ width: 16, height: 10, background: '#b22222' }} /> <span>−2</span>
            <div style={{ width: 16, height: 10, background: '#d2691e' }} /> <span>−1</span>
            <div style={{ width: 16, height: 10, background: '#e6e6e6' }} /> <span>0</span>
            <div style={{ width: 16, height: 10, background: '#7fbf7f' }} /> <span>+1</span>
            <div style={{ width: 16, height: 10, background: '#2e8b57' }} /> <span>+2</span>
            <div style={{ width: 16, height: 10, background: '#006400' }} /> <span>+3</span>
          </div>
        </div>

        {/* Carga del estilo propio */}
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={STYLE_URL}
          initialViewState={{ longitude: 12.78728, latitude: 49.342414, zoom: 3.5 }}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => {
            setStyleLoaded(true);
            const map = mapRef.current?.getMap();
            if (map) {
              const labelLayers = ['countries-label', 'country-label', 'country-labels'];
              labelLayers.forEach((layerId) => {
                if (map.getLayer(layerId)) {
                  map.setLayoutProperty(layerId, 'visibility', 'none');
                }
              });
            }
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
