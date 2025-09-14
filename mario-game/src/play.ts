import './style.css'
import { GameAPI } from './engine'
import { LevelLoader, type LevelData } from './levelLoader'

console.log('🎮 Mario Game Play Mode - Starting...')

let gameAPI: GameAPI

// 隐藏加载状态
function hideLoading() {
  const loading = document.getElementById('loading')
  if (loading) loading.style.display = 'none'
}

// 显示错误
function showError(message: string) {
  hideLoading()
  const error = document.getElementById('error')
  const errorMessage = document.getElementById('error-message')
  if (error && errorMessage) {
    error.style.display = 'block'
    errorMessage.textContent = message
  }
}

async function initializePlayGame() {
  try {
    console.log('🔧 Initializing play game...')

    // 检查必要的DOM元素
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
    if (!canvas) {
      throw new Error('Game canvas not found')
    }

    // 创建游戏API实例
    gameAPI = new GameAPI('game-canvas', {
      width: 1024,
      height: 576,
      gravity: 0.5,
      fps: 60
    })

    // 暴露给全局（用于调试和UI控制）
    ;(window as any).gameAPI = gameAPI

    console.log('✅ Game API initialized')

    // 从URL参数获取API URL（如果有）
    const urlParams = new URLSearchParams(window.location.search)
    const apiUrl = urlParams.get('api') || urlParams.get('apiUrl')

    if (apiUrl) {
      console.log(`🔧 Using API URL: ${apiUrl}`)
      LevelLoader.setApiBaseUrl(apiUrl)
    }

    // 加载关卡数据
    console.log('📋 Loading level data...')
    const levelData = await LevelLoader.loadLevelData(apiUrl || undefined)

    // 构建关卡
    await buildGameFromLevelData(levelData)

    // 隐藏加载状态
    hideLoading()

    // 启动游戏
    await gameAPI.startGame()

    console.log('🎮 Play game started successfully!')

    // 显示关卡信息
    showLevelInfo(levelData)

  } catch (error) {
    console.error('❌ Failed to initialize play game:', error)
    showError(error instanceof Error ? error.message : '初始化失败')
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

  // 添加终点（目标管道）
  if (levelData.end_points && levelData.end_points.length > 0) {
    const endPoint = levelData.end_points[0]
    gameAPI.addGoalPipe(endPoint.coordinates[0], endPoint.coordinates[1])
    console.log(`🏁 Goal pipe added at: (${endPoint.coordinates[0]}, ${endPoint.coordinates[1]})`)
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
  console.log(`✅ Level built: ${polygonCount} platforms, ${coinCount} coins, ${enemyCount} enemies`)
}

function showLevelInfo(levelData: LevelData) {
  const infoPanel = document.querySelector('.info-panel')
  if (!infoPanel) return

  // 创建关卡信息元素
  const levelInfoDiv = document.createElement('div')
  levelInfoDiv.innerHTML = `
    <h3 style="margin-top: 20px;">📊 关卡信息</h3>
    <p><strong>平台数量:</strong> ${levelData.rigid_bodies?.length || 0}</p>
    <p><strong>金币数量:</strong> ${levelData.coins?.length || 0}</p>
    <p><strong>敌人数量:</strong> ${levelData.enemies?.length || 0}</p>
    <p><strong>起始点:</strong> ${levelData.starting_points?.length || 0}</p>
    <p><strong>终点:</strong> ${levelData.end_points?.length || 0}</p>
  `

  infoPanel.appendChild(levelInfoDiv)
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
        if (confirm('确定要重启游戏吗？')) {
          location.reload()
        }
      }
      break
  }
})

// 监听游戏事件
window.addEventListener('gameWin', (event: any) => {
  console.log('🎉 Game won!', event.detail)
  setTimeout(() => {
    if (confirm('恭喜通关！是否重新开始？')) {
      if (gameAPI) gameAPI.resetGame()
    }
  }, 1000)
})

window.addEventListener('gameOver', (event: any) => {
  console.log('💀 Game over!', event.detail)
  setTimeout(() => {
    if (confirm('游戏结束！是否重新开始？')) {
      if (gameAPI) gameAPI.resetGame()
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

// 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason)
  showError('游戏运行出错: ' + (event.reason?.message || '未知错误'))
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