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

  const stringToColor = (value) => {
    const key = value ?? '';
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 65;
    const lightness = 60;

    const h = hue;
    const s = saturation / 100;
    const l = lightness / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');

    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };

  // Cargar GeoJSON y añadir un color único por país
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
      const withColors = {
        ...geo,
        features: geo.features.map((f, index) => {
          const identifier =
            f.properties?.iso_a3 || f.properties?.iso_n3 || f.properties?.name || String(index);
          return {
            ...f,
            properties: {
              ...f.properties,
              color: stringToColor(identifier)
            }
          };
        })
      };
      setWorldData(withColors);
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
        {/* Nota */}
        <div
          style={{
            position: 'absolute', zIndex: 2, top: 12, right: 12,
            background: 'rgba(255,255,255,0.95)', border: '1px solid #e5e5e5',
            borderRadius: 10, padding: '8px 10px', fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Mapa por país</div>
          <div>Cada país se muestra con un color único.</div>
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
