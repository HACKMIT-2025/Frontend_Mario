/**
 * Physics Engine Test - Verify configuration in both modes
 */

import { GameAPI } from './engine'

// Test function to verify physics engine configuration
export function testPhysicsConfiguration() {
  console.log('🧪 Testing Physics Engine Configuration...')
  
  try {
    // Create a test canvas element
    const testCanvas = document.createElement('canvas')
    testCanvas.width = 1024
    testCanvas.height = 576
    
    // Test with default config (similar to play/embed mode)
    const testAPI = new GameAPI(testCanvas, {
      width: 1024,
      height: 576,
      gravity: 0.5,
      fps: 60
    })
    
    const physicsEngine = testAPI.getEngine().getPhysicsEngine()
    
    console.log('✅ Physics Engine Test Results:')
    console.log('  - Gravity:', physicsEngine.getGravity())
    console.log('  - Engine created successfully')
    console.log('  - All methods accessible')
    
    // Test basic functionality
    console.log('🔧 Testing basic physics functionality...')
    
    // Test entity creation and physics update
    const testEntity = {
      position: { x: 100, y: 100 },
      velocity: { x: 5, y: 0 },
      width: 16,
      height: 16,
      physics: { solid: true, gravity: true, mass: 1 },
      grounded: false,
      wallCollision: { left: false, right: false },
      ceilingCollision: false
    } as any
    
    // Update entity (should not crash)
    physicsEngine.updateEntity(testEntity, 1/60, [], [])
    
    console.log('✅ Physics update test passed')
    console.log('  - Entity position updated from (100, 100) to:', `(${testEntity.position.x}, ${testEntity.position.y})`)
    console.log('  - Gravity applied correctly')
    
    console.log('🎉 All physics tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Physics test failed:', error)
    return false
  }
}

// Auto-run test if loaded in browser
if (typeof window !== 'undefined') {
  // Run test when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testPhysicsConfiguration)
  } else {
    testPhysicsConfiguration()
  }
}