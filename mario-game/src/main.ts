import './style.css'
import { GameAPI } from './engine'
import { loadCustomLevel } from './customLevel'

// Initialize game container with error handling
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('App container not found! Make sure you have a div with id="app" in your HTML.')
}

app.innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    <div id="game-ui">
      <div class="score">Score: <span id="score">0</span></div>
      <div class="lives">Lives: <span id="lives">3</span></div>
      <div class="coins">Coins: <span id="coins">0</span></div>
    </div>
  </div>
`

// Initialize game API with error handling
let gameAPI: GameAPI
try {
  gameAPI = new GameAPI('game-canvas', {
    width: 1024,
    height: 576,
    gravity: 0.5,
    fps: 60
  })
} catch (error) {
  console.error('Failed to initialize GameAPI:', error)
  throw new Error('Game initialization failed. Please check the console for details.')
}

// Expose global API for external use (e.g., browser console, image recognition)
;(window as any).GameAPI = gameAPI
;(window as any).MarioGameAPI = gameAPI // Alias for compatibility

// Expose debug functions
import { DebugMode } from './engine/debug/DebugMode'
import { SpriteLoader } from './engine/sprites/SpriteLoader'

const debugMode = DebugMode.getInstance()
const spriteLoader = SpriteLoader.getInstance()

;(window as any).debugMode = () => debugMode.toggle()
;(window as any).showPlatforms = () => {
  console.log('🏗️ Platform Debug Info:')
  if (gameAPI.engine.currentLevel) {
    const platforms = gameAPI.engine.currentLevel.getPlatforms()
    platforms.forEach((platform: any, index: number) => {
      console.log(`Platform ${index}: type=${platform.type}, pos=(${platform.x},${platform.y}), size=${platform.width}x${platform.height}`)
    })
  } else {
    console.log('No level loaded')
  }
}

;(window as any).showCollisions = () => {
  console.log('💥 Collision Debug Info:')
  if (gameAPI.engine.entityManager) {
    const entities = gameAPI.engine.entityManager.getEntities()
    entities.forEach((entity: any) => {
      console.log(`${entity.type}: pos=(${Math.round(entity.position.x)},${Math.round(entity.position.y)}), vel=(${Math.round(entity.velocity?.x || 0)},${Math.round(entity.velocity?.y || 0)})`)
    })
  }
}

;(window as any).checkSprites = () => {
  console.log('🖼️ Sprite Loading Status:')
  const sprites = ['player_idle_right', 'player_idle_left', 'player_run_right_01', 'player_run_right_02',
                   'player_run_left_01', 'player_run_left_02', 'player_jump', 'grass', 'brick', 'question',
                   'pipe_top', 'pipe_body', 'mountain', 'tree', 'terrain']

  sprites.forEach(spriteName => {
    const sprite = spriteLoader.getSprite(spriteName)
    const status = sprite ? '✅' : '❌'
    console.log(`${status} ${spriteName}`)
  })

  console.log('💰 Coins use original rendering (no sprites needed)')
}

// Log available API methods
console.log(`
===================================
Mario Game Engine API
===================================

The GameAPI is now available globally. Use it in the console:

// Build a level
GameAPI.clearLevel()
GameAPI.addPlatform(x, y, width, height, type)
GameAPI.addEnemy(x, y, type)
GameAPI.addCoin(x, y)
GameAPI.addPowerUp(x, y, type)
GameAPI.setPlayerStart(x, y)
GameAPI.buildLevel()
GameAPI.startGame()

// Load preset levels
GameAPI.loadClassicLevel()
GameAPI.loadUndergroundLevel()
GameAPI.loadSkyLevel()
GameAPI.generateRandomLevel()

// Game control
GameAPI.pauseGame()
GameAPI.resetGame()

// Helper methods
GameAPI.addCoinRow(x, y, count)
GameAPI.addPlatformStairs(x, y, steps)
GameAPI.addPipe(x, y, height)

// Import/Export levels
const json = GameAPI.exportJSON()
GameAPI.importJSON(json)

// Build from AI/Image data
GameAPI.generateFromImageData(imageData)
`)

// Load custom level based on level_data.json
gameAPI.clearLevel()
    .setPlayerStart(100, 400)
    .addPlatform(0, 500, 1024, 76, 'ground'); // Ground platform

// Test polygons with validation
function addSafePolygon(points: number[][], name: string) {
  if (!points || points.length < 3) {
    console.warn(`Skipping invalid polygon ${name}: needs at least 3 points`)
    return
  }
  
  // Validate each point
  const validPoints = points.filter(point => {
    if (!Array.isArray(point) || point.length !== 2) return false
    if (typeof point[0] !== 'number' || typeof point[1] !== 'number') return false
    if (!isFinite(point[0]) || !isFinite(point[1])) return false
    return true
  })
  
  if (validPoints.length < 3) {
    console.warn(`Skipping polygon ${name}: insufficient valid points`)
    return
  }
  
  gameAPI.addPolygon(validPoints)
  console.log(`Added ${name} with ${validPoints.length} points`)
}

// Test 1: Simple triangle
const triangle = [[0, 500], [100, 400], [50, 450]]
addSafePolygon(triangle, 'triangle')

// Test 2: Pentagon  
const pentagon = [[200, 450], [250, 420], [230, 480], [170, 480], [150, 430]]
addSafePolygon(pentagon, 'pentagon')

// Test 3: Hexagon
const hexagon = [[300, 420], [360, 420], [390, 450], [360, 480], [300, 480], [270, 450]]
addSafePolygon(hexagon, 'hexagon')

// Add some coins for interaction testing
try {
  gameAPI.addCoin(250, 350)
          .addCoin(450, 300)
          .addCoin(650, 250)
  
  // Build and start the game with error handling
  gameAPI.buildLevel().startGame().catch(error => {
    console.error('Failed to start game:', error)
    alert('Game failed to start. Please check the console for details.')
  })
} catch (error) {
  console.error('Failed to build level:', error)
  alert('Level building failed. Please check the console for details.')
}
