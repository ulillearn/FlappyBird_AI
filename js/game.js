import { Population } from "./population.js";
import { Pipe } from "./pipe.js";

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Game objects
    this.pipes = [];
    this.population = null;

    // Game state
    this.frameCount = 0;
    this.pipeInterval = 120;
    this.lastPipeFrame = 0;
    this.isRunning = true;
    this.minFramesPerGeneration = 300;

    // State untuk jeda setelah generasi selesai
    this.generationEnded = false;
    this.generationEndFrame = 0;
    this.endDelayFrames = 60; // 1 detik (60 fps)

    // Score tracking - HANYK UNTUK GENERASI SAAT INI
    this.currentScore = 0; // Skor tertinggi generasi saat ini
    this.currentPipes = 0; // Pipa dilewati generasi saat ini
    this.bestScoreOverall = 0; // Skor tertinggi sepanjang masa (untuk internal)

    // Tracking generasi saat ini
    this.generationBestScore = 0; // Skor terbaik di generasi ini
    this.generationBestPipes = 0; // Pipa terbaik di generasi ini

    // Callbacks
    this.onGenerationComplete = null;
    this.onScoreUpdate = null;

    // Load bird image
    this.birdImage = new Image();
    this.birdImage.src = "assets/bird.webp";

    // Initialize game
    this.init();
  }

  init() {
    // Parameter tetap
    this.population = new Population(50, 0.1);

    // Reset state
    this.pipes = [];
    this.frameCount = 0;
    this.lastPipeFrame = 0;
    this.currentScore = 0;
    this.currentPipes = 0;
    this.generationBestScore = 0;
    this.generationBestPipes = 0;
    this.generationEnded = false;

    // Buat pipa pertama
    this.pipes.push(new Pipe(this.width));

    // Setup callbacks - KIRIM DATA GENERASI SAAT INI SAJA
    this.population.onScoreUpdate = (score, pipes) => {
      // Update data terbaik generasi saat ini
      if (score > this.generationBestScore) {
        this.generationBestScore = score;
        this.generationBestPipes = pipes;
      }

      // Update display dengan data generasi saat ini
      this.currentScore = this.generationBestScore;
      this.currentPipes = this.generationBestPipes;

      // Update skor tertinggi sepanjang masa (hanya untuk internal)
      if (score > this.bestScoreOverall) {
        this.bestScoreOverall = score;
      }

      if (this.onScoreUpdate) {
        // Kirim data generasi saat ini saja, bukan bestOverall
        this.onScoreUpdate(this.currentScore, this.currentPipes);
      }
    };

    // Kirim nilai awal 0 untuk reset display
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.currentScore, this.currentPipes);
    }
  }

  update() {
    if (!this.isRunning) return;

    // FASE 1: Jika generasi sudah berakhir (semua burung mati + sudah mencapai minFrames)
    if (this.generationEnded) {
      this.frameCount++;

      // Setelah delay, lanjut ke generasi berikutnya
      if (this.frameCount - this.generationEndFrame >= this.endDelayFrames) {
        this.generationEnded = false;
        this.nextGeneration();
      }
      return; // Tidak update apapun selama jeda
    }

    this.frameCount++;

    // Update pipa
    this.updatePipes();

    // Update populasi
    const aliveCount = this.population.update(this.pipes);

    // Tandai generasi berakhir hanya jika:
    // 1. Semua burung mati
    // 2. Sudah mencapai minimum frames
    if (aliveCount === 0 && this.frameCount >= this.minFramesPerGeneration) {
      console.log(`All birds dead in generation ${this.population.generation}`);
      this.generationEnded = true;
      this.generationEndFrame = this.frameCount;
      return;
    }

    // Debug info
    if (this.frameCount % 300 === 0) {
      console.log(
        `Frame: ${this.frameCount}, Alive: ${aliveCount}, Gen: ${this.population.generation}`
      );
    }
  }

  updatePipes() {
    // Jangan update pipa jika generasi sudah berakhir
    if (this.generationEnded) return;

    // Hapus pipa yang keluar layar
    this.pipes = this.pipes.filter((pipe) => !pipe.isOffScreen());

    // Update posisi pipa
    this.pipes.forEach((pipe) => pipe.update());

    // Tambah pipa baru
    if (
      this.frameCount - this.lastPipeFrame >= this.pipeInterval &&
      this.frameCount > 60
    ) {
      this.pipes.push(new Pipe(this.width));
      this.lastPipeFrame = this.frameCount;
    }
  }

  nextGeneration() {
    console.log(`Completing generation ${this.population.generation}`);

    // Dapatkan hasil generasi SEKARANG (sebelum increment)
    const result = this.population.nextGeneration();

    // Reset state untuk generasi baru
    this.pipes = [];
    this.frameCount = 0;
    this.lastPipeFrame = 0;
    this.generationBestScore = 0; // RESET untuk generasi baru
    this.generationBestPipes = 0; // RESET untuk generasi baru
    this.currentScore = 0;
    this.currentPipes = 0;
    this.generationEnded = false;

    // Buat pipa pertama untuk generasi baru
    this.pipes.push(new Pipe(this.width));

    // Kirim update display dengan nilai 0 untuk generasi baru
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.currentScore, this.currentPipes);
    }

    // Panggil callback dengan hasil generasi yang sudah selesai
    if (this.onGenerationComplete) {
      this.onGenerationComplete({
        generation: result.generation,
        bestScore: result.bestScore, // Skor terbaik generasi yang baru selesai
        averageScore: result.averageScore,
        pipesPassed: result.pipesPassed, // Pipa terbaik generasi yang baru selesai
      });
    }

    console.log(
      `Generation ${result.generation} recorded. Best: ${result.bestScore}, Pipes: ${result.pipesPassed}`
    );
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw background
    this.drawBackground();

    // Draw pipes
    this.pipes.forEach((pipe) => pipe.draw(this.ctx));

    // Draw birds
    this.population.draw(this.ctx, this.birdImage);

    // Tampilkan teks jika generasi berakhir
    if (this.generationEnded) {
      this.drawGenerationEndText();
    }
  }

  drawBackground() {
    // Sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.7, "#E0F7FA");
    gradient.addColorStop(1, "#C8E6C9");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Simple clouds
    this.drawCloud(100, 80, 60);
    this.drawCloud(300, 120, 80);
    this.drawCloud(200, 180, 50);
  }

  drawCloud(x, y, size) {
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGenerationEndText() {
    // Overlay semi-transparan
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fillRect(this.width / 2 - 150, this.height / 2 - 50, 300, 100);

    // Teks utama
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "bold 22px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Generasi Selesai", this.width / 2, this.height / 2 - 15);

    // Teks sekunder
    this.ctx.font = "16px Arial";
    this.ctx.fillText(
      "Mempersiapkan generasi berikutnya...",
      this.width / 2,
      this.height / 2 + 15
    );

    // Timer countdown
    const framesLeft =
      this.endDelayFrames - (this.frameCount - this.generationEndFrame);
    const secondsLeft = Math.ceil(framesLeft / 60);
    this.ctx.fillText(
      `Dimulai dalam: ${secondsLeft} detik`,
      this.width / 2,
      this.height / 2 + 40
    );
  }

  reset() {
    console.log("Resetting entire game...");
    this.init();
  }
}
