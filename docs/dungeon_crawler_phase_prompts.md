# Three.js Dungeon Crawler – Phase System Prompts

Copy and paste the entire prompt block for the phase you're working on.

---

## PHASE A: Combat Feel Lock

```
# PHASE A: Combat Feel Lock
## Context
You are assisting with a Three.js first-person dungeon crawler inspired by Daggerfall (Elder Scrolls). The game uses Three.js for 3D rendering and currently has a working renderer, camera system, and basic weapon viewmodel.

## Current State
- Renderer: Three.js scene with first-person camera
- Input: Keyboard controls (WASD movement, mouse look)
- Weapons: Basic viewmodel weapon system with Doom-style reload animations
- Scope: Empty test room only—no enemies yet

## Phase Objective
Make shooting feel responsive and satisfying BEFORE expanding to enemies or systems.

## Tasks (In Priority Order)
1. Normalize fire rate vs reload timing (ensure weapon cooldown is clearly felt)
2. Add recoil to camera (pitch/yaw jitter) and weapon viewmodel (kickback animation)
3. Add hit confirmation feedback (crosshair color change, brief sound, visual indicator)
4. Implement enemy hit reaction hooks (prepared placeholders for future use)

## Technical Constraints
- Weapon state machine: `idle → firing → reloading → idle`
- All animation driven by elapsed time, NOT frame count
- No dependencies on enemy systems yet
- Keep weapon balance tuning data in a clear config object

## Code Structure Guidelines
- Weapon timing config: centralize fireRate, reloadTime, recoilAmount in one object
- Recoil: apply to camera via quaternion rotation, reset smoothly with decay
- Hit feedback: visual (crosshair change), audio (plink sound), no screen shake yet
- Placeholder: add `onEnemyHit()` method to weapon class (empty for now)

## Exit Criteria
- Shooting feels tight and responsive in empty test room
- Reload timing is clearly readable (long enough to feel weight, short enough to feel snappy)
- Recoil is visible but not obstructive
- Code is clean enough to extend with enemy hit reactions

## Deliverable
A single HTML/JS file (or TypeScript module) with:
- Weapon firing with configurable rate
- Recoil animation on camera + viewmodel
- Hit feedback (visual + audio) on raycasted empty space
- Ready-to-extend enemy hit hook
```

---

## PHASE B: Single Enemy Archetype

```
# PHASE B: Single Enemy Archetype
## Context
You are continuing development of a Three.js first-person dungeon crawler. Combat feel is locked from Phase A. Now we validate combat system under pressure by introducing ONE simple enemy type.

## Current State (From Phase A)
- Weapon firing with recoil + hit feedback
- Empty test room
- No enemies or AI

## Phase Objective
Implement a single, slow, readable enemy archetype to stress-test the combat system under pressure.

## Enemy Design Constraints
- **Attack pattern**: Melee or close-range (< 5 units)
- **Speed**: Slow enough for player to react (~ 0.03 units/frame)
- **Health**: Dies in 2–4 shots with current weapon
- **Visual**: Simple cube/sphere with distinct color (red = enemy)
- **Attack telegraph**: 1 second wind-up before strike (clear tell)

## AI State Machine
Implement these states with simple distance-based transitions:
1. **Idle** (distance > 10): Stand still, face player occasionally
2. **Patrol** (10 >= distance > 3): Walk toward player, slow
3. **Chase** (3 >= distance > 0.5): Fast approach, play attack wind-up
4. **Attack** (distance < 0.5): Strike once, return to Idle
5. **Stagger** (on hit): Brief knockback + animation interruption, return to Chase
6. **Dead** (health <= 0): Ragdoll or dissolve, disable collision

## Technical Requirements
- Enemy class extends from base class (e.g., `EnemyBase`)
- Health system: simple number, decrement on hit from weapon
- Collision: simple AABB or sphere for distance checks (no navmesh yet)
- Steering: move toward player position using simple vector math
- Hit reaction: stagger for 0.3s, play hurt sound

## Code Structure
- `Enemy.ts`: Extends `EnemyBase`, implements state machine with `update(deltaTime)`
- `enemyManager.ts`: Spawns, updates, and cleans up enemies
- Enemy config: health, speed, attackDamage, staggerDuration (all tunable)
- Collision steering: raycast or simple distance-based avoidance only

## Spawn & Testing
- Manually spawn one enemy in test room via spawn point or debug UI
- No spawn triggers yet (Phase C)
- Destroy enemy on death (no corpse persistence)

## Exit Criteria
- Enemy spawns and chases player toward camera
- Player must manage reload timing while avoiding attacks
- Enemy dies when shot enough times
- AI does not clip through walls or behave erratically
- Combat feels tense and readable (clear attack wind-up)

## Deliverable
- Enemy class with state machine + config
- One-enemy test scene
- Ready to scale to multiple enemy types in Phase D+
```

---

## PHASE C: Combat Test Dungeon

```
# PHASE C: Combat Test Dungeon
## Context
You are continuing Three.js dungeon crawler development. Phase A (combat feel) and Phase B (single enemy) are complete. Now we build a small, purposeful dungeon to stress-test combat and collision under realistic conditions.

## Current State
- Working weapon with recoil + feedback
- One simple enemy type with AI
- Empty test room

## Phase Objective
Design and implement a mini-dungeon (3 rooms) to pressure-test FPS combat, collision detection, and enemy navigation against real geometry.

## Dungeon Layout (JSON-Defined)
The dungeon is defined as a JSON structure (no procedural generation yet):

**Room 1: Tight Corridor**
- Purpose: Force reload stress (narrow space, close enemy)
- Dimensions: 2 units wide, 8 units long, 3 units tall
- Encounters: 1–2 enemies spawning mid-corridor
- Exit: Door to Room 2

**Room 2: Chokepoint Doorway**
- Purpose: Tactical positioning (enemy cannot flank, player must control entrance)
- Dimensions: 4×4 center, 1 unit wide doorway
- Encounters: 1 enemy on far side, 1 spawning on player side after time
- Exit: Door to Room 3

**Room 3: Open Arena**
- Purpose: High-intensity combat (player has space, enemies have angles)
- Dimensions: 10×10, 4 units tall
- Encounters: 3 enemies, no cover except pillars at room center
- Exit: End trigger or final boss door (placeholder)

## Technical Tasks
1. **Dungeon data structure**: JSON format with room definitions (position, size, walls, doors, spawn points)
2. **Collision volumes**: Axis-aligned boxes for walls/doors (no curved surfaces)
3. **Door logic**: Open/close state, blocks enemy pathing when closed, player can trigger open
4. **Enemy spawn triggers**: Volume-based (enemy spawns when player enters zone)
5. **Level loader**: Parse JSON, instantiate collision geometry, place spawn points

## Code Structure
- `dungeonData.ts`: Export test dungeon as JSON
- `dungeonLoader.ts`: Load JSON, create Three.js geometry + collision
- `collisionManager.ts`: AABB checks for walls/doors, simple steering avoidance
- `Room.ts`: Container for room state (enemies, doors, triggers)
- Spawn trigger system: check player bounding box against spawn zones, instantiate enemies on first enter

## Collision Requirements
- **Wall collision**: Stop player and enemies at wall boundaries
- **Door collision**: Stop at closed doors, pass through open doors
- **Enemy navigation**: Do not clip walls (simple raycasting or steering toward gaps)
- **Performance**: Keep collision queries cheap (AABB only, no expensive raycasts per frame)

## Testing Flow
1. Load dungeon
2. Spawn player in Room 1
3. Navigate and trigger enemies in each room
4. Test door mechanics (open/close interaction)
5. Verify no collision snags or clipping

## Exit Criteria
- Dungeon loads and renders without errors
- Player can navigate all 3 rooms with smooth collision
- Enemies spawn on cue and navigate rooms (avoid walls)
- Doors open/close and block/allow passage correctly
- Combat remains tight and responsive through dungeon
- No clipping or janky collision behavior

## Deliverable
- Complete dungeon JSON + loader
- Collision system working against geometry
- One playable vertical slice: spawn in Room 1, fight through to Room 3
- Ready for Phase D (interactions: doors, traps, LOF blocking)
```

---

## PHASE D: Dungeon Interaction Layer

```
# PHASE D: Dungeon Interaction Layer
## Context
You are developing a Three.js first-person dungeon crawler. Phases A–C (combat, enemy, dungeon) are complete. Now we add tactical depth through dungeon interactions while maintaining scope.

## Current State
- Combat feel locked
- Enemy AI working
- Playable 3-room dungeon with collision
- Basic door/wall geometry

## Phase Objective
Introduce light tactical systems (doors, line-of-sight, one trap type) to create moments of tension and player choice.

## Interaction Systems

### 1. Door Logic (Upgrade)
Current state: Doors block/allow passage.
New requirements:
- Doors affect **enemy AI pathing** (enemies avoid closed doors, prefer open ones)
- Doors can be opened from either side (no key system)
- Door open/close takes 0.5 seconds (smooth animation, not instant)
- Enemies cannot open doors (they navigate around)
- **Strategic use**: Player can close door on pursuing enemy to buy time

### 2. Line-of-Sight Breaking (Corners)
Current state: No LOS checking.
New requirements:
- Enemies only chase player if they have **line of sight**
- Corners and walls break LOS automatically (via raycasting)
- If player breaks LOS, enemy returns to patrol state
- Enemies will investigate last known position if LOS broken

### 3. One Trap Type
Choose **one** and implement:
- **Option A (Damage trap)**: Floor trigger, deals 1 hit of damage, resets after 3 seconds, visual indicator (glowing grate or wire)
- **Option B (Slow trap)**: Floor trigger, reduces player speed to 50% for 2 seconds, visual indicator (oil slick or web)

Trap requirements:
- Visually readable (glow or particle effect)
- Avoidable (player can jump over or walk around)
- Does not affect enemies (asymmetric design)
- Damage/slow value tunable

## Technical Structure

### Door Pathfinding
- Add `doorOpen` state to dungeon graph
- When enemies pathfind, prefer open doors, avoid closed doors
- Simple: if door is closed, add movement cost to that path segment

### Line-of-Sight
- Implement raycasting from enemy position to player position
- If raycast hits wall before player: LOS broken
- Update enemy state: `chasing → investigating` on LOS break
- Investigation state: move to last known player position, then patrol

### Trap System
- `Trap.ts` base class with `onTrigger(player)` callback
- Inherit for DamageTrap and SlowTrap
- Dungeon JSON defines trap positions and types
- Collision detection: AABB overlap check with player each frame
- Cooldown: trap disables for 3s after trigger

## Dungeon Updates
Extend Room 2 (Chokepoint) to showcase door strategy:
- Add a **door blocking the corridor before main room**
- Player can close door to trap/slow pursuing enemy
- Enemy must navigate around (if route exists) or wait

Extend Room 3 (Arena) with one trap:
- Add one damage or slow trap near pillar
- Playable obstacle, not a punishment

## Code Changes
- `Enemy.ts`: Add LOS check, raycasting to player
- `dungeonLoader.ts`: Load trap definitions from JSON
- `Trap.ts`: New class for trap behavior + cooldown
- `collisionManager.ts`: Add trap overlap checks
- `Room.ts`: Door state affects pathfinding cost

## Exit Criteria
- Doors block/allow enemy passage based on state
- Enemies lose aggro if LOS breaks (turn to investigate)
- One trap type works correctly (damage or slow)
- Traps are readable and avoidable
- Dungeon is tactically richer without feeling bloated
- No performance regression

## Deliverable
- Upgraded door system with enemy pathfinding
- LOS system for enemy aggro
- One working trap type in dungeon
- Playable slice: Room 2 feels tactically interesting (door strategy), Room 3 has trap obstacle
- Clean, extensible trap base class for future types
```

---

## PHASE E: Feedback & Juice Pass

```
# PHASE E: Feedback & Juice Pass
## Context
You are in the final polish phase of the dungeon crawler vertical slice. Phases A–D are feature-complete. This phase adds visceral, satisfying feedback without new mechanics.

## Current State
- All combat systems working
- Full dungeon with interactions
- Enemies, doors, traps, LOS all functional
- No new features needed

## Phase Objective
Make every action feel impactful and reactive through visual, audio, and haptic feedback.

## Feedback Additions (In Priority Order)

### 1. Muzzle Flash Lighting
- On weapon fire, emit bright red/orange point light from gun barrel
- Light position: end of viewmodel gun
- Light duration: 0.05 seconds (very brief)
- Light intensity: bright enough to illuminate nearby walls/enemy
- Fade out quickly (no long tail)

### 2. Camera Shake
- On weapon fire, add small brief shake to camera position
- Shake amount: ~0.02 units (small, not nauseating)
- Shake duration: 0.1 seconds
- Shake pattern: random jitter, not structured
- *Note: Keep separate from recoil (already implemented in Phase A)*

### 3. Enemy Death Audio & Visual
- On enemy death, play death sound (brief grunt or sting)
- Visual: brief flash of enemy color, fade to black, despawn
- Alternative: ragdoll or knockback + dissolve effect
- Duration: 0.5 seconds total

### 4. Low-Health Warning Cues
- When player health < 25%, play subtle looping alarm sound (low pitch, spaced beeps)
- Visual: red vignette overlay around screen edges (subtle, not blinding)
- Vignette opacity: 0.15 when health is critical
- Stop cues when health recovers above 25%

## Sound Palette (Minimal)
- Muzzle pop (bright, punchy)
- Hit confirmation (plink or impact)
- Enemy death (brief sting or grunt)
- Low-health alarm (low beep loop)
- Door open/close (mechanical click)
- Footsteps (optional, can defer)

## Visual Palette
- Muzzle flash: orange/red directional light
- Camera shake: subtle jitter
- Enemy death flash: color fade to black
- Health warning vignette: red overlay, opacity tied to health%
- Crosshair: color change on hit (green)

## Technical Implementation

### Muzzle Flash
- Add point light to weapon viewmodel
- Parent to barrel position
- Fire event: set light visible, set timer for 0.05s
- After timer: hide light

### Camera Shake
- Perlin noise or random jitter on camera.position
- Small magnitude (0.02 units)
- Decay over 0.1 seconds smoothly

### Death Feedback
- Create mesh overlay or particle system
- Fade out and remove on death
- Play audio clip (short, 0.5s)

### Health Warning
- Create canvas overlay or THREE.MeshQuad for vignette
- Update opacity each frame based on player health
- Audio: play looping beep at low volume when health < 25%

## No New Mechanics
- Strictly visual/audio feedback only
- No gameplay changes
- No new systems or balance tweaks

## Exit Criteria
- Muzzle flash is visible and punchy on every shot
- Camera shake feels responsive but not distracting
- Enemy deaths are satisfying (audio + visual)
- Low-health warning is clear but not annoying
- All feedback is smooth and polished
- Performance remains solid (no lag from effects)

## Deliverable
- Complete feedback suite on weapon, enemies, and UI
- Full vertical slice: tight combat, readable dungeon, satisfying feedback
- Ready for Phase F decision (direction lock)
```

---

## PHASE F: Design Direction Lock

```
# PHASE F: Design Direction Lock
## Context
You have a complete, playable dungeon crawler vertical slice with all mechanics, systems, and feedback. Phases A–E are finished. Now you decide the dominant design axis for future expansion.

## Current State (Complete Vertical Slice)
- Combat feel locked (recoil, feedback, tight timings)
- Enemy AI with LOS and pathfinding
- Playable 3-room dungeon with doors, traps, interactions
- Full feedback suite (muzzle flash, camera shake, audio cues)
- No inventory, progression, or procedural generation

## Phase Objective
Choose one dominant design axis to guide all future feature development.

## Design Decision: Choose One Axis

### Option A: Shooter-First
**Dominant theme**: Speed, weapons, high-intensity combat

Key implications:
- Weapon diversity matters (shotgun, sniper, energy weapon, etc.)
- Enemy density increases (more simultaneous pressure)
- Level design supports fast movement (larger rooms, fewer walls)
- Inventory is lightweight (ammo, grenades, maybe mods)
- Progression is weapon/skill upgrades
- Dungeon complexity is secondary to combat variety

Expansion example: Add 2–3 weapon types, increase enemy count to 5–8 per room, add grenade/utility items.

### Option B: Dungeon-First
**Dominant theme**: Tension, exploration, environmental navigation

Key implications:
- Dungeon complexity matters (multiple paths, secrets, puzzles)
- Enemy density stays moderate (tactical positioning over numbers)
- Level design supports exploration (branching paths, verticality)
- Inventory is deep (potions, keys, tools, equipment slots)
- Progression is character growth (stats, equipment tiers)
- Combat is pressure moment, not primary loop

Expansion example: Add inventory system, equipment slots (armor, boots, rings), trap variety, hidden areas, simple puzzle locks.

## Decision Framework

Ask yourself:
1. **What made me happiest during development?** The combat moment or the dungeon moment?
2. **What would I play for 2+ hours?** Intense rapid combat or exploratory pressure?
3. **What feels incomplete right now?** More weapons/enemies or more dungeon/items?
4. **What's easiest to expand?** Adding weapons or adding rooms/systems?

## This Locks:
- **Feature priorities** for next 3–6 phases
- **Content balance** (weapons vs rooms vs enemies)
- **UI/UX** (HUD for shooter vs inventory for explorer)
- **Scope ceiling** (how big can this grow?)

## Outcome of This Phase
A written 1-paragraph decision that explains your axis choice and top 3 features to add next.

Example: "I choose **Dungeon-First**. The exploration moments were most engaging, and I want depth. Next: (1) Inventory system with equipment slots, (2) Trap variety (5+ types), (3) Hidden room secrets."

## Exit Criteria
- Clear written decision on dominant axis
- Understanding of what this choice enables/constrains
- Prioritized list of 3–5 next features
- Commitment to this direction for next phase batch

## Deliverable
- One-page design document: chosen axis + reasoning + feature roadmap
- Ready to move to Phase G (first expansion)
```

---

## How to Use These Prompts

1. Copy the **entire code block** for the phase you're starting
2. Paste into Claude (or your AI assistant)
3. Add your current code/screenshots if helpful
4. Ask: "Walk me through implementing [specific task]. Show me the full code blocks I need."
5. Implement the deliverables
6. Move to next phase when exit criteria are met

**Pro tip:** Keep the implementation plan document open in a split VS Code window. Phases reference each other—know what's done before starting a new phase.
