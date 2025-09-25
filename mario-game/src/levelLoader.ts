import { MapScaler } from './utils/MapScaler'
import { CanvasScaler } from './utils/CanvasScaler'

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
}

export class LevelLoader {
  private static apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'https://25hackmit--hackmit25-backend.modal.run' // Use backend API

  /**
   * Get levelId from URL
   */
  static getLevelId(): string | null {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('id') || urlParams.get('level')
  }

  /**
   * Detect current page mode
   */
  static getPageMode(): 'main' | 'play' | 'embed' {
    const pathname = window.location.pathname
    if (pathname.includes('play')) return 'play'
    if (pathname.includes('embed')) return 'embed'
    return 'main'
  }

  /**
   * Get map data from API
   */
  static async fetchLevelData(levelId: string, apiUrl?: string): Promise<LevelData> {
    const baseUrl = apiUrl || this.apiBaseUrl

    try {
      console.log(`🌐 Fetching level data for ID: ${levelId}`)

      const response = await fetch(`${baseUrl}/api/mario/level/${levelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📋 Level data received:', data)

      // 先进行智能缩放，再进行验证
      const scaledData = this.detectAndScaleMapData(data)
      return this.validateLevelData(scaledData)
    } catch (error) {
      console.error('❌ Failed to fetch level data:', error)

      // Return default level data as fallback
      return this.getDefaultLevelData()
    }
  }

  /**
   * Load compressed data directly from URL parameters (fallback method)
   */
  static loadFromURL(): LevelData | null {
    const urlParams = new URLSearchParams(window.location.search)
    const data = urlParams.get('data')

    if (!data) return null

    try {
      // Add decompression logic here if needed
      const decompressed = atob(data) // Simple base64 decoding
      const levelData = JSON.parse(decompressed)

      console.log('📋 Level data loaded from URL:', levelData)
      // 先进行智能缩放，再进行验证
      const scaledData = this.detectAndScaleMapData(levelData)
      return this.validateLevelData(scaledData)
    } catch (error) {
      console.error('❌ Failed to parse URL data:', error)
      return null
    }
  }

  /**
   * 智能缩放地图数据（使用新的CanvasScaler）
   */
  static detectAndScaleMapData(data: any): any {
    console.log('🎆 Using advanced CanvasScaler for intelligent map scaling...')
    
    try {
      // 使用新的CanvasScaler进行智能缩放
      const scaledData = CanvasScaler.smartScale(data)
      console.log('✅ CanvasScaler completed successfully')
      return scaledData
    } catch (error) {
      console.warn('⚠️ CanvasScaler failed, falling back to legacy MapScaler:', error)
      
      // 回退到旧的MapScaler逻辑
      return this.legacyScaleMapData(data)
    }
  }

  /**
   * 旧版缩放逻辑（作为备选方案）
   */
  static legacyScaleMapData(data: any): any {
    // 分析所有坐标，找出数据的实际范围
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    let totalPoints = 0

    // 收集起始点坐标
    if (data.starting_points && Array.isArray(data.starting_points)) {
      data.starting_points.forEach((point: any) => {
        if (point.coordinates && Array.isArray(point.coordinates)) {
          const [x, y] = point.coordinates
          minX = Math.min(minX, x); maxX = Math.max(maxX, x)
          minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          totalPoints++
        }
      })
    }

    // 收集终点坐标
    if (data.end_points && Array.isArray(data.end_points)) {
      data.end_points.forEach((point: any) => {
        if (point.coordinates && Array.isArray(point.coordinates)) {
          const [x, y] = point.coordinates
          minX = Math.min(minX, x); maxX = Math.max(maxX, x)
          minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          totalPoints++
        }
      })
    }

    // 收集平台坐标
    if (data.rigid_bodies && Array.isArray(data.rigid_bodies)) {
      data.rigid_bodies.forEach((body: any) => {
        if (body.contour_points && Array.isArray(body.contour_points)) {
          body.contour_points.forEach((point: any) => {
            if (Array.isArray(point) && point.length >= 2) {
              const [x, y] = point
              minX = Math.min(minX, x); maxX = Math.max(maxX, x)
              minY = Math.min(minY, y); maxY = Math.max(maxY, y)
              totalPoints++
            }
          })
        }
      })
    }

    // 收集金币坐标
    if (data.coins && Array.isArray(data.coins)) {
      data.coins.forEach((coin: any) => {
        let x, y
        if (coin.coordinates && Array.isArray(coin.coordinates)) {
          [x, y] = coin.coordinates
        } else if (typeof coin.x === 'number' && typeof coin.y === 'number') {
          x = coin.x; y = coin.y
        }
        if (typeof x === 'number' && typeof y === 'number') {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x)
          minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          totalPoints++
        }
      })
    }

    // 收集刺坐标
    if (data.spikes && Array.isArray(data.spikes)) {
      data.spikes.forEach((spike: any) => {
        if (spike.coordinates && Array.isArray(spike.coordinates)) {
          const [x, y] = spike.coordinates
          minX = Math.min(minX, x); maxX = Math.max(maxX, x)
          minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          totalPoints++
        }
      })
    }

    // 收集敌人坐标
    if (data.enemies && Array.isArray(data.enemies)) {
      data.enemies.forEach((enemy: any) => {
        if (typeof enemy.x === 'number' && typeof enemy.y === 'number') {
          minX = Math.min(minX, enemy.x); maxX = Math.max(maxX, enemy.x)
          minY = Math.min(minY, enemy.y); maxY = Math.max(maxY, enemy.y)
          totalPoints++
        }
      })
    }

    // 检查是否收集到了有效的坐标数据
    if (totalPoints === 0 || !isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      console.warn('⚠️ No valid coordinates found in map data, using original data')
      return data
    }

    // 计算数据的实际尺寸
    const actualWidth = maxX - minX
    const actualHeight = maxY - minY
    
    console.log(`📏 Legacy scaling - Map data analysis:`, {
      coordinates: totalPoints,
      bounds: `(${minX}, ${minY}) to (${maxX}, ${maxY})`,
      actualSize: `${actualWidth.toFixed(1)}x${actualHeight.toFixed(1)}`,
      standardSize: '1024x576'
    })

    // 判断是否需要缩放（如果数据范围明显小于标准尺寸）
    const needsScaling = actualWidth < 800 || actualHeight < 400 || maxX < 800 || maxY < 400
    
    if (!needsScaling) {
      console.log('📏 Map data appears to be in standard size, no scaling needed')
      return data
    }

    // 创建MapScaler进行智能缩放
    // 假设原始数据是基于图像的实际像素尺寸，需要缩放到1024x576
    const scaler = new MapScaler({
      originalWidth: actualWidth + 50,  // 给一些边距
      originalHeight: actualHeight + 50, // 给一些边距
      targetWidth: 1024,
      targetHeight: 576
    })

    console.log('🔄 Applying legacy map scaling...')
    const scaledData = scaler.scaleLevelData(data)
    scaler.logScalingInfo()
    
    return scaledData
  }

  /**
   * Validate and normalize map data
   */
  static validateLevelData(data: any): LevelData {
    const validated: LevelData = {
      starting_points: [],
      end_points: [],
      rigid_bodies: []
    }

    // Validate starting points
    if (data.starting_points && Array.isArray(data.starting_points)) {
      validated.starting_points = data.starting_points
        .filter((point: any) => point.coordinates && Array.isArray(point.coordinates))
        .map((point: any) => ({
          coordinates: [
            Math.max(0, Math.min(1024, point.coordinates[0])),
            Math.max(0, Math.min(576, point.coordinates[1]))
          ] as [number, number]
        }))

      console.log('🎯 Processed starting points:', validated.starting_points)
    }

    // Validate end points
    if (data.end_points && Array.isArray(data.end_points)) {
      validated.end_points = data.end_points
        .filter((point: any) => point.coordinates && Array.isArray(point.coordinates))
        .map((point: any) => ({
          coordinates: [
            Math.max(0, Math.min(1024, point.coordinates[0])),
            Math.max(0, Math.min(576, point.coordinates[1]))
          ] as [number, number]
        }))

      console.log('🏁 Processed end points:', validated.end_points)
    }

    // Validate rigid bodies (walls and platforms)
    if (data.rigid_bodies && Array.isArray(data.rigid_bodies)) {
      console.log('🔷 Processing rigid bodies:', data.rigid_bodies.length, 'found')

      validated.rigid_bodies = data.rigid_bodies
        .filter((body: any) => body.contour_points && Array.isArray(body.contour_points))
        .map((body: any) => ({
          contour_points: body.contour_points
            .filter((point: any) => Array.isArray(point) && point.length >= 2)
            .map((point: any) => [
              Math.max(0, Math.min(1024, point[0])),
              Math.max(0, Math.min(576, point[1]))
            ] as [number, number])
        }))
        .filter((body: any) => body.contour_points.length >= 3) // At least 3 points to form a polygon

      console.log('🔷 Processed rigid bodies:', validated.rigid_bodies.length, 'valid polygons')
    }

    // Validate coins (optional)
    if (data.coins && Array.isArray(data.coins)) {
      validated.coins = data.coins
        .filter((coin: any) => {
          // Support both formats: {x, y} and {coordinates: [x, y]}
          return (typeof coin.x === 'number' && typeof coin.y === 'number') ||
                 (coin.coordinates && Array.isArray(coin.coordinates) && coin.coordinates.length >= 2)
        })
        .map((coin: any) => {
          // Handle both formats
          let x, y
          if (coin.coordinates && Array.isArray(coin.coordinates)) {
            [x, y] = coin.coordinates
          } else {
            x = coin.x
            y = coin.y
          }
          return {
            x: Math.max(0, Math.min(1024, x)),
            y: Math.max(0, Math.min(576, y))
          }
        })

      console.log('🪙 Processed coins:', validated.coins?.length || 0, 'found')
    }

    // Validate spikes (optional, learn from local engine logic)
    if (data.spikes && Array.isArray(data.spikes)) {
      validated.spikes = data.spikes
        .filter((spike: any) => {
          // Support coordinates format from image recognition, like local engine
          return spike.coordinates && Array.isArray(spike.coordinates) && spike.coordinates.length >= 2
        })
        .map((spike: any) => {
          const [x, y] = spike.coordinates
          return {
            coordinates: [
              Math.max(0, Math.min(1024, x)),
              Math.max(0, Math.min(576, y))
            ] as [number, number]
          }
        })

      console.log('🔺 Processed spikes:', validated.spikes?.length || 0, 'found')
    }

    // Validate enemies (optional)
    if (data.enemies && Array.isArray(data.enemies)) {
      validated.enemies = data.enemies
        .filter((enemy: any) => typeof enemy.x === 'number' && typeof enemy.y === 'number')
        .map((enemy: any) => ({
          x: Math.max(0, Math.min(1024, enemy.x)),
          y: Math.max(0, Math.min(576, enemy.y)),
          type: enemy.type || 'goomba'
        }))
    }

    console.log('✅ Level data validated:', validated)
    return validated
  }

  /**
   * Get default level data (fallback)
   */
  static getDefaultLevelData(): LevelData {
    return {
      starting_points: [{ coordinates: [100, 400] }],
      end_points: [{ coordinates: [900, 400] }],
      rigid_bodies: [
        {
          // Ground
          contour_points: [
            [0, 550],
            [1024, 550],
            [1024, 576],
            [0, 576]
          ]
        },
        {
          // Test platform
          contour_points: [
            [300, 450],
            [400, 450],
            [400, 470],
            [300, 470]
          ]
        }
      ],
      coins: [
        { x: 350, y: 400 },
        { x: 500, y: 300 }
      ]
    }
  }

  /**
   * Set API base URL (for configuration)
   */
  static setApiBaseUrl(url: string) {
    this.apiBaseUrl = url.replace(/\/$/, '') // Remove trailing slash
    console.log(`🔧 API base URL set to: ${this.apiBaseUrl}`)
  }

  /**
   * Load level data directly from JSON URL
   */
  static async loadFromJSONUrl(jsonUrl: string): Promise<LevelData> {
    try {
      console.log(`🌐 Loading level from JSON URL: ${jsonUrl}`)

      const response = await fetch(jsonUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📋 Level data loaded from JSON URL:', data)

      // Check if data has a nested level_data structure (from your backend)
      const levelData = data.level_data || data
      console.log('📋 Extracted level data:', levelData)

      // 先进行智能缩放，再进行验证
      const scaledData = this.detectAndScaleMapData(levelData)
      return this.validateLevelData(scaledData)
    } catch (error) {
      console.error('❌ Failed to load from JSON URL:', error)
      throw error
    }
  }


  /**
   * Main loading function - automatically select best loading method
   */
  static async loadLevelData(apiUrl?: string): Promise<LevelData> {
    const urlParams = new URLSearchParams(window.location.search)

    console.log('🔍 Checking URL params:', window.location.search)
    console.log('🔍 Available params:', Array.from(urlParams.entries()))

    // 1. Priority: try loading directly from JSON URL (new feature)
    const jsonUrl = urlParams.get('json')
    if (jsonUrl) {
      console.log(`🌐 Found JSON URL parameter: ${jsonUrl}`)
      try {
        const result = await this.loadFromJSONUrl(jsonUrl)
        console.log('✅ Successfully loaded from JSON URL')
        return result
      } catch (error) {
        console.warn('⚠️ Failed to load from JSON URL:', error)
        console.warn('⚠️ Trying other methods...')
      }
    } else {
      console.log('❌ No JSON URL parameter found')
    }

    // 2. Try to get levelId from API
    const levelId = this.getLevelId()
    if (levelId) {
      console.log(`🆔 Found level ID: ${levelId}`)
      try {
        const result = await this.fetchLevelData(levelId, apiUrl)
        console.log('✅ Successfully loaded from API')
        return result
      } catch (error) {
        console.warn('⚠️ Failed to fetch from API:', error)
        console.warn('⚠️ Trying URL fallback...')
      }
    } else {
      console.log('❌ No level ID found')
    }

    // 3. Try to load Base64 data directly from URL parameters
    const urlData = this.loadFromURL()
    if (urlData) {
      console.log('✅ Successfully loaded from URL data')
      return urlData
    } else {
      console.log('❌ No URL data found')
    }

    // 4. Finally use default data
    console.log('📋 Using default level data (fallback)')
    return this.getDefaultLevelData()
  }
}