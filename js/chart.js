export class ChartManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.scores = [];
    this.generations = [];

    this.initChart();
  }

  initChart() {
    if (window.Chart) {
      this.chart = new Chart(this.canvas.getContext("2d"), {
        type: "line",
        data: {
          labels: this.generations,
          datasets: [
            {
              label: "Skor Tertinggi per Generasi",
              data: this.scores,
              borderColor: "#4f46e5",
              backgroundColor: "rgba(79, 70, 229, 0.1)",
              borderWidth: 2,
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Skor",
              },
            },
            x: {
              title: {
                display: true,
                text: "Generasi",
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
        },
      });
    }
  }

  addData(generation, score) {
    this.generations.push(generation);
    this.scores.push(score);

    if (this.generations.length > 50) {
      this.generations.shift();
      this.scores.shift();
    }

    if (this.chart) {
      this.chart.data.labels = this.generations;
      this.chart.data.datasets[0].data = this.scores;
      this.chart.update();
    }
  }

  reset() {
    this.generations = [];
    this.scores = [];
    if (this.chart) {
      this.chart.destroy();
      this.initChart();
    }
  }
}
