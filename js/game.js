import { Population } from "./population.js";
import { Pipe } from "./pipe.js";

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Matikan smoothing agar pixel art terlihat tajam
    this.ctx.imageSmoothingEnabled = false;

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

    // Kecepatan Game
    this.gameSpeed = 3;

    // Variabel posisi animasi tanah
    this.groundX = 0;

    // State untuk jeda setelah generasi selesai
    this.generationEnded = false;
    this.generationEndFrame = 0;
    this.endDelayFrames = 60;

    // Score tracking
    this.currentScore = 0;
    this.currentPipes = 0;
    this.bestScoreOverall = 0;
    this.generationBestScore = 0;
    this.generationBestPipes = 0;

    // Callbacks
    this.onGenerationComplete = null;
    this.onScoreUpdate = null;

    // --- LOAD ASSETS (Hanya Bird & Cloud, Ground kita bikin sendiri) ---
    this.birdImage = new Image();
    this.birdImage.src = "assets/bird.webp";

    this.cloudImage = new Image();
    this.cloudImage.src = "assets/cloud.svg";

    // Background elements
    this.clouds = [];
    this.initBackgroundElements();

    // Initialize game
    this.init();
  }

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

  init() {
    this.population = new Population(50, 0.1);
    this.pipes = [];
    this.frameCount = 0;
    this.lastPipeFrame = 0;
    this.currentScore = 0;
    this.currentPipes = 0;
    this.generationBestScore = 0;
    this.generationBestPipes = 0;
    this.generationEnded = false;
    this.groundX = 0;

    this.pipes.push(new Pipe(this.width));

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

  update() {
    if (!this.isRunning) return;

    if (this.generationEnded) {
      this.frameCount++;
      if (this.frameCount - this.generationEndFrame >= this.endDelayFrames) {
        this.generationEnded = false;
        this.nextGeneration();
      }
      return;
    }

    this.frameCount++;

    this.updateBackground();
    this.updateGround();
    this.updatePipes();

    const aliveCount = this.population.update(this.pipes);

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
    // Geser ground
    this.groundX -= this.gameSpeed;

    // Pola rumput akan berulang setiap 24 pixel (sesuai ukuran pola di drawProceduralGround)
    // Jadi kita mereset offset setiap kelipatan 24.
    const patternSize = 24;
    this.groundX = this.groundX % patternSize;
  }

  updatePipes() {
    if (this.generationEnded) return;

    this.pipes = this.pipes.filter((pipe) => !pipe.isOffScreen());
    this.pipes.forEach((pipe) => pipe.update());

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
    const result = this.population.nextGeneration();

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

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackgroundOnly();

    this.pipes.forEach((pipe) => {
      this.drawPipeWithEffects(pipe);
    });

    // Panggil fungsi ground baru (prosedural)
    this.drawProceduralGround();

    this.population.draw(this.ctx, this.birdImage);

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

    const sunGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    sunGradient.addColorStop(0, "#FFEB3B");
    sunGradient.addColorStop(1, "#FF9800");
    this.ctx.fillStyle = sunGradient;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

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

  // --- 🔥 FITUR BARU: GROUND PROSEDURAL (DIBIKIN PAKE KODE) ---
  drawProceduralGround() {
    const groundHeight = 80; // Tinggi tanah
    const y = this.height - groundHeight;
    const grassThickness = 15; // Tebal rumput

    // 1. Gambar TANAH (Bagian Coklat Bawah)
    // Digambar full screen, jadi tidak mungkin ada celah vertikal
    this.ctx.fillStyle = "#ded895"; // Warna krem/coklat pasir
    this.ctx.fillRect(0, y, this.width, groundHeight);

    // 2. Gambar RUMPUT (Bagian Hijau Atas)
    this.ctx.fillStyle = "#73bf2e"; // Hijau cerah
    this.ctx.fillRect(0, y, this.width, grassThickness);

    // 3. Gambar BORDER Rumput (Garis hijau tua di atas)
    this.ctx.fillStyle = "#558b2f";
    this.ctx.fillRect(0, y, this.width, 2);

    // 4. Gambar BORDER Bawah Rumput (Garis bayangan)
    this.ctx.fillStyle = "#558b2f";
    this.ctx.fillRect(0, y + grassThickness, this.width, 2);

    // 5. Gambar MOTIF BERGERAK (Diagonal Stripes ala Flappy Bird)
    // Pola berulang setiap 24 pixel (patternSize)
    const patternSize = 24;

    this.ctx.save();
    this.ctx.beginPath();
    // Warna garis motif (hijau sedikit lebih gelap/terang)
    this.ctx.fillStyle = "#65a628";

    // Kita mulai loop dari posisi groundX (negatif) sampai melebihi lebar layar
    // Ini menciptakan efek animasi bergerak
    let startX = Math.floor(this.groundX);

    // Pastikan startX mulai cukup jauh di kiri agar tidak ada celah saat masuk layar
    while (startX > -patternSize) startX -= patternSize;

    for (let i = startX; i < this.width; i += patternSize) {
      // Gambar jajaran genjang (diagonal stripe)
      // Koordinat relatif terhadap i
      this.ctx.moveTo(i + 10, y + 2); // Atas kiri
      this.ctx.lineTo(i + 16, y + 2); // Atas kanan
      this.ctx.lineTo(i + 6, y + grassThickness); // Bawah kanan
      this.ctx.lineTo(i, y + grassThickness); // Bawah kiri
    }
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPipeWithEffects(pipe) {
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

    // Top pipe
    this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY);

    // Bottom pipe
    this.ctx.fillRect(
      pipe.x,
      pipe.gapY + pipe.gapHeight,
      pipe.width,
      this.height
    );

    // Pipe caps
    this.ctx.fillStyle = "#1E8449";

    // Top cap
    this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, pipe.width + 10, 20);
    this.ctx.fillStyle = "#145A32";
    this.ctx.fillRect(pipe.x - 5, pipe.gapY - 20, pipe.width + 10, 5);

    // Bottom cap
    this.ctx.fillStyle = "#1E8449";
    this.ctx.fillRect(
      pipe.x - 5,
      pipe.gapY + pipe.gapHeight,
      pipe.width + 10,
      20
    );
    this.ctx.fillStyle = "#145A32";
    this.ctx.fillRect(
      pipe.x - 5,
      pipe.gapY + pipe.gapHeight,
      pipe.width + 10,
      5
    );
  }

  drawGenerationEndText() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = "rgba(79, 70, 229, 0.9)";
    this.ctx.shadowColor = "#4f46e5";
    this.ctx.shadowBlur = 20;
    this.ctx.fillRect(this.width / 2 - 160, this.height / 2 - 60, 320, 120);
    this.ctx.shadowBlur = 0;

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
