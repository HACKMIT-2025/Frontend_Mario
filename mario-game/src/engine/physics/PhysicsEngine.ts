import { Entity } from '../entities/Entity'
import { Platform } from '../level/Platform'

export interface Vector2D {
  x: number
  y: number
}

export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

export class PhysicsEngine {
  private gravity: number
  private friction = 0.85
  private airResistance = 0.98
  private maxVelocity = { x: 15, y: 20 }

  constructor(gravity = 0.5) {
    this.gravity = gravity
  }

  public updateEntity(entity: Entity, _dt: number) {
    if (!entity.physics) return

    const vel = entity.velocity
    const pos = entity.position

    // Apply gravity if not grounded
    if (!entity.grounded && entity.physics.gravity) {
      vel.y += this.gravity
    }

    // Apply friction
    if (entity.grounded) {
      vel.x *= this.friction
    } else {
      vel.x *= this.airResistance
    }

    // Clamp velocity
    vel.x = Math.max(-this.maxVelocity.x, Math.min(this.maxVelocity.x, vel.x))
    vel.y = Math.max(-this.maxVelocity.y, Math.min(this.maxVelocity.y, vel.y))

    // Update position
    pos.x += vel.x
    pos.y += vel.y

    // Reset grounded state (will be set by collision detection)
    entity.grounded = false
  }

  public checkPlatformCollision(entity: Entity, platform: Platform): boolean {
    if (!entity.physics || !entity.physics.solid) return false

    const entityBox = this.getAABB(entity)
    const platformBox = this.getAABB(platform)

    if (this.isColliding(entityBox, platformBox)) {
      this.resolvePlatformCollision(entity, platform, entityBox, platformBox)
      return true
    }

    return false
  }

  public checkEntityCollision(entity1: Entity, entity2: Entity): boolean {
    if (!entity1.physics || !entity2.physics) return false

    const box1 = this.getAABB(entity1)
    const box2 = this.getAABB(entity2)

    return this.isColliding(box1, box2)
  }

  private isColliding(box1: AABB, box2: AABB): boolean {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y
  }

  private resolvePlatformCollision(entity: Entity, platform: Platform, entityBox: AABB, platformBox: AABB) {
    // Calculate overlap on each axis
    const overlapX = Math.min(
      entityBox.x + entityBox.width - platformBox.x,
      platformBox.x + platformBox.width - entityBox.x
    )
    const overlapY = Math.min(
      entityBox.y + entityBox.height - platformBox.y,
      platformBox.y + platformBox.height - entityBox.y
    )

    // One-way platforms (can jump through from below)
    if (platform.type === 'platform' && entity.velocity.y < 0) {
      return
    }

    // Resolve collision on the axis with smallest overlap
    if (overlapX < overlapY) {
      // Horizontal collision
      if (entityBox.x < platformBox.x) {
        // Entity is on the left
        entity.position.x = platformBox.x - entity.width
      } else {
        // Entity is on the right
        entity.position.x = platformBox.x + platformBox.width
      }
      entity.velocity.x = 0
    } else {
      // Vertical collision
      if (entityBox.y < platformBox.y) {
        // Entity is above (landing on platform)
        entity.position.y = platformBox.y - entity.height
        entity.grounded = true
        entity.velocity.y = 0
      } else {
        // Entity is below (hitting ceiling)
        entity.position.y = platformBox.y + platformBox.height
        entity.velocity.y = 0
      }
    }
  }

  private getAABB(obj: any): AABB {
    return {
      x: obj.position?.x || obj.x,
      y: obj.position?.y || obj.y,
      width: obj.width,
      height: obj.height
    }
  }

  // Advanced physics methods

  public applyForce(entity: Entity, force: Vector2D) {
    if (!entity.physics) return
    entity.velocity.x += force.x
    entity.velocity.y += force.y
  }

  public applyImpulse(entity: Entity, impulse: Vector2D) {
    if (!entity.physics) return
    const mass = entity.physics.mass || 1
    entity.velocity.x += impulse.x / mass
    entity.velocity.y += impulse.y / mass
  }

  public raycast(start: Vector2D, direction: Vector2D, maxDistance: number, platforms: Platform[]): any {
    // Simple raycast implementation for ground checks
    const end = {
      x: start.x + direction.x * maxDistance,
      y: start.y + direction.y * maxDistance
    }

    let closestHit = null
    let closestDistance = maxDistance

    platforms.forEach(platform => {
      const hit = this.raycastAABB(start, end, this.getAABB(platform))
      if (hit && hit.distance < closestDistance) {
        closestDistance = hit.distance
        closestHit = { ...hit, platform }
      }
    })

    return closestHit
  }

  private raycastAABB(start: Vector2D, end: Vector2D, box: AABB): any {
    const dx = end.x - start.x
    const dy = end.y - start.y

    let tMin = 0
    let tMax = 1

    // Check x axis
    if (Math.abs(dx) < 0.0001) {
      if (start.x < box.x || start.x > box.x + box.width) {
        return null
      }
    } else {
      const t1 = (box.x - start.x) / dx
      const t2 = (box.x + box.width - start.x) / dx

      tMin = Math.max(tMin, Math.min(t1, t2))
      tMax = Math.min(tMax, Math.max(t1, t2))

      if (tMin > tMax) return null
    }

    // Check y axis
    if (Math.abs(dy) < 0.0001) {
      if (start.y < box.y || start.y > box.y + box.height) {
        return null
      }
    } else {
      const t1 = (box.y - start.y) / dy
      const t2 = (box.y + box.height - start.y) / dy

      tMin = Math.max(tMin, Math.min(t1, t2))
      tMax = Math.min(tMax, Math.max(t1, t2))

      if (tMin > tMax) return null
    }

    return {
      point: {
        x: start.x + dx * tMin,
        y: start.y + dy * tMin
      },
      distance: Math.sqrt(dx * dx + dy * dy) * tMin,
      t: tMin
    }
  }

  // Getters and setters
  public setGravity(gravity: number) {
    this.gravity = gravity
  }

  public getGravity(): number {
    return this.gravity
  }

  public setFriction(friction: number) {
    this.friction = friction
  }

  public setMaxVelocity(x: number, y: number) {
    this.maxVelocity = { x, y }
  }
}