import './style.css'
import { GameAPI } from './engine'
import { LevelLoader, type LevelData } from './levelLoader'

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

// 初始化游戏
async function initializeGame() {
  try {
    console.log('🎮 Initializing main game...')

    // 检查是否有API URL参数
    const urlParams = new URLSearchParams(window.location.search)
    const apiUrl = urlParams.get('api') || urlParams.get('apiUrl')

    if (apiUrl) {
      console.log(`🔧 Using API URL: ${apiUrl}`)
      LevelLoader.setApiBaseUrl(apiUrl)
    }

    // 加载关卡数据
    const levelData = await LevelLoader.loadLevelData(apiUrl || undefined)

    // 构建游戏
    await buildGameFromLevelData(levelData)

    console.log('✅ Main game initialized successfully')

  } catch (error) {
    console.error('❌ Failed to initialize main game:', error)
    alert('游戏初始化失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 从关卡数据构建游戏
async function buildGameFromLevelData(levelData: LevelData) {
  console.log('🏗️ Building game from level data...', levelData)

  // 清空现有关卡
  gameAPI.clearLevel()

  // 设置玩家起始位置
  if (levelData.starting_points && levelData.starting_points.length > 0) {
    const startPoint = levelData.starting_points[0]
    gameAPI.setPlayerStart(startPoint.coordinates[0], startPoint.coordinates[1])
    console.log(`👨 Player start: (${startPoint.coordinates[0]}, ${startPoint.coordinates[1]})`)
  } else {
    gameAPI.setPlayerStart(100, 400)
  }

  // 添加终点
  if (levelData.end_points && levelData.end_points.length > 0) {
    const endPoint = levelData.end_points[0]
    gameAPI.addGoalPipe(endPoint.coordinates[0], endPoint.coordinates[1])
    console.log(`🏁 Goal pipe: (${endPoint.coordinates[0]}, ${endPoint.coordinates[1]})`)
  }

  // 添加刚体（平台和墙壁）
  if (levelData.rigid_bodies && levelData.rigid_bodies.length > 0) {
    levelData.rigid_bodies.forEach((body, index) => {
      if (body.contour_points && body.contour_points.length >= 3) {
        try {
          let polygonType = 'polygon'
          if (body.contour_points.length === 3) polygonType = 'triangle'
          else if (body.contour_points.length === 5) polygonType = 'pentagon'
          else if (body.contour_points.length === 6) polygonType = 'hexagon'

          gameAPI.addPolygon(body.contour_points, polygonType)
          console.log(`🔷 Added ${polygonType} (${body.contour_points.length} points)`)
        } catch (error) {
          console.warn(`⚠️ Failed to add polygon ${index}:`, error)
        }
      }
    })
  }

  // 添加金币
  if (levelData.coins && levelData.coins.length > 0) {
    levelData.coins.forEach((coin) => {
      gameAPI.addCoin(coin.x, coin.y)
    })
    console.log(`🪙 Added ${levelData.coins.length} coins`)
  }

  // 添加敌人
  if (levelData.enemies && levelData.enemies.length > 0) {
    levelData.enemies.forEach((enemy) => {
      gameAPI.addEnemy(enemy.x, enemy.y, enemy.type)
    })
    console.log(`👾 Added ${levelData.enemies.length} enemies`)
  }

  // 构建并启动游戏
  await gameAPI.buildLevel()
  await gameAPI.startGame()
}

// 启动游戏初始化
initializeGame()
