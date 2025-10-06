/**
 * Level Pack Progress UI
 * Displays pack progress, level indicators, and transition animations
 */

import type { LevelPackManager } from '../engine/LevelPackManager'

export class LevelPackProgressUI {
  private container: HTMLDivElement | null = null
  private packManager: LevelPackManager | null = null

  /**
   * Render the progress UI
   */
  render(parentElement: HTMLElement, manager: LevelPackManager): void {
    this.packManager = manager

    // Create container
    this.container = document.createElement('div')
    this.container.id = 'level-pack-progress-ui'
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(139, 92, 246, 0.95));
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 15px 25px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-width: 400px;
      border: 2px solid rgba(255, 255, 255, 0.2);
    `

    parentElement.appendChild(this.container)

    // Initial render
    this.update()

    // Add styles for animations
    this.addStyles()
  }

  /**
   * Update the progress display
   */
  update(): void {
    if (!this.container || !this.packManager) return

    const stats = this.packManager.getStats()
    const statuses = this.packManager.getLevelStatuses()

    this.container.innerHTML = `
      <!-- Pack Name -->
      <div style="
        font-size: 18px;
        font-weight: bold;
        color: white;
        margin-bottom: 10px;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      ">
        🏰 ${stats.packName}
      </div>

      <!-- Progress Bar -->
      <div style="
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        height: 8px;
        margin-bottom: 10px;
        overflow: hidden;
      ">
        <div style="
          width: ${stats.progress}%;
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          transition: width 0.5s ease;
          border-radius: 10px;
        "></div>
      </div>

      <!-- Level Info Row -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      ">
        <div style="
          color: rgba(255, 255, 255, 0.95);
          font-size: 14px;
          font-weight: 600;
        ">
          Level ${stats.currentLevel}/${stats.totalLevels}
        </div>
        <div style="
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        ">
          <span>⏱️ ${stats.totalTime}</span>
          <span>💀 ${stats.totalDeaths}</span>
        </div>
      </div>

      <!-- Level Indicators -->
      <div style="
        display: flex;
        gap: 8px;
        justify-content: center;
      ">
        ${statuses.map((status, index) => this.createLevelIndicator(status, index + 1)).join('')}
      </div>
    `
  }

  /**
   * Create a level indicator dot
   */
  private createLevelIndicator(status: 'completed' | 'current' | 'locked', levelNum: number): string {
    let bgColor: string
    let icon: string
    let borderColor: string
    let pulse: string = ''

    if (status === 'completed') {
      bgColor = '#10b981'
      borderColor = '#34d399'
      icon = '✓'
    } else if (status === 'current') {
      bgColor = '#f59e0b'
      borderColor = '#fbbf24'
      icon = '●'
      pulse = 'animation: pulse 2s infinite;'
    } else {
      bgColor = 'rgba(255, 255, 255, 0.2)'
      borderColor = 'rgba(255, 255, 255, 0.3)'
      icon = '○'
    }

    return `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${bgColor};
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        ${pulse}
        position: relative;
      "
      title="Level ${levelNum}">
        ${icon}
      </div>
    `
  }

  /**
   * Show level transition animation
   */
  showLevelTransition(fromLevel: number, toLevel: number): void {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `

    overlay.innerHTML = `
      <div style="
        font-size: 72px;
        margin-bottom: 20px;
        animation: bounceIn 0.5s ease;
      ">
        ✓
      </div>
      <div style="
        font-size: 48px;
        font-weight: bold;
        color: #10b981;
        margin-bottom: 10px;
        text-shadow: 2px 2px 8px rgba(16, 185, 129, 0.5);
        animation: slideUp 0.5s ease;
      ">
        Level ${fromLevel} Complete!
      </div>
      <div style="
        font-size: 24px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 30px;
        animation: slideUp 0.5s ease 0.2s both;
      ">
        Get ready for Level ${toLevel}...
      </div>
      <div class="loading-spinner"></div>
    `

    document.body.appendChild(overlay)

    // Remove after 2 seconds
    setTimeout(() => {
      overlay.style.animation = 'fadeOut 0.3s ease'
      setTimeout(() => {
        overlay.remove()
      }, 300)
    }, 2000)
  }

  /**
   * Show pack completion screen
   */
  showCompletionScreen(stats: any): void {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(139, 92, 246, 0.95));
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.5s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `

    overlay.innerHTML = `
      <div style="
        font-size: 96px;
        margin-bottom: 30px;
        animation: bounceIn 0.8s ease;
      ">
        🎉
      </div>
      <div style="
        font-size: 56px;
        font-weight: bold;
        color: white;
        margin-bottom: 15px;
        text-shadow: 3px 3px 10px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.6s ease;
      ">
        Pack Complete!
      </div>
      <div style="
        font-size: 32px;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 40px;
        animation: slideUp 0.6s ease 0.1s both;
      ">
        ${stats.packName}
      </div>

      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 30px 50px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        animation: slideUp 0.6s ease 0.2s both;
      ">
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
          color: white;
          font-size: 18px;
        ">
          <div style="text-align: center;">
            <div style="font-size: 42px; margin-bottom: 10px;">⏱️</div>
            <div style="font-weight: bold;">${stats.totalTime}</div>
            <div style="opacity: 0.8; font-size: 14px;">Total Time</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 42px; margin-bottom: 10px;">💀</div>
            <div style="font-weight: bold;">${stats.totalDeaths}</div>
            <div style="opacity: 0.8; font-size: 14px;">Deaths</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 42px; margin-bottom: 10px;">🎯</div>
            <div style="font-weight: bold;">${stats.completed}</div>
            <div style="opacity: 0.8; font-size: 14px;">Levels</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 42px; margin-bottom: 10px;">⭐</div>
            <div style="font-weight: bold;">100%</div>
            <div style="opacity: 0.8; font-size: 14px;">Complete</div>
          </div>
        </div>
      </div>

      <button id="completion-close-btn" style="
        margin-top: 40px;
        padding: 15px 40px;
        font-size: 20px;
        font-weight: bold;
        background: white;
        color: #5b21b6;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s;
        animation: slideUp 0.6s ease 0.3s both;
      "
      onmouseover="this.style.transform='scale(1.05)'"
      onmouseout="this.style.transform='scale(1)'">
        Awesome! 🎮
      </button>
    `

    document.body.appendChild(overlay)

    // Close button
    const closeBtn = overlay.querySelector('#completion-close-btn')
    closeBtn?.addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.3s ease'
      setTimeout(() => {
        overlay.remove()
      }, 300)
    })
  }

  /**
   * Hide/remove the UI
   */
  hide(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }

  /**
   * Add CSS animations
   */
  private addStyles(): void {
    if (document.getElementById('level-pack-ui-styles')) return

    const style = document.createElement('style')
    style.id = 'level-pack-ui-styles'
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes bounceIn {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }
}
