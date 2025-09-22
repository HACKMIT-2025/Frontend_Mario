# 🍄 Mario Game Engine - Frontend

A modern, embeddable Mario-style game engine built with TypeScript, Vite, and HTML5 Canvas. Supports dynamic level loading from APIs and iframe embedding for seamless integration into other applications.

[API Documentation](#api-documentation) | [Deployment Guide](#deployment)

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

