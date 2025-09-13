import { Entity } from './Entity'

export type PlayerSize = 'small' | 'big'
export type PlayerState = 'idle' | 'running' | 'jumping' | 'falling'

export class Player extends Entity {
  public size: PlayerSize = 'small'
  public state: PlayerState = 'idle'
  public invulnerable = false
  public fireballEnabled = false

  private invulnerableTime = 0
  private animationFrame = 0
  private animationTimer = 0
  private facing: 'left' | 'right' = 'right'

  private jumpPower = 12
  private moveSpeed = 5
  private runSpeed = 8
  private isRunning = false

  constructor(x: number, y: number) {
    super(x, y, 32, 32, 'player')
    this.setPhysics({ solid: true, gravity: true, mass: 1 })
  }

  public update(dt: number) {
    // Update state based on velocity
    if (this.velocity.y < -0.5) {
      this.state = 'jumping'
    } else if (this.velocity.y > 0.5) {
      this.state = 'falling'
    } else if (Math.abs(this.velocity.x) > 0.5) {
      this.state = 'running'
    } else {
      this.state = 'idle'
    }

    // Update animation
    this.animationTimer += dt
    if (this.animationTimer > 0.1) {
      this.animationFrame = (this.animationFrame + 1) % 8
      this.animationTimer = 0
    }

    // Update invulnerability
    if (this.invulnerable && this.invulnerableTime > 0) {
      this.invulnerableTime -= dt * 1000
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false
      }
    }

    // Update facing direction
    if (this.velocity.x > 0) this.facing = 'right'
    else if (this.velocity.x < 0) this.facing = 'left'
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save()

    // Flash when invulnerable
    if (this.invulnerable && Math.floor(this.invulnerableTime / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    // Draw player (placeholder rectangle, will be replaced with sprites)
    ctx.fillStyle = this.size === 'big' ? '#FF0000' : '#FF6B6B'

    if (this.fireballEnabled) {
      ctx.fillStyle = '#FFA500' // Orange when fire power
    }

    const height = this.size === 'big' ? 64 : 32

    ctx.fillRect(this.position.x, this.position.y, this.width, height)

    // Draw eyes to show direction
    ctx.fillStyle = '#FFFFFF'
    const eyeOffset = this.facing === 'right' ? 20 : 5
    ctx.fillRect(this.position.x + eyeOffset, this.position.y + 8, 4, 4)
    ctx.fillRect(this.position.x + eyeOffset, this.position.y + 16, 4, 4)

    ctx.restore()
  }

  public handleInput(input: any) {
    const speed = this.isRunning ? this.runSpeed : this.moveSpeed

    // Horizontal movement
    if (input.left) {
      this.velocity.x = -speed
    } else if (input.right) {
      this.velocity.x = speed
    }

    // Jump
    if (input.jump && this.grounded) {
      this.velocity.y = -this.jumpPower
    }

    // Variable jump height
    if (!input.jump && this.velocity.y < -6) {
      this.velocity.y = -6
    }

    // Run
    this.isRunning = input.run

    // Fireball
    if (input.action && this.fireballEnabled) {
      this.throwFireball()
    }
  }

  public grow() {
    if (this.size === 'small') {
      this.size = 'big'
      this.height = 64
      // Adjust position so Mario's feet stay at the same level
      this.position.y -= 32
    }
  }

  public shrink() {
    if (this.size === 'big') {
      this.size = 'small'
      this.height = 32
      // Adjust position so Mario's feet stay at the same level
      this.position.y += 32
      this.makeInvulnerable(1500)
    }
  }

  public makeInvulnerable(duration: number) {
    this.invulnerable = true
    this.invulnerableTime = duration
  }

  public enableFireball() {
    this.fireballEnabled = true
    if (this.size === 'small') {
      this.grow()
    }
  }

  private throwFireball() {
    // TODO: Implement fireball throwing
    console.log('Fireball!')
  }

  public reset() {
    this.size = 'small'
    this.state = 'idle'
    this.invulnerable = false
    this.fireballEnabled = false
    this.velocity = { x: 0, y: 0 }
  }
}