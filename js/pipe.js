export class Pipe {
  // ID Statik untuk pelacakan unik (mencegah double scoring pada pipa yang sama)
  static nextId = 0;

  constructor(x = 400) {
    this.id = Pipe.nextId++;
    this.x = x;
    this.width = 60;
    this.gapHeight = 180; // Tinggi celah aman untuk burung lewat

    // Randomisasi posisi vertikal celah
    // Menghasilkan celah di posisi Y antara 100 s.d 300
    this.gapY = Math.random() * (450 - 250) + 100;

    this.speed = 2.5; // Kecepatan gerak pipa ke kiri (harus sinkron dengan scroll speed game)
    this.scored = false;
    this.color = "#2ECC71";
  }

  // Menggeser pipa ke kiri setiap frame
  update() {
    this.x -= this.speed;
  }

  // Cek apakah pipa sudah keluar sepenuhnya dari layar kiri (untuk dihapus dari array)
  isOffScreen() {
    return this.x < -this.width;
  }

  // Fungsi render dasar
  // Catatan: Visualisasi utama yang lebih bagus (gradient) ditangani oleh game.js
  draw(ctx) {
    ctx.fillStyle = this.color;

    // Gambar Pipa Atas
    ctx.fillRect(this.x, 0, this.width, this.gapY);

    // Gambar Pipa Bawah
    ctx.fillRect(this.x, this.gapY + this.gapHeight, this.width, 600);

    // Gambar Kepala Pipa (Caps)
    ctx.fillStyle = "#27AE60";
    ctx.fillRect(this.x - 5, this.gapY - 20, this.width + 10, 20);
    ctx.fillRect(this.x - 5, this.gapY + this.gapHeight, this.width + 10, 20);
  }
}
