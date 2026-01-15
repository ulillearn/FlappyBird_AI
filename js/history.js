export class History {
  constructor(tableId) {
    this.table = document.getElementById(tableId);
    this.history = [];
    this.bestScore = 0;
  }

  addRecord(data) {
    const isNewRecord = data.score > this.bestScore;
    if (isNewRecord) {
      this.bestScore = data.score;
    }

    const record = {
      generation: data.generation,
      score: data.score,
      pipes: data.pipes,
      isNewRecord: isNewRecord,
    };

    this.history.unshift(record);

    if (this.history.length > 20) {
      this.history.pop();
    }

    this.updateTable();
    return record;
  }

  updateTable() {
    const tbody =
      this.table.querySelector("tbody") || document.createElement("tbody");
    tbody.innerHTML = "";

    this.history.forEach((record) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                <td>${record.generation}</td>
                <td>${record.score}</td>
                <td>${record.pipes}</td>
                <td class="${record.isNewRecord ? "new-record" : ""}">
                    ${record.isNewRecord ? "✨ Rekor Baru!" : "-"}
                </td>
            `;

      tbody.appendChild(row);
    });

    if (!this.table.querySelector("tbody")) {
      this.table.appendChild(tbody);
    }
  }

  clear() {
    this.history = [];
    this.bestScore = 0;
    this.updateTable();
  }
}
