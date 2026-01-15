# Project Summary: Three.js Dungeon Crawler

## 1. Project Overview
A first-person dungeon crawler inspired by **Daggerfall**, built with **Three.js**. Key pillars include grid-based movement, procedural generation, physics-based combat, and a modular room architecture. The project follows a "vibe-coder" development style, prioritizing practical, working implementations over theoretical perfection.

## 2. Technical Stack
- **Engine:** Three.js (r181+)
- **Language:** TypeScript / JavaScript (ES6+)
- **Build Tool:** Vite
- **Data:** Custom JSON map format (32x32 grid units)
- **Physics:** Custom collision system (AABB)
- **Assets:** Programmatic geometry + Spritesheets for weapons/enemies

## 3. Current Implementation Status

### Core Systems
- [x] **Renderer:** Basic Three.js scene and first-person camera setup.
- [x] **Map Editor:** Functional custom editor exporting to JSON.
- [x] **Collision:** Basic detection and response system.
- [x] **Performance:** Instancing and optimization patterns established.

### Gameplay Features
- [x] **Weapon System:**
    - Viewmodel support with animation states (idle, fire, reload).
    - Weapon switching implemented (Scroll wheel).
    - 4 Weapons integrated: Pistol, Glock, Crowbar, Hammer.
    - Spritesheet automation scripts created.
- [ ] **Combat Feel:** Recoil and hit feedback (In Progress - Phase A).
- [ ] **Enemies:** Basic assets present, AI logic pending (Phase B).

### Level Design
- [x] **Room Architecture:** Modular "LEGO" block concept defined.
- [ ] **Room Library:** Basic set of reusable rooms (In Progress).
- [ ] **Dungeon Generation:** Procedural layout algorithm (Pending).

## 4. Development Roadmap

### Phase A: Combat Feel Lock (Current Active Phase)
*Objective: Make shooting responsive and satisfying.*
- [x] Weapon switching & animations.
- [ ] Normalize fire rates & reload timing.
- [ ] Implement camera/viewmodel recoil.
- [ ] Add visual/audio hit feedback.

### Phase B: Enemy AI Foundation
*Objective: Create believable single enemy archetype.*
- [ ] Simple state machine (Idle, Chase, Attack).
- [ ] Pathfinding on grid.
- [ ] Damage & death states.

### Phase C: Combat Test Dungeon
*Objective: Stress test systems in a real environment.*
- [ ] 3-room vertical slice (Corridor, Chokepoint, Arena).
- [ ] Door logic and spawn triggers.

### Phase D: Tactical Interactions
*Objective: Add depth.*
- [ ] Inventory system.
- [ ] Traps and environmental hazards.
- [ ] Line-of-sight systems.

### Phase E & F: Polish & Direction
- [ ] Juice (particles, screen shake).
- [ ] Final scope definition.

## 5. Immediate Next Steps
1.  **Combat Polish:** Implement recoil and hit feedback to complete Phase A.
2.  **Room Modules:** Build out the core library of room types (Corridors, Junctions, Chambers) as per the *Project Onboarding Brief*.
3.  **Integration:** Combine the weapon system with the room modules into a playable test loop.
