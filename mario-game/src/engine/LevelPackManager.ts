/**
 * Level Pack Manager
 * Manages multi-level gameplay flow and player progress
 */

export interface LevelData {
  starting_points: Array<{
    coordinates: [number, number]
  }>
  end_points: Array<{
    coordinates: [number, number]
  }>
  rigid_bodies: Array<{
    contour_points: Array<[number, number]>
  }>
  coins?: Array<{
    x: number
    y: number
  }>
  enemies?: Array<{
    x: number
    y: number
    type: string
  }>
  spikes?: Array<{
    coordinates: [number, number]
  }>
  metadata?: {
    is_public: boolean
    level_id: string
    title?: string
  }
}

export interface LevelPackData {
  pack: {
    id: number
    name: string
    description: string
    total_levels: number
    thumbnail_url: string | null
    created_by: string
  }
  levels: Array<{
    id: number
    name: string
    data: any
    order_index: number
  }>
  stats: {
    likes_count: number
    plays_count: number
    completion_count: number
  }
}

export interface PlayerProgress {
  pack_id: number
  player_nickname: string
  current_level_index: number
  completed_levels: number[]
  total_time_ms: number
  total_deaths: number
  completed: boolean
}

export class LevelPackManager {
  private packId: number
  private playerNickname: string
  private packData: LevelPackData | null = null
  private currentLevelIndex: number = 0
  private completedLevels: number[] = []
  private totalTimeMs: number = 0
  private totalDeaths: number = 0
  private levelStartTime: number = 0
  private backendUrl: string

  constructor(packId: number, nickname: string) {
    this.packId = packId
    this.playerNickname = nickname
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://25hackmit--hackmit25-backend.modal.run'
  }

  /**
   * Load level pack data from backend
   */
  async loadLevelPack(): Promise<void> {
    try {
      console.log(`📦 Loading level pack ${this.packId}...`)

      const response = await fetch(`${this.backendUrl}/api/level-packs/${this.packId}`)

      if (!response.ok) {
        throw new Error(`Failed to load level pack: ${response.status}`)
      }

      this.packData = await response.json()

      console.log(`✅ Level pack loaded: ${this.packData?.pack.name}`)
      console.log(`📊 Total levels: ${this.packData?.pack.total_levels}`)

      return Promise.resolve()
    } catch (error) {
      console.error('❌ Error loading level pack:', error)
      throw error
    }
  }

  /**
   * Load player progress from backend
   */
  async loadProgress(): Promise<void> {
    try {
      console.log(`💾 Loading progress for ${this.playerNickname}...`)

      const response = await fetch(
        `${this.backendUrl}/api/level-packs/${this.packId}/progress/${this.playerNickname}`
      )

      if (!response.ok) {
        console.warn('No existing progress found, starting fresh')
        return
      }

      const progress: PlayerProgress = await response.json()

      this.currentLevelIndex = progress.current_level_index || 0
      this.completedLevels = progress.completed_levels || []
      this.totalTimeMs = progress.total_time_ms || 0
      this.totalDeaths = progress.total_deaths || 0

      console.log(`✅ Progress loaded: Level ${this.currentLevelIndex + 1}/${this.getTotalLevels()}`)
      console.log(`   Completed: ${this.completedLevels.length} levels`)

      return Promise.resolve()
    } catch (error) {
      console.error('⚠️ Error loading progress:', error)
      // Don't throw - just start fresh
    }
  }

  /**
   * Save current progress to backend
   */
  async saveProgress(): Promise<void> {
    try {
      const progressData = {
        player_nickname: this.playerNickname,
        current_level_index: this.currentLevelIndex,
        completed_levels: this.completedLevels,
        total_time_ms: this.totalTimeMs,
        total_deaths: this.totalDeaths
      }

      const response = await fetch(
        `${this.backendUrl}/api/level-packs/${this.packId}/progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(progressData)
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to save progress: ${response.status}`)
      }

      const result = await response.json()
      console.log(`💾 Progress saved${result.completed ? ' - Pack completed! 🎉' : ''}`)

      return Promise.resolve()
    } catch (error) {
      console.error('❌ Error saving progress:', error)
      // Don't throw - progress save failure shouldn't break game
    }
  }

  /**
   * Get current level data
   */
  getCurrentLevel(): LevelData {
    if (!this.packData || !this.packData.levels[this.currentLevelIndex]) {
      throw new Error('Level pack not loaded or invalid level index')
    }

    const level = this.packData.levels[this.currentLevelIndex]

    return level.data as LevelData
  }

  /**
   * Get current level number (1-based for display)
   */
  getCurrentLevelNumber(): number {
    return this.currentLevelIndex + 1
  }

  /**
   * Get total number of levels
   */
  getTotalLevels(): number {
    return this.packData?.pack.total_levels || 0
  }

  /**
   * Get pack name
   */
  getPackName(): string {
    return this.packData?.pack.name || 'Level Pack'
  }

  /**
   * Get completion percentage (0-100)
   */
  getProgress(): number {
    const total = this.getTotalLevels()
    if (total === 0) return 0

    return Math.floor((this.completedLevels.length / total) * 100)
  }

  /**
   * Move to next level
   * @returns true if there is a next level, false if pack is complete
   */
  async nextLevel(): Promise<boolean> {
    const totalLevels = this.getTotalLevels()

    if (this.currentLevelIndex >= totalLevels - 1) {
      // All levels completed
      console.log('🎉 All levels completed!')
      await this.saveProgress()
      return false
    }

    this.currentLevelIndex++
    console.log(`➡️ Moving to level ${this.getCurrentLevelNumber()}/${totalLevels}`)

    await this.saveProgress()

    return true
  }

  /**
   * Go back to previous level (for retry/practice)
   */
  previousLevel(): void {
    if (this.currentLevelIndex > 0) {
      this.currentLevelIndex--
      console.log(`⬅️ Moving back to level ${this.getCurrentLevelNumber()}`)
    }
  }

  /**
   * Mark current level as completed
   */
  markCurrentLevelComplete(): void {
    const currentLevelId = this.currentLevelIndex
    if (!this.completedLevels.includes(currentLevelId)) {
      this.completedLevels.push(currentLevelId)
      console.log(`✓ Level ${this.getCurrentLevelNumber()} completed!`)
    }
  }

  /**
   * Check if pack is fully completed
   */
  isPackComplete(): boolean {
    return this.completedLevels.length >= this.getTotalLevels()
  }

  /**
   * Record a death
   */
  recordDeath(): void {
    this.totalDeaths++
  }

  /**
   * Record time for current level
   */
  recordLevelTime(timeMs: number): void {
    this.totalTimeMs += timeMs
  }

  /**
   * Start timing for current level
   */
  startLevelTimer(): void {
    this.levelStartTime = Date.now()
  }

  /**
   * Stop timing and record time
   */
  stopLevelTimer(): void {
    if (this.levelStartTime > 0) {
      const elapsed = Date.now() - this.levelStartTime
      this.recordLevelTime(elapsed)
      this.levelStartTime = 0
    }
  }

  /**
   * Get statistics for display
   */
  getStats(): {
    packName: string
    currentLevel: number
    totalLevels: number
    completed: number
    progress: number
    totalTime: string
    totalDeaths: number
    isComplete: boolean
  } {
    const totalSeconds = Math.floor(this.totalTimeMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return {
      packName: this.getPackName(),
      currentLevel: this.getCurrentLevelNumber(),
      totalLevels: this.getTotalLevels(),
      completed: this.completedLevels.length,
      progress: this.getProgress(),
      totalTime: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      totalDeaths: this.totalDeaths,
      isComplete: this.isPackComplete()
    }
  }

  /**
   * Get level status array for UI display
   */
  getLevelStatuses(): Array<'completed' | 'current' | 'locked'> {
    const total = this.getTotalLevels()
    const statuses: Array<'completed' | 'current' | 'locked'> = []

    for (let i = 0; i < total; i++) {
      if (this.completedLevels.includes(i)) {
        statuses.push('completed')
      } else if (i === this.currentLevelIndex) {
        statuses.push('current')
      } else {
        statuses.push('locked')
      }
    }

    return statuses
  }

  /**
   * Increment pack play count
   */
  async incrementPlayCount(): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/level-packs/${this.packId}/stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plays_count: 1
        })
      })
    } catch (error) {
      console.warn('Failed to increment play count:', error)
    }
  }
}
