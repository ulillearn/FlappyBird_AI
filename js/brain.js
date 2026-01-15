export class Brain {
  constructor(weights = null) {
    if (weights) {
      // Salin bobot dari parent (Deep Copy) agar tidak mereferensi objek yang sama
      this.weights = {
        inputHidden: weights.inputHidden.map((row) => [...row]),
        hiddenOutput: [...weights.hiddenOutput],
      };
    } else {
      // Inisialisasi Random: 4 Input -> 4 Hidden -> 1 Output
      // Rentang nilai bobot awal: -1 s.d 1
      this.weights = {
        inputHidden: Array(4)
          .fill()
          .map(() =>
            Array(4)
              .fill()
              .map(() => Math.random() * 2 - 1)
          ),
        hiddenOutput: Array(4)
          .fill()
          .map(() => Math.random() * 2 - 1),
      };
    }
  }

  // Feedforward: Proses kalkulasi dari Input ke Output
  predict(inputs) {
    // 1. Hitung Layer Tersembunyi (Hidden Layer)
    const hidden = [];
    for (let i = 0; i < 4; i++) {
      let sum = 0;
      // Weighted Sum: Input * Bobot
      for (let j = 0; j < 4; j++) {
        sum += inputs[j] * this.weights.inputHidden[j][i];
      }
      hidden.push(this.sigmoid(sum)); // Aktivasi
    }

    // 2. Hitung Output Layer
    let output = 0;
    for (let i = 0; i < 4; i++) {
      output += hidden[i] * this.weights.hiddenOutput[i];
    }

    // Keputusan: True jika nilai > 0.5 (Lompat)
    return this.sigmoid(output) > 0.5;
  }

  // Fungsi Aktivasi Sigmoid (Non-linearitas)
  // Mengubah nilai input menjadi rentang 0 s.d 1
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  // Genetika: Crossover (Kawin Silang)
  // Mencampurkan gen (bobot) dari dua parent secara acak (50:50)
  crossover(otherBrain) {
    const childWeights = {
      inputHidden: [],
      hiddenOutput: [],
    };

    // Crossover bobot Input->Hidden
    for (let i = 0; i < 4; i++) {
      childWeights.inputHidden[i] = [];
      for (let j = 0; j < 4; j++) {
        // Pilih gen dari bapak atau ibu secara acak
        childWeights.inputHidden[i][j] =
          Math.random() < 0.5
            ? this.weights.inputHidden[i][j]
            : otherBrain.weights.inputHidden[i][j];
      }
    }

    // Crossover bobot Hidden->Output
    for (let i = 0; i < 4; i++) {
      childWeights.hiddenOutput[i] =
        Math.random() < 0.5
          ? this.weights.hiddenOutput[i]
          : otherBrain.weights.hiddenOutput[i];
    }

    return new Brain(childWeights);
  }

  // Genetika: Mutasi
  // Memberikan sedikit perubahan acak pada bobot untuk variasi genetik (Evolusi)
  mutate(mutationRate) {
    const mutateWeight = (w) => {
      // Jika terkena mutasi, ubah bobot sedikit (-0.2 s.d 0.2)
      if (Math.random() < mutationRate) {
        return w + (Math.random() * 0.4 - 0.2);
      }
      return w;
    };

    // Mutasi Input->Hidden
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.weights.inputHidden[i][j] = mutateWeight(
          this.weights.inputHidden[i][j]
        );
      }
    }

    // Mutasi Hidden->Output
    for (let i = 0; i < 4; i++) {
      this.weights.hiddenOutput[i] = mutateWeight(this.weights.hiddenOutput[i]);
    }
  }

  // Utilitas: Duplikasi Otak
  clone() {
    return new Brain(this.weights);
  }
}
