import { Bird } from "./bird.js";

export class Population {
  constructor(size = 50, mutationRate = 0.1) {
    this.size = size;
    this.mutationRate = mutationRate;
    this.birds = [];
    this.generation = 1;

    // Statistik Global
    this.bestScore = 0;
    this.averageScore = 0;
    this.bestBird = null;

    this.onScoreUpdate = null;

    this.init();
  }

  // Inisialisasi Generasi Pertama (Otak Random)
  init() {
    this.birds = [];
    for (let i = 0; i < this.size; i++) {
      const bird = new Bird();
      // Posisi awal sedikit diacak agar tidak menumpuk di satu titik
      bird.y = 250 + Math.random() * 200;
      this.birds.push(bird);
    }
    this.bestBird = this.birds[0];
  }

  // Update loop untuk setiap burung dalam populasi
  update(pipes) {
    let aliveCount = 0;
    let maxScore = 0;
    let bestBird = null;

    // Variabel lokal untuk melacak burung terbaik SAAT INI (masih hidup)
    let generationBestScore = 0;
    let generationBestBird = null;

    for (const bird of this.birds) {
      if (!bird.dead) {
        bird.update(pipes);
        aliveCount++;

        // Cari skor tertinggi di frame ini
        if (bird.score > generationBestScore) {
          generationBestScore = bird.score;
          generationBestBird = bird;
        }

        // Cek rekor global
        if (bird.score > maxScore) {
          maxScore = bird.score;
          bestBird = bird;
        }
      }
    }

    // Update global best record
    if (bestBird && bestBird.score > this.bestScore) {
      this.bestScore = bestBird.score;
      this.bestBird = bestBird;
    }

    // Kirim data ke UI (Main.js) untuk ditampilkan
    if (this.onScoreUpdate && generationBestBird) {
      this.onScoreUpdate(generationBestScore, generationBestBird.pipesPassed);
    }

    return aliveCount;
  }

  getAliveCount() {
    return this.birds.filter((bird) => !bird.dead).length;
  }

  // --- INTI ALGORITMA GENETIKA ---
  // Fungsi ini dipanggil saat semua burung mati untuk membuat generasi baru
  nextGeneration() {
    console.log(
      `Generating new population for generation ${this.generation + 1}`
    );

    // 1. Evaluasi Fitness (Seberapa baik kinerja burung?)
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

    // Simpan data statistik generasi yang baru selesai
    const currentGeneration = this.generation;
    const generationResult = {
      generation: currentGeneration,
      bestScore: bestScore,
      averageScore: this.averageScore,
      pipesPassed: bestPipesPassed,
      bestBird: bestBird,
    };

    // 2. Reproduksi & Seleksi Alam
    const newBirds = [];

    // Fitur: ELITISM
    // Menjaga 1 burung terbaik tanpa modifikasi agar gen unggul tidak hilang
    // (Skor di-reset, tapi otak tetap sama)
    const eliteBird = new Bird(bestBird.brain);
    newBirds.push(eliteBird);

    // Isi sisa populasi dengan anak hasil kawin silang
    while (newBirds.length < this.size) {
      // A. Selection: Pilih 2 orang tua menggunakan metode Tournament
      const parentA = this.tournamentSelection();
      const parentB = this.tournamentSelection();

      let childBrain;
      // B. Crossover: Gabungkan gen orang tua (peluang 70%)
      if (Math.random() < 0.7) {
        childBrain = parentA.brain.crossover(parentB.brain);
      } else {
        // Atau clone salah satu orang tua jika tidak terjadi crossover
        childBrain = parentA.brain.clone();
      }

      // C. Mutation: Acak sedikit gen untuk variasi (peluang sesuai mutationRate)
      childBrain.mutate(this.mutationRate);

      newBirds.push(new Bird(childBrain));
    }

    // Ganti populasi lama dengan yang baru
    this.birds = newBirds;
    this.generation++;

    console.log(
      `Generation ${currentGeneration} completed. Best score: ${bestScore}`
    );

    return generationResult;
  }

  // Metode Seleksi Turnamen
  // Mengambil beberapa sampel acak, lalu memilih yang terbaik diantaranya.
  // Ini lebih efisien daripada mengurutkan seluruh populasi.
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
    // Limit rendering: Hanya gambar maksimal 30 burung agar tidak lag
    let drawn = 0;
    for (const bird of this.birds) {
      if (!bird.dead && drawn < 30) {
        bird.draw(ctx, image);
        drawn++;
      }
    }
  }
}
