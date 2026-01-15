import { Population } from "./population.js";
import { Pipe } from "./pipe.js";

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Matikan anti-aliasing (smoothing) agar visual pixel art tetap tajam
    this.ctx.imageSmoothingEnabled = false;

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Entitas Game
    this.pipes = [];
    this.population = null;

    // State Game Loop
    this.frameCount = 0;
    this.pipeInterval = 120; // Jarak antar pipa (dalam frame)
    this.lastPipeFrame = 0;
    this.isRunning = true;
    this.minFramesPerGeneration = 300; // Minimal durasi generasi (mencegah evolusi terlalu cepat)

    // Kecepatan Gulir (Scroll Speed)
    this.gameSpeed = 3;

    // Variabel animasi tanah
    this.groundX = 0;

    // State Transisi Generasi
    this.generationEnded = false;
    this.generationEndFrame = 0;
    this.endDelayFrames = 60; // Waktu tunggu sebelum generasi baru dimulai

    // Tracking Skor
    this.currentScore = 0;
    this.currentPipes = 0;
    this.bestScoreOverall = 0;
    this.generationBestScore = 0;
    this.generationBestPipes = 0;

    // Callback ke UI (Main.js)
    this.onGenerationComplete = null;
    this.onScoreUpdate = null;

    // Asset Loading: Hanya memuat Burung dan Awan
    // Tanah (Ground) dan Pipa dibuat secara prosedural (coding)
    this.birdImage = new Image();
    this.birdImage.src = "assets/bird.webp";

    this.cloudImage = new Image();
    this.cloudImage.src = "assets/cloud.svg";

    this.clouds = [];
    this.initBackgroundElements();

    this.init();
  }

  // Inisialisasi elemen dekoratif background (Awan)
  initBackgroundElements() {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: 50 + Math.random() * 150,
        size: 50 + Math.random() * 50,
        speed: 0.15 + Math.random() * 0.25,
      });
    }
  }

  // Reset Game / Inisialisasi Awal
  init() {
    this.population = new Population(50, 0.1); // 50 Burung, Mutasi 10%
    this.pipes = [];
    this.frameCount = 0;
    this.lastPipeFrame = 0;

    // Reset Skor
    this.currentScore = 0;
    this.currentPipes = 0;
    this.generationBestScore = 0;
    this.generationBestPipes = 0;
    this.generationEnded = false;
    this.groundX = 0;

    this.pipes.push(new Pipe(this.width));

    // Event Listener: Saat populasi mencetak skor baru
    this.population.onScoreUpdate = (score, pipes) => {
      if (score > this.generationBestScore) {
        this.generationBestScore = score;
        this.generationBestPipes = pipes;
      }
      this.currentScore = this.generationBestScore;
      this.currentPipes = this.generationBestPipes;

      if (score > this.bestScoreOverall) {
        this.bestScoreOverall = score;
      }

      if (this.onScoreUpdate) {
        this.onScoreUpdate(this.currentScore, this.currentPipes);
      }
    };

    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.currentScore, this.currentPipes);
    }
  }

  // Main Logic Loop (Update Physics & AI)
  update() {
    if (!this.isRunning) return;

    // 1. Handle Transisi Generasi (Jeda waktu)
    if (this.generationEnded) {
      this.frameCount++;
      if (this.frameCount - this.generationEndFrame >= this.endDelayFrames) {
        this.generationEnded = false;
        this.nextGeneration();
      }
      return;
    }

    this.frameCount++;

    // 2. Update Environment
    this.updateBackground();
    this.updateGround();
    this.updatePipes();

    // 3. Update AI Population
    // Mengembalikan jumlah burung yang masih hidup
    const aliveCount = this.population.update(this.pipes);

    // 4. Cek Kondisi Game Over (Semua mati)
    if (aliveCount === 0 && this.frameCount >= this.minFramesPerGeneration) {
      console.log(`All birds dead in generation ${this.population.generation}`);
      this.generationEnded = true;
      this.generationEndFrame = this.frameCount;
      return;
    }
  }

  updateBackground() {
    this.clouds.forEach((cloud) => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.size > this.width) {
        cloud.x = -cloud.size * 2;
        cloud.y = 50 + Math.random() * 150;
      }
    });
  }

  updateGround() {
    this.groundX -= this.gameSpeed;
    // Infinite Scroll Logic: Reset posisi setiap kali pola selesai (24px)
    // Ini mencegah koordinat menjadi terlalu besar dan menjaga loop mulus
    const patternSize = 24;
    this.groundX = this.groundX % patternSize;
  }

  updatePipes() {
    if (this.generationEnded) return;

    this.pipes = this.pipes.filter((pipe) => !pipe.isOffScreen());
    this.pipes.forEach((pipe) => pipe.update());

    // Spawn pipa baru berdasarkan interval
    if (
      this.frameCount - this.lastPipeFrame >= this.pipeInterval &&
      this.frameCount > 60
    ) {
      this.pipes.push(new Pipe(this.width));
      this.lastPipeFrame = this.frameCount;
    }
  }

  // Evolusi: Pemicu Algoritma Genetika
  nextGeneration() {
    console.log(`Completing generation ${this.population.generation}`);
    // Meminta Population class membuat generasi baru
    const result = this.population.nextGeneration();

    // Reset Environment untuk generasi baru
    this.pipes = [];
    this.frameCount = 0;
    this.lastPipeFrame = 0;
    this.generationBestScore = 0;
    this.generationBestPipes = 0;
    this.currentScore = 0;
    this.currentPipes = 0;
    this.generationEnded = false;
    this.groundX = 0;

    this.pipes.push(new Pipe(this.width));

    // Update UI
    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.currentScore, this.currentPipes);
    }

    if (this.onGenerationComplete) {
      this.onGenerationComplete({
        generation: result.generation,
        bestScore: result.bestScore,
        averageScore: result.averageScore,
        pipesPassed: result.pipesPassed,
      });
    }
    console.log(
      `Generation ${result.generation} recorded. Best: ${result.bestScore}`
    );
  }

  // Main Rendering Loop
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Layer 1: Background
    this.drawBackgroundOnly();

    // Layer 2: Pipes
    this.pipes.forEach((pipe) => {
      this.drawPipeWithEffects(pipe);
    });

    // Layer 3: Ground (Prosedural)
    this.drawProceduralGround();

    // Layer 4: Birds
    this.population.draw(this.ctx, this.birdImage);

    // Layer 5: UI Overlay (Jika transisi)
    if (this.generationEnded) {
      this.drawGenerationEndText();
    }
  }

  drawBackgroundOnly() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#A0D8EF");
    gradient.addColorStop(1, "#E0F7FA");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawSun();

    this.clouds.forEach((cloud) => {
      this.drawCloud(cloud.x, cloud.y, cloud.size);
    });
  }

  drawSun() {
    const x = this.width - 60;
    const y = 60;
    const radius = 25;

    // Gradient Matahari
    const sunGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    sunGradient.addColorStop(0, "#FFEB3B");
    sunGradient.addColorStop(1, "#FF9800");
    this.ctx.fillStyle = sunGradient;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Efek Sinar
    this.ctx.strokeStyle = "rgba(255, 235, 59, 0.6)";
    this.ctx.lineWidth = 5;

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      this.ctx.beginPath();
      this.ctx.moveTo(
        x + Math.cos(angle) * (radius + 5),
        y + Math.sin(angle) * (radius + 5)
      );
      this.ctx.lineTo(
        x + Math.cos(angle) * (radius + 30),
        y + Math.sin(angle) * (radius + 30)
      );
      this.ctx.stroke();
    }
  }

  drawCloud(x, y, size) {
    if (this.cloudImage.complete) {
      this.ctx.save();
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = "transparent";
      this.ctx.drawImage(this.cloudImage, x, y, size, size * 0.6);
      this.ctx.restore();
    }
  }

  // --- RENDERING TANAH PROSEDURAL ---
  // Menggambar tanah menggunakan primitive shape canvas untuk hasil tajam
  // dan menghindari celah pixel (gap) yang sering muncul pada looping gambar
  drawProceduralGround() {
    const groundHeight = 80;
    const y = this.height - groundHeight;
    const grassThickness = 15;

    // 1. Tanah Dasar (Coklat)
    this.ctx.fillStyle = "#ded895";
    this.ctx.fillRect(0, y, this.width, groundHeight);

    // 2. Rumput (Hijau)
    this.ctx.fillStyle = "#73bf2e";
    this.ctx.fillRect(0, y, this.width, grassThickness);

    // 3. Detail Border Rumput
    this.ctx.fillStyle = "#558b2f";
    this.ctx.fillRect(0, y, this.width, 2); // Garis atas
    this.ctx.fillRect(0, y + grassThickness, this.width, 2); // Bayangan bawah

    // 4. Motif Diagonal (Stripes) Bergerak
    // Menggunakan loop untuk menggambar jajaran genjang berulang
    const patternSize = 24;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = "#65a628"; // Warna motif hijau gelap

    // Kalkulasi posisi awal (offset) berdasarkan groundX
    let startX = Math.floor(this.groundX);

    // Pastikan startX mulai dari kiri layar (negative) agar mulus
    while (startX > -patternSize) startX -= patternSize;

    for (let i = startX; i < this.width; i += patternSize) {
      // Gambar bentuk diagonal
      this.ctx.moveTo(i + 10, y + 2);
      this.ctx.lineTo(i + 16, y + 2);
      this.ctx.lineTo(i + 6, y + grassThickness);
      this.ctx.lineTo(i, y + grassThickness);
    }
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPipeWithEffects(pipe) {
    // Gradient Warna Pipa (Hijau Terang ke Hijau Gelap)
    const pipeGradient = this.ctx.createLinearGradient(
      pipe.x,
      0,
      pipe.x + pipe.width,
      0
    );
    pipeGradient.addColorStop(0, "#2ECC71");
    pipeGradient.addColorStop(0.5, "#27AE60");
    pipeGradient.addColorStop(1, "#229954");

    this.ctx.fillStyle = pipeGradient;

    // Pipa Atas & Bawah
    this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY);
    this.ctx.fillRect(
      pipe.x,
      pipe.gapY + pipe.gapHeight,
      pipe.width,
      this.height
    );

    // Detail "Kepala" Pipa (Caps)
    this.ctx.fillStyle = "#1E8449";

    // Cap Atas
    this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, pipe.width + 10, 20);
    this.ctx.fillStyle = "#145A32"; // Shadow
    this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, pipe.width + 10, 5);

    // Cap Bawah
    this.ctx.fillStyle = "#1E8449";
    this.ctx.fillRect(
      pipe.x - 5,
      pipe.gapY + pipe.gapHeight,
      pipe.width + 10,
      20
    );
    this.ctx.fillStyle = "#145A32"; // Shadow
    this.ctx.fillRect(
      pipe.x - 5,
      pipe.gapY + pipe.gapHeight,
      pipe.width + 10,
      5
    );
  }

  drawGenerationEndText() {
    // Overlay Gelap
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Kotak Pesan
    this.ctx.fillStyle = "rgba(79, 70, 229, 0.9)";
    this.ctx.shadowColor = "#4f46e5";
    this.ctx.shadowBlur = 20;
    this.ctx.fillRect(this.width / 2 - 160, this.height / 2 - 60, 320, 120);
    this.ctx.shadowBlur = 0;

    // Teks
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "bold 26px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      "✨ Generasi Selesai ✨",
      this.width / 2,
      this.height / 2 - 20
    );

    this.ctx.font = "18px Arial";
    this.ctx.fillText(
      "Mempersiapkan generasi berikutnya...",
      this.width / 2,
      this.height / 2 + 15
    );

    // Countdown
    const framesLeft =
      this.endDelayFrames - (this.frameCount - this.generationEndFrame);
    const secondsLeft = Math.ceil(framesLeft / 60);
    const countdownText =
      secondsLeft > 0 ? `Dimulai dalam: ${secondsLeft} detik` : "Memulai...";
    this.ctx.fillText(countdownText, this.width / 2, this.height / 2 + 45);
  }

  reset() {
    console.log("Resetting entire game...");
    this.init();
    this.initBackgroundElements();
  }
}
