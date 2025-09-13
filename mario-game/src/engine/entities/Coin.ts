import { Entity } from './Entity'

export class Coin extends Entity {
  private animationFrame = 0
  private animationTimer = 0
  private rotation = 0

  constructor(x: number, y: number) {
    super(x, y, 24, 24, 'coin')
    this.setPhysics({ solid: false, gravity: false })
  }

  public update(dt: number) {
    // Rotate animation
    this.rotation += dt * 5
    if (this.rotation > Math.PI * 2) {
      this.rotation -= Math.PI * 2
    }

    // Bobbing animation
    this.animationTimer += dt
    if (this.animationTimer > 0.1) {
      this.animationFrame = (this.animationFrame + 1) % 8
      this.animationTimer = 0
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save()

    // Center for rotation
    ctx.translate(this.position.x + this.width / 2, this.position.y + this.height / 2)

    // Apply rotation for spinning effect
    ctx.scale(Math.cos(this.rotation), 1)

    // Draw coin
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2)
    ctx.fill()

    // Draw inner circle
    ctx.fillStyle = '#FFA500'
    ctx.beginPath()
    ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2)
    ctx.fill()

    // Draw dollar sign
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', 0, 0)

    ctx.restore()
  }
}