/**
 * 移动设备检测工具类
 * 用于检测用户设备类型并提供相关功能
 */
export class MobileDetector {
  private static instance: MobileDetector
  private _isMobile: boolean = false
  private _isTablet: boolean = false
  private _isTouchDevice: boolean = false

  private constructor() {
    this.detectDevice()
  }

  public static getInstance(): MobileDetector {
    if (!MobileDetector.instance) {
      MobileDetector.instance = new MobileDetector()
    }
    return MobileDetector.instance
  }

  private detectDevice() {
    // 检测用户代理字符串
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    
    // 检测屏幕尺寸
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const isMobileScreen = Math.max(screenWidth, screenHeight) <= 1024 && Math.min(screenWidth, screenHeight) <= 768
    
    // 检测触摸支持
    this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // 检测是否为平板
    this._isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                    (this._isTouchDevice && Math.min(screenWidth, screenHeight) >= 768)

    // 综合判断是否为移动设备
    this._isMobile = (isMobileUA || isMobileScreen) && !this._isTablet

    console.log('Device detection results:', {
      isMobile: this._isMobile,
      isTablet: this._isTablet,
      isTouchDevice: this._isTouchDevice,
      screenSize: `${screenWidth}x${screenHeight}`,
      userAgent: userAgent.substring(0, 50) + '...'
    })
  }

  /**
   * 是否为移动手机设备
   */
  public get isMobile(): boolean {
    return this._isMobile
  }

  /**
   * 是否为平板设备
   */
  public get isTablet(): boolean {
    return this._isTablet
  }

  /**
   * 是否支持触摸
   */
  public get isTouchDevice(): boolean {
    return this._isTouchDevice
  }

  /**
   * 是否应该显示虚拟控制器
   * 移动设备或者平板都应该显示
   */
  public get shouldShowVirtualControls(): boolean {
    return this._isMobile || this._isTablet
  }

  /**
   * 获取设备类型字符串
   */
  public getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (this._isMobile) return 'mobile'
    if (this._isTablet) return 'tablet'
    return 'desktop'
  }

  /**
   * 获取推荐的游戏画布尺寸
   * 回滚到标准固定尺寸：1024x576
   */
  public getRecommendedCanvasSize(): { width: number; height: number } {
    // 使用固定的标准游戏尺寸，避免地图缩放问题
    const standardWidth = 1024
    const standardHeight = 576
    
    return { 
      width: standardWidth, 
      height: standardHeight 
    }
  }

  /**
   * 是否应该使用横屏模式
   */
  public get shouldUselandscape(): boolean {
    return this._isMobile && window.screen.width > window.screen.height
  }

  /**
   * 检查设备是否支持震动
   */
  public get supportsVibration(): boolean {
    return 'vibrate' in navigator
  }

  /**
   * 触发设备震动（如果支持）
   */
  public vibrate(pattern: number | number[] = 100) {
    if (this.supportsVibration) {
      navigator.vibrate(pattern)
    }
  }
}