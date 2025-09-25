/**
 * 地图坐标缩放工具
 * 用于将基于标准尺寸(1024x576)的地图数据缩放到实际画布尺寸
 */

export interface ScaleConfig {
  originalWidth: number
  originalHeight: number
  targetWidth: number
  targetHeight: number
}

export class MapScaler {
  private scaleX: number
  private scaleY: number
  private config: ScaleConfig

  constructor(config: ScaleConfig) {
    this.config = config
    this.scaleX = config.targetWidth / config.originalWidth
    this.scaleY = config.targetHeight / config.originalHeight
    
    console.log('MapScaler initialized:', {
      original: `${config.originalWidth}x${config.originalHeight}`,
      target: `${config.targetWidth}x${config.targetHeight}`,
      scaleX: this.scaleX.toFixed(3),
      scaleY: this.scaleY.toFixed(3)
    })
  }

  /**
   * 缩放单个点坐标
   */
  public scalePoint(x: number, y: number): [number, number] {
    return [
      Math.round(x * this.scaleX),
      Math.round(y * this.scaleY)
    ]
  }

  /**
   * 缩放坐标数组
   */
  public scalePoints(points: [number, number][]): [number, number][] {
    return points.map(([x, y]) => this.scalePoint(x, y))
  }

  /**
   * 缩放矩形区域 (x, y, width, height)
   */
  public scaleRect(x: number, y: number, width: number, height: number): {
    x: number, y: number, width: number, height: number
  } {
    return {
      x: Math.round(x * this.scaleX),
      y: Math.round(y * this.scaleY),
      width: Math.round(width * this.scaleX),
      height: Math.round(height * this.scaleY)
    }
  }

  /**
   * 缩放距离值
   */
  public scaleDistance(distance: number, axis: 'x' | 'y' | 'both' = 'both'): number {
    if (axis === 'x') {
      return Math.round(distance * this.scaleX)
    } else if (axis === 'y') {
      return Math.round(distance * this.scaleY)
    } else {
      // 使用平均缩放比例
      return Math.round(distance * Math.sqrt(this.scaleX * this.scaleY))
    }
  }

  /**
   * 获取缩放比例
   */
  public getScaleFactors(): { x: number, y: number } {
    return { x: this.scaleX, y: this.scaleY }
  }

  /**
   * 检查是否需要缩放
   */
  public needsScaling(): boolean {
    const threshold = 0.05 // 5% 的差异认为不需要缩放
    return Math.abs(this.scaleX - 1) > threshold || Math.abs(this.scaleY - 1) > threshold
  }

  /**
   * 创建标准的地图缩放器（基于1024x576标准尺寸）
   */
  public static createStandardScaler(targetWidth: number, targetHeight: number): MapScaler {
    return new MapScaler({
      originalWidth: 1024,
      originalHeight: 576,
      targetWidth,
      targetHeight
    })
  }

  /**
   * 缩放LevelData中的所有坐标
   */
  public scaleLevelData(levelData: any): any {
    const scaledData = JSON.parse(JSON.stringify(levelData)) // 深拷贝

    // 缩放起始点
    if (scaledData.starting_points) {
      scaledData.starting_points = scaledData.starting_points.map((point: any) => ({
        ...point,
        coordinates: this.scalePoint(point.coordinates[0], point.coordinates[1])
      }))
    }

    // 缩放终点
    if (scaledData.end_points) {
      scaledData.end_points = scaledData.end_points.map((point: any) => ({
        ...point,
        coordinates: this.scalePoint(point.coordinates[0], point.coordinates[1])
      }))
    }

    // 缩放刚体多边形
    if (scaledData.rigid_bodies) {
      scaledData.rigid_bodies = scaledData.rigid_bodies.map((body: any) => ({
        ...body,
        contour_points: this.scalePoints(body.contour_points)
      }))
    }

    // 缩放金币
    if (scaledData.coins) {
      scaledData.coins = scaledData.coins.map((coin: any) => {
        if (coin.coordinates && Array.isArray(coin.coordinates)) {
          const [x, y] = this.scalePoint(coin.coordinates[0], coin.coordinates[1])
          return { ...coin, coordinates: [x, y] }
        } else if (typeof coin.x === 'number' && typeof coin.y === 'number') {
          const [x, y] = this.scalePoint(coin.x, coin.y)
          return { ...coin, x, y }
        }
        return coin
      })
    }

    // 缩放刺
    if (scaledData.spikes) {
      scaledData.spikes = scaledData.spikes.map((spike: any) => ({
        ...spike,
        coordinates: this.scalePoint(spike.coordinates[0], spike.coordinates[1])
      }))
    }

    // 缩放敌人
    if (scaledData.enemies) {
      scaledData.enemies = scaledData.enemies.map((enemy: any) => {
        const [x, y] = this.scalePoint(enemy.x, enemy.y)
        return { ...enemy, x, y }
      })
    }

    // 缩放平台（如果有）
    if (scaledData.platforms) {
      scaledData.platforms = scaledData.platforms.map((platform: any) => {
        const rect = this.scaleRect(platform.x, platform.y, platform.width, platform.height)
        return { ...platform, ...rect }
      })
    }

    return scaledData
  }

  /**
   * 记录缩放信息
   */
  public logScalingInfo(): void {
    if (this.needsScaling()) {
      console.log('🔍 Map scaling applied:', {
        originalSize: `${this.config.originalWidth}x${this.config.originalHeight}`,
        targetSize: `${this.config.targetWidth}x${this.config.targetHeight}`,
        scaleFactors: `${this.scaleX.toFixed(3)}x, ${this.scaleY.toFixed(3)}y`,
        scalingType: this.scaleX === this.scaleY ? 'uniform' : 'non-uniform'
      })
    } else {
      console.log('📏 No map scaling needed - using original coordinates')
    }
  }
}