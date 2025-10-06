import './style.css'
import { GameAPI } from './engine'
import { LevelLoader, type LevelData } from './levelLoader'
import { SpeedSelector } from './ui/SpeedSelector'
import { LevelPackManager } from './engine/LevelPackManager'
import { LevelPackProgressUI } from './ui/LevelPackProgressUI'

// Global variable to store level data with privacy status
let currentLevelData: LevelData | null = null

// Level pack mode globals
let packManager: LevelPackManager | null = null
let packProgressUI: LevelPackProgressUI | null = null
let isPackMode: boolean = false

console.log('🎮 Mario Game Play Mode - Starting...')

let gameAPI: GameAPI

// 隐藏加载状态
function hideLoading() {
  const loading = document.getElementById('loading')
  if (loading) loading.style.display = 'none'
}


async function initializePlayGame() {
  try {
    console.log('🔧 Initializing play game...')

    // Check required DOM elements
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
    if (!canvas) {
      console.error('Game canvas not found')
      return
    }

    // 从URL参数获取API URL（如果有）
    const urlParams = new URLSearchParams(window.location.search)
    const apiUrl = urlParams.get('api') || urlParams.get('apiUrl')
    const packIdParam = urlParams.get('packId')

    if (apiUrl) {
      console.log(`🔧 Using API URL: ${apiUrl}`)
      LevelLoader.setApiBaseUrl(apiUrl)
    }

    // ============================================================================
    // Level Pack Mode Detection
    // ============================================================================
    if (packIdParam) {
      console.log(`📦 Level Pack Mode detected! Pack ID: ${packIdParam}`)
      await initializePackMode(parseInt(packIdParam, 10))
      return
    }

    // ============================================================================
    // Standard Single Level Mode
    // ============================================================================
    console.log('🎯 Standard Single Level Mode')

    // 加载关卡数据，使用标准尺寸（无需缩放）
    console.log('📋 Loading level data...')
    const levelData = await LevelLoader.loadLevelData(apiUrl || undefined)

    // Store level data globally for privacy checking
    currentLevelData = levelData

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
    const levelIdParam = urlParams.get('levelId') || urlParams.get('id')
    const levelId = levelIdParam ? parseInt(levelIdParam, 10) : 2 // Play模式默认关卡ID=2
    gameAPI.getEngine().setLevelId(levelId)
    gameAPI.getEngine().enableLeaderboard(true)  // Play模式支持排行榜（从API加载关卡）
    console.log(`🎮 设置关卡ID: ${levelId}，排行榜已启用`)

    // 暴露给全局（用于调试和UI控制）
    ;(window as any).gameAPI = gameAPI
    ;(window as any).GameAPI = gameAPI // 与本地引擎保持一致
    ;(window as any).MarioGameAPI = gameAPI // 别名兼容

    console.log('✅ Game API initialized')
    
    // Log physics engine configuration
    console.log('🔧 Physics Engine Status:')
    console.log('  - Mode: Play Mode')
    console.log('  - Engine Version: Reverted (Stable)')
    console.log('  - Gravity:', gameAPI.getEngine().getPhysicsEngine().getGravity())

    // 构建关卡
    await buildGameFromLevelData(levelData)

    // 隐藏加载状态
    hideLoading()

    // 显示速度选择器
    console.log('🎮 Showing speed selector...')
    const speedSelector = new SpeedSelector()
    const selectedSpeed = await speedSelector.show()
    console.log(`⚡ Selected speed multiplier: ${selectedSpeed}x`)

    // 设置玩家速度
    const player = gameAPI.getEngine().getPlayer()
    if (player) {
      player.setSpeedMultiplier(selectedSpeed)
      console.log(`✅ Player speed set to ${selectedSpeed}x`)
    }

    // 启动游戏
    await gameAPI.startGame()

    console.log('🎮 Play game started successfully!')

    // 自动生成并上传截图（如果关卡没有截图）
    try {
      await uploadScreenshotIfNeeded(gameAPI, levelId)
    } catch (error) {
      console.warn('⚠️ Screenshot upload failed (non-critical):', error)
    }

  } catch (error) {
    console.error('❌ Failed to initialize play game:', error)
  }
}

/**
 * Initialize Level Pack Mode
 */
async function initializePackMode(packId: number) {
  try {
    isPackMode = true
    console.log('📦 Initializing Level Pack Mode...')

    // Prompt for player nickname
    const nickname = await promptPlayerNickname()
    if (!nickname) {
      console.error('❌ No nickname provided, cannot start pack mode')
      alert('You need to provide a nickname to play level packs!')
      return
    }

    console.log(`👤 Player nickname: ${nickname}`)

    // Create level pack manager
    packManager = new LevelPackManager(packId, nickname)

    // Load pack data
    console.log('📦 Loading level pack data...')
    await packManager.loadLevelPack()

    // Load player progress
    console.log('💾 Loading player progress...')
    await packManager.loadProgress()

    // Increment play count
    await packManager.incrementPlayCount()

    console.log(`✅ Level Pack loaded: ${packManager.getPackName()}`)
    console.log(`📊 Starting at level ${packManager.getCurrentLevelNumber()}/${packManager.getTotalLevels()}`)

    // Get current level data
    const levelData = packManager.getCurrentLevel()

    // Store level data globally
    currentLevelData = levelData

    // Extract start and goal positions
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

    // Create game API instance
    gameAPI = new GameAPI('game-canvas', {
      width: 1024,
      height: 576,
      gravity: 0.5,
      fps: 60,
      goal_x: goalX,
      goal_y: goalY,
      start_x: startX,
      start_y: startY
    })

    // Disable leaderboard in pack mode (pack has its own completion tracking)
    gameAPI.getEngine().enableLeaderboard(false)
    console.log('🎮 Pack mode - leaderboard disabled')

    // Expose to global
    ;(window as any).gameAPI = gameAPI
    ;(window as any).GameAPI = gameAPI
    ;(window as any).MarioGameAPI = gameAPI

    console.log('✅ Game API initialized for pack mode')

    // Build the level
    await buildGameFromLevelData(levelData)

    // Create and render progress UI
    packProgressUI = new LevelPackProgressUI()
    packProgressUI.render(document.body, packManager)

    console.log('✅ Progress UI initialized')

    // Hide loading
    hideLoading()

    // Show speed selector
    console.log('🎮 Showing speed selector...')
    const speedSelector = new SpeedSelector()
    const selectedSpeed = await speedSelector.show()
    console.log(`⚡ Selected speed multiplier: ${selectedSpeed}x`)

    // Set player speed
    const player = gameAPI.getEngine().getPlayer()
    if (player) {
      player.setSpeedMultiplier(selectedSpeed)
      console.log(`✅ Player speed set to ${selectedSpeed}x`)
    }

    // Start level timer
    packManager.startLevelTimer()

    // Start game
    await gameAPI.startGame()

    console.log('🎮 Level pack game started successfully!')

  } catch (error) {
    console.error('❌ Failed to initialize pack mode:', error)
    alert(`Failed to load level pack: ${error}`)
  }
}

/**
 * Prompt player for nickname
 */
async function promptPlayerNickname(): Promise<string | null> {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(139, 92, 246, 0.95));
        padding: 40px 50px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 2px solid rgba(255, 255, 255, 0.2);
      ">
        <h2 style="
          color: white;
          font-size: 32px;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        ">Enter Your Nickname</h2>
        <p style="
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 30px;
          font-size: 16px;
        ">This will be used to save your progress</p>
        <input
          type="text"
          id="nickname-input"
          maxlength="20"
          placeholder="Your nickname..."
          style="
            width: 300px;
            padding: 15px;
            font-size: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.9);
            outline: none;
          "
        />
        <div>
          <button id="nickname-submit" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            background: white;
            color: #5b21b6;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s;
          ">Start Playing!</button>
        </div>
      </div>
    `

    document.body.appendChild(overlay)

    const input = overlay.querySelector('#nickname-input') as HTMLInputElement
    const submitBtn = overlay.querySelector('#nickname-submit') as HTMLButtonElement

    // Focus input
    input.focus()

    // Handle submit
    const handleSubmit = () => {
      const nickname = input.value.trim()
      if (nickname) {
        overlay.remove()
        resolve(nickname)
      } else {
        input.style.border = '2px solid #ef4444'
        setTimeout(() => {
          input.style.border = '2px solid rgba(255, 255, 255, 0.3)'
        }, 1000)
      }
    }

    submitBtn.addEventListener('click', handleSubmit)
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit()
    })

    // Hover effect
    submitBtn.addEventListener('mouseenter', () => {
      submitBtn.style.transform = 'scale(1.05)'
    })
    submitBtn.addEventListener('mouseleave', () => {
      submitBtn.style.transform = 'scale(1)'
    })
  })
}

async function buildGameFromLevelData(levelData: LevelData) {
  console.log('🏗️ Building game from level data...', levelData)

  // 清空现有关卡
  gameAPI.clearLevel()

  // 设置玩家起始位置（已在引擎初始化中设置，这里再次确认）
  if (levelData.starting_points && levelData.starting_points.length > 0) {
    const startPoint = levelData.starting_points[0]
    gameAPI.setPlayerStart(startPoint.coordinates[0], startPoint.coordinates[1])
    console.log(`👨 Player start set to: (${startPoint.coordinates[0]}, ${startPoint.coordinates[1]})`)
  } else {
    gameAPI.setPlayerStart(100, 400) // Default position
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

  // 添加钉刺（学习本地引擎逻辑）
  let spikeCount = 0
  if (levelData.spikes && levelData.spikes.length > 0) {
    levelData.spikes.forEach((spike, index) => {
      try {
        const [spikeX, spikeY] = spike.coordinates
        gameAPI.addSpike(spikeX, spikeY, 32) // Standard 32x32 spike
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

// 监听键盘事件
document.addEventListener('keydown', (event) => {
  switch(event.code) {
    case 'KeyP':
      if (gameAPI) {
        gameAPI.pauseGame()
        console.log('🎮 Game paused/resumed')
      }
      event.preventDefault()
      break
    case 'KeyR':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (confirm('Are you sure you want to restart the game?')) {
          location.reload()
        }
      }
      break
  }
})

// 监听游戏事件
window.addEventListener('gameWin', async (event: any) => {
  console.log('🎉 Game won!', event.detail)

  // ============================================================================
  // Level Pack Mode - Handle level progression
  // ============================================================================
  if (isPackMode && packManager && packProgressUI) {
    console.log('📦 Pack mode - handling level completion...')

    // Stop level timer and record stats
    packManager.stopLevelTimer()
    packManager.markCurrentLevelComplete()

    const currentLevel = packManager.getCurrentLevelNumber()
    const totalLevels = packManager.getTotalLevels()

    console.log(`✅ Level ${currentLevel}/${totalLevels} completed!`)

    // Update progress UI
    packProgressUI.update()

    // Check if pack is complete
    if (packManager.isPackComplete()) {
      console.log('🎉 Level Pack Complete!')

      // Show completion screen
      const stats = packManager.getStats()
      packProgressUI.showCompletionScreen(stats)

      return
    }

    // Move to next level
    const hasNext = await packManager.nextLevel()

    if (hasNext) {
      const nextLevelNum = packManager.getCurrentLevelNumber()

      // Show transition animation
      packProgressUI.showLevelTransition(currentLevel, nextLevelNum)

      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Load next level
      console.log(`📦 Loading level ${nextLevelNum}/${totalLevels}...`)
      const nextLevelData = packManager.getCurrentLevel()

      // Store level data
      currentLevelData = nextLevelData

      // Rebuild game with new level
      await buildGameFromLevelData(nextLevelData)

      // Update progress UI
      packProgressUI.update()

      // Reset and restart game
      gameAPI.resetGame()

      // Start level timer
      packManager.startLevelTimer()

      console.log(`✅ Level ${nextLevelNum} loaded and started!`)
    }

    return
  }

  // ============================================================================
  // Standard Single Level Mode
  // ============================================================================
  // Check if game is public to determine if score upload should be shown
  const isPublicGame = currentLevelData?.metadata?.is_public ?? false
  console.log('🔒 Game privacy check:', isPublicGame ? 'Public - Score upload available' : 'Private - No score upload')

  setTimeout(() => {
    let message = 'Congratulations! You completed the level!'

    if (isPublicGame) {
      // For public games, offer score upload option
      const uploadScore = confirm(message + '\n\nWould you like to upload your score to the leaderboard?')
      if (uploadScore) {
        // TODO: Implement score upload functionality here
        console.log('🏆 Uploading score to leaderboard...')
        // For now, just show a placeholder
        alert('Score upload functionality will be implemented here!')
      }
    } else {
      // For private games, no score upload option
      message += '\n\n(This is a private level - scores are not uploaded to leaderboards)'
    }

    // Always offer restart option
    setTimeout(() => {
      if (confirm(message + '\n\nRestart the game?')) {
        if (gameAPI) gameAPI.resetGame()
      }
    }, isPublicGame ? 2000 : 500) // Longer delay if score upload was shown
  }, 1000)
})

window.addEventListener('gameOver', (event: any) => {
  console.log('💀 Game over!', event.detail)

  // Record death in pack mode
  if (isPackMode && packManager && packProgressUI) {
    packManager.recordDeath()
    packProgressUI.update()
    console.log('💀 Death recorded in pack progress')
  }

  setTimeout(() => {
    if (confirm('Game over! Restart the game?')) {
      if (gameAPI) {
        gameAPI.resetGame()
        // Restart level timer in pack mode
        if (isPackMode && packManager) {
          packManager.startLevelTimer()
        }
      }
    }
  }, 1000)
})

// 页面可见性变化时自动暂停
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameAPI) {
    console.log('📱 Page hidden, pausing game')
    gameAPI.pauseGame()
  }
})

/**
 * Upload screenshot for the level if it doesn't have one
 * @param gameAPI - The game API instance
 * @param levelId - The level ID
 */
async function uploadScreenshotIfNeeded(gameAPI: GameAPI, levelId: number): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://25hackmit--hackmit25-backend.modal.run'

    // Check if screenshot already exists
    const checkResponse = await fetch(`${backendUrl}/api/db/level/${levelId}/screenshot`)
    const checkData = await checkResponse.json()

    if (checkData.has_screenshot && checkData.thumbnail_url) {
      console.log('📸 Screenshot already exists for this level, skipping upload')
      return
    }

    console.log('📸 No screenshot found, generating one...')

    // Wait 2 seconds for the game to fully render
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Capture screenshot
    const screenshot = gameAPI.getEngine().captureScreenshot('png')

    console.log('📤 Uploading screenshot to backend...')

    // Upload to backend
    const uploadResponse = await fetch(`${backendUrl}/api/db/level/${levelId}/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_base64: screenshot,
        use_imgur: true
      })
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    const uploadData = await uploadResponse.json()
    console.log('✅ Screenshot uploaded successfully:', uploadData.thumbnail_url)

  } catch (error) {
    console.error('❌ Failed to upload screenshot:', error)
    throw error
  }
}

// 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
})

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM loaded, initializing play game...')
  initializePlayGame()
})

// 如果DOM已经加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePlayGame)
} else {
  console.log('📱 DOM already loaded, initializing play game...')
  initializePlayGame()
}