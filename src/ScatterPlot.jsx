import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';

// Constantes de configuración
const MIN_SPACING = 5;
const MAX_POINT_SIZE = 16;
const MIN_POINT_SIZE = 6;
const MIN_OPACITY = 0.3;
const HORIZONTAL_GRID_COLOR = 'black';
const HORIZONTAL_GRID_DASH = '5,6';

// Genera puntos con tamaño y opacidad interpolados
const computeSeriesPoints = (start, end, y) => {
  const dist = Math.abs(end - start);
  const segments = Math.floor(dist / MIN_SPACING);
  const count = Math.max(segments + 1, 2);
  const dx = (end - start) / (count - 1);

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return {
      x: start + dx * i,
      y,
      size: MAX_POINT_SIZE - t * (MAX_POINT_SIZE - MIN_POINT_SIZE),
      opacity: 1 - t * (1 - MIN_OPACITY),
    };
  });
};

// Componentes de grid y borde memoizados
const HorizontalDashedGrid = React.memo(({ innerWidth, yScale, gridYValues }) => (
  <g>
    {gridYValues.map((y, i) => (
      <line
        key={i}
        x1={0}
        x2={innerWidth}
        y1={yScale(y)}
        y2={yScale(y)}
        stroke={HORIZONTAL_GRID_COLOR}
        strokeWidth={1}
        strokeDasharray={HORIZONTAL_GRID_DASH}
      />
    ))}
  </g>
));

const PlotAreaBorders = React.memo(({ innerWidth, innerHeight }) => (
  <g>
    <line x1={0} y1={0} x2={innerWidth} y2={0} stroke="black" strokeWidth={0.75} />
    <line x1={innerWidth} y1={0} x2={innerWidth} y2={innerHeight} stroke="black" strokeWidth={0.75} />
  </g>
));

const ScatterPlot = () => {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://meteoeconomics.com/dashboard/europa/momentum-mercado');
        const json = await res.json();
        setSeries(json.series);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    })();
  }, []);

  // Etiquetas e yTicks derivadas
  const labels = useMemo(() => series.map(item => item.indicador), [series]);
  const yTicks = useMemo(() => labels.map((_, idx) => idx + 1), [labels]);
  const gridYValues = useMemo(() => yTicks.map(v => v + 0.5), [yTicks]);

  // Datos transformados con memoización
  const data = useMemo(
    () => series.map((item, idx) => ({
      id: item.indicador,
      data: computeSeriesPoints(item.inicio, item.fin, idx + 1),
    })),
    [series]
  );

  // Capas del gráfico definidas fuera del JSX para evitar recreación
  const customLayers = useMemo(
    () => [
      ({ innerWidth, innerHeight }) => (
        <g key="gradient-bg">
          <defs>
            <linearGradient id="scatter-gradient-bg" x1="0" y1="0" x2={innerWidth} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#B2357B" />
              <stop offset="100%" stopColor="#FDE7A9" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={innerWidth} height={innerHeight} fill="url(#scatter-gradient-bg)" />
        </g>
      ),
      props => <PlotAreaBorders {...props} key="borders" />,
      props => <HorizontalDashedGrid {...props} key="grid" gridYValues={gridYValues} />,
      'axes',
      'nodes',
      'legends',
    ],
    [gridYValues]
  );

  return (
    <div style={{ height: 500 }}>
      <ResponsiveScatterPlot
        data={data}
        margin={{ top: 60, right: 140, bottom: 70, left: 180 }}
        xScale={{ type: 'linear', min: 0, max: 100 }}
        yScale={{ type: 'linear', min: 0.5, max: labels.length + 0.5 }}
        nodeSize={d => d.data.size}
        nodeOpacity={d => d.data.opacity}
        enableGridX={false}
        enableGridY={false}
        axisBottom={{ orient: 'bottom' }}
        axisLeft={{
          orient: 'left',
          tickValues: yTicks,
          format: i => labels[i - 1] || '',
          tickSize: 5,
          tickPadding: 10,
        }}
        colors="black"
        layers={customLayers}
        useMesh={false}
      />
    </div>
  );
};

export default ScatterPlot;
