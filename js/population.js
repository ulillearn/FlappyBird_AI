import { Bird } from "./bird.js";

export class Population {
  constructor(size = 50, mutationRate = 0.1) {
    this.size = size;
    this.mutationRate = mutationRate;
    this.birds = [];
    this.generation = 1;
    this.bestScore = 0;
    this.averageScore = 0;
    this.bestBird = null;

    this.onScoreUpdate = null;

    this.init();
  }

  init() {
    this.birds = [];
    for (let i = 0; i < this.size; i++) {
      const bird = new Bird();
      bird.y = 250 + Math.random() * 200;
      this.birds.push(bird);
    }
    this.bestBird = this.birds[0];
  }

  update(pipes) {
    let aliveCount = 0;
    let maxScore = 0;
    let bestBird = null;

    // PERBAIKAN: Track skor untuk generasi ini saja
    let generationBestScore = 0;
    let generationBestBird = null;

    for (const bird of this.birds) {
      if (!bird.dead) {
        bird.update(pipes);
        aliveCount++;

        // Track burung dengan skor tertinggi di generasi ini
        if (bird.score > generationBestScore) {
          generationBestScore = bird.score;
          generationBestBird = bird;
        }

        // Track burung dengan skor tertinggi sepanjang masa
        if (bird.score > maxScore) {
          maxScore = bird.score;
          bestBird = bird;
        }
      }
    }

    // Update best bird sepanjang masa
    if (bestBird && bestBird.score > this.bestScore) {
      this.bestScore = bestBird.score;
      this.bestBird = bestBird;
    }

    // PERBAIKAN: Kirim update skor generasi saat ini
    if (this.onScoreUpdate && generationBestBird) {
      this.onScoreUpdate(generationBestScore, generationBestBird.pipesPassed);
    }

    return aliveCount;
  }

  getAliveCount() {
    return this.birds.filter((bird) => !bird.dead).length;
  }

  nextGeneration() {
    console.log(
      `Generating new population for generation ${this.generation + 1}`
    );

    // Hitung fitness dan cari burung terbaik dari generasi SEKARANG
    let totalFitness = 0;
    let maxFitness = 0;
    let bestBird = this.birds[0];
    let bestScore = 0;
    let bestPipesPassed = 0;

    for (const bird of this.birds) {
      const fitness = bird.calculateFitness();
      totalFitness += fitness;

      if (fitness > maxFitness) {
        maxFitness = fitness;
        bestBird = bird;
        bestScore = bird.score;
        bestPipesPassed = bird.pipesPassed;
      }
    }

    this.averageScore = totalFitness / this.birds.length;

    // PERBAIKAN: Simpan hasil generasi SEBELUM increment
    const currentGeneration = this.generation;
    const generationResult = {
      generation: currentGeneration,
      bestScore: bestScore,
      averageScore: this.averageScore,
      pipesPassed: bestPipesPassed,
      bestBird: bestBird,
    };

    // Buat populasi baru untuk generasi berikutnya
    const newBirds = [];

    // Elitism: tambahkan burung terbaik TAPI dengan reset skor
    const eliteBird = new Bird(bestBird.brain);
    newBirds.push(eliteBird);

    // Generate offspring
    while (newBirds.length < this.size) {
      const parentA = this.tournamentSelection();
      const parentB = this.tournamentSelection();

      let childBrain;
      if (Math.random() < 0.7) {
        childBrain = parentA.brain.crossover(parentB.brain);
      } else {
        childBrain = parentA.brain.clone();
      }

      childBrain.mutate(this.mutationRate);
      newBirds.push(new Bird(childBrain));
    }

    // PERBAIKAN: Update populasi dan increment generasi SETELAH menyimpan hasil
    this.birds = newBirds;
    this.generation++;

    console.log(
      `Generation ${currentGeneration} completed. Best score: ${bestScore}`
    );

    return generationResult;
  }

  tournamentSelection(tournamentSize = 3) {
    let best = null;
    let bestFitness = -1;

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.birds.length);
      const contender = this.birds[randomIndex];
      const fitness = contender.calculateFitness();

      if (fitness > bestFitness) {
        bestFitness = fitness;
        best = contender;
      }
    }

    return best;
  }

  draw(ctx, image) {
    let drawn = 0;
    for (const bird of this.birds) {
      if (!bird.dead && drawn < 30) {
        bird.draw(ctx, image);
        drawn++;
      }
    }
  }
}
