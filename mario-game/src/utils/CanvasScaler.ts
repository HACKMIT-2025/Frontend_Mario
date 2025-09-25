/**
 * 智能画布大小检测和实时缩放工具
 * 根据浏览器中实际的画布尺寸来动态计算最佳的地图数据缩放比例
 */

export interface CanvasInfo {
  width: number
  height: number
  aspectRatio: number
}

export interface MapBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export class CanvasScaler {
  /**
   * 检测当前浏览器中画布的实际尺寸
   */
  static detectCanvasSize(): CanvasInfo {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
    
    if (canvas) {
      // 优先使用实际的画布尺寸
      const width = canvas.width || canvas.clientWidth || 1024
      const height = canvas.height || canvas.clientHeight || 576
      
      console.log('🖼️ Detected canvas size:', { width, height, from: 'actual-canvas' })
      
      return {
        width,
        height,
        aspectRatio: width / height
      }
    }
    
    // 尝试从容器获取尺寸
    const container = document.getElementById('game-container')
    if (container) {
      const width = container.clientWidth || 1024
      const height = container.clientHeight || 576
      
      console.log('🖼️ Detected canvas size:', { width, height, from: 'container' })
      
      return {
        width,
        height,
        aspectRatio: width / height
      }
    }
    
    // 基于视窗大小进行智能估算
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let width = Math.min(1024, viewportWidth * 0.9)
    let height = Math.min(576, viewportHeight * 0.7)
    
    // 保持16:9比例
    const targetRatio = 16 / 9
    const currentRatio = width / height
    
    if (currentRatio > targetRatio) {
      // 太宽，限制宽度
      width = height * targetRatio
    } else if (currentRatio < targetRatio) {
      // 太高，限制高度
      height = width / targetRatio
    }
    
    console.log('🖼️ Estimated canvas size:', { 
      width: Math.round(width), 
      height: Math.round(height), 
      from: 'viewport-estimation',
      viewport: `${viewportWidth}x${viewportHeight}`
    })
    
    return {
      width: Math.round(width),
      height: Math.round(height),
      aspectRatio: width / height
    }
  }

  /**
   * 分析地图数据的边界范围
   */
  static analyzeMapBounds(data: any): MapBounds {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    let totalPoints = 0

    // 收集所有坐标点
    const collectPoints = (points: any[], accessor: (point: any) => [number, number] | null) => {
      points.forEach(point => {
        const coords = accessor(point)
        if (coords) {
          const [x, y] = coords
          if (typeof x === 'number' && typeof y === 'number' && isFinite(x) && isFinite(y)) {
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
            totalPoints++
          }
        }
      })
    }

    // 起始点
    if (data.starting_points && Array.isArray(data.starting_points)) {
      collectPoints(data.starting_points, point => 
        point.coordinates && Array.isArray(point.coordinates) ? point.coordinates : null
      )
    }

    // 终点
    if (data.end_points && Array.isArray(data.end_points)) {
      collectPoints(data.end_points, point => 
        point.coordinates && Array.isArray(point.coordinates) ? point.coordinates : null
      )
    }

    // 平台
    if (data.rigid_bodies && Array.isArray(data.rigid_bodies)) {
      data.rigid_bodies.forEach((body: any) => {
        if (body.contour_points && Array.isArray(body.contour_points)) {
          collectPoints(body.contour_points, point => 
            Array.isArray(point) && point.length >= 2 ? [point[0], point[1]] : null
          )
        }
      })
    }

    // 金币
    if (data.coins && Array.isArray(data.coins)) {
      collectPoints(data.coins, coin => {
        if (coin.coordinates && Array.isArray(coin.coordinates)) {
          return coin.coordinates
        } else if (typeof coin.x === 'number' && typeof coin.y === 'number') {
          return [coin.x, coin.y]
        }
        return null
      })
    }

    // 刺
    if (data.spikes && Array.isArray(data.spikes)) {
      collectPoints(data.spikes, spike => 
        spike.coordinates && Array.isArray(spike.coordinates) ? spike.coordinates : null
      )
    }

    // 敌人
    if (data.enemies && Array.isArray(data.enemies)) {
      collectPoints(data.enemies, enemy => 
        typeof enemy.x === 'number' && typeof enemy.y === 'number' ? [enemy.x, enemy.y] : null
      )
    }

    if (totalPoints === 0 || !isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      // 没有有效数据，返回默认边界
      return {
        minX: 0, maxX: 1024, minY: 0, maxY: 576,
        width: 1024, height: 576, centerX: 512, centerY: 288
      }
    }

    const width = maxX - minX
    const height = maxY - minY
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    return { minX, maxX, minY, maxY, width, height, centerX, centerY }
  }

  /**
   * 计算最佳的缩放参数
   */
  static calculateOptimalScale(mapBounds: MapBounds, canvasInfo: CanvasInfo): {
    scaleX: number
    scaleY: number
    offsetX: number
    offsetY: number
    needsScaling: boolean
  } {
    const { width: mapWidth, height: mapHeight, minX, minY } = mapBounds
    const { width: canvasWidth, height: canvasHeight } = canvasInfo

    // 检查是否需要缩放
    const isSmallMap = mapWidth < canvasWidth * 0.8 || mapHeight < canvasHeight * 0.8
    const isTinyMap = mapWidth < 400 || mapHeight < 300
    
    if (!isSmallMap && !isTinyMap) {
      // 地图已经是合适的大小，不需要缩放
      return {
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
        needsScaling: false
      }
    }

    // 计算缩放比例，保持地图在画布中央，留一些边距
    const padding = Math.min(canvasWidth, canvasHeight) * 0.05 // 5% 的边距
    const targetWidth = canvasWidth - padding * 2
    const targetHeight = canvasHeight - padding * 2

    // 计算等比例缩放，确保地图不会超出画布
    const scaleX = targetWidth / mapWidth
    const scaleY = targetHeight / mapHeight
    const uniformScale = Math.min(scaleX, scaleY) // 使用较小的缩放比例保持比例

    // 计算偏移，让地图居中
    const scaledMapWidth = mapWidth * uniformScale
    const scaledMapHeight = mapHeight * uniformScale
    const offsetX = (canvasWidth - scaledMapWidth) / 2 - minX * uniformScale
    const offsetY = (canvasHeight - scaledMapHeight) / 2 - minY * uniformScale

    console.log('🎯 Calculated optimal scaling:', {
      mapSize: `${mapWidth.toFixed(1)}x${mapHeight.toFixed(1)}`,
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      scale: uniformScale.toFixed(3),
      offset: `(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`,
      finalMapSize: `${scaledMapWidth.toFixed(1)}x${scaledMapHeight.toFixed(1)}`
    })

    return {
      scaleX: uniformScale,
      scaleY: uniformScale,
      offsetX,
      offsetY,
      needsScaling: true
    }
  }

  /**
   * 应用缩放和偏移到地图数据
   */
  static applyScaleAndOffset(data: any, scaleParams: {
    scaleX: number
    scaleY: number
    offsetX: number
    offsetY: number
  }): any {
    if (!scaleParams || (scaleParams.scaleX === 1 && scaleParams.scaleY === 1 && scaleParams.offsetX === 0 && scaleParams.offsetY === 0)) {
      return data // 无需变换
    }

    const { scaleX, scaleY, offsetX, offsetY } = scaleParams
    const scaledData = JSON.parse(JSON.stringify(data)) // 深拷贝

    const transformPoint = (x: number, y: number): [number, number] => [
      Math.round(x * scaleX + offsetX),
      Math.round(y * scaleY + offsetY)
    ]

    // 变换起始点
    if (scaledData.starting_points) {
      scaledData.starting_points = scaledData.starting_points.map((point: any) => ({
        ...point,
        coordinates: transformPoint(point.coordinates[0], point.coordinates[1])
      }))
    }

    // 变换终点
    if (scaledData.end_points) {
      scaledData.end_points = scaledData.end_points.map((point: any) => ({
        ...point,
        coordinates: transformPoint(point.coordinates[0], point.coordinates[1])
      }))
    }

    // 变换平台
    if (scaledData.rigid_bodies) {
      scaledData.rigid_bodies = scaledData.rigid_bodies.map((body: any) => ({
        ...body,
        contour_points: body.contour_points.map((point: any) => 
          transformPoint(point[0], point[1])
        )
      }))
    }

    // 变换金币
    if (scaledData.coins) {
      scaledData.coins = scaledData.coins.map((coin: any) => {
        if (coin.coordinates && Array.isArray(coin.coordinates)) {
          const [x, y] = transformPoint(coin.coordinates[0], coin.coordinates[1])
          return { ...coin, coordinates: [x, y], x, y }
        } else if (typeof coin.x === 'number' && typeof coin.y === 'number') {
          const [x, y] = transformPoint(coin.x, coin.y)
          return { ...coin, x, y }
        }
        return coin
      })
    }

    // 变换刺
    if (scaledData.spikes) {
      scaledData.spikes = scaledData.spikes.map((spike: any) => ({
        ...spike,
        coordinates: transformPoint(spike.coordinates[0], spike.coordinates[1])
      }))
    }

    // 变换敌人
    if (scaledData.enemies) {
      scaledData.enemies = scaledData.enemies.map((enemy: any) => {
        const [x, y] = transformPoint(enemy.x, enemy.y)
        return { ...enemy, x, y }
      })
    }

    return scaledData
  }

  /**
   * 一站式智能缩放处理
   */
  static smartScale(data: any): any {
    console.log('🎯 Starting smart scaling process...')
    
    // 1. 检测画布尺寸
    const canvasInfo = this.detectCanvasSize()
    
    // 2. 分析地图边界
    const mapBounds = this.analyzeMapBounds(data)
    
    console.log('📊 Map bounds analysis:', {
      bounds: `(${mapBounds.minX}, ${mapBounds.minY}) → (${mapBounds.maxX}, ${mapBounds.maxY})`,
      size: `${mapBounds.width.toFixed(1)}x${mapBounds.height.toFixed(1)}`,
      center: `(${mapBounds.centerX.toFixed(1)}, ${mapBounds.centerY.toFixed(1)})`
    })
    
    // 3. 计算最佳缩放
    const scaleParams = this.calculateOptimalScale(mapBounds, canvasInfo)
    
    if (!scaleParams.needsScaling) {
      console.log('✅ Map is already properly sized, no scaling needed')
      return data
    }
    
    // 4. 应用缩放
    const scaledData = this.applyScaleAndOffset(data, scaleParams)
    
    console.log('🎉 Smart scaling completed successfully!')
    return scaledData
  }
}