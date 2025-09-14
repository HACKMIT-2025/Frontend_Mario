import './style.css'
import { GameAPI } from './engine'
import levelData from '../../level_data.json'

// Initialize game container with error handling
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('App container not found! Make sure you have a div with id="app" in your HTML.')
}

app.innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    <div id="game-ui">
      <div class="num_deaths">Deaths: <span id="num_deaths">0</span></div>
      <div class="elapsed_time">Time: <span id="elapsed_time">0</span></div>
      <div class="coins">Coins: <span id="coins">0</span></div>
    </div>
  </div>
`

// Add starting point (Mario spawn location) from level_data.json
const startPoint = levelData.starting_points[0]
let startX: number | undefined = undefined
let startY: number | undefined = undefined
if (startPoint) {
  const [x, y] = startPoint.coordinates
  startX = x
  startY = y
  console.log(`Original Start Point: (${startX}, ${startY})`)
} else {
  startX = 100
  startY = 400
  console.log('No starting point found in level_data.json, using default (100, 400)')
}

// Add end point (goal pipe) from level_data.json
const endPoint = levelData.end_points[0]
let scaledEndX: number | undefined = undefined
let scaledEndY: number | undefined = undefined
if (endPoint) {
  const [endX, endY] = endPoint.coordinates
  scaledEndX = endX
  scaledEndY = endY - 30
}

// Initialize game API with error handling
let gameAPI: GameAPI
try {
  gameAPI = new GameAPI('game-canvas', {
    width: 1024,
    height: 576,
    gravity: 0.5,
    fps: 60,
    goal_x: endPoint ? scaledEndX : undefined,
    goal_y: endPoint ? scaledEndY : undefined,
    start_x: startX,
    start_y: startY
  })
} catch (error) {
  console.error('Failed to initialize GameAPI:', error)
  throw new Error('Game initialization failed. Please check the console for details.')
}

gameAPI.setPlayerStart(startX, startY)


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
  const platforms = gameAPI.getPlatforms()
  if (platforms.length > 0) {
    platforms.forEach((platform: any, index: number) => {
      console.log(`Platform ${index}: type=${platform.type}, pos=(${platform.x},${platform.y}), size=${platform.width}x${platform.height}`)
    })
  } else {
    console.log('No platforms loaded')
  }
}

;(window as any).showCollisions = () => {
  console.log('💥 Collision Debug Info:')
  const entities = gameAPI.getEntities()
  if (entities.length > 0) {
    entities.forEach((entity: any) => {
      console.log(`${entity.type}: pos=(${Math.round(entity.position.x)},${Math.round(entity.position.y)}), vel=(${Math.round(entity.velocity?.x || 0)},${Math.round(entity.velocity?.y || 0)})`)
    })
  } else {
    console.log('No entities loaded')
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

// Get the dialog generator
const dialogGenerator = gameAPI.getEngine().getDialogGenerator();

// Configure with your API key
// Put key in env variable VITE_OPENROUTER_API_KEY
dialogGenerator.configureOpenRouter(import.meta.env.VITE_OPENROUTER_API_KEY);

// Test the connection (optional)
const isConnected = await dialogGenerator.testOpenRouterConnection();
console.log('AI system ready:', isConnected);

// Enable AI (after configuration)
const success = dialogGenerator.enableAI();

console.log('AI enabled:', success);

// Check if AI is enabled
const isAIEnabled = dialogGenerator.isAIEnabled();

console.log('Is AI enabled?', isAIEnabled);

// Load custom level based on level_data.json
gameAPI.clearLevel()

// gameAPI.loadClassicLevel()

// gameAPI.buildLevel().startGame()

const coins = levelData.coins
coins.forEach((coin) => {
  const [coinX, coinY] = coin.coordinates
  gameAPI.addCoin(coinX, coinY)
})

const spikes = levelData.spikes
spikes.forEach((spike) => {
  const [spikeX, spikeY] = spike.coordinates
  gameAPI.addSpike(spikeX, spikeY, 32) // Standard 32x32 spike
})

// Add ground platform for safety
// gameAPI.addPlatform(0, 550, 1024, 26, 'ground')

// Add demo spikes to showcase the new addSpike functionality
// // Large spike (64x64)
// gameAPI.addSpike(300, 400, 64)
// // Medium spike (48x48)
// gameAPI.addSpike(400, 416, 48)
// // Standard spike (32x32)
// gameAPI.addSpike(500, 432, 32)

// Add rigid bodies as polygons from level_data.json
levelData.rigid_bodies.forEach((rigidBody) => {
  // Scale contour points to fit game world
  const scaledContours = rigidBody.contour_points.map(point => {
    const [x, y] = point
    return [
      x, y
    ]
  })

  // Add polygon with scaled coordinates
  gameAPI.addPolygon(scaledContours, 'polygon')
})
// loadCustomLevel(gameAPI.getEngine())
gameAPI.addGoal(scaledEndX!, scaledEndY!).buildLevel()
gameAPI.getEngine().setLevelData(gameAPI.builder.levelData)

gameAPI.startGame()
// Load classic level as default
// gameAPI.loadClassicLevel()
