// src/MapEurope.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Map, { Marker, Popup, ScaleControl, Source, Layer } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

import { mapConfig } from './config/mapConfig';

export default function MapEurope() {
  const [selected, setSelected] = useState(null);
  const [worldData, setWorldData] = useState(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const mapRef = useRef(null);

  const { cities = [] } = mapConfig;

  const legendTitle = mapConfig.legend?.title ?? 'Leyenda';
  const legendItems = Array.isArray(mapConfig.legend?.items) ? mapConfig.legend.items : [];

  const defaultRange = { min: -3, max: 3 };
  const configRange = mapConfig.randomScoreRange || defaultRange;
  const rangeMin = Number.isFinite(configRange.min) ? configRange.min : defaultRange.min;
  const maxCandidate = Number.isFinite(configRange.max) ? configRange.max : defaultRange.max;
  const rangeMax = maxCandidate < rangeMin ? rangeMin : maxCandidate;
  const scoreRange = { min: rangeMin, max: rangeMax };
  const geoJsonSources = Array.isArray(mapConfig.geoJsonSources)
    ? mapConfig.geoJsonSources
    : mapConfig.geoJsonSources
    ? [mapConfig.geoJsonSources]
    : [];
  const geoJsonKey = geoJsonSources.join('|');

  // Cargar GeoJSON y añadir propiedad 'score' (-3..+3)
  useEffect(() => {
    const load = async () => {
      let geo = null;
      for (const url of geoJsonSources) {
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
            score: Math.floor(
              Math.random() * (scoreRange.max - scoreRange.min + 1)
            ) + scoreRange.min
          }
        }))
      };
      setWorldData(withScores);
    };
    load();
  }, [geoJsonKey, scoreRange.max, scoreRange.min]);

  // Pintura para relleno por score
  const fillPaint = useMemo(() => {
    const stops = mapConfig.fillLayer?.colorStops || [];
    const baseExpression = ['interpolate', ['linear'], ['get', 'score']];
    const colorExpression = stops.length
      ? stops.reduce((expr, stop) => expr.concat([stop.score, stop.color]), baseExpression)
      : mapConfig.fillLayer?.defaultColor ?? '#cccccc';

    return {
      'fill-color': colorExpression,
      'fill-opacity': mapConfig.fillLayer?.opacity ?? 0.9,
      'fill-antialias': mapConfig.fillLayer?.antialias ?? true
    };
  }, []);

  // Pintura para contorno
  const outlinePaint = useMemo(() => ({
    'line-color': mapConfig.outlineLayer?.color ?? 'rgba(0,0,0,0.25)',
    'line-width': mapConfig.outlineLayer?.width ?? 0.5
  }), []);

  const layerBeforeIdFill = mapConfig.fillLayer?.beforeLayerId || undefined;
  const layerBeforeIdOutline = mapConfig.outlineLayer?.beforeLayerId || undefined;

  const interactionProps = mapConfig.interactionOptions || {};

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
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{legendTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 6 }}>
            {legendItems.map((item, index) => (
              <React.Fragment key={item?.score ?? index}>
                <div style={{ width: 16, height: 10, background: item?.color ?? '#000' }} />
                <span>{item?.label ?? item?.score ?? ''}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Carga del estilo propio */}
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={mapConfig.mapStyle}
          initialViewState={mapConfig.initialViewState}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => setStyleLoaded(true)}
          {...interactionProps}
        >
          <ScaleControl position="bottom-left" />

          {/* Capas temáticas dinámicas (relleno y contorno) */}
          {styleLoaded && worldData && (
            <Source id="countries-src" type="geojson" data={worldData}>
              <Layer
                id="countries-fill-dynamic"
                type="fill"
                paint={fillPaint}
                beforeId={layerBeforeIdFill}
              />
              <Layer
                id="countries-outline-dynamic"
                type="line"
                paint={outlinePaint}
                beforeId={layerBeforeIdOutline}
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
