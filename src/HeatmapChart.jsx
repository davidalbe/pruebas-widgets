import { ResponsiveHeatMap } from '@nivo/heatmap'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error }) {
  return <div style={{ color: 'red' }}>Error al renderizar el gráfico: {error.message}</div>
}

function HeatmapSectores() {
  const [data, setData] = useState([])
  const [error, setError] = useState("")

  const etiquetas = {
    Sentimiento_Economico: "Sentimiento Económico",
    Confianza_Inversor: "Confianza Inversor",
    Ventas_Minoristas: "Ventas Minoristas",
    Mercado_Laboral: "Mercado Laboral",
    Confianza_Consumidor: "Confianza Consumidor",
    Inflacion: "Inflación",
    Actividad_Manufacturera: "Actividad Manufacturera",
    Sector_Servicios: "Sector Servicios",
    Eurostoxx_50: "Eurostoxx 50",
    Construccion: "Construcción",
    GVC_Cycle: "Ciclo GVC"
  }

  useEffect(() => {
    fetch('https://meteoeconomics.com/dashboard/europa/calor-sectores?limit=22')
      .then((res) => res.json())
      .then((json) => {
        console.log("Respuesta cruda de la API:", json)

        if (!json.series || !Array.isArray(json.series) || json.series.length === 0) {
          console.error("La API no devolvió datos válidos")
          setError("No se encontraron datos para generar el gráfico.")
          return
        }

        const series = json.series

        const indicadores = Object.keys(etiquetas)

        const heatmapData = indicadores.map((indicador) => {
          const fila = { id: indicador, data: [] }
          series.forEach((s) => {
            const fecha = s.mmmyy
            const valorBruto = s[indicador]

            if (fecha && valorBruto !== undefined && valorBruto !== null && !isNaN(parseFloat(valorBruto))) {
              fila.data.push({
                x: fecha,
                y: parseFloat(valorBruto)
              })
            }
          })
          return fila
        })

        console.log("Datos transformados para el Heatmap:", heatmapData)
        setData(heatmapData)
      })
      .catch((err) => {
        console.error("Error en la llamada a la API:", err)
        setError("Error al cargar los datos del servidor.")
      })
  }, [])

  if (error) return <div style={{ color: "red" }}>{error}</div>
  if (data.length === 0) return <div>Cargando datos del mapa de calor...</div>

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ResponsiveHeatMap
			data={data}
			indexBy="id"
			margin={{ top: 100, right: 60, bottom: 60, left: 150 }}
			axisTop={{ orient: 'top', tickSize: 5, tickPadding: 5, tickRotation: -45 }}
			axisLeft={{
				orient: 'left',
				tickSize: 5,
				tickPadding: 5,
				format: (id) => etiquetas[id] || id
			}}
			cellOpacity={1}
			cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
			labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
			enableLabels={false}
			colors={{
				type: 'diverging',
				scheme: 'warm',
				minValue: 0,
				maxValue: 100
			}}
			animate={true}
			motionConfig="wobbly"
			
			/>

      </ErrorBoundary>
    </div>
  )
}

export default HeatmapSectores
