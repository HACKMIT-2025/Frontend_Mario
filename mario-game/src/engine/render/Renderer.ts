import { Entity } from '../entities/Entity'
import { Level } from '../level/Level'

export interface UIData {
  score: number
  lives: number
  coins: number
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private backgroundColor = '#5C94FC' // Mario sky blue
  private layers: Map<string, HTMLCanvasElement> = new Map()

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.initializeLayers()
  }

  private initializeLayers() {
    // Create off-screen canvases for different layers
    const layers = ['background', 'platforms', 'entities', 'effects', 'ui']
    layers.forEach(layer => {
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      this.layers.set(layer, canvas)
    })
  }

  public clear() {
    this.ctx.fillStyle = this.backgroundColor
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  public renderBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#5C94FC')
    gradient.addColorStop(1, '#87CEEB')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width * 3, this.height)

    // Draw clouds
    this.drawCloud(100, 100)
    this.drawCloud(300, 150)
    this.drawCloud(500, 80)
    this.drawCloud(700, 120)
    this.drawCloud(900, 160)
  }

  private drawCloud(x: number, y: number) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    // Draw cloud using circles
    this.ctx.beginPath()
    this.ctx.arc(x, y, 25, 0, Math.PI * 2)
    this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2)
    this.ctx.arc(x + 50, y, 25, 0, Math.PI * 2)
    this.ctx.arc(x + 25, y - 15, 25, 0, Math.PI * 2)
    this.ctx.fill()
  }

  public renderLevel(level: Level) {
    // Render platforms
    const platforms = level.getPlatforms()
    platforms.forEach(platform => {
      this.renderPlatform(platform)
    })
  }

  private renderPlatform(platform: any) {
    this.ctx.save()

    switch(platform.type) {
      case 'ground':
        // Draw ground with grass on top
        this.ctx.fillStyle = '#8B4513' // Brown
        this.ctx.fillRect(platform.x, platform.y + 10, platform.width, platform.height - 10)
        this.ctx.fillStyle = '#228B22' // Green grass
        this.ctx.fillRect(platform.x, platform.y, platform.width, 10)
        // Add grass details
        this.ctx.strokeStyle = '#2E7D32'
        for (let i = 0; i < platform.width; i += 10) {
          this.ctx.beginPath()
          this.ctx.moveTo(platform.x + i, platform.y + 10)
          this.ctx.lineTo(platform.x + i + 2, platform.y)
          this.ctx.lineTo(platform.x + i + 4, platform.y + 10)
          this.ctx.stroke()
        }
        break

      case 'brick':
        this.ctx.fillStyle = '#8B4513'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        // Draw brick pattern
        this.ctx.strokeStyle = '#654321'
        this.ctx.lineWidth = 2
        for (let y = 0; y < platform.height; y += 16) {
          for (let x = 0; x < platform.width; x += 32) {
            const offset = (y / 16) % 2 === 0 ? 0 : 16
            this.ctx.strokeRect(platform.x + x + offset, platform.y + y, 32, 16)
          }
        }
        break

      case 'question':
        // Question block
        this.ctx.fillStyle = '#FFA500'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        this.ctx.strokeStyle = '#FF8C00'
        this.ctx.lineWidth = 3
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
        // Draw question mark
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = 'bold 20px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText('?', platform.x + platform.width / 2, platform.y + platform.height / 2)
        break

      case 'pipe':
        // Draw pipe
        this.ctx.fillStyle = '#00AA00'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        // Pipe top
        this.ctx.fillStyle = '#00CC00'
        this.ctx.fillRect(platform.x - 8, platform.y, platform.width + 16, 32)
        // Pipe highlights
        this.ctx.strokeStyle = '#00FF00'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(platform.x + 5, platform.y + 32)
        this.ctx.lineTo(platform.x + 5, platform.y + platform.height)
        this.ctx.stroke()
        break

      case 'goal_pipe':
        // Draw goal pipe (victory pipe) in golden color
        this.ctx.fillStyle = '#FFD700'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        // Pipe top
        this.ctx.fillStyle = '#FFA500'
        this.ctx.fillRect(platform.x - 8, platform.y, platform.width + 16, 32)
        // Pipe highlights
        this.ctx.strokeStyle = '#FFFF00'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(platform.x + 5, platform.y + 32)
        this.ctx.lineTo(platform.x + 5, platform.y + platform.height)
        this.ctx.stroke()
        // Add sparkle effect
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = 'bold 16px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('★', platform.x + platform.width / 2, platform.y + 50)
        break

      case 'platform':
        // Floating platform
        this.ctx.fillStyle = '#8B7355'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        // Add some texture
        this.ctx.fillStyle = '#A0826D'
        this.ctx.fillRect(platform.x + 2, platform.y + 2, platform.width - 4, platform.height - 4)
        break

      case 'underground':
        this.ctx.fillStyle = '#2F4F4F'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        break

      case 'castle':
        this.ctx.fillStyle = '#696969'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        // Castle brick pattern
        this.ctx.strokeStyle = '#4A4A4A'
        this.ctx.lineWidth = 1
        for (let y = 0; y < platform.height; y += 20) {
          for (let x = 0; x < platform.width; x += 40) {
            const offset = (y / 20) % 2 === 0 ? 0 : 20
            this.ctx.strokeRect(platform.x + x + offset, platform.y + y, 40, 20)
          }
        }
        break

      case 'bridge':
        // Castle bridge
        this.ctx.fillStyle = '#8B4513'
        for (let i = 0; i < platform.width; i += 20) {
          this.ctx.fillRect(platform.x + i, platform.y, 15, platform.height)
        }
        break

      default:
        // Default platform
        this.ctx.fillStyle = '#808080'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    }

    this.ctx.restore()
  }

  public renderEntity(entity: Entity) {
    entity.render(this.ctx)
  }

  public renderUI(data: UIData) {
    // Update DOM elements instead of drawing on canvas
    const scoreElement = document.getElementById('score')
    const livesElement = document.getElementById('lives')
    const coinsElement = document.getElementById('coins')

    if (scoreElement) scoreElement.textContent = data.score.toString()
    if (livesElement) livesElement.textContent = data.lives.toString()
    if (coinsElement) coinsElement.textContent = data.coins.toString()
  }

  public renderParticle(x: number, y: number, type: string) {
    this.ctx.save()

    switch(type) {
      case 'coin':
        this.ctx.fillStyle = '#FFD700'
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const vx = Math.cos(angle) * 3
          const vy = Math.sin(angle) * 3
          this.ctx.fillRect(x + vx * 10, y + vy * 10, 4, 4)
        }
        break

      case 'brick':
        this.ctx.fillStyle = '#8B4513'
        for (let i = 0; i < 4; i++) {
          this.ctx.fillRect(
            x + Math.random() * 20 - 10,
            y + Math.random() * 20 - 10,
            8, 8
          )
        }
        break

      case 'star':
        this.ctx.fillStyle = '#FFD700'
        this.ctx.globalAlpha = 0.7
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2
          this.ctx.beginPath()
          this.ctx.arc(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20, 3, 0, Math.PI * 2)
          this.ctx.fill()
        }
        break
    }

    this.ctx.restore()
  }

  public setBackgroundColor(color: string) {
    this.backgroundColor = color
  }
}