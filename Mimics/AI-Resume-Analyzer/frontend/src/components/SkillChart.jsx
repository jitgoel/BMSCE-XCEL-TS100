import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function SkillChart({ skills }) {
  const data = {
    labels: Object.keys(skills),
    datasets: [
      {
        label: "Market Demand %",
        data: Object.values(skills),
        backgroundColor: [
          "rgba(42, 157, 143, 0.85)",
          "rgba(14, 117, 168, 0.85)",
          "rgba(244, 162, 97, 0.85)",
          "rgba(231, 111, 81, 0.85)",
          "rgba(58, 90, 120, 0.85)",
          "rgba(96, 108, 56, 0.85)",
        ],
        borderRadius: 12,
        maxBarThickness: 52,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#334155",
          boxWidth: 14,
          font: {
            family: "Manrope",
            weight: "700",
          },
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#334155",
          font: {
            family: "Manrope",
            weight: "600",
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: "#64748b",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.25)",
        },
      },
    },
  };

  return (
    <div className="chart-wrap">
      <Bar data={data} options={options} />
    </div>
  );
}

export default SkillChart;
