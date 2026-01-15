export class ChartManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    // Penyimpanan data untuk sumbu X (Generasi) dan Y (Skor)
    this.scores = [];
    this.generations = [];

    this.initChart();
  }

  // Konfigurasi awal library Chart.js
  // Mengatur tipe grafik (Line), styling, dan label sumbu
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
              tension: 0.3, // Membuat garis sedikit melengkung (smooth)
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

  // Update Real-time: Menambah data generasi baru ke grafik
  addData(generation, score) {
    this.generations.push(generation);
    this.scores.push(score);

    // Optimasi: Hapus data terlama jika sudah lebih dari 50 poin
    // Mencegah grafik menjadi terlalu padat dan berat
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

  // Reset visualisasi saat tombol Reset ditekan
  reset() {
    this.generations = [];
    this.scores = [];
    if (this.chart) {
      this.chart.destroy();
      this.initChart();
    }
  }
}
