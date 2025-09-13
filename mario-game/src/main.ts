import './style.css'
import { GameAPI } from './engine'
import { loadCustomLevel } from './customLevel'

// Initialize game container
const app = document.querySelector<HTMLDivElement>('#app')!
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

// Initialize game API
const gameAPI: GameAPI = new GameAPI('game-canvas', {
  width: 1024,
  height: 576,
  gravity: 0.5,
  fps: 60
})

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

// Test 1: Simple triangle
const triangle = [[0, 500], [100, 0], [50, 50]];
gameAPI.addPolygon(triangle);

// Test 2: Pentagon
const pentagon = [[50, 0], [100, 30], [80, 80], [20, 80], [0, 30]];
gameAPI.addPolygon(pentagon);

// Test 3: Hexagon
const hexagon = [[30, 0], [90, 0], [120, 50], [90, 100], [30, 100], [0, 50]];
gameAPI.addPolygon(hexagon);

// Add some coins for interaction testing
gameAPI.addCoin(250, 350)
        .addCoin(450, 300)
        .addCoin(650, 250);
// loadCustomLevel(gameAPI.getEngine())
gameAPI.buildLevel().startGame()
