import { Entity } from '../entities/Entity'
import { Platform } from '../level/Platform'
import { Polygon } from '../level/Polygon'

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
  private friction = 0.88 // Slightly higher friction for better control on irregular surfaces
  private airResistance = 0.99 // Less air resistance for smoother movement
  private maxVelocity = { x: 15, y: 20 }

  // Enhanced parameters for irregular shape handling
  // @ts-ignore - Reserved for future collision tolerance features
  private readonly polygonCollisionTolerance = 0.5 // Tolerance for polygon collision detection
  // @ts-ignore - Reserved for future separation buffer features
  private readonly separationBuffer = 0.1 // Buffer distance to prevent sticking
  // @ts-ignore - Reserved for future iteration limiting features
  private readonly maxCollisionIterations = 3 // Max iterations to resolve complex collisions

  constructor(gravity = 0.5) {
    this.gravity = gravity
  }

  public updateEntity(entity: Entity, dt: number, platforms: Platform[] = [], polygons: Polygon[] = []) {
    if (!entity.physics) return

    const vel = entity.velocity
    const pos = entity.position

    // Store previous position for collision detection
    if (!entity.previousPosition) {
      entity.previousPosition = { x: pos.x, y: pos.y }
    } else {
      entity.previousPosition.x = pos.x
      entity.previousPosition.y = pos.y
    }

    // Apply gravity if not grounded
    if (!entity.grounded && entity.physics.gravity) {
      vel.y += this.gravity * dt
    }

    // Apply friction with dt scaling for consistent physics
    if (entity.grounded) {
      vel.x *= Math.pow(this.friction, dt)
    } else {
      vel.x *= Math.pow(this.airResistance, dt)
    }

    // Clamp velocity
    vel.x = Math.max(-this.maxVelocity.x, Math.min(this.maxVelocity.x, vel.x))
    vel.y = Math.max(-this.maxVelocity.y, Math.min(this.maxVelocity.y, vel.y))

    // Enhanced velocity smoothing for irregular shapes
    const velocityThreshold = 0.05 // Smaller threshold for more precision
    if (Math.abs(vel.x) < velocityThreshold) {
      vel.x *= 0.95 // Less aggressive damping
    }
    if (Math.abs(vel.y) < velocityThreshold && entity.grounded) {
      vel.y = 0
    }

    // STEP 1: Handle platform collisions first (simple AABB shapes)
    const movement = { x: vel.x * dt, y: vel.y * dt }
    const sweptResult = this.sweptAABB(entity, movement, platforms)
    let remainingMovement = { ...movement }

    if (sweptResult.hit && sweptResult.time < 1.0) {
      // Move to collision point
      pos.x += movement.x * sweptResult.time
      pos.y += movement.y * sweptResult.time

      // Calculate remaining movement after collision
      remainingMovement.x = movement.x * (1 - sweptResult.time)
      remainingMovement.y = movement.y * (1 - sweptResult.time)

      // Resolve collision
      if (Math.abs(sweptResult.normal.x) > 0.5) {
        vel.x = 0
        remainingMovement.x = 0
        if (sweptResult.normal.x < 0) {
          entity.wallCollision.right = true
        } else {
          entity.wallCollision.left = true
        }
      }

      if (Math.abs(sweptResult.normal.y) > 0.5) {
        if (sweptResult.normal.y < 0) {
          entity.grounded = true
          vel.y = 0
          remainingMovement.y = 0
        } else {
          entity.ceilingCollision = true
          vel.y = 0
          remainingMovement.y = 0
        }
      }

      // Small separation to prevent sticking
      pos.x += sweptResult.normal.x * 0.01
    } else {
      // No platform collision - apply full movement
      pos.x += movement.x
      pos.y += movement.y
      remainingMovement = { x: 0, y: 0 }

      // Reset collision states
      entity.grounded = false
      entity.wallCollision.left = false
      entity.wallCollision.right = false
      entity.ceilingCollision = false
    }

    // STEP 2: Enhanced polygon collision handling for irregular hand-drawn shapes
    if (polygons.length > 0) {
      this.handlePolygonCollisions(entity, polygons, remainingMovement, dt)
    }
  }

  public checkPlatformCollision(entity: Entity, platform: Platform): boolean {
    if (!entity.physics || !entity.physics.solid) return false

    // First check current position collision
    const entityBox = this.getAABB(entity)
    const platformBox = this.getAABB(platform)

    if (this.isColliding(entityBox, platformBox)) {
      this.resolvePlatformCollision(entity, platform, entityBox, platformBox)
      return true
    }

    // For fast-moving entities or when near platforms, use continuous collision detection
    // Lower threshold to catch small movements that might bypass collision detection
    if (Math.abs(entity.velocity.x) > 0.5 || Math.abs(entity.velocity.y) > 0.5) {
      if (this.checkContinuousCollision(entity, platform)) {
        return true
      }
    }

    return false
  }

  public checkPolygonCollision(entity: Entity, polygon: Polygon): boolean {
    if (!entity.physics || !entity.physics.solid) return false

    const entityBox = this.getAABB(entity)
    const polygonBounds = polygon.getBounds()

    // Convert polygon bounds to AABB format
    const polygonAABB = {
      x: polygonBounds.left,
      y: polygonBounds.top,
      width: polygonBounds.right - polygonBounds.left,
      height: polygonBounds.bottom - polygonBounds.top
    }

    // Quick AABB check first
    if (!this.isColliding(entityBox, polygonAABB)) {
      return false
    }

    // More precise collision check
    if (this.polygonIntersectsAABB(polygon, entityBox)) {
      this.resolvePolygonCollision(entity, polygon, entityBox)
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

    // Store entity's previous position to determine collision direction
    const prevX = entity.position.x - entity.velocity.x
    const prevY = entity.position.y - entity.velocity.y

    // Determine collision direction based on entity's movement and position
    const comingFromLeft = prevX + entity.width <= platformBox.x
    const comingFromRight = prevX >= platformBox.x + platformBox.width
    const comingFromTop = prevY + entity.height <= platformBox.y
    const comingFromBottom = prevY >= platformBox.y + platformBox.height

    // For ground/solid platforms, we need to handle both horizontal and vertical collisions properly
    if (platform.type === 'ground') {
      // Check if this is primarily a horizontal or vertical collision based on movement direction
      const horizontalCollision = (comingFromLeft || comingFromRight) && Math.abs(entity.velocity.x) > 0.1
      const verticalCollision = (comingFromTop || comingFromBottom) && Math.abs(entity.velocity.y) > 0.1

      // Handle horizontal collision (walls)
      if (horizontalCollision) {
        if (comingFromLeft) {
          entity.position.x = platformBox.x - entity.width - 0.01 // Smaller buffer
          entity.wallCollision.right = true
          // Always stop horizontal movement on wall collision
          entity.velocity.x = 0
        } else if (comingFromRight) {
          entity.position.x = platformBox.x + platformBox.width + 0.01 // Smaller buffer
          entity.wallCollision.left = true
          // Always stop horizontal movement on wall collision
          entity.velocity.x = 0
        }
      }

      // Handle vertical collision (floor/ceiling)
      if (verticalCollision) {
        if (comingFromTop) {
          entity.position.y = platformBox.y - entity.height
          entity.grounded = true
          // For floor collisions, always stop vertical movement (landing)
          entity.velocity.y = 0
        } else if (comingFromBottom) {
          entity.position.y = platformBox.y + platformBox.height
          entity.ceilingCollision = true
          // Always stop vertical movement on ceiling collision
          entity.velocity.y = 0
        }
      }

      // If neither horizontal nor vertical collision is clear, use the old method as fallback
      if (!horizontalCollision && !verticalCollision) {
        if (overlapX < overlapY) {
          // Horizontal collision
          if (entityBox.x < platformBox.x) {
            entity.position.x = platformBox.x - entity.width - 0.01 // Smaller buffer
            entity.wallCollision.right = true
            // Always stop horizontal movement
            entity.velocity.x = 0
          } else {
            entity.position.x = platformBox.x + platformBox.width + 0.01 // Smaller buffer
            entity.wallCollision.left = true
            // Always stop horizontal movement
            entity.velocity.x = 0
          }
        } else {
          // Vertical collision
          if (entityBox.y < platformBox.y) {
            entity.position.y = platformBox.y - entity.height
            entity.grounded = true
            entity.velocity.y = 0
          } else {
            entity.position.y = platformBox.y + platformBox.height
            entity.ceilingCollision = true
            // Always stop vertical movement on ceiling collision
            entity.velocity.y = 0
          }
        }
      }
    } else {
      // For regular platforms
      if (overlapX < overlapY) {
        // Horizontal collision
        if (entityBox.x < platformBox.x) {
          entity.position.x = platformBox.x - entity.width - 0.01 // Smaller buffer
          // Always stop horizontal movement
          entity.velocity.x = 0
        } else {
          entity.position.x = platformBox.x + platformBox.width + 0.01 // Smaller buffer
          // Always stop horizontal movement
          entity.velocity.x = 0
        }
      } else {
        // Vertical collision
        if (entityBox.y < platformBox.y) {
          entity.position.y = platformBox.y - entity.height
          entity.grounded = true
          entity.velocity.y = 0
        } else {
          entity.position.y = platformBox.y + platformBox.height
          // Always stop vertical movement
          entity.velocity.y = 0
        }
      }
    }
  }

  private getAABB(obj: any): AABB {
    // Validate object has required properties
    if (!obj) {
      console.warn('getAABB called with null/undefined object')
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    const x = obj.position?.x ?? obj.x ?? 0
    const y = obj.position?.y ?? obj.y ?? 0
    const width = obj.width ?? 0
    const height = obj.height ?? 0
    
    // Ensure finite values
    return {
      x: isFinite(x) ? x : 0,
      y: isFinite(y) ? y : 0,
      width: isFinite(width) && width > 0 ? width : 0,
      height: isFinite(height) && height > 0 ? height : 0
    }
  }

  private polygonIntersectsAABB(polygon: Polygon, box: AABB): boolean {
    // Check if any point of the polygon is inside the AABB
    for (const point of polygon.contours) {
      const x = point[0]
      const y = point[1]
      if (x >= box.x && x <= box.x + box.width &&
          y >= box.y && y <= box.y + box.height) {
        return true
      }
    }

    // Check if any point of the AABB is inside the polygon
    const corners = [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x + box.width, box.y + box.height],
      [box.x, box.y + box.height]
    ]

    for (const corner of corners) {
      if (polygon.contains(corner[0], corner[1])) {
        return true
      }
    }

    // Check if any polygon edge intersects any AABB edge
    const polygonSegments = polygon.getSegments()
    const boxSegments = [
      { x1: box.x, y1: box.y, x2: box.x + box.width, y2: box.y },
      { x1: box.x + box.width, y1: box.y, x2: box.x + box.width, y2: box.y + box.height },
      { x1: box.x + box.width, y1: box.y + box.height, x2: box.x, y2: box.y + box.height },
      { x1: box.x, y1: box.y + box.height, x2: box.x, y2: box.y }
    ]

    for (const polySeg of polygonSegments) {
      for (const boxSeg of boxSegments) {
        if (this.lineSegmentsIntersect(polySeg, boxSeg)) {
          return true
        }
      }
    }

    return false
  }

  private lineSegmentsIntersect(seg1: any, seg2: any): boolean {
    const { x1: x1, y1: y1, x2: x2, y2: y2 } = seg1
    const { x1: x3, y1: y3, x2: x4, y2: y4 } = seg2

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    
    // Check for parallel lines (avoid division by zero)
    if (Math.abs(denom) < 0.0001) return false

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }

  // New enhanced method for handling polygon collisions with irregular shapes
  private handlePolygonCollisions(entity: Entity, polygons: Polygon[], remainingMovement: Vector2D, _dt: number) {
    const maxIterations = 3 // Limit iterations to prevent infinite loops
    let iteration = 0

    while (iteration < maxIterations && (Math.abs(remainingMovement.x) > 0.01 || Math.abs(remainingMovement.y) > 0.01)) {
      const entityBox = this.getAABB(entity)
      let totalCollisionResponse = { x: 0, y: 0 }
      let collisionCount = 0
      let hadCollision = false

      // Check collisions with all polygons
      for (const polygon of polygons) {
        const collisionInfo = this.getDetailedPolygonCollision(entityBox, polygon)

        if (collisionInfo.hasCollision) {
          hadCollision = true
          collisionCount++

          // Accumulate collision responses
          totalCollisionResponse.x += collisionInfo.separation.x
          totalCollisionResponse.y += collisionInfo.separation.y

          // Update velocity based on collision normal
          this.updateVelocityForPolygonCollision(entity, collisionInfo)
        }
      }

      if (hadCollision && collisionCount > 0) {
        // Average the collision responses for smoother behavior
        const avgResponse = {
          x: totalCollisionResponse.x / collisionCount,
          y: totalCollisionResponse.y / collisionCount
        }

        // Apply position correction with conservative approach
        const correctionFactor = 0.8 // Less aggressive correction to prevent overshooting
        entity.position.x += avgResponse.x * correctionFactor
        entity.position.y += avgResponse.y * correctionFactor

        // Reduce remaining movement based on collision
        remainingMovement.x *= 0.1
        remainingMovement.y *= 0.1

        // Dampen velocity to prevent oscillation
        entity.velocity.x *= 0.9
        if (!entity.grounded) {
          entity.velocity.y *= 0.9
        }
      } else {
        // No collision, we can apply remaining movement
        entity.position.x += remainingMovement.x
        entity.position.y += remainingMovement.y
        break
      }

      iteration++
    }

    // Final validation to ensure entity isn't stuck
    this.performFinalStuckCheck(entity, polygons)
  }

  // Enhanced collision detection for irregular polygons
  private getDetailedPolygonCollision(entityBox: AABB, polygon: Polygon): {
    hasCollision: boolean;
    separation: Vector2D;
    normal: Vector2D;
    penetrationDepth: number;
  } {
    const entityCenter = {
      x: entityBox.x + entityBox.width / 2,
      y: entityBox.y + entityBox.height / 2
    }

    let minSeparation = { x: 0, y: 0 }
    let minPenetration = Infinity
    let hasCollision = false
    let collisionNormal = { x: 0, y: -1 }

    // Check collision with each segment of the polygon
    const segments = polygon.getSegments()

    for (const segment of segments) {
      const segmentInfo = this.getEntitySegmentCollision(entityBox, segment)

      if (segmentInfo.penetration > 0 && segmentInfo.penetration < minPenetration) {
        hasCollision = true
        minPenetration = segmentInfo.penetration
        minSeparation = segmentInfo.separation
        collisionNormal = segmentInfo.normal
      }
    }

    // Also check if entity center is inside polygon (for complex concave shapes)
    if (!hasCollision && polygon.contains(entityCenter.x, entityCenter.y)) {
      // Entity is inside polygon - find closest escape route
      const escapeInfo = this.findClosestEscape(entityBox, polygon)
      if (escapeInfo) {
        hasCollision = true
        minSeparation = escapeInfo.separation
        collisionNormal = escapeInfo.normal
        minPenetration = escapeInfo.penetration
      }
    }

    return {
      hasCollision,
      separation: minSeparation,
      normal: collisionNormal,
      penetrationDepth: minPenetration
    }
  }

  // Get collision info between entity AABB and polygon segment
  private getEntitySegmentCollision(entityBox: AABB, segment: any): {
    penetration: number;
    separation: Vector2D;
    normal: Vector2D;
  } {
    const entityCenter = {
      x: entityBox.x + entityBox.width / 2,
      y: entityBox.y + entityBox.height / 2
    }

    // Find closest point on segment to entity center
    const closestPoint = this.closestPointOnSegment(entityCenter.x, entityCenter.y, segment)

    // Calculate distance and direction
    const dx = entityCenter.x - closestPoint.x
    const dy = entityCenter.y - closestPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Calculate entity radius (approximate)
    const entityRadius = Math.max(entityBox.width, entityBox.height) / 2
    const penetration = Math.max(0, entityRadius - distance)

    let separation = { x: 0, y: 0 }
    let normal = { x: 0, y: -1 }

    if (distance > 0.001) {
      // Normalize direction vector
      normal = { x: dx / distance, y: dy / distance }
      separation = {
        x: normal.x * (penetration + 0.1), // Small buffer
        y: normal.y * (penetration + 0.1)
      }
    }

    return { penetration, separation, normal }
  }

  // Find closest escape route when entity is inside polygon
  private findClosestEscape(entityBox: AABB, polygon: Polygon): {
    separation: Vector2D;
    normal: Vector2D;
    penetration: number;
  } | null {
    const entityCenter = {
      x: entityBox.x + entityBox.width / 2,
      y: entityBox.y + entityBox.height / 2
    }

    const segments = polygon.getSegments()
    let closestDistance = Infinity
    let bestEscape = null

    for (const segment of segments) {
      const closestPoint = this.closestPointOnSegment(entityCenter.x, entityCenter.y, segment)
      const dx = closestPoint.x - entityCenter.x
      const dy = closestPoint.y - entityCenter.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < closestDistance) {
        closestDistance = distance
        const normal = { x: -dx / distance, y: -dy / distance }
        const entityRadius = Math.max(entityBox.width, entityBox.height) / 2
        const separation = {
          x: normal.x * (entityRadius + distance + 1), // Push out with buffer
          y: normal.y * (entityRadius + distance + 1)
        }

        bestEscape = {
          separation,
          normal,
          penetration: entityRadius + distance
        }
      }
    }

    return bestEscape
  }

  // Update entity velocity based on polygon collision
  private updateVelocityForPolygonCollision(entity: Entity, collisionInfo: any) {
    const normal = collisionInfo.normal

    // Determine surface type based on normal direction
    const isFloorLike = normal.y < -0.6 // Normal points upward (floor)
    const isCeilingLike = normal.y > 0.6 // Normal points downward (ceiling)
    const isWallLike = Math.abs(normal.x) > 0.6 // Normal points horizontally (wall)

    if (isFloorLike) {
      // Landing on floor-like surface
      if (entity.velocity.y > 0) { // Only if falling
        entity.velocity.y = 0
        entity.grounded = true
      }
      // Allow horizontal sliding on floors
    } else if (isCeilingLike) {
      // Hitting ceiling-like surface
      if (entity.velocity.y < 0) { // Only if moving upward
        entity.velocity.y = 0
        entity.ceilingCollision = true
      }
    } else if (isWallLike) {
      // Hitting wall-like surface
      const velocityIntoWall = entity.velocity.x * normal.x
      if (velocityIntoWall < 0) { // Moving into wall
        entity.velocity.x = 0 // Stop horizontal movement
        if (normal.x > 0) {
          entity.wallCollision.left = true
        } else {
          entity.wallCollision.right = true
        }
      }
    } else {
      // Diagonal/slope surface - use sliding behavior
      const velocityDotNormal = entity.velocity.x * normal.x + entity.velocity.y * normal.y
      if (velocityDotNormal < 0) {
        // Slide along surface
        entity.velocity.x -= velocityDotNormal * normal.x * 0.7 // Partial reflection for sliding
        entity.velocity.y -= velocityDotNormal * normal.y * 0.7

        // Check if slope is walkable
        if (normal.y < -0.3) {
          entity.grounded = true
        }
      }
    }
  }

  // Final check to ensure entity isn't stuck inside any polygon
  private performFinalStuckCheck(entity: Entity, polygons: Polygon[]) {
    const entityBox = this.getAABB(entity)
    let isStuck = false

    for (const polygon of polygons) {
      if (this.polygonIntersectsAABB(polygon, entityBox)) {
        isStuck = true
        break
      }
    }

    if (isStuck) {
      // Emergency unstuck procedure
      const emergencyPush = this.findEmergencyEscapeDirection(entityBox, polygons)
      if (emergencyPush) {
        entity.position.x += emergencyPush.x
        entity.position.y += emergencyPush.y

        // Significantly reduce velocity to prevent bouncing
        entity.velocity.x *= 0.5
        entity.velocity.y *= 0.5

        // Reset collision states to allow re-detection
        entity.grounded = false
        entity.wallCollision.left = false
        entity.wallCollision.right = false
        entity.ceilingCollision = false
      }
    }
  }

  // Find emergency escape direction when all else fails
  private findEmergencyEscapeDirection(entityBox: AABB, polygons: Polygon[]): Vector2D | null {
    const testDirections = [
      { x: 0, y: -2 }, // Up (most common escape)
      { x: -1, y: -1 }, // Up-left
      { x: 1, y: -1 },  // Up-right
      { x: -2, y: 0 },  // Left
      { x: 2, y: 0 },   // Right
      { x: 0, y: 1 }    // Down (last resort)
    ]

    for (const direction of testDirections) {
      const testBox = {
        x: entityBox.x + direction.x,
        y: entityBox.y + direction.y,
        width: entityBox.width,
        height: entityBox.height
      }

      let isValidPosition = true
      for (const polygon of polygons) {
        if (this.polygonIntersectsAABB(polygon, testBox)) {
          isValidPosition = false
          break
        }
      }

      if (isValidPosition) {
        return direction
      }
    }

    return null // No valid escape direction found
  }

  private resolvePolygonCollision(entity: Entity, polygon: Polygon, entityBox: AABB) {
    const segments = polygon.getSegments()
    const entityCenter = {
      x: entityBox.x + entityBox.width / 2,
      y: entityBox.y + entityBox.height / 2
    }

    // Find all nearby segments and calculate their penetration
    const nearbySegments = []
    for (const segment of segments) {
      const closestPoint = this.closestPointOnSegment(entityCenter.x, entityCenter.y, segment)
      const dx = entityCenter.x - closestPoint.x
      const dy = entityCenter.y - closestPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      const segmentDx = segment.x2 - segment.x1
      const segmentDy = segment.y2 - segment.y1
      const segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy)

      if (segmentLength < 0.001) continue // Skip degenerate segments

      // Calculate penetration depth (how much the entity overlaps with the segment)
      const entityRadius = Math.max(entityBox.width, entityBox.height) / 2
      const penetrationDepth = entityRadius - distance

      if (penetrationDepth > -2) { // Include segments that are very close
        // Calculate segment normal (perpendicular to segment)
        const segmentNormal = this.getSegmentNormal(segment, entityCenter)
        
        nearbySegments.push({
          segment,
          distance,
          penetrationDepth,
          normal: segmentNormal,
          closestPoint
        })
      }
    }

    if (nearbySegments.length === 0) return

    // Sort by penetration depth (most penetrated first)
    nearbySegments.sort((a, b) => b.penetrationDepth - a.penetrationDepth)

    // Use the most penetrated segment for primary collision response
    const primarySegment = nearbySegments[0]
    
    if (primarySegment.penetrationDepth > 0) {
      // Calculate a conservative push distance to avoid overshooting
      const minPushDistance = 0.1 // Smaller minimum push to reduce jitter
      const pushDistance = Math.max(minPushDistance, primarySegment.penetrationDepth + 0.01) // Smaller buffer
      
      // Apply position correction (don't push vertically if on ground to prevent jitter)
      if (Math.abs(primarySegment.normal.y) > 0.7 && primarySegment.normal.y < 0 && entity.grounded) {
        // On ground surface, only correct position without adding extra push
        entity.position.y = primarySegment.closestPoint.y - entity.height
      } else {
        // Normal position correction for walls and other surfaces
        entity.position.x += primarySegment.normal.x * pushDistance
        entity.position.y += primarySegment.normal.y * pushDistance
      }

      // Apply velocity correction based on collision normal
      this.applyVelocityCorrection(entity, primarySegment.normal, primarySegment.segment)

      // Handle multiple segment interactions to prevent getting stuck on edges
      if (nearbySegments.length > 1) {
        this.handleMultiSegmentCollision(entity, nearbySegments)
      }
    }
  }

  private getSegmentNormal(segment: any, entityCenter: { x: number; y: number }): { x: number; y: number } {
    const segmentDx = segment.x2 - segment.x1
    const segmentDy = segment.y2 - segment.y1
    const segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy)

    if (segmentLength < 0.001) return { x: 0, y: -1 }

    // Calculate perpendicular vector (normal)
    const perpX = -segmentDy / segmentLength
    const perpY = segmentDx / segmentLength

    // Choose the normal that points away from the polygon (towards the entity)
    const segmentMidX = (segment.x1 + segment.x2) / 2
    const segmentMidY = (segment.y1 + segment.y2) / 2
    const toEntityX = entityCenter.x - segmentMidX
    const toEntityY = entityCenter.y - segmentMidY

    // Use dot product to determine correct normal direction
    const dot = perpX * toEntityX + perpY * toEntityY
    return dot >= 0 ? { x: perpX, y: perpY } : { x: -perpX, y: -perpY }
  }

  private applyVelocityCorrection(entity: Entity, normal: { x: number; y: number }, segment: any) {
    const segmentDx = segment.x2 - segment.x1
    const segmentDy = segment.y2 - segment.y1
    const segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy)

    if (segmentLength < 0.001) return

    const isVerticalSegment = Math.abs(segmentDx) < segmentLength * 0.3
    const isHorizontalSegment = Math.abs(segmentDy) < segmentLength * 0.3

    if (isVerticalSegment) {
      // Vertical wall - only stop horizontal velocity component
      const horizontalVelocityComponent = entity.velocity.x * normal.x
      if (horizontalVelocityComponent < 0) { // Moving into the wall
        entity.velocity.x -= horizontalVelocityComponent * normal.x
        
        // Set wall collision flags
        if (normal.x > 0) {
          entity.wallCollision.left = true
        } else if (normal.x < 0) {
          entity.wallCollision.right = true
        }
      }
    } else if (isHorizontalSegment) {
      // Horizontal surface - handle vertical velocity
      const verticalVelocityComponent = entity.velocity.y * normal.y
      if (verticalVelocityComponent < 0) { // Moving into the surface
        entity.velocity.y = 0 // Completely stop vertical velocity on horizontal surfaces
        
        if (normal.y < -0.7) {
          // Landing on top surface
          entity.grounded = true
        } else if (normal.y > 0.7) {
          // Hitting ceiling
          entity.ceilingCollision = true
        }
      }
    } else {
      // Diagonal segment - use reflection for smooth sliding
      const velocityDotNormal = entity.velocity.x * normal.x + entity.velocity.y * normal.y
      if (velocityDotNormal < 0) { // Moving into the surface
        // Reflect velocity component that's moving into the surface
        entity.velocity.x -= velocityDotNormal * normal.x
        entity.velocity.y -= velocityDotNormal * normal.y
        
        // Check if this is a floor-like diagonal surface
        if (normal.y < -0.5) {
          entity.grounded = true
          // Reduce vertical velocity on slopes to prevent bouncing
          if (entity.velocity.y > 0) {
            entity.velocity.y *= 0.5
          }
        }
      }
    }
  }

  private handleMultiSegmentCollision(entity: Entity, nearbySegments: any[]) {
    // When colliding with multiple segments, we want to prevent getting stuck
    // This commonly happens at corners or when transitioning between segments
    
    if (nearbySegments.length >= 2) {
      const segment1 = nearbySegments[0]
      const segment2 = nearbySegments[1]
      
      // Check if we're at a corner (two segments with significantly different normals)
      const dotProduct = segment1.normal.x * segment2.normal.x + segment1.normal.y * segment2.normal.y
      
      if (dotProduct < 0.5) { // Segments are at an angle > 60 degrees
        // Average the normals for a smoother resolution
        const avgNormalX = (segment1.normal.x + segment2.normal.x) / 2
        const avgNormalY = (segment1.normal.y + segment2.normal.y) / 2
        const avgNormalLength = Math.sqrt(avgNormalX * avgNormalX + avgNormalY * avgNormalY)
        
        if (avgNormalLength > 0.001) {
          const normalizedAvgNormal = {
            x: avgNormalX / avgNormalLength,
            y: avgNormalY / avgNormalLength
          }
          
          // Apply additional small push in the averaged direction (only horizontal for corners)
          if (Math.abs(normalizedAvgNormal.x) > 0.5) {
            entity.position.x += normalizedAvgNormal.x * 0.1 // Smaller push
          }
          // Only push vertically if not grounded to avoid ground jitter
          if (!entity.grounded && Math.abs(normalizedAvgNormal.y) > 0.5) {
            entity.position.y += normalizedAvgNormal.y * 0.1
          }
          
          // Reduce velocity to prevent bouncing between segments
          entity.velocity.x *= 0.9 // Less aggressive damping
          if (!entity.grounded) {
            entity.velocity.y *= 0.9
          }
        }
      }
    }
  }

  private closestPointOnSegment(px: number, py: number, segment: any) {
    const { x1, y1, x2, y2 } = segment
    const dx = x2 - x1
    const dy = y2 - y1
    const lengthSquared = dx * dx + dy * dy

    // Handle degenerate case (zero-length segment)
    if (lengthSquared < 0.0001) return { x: x1, y: y1 }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared))
    return {
      x: x1 + t * dx,
      y: y1 + t * dy
    }
  }

  private checkContinuousCollision(entity: Entity, platform: Platform): boolean {
    // Use stored previous position if available, otherwise calculate
    const prevX = entity.previousPosition ? entity.previousPosition.x : entity.position.x - entity.velocity.x
    const prevY = entity.previousPosition ? entity.previousPosition.y : entity.position.y - entity.velocity.y

    // Create AABB for previous position
    const prevEntityBox = {
      x: prevX,
      y: prevY,
      width: entity.width,
      height: entity.height
    }

    const platformBox = this.getAABB(platform)

    // If entity wasn't colliding in previous position but is moving towards platform
    if (!this.isColliding(prevEntityBox, platformBox)) {
      // Create a swept AABB that covers the entire movement path
      const sweptBox = this.getSweptAABB(prevEntityBox, entity.velocity)

      if (this.isColliding(sweptBox, platformBox)) {
        // Use raycast to find exact collision point
        const rayStart = { x: prevX + entity.width / 2, y: prevY + entity.height / 2 }
        const rayEnd = { x: entity.position.x + entity.width / 2, y: entity.position.y + entity.height / 2 }

        // Check if the movement ray intersects with the platform
        if (this.rayIntersectsAABB(rayStart, rayEnd, platformBox)) {
          // Find the collision time (0 to 1 along the movement)
          const collisionTime = this.getRayAABBIntersectionTime(rayStart, rayEnd, platformBox)

          if (collisionTime >= 0 && collisionTime <= 1) {
            // Move entity to collision point
            entity.position.x = prevX + entity.velocity.x * collisionTime
            entity.position.y = prevY + entity.velocity.y * collisionTime

            // Resolve collision at this position
            const collisionEntityBox = this.getAABB(entity)
            this.resolvePlatformCollision(entity, platform, collisionEntityBox, platformBox)
            return true
          }
        }
      }
    }

    return false
  }

  private getSweptAABB(box: AABB, velocity: Vector2D): AABB {
    return {
      x: velocity.x > 0 ? box.x : box.x + velocity.x,
      y: velocity.y > 0 ? box.y : box.y + velocity.y,
      width: box.width + Math.abs(velocity.x),
      height: box.height + Math.abs(velocity.y)
    }
  }

  private rayIntersectsAABB(start: Vector2D, end: Vector2D, box: AABB): boolean {
    const result = this.raycastAABB(start, end, box)
    return result !== null
  }

  private getRayAABBIntersectionTime(start: Vector2D, end: Vector2D, box: AABB): number {
    const result = this.raycastAABB(start, end, box)
    return result ? result.t : -1
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

  // Swept AABB collision detection to prevent tunneling
  private sweptAABB(entity: Entity, movement: Vector2D, platforms: Platform[]): { hit: boolean; time: number; normal: Vector2D } {
    let nearestTime = 1.0
    let nearestNormal = { x: 0, y: 0 }
    let hit = false

    const entityBox = this.getAABB(entity)

    for (const platform of platforms) {
      // Skip collision for one-way platforms if entity is moving upward
      if (platform.type === 'platform' && movement.y < 0) {
        continue
      }

      const platformBox = this.getAABB(platform)
      const result = this.sweptAABBvsAABB(entityBox, movement, platformBox)

      if (result.hit && result.time < nearestTime && result.time >= 0) {
        nearestTime = result.time
        nearestNormal = result.normal
        hit = true
      }
    }

    return { hit, time: nearestTime, normal: nearestNormal }
  }

  private sweptAABBvsAABB(box1: AABB, movement: Vector2D, box2: AABB): { hit: boolean; time: number; normal: Vector2D } {
    // Expand box2 by box1's dimensions (Minkowski difference)
    const expandedBox = {
      x: box2.x - box1.width,
      y: box2.y - box1.height,
      width: box2.width + box1.width,
      height: box2.height + box1.height
    }

    // Treat box1 as a point and do ray-vs-AABB collision
    const rayOrigin = { x: box1.x, y: box1.y }
    const rayDirection = movement

    return this.rayVsAABB(rayOrigin, rayDirection, expandedBox)
  }

  private rayVsAABB(origin: Vector2D, direction: Vector2D, box: AABB): { hit: boolean; time: number; normal: Vector2D } {
    // Handle zero-direction rays
    if (Math.abs(direction.x) < 0.001 && Math.abs(direction.y) < 0.001) {
      // Check if point is inside box
      if (origin.x >= box.x && origin.x <= box.x + box.width &&
          origin.y >= box.y && origin.y <= box.y + box.height) {
        return { hit: true, time: 0, normal: { x: 0, y: -1 } }
      }
      return { hit: false, time: 1, normal: { x: 0, y: 0 } }
    }

    // Calculate time to hit each side of the box
    const invDirX = Math.abs(direction.x) > 0.001 ? 1.0 / direction.x : (direction.x > 0 ? Infinity : -Infinity)
    const invDirY = Math.abs(direction.y) > 0.001 ? 1.0 / direction.y : (direction.y > 0 ? Infinity : -Infinity)

    let tMinX: number, tMaxX: number
    let tMinY: number, tMaxY: number

    if (invDirX >= 0) {
      tMinX = (box.x - origin.x) * invDirX
      tMaxX = (box.x + box.width - origin.x) * invDirX
    } else {
      tMinX = (box.x + box.width - origin.x) * invDirX
      tMaxX = (box.x - origin.x) * invDirX
    }

    if (invDirY >= 0) {
      tMinY = (box.y - origin.y) * invDirY
      tMaxY = (box.y + box.height - origin.y) * invDirY
    } else {
      tMinY = (box.y + box.height - origin.y) * invDirY
      tMaxY = (box.y - origin.y) * invDirY
    }

    const tNear = Math.max(tMinX, tMinY)
    const tFar = Math.min(tMaxX, tMaxY)

    // Check if ray misses the box or collision is behind the ray
    if (tNear > tFar || tFar < 0 || tNear > 1) {
      return { hit: false, time: 1, normal: { x: 0, y: 0 } }
    }

    // Calculate collision normal based on which face was hit first
    let normal = { x: 0, y: 0 }
    if (tMinX > tMinY) {
      normal.x = invDirX > 0 ? -1 : 1
      normal.y = 0
    } else {
      normal.x = 0
      normal.y = invDirY > 0 ? -1 : 1
    }

    return { hit: true, time: Math.max(0, tNear), normal }
  }



  // Debug and monitoring methods
  public getCollisionDebugInfo(entity: Entity, polygons: Polygon[]): any {
    const entityBox = this.getAABB(entity)
    const info = {
      entityPosition: { x: entity.position.x, y: entity.position.y },
      entityVelocity: { x: entity.velocity.x, y: entity.velocity.y },
      isGrounded: entity.grounded,
      wallCollisions: entity.wallCollision,
      activeCollisions: [] as any[],
      nearbyPolygons: polygons.length
    }

    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i]
      if (this.polygonIntersectsAABB(polygon, entityBox)) {
        const collisionInfo = this.getDetailedPolygonCollision(entityBox, polygon)
        info.activeCollisions.push({
          polygonIndex: i,
          penetrationDepth: collisionInfo.penetrationDepth,
          separation: collisionInfo.separation,
          normal: collisionInfo.normal
        })
      }
    }

    return info
  }

  public enableCollisionDebug(enable: boolean) {
    // Store debug flag for future use
    ;(this as any).debugMode = enable
  }

  // Enhanced configuration methods
  public configureForHandDrawnShapes(config?: {
    friction?: number;
    airResistance?: number;
    separationBuffer?: number;
    maxIterations?: number;
  }) {
    if (config?.friction !== undefined) {
      this.friction = Math.max(0.5, Math.min(0.99, config.friction))
    }
    if (config?.airResistance !== undefined) {
      this.airResistance = Math.max(0.9, Math.min(0.999, config.airResistance))
    }
    if (config?.separationBuffer !== undefined) {
      ;(this as any).separationBuffer = Math.max(0.01, Math.min(1.0, config.separationBuffer))
    }
    if (config?.maxIterations !== undefined) {
      ;(this as any).maxCollisionIterations = Math.max(1, Math.min(10, config.maxIterations))
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

  // Performance monitoring
  public getPerformanceStats(): {
    polygonCollisionChecks: number;
    emergencyEscapes: number;
    iterationCounts: number[];
  } {
    return {
      polygonCollisionChecks: (this as any).polygonCollisionChecks || 0,
      emergencyEscapes: (this as any).emergencyEscapes || 0,
      iterationCounts: (this as any).iterationCounts || []
    }
  }

  public resetPerformanceStats() {
    ;(this as any).polygonCollisionChecks = 0
    ;(this as any).emergencyEscapes = 0
    ;(this as any).iterationCounts = []
  }
}