# Pistol Weapon Integration - Implementation Summary

## Overview
Successfully created a spritesheet from individual pistol frames and integrated a weapon switching system using mouse wheel scrolling.

## Changes Made

### 1. Pistol Spritesheet Creation
**Script: `scripts/create_pistol_spritesheet.py`**
- Created automated script to combine PISTOL1.png through PISTOL9.png into a horizontal spritesheet
- Handles frames of different sizes by finding max dimensions and centering frames
- Generates metadata JSON with frame positions and dimensions
- Output: `src/assets/weapons/pistol/pistol_fire.png` (1350x180px, 9 frames)
- Output: `src/assets/weapons/pistol/pistol_metadata.json`

### 2. Weapon Configuration Updates
**File: `src/weaponSprite.ts`**
- Updated pistol animation configuration:
  - `idle`: Frame 0 (hold position)
  - `fire`: Frames 0-4 @ 15fps (firing animation)
  - `reload`: Frames 5-8 @ 10fps (reload animation)

### 3. Weapon Switching System
**File: `src/game.ts`**

#### New Properties:
```typescript
private availableWeapons = ['pistol', 'glock', 'crowbar', 'hammer'];
private currentWeaponIndex = 0;
private weaponSwitchCooldown = 0;
```

#### New Event Handler:
- Mouse wheel event listener with `passive: false` to prevent page scrolling
- Scroll up: Previous weapon (-1)
- Scroll down: Next weapon (+1)
- Respects pause state and cooldown

#### New Methods:
- `switchWeapon(direction: number)`: Cycles through weapons, disposes old sprite, creates new one
- `updateWeaponDisplay(weaponName: string)`: Updates UI element with current weapon name

#### Cooldown System:
- 0.3 second cooldown prevents rapid weapon switching
- Updated in animation loop alongside other timers
- Prevents switching during reload

### 4. UI Updates
**File: `index.html`**

#### New CSS:
```css
#weapon-display {
  position: fixed;
  bottom: 50px;
  right: 20px;
  font-size: 14px;
  color: #ffcc44;
  text-transform: uppercase;
}
```

#### New HTML Element:
```html
<div id="weapon-display">PISTOL</div>
```

#### Updated Controls Display:
- Added "SCROLL WHEEL" for weapon switching
- Updated control hints to show "Fire" and "R Reload"

## Available Weapons
1. **Pistol** (default) - 9 frames, fire + reload animations
2. **Glock** - 9 frames, rapid fire animation
3. **Crowbar** - 6 frames, melee swing animation
4. **Hammer** - 4 frames, heavy melee animation

## How It Works

### Spritesheet Loading
1. Each weapon has a horizontal strip spritesheet (1 row, N columns)
2. Metadata defines frame positions and dimensions
3. WeaponSprite class handles rendering specific frames to canvas

### Weapon Switching Flow
1. Player scrolls mouse wheel
2. System checks cooldown and pause state
3. Current weapon index cycles through availableWeapons array
4. Old weapon sprite disposed, new one created and loaded
5. UI updated to show new weapon name
6. Ammo reset (currently simplified - could be per-weapon in future)

### Animation System
- Each weapon has defined animations (idle, fire, reload)
- Animations play at specified FPS
- Non-looping animations return to idle when complete
- Smooth frame-by-frame rendering on HTML canvas

## Testing
Run the game with `npm run dev` and:
1. Click to start the game
2. Scroll mouse wheel up/down to switch weapons
3. Left click to fire current weapon
4. Press R to reload (pistol has reload animation)
5. Observe weapon name updates in bottom-right corner

## Future Enhancements
- Per-weapon ammo pools (different max ammo per weapon)
- Weapon-specific damage values
- Weapon pickup system (find weapons in dungeons)
- Weapon upgrade system
- Sound effects per weapon type
- Muzzle flash effects
