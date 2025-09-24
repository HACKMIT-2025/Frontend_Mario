import { VirtualGamepad } from '../../input/VirtualGamepad'
import { MobileDetector } from '../../utils/MobileDetector'

export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  jump: boolean
  run: boolean
  action: boolean
}

export class InputManager {
  private keys: Map<string, boolean> = new Map()
  private touches: Map<number, { x: number; y: number; startTime: number }> = new Map()
  private inputState: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    run: false,
    action: false
  }
  private virtualGamepad: VirtualGamepad | null = null
  private mobileDetector: MobileDetector
  private touchGestureEnabled: boolean = true

  constructor() {
    this.mobileDetector = MobileDetector.getInstance()
    this.initializeKeyboardListeners()
    this.initializeTouchListeners()
    this.initializeVirtualGamepad()
  }

  private initializeKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true)
      this.updateInputState()

      // Prevent default for game keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false)
      this.updateInputState()
    })

    // Clear keys when window loses focus
    window.addEventListener('blur', () => {
      this.keys.clear()
      this.resetInputState()
    })
  }

  /**
   * 初始化虚拟游戏手柄
   */
  private initializeVirtualGamepad() {
    this.virtualGamepad = new VirtualGamepad((key: string, pressed: boolean) => {
      this.keys.set(key, pressed)
      this.updateInputState()
    })
    
    // 创建虚拟游戏手柄
    this.virtualGamepad.create()
  }

  private initializeTouchListeners() {
    const canvas = document.getElementById('game-canvas')
    if (!canvas) return

    // 改进的触摸事件处理
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      Array.from(e.touches).forEach(touch => {
        this.touches.set(touch.identifier, { 
          x: touch.clientX, 
          y: touch.clientY,
          startTime: Date.now()
        })
      })
      if (this.touchGestureEnabled) {
        this.updateTouchInput()
      }
    }, { passive: false })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      Array.from(e.touches).forEach(touch => {
        const existingTouch = this.touches.get(touch.identifier)
        if (existingTouch) {
          this.touches.set(touch.identifier, {
            x: touch.clientX, 
            y: touch.clientY,
            startTime: existingTouch.startTime
          })
        }
      })
      if (this.touchGestureEnabled) {
        this.updateTouchInput()
      }
    }, { passive: false })

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      Array.from(e.changedTouches).forEach(touch => {
        this.touches.delete(touch.identifier)
      })
      if (this.touchGestureEnabled) {
        this.updateTouchInput()
      }
    }, { passive: false })
  }

  private updateInputState() {
    // Keyboard mappings
    this.inputState.left = this.keys.get('ArrowLeft') || this.keys.get('KeyA') || false
    this.inputState.right = this.keys.get('ArrowRight') || this.keys.get('KeyD') || false
    this.inputState.up = this.keys.get('ArrowUp') || this.keys.get('KeyW') || false
    this.inputState.down = this.keys.get('ArrowDown') || this.keys.get('KeyS') || false
    this.inputState.jump = this.keys.get('Space') || this.keys.get('KeyJ') || false
    this.inputState.run = this.keys.get('ShiftLeft') || this.keys.get('ShiftRight') || false
    this.inputState.action = this.keys.get('KeyX') || this.keys.get('KeyK') || false
  }

  private updateTouchInput() {
    // 只有在没有虚拟游戏手柄显示或禁用触摸手势时才处理画布触摸
    if ((this.virtualGamepad && this.virtualGamepad.isEnabled()) || !this.touchGestureEnabled) {
      return
    }

    // Reset touch input for direct touch
    const wasJump = this.inputState.jump
    const wasRun = this.inputState.run
    
    this.inputState.left = false
    this.inputState.right = false
    this.inputState.jump = false
    this.inputState.run = false

    const canvas = document.getElementById('game-canvas')
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasWidth = rect.width
    const canvasHeight = rect.height

    this.touches.forEach(touch => {
      const x = touch.x - rect.left
      const y = touch.y - rect.top

      // 改进的触摸区域划分
      // 左侧三分之一：移动控制
      if (x < canvasWidth / 3) {
        if (x < canvasWidth / 6) {
          this.inputState.left = true
        } else {
          this.inputState.right = true
        }
      }
      // 右侧三分之一：动作按键
      else if (x > canvasWidth * 2 / 3) {
        if (y < canvasHeight / 2) {
          this.inputState.jump = true
        } else {
          this.inputState.run = true
        }
      }
      // 中间区域：跳跃（适合单手操作）
      else {
        this.inputState.jump = true
      }
    })

    // 触觉反馈
    if (this.mobileDetector.supportsVibration) {
      if ((this.inputState.jump && !wasJump) || 
          (this.inputState.run && !wasRun)) {
        this.mobileDetector.vibrate(50)
      }
    }
  }

  private resetInputState() {
    this.inputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      run: false,
      action: false
    }
  }

  public getInput(): InputState {
    return { ...this.inputState }
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.get(key) || false
  }

  public reset() {
    this.keys.clear()
    this.touches.clear()
    this.resetInputState()
  }

  /**
   * 获取虚拟游戏手柄实例
   */
  public getVirtualGamepad(): VirtualGamepad | null {
    return this.virtualGamepad
  }

  /**
   * 显示虚拟游戏手柄
   */
  public showVirtualGamepad(): void {
    if (this.virtualGamepad) {
      this.virtualGamepad.show()
      this.touchGestureEnabled = false // 禁用直接触摸手势
    }
  }

  /**
   * 隐藏虚拟游戏手柄
   */
  public hideVirtualGamepad(): void {
    if (this.virtualGamepad) {
      this.virtualGamepad.hide()
      this.touchGestureEnabled = true // 启用直接触摸手势
    }
  }

  /**
   * 切换虚拟游戏手柄显示状态
   */
  public toggleVirtualGamepad(): void {
    if (this.virtualGamepad) {
      this.virtualGamepad.toggle()
      this.touchGestureEnabled = !this.virtualGamepad.isEnabled()
    }
  }

  /**
   * 检查是否为移动设备
   */
  public isMobileDevice(): boolean {
    return this.mobileDetector.shouldShowVirtualControls
  }

  /**
   * 设置震动功能启用状态
   */
  public setVibrationEnabled(enabled: boolean): void {
    if (this.virtualGamepad) {
      this.virtualGamepad.setVibrationEnabled(enabled)
    }
  }

  /**
   * 销毁输入管理器
   */
  public destroy(): void {
    if (this.virtualGamepad) {
      this.virtualGamepad.destroy()
      this.virtualGamepad = null
    }
    this.keys.clear()
    this.touches.clear()
    this.resetInputState()
  }

  /**
   * 向后兼容的虚拟游戏手柄创建方法
   * @deprecated 使用新的VirtualGamepad类替代
   */
  public createVirtualGamepad() {
    console.warn('createVirtualGamepad() is deprecated. Virtual gamepad is automatically created.')
    if (this.virtualGamepad) {
      this.virtualGamepad.show()
    }
  }
}