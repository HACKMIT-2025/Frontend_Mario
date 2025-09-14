import { GameEngine } from './engine/GameEngine'
import { LevelBuilder } from './engine/LevelBuilder'

export function createLevelFromImageData(engine: GameEngine): void {
  const levelBuilder = new LevelBuilder(engine)

  // 根据 level_data.json 的数据构建地图
  levelBuilder.clear()

  // 设置玩家起始位置 - 基于 starting_points 数据
  // 坐标 [40, 526] 转换为游戏坐标
  levelBuilder.setPlayerStart(40, 526)

  // 创建主要地面平台 - 基于 rigid_bodies 中的大平台数据
  // 这个平台有复杂的轮廓，我们简化为几个关键的平台段

  // 左侧地面段 (基于轮廓点分析)
  levelBuilder.addPlatform(0, 550, 400, 30, 'platform')

  // 中间平台段
  levelBuilder.addPlatform(280, 400, 200, 20, 'platform')

  // 右侧上升平台
  levelBuilder.addPlatform(600, 350, 150, 20, 'platform')

  // 高层平台 (接近终点区域)
  levelBuilder.addPlatform(800, 200, 180, 20, 'platform')

  // 终点平台 - 基于 end_points 数据
  // 坐标 [910, 159] 创建目标管道
  levelBuilder.addPipe(910, 160, 100, true) // 设置为目标管道

  // 小平台 - 基于第一个 rigid_body 数据
  // 位置 [951, 562]，尺寸 1×12，转换为合理的游戏平台
  levelBuilder.addPlatform(950, 560, 32, 16, 'platform')

  // 添加一些装饰性元素和挑战

  // 硬币收集路径
  levelBuilder.addCoinRow(300, 350, 5, 40)
  levelBuilder.addCoinRow(650, 300, 4, 35)
  levelBuilder.addCoinRow(850, 150, 3, 30)

  // 敌人放置 - 增加游戏挑战性
  levelBuilder.addEnemy(200, 500, 'goomba')
  levelBuilder.addEnemy(450, 350, 'goomba')
  levelBuilder.addEnemy(750, 300, 'koopa')

  // 道具
  levelBuilder.addPowerUp(350, 350, 'mushroom')
  levelBuilder.addPowerUp(680, 300, 'star')

  // 跳跃挑战区域
  levelBuilder.addPlatform(500, 450, 80, 15, 'platform')
  levelBuilder.addPlatform(600, 400, 80, 15, 'platform')
  levelBuilder.addPlatform(700, 350, 80, 15, 'platform')

  // 构建并加载地图
  levelBuilder.build()

  console.log('🎮 地图构建完成！基于 level_data.json 数据创建')
  console.log('📍 玩家起始位置: (40, 526)')
  console.log('🏁 目标位置: (910, 159)')
  console.log('🔧 平台数量: 8个主要平台')
  console.log('💰 硬币数量: 12个')
  console.log('👾 敌人数量: 3个')
  console.log('⭐ 道具数量: 2个')
}

// 导出一个更通用的函数，可以处理类似的图像识别数据
export function buildLevelFromAnalysisData(
  engine: GameEngine,
  data: {
    starting_points?: Array<{ coordinates: number[]; shape_type: string }>;
    end_points?: Array<{ coordinates: number[]; shape_type: string }>;
    rigid_bodies?: Array<{ bounding_box: number[]; centroid: number[] }>;
  }
): void {
  const levelBuilder = new LevelBuilder(engine)
  levelBuilder.clear()

  // 处理起始点
  if (data.starting_points && data.starting_points.length > 0) {
    const startPoint = data.starting_points[0]
    const [x, y] = startPoint.coordinates
    levelBuilder.setPlayerStart(x, y)
  } else {
    levelBuilder.setPlayerStart(100, 400) // 默认位置
  }

  // 处理终点
  if (data.end_points && data.end_points.length > 0) {
    const endPoint = data.end_points[0]
    const [x, y] = endPoint.coordinates

    if (endPoint.shape_type === 'circle') {
      // 圆形终点创建目标管道
      levelBuilder.addPipe(x, y, 100, true)
    } else {
      // 其他形状创建普通平台作为终点
      levelBuilder.addPlatform(x - 50, y, 100, 20, 'goal_pipe')
    }
  }

  // 处理刚体/平台
  if (data.rigid_bodies) {
    data.rigid_bodies.forEach((body, _index) => {
      const [x, y, width, height] = body.bounding_box

      // 根据尺寸判断平台类型
      if (width > 200 && height > 50) {
        // 大平台作为地面
        levelBuilder.addPlatform(x, y + height - 30, width, 30, 'platform')
      } else if (width > 50) {
        // 中等平台
        levelBuilder.addPlatform(x, y, width, Math.max(height, 20), 'platform')
      } else {
        // 小平台
        levelBuilder.addPlatform(x, y, Math.max(width, 32), Math.max(height, 16), 'platform')
      }
    })
  }

  // 构建地图
  levelBuilder.build()

  console.log('🎮 通用地图构建完成！')
  console.log(`📍 起始点数量: ${data.starting_points?.length || 0}`)
  console.log(`🏁 终点数量: ${data.end_points?.length || 0}`)
  console.log(`🔧 刚体数量: ${data.rigid_bodies?.length || 0}`)
}