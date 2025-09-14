# 🍄 Mario Game Engine - Frontend

A modern, embeddable Mario-style game engine built with TypeScript, Vite, and HTML5 Canvas. Supports dynamic level loading from APIs and iframe embedding for seamless integration into other applications.

[中文文档](#中文文档) | [API Documentation](#api-documentation) | [Deployment Guide](#deployment)

## Features

- 🎮 **Full Game Engine**: Complete Mario-style physics, collision detection, and gameplay mechanics
- 🔗 **API Integration**: Load levels dynamically from backend APIs
- 📱 **Multiple Access Modes**: Standalone game, full UI mode, and embeddable iframe mode
- 🌐 **Cross-Origin Ready**: CORS configured for iframe embedding across domains
- ⚡ **Fast & Responsive**: Built with Vite for optimal performance
- 🚀 **Vercel Ready**: One-click deployment with proper routing configuration

## Quick Start

### 1. Local Development

```bash
cd mario-game
npm install
npm run dev
```

The game will be available at:
- `http://localhost:5173/` - Main game page
- `http://localhost:5173/play` - Full UI game mode
- `http://localhost:5173/embed` - Iframe embeddable mode

### 2. Building for Production

```bash
npm run build
npm run preview
```

## Access Modes

### 🏠 Main Page (`/`)
The original game interface with built-in level builder and console API.

### 🎮 Play Mode (`/play` or `/play?id=levelId`)
Full-featured game experience with:
- Score tracking and UI elements
- Game controls (pause, restart, share)
- Level information panel
- Keyboard shortcuts (P for pause, Ctrl+R for restart)

### 📱 Embed Mode (`/embed` or `/embed?id=levelId`)
Minimal interface optimized for iframe embedding:
- No external UI elements
- PostMessage communication with parent window
- Responsive design for embed contexts
- Event forwarding to parent (score updates, game state changes)

## API Integration

### Backend API Requirements

Your backend should provide level data via RESTful API:

```http
GET /api/levels/{level_id}
```

**Response Format:**
```json
{
  "starting_points": [
    {
      "coordinates": [100, 400]
    }
  ],
  "end_points": [
    {
      "coordinates": [800, 400]
    }
  ],
  "rigid_bodies": [
    {
      "contour_points": [
        [0, 500], [100, 500], [100, 600], [0, 600]
      ]
    }
  ],
  "coins": [
    {
      "x": 200,
      "y": 400
    }
  ],
  "enemies": [
    {
      "x": 300,
      "y": 450,
      "type": "goomba"
    }
  ]
}
```

### Using with API

**Method 1: URL Parameters**
```
https://your-domain.com/play?id=level123&api=https://your-api.com
```

**Method 2: Environment Configuration**
Set your API base URL in `src/levelLoader.ts`:
```typescript
private static API_BASE_URL = 'https://your-api.com'
```

### Embedding in Other Applications

```html
<!-- Basic Embed -->
<iframe src="https://your-mario-game.vercel.app/embed?id=level123"
        width="1024" height="576" frameborder="0">
</iframe>

<!-- With Custom API -->
<iframe src="https://your-mario-game.vercel.app/embed?id=level123&api=https://your-api.com"
        width="1024" height="576" frameborder="0">
</iframe>
```

### PostMessage Communication

The embedded game communicates with parent windows via PostMessage:

**Messages from Game to Parent:**
```javascript
// Score updates
{ type: 'SCORE_UPDATE', data: { score: 1200 } }

// Game events
{ type: 'GAME_START', data: { timestamp: 1234567890 } }
{ type: 'GAME_OVER', data: { score: 1200, reason: 'enemy_collision' } }
{ type: 'GAME_WIN', data: { score: 1500, time: 45000 } }
```

**Messages from Parent to Game:**
```javascript
// Send to embedded game
iframe.contentWindow.postMessage({ type: 'PAUSE_GAME' }, '*')
iframe.contentWindow.postMessage({ type: 'RESUME_GAME' }, '*')
iframe.contentWindow.postMessage({ type: 'RESET_GAME' }, '*')
iframe.contentWindow.postMessage({
  type: 'SET_API_URL',
  apiUrl: 'https://new-api.com'
}, '*')
```

## Game Controls

- **Movement**: ← → Arrow keys or A/D keys
- **Jump**: ↑ Arrow key, W key, or Spacebar
- **Run**: Hold Shift while moving
- **Pause**: P key
- **Debug**: Open browser console for debug commands

## Console API (Development)

When running in development mode, these functions are available in the browser console:

```javascript
// Level building
GameAPI.clearLevel()
GameAPI.addPlatform(x, y, width, height, type)
GameAPI.addPolygon(points, type)
GameAPI.addEnemy(x, y, type)
GameAPI.addCoin(x, y)
GameAPI.setPlayerStart(x, y)
GameAPI.buildLevel()
GameAPI.startGame()

// Preset levels
GameAPI.loadClassicLevel()
GameAPI.loadUndergroundLevel()
GameAPI.loadSkyLevel()
GameAPI.generateRandomLevel()

// Game control
GameAPI.pauseGame()
GameAPI.resetGame()

// Import/Export
const json = GameAPI.exportJSON()
GameAPI.importJSON(json)

// Debug functions
debugMode()        // Toggle debug visualizations
showPlatforms()    // Log platform information
showCollisions()   // Log collision data
checkSprites()     // Check sprite loading status
```

## Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Build**: Use the included `vercel.json` configuration
3. **Deploy**: Vercel will automatically build and deploy

The `vercel.json` file includes:
- Multi-page routing configuration
- CORS headers for iframe embedding
- Redirect rules for clean URLs

### Manual Deployment

```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

## Project Structure

```
mario-game/
├── src/
│   ├── engine/           # Game engine core
│   │   ├── GameEngine.ts
│   │   ├── physics/      # Physics and collision
│   │   ├── entities/     # Game entities (Player, Enemy, etc.)
│   │   ├── render/       # Rendering system
│   │   └── sprites/      # Sprite management
│   ├── levelLoader.ts    # API integration
│   ├── main.ts          # Main page entry
│   ├── play.ts          # Play mode entry
│   └── embed.ts         # Embed mode entry
├── public/              # Static assets
├── index.html           # Main page
├── play.html           # Play mode page
├── embed.html          # Embed mode page
├── vercel.json         # Vercel configuration
└── vite.config.ts      # Vite configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test all game modes (main, play, embed)
5. Submit a pull request

## License

MIT License - feel free to use in your projects!

---

# 中文文档

一个现代化的、可嵌入的马里奥风格游戏引擎，使用 TypeScript、Vite 和 HTML5 Canvas 构建。支持从 API 动态加载关卡，并可通过 iframe 嵌入到其他应用中。

## 功能特性

- 🎮 **完整游戏引擎**：完整的马里奥风格物理引擎、碰撞检测和游戏机制
- 🔗 **API 集成**：从后端 API 动态加载关卡数据
- 📱 **多种访问模式**：独立游戏、完整 UI 模式和可嵌入的 iframe 模式
- 🌐 **跨域就绪**：配置了 CORS，支持跨域 iframe 嵌入
- ⚡ **快速响应**：使用 Vite 构建，性能优化
- 🚀 **Vercel 就绪**：一键部署，包含正确的路由配置

## 快速开始

### 1. 本地开发

```bash
cd mario-game
npm install
npm run dev
```

游戏将在以下地址可用：
- `http://localhost:5173/` - 主游戏页面
- `http://localhost:5173/play` - 完整 UI 游戏模式
- `http://localhost:5173/embed` - iframe 可嵌入模式

### 2. 生产构建

```bash
npm run build
npm run preview
```

## 访问模式

### 🏠 主页面 (`/`)
原始游戏界面，包含内置关卡构建器和控制台 API。

### 🎮 游玩模式 (`/play` 或 `/play?id=levelId`)
完整功能的游戏体验：
- 分数跟踪和 UI 元素
- 游戏控制（暂停、重启、分享）
- 关卡信息面板
- 键盘快捷键（P 暂停，Ctrl+R 重启）

### 📱 嵌入模式 (`/embed` 或 `/embed?id=levelId`)
为 iframe 嵌入优化的最小界面：
- 无外部 UI 元素
- 与父窗口的 PostMessage 通信
- 适配嵌入环境的响应式设计
- 事件转发到父窗口（分数更新、游戏状态变化）

## API 集成

### 后端 API 要求

您的后端应通过 RESTful API 提供关卡数据：

```http
GET /api/levels/{level_id}
```

**响应格式：**
```json
{
  "starting_points": [
    {
      "coordinates": [100, 400]
    }
  ],
  "end_points": [
    {
      "coordinates": [800, 400]
    }
  ],
  "rigid_bodies": [
    {
      "contour_points": [
        [0, 500], [100, 500], [100, 600], [0, 600]
      ]
    }
  ],
  "coins": [
    {
      "x": 200,
      "y": 400
    }
  ],
  "enemies": [
    {
      "x": 300,
      "y": 450,
      "type": "goomba"
    }
  ]
}
```

### 与 API 配合使用

**方法 1：URL 参数**
```
https://your-domain.com/play?id=level123&api=https://your-api.com
```

**方法 2：环境配置**
在 `src/levelLoader.ts` 中设置您的 API 基础 URL：
```typescript
private static API_BASE_URL = 'https://your-api.com'
```

### 嵌入到其他应用

```html
<!-- 基础嵌入 -->
<iframe src="https://your-mario-game.vercel.app/embed?id=level123"
        width="1024" height="576" frameborder="0">
</iframe>

<!-- 使用自定义 API -->
<iframe src="https://your-mario-game.vercel.app/embed?id=level123&api=https://your-api.com"
        width="1024" height="576" frameborder="0">
</iframe>
```

### PostMessage 通信

嵌入的游戏通过 PostMessage 与父窗口通信：

**从游戏到父窗口的消息：**
```javascript
// 分数更新
{ type: 'SCORE_UPDATE', data: { score: 1200 } }

// 游戏事件
{ type: 'GAME_START', data: { timestamp: 1234567890 } }
{ type: 'GAME_OVER', data: { score: 1200, reason: 'enemy_collision' } }
{ type: 'GAME_WIN', data: { score: 1500, time: 45000 } }
```

**从父窗口到游戏的消息：**
```javascript
// 发送给嵌入的游戏
iframe.contentWindow.postMessage({ type: 'PAUSE_GAME' }, '*')
iframe.contentWindow.postMessage({ type: 'RESUME_GAME' }, '*')
iframe.contentWindow.postMessage({ type: 'RESET_GAME' }, '*')
iframe.contentWindow.postMessage({
  type: 'SET_API_URL',
  apiUrl: 'https://new-api.com'
}, '*')
```

## 游戏控制

- **移动**：← → 箭头键或 A/D 键
- **跳跃**：↑ 箭头键、W 键或空格键
- **奔跑**：移动时按住 Shift
- **暂停**：P 键
- **调试**：打开浏览器控制台使用调试命令

## 控制台 API（开发模式）

在开发模式下，浏览器控制台中可使用以下函数：

```javascript
// 关卡构建
GameAPI.clearLevel()
GameAPI.addPlatform(x, y, width, height, type)
GameAPI.addPolygon(points, type)
GameAPI.addEnemy(x, y, type)
GameAPI.addCoin(x, y)
GameAPI.setPlayerStart(x, y)
GameAPI.buildLevel()
GameAPI.startGame()

// 预设关卡
GameAPI.loadClassicLevel()
GameAPI.loadUndergroundLevel()
GameAPI.loadSkyLevel()
GameAPI.generateRandomLevel()

// 游戏控制
GameAPI.pauseGame()
GameAPI.resetGame()

// 导入/导出
const json = GameAPI.exportJSON()
GameAPI.importJSON(json)

// 调试函数
debugMode()        // 切换调试可视化
showPlatforms()    // 输出平台信息
showCollisions()   // 输出碰撞数据
checkSprites()     // 检查精灵加载状态
```

## 部署

### Vercel（推荐）

1. **连接仓库**：将 GitHub 仓库连接到 Vercel
2. **配置构建**：使用包含的 `vercel.json` 配置
3. **部署**：Vercel 会自动构建和部署

`vercel.json` 文件包含：
- 多页面路由配置
- iframe 嵌入的 CORS 头
- 简洁 URL 的重定向规则

### 手动部署

```bash
npm run build
# 将 'dist' 文件夹上传到您的托管服务提供商
```

## 项目结构

```
mario-game/
├── src/
│   ├── engine/           # 游戏引擎核心
│   │   ├── GameEngine.ts
│   │   ├── physics/      # 物理和碰撞
│   │   ├── entities/     # 游戏实体（玩家、敌人等）
│   │   ├── render/       # 渲染系统
│   │   └── sprites/      # 精灵管理
│   ├── levelLoader.ts    # API 集成
│   ├── main.ts          # 主页面入口
│   ├── play.ts          # 游玩模式入口
│   └── embed.ts         # 嵌入模式入口
├── public/              # 静态资源
├── index.html           # 主页面
├── play.html           # 游玩模式页面
├── embed.html          # 嵌入模式页面
├── vercel.json         # Vercel 配置
└── vite.config.ts      # Vite 配置
```

## 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 测试所有游戏模式（main、play、embed）
5. 提交 Pull Request

## 许可证

MIT 许可证 - 欢迎在您的项目中使用！