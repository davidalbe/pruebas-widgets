import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

// Mapa de colores: del JSON ('red', 'yellow', etc.) al código hexadecimal
const COLOR_MAP = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
};

function useParentWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect?.width ?? el.clientWidth ?? 0;
        setWidth(Math.max(0, Math.floor(w)));
      }
    });
    ro.observe(el);
    setWidth(Math.max(0, Math.floor(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

const ApexCycleMixed = ({ height = 550 }) => {
  const [data, setData] = useState([]);
  const [wrapRef, wrapWidth] = useParentWidth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://meteoeconomics.com/dashboard/europa/cycle');
        const json = await res.json();
        if (json && json.series) {
          setData(json.series);
        }
      } catch (err) {
        console.error('Error cargando los datos:', err);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => data.map(r => r.mes), [data]);

  const columnData = useMemo(() => data.map(r => ({
    x: r.mes,
    y: 1,
    fillColor: COLOR_MAP[r.color] || '#9ca3af'  // Gris por defecto si color no está en el mapa
  })), [data]);

  const lineData = useMemo(() => data.map(r => ({
    x: r.mes,
    y: r.Indicador,
    fillColor: 'black'
  })), [data]);

  const series = useMemo(() => [
    {
      name: 'Columna X',
      type: 'column',
      data: columnData
    },
    {
      name: 'Indicador',
      type: 'line',
      data: lineData
    }
  ], [columnData, lineData]);

  const options = useMemo(() => ({
    chart: {
      type: 'line',
      height,
      animations: { enabled: false },
      redrawOnWindowResize: true,
      redrawOnParentResize: true,
      toolbar: {
        show: true,
        tools: { download: true, zoom: true, pan: true, reset: true }
      }
    },
    xaxis: {
      type: 'category',
      categories,
      labels: { rotate: -30 }
    },
    yaxis: [
      {
        show: false
      },
      {
        title: { text: 'Indicador' },
        opposite: false
      }
    ],
    stroke: { width: [0, 3] },
    plotOptions: {
      bar: {
        columnWidth: '100%',
        borderRadius: 0,
        distributed: false,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: [undefined, '#000000'],
    tooltip: {
      shared: true,
      intersect: false
    },
    markers: { size: 4 },
    fill: {
      type: ['solid', 'solid']
    },
    legend: { show: false }
  }), [categories, height]);

  const computedWidth = wrapWidth > 0 ? wrapWidth : undefined;

  return (
    <div
      ref={wrapRef}
      style={{ width: '100%', display: 'block' }}
    >
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={height}
        width={computedWidth}
      />
    </div>
  );
};

export default ApexCycleMixed;
