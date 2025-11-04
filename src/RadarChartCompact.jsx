import React from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";

const data = [
  {
    id: "Brent",
    data: [
      { x: "Invisible", y: 56 },
      { x: "Antiguo", y: 203 }
    ]
  },
  {
    id: "Spread",
    data: [
      { x: "Invisible", y: 150 },
      { x: "Antiguo", y: 190 }
    ]
  },
  {
    id: "VIX",
    data: [
      { x: "Invisible", y: 253 },
      { x: "Antiguo", y: 65 }
    ]
  },
  {
    id: "Eurodólar",
    data: [
      { x: "Invisible", y: 108 },
      { x: "Antiguo", y: 36 }
    ]
  }
];

// Asignar color transparente o gradiente
const customColors = bar =>
  bar.data.x === "Invisible" ? "rgba(0,0,0,0)" : "#FF6384";

const RadialBarChart = () => (
  <div style={{ height: 500, position: "relative" }}>
    <ResponsiveRadialBar
      data={data}
      valueFormat=">-.2f"
      padding={0.5}
      maxValue={350}
      startAngle={-130}
      endAngle={130}
      cornerRadius={15}
      innerRadius={0.2}
      borderWidth={0}
      enableTracks={false}
      trackOpacity={0.2}
      colors={customColors}
      radialAxisStart={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -50,
        legendOffset: 20
      }}
      theme={{
        labels: { text: { fontSize: 14, fill: "#555" } },
        axis: {
          ticks: {
            text: {
              fontSize: 14,
              fill: "#333",
            },
          },
        },
        tooltip: {
          container: { background: '#333', color: '#fff', fontSize: 12 },
        },
      }}
      circularAxisOuter={{
        tickSize: 0,
        tickPadding: 3,
        tickRotation: 0
      }}
    />
  </div>
);

export default RadialBarChart;
