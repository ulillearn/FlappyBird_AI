export class Pipe {
  static nextId = 0;

  constructor(x = 400) {
    this.id = Pipe.nextId++;
    this.x = x;
    this.width = 60;
    this.gapHeight = 180;
    this.gapY = Math.random() * (450 - 250) + 100;
    this.speed = 2.5;
    this.scored = false;
    this.color = "#2ECC71";
  }

  update() {
    this.x -= this.speed;
  }

  isOffScreen() {
    return this.x < -this.width;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, 0, this.width, this.gapY);
    ctx.fillRect(this.x, this.gapY + this.gapHeight, this.width, 600);

    ctx.fillStyle = "#27AE60";
    ctx.fillRect(this.x - 5, this.gapY - 20, this.width + 10, 20);
    ctx.fillRect(this.x - 5, this.gapY + this.gapHeight, this.width + 10, 20);
  }
}
