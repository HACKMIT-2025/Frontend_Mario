import { Entity } from './Entity'

export class Enemy extends Entity {
  public enemyType: string
  private direction: number = 1
  private speed: number = 2
  private animationFrame = 0
  private animationTimer = 0

  constructor(x: number, y: number, type: string, size = 32) {
    // Default size based on type, but allow custom size for spikes
    const defaultSize = type === 'bowser' ? 64 : 32
    const finalSize = type === 'spike' ? size : defaultSize
    super(x, y, finalSize, finalSize, 'enemy')
    this.enemyType = type
    this.setPhysics({ solid: true, gravity: true, mass: 1 })

    // Set speed based on enemy type
    switch(type) {
      case 'goomba':
        this.speed = 1
        break
      case 'koopa':
        this.speed = 1.5
        break
      case 'firebar':
        this.speed = 0
        this.setPhysics({ solid: false, gravity: false })
        break
      case 'bowser':
        this.speed = 0.5
        break
      case 'spike':
        this.speed = 0  // Static hazard
        this.setPhysics({ solid: false, gravity: false })
        break
    }
  }

  public update(dt: number) {
    // Simple patrol AI
    if (this.enemyType !== 'firebar' && this.enemyType !== 'spike') {
      this.velocity.x = this.speed * this.direction
    } else if (this.enemyType === 'firebar') {
      // Firebar rotation
      this.animationFrame += dt * 5
    }
    // Spikes don't move or animate

    // Animation
    if (this.enemyType !== 'spike') {
      this.animationTimer += dt
      if (this.animationTimer > 0.2) {
        this.animationFrame = (this.animationFrame + 1) % 4
        this.animationTimer = 0
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save()

    switch(this.enemyType) {
      case 'goomba':
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
        // Draw mushroom cap
        ctx.fillStyle = '#654321'
        ctx.fillRect(this.position.x - 4, this.position.y, this.width + 8, this.height / 2)
        break

      case 'koopa':
        ctx.fillStyle = '#00FF00'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
        // Draw shell pattern
        ctx.strokeStyle = '#008800'
        ctx.lineWidth = 2
        ctx.strokeRect(this.position.x + 4, this.position.y + 4, this.width - 8, this.height - 8)
        break

      case 'firebar':
        // Draw rotating fire bar
        ctx.translate(this.position.x + this.width/2, this.position.y + this.height/2)
        ctx.rotate(this.animationFrame)
        ctx.fillStyle = '#FF4500'
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(i * 20, -4, 16, 8)
        }
        break

      case 'bowser':
        ctx.fillStyle = '#FF0000'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
        // Draw spikes
        ctx.fillStyle = '#FFFF00'
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(this.position.x + i * 16, this.position.y - 8, 8, 8)
        }
        break

      case 'spike':
        // Draw triangular metallic gray spike

        // Main spike body - equilateral triangle
        ctx.fillStyle = '#808080'  // Metallic gray base
        ctx.beginPath()
        ctx.moveTo(this.position.x + this.width/2, this.position.y)  // Top point
        ctx.lineTo(this.position.x, this.position.y + this.height)   // Bottom left
        ctx.lineTo(this.position.x + this.width, this.position.y + this.height)  // Bottom right
        ctx.closePath()
        ctx.fill()

        // Metallic highlight on left side
        ctx.fillStyle = '#A0A0A0'  // Lighter gray for highlight
        ctx.beginPath()
        ctx.moveTo(this.position.x + this.width/2, this.position.y)
        ctx.lineTo(this.position.x + this.width/4, this.position.y + this.height/2)
        ctx.lineTo(this.position.x + this.width/2, this.position.y + this.height)
        ctx.closePath()
        ctx.fill()

        // Darker shadow on right side
        ctx.fillStyle = '#606060'  // Darker gray for shadow
        ctx.beginPath()
        ctx.moveTo(this.position.x + this.width/2, this.position.y)
        ctx.lineTo(this.position.x + this.width*3/4, this.position.y + this.height/2)
        ctx.lineTo(this.position.x + this.width/2, this.position.y + this.height)
        ctx.closePath()
        ctx.fill()

        // Bottom edge highlight
        ctx.strokeStyle = '#C0C0C0'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(this.position.x, this.position.y + this.height)
        ctx.lineTo(this.position.x + this.width, this.position.y + this.height)
        ctx.stroke()
        break

      default:
        ctx.fillStyle = '#FF00FF'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    ctx.restore()
  }

  public turnAround() {
    this.direction *= -1
  }
}