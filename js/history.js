export class History {
  constructor(tableId) {
    this.table = document.getElementById(tableId);
    this.history = []; // Menyimpan list riwayat generasi
    this.bestScore = 0; // Melacak skor tertinggi global untuk highlight
  }

  // Menambahkan data generasi baru ke dalam list
  addRecord(data) {
    // Cek apakah skor kali ini memecahkan rekor sebelumnya
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

    // Tambahkan ke awal array (Unshift) agar muncul paling atas di tabel
    this.history.unshift(record);

    // Limitasi Memori: Hanya simpan 20 riwayat terakhir
    if (this.history.length > 20) {
      this.history.pop();
    }

    this.updateTable();
    return record;
  }

  // Render ulang tabel HTML berdasarkan data terbaru
  updateTable() {
    const tbody =
      this.table.querySelector("tbody") || document.createElement("tbody");
    tbody.innerHTML = "";

    this.history.forEach((record) => {
      const row = document.createElement("tr");

      // Menandai baris jika merupakan rekor baru (styling CSS)
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

  // Bersihkan data saat tombol Reset ditekan
  clear() {
    this.history = [];
    this.bestScore = 0;
    this.updateTable();
  }
}
