import { Platform } from './Platform'
import { Enemy } from '../entities/Enemy'
import { Coin } from '../entities/Coin'
import { PowerUp } from '../entities/PowerUp'
import { Entity } from '../entities/Entity'

export class Level {
  private platforms: Platform[] = []
  private entities: Entity[] = []
  private levelWidth = 3000
  private levelHeight = 600
  private background = 'sky'

  public addPlatform(x: number, y: number, width: number, height: number, type = 'normal'): Platform {
    const platform = new Platform(x, y, width, height, type)
    this.platforms.push(platform)
    return platform
  }

  public addEnemy(x: number, y: number, type: string): Enemy {
    const enemy = new Enemy(x, y, type)
    this.entities.push(enemy)
    return enemy
  }

  public addCoin(x: number, y: number): Coin {
    const coin = new Coin(x, y)
    this.entities.push(coin)
    return coin
  }

  public addPowerUp(x: number, y: number, type: string): PowerUp {
    const powerUp = new PowerUp(x, y, type)
    this.entities.push(powerUp)
    return powerUp
  }

  public getPlatforms(): Platform[] {
    return this.platforms
  }

  public getEntities(): Entity[] {
    return this.entities
  }

  public getWidth(): number {
    return this.levelWidth
  }

  public getHeight(): number {
    return this.levelHeight
  }

  public setDimensions(width: number, height: number) {
    this.levelWidth = width
    this.levelHeight = height
  }

  public setBackground(background: string) {
    this.background = background
  }

  public getBackground(): string {
    return this.background
  }

  public clear() {
    this.platforms = []
    this.entities = []
  }

  public removePlatform(platform: Platform) {
    const index = this.platforms.indexOf(platform)
    if (index > -1) {
      this.platforms.splice(index, 1)
    }
  }

  public removeEntity(entity: Entity) {
    const index = this.entities.indexOf(entity)
    if (index > -1) {
      this.entities.splice(index, 1)
    }
  }

  public getPlatformAt(x: number, y: number): Platform | null {
    for (const platform of this.platforms) {
      if (x >= platform.x && x <= platform.x + platform.width &&
          y >= platform.y && y <= platform.y + platform.height) {
        return platform
      }
    }
    return null
  }

  public getEntityAt(x: number, y: number): Entity | null {
    for (const entity of this.entities) {
      const bounds = entity.getBounds()
      if (x >= bounds.left && x <= bounds.right &&
          y >= bounds.top && y <= bounds.bottom) {
        return entity
      }
    }
    return null
  }
}