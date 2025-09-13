# Mario Game Assets

This directory contains all the game assets required for the Mario game engine to run independently.

## Directory Structure

```
assets/
├── characters/         # Character sprites for Mario animations
│   ├── player_down.png
│   ├── player_jump.png
│   ├── player_left.png
│   ├── player_right.png
│   ├── player_run_left_01.png
│   ├── player_run_left_02.png
│   ├── player_run_right_01.png
│   ├── player_run_right_02.png
│   └── player_up.png
├── spritesheets/      # Sprite sheets (optional, not currently used)
│   ├── character.png
│   └── tileset.png
└── tiles/             # Environment tiles and objects
    ├── brick_block.png
    ├── coin_01-04.png (not used - coins use canvas rendering)
    ├── goomba_walk_01.png
    ├── goomba_walk_02.png
    ├── grass.png
    ├── mountain.png
    ├── pipe_body.png
    ├── pipe_top.png
    ├── question_block.png
    ├── super_mushroom.png
    ├── terrain.png
    ├── tree.png
    └── water.png
```

## Asset Loading

All assets are loaded through the `SpriteLoader` class using relative paths:
- Character sprites: `./assets/characters/[filename].png`
- Tile sprites: `./assets/tiles/[filename].png`

## Fallback Rendering

If any sprite fails to load, the game automatically falls back to canvas-based rendering:
- Characters: Colored rectangles with simple features
- Platforms: Gradient fills with texture patterns
- Coins: Golden circles with dollar signs (always uses canvas)

## Independence from External Assets

This game engine is completely self-contained and does not require any external asset repositories. All necessary sprites are included within the engine directory structure.

## Adding New Assets

To add new sprites:
1. Place the PNG file in the appropriate subdirectory
2. Update `SpriteLoader.ts` to load the new sprite
3. The game will automatically use fallback rendering if the sprite fails to load