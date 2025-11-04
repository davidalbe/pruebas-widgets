// src/MapEurope.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, Popup, ScaleControl, Source, Layer } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

// URL del estilo propio (servido desde /public/styles/estilo-mapa.json)
const STYLE_URL = '/styles/estilo-mapa.json';

// Datos GeoJSON (local -> fallback)
const LOCAL_GEOJSON = '/countries.geojson';
const FALLBACK_GEOJSON =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

export default function MapEurope() {
  const [selected, setSelected] = useState(null);
  const [worldData, setWorldData] = useState(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const mapRef = useRef(null);

  const cities = [
    { id: 1, name: 'Madrid',    lat: 40.4168, lng: -3.7038, info: 'Capital de España' },
    { id: 2, name: 'Barcelona', lat: 41.3874, lng:  2.1686, info: 'Ciudad Condal' }
  ];

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

  // Pintura para relleno por score
  const fillPaint = useMemo(() => ({
    'fill-color': [
      'interpolate', ['linear'], ['get', 'score'],
      -3, '#8b0000',
      -2, '#b22222',
      -1, '#d2691e',
       0, '#e6e6e6',
       1, '#7fbf7f',
       2, '#2e8b57',
       3, '#006400'
    ],
    'fill-opacity': 0.9,
    'fill-antialias': true
  }), []);

  // Pintura para contorno
  const outlinePaint = useMemo(() => ({
    'line-color': 'rgba(0,0,0,0.25)',
    'line-width': 0.5
  }), []);

  // Reasignar valores aleatorios (demo)
  const randomizeScores = () => {
    if (!worldData) return;
    setWorldData({
      ...worldData,
      features: worldData.features.map(f => ({
        ...f,
        properties: { ...f.properties, score: Math.floor(Math.random() * 7) - 3 }
      }))
    });
  };

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
        <button
          onClick={randomizeScores}
          style={{
            position: 'absolute', zIndex: 2, top: 12, left: 12,
            padding: '6px 10px', borderRadius: 10, border: '1px solid #ddd',
            background: '#fff', fontSize: 12, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          Reasignar valores
        </button>

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
          onLoad={() => setStyleLoaded(true)}
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

          {/* Capas temáticas dinámicas (relleno y contorno) */}
          {styleLoaded && worldData && (
            <Source id="countries-src" type="geojson" data={worldData}>
              <Layer
                id="countries-fill-dynamic"
                type="fill"
                paint={fillPaint}
                beforeId="countries-label" // ajusta si tu estilo no tiene esta capa
              />
              <Layer
                id="countries-outline-dynamic"
                type="line"
                paint={outlinePaint}
                beforeId="countries-label"
              />
            </Source>
          )}

          {cities.map((c) => (
            <Marker
              key={c.id}
              longitude={c.lng}
              latitude={c.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelected(c);
              }}
            >
              <div
                title={c.name}
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#1e90ff', border: '2px solid #fff',
                  boxShadow: '0 0 0 2px rgba(30,144,255,0.25)', cursor: 'pointer'
                }}
              />
            </Marker>
          ))}

          {selected && (
            <Popup
              longitude={selected.lng}
              latitude={selected.lat}
              anchor="top"
              onClose={() => setSelected(null)}
              closeOnClick={false}
            >
              <strong>{selected.name}</strong>
              <div style={{ fontSize: 12 }}>{selected.info}</div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
