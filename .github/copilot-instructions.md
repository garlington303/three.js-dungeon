# Copilot Instructions for Retro Dungeon Crawler

## Project Overview
A first-person 3D dungeon crawler built with **Three.js** and **TypeScript**. Uses Vite for bundling. The game features retro pixel-art aesthetics with modern 3D rendering.

## Architecture

### Core Components ([src/game.ts](../src/game.ts))
- **`Game`** - Main orchestrator class (~3000 lines). Initializes renderer, manages game loop, coordinates all managers
- **`TextureManager`** - Centralized texture loading with pixel-art filtering (`NearestFilter`, `SRGBColorSpace`)
- **`WorldBuilder` / `Dungeon2Builder`** - Procedural wall/floor generation from 2D map arrays (`DUNGEON_MAP`, `DUNGEON2_MAP`)
- **`PlayerController`** - FPS camera, movement, collision detection, dash mechanics
- **`EnemyManager`** - Enemy spawning, AI states (`idle` → `chase` → `defeated`), animated sprites
- **`ProjectileManager`** - Projectile physics and collision with enemies/walls
- **`HUDManager`** - First-person hand viewmodels, health display, UI overlays
- **`CoinManager`** - Collectible coin spawning and pickup logic

### Supporting Modules
- [src/inventory.ts](../src/inventory.ts) - Item database (`ITEM_DB`), equipment slots, drag-and-drop UI
- [src/animatedSprite.ts](../src/animatedSprite.ts) - Spritesheet animation helper for billboarded sprites
- [src/effects.ts](../src/effects.ts) - Particle system, screen shake, visual feedback
- [src/itemPickups.ts](../src/itemPickups.ts) - World item spawns with bob/pulse animations
- [src/pickupLayouts.ts](../src/pickupLayouts.ts) - Grid-based item placement definitions

### Entry Point
[index.tsx](../index.tsx) instantiates `Game` on `window.onload`. The HTML canvas is defined in [index.html](../index.html).

## Key Patterns

### Configuration via `CONFIG` Object
All gameplay constants are centralized in `CONFIG` at the top of [src/game.ts](../src/game.ts):
```typescript
export const CONFIG = {
  MOVE_SPEED: 2.0,
  DASH_SPEED: 12.0,
  PROJECTILE_DAMAGE: 25,
  ENEMY_DETECTION_RANGE: 8.0,
  // ...
};
```
Always add new tunables here rather than using magic numbers.

### Map System
Dungeons are defined as 2D number arrays where cell values indicate wall types:
- `0` = empty (walkable)
- `1` = stone wall, `2` = brick, `3` = wood, `4` = door (scene transition)

Use `gridToWorldCenter(gridX, gridZ)` to convert grid positions to world coordinates.

### Texture Loading
All textures use pixel-art configuration:
```typescript
tex.magFilter = THREE.NearestFilter;
tex.minFilter = THREE.NearestFilter;
tex.colorSpace = THREE.SRGBColorSpace;
```

### Enemy Presets
New enemies go in `ENEMY_PRESETS` array with `maxHealth`, `speed`, and optional `id` for texture lookup.

## Development Commands
```bash
npm install     # Install dependencies
npm run dev     # Start dev server (localhost:3000)
npm run build   # Production build
npm run preview # Preview production build
```

## Asset Pipeline

### Sprite Assets Location
- Enemy sprites: `src/assets/enemies/`
- Hand viewmodels: `src/assets/resources/hands/`
- Item textures: `src/assets/textures/items/`
- UI elements: `src/assets/ui/`
- Skyboxes: `src/assets/skybox/`

### Python Sprite Scripts ([scripts/](../scripts/))
Use these to process sprite assets:
- `create_spritesheet.py` - Combine frame PNGs into 4×4 spritesheet
- `slice_spritesheet.py` - Extract individual frames from spritesheet
- `remove_white_bg.py` / `make_transparent.py` - Background removal

## Common Tasks

### Adding a New Enemy
1. Add texture to `src/assets/enemies/` (idle PNG + optional attack spritesheet)
2. Load in `TextureManager.loadAll()` with `draugr_idle` / `draugr_attack` naming pattern
3. Add preset to `ENEMY_PRESETS` with matching `id`
4. Spawn via `EnemyManager.spawnEnemy()` with preset index

### Adding a New Item
1. Define in `ITEM_DB` in [src/inventory.ts](../src/inventory.ts) with required properties
2. Add spawn location in [src/pickupLayouts.ts](../src/pickupLayouts.ts)
3. Items automatically appear via `ItemPickupManager`

### Adding a New Dungeon
1. Create map array (e.g., `DUNGEON3_MAP`) following existing pattern
2. Add door cell (`4`) in connecting dungeon
3. Create builder class extending `WorldBuilder` pattern
4. Add scene switching logic in `Game` class

## Code Style
- Single `game.ts` file contains most game logic (~3000 lines) - major features stay here
- Smaller utilities extracted to separate modules when reusable
- TypeScript strict mode enabled
- Use `export const` for constants, `export class` for managers
