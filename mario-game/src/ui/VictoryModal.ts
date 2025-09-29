/**
 * 通关胜利弹窗组件
 * 显示成绩提交界面和排行榜功能
 */

import { LeaderboardClient, LeaderboardManager, type ScoreSubmission } from '../engine/api/LeaderboardClient'

export interface VictoryData {
  completionTime: number  // 完成时间(毫秒)
  deaths: number          // 死亡次数
  coins: number           // 收集金币数
  score: number           // 游戏得分
  levelId: number         // 关卡ID
}

export class VictoryModal {
  private modal: HTMLDivElement | null = null
  private leaderboardManager: LeaderboardManager
  private onClose?: () => void
  private onRestart?: () => void

  constructor() {
    this.leaderboardManager = new LeaderboardManager()
  }

  /**
   * 显示通关弹窗
   */
  async show(victoryData: VictoryData, options?: {
    onClose?: () => void
    onRestart?: () => void
  }): Promise<void> {
    this.onClose = options?.onClose
    this.onRestart = options?.onRestart

    this.createModal(victoryData)
    this.showModal()
  }

  /**
   * 隐藏弹窗
   */
  hide(): void {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
    }
  }

  /**
   * 创建弹窗DOM结构
   */
  private createModal(victoryData: VictoryData): void {
    this.modal = document.createElement('div')
    this.modal.className = 'victory-modal-overlay'

    const formattedTime = this.formatTime(victoryData.completionTime)
    const isPerfectRun = victoryData.deaths === 0

    this.modal.innerHTML = `
      <div class="victory-modal">
        <div class="victory-header">
          <h2>🎉 Level Complete! 🎉</h2>
          <button class="close-btn" data-action="close">×</button>
        </div>

        <div class="victory-content">
          <div class="victory-stats">
            <div class="stat-item">
              <span class="stat-label">Completion Time:</span>
              <span class="stat-value">${formattedTime}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Deaths:</span>
              <span class="stat-value ${isPerfectRun ? 'perfect' : ''}">${victoryData.deaths}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Coins Collected:</span>
              <span class="stat-value">${victoryData.coins}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Final Score:</span>
              <span class="stat-value score">${victoryData.score}</span>
            </div>
            ${isPerfectRun ? '<div class="perfect-run">🌟 Perfect Run! 🌟</div>' : ''}
          </div>

          <div class="player-form">
            <h3>Submit Score to Leaderboard</h3>
            <form id="score-form">
              <div class="form-group">
                <label for="player-name">Player Name:</label>
                <input
                  type="text"
                  id="player-name"
                  placeholder="Enter your name"
                  maxlength="50"
                  required
                />
              </div>
              <div class="form-group">
                <label for="player-email">Email (Optional):</label>
                <input
                  type="email"
                  id="player-email"
                  placeholder="Enter your email"
                />
              </div>
              <div class="form-group">
                <label for="player-country">Country (Optional):</label>
                <select id="player-country">
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CN">China</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="SG">Singapore</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn" data-action="submit">
                  🏆 Submit Score
                </button>
                <button type="button" class="skip-btn" data-action="skip">
                  Skip
                </button>
              </div>
            </form>
          </div>

          <div class="leaderboard-section" id="leaderboard-section" style="display: none;">
            <h3>🏆 Leaderboard</h3>
            <div class="ranking-info" id="ranking-info"></div>
            <div class="leaderboard-content" id="leaderboard-content"></div>
          </div>
        </div>

        <div class="victory-actions">
          <button class="action-btn primary" data-action="restart">
            🔄 Restart
          </button>
          <button class="action-btn secondary" data-action="close">
            ❌ Close
          </button>
        </div>

        <div class="loading-overlay" id="loading-overlay" style="display: none;">
          <div class="loading-spinner"></div>
          <p>Submitting score...</p>
        </div>
      </div>
    `

    // 绑定事件监听器
    this.bindEvents(victoryData)

    // 添加到页面
    document.body.appendChild(this.modal)
  }

  /**
   * 绑定事件监听器
   */
  private bindEvents(victoryData: VictoryData): void {
    if (!this.modal) return

    // 点击背景关闭
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.handleClose()
      }
    })

    // 按钮事件
    this.modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const action = target.getAttribute('data-action')

      switch (action) {
        case 'close':
          this.handleClose()
          break
        case 'restart':
          this.handleRestart()
          break
        case 'skip':
          this.handleSkip()
          break
      }
    })

    // 表单提交
    const form = this.modal.querySelector('#score-form') as HTMLFormElement
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      this.handleSubmitScore(victoryData)
    })

    // ESC键关闭
    document.addEventListener('keydown', this.handleKeyDown)
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.handleClose()
    }
  }

  /**
   * 处理提交成绩
   */
  private async handleSubmitScore(victoryData: VictoryData): Promise<void> {
    const playerName = (this.modal?.querySelector('#player-name') as HTMLInputElement).value.trim()
    const playerEmail = (this.modal?.querySelector('#player-email') as HTMLInputElement).value.trim()
    const playerCountry = (this.modal?.querySelector('#player-country') as HTMLSelectElement).value

    if (!playerName) {
      alert('Please enter your name!')
      return
    }

    // 显示加载状态
    this.showLoading(true)

    try {
      // 设置当前玩家
      await this.leaderboardManager.setCurrentPlayer(playerName, {
        email: playerEmail || undefined,
        country_code: playerCountry || undefined
      })

      // 提交成绩
      const submission: ScoreSubmission = {
        level_id: victoryData.levelId,
        player_nickname: playerName,
        completion_time_ms: victoryData.completionTime,
        score: victoryData.score,
        deaths_count: victoryData.deaths,
        coins_collected: victoryData.coins,
        attempts_count: 1
      }

      const client = new LeaderboardClient()
      const result = await client.submitScore(submission)

      // 显示提交结果和排名
      this.showSubmissionResult(result.rankings, playerName)

      // 加载并显示排行榜
      await this.loadAndShowLeaderboard(victoryData.levelId)

      console.log('✅ 成绩提交成功:', result)
    } catch (error) {
      console.error('❌ 提交成绩失败:', error)
      let errorMessage = 'Failed to submit score. Please try again later.'
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (message.includes('not found') || message.includes('404')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.'
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'Network connection failed. Please check your connection and try again.'
        } else if (message.includes('timeout')) {
          errorMessage = 'Request timeout. Please try again.'
        } else {
          errorMessage = `Submission failed: ${error.message}`
        }
      }
      alert(errorMessage)
    } finally {
      this.showLoading(false)
    }
  }

  /**
   * 显示提交结果
   */
  private showSubmissionResult(rankings: { time_rank: number; score_rank: number }, playerName: string): void {
    const rankingInfo = this.modal?.querySelector('#ranking-info')
    if (rankingInfo) {
      rankingInfo.innerHTML = `
        <div class="submission-success">
          <h4>🎉 ${playerName}, score submitted successfully!</h4>
          <div class="ranking-stats">
            <div class="rank-item">
              <span class="rank-label">Time Rank:</span>
              <span class="rank-value">#${rankings.time_rank}</span>
            </div>
            <div class="rank-item">
              <span class="rank-label">Score Rank:</span>
              <span class="rank-value">#${rankings.score_rank}</span>
            </div>
          </div>
        </div>
      `
    }

    // 显示排行榜区域
    const leaderboardSection = this.modal?.querySelector('#leaderboard-section') as HTMLElement
    if (leaderboardSection) {
      leaderboardSection.style.display = 'block'
    }

    // 隐藏表单
    const playerForm = this.modal?.querySelector('.player-form') as HTMLElement
    if (playerForm) {
      playerForm.style.display = 'none'
    }
  }

  /**
   * 加载并显示排行榜
   */
  private async loadAndShowLeaderboard(levelId: number): Promise<void> {
    try {
      const client = new LeaderboardClient()
      const leaderboard = await client.getLevelLeaderboard(levelId, {
        sort_by: 'time',
        limit: 10
      })

      const leaderboardContent = this.modal?.querySelector('#leaderboard-content')
      if (leaderboardContent) {
        leaderboardContent.innerHTML = `
          <div class="leaderboard-list">
            ${leaderboard.leaderboard.map(entry => `
              <div class="leaderboard-entry rank-${entry.rank}">
                <div class="rank">#${entry.rank}</div>
                <div class="player-info">
                  <span class="nickname">${entry.player.nickname}</span>
                  ${entry.player.country_code ? `<span class="country">${entry.player.country_code}</span>` : ''}
                </div>
                <div class="performance">
                  <span class="time">${entry.performance.completion_time_formatted}</span>
                  <span class="score">${entry.performance.score} pts</span>
                  ${entry.performance.is_perfect_run ? '<span class="perfect">Perfect!</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `
      }
    } catch (error) {
      console.error('❌ 加载排行榜失败:', error)
      const leaderboardContent = this.modal?.querySelector('#leaderboard-content')
      if (leaderboardContent) {
        let errorMessage = 'Failed to load leaderboard. Please try again later.'
        if (error instanceof Error) {
          const message = error.message.toLowerCase()
          if (message.includes('not found') || message.includes('404')) {
            errorMessage = 'Leaderboard service temporarily unavailable.'
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Network connection failed. Unable to load leaderboard.'
          }
        }
        leaderboardContent.innerHTML = `<p class="error">${errorMessage}</p>`
      }
    }
  }

  /**
   * 显示加载状态
   */
  private showLoading(show: boolean): void {
    const loadingOverlay = this.modal?.querySelector('#loading-overlay') as HTMLElement
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none'
    }
  }

  /**
   * 处理跳过提交
   */
  private handleSkip(): void {
    if (confirm('Are you sure you want to skip score submission?')) {
      this.handleClose()
    }
  }

  /**
   * 处理关闭
   */
  private handleClose(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    this.hide()
    this.onClose?.()
  }

  /**
   * 处理重新开始
   */
  private handleRestart(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    this.hide()
    this.onRestart?.()
  }

  /**
   * 显示弹窗
   */
  private showModal(): void {
    if (this.modal) {
      // 动画显示
      requestAnimationFrame(() => {
        this.modal?.classList.add('show')
      })

      // 自动聚焦到昵称输入框
      setTimeout(() => {
        const nameInput = this.modal?.querySelector('#player-name') as HTMLInputElement
        nameInput?.focus()
      }, 100)
    }
  }

  /**
   * 格式化时间显示
   */
  private formatTime(ms: number): string {
    const totalSeconds = ms / 1000
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor(ms % 1000)

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
    } else {
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`
    }
  }
}