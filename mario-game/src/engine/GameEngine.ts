import { Renderer } from './render/Renderer'
import { PhysicsEngine } from './physics/PhysicsEngine'
import { EntityManager } from './entities/EntityManager'
import { InputManager } from './input/InputManager'
import { Camera } from './render/Camera'
import { Level } from './level/Level'
import { type LevelData } from './LevelBuilder'
import { Player } from './entities/Player'
import { Platform } from './level/Platform'
import { Entity } from './entities/Entity'
import { SpriteLoader } from './sprites/SpriteLoader'
import { DialogManager } from './ui/DialogManager'
import { DialogGenerator } from './ui/DialogGenerator'
import { MobileDetector } from '../utils/MobileDetector'
import { VictoryModal, type VictoryData } from '../ui/VictoryModal'

export interface GameConfig {
  width?: number
  height?: number
  gravity?: number
  fps?: number
  goal_x?: number
  goal_y?: number
  start_x?: number
  start_y?: number
}

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private renderer: Renderer
  private physics: PhysicsEngine
  private entityManager: EntityManager
  private inputManager: InputManager
  private camera: Camera
  private currentLevel: Level | null = null
  private player: Player | null = null
  private dialogManager: DialogManager

  private running = false
  private paused = false
  private victoryState = false  // Add victory state flag
  private lastTime = 0
  private deltaTime = 0
  private fps = 60
  private frameInterval: number

  private elapsed_time = 0
  private num_deaths = 0
  private coins = 0
  private spriteLoader: SpriteLoader
  private dialogGenerator: DialogGenerator
  private goal_x
  private goal_y
  private start_x
  private start_y
  private mobileDetector: MobileDetector
  // @ts-ignore - Used for external API compatibility
  private levelData: LevelData | null = null
  private spritesInitialized = false
  private lastDialogCheck = 0
  private dialogCheckInterval = 10000 // Check every 15 seconds
  private victoryModal: VictoryModal
  private currentLevelId: number = 1 // Default level ID
  private leaderboardEnabled: boolean = false // Whether leaderboard is enabled

  constructor(canvas: HTMLCanvasElement, config: GameConfig = {}) {
    this.canvas = canvas
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas')
    }
    this.ctx = context

    // Set canvas size
    this.canvas.width = config.width || 1024
    this.canvas.height = config.height || 576

    // Initialize subsystems
    this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height)
    this.physics = new PhysicsEngine(config.gravity || 0.5)
    this.entityManager = new EntityManager()
    this.inputManager = new InputManager()
    this.camera = new Camera(this.canvas.width, this.canvas.height)
    this.spriteLoader = SpriteLoader.getInstance()
    this.dialogManager = new DialogManager()
    this.dialogGenerator = new DialogGenerator(this.dialogManager)
    this.victoryModal = new VictoryModal()

    // Configure physics engine for optimal performance
    this.configurePhysicsEngine()
    this.mobileDetector = MobileDetector.getInstance()

    this.fps = config.fps || 60
    this.frameInterval = 1000 / this.fps

    this.goal_x = config.goal_x
    this.goal_y = config.goal_y
    this.start_x = config.start_x
    this.start_y = config.start_y

    // Configure mobile-specific settings
    this.configureMobileOptimizations()

    // Setup default demo level
    // this.setupDemoLevel()
  }

  /**
   * Configure physics engine with optimized settings
   */
  private configurePhysicsEngine() {
    // Set optimal physics parameters for both play and embed modes
    this.physics.setFriction(0.85)  // Good balance for control
    this.physics.setMaxVelocity(15, 20)  // Reasonable speed limits
    console.log('🔧 Physics engine configured with optimal settings:')
    console.log('  - Friction: 0.85')
    console.log('  - Max velocity: 15x, 20y')
    console.log('  - Gravity:', this.physics.getGravity())
  }

  /**
   * Configure mobile-specific optimizations
   */
  private configureMobileOptimizations() {
    // 总是调整画布尺寸以适应设备
    this.adjustCanvasSize()
    
    // 如果是触摸设备，启用虚拟控制器
    if (this.mobileDetector.shouldShowVirtualControls) {
      console.log('Configuring mobile optimizations for device:', this.mobileDetector.getDeviceType())
      
      // Enable virtual gamepad
      if (this.inputManager) {
        setTimeout(() => {
          this.inputManager.showVirtualGamepad()
        }, 100)
      }
    }
    
    // 监听窗口大小变化
    this.setupResizeListener()
  }
  
  /**
   * 调整画布尺寸以充分利用屏幕空间
   */
  private adjustCanvasSize() {
    const recommendedSize = this.mobileDetector.getRecommendedCanvasSize()
    
    // 设置画布尺寸
    this.canvas.width = recommendedSize.width
    this.canvas.height = recommendedSize.height
    
    // 更新渲染器和摄像机
    this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height)
    this.camera = new Camera(this.canvas.width, this.canvas.height)
    
    console.log(`Canvas size adjusted to: ${this.canvas.width}x${this.canvas.height}`)
  }
  
  /**
   * 设置窗口大小变化监听器
   */
  private setupResizeListener() {
    let resizeTimeout: number
    
    window.addEventListener('resize', () => {
      // 防抖处理，避免频繁调整
      clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(() => {
        console.log('Window resized, adjusting canvas...')
        this.adjustCanvasSize()
      }, 250)
    })
    
    // 监听设备方向变化
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        console.log('Orientation changed, adjusting canvas...')
        this.adjustCanvasSize()
      }, 500) // 等待方向变化完成
    })
  }

  public loadLevel(level: Level) {
    this.currentLevel = level
    // Store player reference before clearing
    const currentPlayer = this.player
    this.entityManager.clear()

    // Load level entities first
    level.getEntities().forEach(entity => {
      this.entityManager.addEntity(entity)
    })

    // Always add player back if exists (avoid duplicate adds)
    if (currentPlayer && !this.entityManager.getEntities().includes(currentPlayer)) {
      this.entityManager.addEntity(currentPlayer)
    }
  }

  public setLevelData(data: LevelData) {
    this.levelData = data
    // Store for API compatibility, currently not used internally
  }

  public async initialize() {
    if (!this.spritesInitialized) {
      console.log('Loading sprites...')
      try {
        await this.spriteLoader.initializeGameSprites()
        this.spritesInitialized = true
        console.log('Sprites loaded!')
      } catch (error) {
        console.warn('Failed to load sprites, falling back to basic rendering:', error)
        this.spritesInitialized = false
      }
    }
  }

  public async start() {
    if (this.running) return

    // Initialize sprites first
    await this.initialize()

    this.running = true
    this.paused = false
    this.lastTime = performance.now()
    this.gameLoop()
  }

  // Getters for debug access
  public getCurrentLevel() {
    return this.currentLevel
  }

  public getEntityManager() {
    return this.entityManager
  }

  public getInputManager() {
    return this.inputManager
  }

  public getMobileDetector() {
    return this.mobileDetector
  }

  public pause() {
    this.paused = !this.paused
  }

  public reset() {
    this.running = false
    this.paused = false
    this.num_deaths = 0
    this.elapsed_time = 0
    this.coins = 0
    this.entityManager.clear()
    this.currentLevel?.entities.forEach((entity) => {
      entity.dead = false
    });

    this.player?.setPos(this.start_x!, this.start_y!)

    // Don't re-add coins here - they should already be in the level from initial build

    this.loadLevel(this.currentLevel!)
    this.victoryState = false  // Reset victory state
    this.updateUI()
  }

  private gameLoop = () => {
    // Check for restart key in victory state
    if (this.victoryState && this.inputManager.isKeyPressed('KeyR')) {
      this.reset()
      this.start()
      return
    }

    // if (!this.running) return

    const currentTime = performance.now()
    const elapsed = currentTime - this.lastTime

    if (elapsed > this.frameInterval) {
      this.deltaTime = elapsed / 1000 // Convert to seconds

      if (!this.paused) {
        if (!this.victoryState) {
          this.update(this.deltaTime)
        }
        this.render()
      }

      this.lastTime = currentTime - (elapsed % this.frameInterval)
    }

    requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number) {

    // // Don't update game logic if in victory state
    // if (this.victoryState) {
    //   return
    // }

    // IMPORTANT: Update entity manager to process pending adds/removes
    this.entityManager.update()

    if (!this.victoryState) {
      this.elapsed_time += dt
    }
    // Update input
    const input = this.inputManager.getInput()

    // Update player with input
    if (this.player) {
      this.player.handleInput(input)
    }

    // Update physics for all entities
    const entities = this.entityManager.getEntities()
    const platforms = this.currentLevel?.getPlatforms() || []
    const polygons = this.currentLevel?.getPolygons() || []

    entities.forEach(entity => {
      this.physics.updateEntity(entity, dt, platforms, polygons)
    })

    // Check collisions
    this.checkCollisions()

    // Update entities
    entities.forEach(entity => {
      entity.update(dt)
      // Apply world boundaries
      this.enforceWorldBoundaries(entity)
    })

    // Update camera to follow player
    if (this.player) {
      this.camera.follow(this.player)
    }

    // Update dialogs
    this.dialogManager.update()

    // Check for teasing dialog opportunities every 10 seconds
    const currentTime = Date.now()
    if (currentTime - this.lastDialogCheck > this.dialogCheckInterval) {
      this.lastDialogCheck = currentTime
      // Fire-and-forget to avoid blocking the game loop
      this.checkForTeasingDialogs().catch(error => {
        console.warn('Error checking for teasing dialogs:', error)
      })
    }

    // Remove dead entities
    this.entityManager.removeDeadEntities()

    // Update UI
    this.updateUI()
  }

  private checkCollisions() {
    const entities = this.entityManager.getEntities()
    const polygons = this.currentLevel?.getPolygons() || []

    // Note: Basic platform collisions are now handled by Swept AABB in updateEntity
    // We only need additional collision checks here

    // Check entity vs polygon collisions (still needed for complex shapes)
    entities.forEach(entity => {
      polygons.forEach(polygon => {
        this.physics.checkPolygonCollision(entity, polygon)
      })
    })

    // Check player vs other entities
    if (this.player) {
      entities.forEach(entity => {
        if (entity !== this.player && this.player && this.physics.checkEntityCollision(this.player, entity)) {
          this.handlePlayerCollision(entity)
        }
      })

      // Check for victory condition (player reaching goal coordinates)
      if (this.goal_x !== undefined && this.goal_y !== undefined) {
        const playerReachedGoal = this.checkPlayerGoalOverlap(this.player!)
        if (playerReachedGoal) {
          console.log('🎉 Victory condition triggered!')
          // Fire-and-forget to avoid blocking the game loop
          this.victory().catch(error => {
            console.warn('Error showing victory quote:', error)
          })
        }
      }
    }
  }

  private checkPlayerGoalOverlap(player: Player): boolean {
    if (this.goal_x === undefined || this.goal_y === undefined) return false
    
    // Check if player overlaps with goal coordinates (assuming goal has a 32x32 area)
    const goalSize = 32 // Default goal area size
    return player.position.x < this.goal_x + goalSize &&
           player.position.x + player.width > this.goal_x &&
           player.position.y < this.goal_y + goalSize &&
           player.position.y + player.height > this.goal_y
  }

  private enforceWorldBoundaries(entity: Entity) {
    const worldWidth = 3000  // Match the ground width
    const worldHeight = 600  // Allow some space above and below

    // Store if collision occurred to prevent momentum issues
    let collisionOccurred = false

    // Horizontal boundaries - use similar logic to platform collision
    if (entity.position.x < 0) {
      // Check if entity was moving from inside the world
      const prevX = entity.previousPosition ? entity.previousPosition.x : entity.position.x - entity.velocity.x
      if (prevX >= 0) {
        // Entity was inside and moved out - proper collision
        entity.position.x = 0
        entity.velocity.x = 0  // Completely stop horizontal movement
        collisionOccurred = true
      } else {
        // Entity was already outside - just clamp position
        entity.position.x = 0
        entity.velocity.x = Math.max(0, entity.velocity.x)
      }
    } else if (entity.position.x + entity.width > worldWidth) {
      // Check if entity was moving from inside the world
      const prevX = entity.previousPosition ? entity.previousPosition.x : entity.position.x - entity.velocity.x
      if (prevX + entity.width <= worldWidth) {
        // Entity was inside and moved out - proper collision
        entity.position.x = worldWidth - entity.width
        entity.velocity.x = 0  // Completely stop horizontal movement
        collisionOccurred = true
      } else {
        // Entity was already outside - just clamp position
        entity.position.x = worldWidth - entity.width
        entity.velocity.x = Math.min(0, entity.velocity.x)
      }
    }

    // If collision occurred, also update previous position to prevent oscillation
    if (collisionOccurred && entity.previousPosition) {
      entity.previousPosition.x = entity.position.x
    }

    // Vertical boundaries (mainly for falling off the world)
    if (entity.position.y > worldHeight + 100) {
      // Entity fell off the world
      if (entity.type === 'player') {
        this.playerHit() // Player loses a life
      } else {
        entity.dead = true // Other entities just die
      }
    }
  }

  private handlePlayerCollision(entity: any) {
    if (!entity || !this.player) return
    
    if (entity.type === 'coin') {
      this.coins++
      entity.dead = true
    } else if (entity.type === 'enemy') {
      // Special handling for spike enemies - they always damage the player
      if (entity.enemyType === 'spike') {
        this.playerHit()
        return
      }
      
      if (this.player.velocity.y > 0 && this.player.position.y < entity.position.y) {
        // Player jumping on enemy
        entity.dead = true
        this.player.velocity.y = -10 // Bounce
      } else {
        // Player hit by enemy
        this.playerHit()
      }
    } else if (entity.type === 'powerup') {
      this.handlePowerUp(entity.powerType)
      entity.dead = true
    }
  }

  private playerHit() {
    if (!this.player || this.player.invulnerable) return

    if (this.player.size === 'big') {
      this.player.shrink()
    } else {
      this.num_deaths++
      this.respawnPlayer()
    }
  }

  private respawnPlayer() {
    if (this.player) {
      // Use the level's designated starting position instead of hardcoded values
      this.player.position.x = this.start_x ?? 100
      this.player.position.y = this.start_y ?? 400
      this.player.velocity.x = 0
      this.player.velocity.y = 0
      this.player.makeInvulnerable(2000) // 2 seconds invulnerability

      console.log(`🔄 Player respawned at (${this.player.position.x}, ${this.player.position.y})`)
    }
  }

  private handlePowerUp(type: string) {
    if (!this.player) return
    
    switch(type) {
      case 'mushroom':
        this.player.grow()
        // this.score += 50
        break
      case 'star':
        this.player.makeInvulnerable(10000) // 10 seconds
        // this.score += 100
        break
      case 'flower':
        this.player.enableFireball()
        // this.score += 50
        break
    }
  }

  // private gameOver() {
  //   this.running = false
  //   console.log('Game Over! Score:', this.score)
  //   // TODO: Show game over screen
  // }

  private async victory() {
    this.running = false
    this.victoryState = true  // Set victory state instead of stopping everything

    // Calculate final score
    const finalScore = Math.max(
      0,
      1000 + this.coins * 1000 - this.num_deaths * 200 + Math.floor(1000 * Math.exp(-0.05 * this.elapsed_time))
    )

    console.log('🎉 Victory! Time elapsed: ', this.elapsed_time, ' Number of deaths: ', this.num_deaths, ' Coins: ', this.coins, ' Score: ', finalScore)

    // Generate and display teasing victory quote first
    await this.dialogGenerator.showVictoryQuote(
      this.num_deaths,
      this.elapsed_time,
      this.coins
    )

    // Prepare victory data for the modal
    const victoryData: VictoryData = {
      completionTime: Math.round(this.elapsed_time * 1000), // Convert to milliseconds
      deaths: this.num_deaths,
      coins: this.coins,
      score: finalScore,
      levelId: this.currentLevelId
    }

    // Show victory modal only if leaderboard is enabled
    if (this.leaderboardEnabled) {
      await this.victoryModal.show(victoryData, {
        onClose: () => {
          console.log('Victory modal closed')
        },
        onRestart: () => {
          console.log('Restarting game...')
          this.reset()
          this.start()
        }
      })
    } else {
      console.log('🎉 Victory! Leaderboard disabled for this mode.')
    }
  }

  private render() {
    // Clear canvas
    this.renderer.clear()

    const formattedTime = this.elapsed_time.toFixed(2)
    const score = Math.max(
      0,
      1000 + this.coins * 1000 - this.num_deaths * 200 + Math.floor(1000 * Math.exp(-0.05 * this.elapsed_time))
    )

    // If in victory state, show victory screen instead of normal rendering
    if (this.victoryState) {
      this.ctx.save()
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = '#FFD700'
      this.ctx.font = 'bold 48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('🎉 VICTORY! 🎉', this.canvas.width / 2, this.canvas.height / 2 - 80)

      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = '32px Arial'
      this.ctx.fillText(
        `Time: ${formattedTime}s | Deaths: ${this.num_deaths} | Coins: ${this.coins}`,
        this.canvas.width / 2,
        this.canvas.height / 2 - 20
      )

      this.ctx.font = '32px Arial'
      this.ctx.fillStyle = '#00FF00'
      this.ctx.fillText(
        `Score: ${score}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 30
      )

      this.ctx.font = '20px Arial'
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 70)
      this.ctx.restore()
      return  // Don't render the normal game
    }

    // Ensure entity manager is up to date before rendering
    this.entityManager.update()

    // Apply camera transform
    this.ctx.save()
    // this.ctx.translate(-this.camera.x, -this.camera.y)

    // Render background
    this.renderer.renderBackground()

    // Render level
    if (this.currentLevel) {
      this.renderer.renderLevel(this.currentLevel)
    }

    // Render entities
    const entities = this.entityManager.getEntities()

    // Debug: Log entity count
    if (entities.length === 0) {
      console.warn('No entities to render!')
    }

    entities.forEach(entity => {
      this.renderer.renderEntity(entity)
    })

    this.ctx.restore()

    // Render dialogs (not affected by camera)
    const activeDialogs = this.dialogManager.getActiveDialogs()
    activeDialogs.forEach(dialog => {
      this.renderer.renderDialog(dialog)
    })

    // Render UI (not affected by camera)
    this.renderer.renderUI({
      elapsed_time: this.elapsed_time,
      num_deaths: this.num_deaths,
      coins: this.coins
    })
  }

  private updateUI() {
    const elapsed_timeEl = document.getElementById('elapsed_time')
    const num_deathsEl = document.getElementById('num_deaths')
    const coinsEl = document.getElementById('coins')

    if (elapsed_timeEl) elapsed_timeEl.textContent = this.elapsed_time.toString()
    if (num_deathsEl) num_deathsEl.textContent = this.num_deaths.toString()
    if (coinsEl) coinsEl.textContent = this.coins.toString()
  }

  private async checkForTeasingDialogs(): Promise<void> {
    // Only check if we have a player and goal position
    if (!this.player || this.goal_x === undefined || this.goal_y === undefined) {
      return
    }

    // Don't show dialogs if we're in victory state
    if (this.victoryState) {
      return
    }

    const playerPos = this.getPlayerPosition()
    if (!playerPos) return

    // Generate teasing dialog based on game conditions
    await this.dialogGenerator.showTeasingQuote(
      this.num_deaths,
      this.elapsed_time,
      playerPos,
      { x: this.goal_x, y: this.goal_y }
    )
  }

  // Public API methods
  public getPhysicsEngine() { return this.physics }
  public getCamera() { return this.camera }
  public getPlayer() { return this.player }
  public setPlayer(player: Player) {
    // Remove existing player if any
    if (this.player) {
      this.entityManager.removeEntity(this.player)
    }
    this.player = player
    this.entityManager.addEntity(player)
  }
  // public addScore(points: number) { this.score += points }
  public addCoin() { this.coins++ }
  // public addLife() { this.lives++ }
  // public getScore(): number { return this.score }
  // public getLives(): number { return this.lives }
  public getCoins(): number { return this.coins }
  public getPlatforms(): Platform[] {
    return this.currentLevel ? this.currentLevel.getPlatforms() : []
  }
  public getEntities(): Entity[] {
    return this.entityManager.getEntities()
  }
  public setGoal(x: number, y: number) {
    this.goal_x = x
    this.goal_y = y
  }

  public setStartPosition(x: number, y: number) {
    this.start_x = x
    this.start_y = y
    console.log(`🎯 Player start position updated to (${x}, ${y})`)
  }

  public setLevelId(levelId: number) {
    this.currentLevelId = levelId
  }

  public enableLeaderboard(enabled: boolean = true) {
    this.leaderboardEnabled = enabled
    console.log(`🏆 Leaderboard ${enabled ? 'enabled' : 'disabled'}`)
  }

  public isLeaderboardEnabled(): boolean {
    return this.leaderboardEnabled
  }

  // Dialog management methods
  public getDialogManager(): DialogManager {
    return this.dialogManager
  }

  public getDialogGenerator(): DialogGenerator {
    return this.dialogGenerator
  }

  public addDialog(text: string, x: number, y: number, type: 'teasing' | 'story' | 'info' = 'teasing'): void {
    this.dialogManager.addDialog(text, x, y, type)
  }

  public clearDialogs(): void {
    this.dialogManager.clearDialogs()
  }

  public getElapsedTime(): number {
    return this.elapsed_time
  }

  public getNumDeaths(): number {
    return this.num_deaths
  }

  public getPlayerPosition(): { x: number, y: number } | null {
    if (this.player) {
      return { x: this.player.position.x, y: this.player.position.y }
    }
    return null
  }

  // Text-to-speech control methods
  public setTTSEnabled(enabled: boolean): void {
    this.dialogManager.setTTSEnabled(enabled)
  }

  public isTTSEnabled(): boolean {
    return this.dialogManager.isTTSEnabled()
  }

  public stopTTS(): void {
    this.dialogManager.stopTTS()
  }

  // Screenshot functionality
  /**
   * Capture a screenshot of the current game canvas
   * @param format - Image format ('png' or 'jpeg')
   * @param quality - JPEG quality (0-1), only used for JPEG format
   * @returns Base64 encoded image data URL
   */
  public captureScreenshot(format: 'png' | 'jpeg' = 'png', quality: number = 0.95): string {
    try {
      if (format === 'jpeg') {
        return this.canvas.toDataURL('image/jpeg', quality)
      } else {
        return this.canvas.toDataURL('image/png')
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      throw new Error('Screenshot capture failed')
    }
  }

  /**
   * Capture screenshot and return as Blob (useful for uploads)
   * @param format - Image format ('png' or 'jpeg')
   * @param quality - JPEG quality (0-1), only used for JPEG format
   * @returns Promise<Blob>
   */
  public async captureScreenshotBlob(format: 'png' | 'jpeg' = 'png', quality: number = 0.95): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
        this.canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        }, mimeType, quality)
      } catch (error) {
        reject(error)
      }
    })
  }
}