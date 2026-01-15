---
applyTo: '**'
---

# Coding Preferences
- Prefer minimal DOM overlays in index.html; wire behavior in src/inventory.ts (InventoryManager).
- Use small, surgical patches; keep existing UI styling tokens (Courier New, existing rgba backgrounds, #333/#444 borders).
- Validate changes via `npm run build` (Vite + TS).

# Project Architecture
- Vite + TypeScript + Three.js game with DOM UI overlay.
- Inventory UI is implemented as HTML/CSS in index.html and controlled by InventoryManager in src/inventory.ts.
- **Level System**: JSON-based dungeon levels loaded via LevelLoader (`src/levelLoader.ts`). Levels stored in `src/assets/levels/`.
- **Map Data Flow**: Level JSON → LevelLoader → WorldBuilder → Player/Managers (collision, spawning)
- **Dynamic Map Handling**: All systems (PlayerController, BeamManager, spawn functions) use loaded level data instead of hardcoded constants.

# Solutions Repository
- Drag UI issues: ensure drag ghost never intercepts clicks (pointer-events: none) and end drags on global mouseup.
- CSS positioning: when using transform for centering (e.g., translateX(-50%)), compose hover transforms via a CSS var (e.g., --equip-transform) so hover doesn't override base alignment.
- **JSON Level Integration**: When adding dynamic map loading, update all collision/spawn systems to use level data:
  - WorldBuilder.setLevelData() before build()
  - PlayerController.setDungeonMapData() after loading
  - BeamManager.setDungeonMapData() if beam exists
  - Store LoadedLevel in Game class for spawn methods
  - Update all DUNGEON_MAP references to use dynamic data

