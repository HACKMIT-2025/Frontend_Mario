/**
 * 排行榜系统客户端
 * 提供与后端排行榜API的交互功能
 */

export interface Player {
  id: number
  nickname: string
  email?: string
  country_code?: string
  avatar_url?: string
  created_at?: string
}

export interface ScoreSubmission {
  level_id: number
  player_nickname: string
  completion_time_ms: number
  score?: number
  deaths_count?: number
  coins_collected?: number
  attempts_count?: number
}

export interface LeaderboardEntry {
  rank: number
  record_id: number
  level: {
    id: number
    name: string
    difficulty: string
  }
  player: {
    id: number
    nickname: string
    country_code?: string
  }
  performance: {
    completion_time_ms: number
    completion_time_formatted: string
    score: number
    deaths_count: number
    coins_collected: number
    is_perfect_run: boolean
  }
  played_at: string
}

export interface PlayerRecord {
  level: {
    id: number
    name: string
    difficulty: string
  }
  best_performance: {
    time_ms: number
    time_formatted: string
    score: number
    deaths_count: number
    coins_collected: number
    is_perfect_run: boolean
  }
  rankings: {
    time_rank: number
    score_rank: number
  }
  statistics: {
    total_attempts: number
    total_completions: number
    completion_rate: number
  }
  timeline: {
    first_completion: string | null
    last_played: string
  }
}

export interface GlobalPlayer {
  rank: number
  player: {
    id: number
    nickname: string
    country_code?: string
  }
  statistics: {
    levels_completed: number
    total_best_score: number
    avg_best_time: number
    avg_best_time_formatted: string
    total_attempts: number
    perfect_runs_count: number
  }
}

export interface LevelStats {
  level: {
    id: number
    name: string
    difficulty: string
  }
  statistics: {
    total_attempts: number
    unique_players: number
    completion_rate: number
    average_time: {
      ms: number
      formatted: string
    }
    best_time: {
      ms: number
      formatted: string
    }
    best_score: number
    average_score: number
    average_deaths: number
    perfect_runs: {
      count: number
      percentage: number
    }
    average_coins_collected: number
  }
}

export class LeaderboardClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // 使用环境变量或默认值
    this.baseUrl = baseUrl || import.meta.env.VITE_BACKEND_URL || 'https://25hackmit--hackmit25-backend.modal.run'
  }

  // ============================================================================
  // 玩家管理
  // ============================================================================

  /**
   * 创建或获取玩家信息
   */
  async createPlayer(playerData: {
    nickname: string
    email?: string
    country_code?: string
    avatar_url?: string
  }): Promise<{ success: boolean; player: Player; is_new: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(playerData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '创建玩家失败')
      }

      return await response.json()
    } catch (error) {
      console.error('创建玩家失败:', error)
      throw error
    }
  }

  /**
   * 获取玩家信息
   */
  async getPlayer(nickname: string): Promise<{ success: boolean; player: Player }> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard/players/${encodeURIComponent(nickname)}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '获取玩家信息失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取玩家信息失败:', error)
      throw error
    }
  }

  // ============================================================================
  // 成绩提交
  // ============================================================================

  /**
   * 提交游戏成绩
   */
  async submitScore(submission: ScoreSubmission): Promise<{
    success: boolean
    message: string
    record_id: number
    played_at: string
    rankings: {
      time_rank: number
      score_rank: number
    }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submission)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '提交成绩失败')
      }

      return await response.json()
    } catch (error) {
      console.error('提交成绩失败:', error)
      throw error
    }
  }

  // ============================================================================
  // 排行榜查询
  // ============================================================================

  /**
   * 获取指定关卡的排行榜
   */
  async getLevelLeaderboard(
    levelId: number,
    options: {
      sort_by?: 'time' | 'score'
      limit?: number
      offset?: number
      country_filter?: string
      perfect_runs_only?: boolean
    } = {}
  ): Promise<{
    success: boolean
    level_id: number
    sort_by: string
    total_count: number
    current_page_count: number
    leaderboard: LeaderboardEntry[]
    pagination: {
      limit: number
      offset: number
      has_more: boolean
    }
  }> {
    try {
      const params = new URLSearchParams()
      if (options.sort_by) params.append('sort_by', options.sort_by)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())
      if (options.country_filter) params.append('country_filter', options.country_filter)
      if (options.perfect_runs_only) params.append('perfect_runs_only', 'true')

      const response = await fetch(
        `${this.baseUrl}/leaderboard/levels/${levelId}?${params.toString()}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '获取排行榜失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取排行榜失败:', error)
      throw error
    }
  }

  /**
   * 获取玩家个人记录
   */
  async getPlayerRecords(
    nickname: string,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<{
    success: boolean
    player_nickname: string
    total_levels_completed: number
    records: PlayerRecord[]
  }> {
    try {
      const params = new URLSearchParams()
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())

      const response = await fetch(
        `${this.baseUrl}/leaderboard/players/${encodeURIComponent(nickname)}/records?${params.toString()}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '获取玩家记录失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取玩家记录失败:', error)
      throw error
    }
  }

  /**
   * 获取全局排行榜
   */
  async getGlobalLeaderboard(options: {
    sort_by?: 'score' | 'time' | 'levels'
    limit?: number
    offset?: number
  } = {}): Promise<{
    success: boolean
    sort_by: string
    global_leaderboard: GlobalPlayer[]
    pagination: {
      limit: number
      offset: number
    }
  }> {
    try {
      const params = new URLSearchParams()
      if (options.sort_by) params.append('sort_by', options.sort_by)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())

      const response = await fetch(
        `${this.baseUrl}/leaderboard/global?${params.toString()}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '获取全局排行榜失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取全局排行榜失败:', error)
      throw error
    }
  }

  // ============================================================================
  // 统计数据
  // ============================================================================

  /**
   * 获取关卡统计信息
   */
  async getLevelStats(levelId: number): Promise<LevelStats> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard/stats/level/${levelId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '获取关卡统计失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取关卡统计失败:', error)
      throw error
    }
  }

  // ============================================================================
  // 健康检查
  // ============================================================================

  /**
   * 检查排行榜服务状态
   */
  async healthCheck(): Promise<{
    status: string
    service: string
    database: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard/health`)

      if (!response.ok) {
        throw new Error('服务不可用')
      }

      return await response.json()
    } catch (error) {
      console.error('健康检查失败:', error)
      throw error
    }
  }
}

// ============================================================================
// 游戏集成示例
// ============================================================================

/**
 * 排行榜管理器 - 与游戏引擎集成
 */
export class LeaderboardManager {
  private client: LeaderboardClient
  private currentPlayer: string | null = null
  private gameStartTime: number = 0
  private gameStats = {
    deaths: 0,
    coins: 0,
    score: 0
  }

  constructor(client?: LeaderboardClient) {
    this.client = client || new LeaderboardClient()
  }

  /**
   * 设置当前玩家
   */
  async setCurrentPlayer(nickname: string, playerData?: {
    email?: string
    country_code?: string
    avatar_url?: string
  }): Promise<Player> {
    try {
      const result = await this.client.createPlayer({
        nickname,
        ...playerData
      })
      
      this.currentPlayer = nickname
      console.log(`玩家设置成功: ${nickname} (${result.is_new ? '新玩家' : '现有玩家'})`)
      
      return result.player
    } catch (error) {
      console.error('设置玩家失败:', error)
      throw error
    }
  }

  /**
   * 开始游戏 - 重置统计
   */
  startGame(): void {
    this.gameStartTime = Date.now()
    this.gameStats = {
      deaths: 0,
      coins: 0,
      score: 0
    }
    console.log('游戏开始，计时器启动')
  }

  /**
   * 更新游戏统计
   */
  updateGameStats(stats: {
    deaths?: number
    coins?: number
    score?: number
  }): void {
    if (stats.deaths !== undefined) this.gameStats.deaths = stats.deaths
    if (stats.coins !== undefined) this.gameStats.coins = stats.coins
    if (stats.score !== undefined) this.gameStats.score = stats.score
  }

  /**
   * 游戏完成 - 提交成绩
   */
  async completeGame(levelId: number, attempts: number = 1): Promise<void> {
    if (!this.currentPlayer) {
      throw new Error('未设置玩家，无法提交成绩')
    }

    const completionTime = Date.now() - this.gameStartTime

    try {
      const result = await this.client.submitScore({
        level_id: levelId,
        player_nickname: this.currentPlayer,
        completion_time_ms: completionTime,
        score: this.gameStats.score,
        deaths_count: this.gameStats.deaths,
        coins_collected: this.gameStats.coins,
        attempts_count: attempts
      })

      console.log('成绩提交成功:', {
        player: this.currentPlayer,
        time: `${(completionTime / 1000).toFixed(3)}秒`,
        rankings: result.rankings
      })

      return result
    } catch (error) {
      console.error('提交成绩失败:', error)
      throw error
    }
  }

  /**
   * 获取当前玩家在指定关卡的最佳记录
   */
  async getPlayerBestRecord(levelId: number): Promise<PlayerRecord | null> {
    if (!this.currentPlayer) return null

    try {
      const result = await this.client.getPlayerRecords(this.currentPlayer)
      return result.records.find(record => record.level.id === levelId) || null
    } catch (error) {
      console.error('获取玩家记录失败:', error)
      return null
    }
  }

  /**
   * 显示排行榜UI
   */
  async showLeaderboard(levelId: number, containerId: string): Promise<void> {
    try {
      const leaderboard = await this.client.getLevelLeaderboard(levelId, {
        sort_by: 'time',
        limit: 10
      })

      const container = document.getElementById(containerId)
      if (!container) {
        console.error(`找不到容器: ${containerId}`)
        return
      }

      // 创建排行榜HTML
      const html = `
        <div class="leaderboard-container">
          <h2>关卡排行榜 - ${leaderboard.leaderboard[0]?.level.name || 'Unknown'}</h2>
          <div class="leaderboard-list">
            ${leaderboard.leaderboard.map(entry => `
              <div class="leaderboard-entry rank-${entry.rank}">
                <div class="rank">#${entry.rank}</div>
                <div class="player">
                  <span class="nickname">${entry.player.nickname}</span>
                  ${entry.player.country_code ? `<span class="country">${entry.player.country_code}</span>` : ''}
                </div>
                <div class="performance">
                  <span class="time">${entry.performance.completion_time_formatted}</span>
                  <span class="score">${entry.performance.score}分</span>
                  ${entry.performance.is_perfect_run ? '<span class="perfect">Perfect!</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `

      container.innerHTML = html
    } catch (error) {
      console.error('显示排行榜失败:', error)
    }
  }
}

// ============================================================================
// CSS 样式 (可选 - 添加到你的样式文件中)
// ============================================================================

export const leaderboardCSS = `
.leaderboard-container {
  background: rgba(0, 0, 0, 0.9);
  border-radius: 10px;
  padding: 20px;
  color: white;
  font-family: 'Courier New', monospace;
}

.leaderboard-container h2 {
  text-align: center;
  color: #FFD700;
  margin-bottom: 20px;
}

.leaderboard-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.leaderboard-entry.rank-1 {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
  border: 2px solid #FFD700;
}

.leaderboard-entry.rank-2 {
  background: linear-gradient(90deg, rgba(192, 192, 192, 0.3), rgba(192, 192, 192, 0.1));
  border: 2px solid #C0C0C0;
}

.leaderboard-entry.rank-3 {
  background: linear-gradient(90deg, rgba(205, 127, 50, 0.3), rgba(205, 127, 50, 0.1));
  border: 2px solid #CD7F32;
}

.rank {
  font-weight: bold;
  font-size: 1.2em;
  min-width: 40px;
}

.player {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin-left: 20px;
}

.nickname {
  font-weight: bold;
}

.country {
  background: #333;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8em;
}

.performance {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time {
  font-weight: bold;
  color: #00FF00;
}

.score {
  color: #FFD700;
}

.perfect {
  background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 5px #FF6B6B; }
  to { box-shadow: 0 0 20px #FF6B6B; }
}
`