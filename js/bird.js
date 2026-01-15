import { Brain } from "./brain.js";

export class Bird {
  constructor(brain = null, x = 100) {
    // Properti Fisika
    this.x = x;
    this.y = 300;
    this.velocity = 0;
    this.gravity = 0.5;
    this.lift = -8;
    this.radius = 15;

    // AI Brain: Menggunakan Neural Network yang sudah ada (hasil evolusi) atau baru (random)
    this.brain = brain ? brain.clone() : new Brain();

    // Statistik untuk perhitungan Fitness
    this.score = 0;
    this.pipesPassed = 0;
    this.fitness = 0;
    this.dead = false;

    // Melacak ID pipa yang sudah dilewati agar skor tidak ganda
    this.passedPipes = new Set();
  }

  update(pipes) {
    if (this.dead) return;

    // 1. Update Fisika (Gravitasi)
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Cek batas atas dan bawah layar
    if (this.y < this.radius) {
      this.y = this.radius;
      this.velocity = 0;
    }
    if (this.y > 600 - this.radius) {
      this.die();
      return;
    }

    // 2. Logika AI (Neural Network Decision)
    // Mencari pipa terdekat di depan burung
    const activePipes = pipes.filter(
      (pipe) => !this.passedPipes.has(pipe.id) && pipe.x + pipe.width > 0
    );

    if (activePipes.length > 0) {
      const nearestPipe = activePipes.reduce((prev, current) =>
        prev.x < current.x ? prev : current
      );

      // Normalisasi Input untuk Neural Network (0.0 - 1.0)
      const inputs = [
        this.y / 600, // Posisi Y Burung
        (this.velocity + 10) / 20, // Kecepatan Vertikal
        Math.max(0, nearestPipe.x - this.x) / 400, // Jarak horizontal ke pipa
        nearestPipe.gapY / 600, // Posisi celah pipa
      ];

      // Jika output NN memenuhi threshold, burung melompat
      if (this.brain.predict(inputs)) {
        this.jump();
      }
    }

    // 3. Cek Tabrakan
    for (const pipe of pipes) {
      if (this.checkCollision(pipe)) {
        this.die();
        return;
      }
    }

    // 4. Sistem Scoring
    for (const pipe of pipes) {
      if (
        !this.passedPipes.has(pipe.id) &&
        this.x > pipe.x + pipe.width &&
        pipe.x + pipe.width > -50
      ) {
        this.passedPipes.add(pipe.id);
        this.pipesPassed++;
        this.score += 10;
      }
    }
  }

  // Deteksi tabrakan menggunakan AABB (Axis-Aligned Bounding Box)
  checkCollision(pipe) {
    const birdLeft = this.x - this.radius * 0.8;
    const birdRight = this.x + this.radius * 0.8;
    const birdTop = this.y - this.radius * 0.8;
    const birdBottom = this.y + this.radius * 0.8;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipe.width;
    const pipeTopHeight = pipe.gapY;
    const pipeGapBottom = pipe.gapY + pipe.gapHeight;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < pipeTopHeight || birdBottom > pipeGapBottom) {
        return true;
      }
    }
    return false;
  }

  jump() {
    this.velocity = this.lift;
  }

  // Menandai burung mati dan menetapkan nilai fitness sementara
  die() {
    if (!this.dead) {
      this.dead = true;
      this.fitness = this.score + this.pipesPassed * 5;
    }
  }

  draw(ctx, image) {
    if (this.dead) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Rotasi visual berdasarkan kecepatan jatuh/naik
    const rotation = Math.max(Math.min(this.velocity * 0.03, 0.4), -0.4);
    ctx.rotate(rotation);

    if (image && image.complete) {
      ctx.drawImage(
        image,
        -this.radius,
        -this.radius,
        this.radius * 2,
        this.radius * 2
      );
    } else {
      // Fallback jika gambar gagal dimuat
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Menghitung Nilai Fitness Akhir untuk Seleksi Alam
  // Kombinasi dari durasi hidup (score) dan pencapaian (pipesPassed)
  calculateFitness() {
    if (this.fitness === 0) {
      this.fitness = this.score + this.pipesPassed * 5;
      // Bonus multiplier jika berhasil melewati pipa
      if (this.pipesPassed > 0) {
        this.fitness *= 1.2;
      }
    }
    return this.fitness;
  }

  // Reproduksi: Membuat instance burung baru dengan otak yang sama
  // Digunakan saat membuat generasi selanjutnya
  clone() {
    const clone = new Bird(this.brain);
    return clone;
  }
}
