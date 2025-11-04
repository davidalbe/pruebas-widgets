// src/MapEurope.jsx
import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, ScaleControl } from 'react-map-gl';
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

  // Cargar GeoJSON y añadir propiedad 'value' (0..100)
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
      const withValues = {
        ...geo,
        features: geo.features.map(f => ({
          ...f,
          properties: {
            ...f.properties,
            value: Math.floor(Math.random() * 101)
          }
        }))
      };
      setWorldData(withValues);
    };
    load();
  }, []);

  // Aplicar la rampa de color sobre el estilo base cuando el mapa y los datos estén listos
  useEffect(() => {
    if (!styleLoaded || !worldData) { return; }

    const map = mapRef.current?.getMap();
    if (!map) { return; }

    const baseSource = map.getSource('countries');
    if (baseSource && typeof baseSource.setData === 'function') {
      baseSource.setData(worldData);
    }

    if (map.getLayer('countries-fill')) {
      map.setPaintProperty('countries-fill', 'fill-color', [
        'interpolate', ['linear'], ['get', 'value'],
        0, '#8b0000',
        25, '#b22222',
        50, '#e6e6e6',
        75, '#2e8b57',
        100, '#006400'
      ]);
      map.setPaintProperty('countries-fill', 'fill-opacity', 0.9);
    }

    if (map.getLayer('countries-boundary')) {
      map.setPaintProperty('countries-boundary', 'line-color', 'rgba(0,0,0,0.25)');
      map.setPaintProperty('countries-boundary', 'line-width', 0.5);
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
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Valor país</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 6 }}>
            <div style={{ width: 16, height: 10, background: '#8b0000' }} /> <span>0</span>
            <div style={{ width: 16, height: 10, background: '#b22222' }} /> <span>25</span>
            <div style={{ width: 16, height: 10, background: '#e6e6e6' }} /> <span>50</span>
            <div style={{ width: 16, height: 10, background: '#2e8b57' }} /> <span>75</span>
            <div style={{ width: 16, height: 10, background: '#006400' }} /> <span>100</span>
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

          {/* Capas temáticas dinámicas (relleno y contorno) */}
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
