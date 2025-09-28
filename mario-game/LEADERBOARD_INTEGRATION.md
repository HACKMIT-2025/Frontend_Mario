# 🏆 Mario Game 排行榜集成指南

## 📋 概述

Mario游戏现在集成了完整的排行榜系统，支持：
- 通关成绩提交
- 实时排行榜显示
- 玩家个人记录
- 完美通关标记
- 多种排序方式

## 🎮 游戏模式支持

### 1. 主游戏模式 (main.ts)
- **文件**: `src/main.ts`
- **特点**: 本地固定关卡
- **排行榜支持**: ❌ **不支持**
- **原因**: 使用本地硬编码关卡，无关卡ID来源

### 2. Play模式 (play.ts)
- **文件**: `src/play.ts`
- **特点**: 从API动态加载关卡
- **排行榜支持**: ✅ **支持**
- **关卡ID来源**: URL参数 `?levelId=123` 或 `?id=123`
- **默认关卡ID**: 2

### 3. Embed模式 (embed.ts)
- **文件**: `src/embed.ts`
- **特点**: 嵌入到其他页面，从API加载关卡
- **排行榜支持**: ✅ **支持**
- **关卡ID来源**: URL参数 `?levelId=123` 或 `?id=123`
- **默认关卡ID**: 3

## 🔧 技术实现

### 核心组件

1. **VictoryModal** (`src/ui/VictoryModal.ts`)
   - 通关弹窗UI组件
   - 成绩提交表单
   - 排行榜显示

2. **LeaderboardClient** (`src/engine/api/LeaderboardClient.ts`)
   - 排行榜API客户端
   - 成绩提交和查询
   - Backend URL: `https://25hackmit--hackmit25-backend.modal.run`

3. **GameEngine** (`src/engine/GameEngine.ts`)
   - 集成排行榜功能
   - 条件性启用排行榜
   - 通关逻辑处理

### Backend集成

- **主Backend**: `https://25hackmit--hackmit25-backend.modal.run`
- **排行榜路由**: `/api/leaderboard/*`
- **健康检查**: `/api/leaderboard/health`

## 🚀 使用方法

### 启用排行榜的模式

```javascript
// Play模式 - 访问URL
https://your-domain.com/play.html?levelId=123

// Embed模式 - 嵌入URL
https://your-domain.com/embed.html?id=456
```

### 游戏内控制

- **移动**: ← → 方向键
- **跳跃**: ↑ 方向键或空格
- **暂停**: P键
- **重启**: R键

### 通关流程

1. 玩家到达终点触发通关
2. 系统计算最终得分
3. 如果启用排行榜，显示通关弹窗
4. 玩家输入昵称等信息
5. 提交成绩到排行榜
6. 显示实时排名和排行榜

## 📊 得分计算

```javascript
最终得分 = Math.max(0,
  1000 +                              // 基础分
  金币数 * 1000 -                      // 金币加分
  死亡次数 * 200 +                     // 死亡扣分
  Math.floor(1000 * Math.exp(-0.05 * 完成时间))  // 时间加分
)
```

## 🏆 排行榜功能

### 玩家管理
- `POST /api/leaderboard/players` - 创建/注册玩家
- `GET /api/leaderboard/players/{nickname}` - 获取玩家信息

### 成绩提交
- `POST /api/leaderboard/scores` - 提交游戏成绩

### 排行榜查询
- `GET /api/leaderboard/levels/{levelId}` - 获取关卡排行榜
- `GET /api/leaderboard/global` - 获取全局排行榜
- `GET /api/leaderboard/players/{nickname}/records` - 玩家个人记录

### 统计数据
- `GET /api/leaderboard/stats/level/{levelId}` - 关卡统计信息

## 🛠️ 开发和调试

### 测试文件
- `test_victory.html` - 通关功能测试页面
- `test_unified_backend_api.py` - Backend API测试脚本

### 调试方法

```javascript
// 检查排行榜状态
gameAPI.getEngine().isLeaderboardEnabled()

// 手动启用/禁用排行榜
gameAPI.getEngine().enableLeaderboard(true/false)

// 设置关卡ID
gameAPI.getEngine().setLevelId(123)

// 测试通关弹窗
const victoryModal = new VictoryModal()
const testData = {
  completionTime: 45000,
  deaths: 2,
  coins: 3,
  score: 1500,
  levelId: 123
}
await victoryModal.show(testData)
```

### 样式定制

排行榜弹窗样式位于 `src/ui/VictoryModal.css`，支持：
- 响应式设计
- 动画效果
- 主题颜色定制
- 完美通关特效

## 🔍 故障排除

### 常见问题

1. **排行榜不显示**
   - 检查是否使用正确的游戏模式 (play.ts 或 embed.ts)
   - 确认关卡ID是否正确设置
   - 检查Backend连接状态

2. **成绩提交失败**
   - 验证Backend服务是否正常
   - 检查网络连接
   - 查看浏览器控制台错误

3. **样式问题**
   - 确认CSS文件正确导入
   - 检查CSS冲突

### 日志输出

游戏会输出详细的控制台日志：
- `🎮 设置关卡ID: X，排行榜已启用`
- `🏆 Leaderboard enabled/disabled`
- `🎉 Victory! Leaderboard disabled for this mode.`

## 📱 移动端支持

- 自动显示虚拟控制器
- 响应式弹窗设计
- 触摸友好的交互

## 🔒 安全性

- 输入验证和清理
- 安全的API通信
- 防止SQL注入和XSS攻击

## 📝 更新日志

- ✅ 集成排行榜到主Backend
- ✅ 条件性启用排行榜功能
- ✅ 完整的通关弹窗系统
- ✅ 实时排名显示
- ✅ 多模式支持

---

**注意**: 只有从URL获得地图信息以及ID的模式才支持排行榜功能！