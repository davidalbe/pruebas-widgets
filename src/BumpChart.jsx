// src/CicloLineChart.jsx

import React, { useState, useEffect } from 'react'
import { ResponsiveLine } from '@nivo/line'

const rankMap = {
  Auge:       4,
  Recesión:   2,
  Expansión:  3,
  Depresión:  1,
}
const phaseColors = {
  Auge:       '#19BC19',
  Recesión:   '#F9A61A',
  Expansión:  '#7DC41D',
  Depresión:  '#D12020',
}

function classify(x, y) {
  if (x > 0 && y > 0) return 'Auge'
  if (x < 0 && y > 0) return 'Recesión'
  if (x < 0 && y < 0) return 'Depresión'
  if (x > 0 && y < 0) return 'Expansión'
  return 'Depresión'
}

// Capa custom para el gradiente
const GradientBackground = ({ innerWidth, innerHeight }) => (
  <>
    <defs>
      <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="rgb(25,188,25,0.3)" />
        <stop offset="100%" stopColor="rgb(209,32,32,0.3)" />
      </linearGradient>
    </defs>
    <rect
      x={0}
      y={0}
      width={innerWidth}
      height={innerHeight}
      fill="url(#bgGradient)"
    />
  </>
)

export default function CicloLineChart() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('https://meteoeconomics.com/dashboard/catalunya/gvc-cycle')
      .then(res => res.json())
      .then(raw => {
        const sorted = raw.series
          .slice()
          .sort((a, b) => new Date(a.mes) - new Date(b.mes))

        const series = [
          {
            id: 'Ciclo GVC',
            data: sorted.map(d => {
              const date = new Date(d.mes)
              const phase = classify(d.x, d.y)
              return {
                x: date,
                y: rankMap[phase],
                phase,
                rawX: d.x,
                rawY: d.y,
                label: d.mmmyy,
              }
            }),
          },
        ]

        setData(series)
      })
      .catch(err => {
        console.error(err)
        setData([])
      })
  }, [])

  if (!data) {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Cargando gráfico…
      </div>
    )
  }

  const yLabels = {
    1: 'Depresión',
    2: 'Recesión',
    3: 'Expansión',
    4: 'Auge',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '600px',
      height: '300px',
    }}>
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
        xScale={{
          type: 'time',
          format: 'native',
          precision: 'month',
        }}
        xFormat="time:%b %y"
        yScale={{ type: 'linear', min: 0.75, max: 4.5 }}
        curve="monotoneX"
        axisBottom={{
          tickRotation: -45,
          tickSize: 5,
          tickPadding: 5,
          legend: 'Mes',
          legendPosition: 'middle',
          legendOffset: 50,
          tickValues: 'every 3 months',
          format: '%b %y',
        }}
        axisLeft={{
          tickValues: [1, 2, 3, 4],
          tickSize: 5,
          tickPadding: 5,
          legendOffset: -50,
          format: v => yLabels[v],
        }}
        enableGridX={false}
        enableGridY={true}
        gridYValues={[1, 2, 3, 4]}
        theme={{
           grid: {
             line: {
               stroke: '#888888',        // color de la línea
               strokeWidth: 1,           // grosor (opcional)
               strokeDasharray: '8 8',   // 4px dibujados, 4px de espacio
             }
           }
         }}
        colors={['#168aad']}
        lineWidth={2}
        enablePoints
        pointSize={12}
        pointColor={({ point }) =>
          phaseColors[point.data.phase] || '#999'
        }
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serie.color' }}
        useMesh
        tooltip={({ point }) => (
          <div style={{
            background: '#fff',
            padding: '8px 12px',
            border: `1px solid ${phaseColors[point.data.phase] || '#999'}`,
            borderRadius: '4px',
          }}>
            <strong>{point.data.label}</strong><br/>
            <em>Fase: {point.data.phase}</em>
          </div>
        )}
        // Inserta nuestra capa justo antes de dibujar las líneas
        layers={[
          GradientBackground,
          'grid',
          'lines',
          'points',
          'axes',
          'mesh',
        ]}
      />
    </div>
  )
}
