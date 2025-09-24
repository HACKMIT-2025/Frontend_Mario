# Mario游戏地图加载完整指南 🗺️

Mario游戏支持多种地图加载方式，从简单的手动构建到复杂的API加载。以下是完整的使用指南。

## 🎯 地图加载方式概览

### 1. 手动构建地图（编程方式）
### 2. 预设地图加载
### 3. 从API加载地图
### 4. 从JSON文件加载地图
### 5. 从URL参数加载地图
### 6. 从图像识别数据生成地图

---

## 🔧 1. 手动构建地图

### 基本用法
```javascript
// 清空当前地图
GameAPI.clearLevel()

// 添加地面
GameAPI.addPlatform(0, 500, 1024, 76, 'ground')

// 添加平台
GameAPI.addPlatform(300, 400, 100, 20, 'platform')
GameAPI.addPlatform(500, 350, 100, 20, 'platform')

// 添加敌人
GameAPI.addEnemy(400, 450, 'goomba')
GameAPI.addEnemy(600, 450, 'koopa')

// 添加金币
GameAPI.addCoin(350, 350)
GameAPI.addCoin(550, 300)

// 添加道具
GameAPI.addPowerUp(750, 300, 'mushroom')

// 设置玩家起始位置
GameAPI.setPlayerStart(100, 400)

// 构建并启动游戏
GameAPI.buildLevel().startGame()
```

### 可用的元素类型

#### 平台类型
- `'ground'` - 地面平台
- `'platform'` - 普通平台  
- `'brick'` - 砖块平台
- `'question'` - 问号方块
- `'pipe'` - 管道
- `'underground'` - 地下平台

#### 敌人类型
- `'goomba'` - 栗子小子
- `'koopa'` - 乌龟
- `'firebar'` - 火球
- `'spike'` - 刺猬

#### 道具类型
- `'mushroom'` - 蘑菇
- `'flower'` - 火花
- `'star'` - 星星

### 高级构建方法
```javascript
// 生成地面
GameAPI.generateGround(0, 3000, 500)

// 生成多个平台
GameAPI.generatePlatforms(5, 200, 400, 150, 50)

// 添加金币行
GameAPI.addCoinRow(300, 350, 5)

// 添加平台阶梯
GameAPI.addPlatformStairs(1200, 500, 5)

// 添加管道
GameAPI.addPipe(800, 400, 100) // x, y, height

// 添加多边形平台
GameAPI.addPolygon([
  [200, 300], [300, 300], [250, 250]
], 'polygon')

// 添加刺猬
GameAPI.addSpike(400, 450, 32) // x, y, size

// 添加目标点
GameAPI.addGoal(2500, 200)
```

---

## 🎮 2. 预设地图加载

### 内置预设地图
```javascript
// 经典地图
GameAPI.loadClassicLevel()

// 地下地图
GameAPI.loadUndergroundLevel()

// 天空地图
GameAPI.loadSkyLevel()

// 随机生成地图
GameAPI.generateRandomLevel()
```

### game.html中的预设地图
在`game.html`中，点击控制面板中的按钮即可加载：
- **Level 1** - 经典地图
- **Level 2** - 地下地图
- **Level 3** - 天空地图
- **Test Level** - 测试地图
- **Random Level** - 随机地图

---

## 🌐 3. 从API加载地图

### URL格式
```
https://yoursite.com/game.html?id=LEVEL_ID
https://yoursite.com/play.html?level=LEVEL_ID
https://yoursite.com/embed.html?id=LEVEL_ID
```

### 配置API端点
```javascript
// 设置API基础URL
LevelLoader.setApiBaseUrl('https://your-backend.com')

// 或者在环境变量中设置
// VITE_BACKEND_URL=https://your-backend.com
```

### API数据格式
你的API应该返回以下格式的JSON：
```json
{
  "starting_points": [
    {"coordinates": [100, 400]}
  ],
  "end_points": [
    {"coordinates": [2500, 200]}
  ],
  "rigid_bodies": [
    {
      "contour_points": [
        [0, 550], [1024, 550], [1024, 576], [0, 576]
      ]
    }
  ],
  "coins": [
    {"x": 350, "y": 400},
    {"coordinates": [500, 300]}
  ],
  "spikes": [
    {"coordinates": [400, 450]}
  ],
  "enemies": [
    {"x": 600, "y": 450, "type": "goomba"}
  ]
}
```

---

## 📁 4. 从JSON文件加载地图

### 直接从JSON URL加载
```
https://yoursite.com/game.html?json=https://example.com/level.json
```

### 本地JSON文件
```javascript
// 从本地JSON文件加载
const levelData = await LevelLoader.loadFromJSONUrl('/levels/level1.json')
GameAPI.generateFromImageData([levelData])
```

---

## 🔗 5. 从URL参数加载地图

### Base64编码的地图数据
```
https://yoursite.com/game.html?data=eyJzdGFydGluZ19wb2ludHMiOlt7ImNvb3JkaW5hdGVzIjpbMTAwLDQwMF19XX0=
```

### 生成Base64数据
```javascript
// 导出当前地图为JSON
const json = GameAPI.exportJSON()

// 编码为Base64
const base64 = btoa(json)

// 生成URL
const url = `${window.location.origin}${window.location.pathname}?data=${base64}`
console.log('分享链接:', url)
```

---

## 🤖 6. 从图像识别数据生成地图

### 图像识别数据格式
```javascript
const imageData = [
  {
    type: 'platform',
    x: 300,
    y: 400,
    width: 100,
    height: 20
  },
  {
    type: 'enemy',
    x: 400,
    y: 450,
    enemyType: 'goomba'
  },
  {
    type: 'coin',
    x: 350,
    y: 350
  }
]

// 从图像数据生成地图
GameAPI.generateFromImageData(imageData)
```

---

## 🛠️ 实用工具和调试

### 地图导入/导出
```javascript
// 导出当前地图
const mapData = GameAPI.exportJSON()
console.log(mapData)

// 导入地图
GameAPI.importJSON(mapData)
```

### 调试工具
```javascript
// 查看当前平台
showPlatforms()

// 查看实体碰撞
showCollisions()

// 检查精灵加载状态
checkSprites()

// 查看当前地图数据
console.log(GameAPI.getBuilder().levelData)
```

### 获取地图信息
```javascript
// 获取所有平台
const platforms = GameAPI.getPlatforms()

// 获取所有实体
const entities = GameAPI.getEntities()

// 获取游戏引擎
const engine = GameAPI.getEngine()

// 获取关卡构建器
const builder = GameAPI.getBuilder()
```

---

## 🎯 完整示例

### 示例1：手动构建复杂地图
```javascript
GameAPI.clearLevel()
  .generateGround(0, 3000, 500)
  .addPlatform(300, 400, 100, 20)
  .addPlatform(500, 350, 100, 20)
  .addPlatform(700, 300, 100, 20)
  .addPipe(900, 400, 100)
  .addPipe(1100, 350, 150)
  .addPlatformStairs(1300, 500, 5)
  .addCoinRow(320, 350, 5)
  .addCoinRow(520, 300, 5)
  .addCoinRow(720, 250, 5)
  .addEnemy(400, 450, 'goomba')
  .addEnemy(600, 450, 'goomba')
  .addEnemy(1400, 450, 'koopa')
  .addPowerUp(800, 350, 'mushroom')
  .addPowerUp(1200, 250, 'flower')
  .addGoal(2800, 200)
  .setPlayerStart(100, 400)
  .buildLevel()
  .startGame()
```

### 示例2：从URL加载地图
```javascript
// URL: https://yoursite.com/game.html?id=level123

// 游戏会自动检测URL参数并加载对应地图
// 无需额外代码
```

### 示例3：动态加载地图
```javascript
async function loadCustomMap(levelId) {
  try {
    // 从API加载地图数据
    const levelData = await LevelLoader.fetchLevelData(levelId)
    
    // 清空当前地图
    GameAPI.clearLevel()
    
    // 根据数据构建地图
    if (levelData.rigid_bodies) {
      levelData.rigid_bodies.forEach(body => {
        GameAPI.addPolygon(body.contour_points, 'polygon')
      })
    }
    
    if (levelData.coins) {
      levelData.coins.forEach(coin => {
        const x = coin.x || coin.coordinates[0]
        const y = coin.y || coin.coordinates[1]
        GameAPI.addCoin(x, y)
      })
    }
    
    if (levelData.enemies) {
      levelData.enemies.forEach(enemy => {
        GameAPI.addEnemy(enemy.x, enemy.y, enemy.type)
      })
    }
    
    // 设置起点和终点
    if (levelData.starting_points[0]) {
      const [x, y] = levelData.starting_points[0].coordinates
      GameAPI.setPlayerStart(x, y)
    }
    
    if (levelData.end_points[0]) {
      const [x, y] = levelData.end_points[0].coordinates
      GameAPI.addGoal(x, y)
    }
    
    // 构建并启动
    GameAPI.buildLevel().startGame()
    
  } catch (error) {
    console.error('Failed to load map:', error)
    // 加载默认地图作为后备
    GameAPI.loadClassicLevel()
  }
}

// 使用
loadCustomMap('my-level-123')
```

---

## 📋 最佳实践

### 1. 错误处理
- 始终提供默认地图作为后备
- 验证地图数据的完整性
- 处理网络请求失败的情况

### 2. 性能优化
- 避免创建过多的实体
- 合理使用多边形而不是大量小平台
- 在移动设备上适当减少元素数量

### 3. 用户体验
- 显示加载进度
- 提供地图预览图
- 支持地图分享功能

### 4. 调试技巧
- 使用控制台调试工具
- 导出地图数据进行分析
- 逐步构建复杂地图

---

## 🚀 快速开始

1. **简单开始**：使用预设地图
   ```javascript
   GameAPI.loadClassicLevel()
   ```

2. **手动构建**：添加基本元素
   ```javascript
   GameAPI.clearLevel()
     .addPlatform(0, 500, 1024, 76, 'ground')
     .addPlatform(300, 400, 100, 20)
     .addCoin(350, 350)
     .setPlayerStart(100, 400)
     .buildLevel().startGame()
   ```

3. **从URL加载**：使用`?id=levelId`参数

4. **高级功能**：实现自定义API端点并使用复杂的地图数据结构

现在你已经掌握了Mario游戏的所有地图加载方式！🎉