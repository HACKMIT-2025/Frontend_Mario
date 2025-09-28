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
          <h2>🎉 恭喜通关! 🎉</h2>
          <button class="close-btn" data-action="close">×</button>
        </div>

        <div class="victory-content">
          <div class="victory-stats">
            <div class="stat-item">
              <span class="stat-label">完成时间:</span>
              <span class="stat-value">${formattedTime}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">死亡次数:</span>
              <span class="stat-value ${isPerfectRun ? 'perfect' : ''}">${victoryData.deaths}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">收集金币:</span>
              <span class="stat-value">${victoryData.coins}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最终得分:</span>
              <span class="stat-value score">${victoryData.score}</span>
            </div>
            ${isPerfectRun ? '<div class="perfect-run">🌟 完美通关! 🌟</div>' : ''}
          </div>

          <div class="player-form">
            <h3>提交成绩到排行榜</h3>
            <form id="score-form">
              <div class="form-group">
                <label for="player-name">玩家昵称:</label>
                <input
                  type="text"
                  id="player-name"
                  placeholder="请输入您的昵称"
                  maxlength="50"
                  required
                />
              </div>
              <div class="form-group">
                <label for="player-email">邮箱 (可选):</label>
                <input
                  type="email"
                  id="player-email"
                  placeholder="your@email.com"
                />
              </div>
              <div class="form-group">
                <label for="player-country">国家/地区 (可选):</label>
                <select id="player-country">
                  <option value="">选择国家/地区</option>
                  <option value="CN">中国</option>
                  <option value="US">美国</option>
                  <option value="JP">日本</option>
                  <option value="KR">韩国</option>
                  <option value="GB">英国</option>
                  <option value="DE">德国</option>
                  <option value="FR">法国</option>
                  <option value="CA">加拿大</option>
                  <option value="AU">澳大利亚</option>
                  <option value="SG">新加坡</option>
                </select>
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn" data-action="submit">
                  🏆 提交成绩
                </button>
                <button type="button" class="skip-btn" data-action="skip">
                  跳过提交
                </button>
              </div>
            </form>
          </div>

          <div class="leaderboard-section" id="leaderboard-section" style="display: none;">
            <h3>🏆 排行榜</h3>
            <div class="ranking-info" id="ranking-info"></div>
            <div class="leaderboard-content" id="leaderboard-content"></div>
          </div>
        </div>

        <div class="victory-actions">
          <button class="action-btn primary" data-action="restart">
            🔄 重新开始
          </button>
          <button class="action-btn secondary" data-action="close">
            ❌ 关闭
          </button>
        </div>

        <div class="loading-overlay" id="loading-overlay" style="display: none;">
          <div class="loading-spinner"></div>
          <p>提交成绩中...</p>
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
      alert('请输入您的昵称!')
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
      alert('提交成绩失败，请稍后重试: ' + (error instanceof Error ? error.message : '未知错误'))
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
          <h4>🎉 ${playerName}，成绩提交成功!</h4>
          <div class="ranking-stats">
            <div class="rank-item">
              <span class="rank-label">时间排名:</span>
              <span class="rank-value">#${rankings.time_rank}</span>
            </div>
            <div class="rank-item">
              <span class="rank-label">分数排名:</span>
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
                  <span class="score">${entry.performance.score}分</span>
                  ${entry.performance.is_perfect_run ? '<span class="perfect">完美!</span>' : ''}
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
        leaderboardContent.innerHTML = '<p class="error">加载排行榜失败，请稍后重试</p>'
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
    if (confirm('确定要跳过成绩提交吗？')) {
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