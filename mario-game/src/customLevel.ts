import { GameEngine } from './engine/GameEngine'
import { LevelBuilder } from './engine/LevelBuilder'

export function loadCustomLevel(engine: GameEngine): void {
  const builder = new LevelBuilder(engine)
  builder.clear()

  // 根据 level_data.json 数据直接构建 Mario 风格关卡

  // 玩家起始位置 - 基于 starting_points: [40, 526]
  builder.setPlayerStart(40, 460)

  // === 地面和主平台系统 ===
  // 基于 rigid_bodies 第二个大型刚体的轮廓数据构建地形

  // 左侧起始地面 (Mario 经典绿色地面)
  builder.addPlatform(0, 500, 280, 76, 'ground')

  // 左侧山丘平台 (基于轮廓点 [280, 168] 区域)
  builder.addPlatform(280, 400, 100, 100, 'ground')

  // 中央浮空砖块平台 (Mario 经典砖块)
  builder.addBlock(320, 350, 'brick')
  builder.addBlock(352, 350, 'brick')
  builder.addBlock(384, 350, 'brick')
  builder.addBlock(416, 350, 'question') // 问号块
  builder.addBlock(448, 350, 'brick')

  // 中央大平台 (基于轮廓数据 [450-460, 300-400] 区域)
  builder.addPlatform(400, 450, 120, 50, 'ground')

  // 右侧阶梯式平台 (Mario 经典阶梯设计)
  builder.addPlatform(550, 480, 64, 32, 'brick')
  builder.addPlatform(580, 450, 64, 32, 'brick')
  builder.addPlatform(610, 420, 64, 32, 'brick')
  builder.addPlatform(640, 390, 64, 32, 'brick')

  // 高空云朵平台 (基于轮廓点向上的区域)
  builder.addPlatform(700, 300, 100, 20, 'platform')
  builder.addPlatform(820, 250, 100, 20, 'platform')

  // 终点区域平台 (基于 end_points: [910, 159])
  builder.addPlatform(880, 400, 120, 76, 'ground')

  // === 终点城堡旗杆 ===
  // 在 [910, 159] 位置创建目标管道
  builder.addPipe(910, 320, 80, true) // 目标管道

  // === Mario 经典元素 ===

  // 硬币路径 (Mario 金币)
  builder.addCoin(100, 400)
  builder.addCoin(140, 380)
  builder.addCoin(180, 360)
  builder.addCoin(220, 340)

  // 中央区域硬币
  builder.addCoin(450, 300)
  builder.addCoin(480, 280)
  builder.addCoin(510, 260)

  // 高空硬币挑战
  builder.addCoin(750, 250)
  builder.addCoin(870, 200)
  builder.addCoin(910, 180)

  // === 敌人配置 (Mario 经典敌人) ===

  // 地面巡逻的栗子怪
  builder.addEnemy(150, 450, 'goomba')
  builder.addEnemy(200, 450, 'goomba')

  // 平台上的乌龟
  builder.addEnemy(450, 400, 'koopa')

  // 阶梯区域的栗子怪
  builder.addEnemy(580, 420, 'goomba')
  builder.addEnemy(640, 360, 'goomba')

  // 终点前的守卫乌龟
  builder.addEnemy(850, 350, 'koopa')

  // === 道具系统 ===

  // 起始区域蘑菇 (从问号块中获得)
  builder.addPowerUp(416, 320, 'mushroom') // 在问号块位置

  // 中期星星道具
  builder.addPowerUp(750, 250, 'star')

  // 终点前的火花
  builder.addPowerUp(880, 350, 'flower')

  // === 装饰和隐藏元素 ===

  // 隐藏的1up蘑菇 (Mario 经典隐藏道具)
  builder.addBlock(200, 300, 'brick') // 隐藏砖块

  // 管道装饰 (不是目标，只是装饰)
  builder.addPipe(300, 450, 50, false)

  // 额外的问号块挑战
  builder.addBlock(600, 300, 'question')
  builder.addBlock(750, 200, 'question')

  // === 跳跃挑战区域 ===

  // 浮空砖块序列 (需要精确跳跃)
  builder.addBlock(520, 380, 'brick')
  builder.addBlock(540, 360, 'brick')
  builder.addBlock(560, 340, 'brick')
  builder.addBlock(580, 320, 'brick')

  // 云朵跳跃挑战
  builder.addPlatform(650, 280, 40, 15, 'platform')
  builder.addPlatform(700, 260, 40, 15, 'platform')
  builder.addPlatform(750, 240, 40, 15, 'platform')

  // === 基于小刚体数据的特殊平台 ===
  // rigid_bodies[0]: [951, 562, 1, 12] - 创建小的隐藏平台
  builder.addPlatform(951, 550, 32, 20, 'platform')

  // === 最终构建 ===
  builder.build()

  console.log('🍄 Mario 风格关卡已加载！')
  console.log('🎯 从起始位置 [40, 460] 到终点管道 [910, 320]')
  console.log('💰 收集所有硬币并到达城堡！')
}

// 导出用于主游戏循环
export function initCustomLevel(engine: GameEngine): void {
  loadCustomLevel(engine)
  engine.start()
}