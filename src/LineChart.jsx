import { useRef, useState, useEffect } from 'react'
import { ResponsiveLine } from '@nivo/line'

// Helpers para descomponer nombres con formato "Nombre_Apellido@Frecuencia*EtiquetaY"
const getNameParts = (str) => {
  const atIndex = str.indexOf('@')
  const starIndex = str.indexOf('*')
  let base = str
  let freq = null
  let yLabel = ''
  if (atIndex !== -1 && starIndex !== -1) {
    base = str.slice(0, atIndex)
    freq = str.slice(atIndex + 1, starIndex)
    yLabel = str.slice(starIndex + 1)
  } else if (atIndex !== -1) {
    base = str.slice(0, atIndex)
    freq = str.slice(atIndex + 1)
  } else if (starIndex !== -1) {
    base = str.slice(0, starIndex)
    yLabel = str.slice(starIndex + 1)
  }
  const arr = base.split('_')
  const apellido = arr.length > 1 ? arr[arr.length - 1] : null
  const nombre = arr.length > 1 ? arr.slice(0, -1).join('_') : base
  return { nombre, apellido, segundoApellido: freq, yLabel: yLabel || '' }
}

// Helper: convierte los ceros finales en null en los datos de la serie
function replaceTrailingZerosWithNull(arr) {
  let foundNonZero = false
  const out = [...arr]
  for (let i = out.length - 1; i >= 0; i--) {
    if (!foundNonZero && (out[i].y === 0 || out[i].y === 0.0)) {
      out[i] = { ...out[i], y: null }
    } else if (out[i].y !== 0 && out[i].y !== 0.0 && out[i].y !== null && !isNaN(out[i].y)) {
      foundNonZero = true
    }
  }
  return out
}

export default function LineChart({
  apis = ['https://meteoeconomics.com/dashboard/tablas/catalunya']
}) {
  const svgContainerRef = useRef(null)

  const [allApiData, setAllApiData] = useState([])
  const [secondSurnameKeys, setSecondSurnameKeys] = useState([])
  const [activeSecondSurname, setActiveSecondSurname] = useState('')
  const [hiddenSeries, setHiddenSeries] = useState([])

  // Colores fijos por nombre
  const customColors = [
    '#001219', '#005f73', '#0a9396', '#94d2bd',
    '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03',
    '#ae2012', '#9b2226', '#582f0e', '#606c38'
  ]
  const colorMap = {}
  const getColor = (nombre) => {
    if (!colorMap[nombre]) {
      const keys = Object.keys(colorMap)
      colorMap[nombre] = customColors[keys.length % customColors.length]
    }
    return colorMap[nombre]
  }

  // Fetch múltiple
  useEffect(() => {
    async function fetchAll() {
      const results = []

      for (const api of apis) {
        try {
          const response = await fetch(api)
          const data = await response.json()
          const series = data.series || []

          // Detecta las claves válidas de las series
          const sample = series[0] || {}
          const claves = Object.keys(sample).filter(
            (key) => !['zona', 'mmmyy', 'fecha', 'Date'].includes(key)
          )

          // Procesa cada clave como una serie
          for (const key of claves) {
            const { nombre, apellido, segundoApellido, yLabel } = getNameParts(key)
            const rawData = series.map((row) => ({
              x: row.fecha || row.Date,
              y: row[key] !== undefined ? Number(row[key]) : null,
            })).reverse();

            const cleanedData = replaceTrailingZerosWithNull(rawData);

            results.push({
              id: key,
              key,
              nombre,
              apellido: apellido || 'Todos',
              segundoApellido: segundoApellido || 'SinEtiqueta',
              prettyName: nombre,
              yLabel: yLabel || '',
              data: cleanedData,
            })
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error al cargar:', error)
        }
      }

      setAllApiData(results)

      // Descubre todas las frecuencias (@Frecuencia)
      const allSecondSurnames = [...new Set(results.map(r => r.segundoApellido))]
      setSecondSurnameKeys(allSecondSurnames)
      setActiveSecondSurname(allSecondSurnames[0] || '')
    }

    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apis])

  // Filtra series por frecuencia (@Frecuencia)
  const currentSeriesData = allApiData.filter(
    (s) => s.segundoApellido === activeSecondSurname
  )

  // Pestañas (primer apellido)
  const tabKeys = [...new Set(currentSeriesData.map(s => s.apellido))]
  const [visibleGroup, setVisibleGroup] = useState(tabKeys[0] || '')

  // Cuando cambie la frecuencia, resetea la pestaña visible
  useEffect(() => {
    setVisibleGroup(tabKeys[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSecondSurname])

  // Filtra las series activas según hiddenSeries
  const chartData = currentSeriesData
    .filter(serie => serie.apellido === visibleGroup)
    .filter(serie => !hiddenSeries.includes(serie.id))
    .map(serie => {
      const filteredData = serie.data
      const firstValidPoint = filteredData.find(d => typeof d.y === 'number' && !isNaN(d.y) && d.y !== 0)
      return {
        ...serie,
        data: filteredData,
        label: `${serie.prettyName}: ${typeof firstValidPoint?.y === 'number' ? firstValidPoint.y.toFixed(2) : '—'}`,
        color: getColor(serie.nombre),
      }
    })

  // --- NUEVO: Obtén la etiqueta Y real para el grupo seleccionado ---
  let detectedYLabel = ''
  const yLabelsInGroup = chartData.map(s => s.yLabel).filter(Boolean)
  if (yLabelsInGroup.length > 0 && new Set(yLabelsInGroup).size === 1) {
    detectedYLabel = yLabelsInGroup[0]
  }
  // ---------------------------------------------------------------

  // Cálculo de los ticks X para mostrar solo 10 etiquetas en el eje x
  let xTickValues = []
  if (chartData.length > 0 && chartData[0].data.length > 0) {
    const allX = chartData[0].data.map(d => d.x)
    const nTicks = 10
    const step = Math.floor(allX.length / (nTicks - 1))
    for (let i = 0; i < nTicks; i++) {
      xTickValues.push(allX[Math.min(i * step, allX.length - 1)])
    }
    xTickValues = [...new Set(xTickValues)]
  }

  // Leyenda personalizada (incluye todas las series, aunque estén ocultas)
  const allLegendData = currentSeriesData
    .filter(serie => serie.apellido === visibleGroup)
    .map((serie) => {
      // Busca el último valor válido que se plotea (más a la derecha en el gráfico)
      const lastValid = [...serie.data].reverse().find(
        d => typeof d.y === 'number' && !isNaN(d.y) && d.y !== 0
      );
      return {
        id: serie.id,
        label: `${serie.prettyName}: ${typeof lastValid?.y === 'number' ? lastValid.y.toFixed(2) : '—'}`,
        color: getColor(serie.nombre),
        hidden: hiddenSeries.includes(serie.id),
      }
    });

  // Estilos de botones reutilizables
  const buttonStyle = (active) => ({
    padding: '8px 16px',
    marginRight: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: active ? '#0070f3' : '#fff',
    color: active ? '#fff' : '#000',
    cursor: 'pointer',
  })

  // Handler para ocultar/mostrar series (toggle)
  const handleLegendClick = (serieId) => {
    setHiddenSeries(hidden =>
      hidden.includes(serieId)
        ? hidden.filter(id => id !== serieId)
        : [...hidden, serieId]
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '18px' }}>
      <div>
        {/* Selector de frecuencia (@Frecuencia) */}
        {secondSurnameKeys.length > 1 && (
          <div style={{ display: 'flex', gap: '0.7rem', marginBottom: 10 }}>
            {secondSurnameKeys.map(key => (
              <button
                key={key}
                onClick={() => setActiveSecondSurname(key)}
                style={buttonStyle(activeSecondSurname === key)}
              >
                {key === 'SinEtiqueta' ? 'General' : key}
              </button>
            ))}
          </div>
        )}

        {/* Pestañas de primer apellido con scroll horizontal */}
        {tabKeys.length > 1 && (
          <div
            style={{
              display: 'block',
              marginBottom: 0,
              maxWidth: 770,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              paddingBottom: 8,
              paddingTop: 2,
            }}
          >
            {tabKeys.map(key => (
              <button
                key={key}
                onClick={() => setVisibleGroup(key)}
                style={{
                  ...buttonStyle(visibleGroup === key),
                  display: 'inline-block',
                  minWidth: 80,
                  marginBottom: 3,
                  marginRight: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {key}
              </button>
            ))}
          </div>
        )}

        {/* Gráfico */}
        <div ref={svgContainerRef} style={{ height: '350px', width: '800px', marginTop: '0px' }}>
          <ResponsiveLine
            data={chartData}
            colors={serie => serie.color}
            getSerieLabel={serie => serie.label}
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: false
            }}
            enableSlices="x"
            enableGridX={false}
            enableGridY={true}
            markers={[{
              axis: 'y',
              lineStyle: { stroke: '#000000', strokeWidth: 2, type: 'DashedLine' },
              value: 0,
            }]}
            curve="monotoneX"
            margin={{ top: 30, right: 20, bottom: 50, left: 60 }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: detectedYLabel,
              legendOffset: -40,
              legendPosition: 'middle',
            }}
            axisBottom={{
              legend: 'Fecha',
              legendPosition: 'middle',
              legendOffset: 40,
              tickValues: xTickValues,
            }}
            pointSize={0}
            pointBorderWidth={0}
            useMesh={true}
            sliceTooltip={({ slice }) => (
              <div style={{
                background: 'white',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '125px',
              }}>
                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>
                  {slice.points[0].data.xFormatted}
                </div>
                {slice.points.map(point => {
                  const serie = chartData.find(s => s.id === point.seriesId)
                  return (
                    <div key={point.id} style={{ color: point.seriesColor }}>
                      <strong>{serie?.prettyName || point.seriesId}</strong>: {point.data.yFormatted}
                    </div>
                  )
                })}
              </div>
            )}
            legends={[]}
            theme={{
              axis: {
                domain: { line: { stroke: '#000', strokeWidth: 0.5 } },
              },
              legends: {
                text: { fontSize: 16, fill: '#333' },
              },
            }}
          />
        </div>
      </div>

      {/* Leyenda interactiva con scroll y toggle */}
      <div style={{
        maxHeight: '350px',
        minWidth: '210px',
        overflowY: allLegendData.length > 7 ? 'auto' : 'visible',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        background: '#fafbfc',
        padding: '10px',
        marginLeft: '8px',
        boxShadow: '0 2px 6px 0 rgba(60,60,60,0.08)',
        userSelect: 'none'
      }}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 17 }}>Leyenda</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {allLegendData.map(item => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 7,
                fontSize: 15,
                gap: 8,
                opacity: item.hidden ? 0.35 : 1,
                cursor: 'pointer',
                transition: 'opacity 0.25s'
              }}
              onClick={() => handleLegendClick(item.id)}
              title={item.hidden ? 'Mostrar línea' : 'Ocultar línea'}
            >
              <span style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: item.color,
                marginRight: 7,
                border: item.hidden ? '2px dashed #ccc' : '1px solid #ccc',
                filter: item.hidden ? 'grayscale(1) brightness(1.7)' : 'none',
                boxShadow: item.hidden ? 'none' : '0 0 2px #bbb',
                transition: 'filter 0.15s, border 0.15s'
              }} />
              <span style={{ textDecoration: item.hidden ? 'line-through' : 'none' }}>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
