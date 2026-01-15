import { Brain } from "./brain.js";

export class Bird {
  constructor(brain = null, x = 100) {
    this.x = x;
    this.y = 300;
    this.velocity = 0;
    this.gravity = 0.5;
    this.lift = -8;
    this.radius = 15;

    // AI Brain
    this.brain = brain ? brain.clone() : new Brain();

    // PERBAIKAN: Reset skor setiap burung baru
    this.score = 0;
    this.pipesPassed = 0;
    this.fitness = 0;
    this.dead = false;

    // Reset tracking pipa
    this.passedPipes = new Set();
  }

  update(pipes) {
    if (this.dead) return;

    // Physics
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Boundary check
    if (this.y < this.radius) {
      this.y = this.radius;
      this.velocity = 0;
    }

    if (this.y > 600 - this.radius) {
      this.die();
      return;
    }

    // Find active pipes
    const activePipes = pipes.filter(
      (pipe) => !this.passedPipes.has(pipe.id) && pipe.x + pipe.width > 0
    );

    // AI decision
    if (activePipes.length > 0) {
      const nearestPipe = activePipes.reduce((prev, current) =>
        prev.x < current.x ? prev : current
      );

      const inputs = [
        this.y / 600,
        (this.velocity + 10) / 20,
        Math.max(0, nearestPipe.x - this.x) / 400,
        nearestPipe.gapY / 600,
      ];

      if (this.brain.predict(inputs)) {
        this.jump();
      }
    }

    // Check collision
    for (const pipe of pipes) {
      if (this.checkCollision(pipe)) {
        this.die();
        return;
      }
    }

    // PERBAIKAN: Skoring dengan tracking yang benar - HAPUS BREAK
    for (const pipe of pipes) {
      // Hanya hitung pipa yang belum dilewati dan sudah berada di belakang burung
      if (
        !this.passedPipes.has(pipe.id) &&
        this.x > pipe.x + pipe.width &&
        pipe.x + pipe.width > -50
      ) {
        // Pastikan pipa masih dalam range
        this.passedPipes.add(pipe.id);
        this.pipesPassed++;
        this.score += 10; // 10 poin per pipa

        // Debug logging
        if (this.pipesPassed % 10 === 0) {
          console.log(
            `Bird passed ${this.pipesPassed} pipes, score: ${this.score}`
          );
        }
        // HAPUS BREAK DI SINI - biarkan loop lanjut untuk cek pipa lainnya
      }
    }
  }

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
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(5, -3, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FF8C00";
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(20, 0);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  calculateFitness() {
    if (this.fitness === 0) {
      this.fitness = this.score + this.pipesPassed * 5;
      if (this.pipesPassed > 0) {
        this.fitness *= 1.2;
      }
    }
    return this.fitness;
  }

  // PERBAIKAN: Clone hanya otak, reset semua statistik
  clone() {
    const clone = new Bird(this.brain);
    // Tidak menyalin skor, pipesPassed, atau passedPipes
    // Semua direset ke default oleh constructor
    return clone;
  }
}
