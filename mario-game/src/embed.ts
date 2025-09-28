import './style.css'
import { GameAPI } from './engine'
import { LevelLoader, type LevelData } from './levelLoader'

console.log('🎮 Mario Game Embed Mode - Starting...')

// 全局配置
declare global {
  interface Window {
    MARIO_EMBED_MODE: boolean
    MARIO_API_URL?: string
    gameAPI?: GameAPI
    hideLoading: () => void
    showError: (message: string) => void
  }
}

let gameAPI: GameAPI

async function initializeEmbedGame() {
  try {
    console.log('🔧 Initializing embed game...')

    // 检查必要的DOM元素
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
    if (!canvas) {
      throw new Error('Game canvas not found')
    }

    // 设置API URL（如果父窗口提供）
    if (window.MARIO_API_URL) {
      LevelLoader.setApiBaseUrl(window.MARIO_API_URL)
    }

    // 加载关卡数据，使用标准尺寸（无需缩放）
    console.log('📋 Loading level data...')
    const levelData = await LevelLoader.loadLevelData(window.MARIO_API_URL)

    // 提取起始点和终点用于引擎配置
    let startX = 100, startY = 400
    let goalX: number | undefined, goalY: number | undefined

    if (levelData.starting_points && levelData.starting_points.length > 0) {
      const startPoint = levelData.starting_points[0]
      startX = startPoint.coordinates[0]
      startY = startPoint.coordinates[1]
    }

    if (levelData.end_points && levelData.end_points.length > 0) {
      const endPoint = levelData.end_points[0]
      goalX = endPoint.coordinates[0]
      goalY = endPoint.coordinates[1] - 30
    }

    // 创建游戏API实例，使用标准固定尺寸
    gameAPI = new GameAPI('game-canvas', {
      width: 1024,         // 标准宽度
      height: 576,         // 标准高度
      gravity: 0.5,        // Balanced gravity for good gameplay
      fps: 60,             // Smooth 60fps
      goal_x: goalX,
      goal_y: goalY,
      start_x: startX,
      start_y: startY
    })

    // 设置关卡ID（从URL参数获取或使用默认值）
    const urlParams = new URLSearchParams(window.location.search)
    const levelIdParam = urlParams.get('levelId') || urlParams.get('id')
    const levelId = levelIdParam ? parseInt(levelIdParam, 10) : 3 // Embed模式默认关卡ID=3
    gameAPI.getEngine().setLevelId(levelId)
    gameAPI.getEngine().enableLeaderboard(true)  // Embed模式支持排行榜（从API加载关卡）
    console.log(`🎮 设置关卡ID: ${levelId}，排行榜已启用`)

    // 暴露给全局（用于调试）
    window.gameAPI = gameAPI
    ;(window as any).GameAPI = gameAPI // 与本地引擎保持一致
    ;(window as any).MarioGameAPI = gameAPI // 别名兼容

    console.log('✅ Game API initialized')
    
    // Log physics engine configuration
    console.log('🔧 Physics Engine Status:')
    console.log('  - Mode: Embed Mode')
    console.log('  - Engine Version: Reverted (Stable)')
    console.log('  - Gravity:', gameAPI.getEngine().getPhysicsEngine().getGravity())

    // 构建关卡
    await buildGameFromLevelData(levelData)

    // 隐藏加载状态
    window.hideLoading()

    // 启动游戏
    await gameAPI.startGame()

    // 发送游戏就绪事件
    window.dispatchEvent(new CustomEvent('gameReady'))

    console.log('🎮 Embed game started successfully!')

  } catch (error) {
    console.error('❌ Failed to initialize embed game:', error)
    window.showError(error instanceof Error ? error.message : '初始化失败')

    // 发送错误事件
    window.dispatchEvent(new ErrorEvent('error', { error: error as Error }))
  }
}

async function buildGameFromLevelData(levelData: LevelData) {
  console.log('🏗️ Building game from level data...', levelData)

  // 清空现有关卡
  gameAPI.clearLevel()

  // 设置玩家起始位置
  if (levelData.starting_points && levelData.starting_points.length > 0) {
    const startPoint = levelData.starting_points[0]
    gameAPI.setPlayerStart(startPoint.coordinates[0], startPoint.coordinates[1])
    console.log(`👨 Player start set to: (${startPoint.coordinates[0]}, ${startPoint.coordinates[1]})`)
  } else {
    gameAPI.setPlayerStart(100, 400) // 默认位置
  }

  // 添加终点（使用 addGoal 而不是 addGoalPipe，与本地引擎保持一致）
  if (levelData.end_points && levelData.end_points.length > 0) {
    const endPoint = levelData.end_points[0]
    gameAPI.addGoal(endPoint.coordinates[0], endPoint.coordinates[1] - 30)
    console.log(`🏁 Goal added at: (${endPoint.coordinates[0]}, ${endPoint.coordinates[1] - 30})`)
  }

  // 添加刚体（墙壁和平台）
  let polygonCount = 0
  if (levelData.rigid_bodies && levelData.rigid_bodies.length > 0) {
    levelData.rigid_bodies.forEach((body, index) => {
      if (body.contour_points && body.contour_points.length >= 3) {
        try {
          // 确定多边形类型
          let polygonType = 'polygon'
          if (body.contour_points.length === 3) {
            polygonType = 'triangle'
          } else if (body.contour_points.length === 5) {
            polygonType = 'pentagon'
          } else if (body.contour_points.length === 6) {
            polygonType = 'hexagon'
          }

          gameAPI.addPolygon(body.contour_points, polygonType)
          polygonCount++
          console.log(`🔷 Added ${polygonType} with ${body.contour_points.length} points`)
        } catch (error) {
          console.warn(`⚠️ Failed to add polygon ${index}:`, error)
        }
      }
    })
  }

  // 添加金币（如果有）
  let coinCount = 0
  if (levelData.coins && levelData.coins.length > 0) {
    levelData.coins.forEach((coin, index) => {
      try {
        gameAPI.addCoin(coin.x, coin.y)
        coinCount++
        console.log(`🪙 Added coin at: (${coin.x}, ${coin.y})`)
      } catch (error) {
        console.warn(`⚠️ Failed to add coin ${index}:`, error)
      }
    })
  }

  // 添加钉刺（新功能，来自本地引擎）
  let spikeCount = 0
  if (levelData.spikes && levelData.spikes.length > 0) {
    levelData.spikes.forEach((spike, index) => {
      try {
        const [spikeX, spikeY] = spike.coordinates
        gameAPI.addSpike(spikeX, spikeY, 32) // 标准 32x32 钉刺
        spikeCount++
        console.log(`🔺 Added spike at: (${spikeX}, ${spikeY})`)
      } catch (error) {
        console.warn(`⚠️ Failed to add spike ${index}:`, error)
      }
    })
  }

  // 添加敌人（如果有）
  let enemyCount = 0
  if (levelData.enemies && levelData.enemies.length > 0) {
    levelData.enemies.forEach((enemy, index) => {
      try {
        gameAPI.addEnemy(enemy.x, enemy.y, enemy.type)
        enemyCount++
        console.log(`👾 Added ${enemy.type} at: (${enemy.x}, ${enemy.y})`)
      } catch (error) {
        console.warn(`⚠️ Failed to add enemy ${index}:`, error)
      }
    })
  }

  // 构建关卡
  await gameAPI.buildLevel()

  // 设置关卡数据到引擎（重要：来自本地引擎的改进）
  gameAPI.getEngine().setLevelData(gameAPI.builder.levelData)

  console.log(`✅ Level built: ${polygonCount} platforms, ${coinCount} coins, ${spikeCount} spikes, ${enemyCount} enemies`)

  // 配置AI对话系统（学习本地引擎）
  await configureAIDialogSystem(gameAPI)
}

// 配置AI对话系统
async function configureAIDialogSystem(gameAPI: GameAPI) {
  try {
    console.log('🤖 Configuring AI dialog system...')

    // 获取对话生成器
    const dialogGenerator = gameAPI.getEngine().getDialogGenerator()

    // 配置Backend API用于对话生成
    dialogGenerator.configureBackend()

    // 测试连接
    const isConnected = await dialogGenerator.testBackendConnection()
    console.log('🌐 Backend system ready:', isConnected)

    // 启用AI
    const success = dialogGenerator.enableAI()
    console.log('🤖 AI enabled:', success)

    // 检查AI是否启用
    const isAIEnabled = dialogGenerator.isAIEnabled()
    console.log('🔍 Is AI enabled?', isAIEnabled)

    if (isAIEnabled) {
      console.log('✅ AI dialog system configured successfully via backend')
    } else {
      console.warn('⚠️ AI system failed to enable')
    }
  } catch (error) {
    console.error('❌ Error configuring AI dialog system:', error)
  }
}

// 监听父窗口消息
window.addEventListener('message', (event) => {
  console.log('📨 Received message from parent:', event.data)

  switch (event.data.type) {
    case 'SET_API_URL':
      window.MARIO_API_URL = event.data.apiUrl
      LevelLoader.setApiBaseUrl(event.data.apiUrl)
      console.log(`🔧 API URL updated: ${event.data.apiUrl}`)
      break

    case 'RELOAD_LEVEL':
      if (event.data.levelId) {
        console.log(`🔄 Reloading level: ${event.data.levelId}`)
        // 重新加载指定关卡
        location.search = `?id=${event.data.levelId}`
      }
      break

    case 'PAUSE_GAME':
      if (gameAPI) {
        gameAPI.pauseGame()
        console.log('⏸️ Game paused by parent')
      }
      break

    case 'RESUME_GAME':
      if (gameAPI) {
        gameAPI.pauseGame() // toggle
        console.log('▶️ Game resumed by parent')
      }
      break

    case 'RESET_GAME':
      if (gameAPI) {
        gameAPI.resetGame()
        console.log('🔄 Game reset by parent')
      }
      break
  }
})

// 监听游戏事件并转发给父窗口
// function setupGameEventForwarding() {
//   // 监听分数变化
//   let lastScore = 0
//   setInterval(() => {
//     if (gameAPI && gameAPI.getScore) {
//       const currentScore = gameAPI.getScore()
//       if (currentScore !== lastScore) {
//         lastScore = currentScore
//         if (window.parent && window.parent !== window) {
//           window.parent.postMessage({
//             type: 'SCORE_UPDATE',
//             data: { score: currentScore }
//           }, '*')
//         }
//       }
//     }
//   }, 100)

//   // 监听游戏结束
//   window.addEventListener('gameOver', (event: any) => {
//     if (window.parent && window.parent !== window) {
//       window.parent.postMessage({
//         type: 'GAME_OVER',
//         data: {
//           score: event.detail?.score || 0,
//           reason: event.detail?.reason || 'unknown'
//         }
//       }, '*')
//     }
//   })

//   // 监听游戏开始
//   window.addEventListener('gameStart', () => {
//     if (window.parent && window.parent !== window) {
//       window.parent.postMessage({
//         type: 'GAME_START',
//         data: { timestamp: Date.now() }
//       }, '*')
//     }
//   })

//   // 监听胜利
//   window.addEventListener('gameWin', (event: any) => {
//     if (window.parent && window.parent !== window) {
//       window.parent.postMessage({
//         type: 'GAME_WIN',
//         data: {
//           score: event.detail?.score || 0,
//           time: event.detail?.time || 0
//         }
//       }, '*')
//     }
//   })
// }

// 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
  window.showError('游戏加载失败: ' + (event.reason?.message || '未知错误'))
})

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM loaded, initializing embed game...')
  // setupGameEventForwarding() // Commented out
  initializeEmbedGame()
})

// 如果DOM已经加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded, initializing embed game...')
    // setupGameEventForwarding() // Commented out
    initializeEmbedGame()
  })
} else {
  console.log('📱 DOM already loaded, initializing embed game...')
  // setupGameEventForwarding() // Commented out
  initializeEmbedGame()
}