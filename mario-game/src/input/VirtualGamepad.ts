import { MobileDetector } from '../utils/MobileDetector'

/**
 * 虚拟游戏手柄类
 * 为移动设备提供触屏控制界面
 */
export class VirtualGamepad {
  private container: HTMLElement | null = null
  private buttons: Map<string, HTMLElement> = new Map()
  private activeButtons: Set<string> = new Set()
  private mobileDetector: MobileDetector
  private onButtonStateChange: (button: string, pressed: boolean) => void
  private enabled: boolean = false
  private vibrationEnabled: boolean = true

  constructor(onButtonStateChange: (button: string, pressed: boolean) => void) {
    this.onButtonStateChange = onButtonStateChange
    this.mobileDetector = MobileDetector.getInstance()
  }

  /**
   * 创建虚拟游戏手柄
   */
  public create(): void {
    if (this.mobileDetector.getDeviceType() === 'desktop') {
      console.log('Desktop device detected, skipping virtual gamepad creation')
      this.enabled = false
      return
    }

    if (this.container) {
      this.destroy()
    }

    this.createContainer()
    this.createControlPad()
    this.createActionButtons()
    this.createToggleButton()
    this.setupEventListeners()
    
    // 根据设备类型决定是否默认显示
    if (this.mobileDetector.shouldShowVirtualControls) {
      this.show()
    } else {
      this.hide()
    }

    console.log('Virtual gamepad created for device:', this.mobileDetector.getDeviceType())
  }

  /**
   * 创建主容器
   */
  private createContainer(): void {
    this.container = document.createElement('div')
    this.container.id = 'virtual-gamepad'
    this.container.innerHTML = `
      <style>
        #virtual-gamepad {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 180px;
          z-index: 1000;
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
          display: none;
        }

        #virtual-gamepad.visible {
          display: block;
        }

        .gamepad-section {
          position: absolute;
          bottom: 20px;
          pointer-events: all;
        }

        .control-pad {
          left: 20px;
          width: 140px;
          height: 140px;
        }

        .action-buttons {
          right: 20px;
          width: 140px;
          height: 140px;
        }

        .gamepad-btn {
          position: absolute;
          border: none;
          border-radius: 50%;
          font-weight: bold;
          font-size: 18px;
          color: #333;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          transition: all 0.1s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
        }

        .gamepad-btn:active,
        .gamepad-btn.pressed {
          background: rgba(255, 255, 255, 1);
          transform: scale(0.95);
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        }

        .gamepad-btn.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        /* 方向键 */
        .dpad-btn {
          width: 50px;
          height: 50px;
        }

        #btn-up {
          top: 0;
          left: 45px;
        }

        #btn-down {
          bottom: 0;
          left: 45px;
        }

        #btn-left {
          left: 0;
          top: 45px;
        }

        #btn-right {
          right: 0;
          top: 45px;
        }

        /* 动作按键 */
        .action-btn {
          width: 60px;
          height: 60px;
        }

        #btn-jump {
          bottom: 40px;
          right: 20px;
          background: rgba(76, 175, 80, 0.9);
          color: white;
        }

        #btn-jump:active,
        #btn-jump.pressed {
          background: rgba(76, 175, 80, 1);
        }

        #btn-run {
          bottom: 40px;
          right: 100px;
          background: rgba(255, 193, 7, 0.9);
          color: white;
        }

        #btn-run:active,
        #btn-run.pressed {
          background: rgba(255, 193, 7, 1);
        }

        #btn-action {
          top: 20px;
          right: 60px;
          width: 50px;
          height: 50px;
          background: rgba(33, 150, 243, 0.9);
          color: white;
        }

        #btn-action:active,
        #btn-action.pressed {
          background: rgba(33, 150, 243, 1);
        }

        /* 切换按钮 */
        .toggle-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1001;
          pointer-events: all;
        }

        #btn-toggle {
          width: 50px;
          height: 30px;
          border-radius: 15px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          font-size: 12px;
          cursor: pointer;
        }

        /* 平板设备适配 */
        @media screen and (min-width: 768px) {
          .control-pad, .action-buttons {
            width: 160px;
            height: 160px;
          }
          
          .dpad-btn {
            width: 55px;
            height: 55px;
          }
          
          .action-btn {
            width: 65px;
            height: 65px;
          }
          
          #btn-up, #btn-down {
            left: 52px;
          }
          
          #btn-left, #btn-right {
            top: 52px;
          }
        }

        /* 横屏模式适配 */
        @media screen and (orientation: landscape) and (max-height: 500px) {
          #virtual-gamepad {
            height: 120px;
          }
          
          .control-pad, .action-buttons {
            width: 100px;
            height: 100px;
          }
          
          .gamepad-section {
            bottom: 10px;
          }
          
          .dpad-btn {
            width: 35px;
            height: 35px;
            font-size: 14px;
          }
          
          .action-btn {
            width: 45px;
            height: 45px;
            font-size: 14px;
          }
        }
      </style>
    `
    document.body.appendChild(this.container)
  }

  /**
   * 创建方向键
   */
  private createControlPad(): void {
    const controlPad = document.createElement('div')
    controlPad.className = 'gamepad-section control-pad'
    
    const buttons = [
      { id: 'btn-up', class: 'gamepad-btn dpad-btn', content: '▲', key: 'ArrowUp' },
      { id: 'btn-down', class: 'gamepad-btn dpad-btn', content: '▼', key: 'ArrowDown' },
      { id: 'btn-left', class: 'gamepad-btn dpad-btn', content: '◀', key: 'ArrowLeft' },
      { id: 'btn-right', class: 'gamepad-btn dpad-btn', content: '▶', key: 'ArrowRight' }
    ]

    buttons.forEach(btnConfig => {
      const btn = document.createElement('button')
      btn.id = btnConfig.id
      btn.className = btnConfig.class
      btn.innerHTML = btnConfig.content
      btn.setAttribute('data-key', btnConfig.key)
      controlPad.appendChild(btn)
      this.buttons.set(btnConfig.key, btn)
    })

    this.container!.appendChild(controlPad)
  }

  /**
   * 创建动作按键
   */
  private createActionButtons(): void {
    const actionButtons = document.createElement('div')
    actionButtons.className = 'gamepad-section action-buttons'
    
    const buttons = [
      { id: 'btn-jump', class: 'gamepad-btn action-btn', content: 'A', key: 'Space' },
      { id: 'btn-run', class: 'gamepad-btn action-btn', content: 'B', key: 'ShiftLeft' },
      { id: 'btn-action', class: 'gamepad-btn action-btn', content: 'X', key: 'KeyX' }
    ]

    buttons.forEach(btnConfig => {
      const btn = document.createElement('button')
      btn.id = btnConfig.id
      btn.className = btnConfig.class
      btn.innerHTML = btnConfig.content
      btn.setAttribute('data-key', btnConfig.key)
      actionButtons.appendChild(btn)
      this.buttons.set(btnConfig.key, btn)
    })

    this.container!.appendChild(actionButtons)
  }

  /**
   * 创建显示/隐藏切换按钮
   */
  private createToggleButton(): void {
    // Only create toggle button for non-desktop devices
    if (this.mobileDetector.getDeviceType() === 'desktop') {
      return
    }

    const toggleSection = document.createElement('div')
    toggleSection.className = 'toggle-button'
    
    const toggleBtn = document.createElement('button')
    toggleBtn.id = 'btn-toggle'
    toggleBtn.textContent = '🎮'
    toggleBtn.title = 'Toggle Virtual Gamepad'
    
    toggleBtn.addEventListener('click', () => {
      this.toggle()
    })

    toggleSection.appendChild(toggleBtn)
    this.container!.appendChild(toggleSection)
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.buttons.forEach((button, key) => {
      // 触摸事件
      button.addEventListener('touchstart', (e) => {
        e.preventDefault()
        this.pressButton(key)
      }, { passive: false })

      button.addEventListener('touchend', (e) => {
        e.preventDefault()
        this.releaseButton(key)
      }, { passive: false })

      // 鼠标事件（用于调试）
      button.addEventListener('mousedown', (e) => {
        e.preventDefault()
        this.pressButton(key)
      })

      button.addEventListener('mouseup', (e) => {
        e.preventDefault()
        this.releaseButton(key)
      })

      button.addEventListener('mouseleave', () => {
        this.releaseButton(key)
      })
    })

    // 防止触摸时页面滚动
    this.container!.addEventListener('touchmove', (e) => {
      e.preventDefault()
    }, { passive: false })
  }

  /**
   * 按下按钮
   */
  private pressButton(key: string): void {
    if (this.activeButtons.has(key)) return

    this.activeButtons.add(key)
    const button = this.buttons.get(key)
    if (button) {
      button.classList.add('pressed')
    }

    // 触觉反馈
    if (this.vibrationEnabled && this.mobileDetector.supportsVibration) {
      this.mobileDetector.vibrate(50)
    }

    this.onButtonStateChange(key, true)
  }

  /**
   * 释放按钮
   */
  private releaseButton(key: string): void {
    if (!this.activeButtons.has(key)) return

    this.activeButtons.delete(key)
    const button = this.buttons.get(key)
    if (button) {
      button.classList.remove('pressed')
    }

    this.onButtonStateChange(key, false)
  }

  /**
   * 显示虚拟手柄
   */
  public show(): void {
    if (this.container) {
      this.container.classList.add('visible')
      this.enabled = true
      console.log('Virtual gamepad shown')
    }
  }

  /**
   * 隐藏虚拟手柄
   */
  public hide(): void {
    if (this.container) {
      this.container.classList.remove('visible')
      this.enabled = false
      // 释放所有按键
      this.activeButtons.forEach(key => {
        this.releaseButton(key)
      })
      console.log('Virtual gamepad hidden')
    }
  }

  /**
   * 切换显示状态
   */
  public toggle(): void {
    if (this.enabled) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 是否已启用
   */
  public isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 启用/禁用震动反馈
   */
  public setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled
  }

  /**
   * 销毁虚拟手柄
   */
  public destroy(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    this.buttons.clear()
    this.activeButtons.clear()
    this.enabled = false
    console.log('Virtual gamepad destroyed')
  }

  /**
   * 获取当前按下的按键
   */
  public getActiveButtons(): string[] {
    return Array.from(this.activeButtons)
  }
}
