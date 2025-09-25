/**
 * Physics Debugger for Hand-drawn Shape Collision Issues
 *
 * This utility helps debug and optimize physics collisions with irregular hand-drawn shapes.
 * Use this to identify and resolve issues with character getting stuck in walls.
 */

import { Entity } from '../entities/Entity'
import { Polygon } from '../level/Polygon'
import { PhysicsEngine } from './PhysicsEngine'

export class PhysicsDebugger {
  private static instance: PhysicsDebugger | null = null
  private collisionLog: any[] = []
  private performanceMetrics = {
    totalCollisions: 0,
    stuckEvents: 0,
    emergencyEscapes: 0,
    averageIterations: 0
  }

  static getInstance(): PhysicsDebugger {
    if (!PhysicsDebugger.instance) {
      PhysicsDebugger.instance = new PhysicsDebugger()
    }
    return PhysicsDebugger.instance
  }

  /**
   * Enable debug mode with console logging
   */
  enableDebug(_physics: PhysicsEngine) {
    // Note: reverted PhysicsEngine doesn't have enableCollisionDebug method
    console.log('🔧 Physics Debug Mode Enabled (basic mode)')
    console.log('Use PhysicsDebugger.getInstance() to access debug methods')
  }

  /**
   * Configure physics engine specifically for hand-drawn irregular shapes
   */
  optimizeForHandDrawnShapes(_physics: PhysicsEngine) {
    // Note: reverted PhysicsEngine doesn't have configureForHandDrawnShapes method
    // Basic physics engine configuration is handled in the constructor
    console.log('🎨 Physics optimization requested (reverted engine has basic settings)')
  }

  /**
   * Log collision events for analysis
   */
  logCollision(entity: Entity, _polygons: Polygon[], _physics: PhysicsEngine) {
    // Basic collision logging for reverted physics engine
    const basicInfo = {
      timestamp: Date.now(),
      position: { x: entity.position.x, y: entity.position.y },
      velocity: { x: entity.velocity.x, y: entity.velocity.y },
      grounded: entity.grounded
    }

    this.collisionLog.push(basicInfo)
    this.performanceMetrics.totalCollisions++

    // Basic stuck detection based on velocity
    if (Math.abs(entity.velocity.x) < 0.1 && Math.abs(entity.velocity.y) < 0.1 && !entity.grounded) {
      this.performanceMetrics.stuckEvents++
      console.warn('⚠️ Entity may be stuck:', basicInfo)
    }
  }

  /**
   * Analyze collision patterns and suggest optimizations
   */
  analyzeCollisionPatterns(): {
    summary: string;
    recommendations: string[];
    criticalIssues: any[];
  } {
    const recentCollisions = this.collisionLog.slice(-50) // Last 50 collisions
    const stuckEvents = recentCollisions.filter(c => c.isStuck)
    const highPenetrationEvents = recentCollisions.filter(
      c => c.collisions.some((col: any) => col.penetrationDepth > 2)
    )

    const recommendations = []
    const criticalIssues = []

    if (stuckEvents.length > recentCollisions.length * 0.1) {
      recommendations.push('🔧 Consider increasing separation buffer')
      recommendations.push('🔧 Reduce max velocity to prevent tunneling')
      criticalIssues.push({
        issue: 'High stuck event rate',
        percentage: (stuckEvents.length / recentCollisions.length * 100).toFixed(1) + '%'
      })
    }

    if (highPenetrationEvents.length > recentCollisions.length * 0.2) {
      recommendations.push('🔧 Improve polygon simplification in OpenCV processing')
      recommendations.push('🔧 Increase collision detection iterations')
      criticalIssues.push({
        issue: 'High penetration depth events',
        percentage: (highPenetrationEvents.length / recentCollisions.length * 100).toFixed(1) + '%'
      })
    }

    const avgPenetration = recentCollisions.reduce((sum, c) => {
      const maxPenetration = Math.max(...c.collisions.map((col: any) => col.penetrationDepth))
      return sum + maxPenetration
    }, 0) / recentCollisions.length

    if (avgPenetration > 1.0) {
      recommendations.push('🔧 Optimize contour simplification in backend')
      criticalIssues.push({
        issue: 'High average penetration depth',
        value: avgPenetration.toFixed(2) + ' pixels'
      })
    }

    return {
      summary: `Analyzed ${recentCollisions.length} recent collisions. Found ${stuckEvents.length} stuck events and ${highPenetrationEvents.length} high-penetration events.`,
      recommendations,
      criticalIssues
    }
  }

  /**
   * Get real-time collision statistics
   */
  getStats() {
    return {
      ...this.performanceMetrics,
      recentCollisions: this.collisionLog.slice(-10),
      totalLogged: this.collisionLog.length
    }
  }

  /**
   * Clear all debug data
   */
  reset() {
    this.collisionLog = []
    this.performanceMetrics = {
      totalCollisions: 0,
      stuckEvents: 0,
      emergencyEscapes: 0,
      averageIterations: 0
    }
    console.log('🔄 Physics debug data reset')
  }

  /**
   * Generate a debug report for hand-drawn shape collision issues
   */
  generateReport(): string {
    const analysis = this.analyzeCollisionPatterns()
    const stats = this.getStats()

    let report = '\n📊 PHYSICS DEBUG REPORT - Hand-drawn Shape Collisions\n'
    report += '='.repeat(60) + '\n\n'

    report += `📈 STATISTICS:\n`
    report += `  Total collisions logged: ${stats.totalLogged}\n`
    report += `  Stuck events: ${stats.stuckEvents}\n`
    report += `  Emergency escapes: ${stats.emergencyEscapes}\n\n`

    report += `🔍 ANALYSIS:\n`
    report += `  ${analysis.summary}\n\n`

    if (analysis.criticalIssues.length > 0) {
      report += `⚠️  CRITICAL ISSUES:\n`
      analysis.criticalIssues.forEach(issue => {
        report += `  • ${issue.issue}: ${issue.percentage || issue.value}\n`
      })
      report += '\n'
    }

    if (analysis.recommendations.length > 0) {
      report += `💡 RECOMMENDATIONS:\n`
      analysis.recommendations.forEach(rec => {
        report += `  ${rec}\n`
      })
      report += '\n'
    }

    report += `🎨 HAND-DRAWN SHAPE SPECIFIC TIPS:\n`
    report += `  • Ensure OpenCV contour simplification is not too aggressive\n`
    report += `  • Consider smoothing sharp corners in polygon preprocessing\n`
    report += `  • Check for very small polygon segments that might cause jitter\n`
    report += `  • Validate that polygon winding is consistent\n`
    report += `  • Test with different separation buffer values\n\n`

    report += '='.repeat(60)

    return report
  }

  /**
   * Auto-test physics with a sample entity and polygons
   */
  runPhysicsTest(physics: PhysicsEngine, testPolygons: Polygon[]): void {
    console.log('🧪 Running physics test for hand-drawn shapes...')

    // Create a test entity
    const testEntity = {
      position: { x: 100, y: 100 },
      velocity: { x: 2, y: 0 },
      width: 16,
      height: 16,
      physics: { solid: true, gravity: true, mass: 1 },
      grounded: false,
      wallCollision: { left: false, right: false },
      ceilingCollision: false
    } as any

    // Simulate movement for 100 frames
    for (let frame = 0; frame < 100; frame++) {
      physics.updateEntity(testEntity, 1/60, [], testPolygons)

      if (frame % 10 === 0) {
        this.logCollision(testEntity, testPolygons, physics)
      }

      // Vary movement direction to test different collision scenarios
      if (frame === 25) testEntity.velocity.x = -2
      if (frame === 50) testEntity.velocity.y = -5 // Jump
      if (frame === 75) testEntity.velocity.x = 3
    }

    console.log('✅ Physics test completed')
    console.log(this.generateReport())
  }
}

// Global helper function for easy console access
;(globalThis as any).physicsDebugger = PhysicsDebugger.getInstance()

// Console commands for debugging
;(globalThis as any).debugPhysics = (enable = true) => {
  const physicsDebugger = PhysicsDebugger.getInstance()
  console.log(`Physics debugging ${enable ? 'enabled' : 'disabled'}`)
  return physicsDebugger
}

;(globalThis as any).physicsReport = () => {
  return PhysicsDebugger.getInstance().generateReport()
}

export default PhysicsDebugger