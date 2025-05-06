import { ChartJSNodeCanvas } from "chartjs-node-canvas";

interface CreateChartOptions {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
  chartType: "bar" | "line" | "pie";
  title: string;
}

export async function CreateChart({
  labels,
  datasets,
  chartType,
  title,
}: CreateChartOptions) {
  const width = 800;
  const height = 600;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: chartType,
    data: {
      labels,
      datasets: datasets.map((ds, idx) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor:
          chartType === "pie"
            ? ds.data.map(
                (_, dataIdx) =>
                  `hsl(${(dataIdx * 360) / ds.data.length}, 70%, 50%)`,
              )
            : `hsl(${(idx * 60) % 360}, 70%, 50%)`,
        borderColor:
          chartType === "pie"
            ? ds.data.map(
                (_, dataIdx) =>
                  `hsl(${(dataIdx * 360) / ds.data.length}, 90%, 60%)`,
              )
            : `hsl(${(idx * 60) % 360}, 90%, 60%)`,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          color: "#ffffff",
          font: {
            size: 24,
          },
        },
        legend: {
          labels: {
            color: "#ffffff",
          },
        },
      },
      scales:
        chartType === "pie"
          ? undefined
          : {
              x: {
                ticks: {
                  color: "#ffffff",
                },
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                },
              },
              y: {
                ticks: {
                  color: "#ffffff",
                },
                grid: {
                  color: "rgba(255, 255, 255, 0.1)",
                },
                beginAtZero: true,
              },
            },
    },
  };
  return await chartJSNodeCanvas.renderToBuffer(configuration);
}
