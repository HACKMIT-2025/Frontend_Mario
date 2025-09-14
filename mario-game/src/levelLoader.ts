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
}

export class LevelLoader {
  private static apiBaseUrl = 'YOUR_API_URL' // 将被替换为实际的API地址

  /**
   * 从URL获取levelId
   */
  static getLevelId(): string | null {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('id') || urlParams.get('level')
  }

  /**
   * 检测当前页面模式
   */
  static getPageMode(): 'main' | 'play' | 'embed' {
    const pathname = window.location.pathname
    if (pathname.includes('play')) return 'play'
    if (pathname.includes('embed')) return 'embed'
    return 'main'
  }

  /**
   * 从API获取地图数据
   */
  static async fetchLevelData(levelId: string, apiUrl?: string): Promise<LevelData> {
    const baseUrl = apiUrl || this.apiBaseUrl

    try {
      console.log(`🌐 Fetching level data for ID: ${levelId}`)

      const response = await fetch(`${baseUrl}/api/levels/${levelId}`, {
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

      return this.validateLevelData(data)
    } catch (error) {
      console.error('❌ Failed to fetch level data:', error)

      // 返回默认关卡数据作为fallback
      return this.getDefaultLevelData()
    }
  }

  /**
   * 从URL参数直接加载压缩的数据（备用方案）
   */
  static loadFromURL(): LevelData | null {
    const urlParams = new URLSearchParams(window.location.search)
    const data = urlParams.get('data')

    if (!data) return null

    try {
      // 如果需要解压缩，这里可以添加解压逻辑
      const decompressed = atob(data) // 简单base64解码
      const levelData = JSON.parse(decompressed)

      console.log('📋 Level data loaded from URL:', levelData)
      return this.validateLevelData(levelData)
    } catch (error) {
      console.error('❌ Failed to parse URL data:', error)
      return null
    }
  }

  /**
   * 验证和规范化地图数据
   */
  static validateLevelData(data: any): LevelData {
    const validated: LevelData = {
      starting_points: [],
      end_points: [],
      rigid_bodies: []
    }

    // 验证起始点
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

    // 验证终点
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

    // 验证刚体（墙壁和平台）
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
        .filter((body: any) => body.contour_points.length >= 3) // 至少3个点才能形成多边形

      console.log('🔷 Processed rigid bodies:', validated.rigid_bodies.length, 'valid polygons')
    }

    // 验证金币（可选）
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

    // 验证敌人（可选）
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
   * 获取默认关卡数据（fallback）
   */
  static getDefaultLevelData(): LevelData {
    return {
      starting_points: [{ coordinates: [100, 400] }],
      end_points: [{ coordinates: [900, 400] }],
      rigid_bodies: [
        {
          // 地面
          contour_points: [
            [0, 550],
            [1024, 550],
            [1024, 576],
            [0, 576]
          ]
        },
        {
          // 测试平台
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
   * 设置API基础URL（用于配置）
   */
  static setApiBaseUrl(url: string) {
    this.apiBaseUrl = url.replace(/\/$/, '') // 移除末尾斜杠
    console.log(`🔧 API base URL set to: ${this.apiBaseUrl}`)
  }

  /**
   * 从JSON URL直接加载关卡数据
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

      return this.validateLevelData(levelData)
    } catch (error) {
      console.error('❌ Failed to load from JSON URL:', error)
      throw error
    }
  }

  /**
   * 主加载函数 - 自动选择最佳加载方式
   */
  static async loadLevelData(apiUrl?: string): Promise<LevelData> {
    const urlParams = new URLSearchParams(window.location.search)

    // 1. 优先尝试从JSON URL直接加载（新功能）
    const jsonUrl = urlParams.get('json')
    if (jsonUrl) {
      try {
        return await this.loadFromJSONUrl(jsonUrl)
      } catch (error) {
        console.warn('⚠️ Failed to load from JSON URL, trying other methods...')
      }
    }

    // 2. 尝试从API获取levelId
    const levelId = this.getLevelId()
    if (levelId) {
      try {
        return await this.fetchLevelData(levelId, apiUrl)
      } catch (error) {
        console.warn('⚠️ Failed to fetch from API, trying URL fallback...')
      }
    }

    // 3. 尝试从URL参数直接加载Base64数据
    const urlData = this.loadFromURL()
    if (urlData) {
      return urlData
    }

    // 4. 最后使用默认数据
    console.log('📋 Using default level data')
    return this.getDefaultLevelData()
  }
}