// src/LineChart copy.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ResponsiveLine } from '@nivo/line';

const COLOR_MAP = { red: 'rgba(209, 32, 32, 0.6)', orange: 'rgba(229, 146, 27, 0.6)', yellow: 'rgba(168, 198, 27, 0.6)', green: 'rgba(75, 190, 23, 0.6)' };
const STAGE_BY_QUADRANT = { I: 'Expansión', II: 'Recesión', III: 'Depresión', IV: 'Recuperación' };

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const SimpleLineChart = ({ data, seriesLabel, yLabel, color, height = 400, width }) => {
    const chartData = useMemo(() => [{ id: seriesLabel, data }], [data, seriesLabel]);
    const tickValues = useMemo(() => { if (!data.length) return undefined; const maxTicks = Math.min(10, data.length); if (maxTicks <= 1) return data.map(point => point.x); const step = Math.max(1, Math.floor(data.length / (maxTicks - 1))); const values = []; for (let i = 0; i < data.length; i += step) { values.push(data[i].x); } const last = data[data.length - 1].x; if (!values.includes(last)) values.push(last); return Array.from(new Set(values)); }, [data]);
    const resolvedColor = color || '#0B6CFC';
    const lineTheme = useMemo(() => ({ background: 'transparent', textColor: '#374151', axis: { domain: { line: { stroke: '#d1d5db', strokeWidth: 1 } }, ticks: { line: { stroke: '#d1d5db', strokeWidth: 1 }, text: { fill: '#374151', fontSize: 11 } }, legend: { text: { fill: '#374151', fontSize: 12, fontWeight: 600 } } }, grid: { line: { stroke: '#e5e7eb', strokeDasharray: '4 4' } }, crosshair: { line: { stroke: resolvedColor, strokeWidth: 1, strokeOpacity: 0.6 } }, tooltip: { container: { background: '#ffffff', color: '#374151', fontSize: 12, borderRadius: 6, boxShadow: '0 6px 16px rgba(0,0,0,0.2)', border: '1px solid #e5e7eb' } } }), [resolvedColor]);
    
    return (
        <div style={{ width: width ? `${width}px` : '100%', height }}>
            <ResponsiveLine 
                data={chartData} 
                margin={{ top: 20, right: 24, bottom: 60, left: 60 }} 
                xScale={{ type: 'point' }} 
                yScale={{ type: 'linear', min: 'auto', max: 'auto' }} 
                axisLeft={{ tickSize: 4, tickPadding: 8, legend: yLabel || seriesLabel, legendOffset: -50, legendPosition: 'middle' }} 
                axisBottom={{ tickRotation: -35, tickPadding: 12, legend: '', legendOffset: 46, tickValues }} 
                colors={[resolvedColor]} 
                lineWidth={2} 
                pointSize={6} 
                pointBorderWidth={2} 
                enableSlices="x" 
                useMesh 
                theme={lineTheme} 
                markers={[{ axis: 'y', value: 0, lineStyle: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '6 6' } }]}
                tooltip={({ point }) => (
                    <div style={{ padding: '4px 8px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{point.data.xFormatted}</div>
                        <div style={{ color: '#555' }}>Fecha: {point.data.fullDate}</div>
                        <div>{seriesLabel}: <strong>{point.data.yFormatted}</strong></div>
                    </div>
                )}
            />
        </div>
    );
};

function useParentSize() { const ref = useRef(null); const [size, setSize] = useState({ width: 0, height: 0 }); useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(entries => { for (const entry of entries) { setSize({ width: Math.max(0, Math.floor(entry.contentRect?.width ?? el.clientWidth ?? 0)), height: Math.max(0, Math.floor(entry.contentRect?.height ?? el.clientHeight ?? 0)) }); } }); ro.observe(el); const rect = el.getBoundingClientRect(); setSize({ width: Math.max(0, Math.floor(rect.width)), height: Math.max(0, Math.floor(rect.height)) }); return () => ro.disconnect(); }, []); return [ref, size.width, size.height]; }

const defaultHeight = 400; 
const TAB_STRIP_CLASSNAME = 'line-bars-chart__tab-strip';

const LineBarsChart = ({ url, height }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wrapRef, wrapWidth] = useParentSize();
  const [activeTab, setActiveTab] = useState('Indicador');
  const tabListRef = useRef(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [showSlider, setShowSlider] = useState(false);
  const [tabConfig, setTabConfig] = useState([]);

  useEffect(() => {
    if (!url) { setLoading(false); setError("No se ha proporcionado una URL."); return; }
    
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const apiData = await response.json();
        const series = Array.isArray(apiData?.series) ? apiData.series : [];
        if (series.length === 0) throw new Error("No se encontraron series en los datos.");

        const parsed = series.map(r => ({ mes: r.mmmyy, Indicador: Number(r.Indicador), color: r.color, cuadrante: r.cuadrante, raw: r }));
        setData(parsed);

        const firstDataPoint = series[0];
        const excludeKeys = new Set(['mmmyy', 'mes', 'zona', 'x', 'y', 'color', 'cuadrante', 'Indicador']);
        
        const dynamicTabs = Object.keys(firstDataPoint)
          .filter(key => !excludeKeys.has(key) && typeof firstDataPoint[key] === 'number')
          .map(key => ({ key: key, label: key.replace(/_/g, ' '), type: 'line', yLabel: key.replace(/_/g, ' ') }));
        
        const newTabConfig = [ { key: 'Indicador', label: 'GVCi Cycle', type: 'mixed', yLabel: 'GVCi Cycle' }, ...dynamicTabs ];
        setTabConfig(newTabConfig);

      } catch (e) { setError(e.message); setData([]); setTabConfig([]); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [url]);

  useEffect(() => { const el = tabListRef.current; if (!el) return; const updateSliderState = () => { const maxScroll = el.scrollWidth - el.clientWidth; const hasOverflow = maxScroll > 4; setShowSlider(hasOverflow); if (!hasOverflow) { setSliderValue(0); return; } const value = maxScroll > 0 ? Math.min(100, Math.max(0, (el.scrollLeft / maxScroll) * 100)) : 0; setSliderValue(value); }; updateSliderState(); el.addEventListener('scroll', updateSliderState, { passive: true }); window.addEventListener('resize', updateSliderState); const resizeObserver = new ResizeObserver(updateSliderState); resizeObserver.observe(el); return () => { el.removeEventListener('scroll', updateSliderState); window.removeEventListener('resize', updateSliderState); resizeObserver.disconnect(); }; }, [data, tabConfig]);
  
  const handleSliderChange = (event) => { const el = tabListRef.current; if (!el) return; const value = Number(event.target.value); const maxScroll = el.scrollWidth - el.clientWidth; el.scrollLeft = (value / 100) * Math.max(0, maxScroll); setSliderValue(value); };
  const availableTabs = tabConfig;
  const categories = useMemo(() => data.map(r => r.mes), [data]);
  const columnData = useMemo(() => data.map(r => ({ x: r.mes, y: 1, fillColor: COLOR_MAP[r.color?.toLowerCase() || ''] || '#9ca3af' })), [data]);
  const lineData = useMemo(() => data.map(r => ({ x: r.mes, y: r.Indicador })), [data]);
  
  const lineSeriesByTab = useMemo(() => { 
    const result = {}; 
    for (const tab of tabConfig) { 
      if (tab.type !== 'line') continue; 
      result[tab.key] = data.map(row => ({ 
        x: row.mes, 
        y: toNumberOrNull(row.raw?.[tab.key]),
        fullDate: row.raw.mes 
      })); 
    } 
    return result; 
  }, [data, tabConfig]);

  const series = useMemo(() => [ { name: 'Etapa', type: 'column', data: columnData }, { name: 'GVCi Cycle', type: 'line', data: lineData }, ], [columnData, lineData]);
  
  const options = useMemo(() => ({ 
    chart: { type: 'line', animations: { enabled: false }, toolbar: { show: false } }, 
    xaxis: { type: 'category', categories, labels: { rotate: -30, style: { colors: '#333' } } }, 
    yaxis: [ { show: false }, { title: { text: 'GVCi Cycle', style: { color: '#333' } }, opposite: false, labels: { formatter: (val) => (Number.isFinite(val) ? val : 0).toFixed(2), style: { colors: '#333' } } }, ], 
    stroke: { width: [0, 3], curve: ['straight', 'smooth'] }, 
    markers: { size: [0, 2], strokeWidth: 1 }, 
    plotOptions: { bar: { columnWidth: '100%', borderRadius: 0 } }, 
    colors: [undefined, '#000000'], 
    tooltip: { 
      shared: true, 
      intersect: false, 
      theme: 'light', 
      custom: ({ dataPointIndex }) => { 
        const dp = data[dataPointIndex]; 
        const etapa = STAGE_BY_QUADRANT[dp.cuadrante] || 'N/D'; 
        return `
          <div style="padding:10px 12px; min-width:180px; background-color:#ffffff; color:#111827; border: 1px solid #e0e0e0; border-radius: 6px;">
            <div style="font-weight:600; margin-bottom:4px;">${dp.mes}</div>
            <div style="font-size:11px; color:#555; margin-bottom:6px;">Fecha: ${dp.raw.mes}</div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
              <span style="display:inline-block; width:10px; height:10px; background:${COLOR_MAP[dp.color.toLowerCase()]}; border-radius:2px;"></span>
              <span style="font-size:12px;">Etapa: <strong>${etapa}</strong></span>
            </div>
            <div style="font-size:12px;">GVCi Cycle: <strong>${dp.Indicador.toFixed(2)}</strong></div>
          </div>`; 
      } 
    }, 
    fill: { type: ['solid', 'solid'] }, 
    legend: { show: false }, 
    grid: { borderColor: '#e0e0e0' } 
  }), [categories, data]);

  const chartAreaHeight = Math.max(160, (height ?? defaultHeight) - 80);
  const activeTabConfig = availableTabs.find(tab => tab.key === activeTab) ?? availableTabs[0];
  const isLineTab = activeTabConfig?.type === 'line';
  const activeLineData = isLineTab ? lineSeriesByTab[activeTabConfig.key] ?? [] : [];
  const hasLineValues = activeLineData.some(point => typeof point.y === 'number' && point.y !== null);
  const getTabButtonStyle = (key) => { const isActive = activeTab === key; return { padding: '6px 12px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${isActive ? '#2563eb' : '#d1d5db'}`, backgroundColor: isActive ? '#2563eb' : 'transparent', color: isActive ? '#ffffff' : '#374151', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }; };

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;
  if (error) return <div style={{ color: 'crimson', padding: 12 }}>Error: {error}</div>;
  if (!data.length) return <div style={{ padding: 12 }}>Sin datos disponibles.</div>;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={tabListRef} className={TAB_STRIP_CLASSNAME} style={{ display: 'flex', gap: 8, marginBottom: showSlider ? 8 : 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.${TAB_STRIP_CLASSNAME}::-webkit-scrollbar { display: none; }`}</style>
        {availableTabs.map(tab => (<button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={getTabButtonStyle(tab.key)}>{tab.label}</button>))}
      </div>
      {showSlider && (<div style={{ marginBottom: 16 }}><input type="range" min={0} max={100} value={sliderValue} onChange={handleSliderChange} style={{ width: '100%', margin: 0 }} aria-label="Desplazar pestañas"/></div>)}
      <div ref={wrapRef} style={{ width: '100%', flex: 1, minHeight: 0 }}>
        {!activeTabConfig ? null : activeTabConfig.type === 'mixed' ? (
          <ReactApexChart options={options} series={series} type="line" height={chartAreaHeight} width="100%" />
        ) : hasLineValues ? (
          <SimpleLineChart data={activeLineData} seriesLabel={activeTabConfig.label} yLabel={activeTabConfig.yLabel} color={activeTabConfig.color} height={chartAreaHeight} width={wrapWidth > 0 ? wrapWidth : undefined}/>
        ) : (
          <div style={{ padding: 12 }}>Sin datos para {activeTabConfig.label}.</div>
        )}
      </div>
    </div>
  );
};

export default LineBarsChart;