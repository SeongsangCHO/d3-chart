import { ScatterPlot } from "./charts/scatter-plots";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
      }}
    >
      {Array.from({ length: 1 }, (_, i) => (
        <ScatterPlot
          key={i}
          width={600}
          height={600}
          data={Array.from({ length: 200 }, (_, j) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            label: `Pt ${j}`,
          }))}
        />
      ))}
    </div>
  );
}

export default App;
