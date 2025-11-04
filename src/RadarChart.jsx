import React, { useState } from "react";
import { ResponsiveRadialBar } from "@nivo/radial-bar";

const fullData = {
  '2W': [
    { id: "VIX", data: [{ x: "VIX", y: 0.65 }] },
    { id: "MOVE", data: [{ x: "MOVE", y: 0.75 }] },
    { id: "Spread", data: [{ x: "Spread", y: 0.95 }] },
    { id: "RiskPremium", data: [{ x: "RiskPremium", y: 0.75 }] },
    { id: "Brent", data: [{ x: "Brent", y: 0.45 }] },
    { id: "Eurodólar", data: [{ x: "Eurodólar", y: 0.55 }] }
  ],
  'Actual': [
    { id: "VIX", data: [{ x: "VIX", y: 0.05 }] },
    { id: "MOVE", data: [{ x: "MOVE", y: 0.35 }] },
    { id: "Spread", data: [{ x: "Spread", y: 0.25 }] },
    { id: "RiskPremium", data: [{ x: "RiskPremium", y: 0.15 }] },
    { id: "Brent", data: [{ x: "Brent", y: 0.35 }] },
    { id: "Eurodólar", data: [{ x: "Eurodólar", y: 0.1 }] }
  ]
};

const colorScale = [
  "#43aa8b", // [0.0 – 0.2)
  "#90be6d", // [0.2 – 0.4)
  "#f9c74f", // [0.4 – 0.6)
  "#f8961e", // [0.6 – 0.8)
  "#f3722c", // [0.8 – 1.0+)
];

const getColorByValue = (bar) => {
  const y = bar.data.y;
  const index = Math.min(Math.floor(y * 5), 4);
  return colorScale[index];
};

const RadialBarChart = () => {
  const [selectedCategory, setSelectedCategory] = useState("Actual");

  // Calcular promedio para mostrar en el centro
  const currentData = fullData[selectedCategory];
  const average = currentData.reduce((sum, item) => sum + item.data[0].y, 0) / currentData.length;

  return (
    <div>
      <div style={{ marginBottom: 20, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        <div>
          <button
            onClick={() => setSelectedCategory("Actual")}
            style={{
              marginRight: 10,
              padding: "8px 16px",
              backgroundColor: selectedCategory === "Actual" ? "#2196f3" : "#ddd",
              color: selectedCategory === "Actual" ? "#fff" : "#000",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Actual
          </button>
          <button
            onClick={() => setSelectedCategory("2W")}
            style={{
              padding: "8px 16px",
              backgroundColor: selectedCategory === "2W" ? "#2196f3" : "#ddd",
              color: selectedCategory === "2W" ? "#fff" : "#000",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            2W
          </button>
        </div>
      </div>

      <div style={{ height: 500, position: "relative" }}>
        <ResponsiveRadialBar
          data={fullData[selectedCategory]}
          maxValue={1}
          padding={0.5}
          startAngle={-130}
          endAngle={130}
          cornerRadius={15}
          innerRadius={0.2}
          borderWidth={0}
          enableTracks={false}
          trackOpacity={0.2}
          colors={getColorByValue}
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
          label={bar => `${bar.data.x} ${(bar.data.y * 100).toFixed(0)}%`}
          labelsTextColor="#000000"
          tooltip={({ bar }) => {
            return (
              <div
                style={{
                  background: 'white',
                  color: '#333',
                  padding: '10px 15px',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  width: '170px',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)'
                }}
              >
                {bar.data.x} - {selectedCategory}: <strong>{bar.data.y.toFixed(2)}</strong>
              </div>
            )
          }}
          radialAxisStart={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -50,
            legendOffset: 20,
            tickTextColor: "#333"
          }}
          circularAxisOuter={{
            tickSize: 0,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Metrics",
            legendOffset: 20,
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 10
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "4px"
            }}
          >
            {(average).toFixed(1)}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}
          >
            GVC Risk
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#888",
              marginTop: "2px"
            }}
          >
            {selectedCategory}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadialBarChart;
