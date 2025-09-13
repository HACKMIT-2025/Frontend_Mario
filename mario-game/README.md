# Mario Game Engine API Documentation

## Overview
A modular, API-driven game engine for creating Mario-style platform games. Designed for both manual level construction and AI-driven automatic generation from image recognition data.

## Quick Start

### Installation
```bash
npm install
npm run dev
```

### Basic Usage
```javascript
import { GameAPI } from './src/engine/index.ts';

// Initialize the game engine
const gameAPI = new GameAPI('canvas-id', {
    width: 1024,
    height: 576,
    gravity: 0.5,
    fps: 60
});

// Build a simple level
gameAPI
    .clearLevel()
    .addPlatform(0, 500, 1000, 76, 'ground')
    .addPlatform(300, 400, 100, 20, 'platform')
    .addEnemy(500, 450, 'goomba')
    .addCoin(350, 350)
    .setPlayerStart(100, 400)
    .buildLevel()
    .startGame();
```

## API Reference

### Core Methods

#### `new GameAPI(canvas, config)`
Creates a new game engine instance.

**Parameters:**
- `canvas` (string | HTMLCanvasElement): Canvas element or ID
- `config` (GameConfig): Configuration object
  - `width` (number): Canvas width (default: 1024)
  - `height` (number): Canvas height (default: 576)
  - `gravity` (number): Gravity force (default: 0.5)
  - `fps` (number): Frames per second (default: 60)

**Example:**
```javascript
const gameAPI = new GameAPI('game-canvas', {
    width: 1024,
    height: 576,
    gravity: 0.5,
    fps: 60
});
```

### Level Building Methods

#### `addPlatform(x, y, width, height, type)`
Adds a platform to the level.

**Parameters:**
- `x` (number): X position
- `y` (number): Y position
- `width` (number): Platform width
- `height` (number): Platform height
- `type` (string): Platform type ('ground', 'platform', 'pipe', 'underground', 'question', 'brick')

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addPlatform(0, 500, 1000, 76, 'ground');
gameAPI.addPlatform(300, 400, 100, 20, 'platform');
```

#### `addEnemy(x, y, type)`
Adds an enemy to the level.

**Parameters:**
- `x` (number): X position
- `y` (number): Y position
- `type` (string): Enemy type ('goomba', 'koopa', 'firebar')

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addEnemy(500, 450, 'goomba');
gameAPI.addEnemy(700, 450, 'koopa');
```

#### `addCoin(x, y)`
Adds a coin to the level.

**Parameters:**
- `x` (number): X position
- `y` (number): Y position

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addCoin(350, 350);
```

#### `addPowerUp(x, y, type)`
Adds a power-up to the level.

**Parameters:**
- `x` (number): X position
- `y` (number): Y position
- `type` (string): Power-up type ('mushroom', 'flower', 'star')

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addPowerUp(600, 300, 'mushroom');
gameAPI.addPowerUp(800, 300, 'flower');
```

#### `setPlayerStart(x, y)`
Sets the player's starting position.

**Parameters:**
- `x` (number): X position
- `y` (number): Y position

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.setPlayerStart(100, 400);
```

### Helper Methods

#### `addPipe(x, y, height)`
Adds a pipe obstacle.

**Parameters:**
- `x` (number): X position
- `y` (number): Y position
- `height` (number): Pipe height (default: 100)

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addPipe(900, 400, 150);
```

#### `addBlock(x, y, type)`
Adds a block (question block, brick, etc.).

**Parameters:**
- `x` (number): X position
- `y` (number): Y position
- `type` (string): Block type ('brick', 'question')

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addBlock(400, 350, 'question');
gameAPI.addBlock(432, 350, 'brick');
```

#### `addCoinRow(startX, y, count, spacing)`
Adds a row of coins.

**Parameters:**
- `startX` (number): Starting X position
- `y` (number): Y position
- `count` (number): Number of coins
- `spacing` (number): Space between coins (default: 40)

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addCoinRow(300, 350, 5, 40);
```

#### `addPlatformStairs(startX, startY, steps, stepWidth, stepHeight)`
Creates a staircase of platforms.

**Parameters:**
- `startX` (number): Starting X position
- `startY` (number): Starting Y position
- `steps` (number): Number of steps
- `stepWidth` (number): Width of each step (default: 32)
- `stepHeight` (number): Height of each step (default: 32)

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addPlatformStairs(1300, 500, 5);
```

#### `addGapWithPlatforms(startX, y, gapWidth, platformCount, platformWidth, spacing)`
Creates a gap with floating platforms.

**Parameters:**
- `startX` (number): Starting X position
- `y` (number): Y position of platforms
- `gapWidth` (number): Total width of the gap
- `platformCount` (number): Number of platforms
- `platformWidth` (number): Width of each platform (default: 80)
- `spacing` (number): Space between platforms (default: 120)

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.addGapWithPlatforms(1900, 350, 400, 3);
```

#### `generateGround(startX, endX, y)`
Generates ground platform.

**Parameters:**
- `startX` (number): Starting X position
- `endX` (number): Ending X position
- `y` (number): Y position

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.generateGround(0, 3000, 500);
```

#### `generatePlatforms(count, startX, startY, spacingX, spacingY)`
Generates multiple platforms with sine wave pattern.

**Parameters:**
- `count` (number): Number of platforms
- `startX` (number): Starting X position
- `startY` (number): Starting Y position
- `spacingX` (number): Horizontal spacing
- `spacingY` (number): Vertical variation

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.generatePlatforms(10, 200, 400, 130, 100);
```

#### `generateEnemies(count, startX, endX, y)`
Generates random enemies in a range.

**Parameters:**
- `count` (number): Number of enemies
- `startX` (number): Starting X range
- `endX` (number): Ending X range
- `y` (number): Y position

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.generateEnemies(5, 300, 2000, 450);
```

### Level Control Methods

#### `buildLevel()`
Builds the level with all added elements. Must be called before starting the game.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.buildLevel();
```

#### `clearLevel()`
Clears all level elements.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.clearLevel();
```

#### `startGame()`
Starts the game loop.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.startGame();
```

#### `pauseGame()`
Pauses or resumes the game.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.pauseGame();
```

#### `resetGame()`
Resets the game to initial state.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.resetGame();
```

### Import/Export Methods

#### `exportJSON()`
Exports the current level as JSON string.

**Returns:** `string` - JSON representation of the level

**Example:**
```javascript
const levelData = gameAPI.exportJSON();
localStorage.setItem('myLevel', levelData);
```

#### `importJSON(json)`
Imports a level from JSON string.

**Parameters:**
- `json` (string): JSON string representing a level

**Returns:** `this` (for method chaining)

**Example:**
```javascript
const savedLevel = localStorage.getItem('myLevel');
gameAPI.importJSON(savedLevel);
```

### AI Integration Methods

#### `generateFromImageData(imageData)`
Generates a level from AI/image recognition data.

**Parameters:**
- `imageData` (Array): Array of recognized objects

**Object Format:**
```javascript
{
    type: 'platform' | 'enemy' | 'coin' | 'powerup' | 'pipe' | 'ground' | 'player',
    x: number,
    y: number,
    width?: number,      // For platforms
    height?: number,     // For platforms
    enemyType?: string,  // For enemies
    powerType?: string   // For power-ups
}
```

**Returns:** `this` (for method chaining)

**Example:**
```javascript
const imageData = [
    { type: 'ground', x: 0, y: 500, width: 2000, height: 76 },
    { type: 'platform', x: 300, y: 400, width: 100, height: 20 },
    { type: 'enemy', x: 500, y: 450, enemyType: 'goomba' },
    { type: 'coin', x: 350, y: 350 },
    { type: 'powerup', x: 600, y: 300, powerType: 'mushroom' },
    { type: 'player', x: 100, y: 400 }
];

gameAPI.generateFromImageData(imageData).startGame();
```

### Preset Levels

#### `loadClassicLevel()`
Loads a classic Mario-style level.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.loadClassicLevel().startGame();
```

#### `loadUndergroundLevel()`
Loads an underground themed level.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.loadUndergroundLevel().startGame();
```

#### `loadSkyLevel()`
Loads a sky/cloud themed level.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.loadSkyLevel().startGame();
```

#### `generateRandomLevel()`
Generates a random level with various elements.

**Returns:** `this` (for method chaining)

**Example:**
```javascript
gameAPI.generateRandomLevel().startGame();
```

## Complete Examples

### Example 1: Simple Level
```javascript
const gameAPI = new GameAPI('game-canvas');

gameAPI
    .clearLevel()
    .addPlatform(0, 500, 1000, 76, 'ground')
    .addPlatform(300, 400, 100, 20)
    .addEnemy(500, 450, 'goomba')
    .addCoin(350, 350)
    .setPlayerStart(100, 400)
    .buildLevel()
    .startGame();
```

### Example 2: Complex Level with Method Chaining
```javascript
gameAPI
    .clearLevel()
    .generateGround(0, 3000, 500)
    .addPlatform(300, 400, 100, 20)
    .addPlatform(500, 350, 100, 20)
    .addPlatform(700, 300, 100, 20)
    .addPipe(900, 400)
    .addPipe(1100, 350, 150)
    .addPlatformStairs(1300, 500, 5)
    .addCoinRow(320, 350, 5)
    .addCoinRow(520, 300, 5)
    .addCoinRow(720, 250, 5)
    .addEnemy(400, 450, 'goomba')
    .addEnemy(600, 450, 'koopa')
    .addEnemy(800, 450, 'goomba')
    .addPowerUp(550, 300, 'mushroom')
    .addPowerUp(1400, 250, 'flower')
    .addBlock(1600, 350, 'question')
    .addBlock(1640, 350, 'question')
    .addGapWithPlatforms(1900, 350, 400, 3)
    .addPlatformStairs(2400, 500, 8)
    .setPlayerStart(100, 400)
    .buildLevel()
    .startGame();
```

### Example 3: Underground Level
```javascript
gameAPI
    .clearLevel()
    .addPlatform(0, 550, 3000, 50, 'underground')
    .addPlatform(0, 0, 3000, 100, 'underground')
    .addPipe(100, 450)
    .generatePlatforms(10, 300, 350, 250, 100)
    .generateEnemies(4, 300, 2500, 500)
    .addPowerUp(750, 400, 'mushroom')
    .addPowerUp(1250, 150, 'flower')
    .addPipe(2600, 450)
    .setPlayerStart(200, 450)
    .buildLevel()
    .startGame();
```

### Example 4: AI/Image Recognition Integration
```javascript
// Simulated output from image recognition AI
const detectedObjects = [
    { type: 'ground', x: 0, y: 500, width: 2000, height: 76 },
    { type: 'platform', x: 300, y: 400, width: 100, height: 20 },
    { type: 'platform', x: 500, y: 350, width: 100, height: 20 },
    { type: 'pipe', x: 700, y: 400, width: 64, height: 100 },
    { type: 'coin', x: 350, y: 350 },
    { type: 'coin', x: 550, y: 300 },
    { type: 'enemy', x: 400, y: 450, enemyType: 'goomba' },
    { type: 'powerup', x: 600, y: 300, powerType: 'mushroom' },
    { type: 'player', x: 100, y: 400 }
];

// Generate level from AI data
gameAPI
    .clearLevel()
    .generateFromImageData(detectedObjects)
    .buildLevel()
    .startGame();
```

### Example 5: Level Import/Export
```javascript
// Save current level
const levelJSON = gameAPI.exportJSON();
localStorage.setItem('savedLevel', levelJSON);

// Load saved level
const savedLevel = localStorage.getItem('savedLevel');
if (savedLevel) {
    gameAPI
        .clearLevel()
        .importJSON(savedLevel)
        .buildLevel()
        .startGame();
}
```

## Game Controls

### Player Controls
- **Arrow Left/Right**: Move
- **Space**: Jump
- **Shift**: Run (hold)
- **P**: Pause/Resume

## Platform Types

- `'ground'`: Solid ground texture
- `'platform'`: Basic platform
- `'pipe'`: Green pipe obstacle
- `'underground'`: Underground brick texture
- `'question'`: Question mark block
- `'brick'`: Breakable brick block

## Enemy Types

- `'goomba'`: Basic walking enemy
- `'koopa'`: Turtle enemy
- `'firebar'`: Rotating fire obstacle

## Power-Up Types

- `'mushroom'`: Makes player bigger
- `'flower'`: Gives fire power
- `'star'`: Temporary invincibility

## Architecture Overview

### Core Components

1. **GameAPI**: Main API interface for game construction
2. **GameEngine**: Core game loop and system management
3. **LevelBuilder**: Level construction and management
4. **PhysicsEngine**: Collision detection and physics simulation
5. **Renderer**: Canvas rendering system
6. **EntityManager**: Entity lifecycle management
7. **InputManager**: Keyboard input handling
8. **Camera**: Viewport and scrolling management

### Data Flow

```
User Code → GameAPI → LevelBuilder → GameEngine
                                    ↓
                          EntityManager ← Entities
                                    ↓
                          PhysicsEngine → Collision
                                    ↓
                            Renderer → Canvas
```

## Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Testing
Open `http://localhost:5174/test-engine-api.html` to run API tests.

## Integration with AI Systems

This engine is designed to work with image recognition AI systems. The AI should:

1. Analyze the input image
2. Detect game elements (platforms, enemies, coins, etc.)
3. Output object data in the required format
4. Pass data to `generateFromImageData()` method

### Expected AI Output Format
```javascript
[
    {
        type: 'platform',
        x: 300,        // Left position
        y: 400,        // Top position
        width: 100,    // Platform width
        height: 20     // Platform height
    },
    {
        type: 'enemy',
        x: 500,        // X position
        y: 450,        // Y position (ground level)
        enemyType: 'goomba'  // Enemy variant
    },
    {
        type: 'coin',
        x: 350,        // X position
        y: 350         // Y position
    },
    {
        type: 'powerup',
        x: 600,        // X position
        y: 300,        // Y position
        powerType: 'mushroom'  // Power-up variant
    }
]
```

## License

MIT

## Contributors

HackMIT 2025 Team - Member B (Game Engine Core Developer)