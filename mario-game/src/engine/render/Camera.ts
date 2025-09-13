import { Entity } from '../entities/Entity'

export class Camera {
  public x: number = 0
  public y: number = 0
  private width: number
  private height: number
  private bounds: { minX: number; maxX: number; minY: number; maxY: number } | null = null

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  public follow(_entity: Entity, _offsetX = -this.width/2, _offsetY = -this.height/2 + 100) {
    // Camera follow disabled to prevent drift
    // Implementation kept but not actively following
    // Uncomment below to re-enable camera following:
    /*
    const targetX = entity.position.x + offsetX
    const targetY = entity.position.y + offsetY
    this.x += (targetX - this.x) * this.smoothing
    this.y += (targetY - this.y) * this.smoothing
    */

    // Apply bounds if set
    if (this.bounds) {
      this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX - this.width, this.x))
      this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY - this.height, this.y))
    }

    // Prevent camera from going negative
    this.x = Math.max(0, this.x)
    this.y = Math.min(this.y, 0)
  }

  public setBounds(minX: number, maxX: number, minY: number, maxY: number) {
    this.bounds = { minX, maxX, minY, maxY }
  }

  public removeBounds() {
    this.bounds = null
  }

  public setPosition(x: number, y: number) {
    this.x = x
    this.y = y
  }

  public move(dx: number, dy: number) {
    this.x += dx
    this.y += dy
  }

  public getViewport() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    }
  }

  public isInView(x: number, y: number, width: number, height: number): boolean {
    const viewport = this.getViewport()
    return !(x + width < viewport.left ||
             x > viewport.right ||
             y + height < viewport.top ||
             y > viewport.bottom)
  }

  public reset() {
    this.x = 0
    this.y = 0
  }

  public shake(intensity = 5, duration = 500) {
    const startTime = Date.now()
    const originalX = this.x
    const originalY = this.y

    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      if (elapsed > duration) {
        clearInterval(shakeInterval)
        this.x = originalX
        this.y = originalY
        return
      }

      const decay = 1 - (elapsed / duration)
      this.x = originalX + (Math.random() - 0.5) * intensity * decay
      this.y = originalY + (Math.random() - 0.5) * intensity * decay
    }, 16)
  }
}