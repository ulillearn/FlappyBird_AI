import { Game } from "./game.js";
import { History } from "./history.js";
import { ChartManager } from "./chart.js";

class FlappyBirdAI {
  constructor() {
    console.log("Initializing Flappy Bird AI...");

    // Inisialisasi komponen
    this.game = new Game("gameCanvas");
    this.history = new History("history-table");
    this.chart = new ChartManager("score-chart");

    // State game
    this.isPaused = false;
    this.startTime = Date.now();

    // Tracking rekor sepanjang masa (hanya untuk riwayat dan chart)
    this.bestScoreOverall = 0;
    this.bestGenerationOverall = 1;

    // Setup
    this.setupEventListeners();
    this.setupGameCallbacks();

    // Mulai game loop
    this.gameLoop();

    console.log("Flappy Bird AI initialized successfully");
  }

  setupGameCallbacks() {
    // Handle generasi yang sudah selesai (untuk riwayat dan chart)
    this.game.onGenerationComplete = (data) => {
      console.log(
        `Generation ${data.generation} complete with score: ${data.bestScore}`
      );
      this.handleGenerationComplete(data);
    };

    // HANYA menerima data generasi saat ini untuk ditampilkan
    this.game.onScoreUpdate = (score, pipes) => {
      this.updateCurrentGenerationDisplay(score, pipes);
    };
  }

  setupEventListeners() {
    // Tombol kontrol
    document
      .getElementById("pause-btn")
      .addEventListener("click", () => this.togglePause());
    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this.resetGame());
  }

  gameLoop() {
    if (!this.isPaused) {
      // Update game
      this.game.update();
      this.game.draw();

      // Update stats
      this.updateStats();
    }

    // Lanjutkan loop
    requestAnimationFrame(() => this.gameLoop());
  }

  handleGenerationComplete(data) {
    // Data generasi yang baru selesai
    const generationNumber = data.generation;
    const generationScore = data.bestScore;
    const generationPipes = data.pipesPassed;

    // Cek apakah ini rekor baru sepanjang masa
    const isNewRecord = generationScore > this.bestScoreOverall;
    if (isNewRecord) {
      this.bestScoreOverall = generationScore;
      this.bestGenerationOverall = generationNumber;
    }

    // Tambahkan ke riwayat (hanya generasi yang sudah selesai)
    this.history.addRecord({
      generation: generationNumber,
      score: generationScore,
      pipes: generationPipes,
      isNewRecord: isNewRecord,
    });

    // Update chart dengan data generasi yang sudah selesai
    this.chart.addData(generationNumber, generationScore);

    console.log(
      `Recorded: Gen ${generationNumber}, Score: ${generationScore}, Pipes: ${generationPipes}`
    );
  }

  // FUNGSI BARU: Update display dengan data generasi saat ini
  updateCurrentGenerationDisplay(score, pipes) {
    // Update box statis dengan data real-time generasi saat ini
    document.getElementById("highscore-display").textContent = score;
    document.getElementById("pipes-display").textContent = pipes;
  }

  updateStats() {
    // Update alive count dan generation display dari game state
    const alive =
      this.game && this.game.population
        ? this.game.population.getAliveCount()
        : 0;
    const generation =
      this.game && this.game.population ? this.game.population.generation : 1;

    document.getElementById("alive-display").textContent = alive;
    document.getElementById("generation-display").textContent = generation;
  }

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

  resetGame() {
    console.log("Resetting game...");
    this.game.reset();
    this.history.clear();
    this.chart.reset();
    this.bestScoreOverall = 0;
    this.bestGenerationOverall = 1;
    this.startTime = Date.now();

    // Reset semua display
    this.updateStats();
    this.updateCurrentGenerationDisplay(0, 0);

    // Reset tombol pause
    const pauseBtn = document.getElementById("pause-btn");
    if (pauseBtn) {
      pauseBtn.textContent = "⏸️ Jeda";
      pauseBtn.style.background = "linear-gradient(135deg, #4f46e5, #7c3aed)";
    }

    this.isPaused = false;
  }
}

// Inisialisasi saat halaman dimuat
window.addEventListener("DOMContentLoaded", () => {
  new FlappyBirdAI();
});
