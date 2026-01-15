export class Brain {
  constructor(weights = null) {
    if (weights) {
      this.weights = {
        inputHidden: weights.inputHidden.map((row) => [...row]),
        hiddenOutput: [...weights.hiddenOutput],
      };
    } else {
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

  predict(inputs) {
    const hidden = [];
    for (let i = 0; i < 4; i++) {
      let sum = 0;
      for (let j = 0; j < 4; j++) {
        sum += inputs[j] * this.weights.inputHidden[j][i];
      }
      hidden.push(this.sigmoid(sum));
    }

    let output = 0;
    for (let i = 0; i < 4; i++) {
      output += hidden[i] * this.weights.hiddenOutput[i];
    }

    return this.sigmoid(output) > 0.5;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  crossover(otherBrain) {
    const childWeights = {
      inputHidden: [],
      hiddenOutput: [],
    };

    for (let i = 0; i < 4; i++) {
      childWeights.inputHidden[i] = [];
      for (let j = 0; j < 4; j++) {
        childWeights.inputHidden[i][j] =
          Math.random() < 0.5
            ? this.weights.inputHidden[i][j]
            : otherBrain.weights.inputHidden[i][j];
      }
    }

    for (let i = 0; i < 4; i++) {
      childWeights.hiddenOutput[i] =
        Math.random() < 0.5
          ? this.weights.hiddenOutput[i]
          : otherBrain.weights.hiddenOutput[i];
    }

    return new Brain(childWeights);
  }

  mutate(mutationRate) {
    const mutateWeight = (w) => {
      if (Math.random() < mutationRate) {
        return w + (Math.random() * 0.4 - 0.2);
      }
      return w;
    };

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.weights.inputHidden[i][j] = mutateWeight(
          this.weights.inputHidden[i][j]
        );
      }
    }

    for (let i = 0; i < 4; i++) {
      this.weights.hiddenOutput[i] = mutateWeight(this.weights.hiddenOutput[i]);
    }
  }

  clone() {
    return new Brain(this.weights);
  }
}
