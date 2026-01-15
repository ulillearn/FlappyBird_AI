import { Game } from "./game.js";
import { History } from "./history.js";
import { ChartManager } from "./chart.js";

// Main Controller: Menghubungkan Logika Game, UI History, dan Grafik
class FlappyBirdAI {
  constructor() {
    console.log("Initializing Flappy Bird AI...");

    // 1. Inisialisasi Modul Utama
    this.game = new Game("gameCanvas"); // Logika Inti & Render
    this.history = new History("history-table"); // Tabel Data
    this.chart = new ChartManager("score-chart"); // Visualisasi Grafik

    // 2. State Aplikasi
    this.isPaused = false;
    this.startTime = Date.now();

    // Tracking Global (untuk perbandingan rekor)
    this.bestScoreOverall = 0;
    this.bestGenerationOverall = 1;

    // 3. Setup Event & Callbacks
    this.setupEventListeners();
    this.setupGameCallbacks();

    // 4. Mulai Game Loop
    this.gameLoop();

    console.log("Flappy Bird AI initialized successfully");
  }

  // Menghubungkan event dari Game Engine ke update UI (Chart/History)
  setupGameCallbacks() {
    // Callback: Saat satu generasi selesai (semua burung mati)
    this.game.onGenerationComplete = (data) => {
      console.log(
        `Generation ${data.generation} complete with score: ${data.bestScore}`
      );
      this.handleGenerationComplete(data);
    };

    // Callback: Update skor real-time saat game berjalan
    this.game.onScoreUpdate = (score, pipes) => {
      this.updateCurrentGenerationDisplay(score, pipes);
    };
  }

  setupEventListeners() {
    // Handler untuk tombol UI
    document
      .getElementById("pause-btn")
      .addEventListener("click", () => this.togglePause());
    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this.resetGame());
  }

  // Game Loop Utama: Mengatur update logika dan rendering per frame (60 FPS)
  // Menggunakan requestAnimationFrame agar sinkron dengan refresh rate monitor
  gameLoop() {
    if (!this.isPaused) {
      // Step 1: Update Logika & Fisika
      this.game.update();
      // Step 2: Gambar Frame Baru
      this.game.draw();

      // Step 3: Update Statistik UI Real-time
      this.updateStats();
    }

    // Loop terus menerus
    requestAnimationFrame(() => this.gameLoop());
  }

  // Logika Pasca-Generasi: Mencatat statistik ke History dan Grafik
  handleGenerationComplete(data) {
    const generationNumber = data.generation;
    const generationScore = data.bestScore;
    const generationPipes = data.pipesPassed;

    // Cek Rekor Baru
    const isNewRecord = generationScore > this.bestScoreOverall;
    if (isNewRecord) {
      this.bestScoreOverall = generationScore;
      this.bestGenerationOverall = generationNumber;
    }

    // Masukkan data ke Tabel Riwayat
    this.history.addRecord({
      generation: generationNumber,
      score: generationScore,
      pipes: generationPipes,
      isNewRecord: isNewRecord,
    });

    // Update Grafik Perkembangan
    this.chart.addData(generationNumber, generationScore);
  }

  // Update tampilan skor & pipa saat ini di UI (Panel Atas)
  updateCurrentGenerationDisplay(score, pipes) {
    document.getElementById("highscore-display").textContent = score;
    document.getElementById("pipes-display").textContent = pipes;
  }

  // Update statistik populasi (Jumlah Hidup & Nomor Generasi)
  updateStats() {
    const alive =
      this.game && this.game.population
        ? this.game.population.getAliveCount()
        : 0;
    const generation =
      this.game && this.game.population ? this.game.population.generation : 1;

    document.getElementById("alive-display").textContent = alive;
    document.getElementById("generation-display").textContent = generation;
  }

  // Fitur Pause/Resume
  togglePause() {
    this.isPaused = !this.isPaused;
    const btn = document.getElementById("pause-btn");
    if (btn) {
      btn.textContent = this.isPaused ? "▶️ Lanjut" : "⏸️ Jeda";
      btn.style.background = this.isPaused
        ? "linear-gradient(135deg, #10b981, #059669)"
        : "linear-gradient(135deg, #4f46e5, #7c3aed)";
    }
  }

  // Reset Total Aplikasi ke Kondisi Awal
  resetGame() {
    console.log("Resetting game...");
    this.game.reset(); // Reset Logika Game
    this.history.clear(); // Hapus Tabel
    this.chart.reset(); // Hapus Grafik
    this.bestScoreOverall = 0;
    this.bestGenerationOverall = 1;
    this.startTime = Date.now();

    this.updateStats();
    this.updateCurrentGenerationDisplay(0, 0);

    // Reset State UI Tombol
    const pauseBtn = document.getElementById("pause-btn");
    if (pauseBtn) {
      pauseBtn.textContent = "⏸️ Jeda";
      pauseBtn.style.background = "linear-gradient(135deg, #4f46e5, #7c3aed)";
    }

    this.isPaused = false;
  }
}

// Entry Point: Memulai aplikasi saat DOM siap
window.addEventListener("DOMContentLoaded", () => {
  new FlappyBirdAI();
});
