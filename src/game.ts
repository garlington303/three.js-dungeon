/**
 * Retro Dungeon Crawler - Three.js Implementation
 * A fully 3D dungeon crawler with retro aesthetics
 */

import * as THREE from 'three';
import { InventoryManager } from './inventory';

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONFIG = {
  // Display
  SCREEN_WIDTH: 1920,
  SCREEN_HEIGHT: 1080,
  PIXEL_RATIO: Math.min(window.devicePixelRatio, 2),
  
  // Gameplay
  MOVE_SPEED: 2.0,
  MOUSE_SENSITIVITY: 0.002,
  PLAYER_HEIGHT: 0.5,
  WALL_HEIGHT: 1.0,
  
  // Dash/Dodge
  DASH_SPEED: 12.0,
  DASH_DURATION: 0.15,
  DASH_COOLDOWN: 1.0,
  
  // Combat
  PROJECTILE_SPEED: 12.0,
  PROJECTILE_LIFETIME: 5.0,
  PROJECTILE_DAMAGE: 25,
  
  // Enemies
  ENEMY_DETECTION_RANGE: 8.0,
  ENEMY_SPEED: 1.5,
  ENEMY_HIT_RADIUS: 0.4,
  ENEMY_ATTACK_DAMAGE: 1,
  ENEMY_ATTACK_COOLDOWN: 1.0,
  
  // Player
  PLAYER_MAX_HEALTH: 10, // 5 hearts × 2 HP each (supports half-hearts)
  
  // World
  MAP_SIZE: 16,
  CELL_SIZE: 1.0,
  
  // Collectibles
  COIN_PICKUP_RADIUS: 0.6,
  COIN_BOB_SPEED: 2.0,
  COIN_BOB_HEIGHT: 0.1,
  COIN_SPIN_SPEED: 3.0,
};

// ============================================================================
// TYPES
// ============================================================================

export type SceneType = 'dungeon' | 'dungeon2';

export type EnemyState = 'idle' | 'chase' | 'defeated';

export interface CoinData {
  sprite: THREE.Sprite;
  x: number;
  z: number;
  baseY: number;
  bobOffset: number;
  animOffset: number;
  collected: boolean;
}

export interface EnemyData {
  mesh: THREE.Mesh | THREE.Sprite;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  state: EnemyState;
  speed: number;
  detectionRange: number;
  damageFlashTimer: number;
  deathTimer: number;
  attackCooldown: number;
}

export interface ProjectileData {
  mesh: THREE.Mesh;
  dirX: number;
  dirY: number;
  lifetime: number;
  hand: 'left' | 'right';
}

// ============================================================================
// WORLD MAP
// ============================================================================

// 0 = empty, 1 = stone wall, 2 = brick wall, 3 = wood, 4 = door (to dungeon2)
export const DUNGEON_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 2, 2, 0, 0, 0, 3, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Backward compatibility alias
export const WORLD_MAP = DUNGEON_MAP;

// Second dungeon map (empty room with door back)
// 0 = empty, 1 = stone wall, 4 = door (back to first dungeon)
export const DUNGEON2_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const DUNGEON2_CONFIG = {
  MAP_SIZE: 12,
  CELL_SIZE: 1.0,
};

export const ENEMY_PRESETS = [
  { maxHealth: 50, speed: CONFIG.ENEMY_SPEED, name: 'Slime' },
  { maxHealth: 100, speed: CONFIG.ENEMY_SPEED * 0.7, name: 'Tank Slime' },
  { maxHealth: 30, speed: CONFIG.ENEMY_SPEED * 1.5, name: 'Fast Slime' },
];

// ============================================================================
// TEXTURE MANAGER
// ============================================================================

class TextureManager {
  private loader = new THREE.TextureLoader();
  private cubeLoader = new THREE.CubeTextureLoader();
  public textures: Map<string, THREE.Texture> = new Map();
  public skybox: THREE.CubeTexture | null = null;
  public dungeon2Skybox: THREE.CubeTexture | null = null;

  async loadAll(): Promise<void> {
    // Configure texture defaults for pixel art look
    const configureTexture = (tex: THREE.Texture) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    try {
      // Load floor texture
      const floorTex = await this.loader.loadAsync('src/assets/textures/cobblestone-1.png');
      configureTexture(floorTex);
      floorTex.repeat.set(CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
      this.textures.set('floor', floorTex);
      console.log('Floor texture loaded');
    } catch (e) {
      console.warn('Failed to load floor texture', e);
    }

    try {
      // Load slime texture
      const slimeTex = await this.loader.loadAsync('src/assets/enemies/slime.png');
      configureTexture(slimeTex);
      this.textures.set('slime', slimeTex);
      console.log('Slime texture loaded');
    } catch (e) {
      console.warn('Failed to load slime texture', e);
    }

    try {
      // Load right hand texture
      const handTex = await this.loader.loadAsync('src/assets/resources/hands/Mage-hand.png');
      configureTexture(handTex);
      this.textures.set('hand', handTex);
      console.log('Right hand texture loaded');
    } catch (e) {
      console.warn('Failed to load right hand texture', e);
    }

    // Load additional hand textures
    const handTextures = [
      { name: 'hand-lady', path: 'src/assets/resources/hands/lady_hands.png' },
      { name: 'hand-m1911', path: 'src/assets/resources/hands/m1911_hands.png' },
      { name: 'hand-plate', path: 'src/assets/resources/hands/plate_hands.png' },
      { name: 'hand-shotgun', path: 'src/assets/resources/hands/shotgun_hands.png' },
      { name: 'hand-mage-right', path: 'src/assets/resources/hands/mage-hand-right2.png' },
    ];

    for (const hand of handTextures) {
      try {
        const tex = await this.loader.loadAsync(hand.path);
        configureTexture(tex);
        this.textures.set(hand.name, tex);
        console.log(`${hand.name} texture loaded`);
      } catch (e) {
        console.warn(`Failed to load ${hand.name} texture`, e);
      }
    }

    try {
      // Load left hand texture (separate image, not mirrored)
      const leftHandTex = await this.loader.loadAsync('src/assets/resources/hands/Mage-hand-left1.png');
      configureTexture(leftHandTex);
      this.textures.set('hand-left', leftHandTex);
      console.log('Left hand texture loaded');
    } catch (e) {
      console.warn('Failed to load left hand texture', e);
    }

    try {
      // Load heart texture for health bar
      const heartTex = await this.loader.loadAsync('src/assets/ui/heart-full.png');
      configureTexture(heartTex);
      this.textures.set('heart', heartTex);
      console.log('Heart texture loaded');
    } catch (e) {
      console.warn('Failed to load heart texture', e);
    }

    try {
      // Load gold coin texture with pixel-perfect filtering
      const coinTex = await this.loader.loadAsync('src/assets/textures/items/gold_coin.png');
      coinTex.magFilter = THREE.NearestFilter;
      coinTex.minFilter = THREE.NearestFilter;
      coinTex.generateMipmaps = false;
      this.textures.set('coin', coinTex);
      console.log('Coin texture loaded');
    } catch (e) {
      console.warn('Failed to load coin texture - using yellow placeholder', e);
    }

    try {
      // Load dungeon skybox (night moon)
      const skyboxPath = 'src/assets/skybox/Blue Sky Skybox Pack/night moon';
      this.skybox = await this.cubeLoader.loadAsync([
        `${skyboxPath}/jettelly_moon_RIGHT.png`,
        `${skyboxPath}/jettelly_moon_LEFT.png`,
        `${skyboxPath}/jettelly_moon_UP.png`,
        `${skyboxPath}/jettelly_moon_DOWN.png`,
        `${skyboxPath}/jettelly_moon_FRONT.png`,
        `${skyboxPath}/jettelly_moon_BACK.png`,
      ]);
      this.skybox.colorSpace = THREE.SRGBColorSpace;
      console.log('Dungeon skybox loaded');
    } catch (e) {
      console.warn('Failed to load dungeon skybox', e);
    }

    try {
      // Load dungeon2 skybox (same as main dungeon for consistency)
      const dungeon2SkyboxPath = 'src/assets/skybox/Blue Sky Skybox Pack/night moon';
      this.dungeon2Skybox = await this.cubeLoader.loadAsync([
        `${dungeon2SkyboxPath}/jettelly_moon_RIGHT.png`,
        `${dungeon2SkyboxPath}/jettelly_moon_LEFT.png`,
        `${dungeon2SkyboxPath}/jettelly_moon_UP.png`,
        `${dungeon2SkyboxPath}/jettelly_moon_DOWN.png`,
        `${dungeon2SkyboxPath}/jettelly_moon_FRONT.png`,
        `${dungeon2SkyboxPath}/jettelly_moon_BACK.png`,
      ]);
      this.dungeon2Skybox.colorSpace = THREE.SRGBColorSpace;
      console.log('Dungeon2 skybox loaded');
    } catch (e) {
      console.warn('Failed to load dungeon2 skybox', e);
    }

    console.log('All textures loaded');
  }

  get(name: string): THREE.Texture | undefined {
    return this.textures.get(name);
  }
}

// ============================================================================
// WORLD BUILDER
// ============================================================================

class WorldBuilder {
  private scene: THREE.Scene;
  private textures: TextureManager;
  private wallMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, textures: TextureManager) {
    this.scene = scene;
    this.textures = textures;
  }

  build(): void {
    this.createFloor();
    this.createWalls();
    this.createLighting();
  }

  private createFloor(): void {
    const floorGeometry = new THREE.PlaneGeometry(CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
    const floorTexture = this.textures.get('floor');
    
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.9,
      metalness: 0.1,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(CONFIG.MAP_SIZE / 2, 0, CONFIG.MAP_SIZE / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private createWalls(): void {
    // Create materials for each wall type
    const wallMaterials = this.createWallMaterials();

    for (let x = 0; x < CONFIG.MAP_SIZE; x++) {
      for (let z = 0; z < CONFIG.MAP_SIZE; z++) {
        const cell = DUNGEON_MAP[z][x];
        if (cell === 4) {
          // Door to dungeon2
          this.createDoor(x, z);
        } else if (cell > 0) {
          this.createWall(x, z, cell, wallMaterials);
        }
      }
    }
  }

  private createDoor(x: number, z: number): void {
    // Create door frame (archway)
    const frameGeometry = new THREE.BoxGeometry(CONFIG.CELL_SIZE, CONFIG.WALL_HEIGHT, CONFIG.CELL_SIZE);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.8,
      metalness: 0.1,
    });

    const doorFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    doorFrame.position.set(
      x + CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + CONFIG.CELL_SIZE / 2
    );
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    this.scene.add(doorFrame);

    // Create door opening (carve out center) - use a smaller box to represent the open doorway
    const doorWidth = 0.7;
    const doorHeight = 0.9;
    const openingGeometry = new THREE.BoxGeometry(doorWidth, doorHeight * CONFIG.WALL_HEIGHT, 0.3);
    const openingMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const doorOpening = new THREE.Mesh(openingGeometry, openingMaterial);
    doorOpening.position.set(
      x + CONFIG.CELL_SIZE / 2,
      (doorHeight * CONFIG.WALL_HEIGHT) / 2,
      z + CONFIG.CELL_SIZE / 2
    );
    doorOpening.name = 'dungeon2Door';
    this.scene.add(doorOpening);

    // Add glowing effect around door - facing SOUTH (into the dungeon) so player can see it
    // Since door is on north wall (z=0), the player approaches from the south (higher z values)
    const glowGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(
      x + CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + CONFIG.CELL_SIZE - 0.01 // South side of door cell (facing into dungeon)
    );
    glow.name = 'doorGlow';
    this.scene.add(glow);

    // Add a point light to make the portal more visible
    const portalLight = new THREE.PointLight(0x88ccff, 1.5, 5);
    portalLight.position.set(
      x + CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + CONFIG.CELL_SIZE
    );
    this.scene.add(portalLight);
  }

  private createWallMaterials(): THREE.MeshStandardMaterial[] {
    const TEX_SIZE = 128; // Higher resolution for better detail

    // Seeded random for consistent textures
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Create diffuse (color) texture
    const createDiffuseTexture = (type: number): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const ctx = canvas.getContext('2d')!;

      if (type === 1) {
        // Stone block texture - dark atmospheric dungeon stones
        const blockRows = 4;
        const blockCols = 2;
        const blockWidth = TEX_SIZE / blockCols;
        const blockHeight = TEX_SIZE / blockRows;
        const mortarSize = 3;

        // Fill with dark mortar base
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

        // Draw individual stone blocks with variation
        for (let row = 0; row < blockRows; row++) {
          const rowOffset = row % 2 === 0 ? 0 : blockWidth / 2;
          for (let col = 0; col < blockCols + 1; col++) {
            const bx = col * blockWidth + rowOffset - blockWidth / 2;
            const by = row * blockHeight;

            // Base stone color with variation (dark grays: 0x333333 to 0x555555)
            const baseShade = 45 + seededRandom(row * 10 + col) * 30;
            const r = Math.floor(baseShade + seededRandom(row * 7 + col * 3) * 10 - 5);
            const g = Math.floor(baseShade + seededRandom(row * 11 + col * 5) * 8 - 4);
            const b = Math.floor(baseShade + seededRandom(row * 13 + col * 7) * 12 - 6);

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(
              bx + mortarSize,
              by + mortarSize,
              blockWidth - mortarSize * 2,
              blockHeight - mortarSize * 2
            );

            // Add noise/texture to each block
            for (let i = 0; i < 60; i++) {
              const nx = bx + mortarSize + seededRandom(i + row * 100 + col * 50) * (blockWidth - mortarSize * 2);
              const ny = by + mortarSize + seededRandom(i * 2 + row * 100 + col * 50) * (blockHeight - mortarSize * 2);
              const noiseShade = baseShade + (seededRandom(i * 3 + row + col) - 0.5) * 25;
              ctx.fillStyle = `rgb(${noiseShade}, ${noiseShade}, ${noiseShade})`;
              ctx.fillRect(nx, ny, 2, 2);
            }

            // Subtle edge highlights (top-left lighter, bottom-right darker)
            ctx.strokeStyle = `rgba(255, 255, 255, 0.08)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + mortarSize, by + blockHeight - mortarSize);
            ctx.lineTo(bx + mortarSize, by + mortarSize);
            ctx.lineTo(bx + blockWidth - mortarSize, by + mortarSize);
            ctx.stroke();

            ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
            ctx.beginPath();
            ctx.moveTo(bx + blockWidth - mortarSize, by + mortarSize);
            ctx.lineTo(bx + blockWidth - mortarSize, by + blockHeight - mortarSize);
            ctx.lineTo(bx + mortarSize, by + blockHeight - mortarSize);
            ctx.stroke();
          }
        }
      } else if (type === 2) {
        // Brick texture - darker dungeon bricks
        const brickRows = 8;
        const brickHeight = TEX_SIZE / brickRows;
        const brickWidth = TEX_SIZE / 2;
        const mortarSize = 2;

        // Dark mortar
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

        for (let row = 0; row < brickRows; row++) {
          const rowOffset = row % 2 === 0 ? 0 : brickWidth / 2;
          for (let col = 0; col < 3; col++) {
            const bx = col * brickWidth + rowOffset - brickWidth / 2;
            const by = row * brickHeight;

            // Dark red/brown brick with variation
            const baseR = 70 + seededRandom(row * 7 + col * 3) * 25;
            const baseG = 35 + seededRandom(row * 11 + col * 5) * 15;
            const baseB = 30 + seededRandom(row * 13 + col * 7) * 10;

            ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
            ctx.fillRect(
              bx + mortarSize,
              by + mortarSize,
              brickWidth - mortarSize * 2,
              brickHeight - mortarSize * 2
            );

            // Add texture noise
            for (let i = 0; i < 20; i++) {
              const nx = bx + mortarSize + seededRandom(i + row * 50 + col * 25) * (brickWidth - mortarSize * 2);
              const ny = by + mortarSize + seededRandom(i * 2 + row * 50) * (brickHeight - mortarSize * 2);
              const variation = (seededRandom(i * 3 + row + col) - 0.5) * 20;
              ctx.fillStyle = `rgb(${baseR + variation}, ${baseG + variation * 0.5}, ${baseB + variation * 0.3})`;
              ctx.fillRect(nx, ny, 2, 1);
            }
          }
        }
      } else {
        // Wood planks texture - dark aged wood
        const plankCount = 4;
        const plankWidth = TEX_SIZE / plankCount;
        const gapSize = 2;

        // Dark gap between planks
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

        for (let p = 0; p < plankCount; p++) {
          const px = p * plankWidth;

          // Dark wood base with variation
          const baseShade = 50 + seededRandom(p * 7) * 20;
          const woodR = baseShade + 15;
          const woodG = baseShade - 5;
          const woodB = baseShade - 20;

          ctx.fillStyle = `rgb(${woodR}, ${woodG}, ${woodB})`;
          ctx.fillRect(px + gapSize, 0, plankWidth - gapSize * 2, TEX_SIZE);

          // Wood grain lines
          for (let g = 0; g < 12; g++) {
            const gx = px + gapSize + seededRandom(p * 20 + g) * (plankWidth - gapSize * 2);
            const grainShade = baseShade + (seededRandom(g * 3 + p) - 0.5) * 30;
            ctx.strokeStyle = `rgba(${grainShade - 10}, ${grainShade - 15}, ${grainShade - 25}, 0.6)`;
            ctx.lineWidth = 1 + seededRandom(g + p) * 2;
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            // Wavy grain
            for (let y = 0; y < TEX_SIZE; y += 8) {
              ctx.lineTo(gx + (seededRandom(y + g + p) - 0.5) * 3, y);
            }
            ctx.stroke();
          }

          // Knots
          if (seededRandom(p * 13) > 0.6) {
            const kx = px + plankWidth / 2 + (seededRandom(p * 17) - 0.5) * 20;
            const ky = seededRandom(p * 19) * TEX_SIZE;
            const kr = 4 + seededRandom(p * 23) * 4;
            ctx.fillStyle = `rgb(${woodR - 20}, ${woodG - 15}, ${woodB - 10})`;
            ctx.beginPath();
            ctx.ellipse(kx, ky, kr, kr * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestMipmapLinearFilter;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    // Create normal map for depth effect
    const createNormalMap = (type: number): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = TEX_SIZE;
      canvas.height = TEX_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Base normal (pointing up: RGB = 128, 128, 255)
      ctx.fillStyle = 'rgb(128, 128, 255)';
      ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

      if (type === 1) {
        // Stone blocks - mortar indents
        const blockRows = 4;
        const blockCols = 2;
        const blockWidth = TEX_SIZE / blockCols;
        const blockHeight = TEX_SIZE / blockRows;
        const mortarSize = 3;

        for (let row = 0; row < blockRows; row++) {
          const rowOffset = row % 2 === 0 ? 0 : blockWidth / 2;
          for (let col = 0; col < blockCols + 1; col++) {
            const bx = col * blockWidth + rowOffset - blockWidth / 2;
            const by = row * blockHeight;

            // Left edge (normal pointing right)
            ctx.fillStyle = 'rgb(180, 128, 255)';
            ctx.fillRect(bx + mortarSize - 1, by + mortarSize, 2, blockHeight - mortarSize * 2);

            // Right edge (normal pointing left)
            ctx.fillStyle = 'rgb(76, 128, 255)';
            ctx.fillRect(bx + blockWidth - mortarSize - 1, by + mortarSize, 2, blockHeight - mortarSize * 2);

            // Top edge (normal pointing down)
            ctx.fillStyle = 'rgb(128, 180, 255)';
            ctx.fillRect(bx + mortarSize, by + mortarSize - 1, blockWidth - mortarSize * 2, 2);

            // Bottom edge (normal pointing up)
            ctx.fillStyle = 'rgb(128, 76, 255)';
            ctx.fillRect(bx + mortarSize, by + blockHeight - mortarSize - 1, blockWidth - mortarSize * 2, 2);
          }
        }
      } else if (type === 2) {
        // Bricks - similar indent pattern
        const brickRows = 8;
        const brickHeight = TEX_SIZE / brickRows;
        const brickWidth = TEX_SIZE / 2;
        const mortarSize = 2;

        for (let row = 0; row < brickRows; row++) {
          const rowOffset = row % 2 === 0 ? 0 : brickWidth / 2;
          for (let col = 0; col < 3; col++) {
            const bx = col * brickWidth + rowOffset - brickWidth / 2;
            const by = row * brickHeight;

            ctx.fillStyle = 'rgb(160, 128, 255)';
            ctx.fillRect(bx + mortarSize - 1, by + mortarSize, 1, brickHeight - mortarSize * 2);

            ctx.fillStyle = 'rgb(96, 128, 255)';
            ctx.fillRect(bx + brickWidth - mortarSize, by + mortarSize, 1, brickHeight - mortarSize * 2);

            ctx.fillStyle = 'rgb(128, 160, 255)';
            ctx.fillRect(bx + mortarSize, by + mortarSize - 1, brickWidth - mortarSize * 2, 1);

            ctx.fillStyle = 'rgb(128, 96, 255)';
            ctx.fillRect(bx + mortarSize, by + brickHeight - mortarSize, brickWidth - mortarSize * 2, 1);
          }
        }
      } else {
        // Wood planks - gaps between planks
        const plankCount = 4;
        const plankWidth = TEX_SIZE / plankCount;
        const gapSize = 2;

        for (let p = 0; p < plankCount; p++) {
          const px = p * plankWidth;

          // Left edge of plank
          ctx.fillStyle = 'rgb(170, 128, 255)';
          ctx.fillRect(px + gapSize, 0, 1, TEX_SIZE);

          // Right edge of plank
          ctx.fillStyle = 'rgb(86, 128, 255)';
          ctx.fillRect(px + plankWidth - gapSize - 1, 0, 1, TEX_SIZE);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    return [
      new THREE.MeshStandardMaterial(), // Placeholder for index 0
      new THREE.MeshStandardMaterial({
        map: createDiffuseTexture(1),
        normalMap: createNormalMap(1),
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 0.95,
        metalness: 0.0,
      }),
      new THREE.MeshStandardMaterial({
        map: createDiffuseTexture(2),
        normalMap: createNormalMap(2),
        normalScale: new THREE.Vector2(0.4, 0.4),
        roughness: 0.9,
        metalness: 0.0,
      }),
      new THREE.MeshStandardMaterial({
        map: createDiffuseTexture(3),
        normalMap: createNormalMap(3),
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughness: 0.85,
        metalness: 0.0,
      }),
    ];
  }

  private createWall(x: number, z: number, type: number, materials: THREE.MeshStandardMaterial[]): void {
    const geometry = new THREE.BoxGeometry(CONFIG.CELL_SIZE, CONFIG.WALL_HEIGHT, CONFIG.CELL_SIZE);
    const material = materials[type] || materials[1];
    
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(
      x + CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + CONFIG.CELL_SIZE / 2
    );
    wall.castShadow = true;
    wall.receiveShadow = true;
    
    this.wallMeshes.push(wall);
    this.scene.add(wall);
  }

  private createLighting(): void {
    // Ambient light for base visibility
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambient);

    // Hemisphere light for sky/ground color variation
    const hemisphere = new THREE.HemisphereLight(0x8888aa, 0x444422, 0.5);
    this.scene.add(hemisphere);

    // Directional light (moonlight)
    const directional = new THREE.DirectionalLight(0x6688cc, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 50;
    directional.shadow.camera.left = -20;
    directional.shadow.camera.right = 20;
    directional.shadow.camera.top = 20;
    directional.shadow.camera.bottom = -20;
    this.scene.add(directional);

    // Player torch (point light that follows player)
    const torch = new THREE.PointLight(0xff8844, 1.5, 8);
    torch.position.set(0, CONFIG.PLAYER_HEIGHT, 0);
    torch.castShadow = true;
    torch.shadow.mapSize.width = 512;
    torch.shadow.mapSize.height = 512;
    torch.name = 'playerTorch';
    this.scene.add(torch);
  }
}

// ============================================================================
// SECOND DUNGEON BUILDER
// ============================================================================

class Dungeon2Builder {
  private scene: THREE.Scene;
  private textures: TextureManager;
  private wallMaterials: THREE.MeshStandardMaterial[] = [];

  constructor(scene: THREE.Scene, textures: TextureManager) {
    this.scene = scene;
    this.textures = textures;
  }

  build(): void {
    this.wallMaterials = this.createWallMaterials();
    this.createFloor();
    this.createWalls();
    this.createLighting();
  }

  private createWallMaterials(): THREE.MeshStandardMaterial[] {
    const TEX_SIZE = 128;

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Create a darker stone texture for the second dungeon
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d')!;

    // Dark purple-ish stone blocks
    const blockRows = 4;
    const blockCols = 2;
    const blockWidth = TEX_SIZE / blockCols;
    const blockHeight = TEX_SIZE / blockRows;

    for (let row = 0; row < blockRows; row++) {
      for (let col = 0; col < blockCols; col++) {
        const offsetX = (row % 2) * (blockWidth / 2);
        const x = col * blockWidth + offsetX;
        const y = row * blockHeight;

        // Dark purple base
        const shade = 35 + seededRandom(row * 10 + col) * 20;
        ctx.fillStyle = `rgb(${shade + 10}, ${shade}, ${shade + 20})`;
        ctx.fillRect(x, y, blockWidth, blockHeight);

        // Mortar lines
        ctx.strokeStyle = '#1a1520';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1, y + 1, blockWidth - 2, blockHeight - 2);

        // Texture noise
        for (let i = 0; i < 80; i++) {
          const nx = x + seededRandom(row * 100 + col * 50 + i) * blockWidth;
          const ny = y + seededRandom(row * 200 + col * 100 + i) * blockHeight;
          const noiseShade = shade + (seededRandom(i * 7) - 0.5) * 30;
          ctx.fillStyle = `rgb(${noiseShade + 10}, ${noiseShade}, ${noiseShade + 20})`;
          ctx.fillRect(nx, ny, 2, 2);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapLinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return [new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    })];
  }

  private createFloor(): void {
    const floorTexture = this.textures.get('floor');
    const mapSize = DUNGEON2_CONFIG.MAP_SIZE;

    const floorGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
    let floorMaterial: THREE.MeshStandardMaterial;

    if (floorTexture) {
      const clonedTexture = floorTexture.clone();
      clonedTexture.repeat.set(mapSize, mapSize);
      clonedTexture.needsUpdate = true;
      floorMaterial = new THREE.MeshStandardMaterial({
        map: clonedTexture,
        roughness: 0.9,
        metalness: 0.1,
      });
    } else {
      floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2030,
        roughness: 0.9,
        metalness: 0.1,
      });
    }

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(mapSize / 2, 0, mapSize / 2);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private createWalls(): void {
    const mapSize = DUNGEON2_CONFIG.MAP_SIZE;

    for (let z = 0; z < mapSize; z++) {
      for (let x = 0; x < mapSize; x++) {
        const cell = DUNGEON2_MAP[z]?.[x];
        if (cell === 1) {
          this.createWall(x, z);
        } else if (cell === 4) {
          this.createReturnDoor(x, z);
        }
      }
    }
  }

  private createWall(x: number, z: number): void {
    const geometry = new THREE.BoxGeometry(
      DUNGEON2_CONFIG.CELL_SIZE,
      CONFIG.WALL_HEIGHT,
      DUNGEON2_CONFIG.CELL_SIZE
    );

    const material = this.wallMaterials[0];
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(
      x + DUNGEON2_CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + DUNGEON2_CONFIG.CELL_SIZE / 2
    );
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
  }

  private createReturnDoor(x: number, z: number): void {
    // Create door frame
    const frameGeometry = new THREE.BoxGeometry(
      DUNGEON2_CONFIG.CELL_SIZE,
      CONFIG.WALL_HEIGHT,
      DUNGEON2_CONFIG.CELL_SIZE
    );
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2828,
      roughness: 0.8,
      metalness: 0.1,
    });

    const doorFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    doorFrame.position.set(
      x + DUNGEON2_CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + DUNGEON2_CONFIG.CELL_SIZE / 2
    );
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    this.scene.add(doorFrame);

    // Portal effect - facing north (into the room)
    const doorWidth = 0.7;
    const doorHeight = 0.9;
    const openingGeometry = new THREE.BoxGeometry(doorWidth, doorHeight * CONFIG.WALL_HEIGHT, 0.3);
    const openingMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa8844,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const doorOpening = new THREE.Mesh(openingGeometry, openingMaterial);
    doorOpening.position.set(
      x + DUNGEON2_CONFIG.CELL_SIZE / 2,
      (doorHeight * CONFIG.WALL_HEIGHT) / 2,
      z + DUNGEON2_CONFIG.CELL_SIZE / 2
    );
    doorOpening.name = 'dungeonDoor';
    this.scene.add(doorOpening);

    // Glow ring facing into the room (north side)
    const glowGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(
      x + DUNGEON2_CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z + 0.01 // North side of door cell (facing into room)
    );
    glow.name = 'doorGlow';
    this.scene.add(glow);

    // Portal light
    const portalLight = new THREE.PointLight(0xffaa44, 1.5, 5);
    portalLight.position.set(
      x + DUNGEON2_CONFIG.CELL_SIZE / 2,
      CONFIG.WALL_HEIGHT / 2,
      z
    );
    this.scene.add(portalLight);
  }

  private createLighting(): void {
    // Darker ambient for second dungeon
    const ambient = new THREE.AmbientLight(0x221133, 0.4);
    this.scene.add(ambient);

    // Dim directional light
    const directional = new THREE.DirectionalLight(0x6644aa, 0.3);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    this.scene.add(directional);

    // Player torch
    const torch = new THREE.PointLight(0xff8844, 1.5, 8);
    torch.position.set(0, CONFIG.PLAYER_HEIGHT, 0);
    torch.castShadow = true;
    torch.shadow.mapSize.width = 512;
    torch.shadow.mapSize.height = 512;
    torch.name = 'playerTorch';
    this.scene.add(torch);
  }
}

// ============================================================================
// PLAYER CONTROLLER
// ============================================================================

class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  private velocity = new THREE.Vector3();
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');

  private keys: { [key: string]: boolean } = {};
  private isLocked = false;

  // Health system
  public health: number = CONFIG.PLAYER_MAX_HEALTH;
  public maxHealth: number = CONFIG.PLAYER_MAX_HEALTH;
  private damageFlashTimer = 0;
  private invulnerabilityTimer = 0;
  private onHealthChange?: (health: number, maxHealth: number) => void;

  // Scene system
  private currentScene: SceneType = 'dungeon';
  private onDoorEnter?: (targetScene: SceneType) => void;
  private doorCooldown = 0; // Prevent rapid scene switching
  
  // Dash system
  private isDashing = false;
  private dashTimer = 0;
  private dashCooldown = 0;
  private dashDirection = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    // Create camera
    const fov = 66;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      CONFIG.SCREEN_WIDTH / CONFIG.SCREEN_HEIGHT,
      0.1,
      100
    );
    
    // Starting position
    this.position = new THREE.Vector3(3.5, CONFIG.PLAYER_HEIGHT, 3.5);
    this.camera.position.copy(this.position);
    this.euler.y = Math.PI; // Face initial direction
    this.camera.quaternion.setFromEuler(this.euler); // Apply rotation immediately

    this.setupInputs(canvas);
  }

  private setupInputs(canvas: HTMLCanvasElement): void {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer lock
    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === canvas;
      const overlay = document.getElementById('overlay');
      if (this.isLocked) {
        overlay?.classList.add('hidden');
      } else {
        overlay?.classList.remove('hidden');
      }
    });

    // Mouse look
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      
      this.euler.y -= e.movementX * CONFIG.MOUSE_SENSITIVITY;
      this.euler.x -= e.movementY * CONFIG.MOUSE_SENSITIVITY;
      this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));
    });
  }

  update(dt: number): void {
    if (!this.isLocked) return;

    // Update dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown -= dt;
    }

    // Check for dash input (Shift key)
    const shiftPressed = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    if (shiftPressed && !this.isDashing && this.dashCooldown <= 0) {
      this.startDash();
    }

    // Handle active dash
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      } else {
        // Move in dash direction
        const dashMove = this.dashDirection.clone().multiplyScalar(CONFIG.DASH_SPEED * dt);
        const newPos = this.position.clone().add(dashMove);
        
        if (this.canMoveTo(newPos.x, this.position.z)) {
          this.position.x = newPos.x;
        }
        if (this.canMoveTo(this.position.x, newPos.z)) {
          this.position.z = newPos.z;
        }
        
        // Update camera during dash
        this.camera.position.copy(this.position);
        this.camera.quaternion.setFromEuler(this.euler);
        return; // Skip normal movement during dash
      }
    }

    const currentSpeed = CONFIG.MOVE_SPEED;

    // Calculate movement direction
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    forward.applyEuler(new THREE.Euler(0, this.euler.y, 0));
    right.applyEuler(new THREE.Euler(0, this.euler.y, 0));

    // Input
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyD']) moveDir.add(right);
    if (this.keys['KeyA']) moveDir.sub(right);

    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(currentSpeed * dt);
      
      // Collision detection
      const newPos = this.position.clone().add(moveDir);
      
      // Check X movement
      if (this.canMoveTo(newPos.x, this.position.z)) {
        this.position.x = newPos.x;
      }
      // Check Z movement
      if (this.canMoveTo(this.position.x, newPos.z)) {
        this.position.z = newPos.z;
      }
    }

    // Update camera
    this.camera.position.copy(this.position);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  private canMoveTo(x: number, z: number): boolean {
    if (this.currentScene === 'dungeon') {
      return this.canMoveInDungeon(x, z);
    } else {
      return this.canMoveInDungeon2(x, z);
    }
  }

  private canMoveInDungeon(x: number, z: number): boolean {
    const margin = 0.2;
    const checks = [
      [x - margin, z - margin],
      [x + margin, z - margin],
      [x - margin, z + margin],
      [x + margin, z + margin],
    ];

    for (const [checkX, checkZ] of checks) {
      const mapX = Math.floor(checkX);
      const mapZ = Math.floor(checkZ);
      if (mapX < 0 || mapX >= CONFIG.MAP_SIZE || mapZ < 0 || mapZ >= CONFIG.MAP_SIZE) {
        return false;
      }
      const cell = DUNGEON_MAP[mapZ][mapX];
      // Allow movement through doors (cell === 4), block walls (cell 1-3)
      if (cell > 0 && cell !== 4) {
        return false;
      }
    }
    return true;
  }

  private canMoveInDungeon2(x: number, z: number): boolean {
    const margin = 0.2;
    const mapSize = DUNGEON2_CONFIG.MAP_SIZE;

    const checks = [
      [x - margin, z - margin],
      [x + margin, z - margin],
      [x - margin, z + margin],
      [x + margin, z + margin],
    ];

    for (const [checkX, checkZ] of checks) {
      const mapX = Math.floor(checkX);
      const mapZ = Math.floor(checkZ);
      if (mapX < 0 || mapX >= mapSize || mapZ < 0 || mapZ >= mapSize) {
        return false;
      }
      const cell = DUNGEON2_MAP[mapZ]?.[mapX];
      // Allow movement through doors (cell === 4), block walls (cell 1-3)
      if (cell !== undefined && cell > 0 && cell !== 4) {
        return false;
      }
    }

    return true;
  }

  checkDoorProximity(): void {
    if (this.doorCooldown > 0) return;

    if (this.currentScene === 'dungeon') {
      // Check if near dungeon2 door in dungeon
      // Door is at position [0][7] in the map (x=7, z=0)
      // Player approaches from the south, so check proximity to the south edge of the door cell
      const doorX = 7.5;
      const doorZ = 1.0; // South edge of door cell where player can actually reach
      const distance = Math.sqrt(
        Math.pow(this.position.x - doorX, 2) + Math.pow(this.position.z - doorZ, 2)
      );

      if (distance < 1.5) {
        this.onDoorEnter?.('dungeon2');
        this.doorCooldown = 1.0;
      }
    } else {
      // Check if near dungeon door in dungeon2
      // Door is at position [10][5] in the DUNGEON2_MAP
      const doorX = 5.5;
      const doorZ = 10.0; // North edge of door cell
      const distance = Math.sqrt(
        Math.pow(this.position.x - doorX, 2) + Math.pow(this.position.z - doorZ, 2)
      );

      if (distance < 1.5) {
        this.onDoorEnter?.('dungeon');
        this.doorCooldown = 1.0;
      }
    }
  }

  getDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(this.euler);
    return dir;
  }

  isActive(): boolean {
    return this.isLocked;
  }

  getIsDashing(): boolean {
    return this.isDashing;
  }

  getDashCooldownPercent(): number {
    return Math.max(0, this.dashCooldown / CONFIG.DASH_COOLDOWN);
  }

  private startDash(): void {
    // Get movement direction or facing direction
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    forward.applyEuler(new THREE.Euler(0, this.euler.y, 0));
    right.applyEuler(new THREE.Euler(0, this.euler.y, 0));

    this.dashDirection.set(0, 0, 0);
    if (this.keys['KeyW']) this.dashDirection.add(forward);
    if (this.keys['KeyS']) this.dashDirection.sub(forward);
    if (this.keys['KeyD']) this.dashDirection.add(right);
    if (this.keys['KeyA']) this.dashDirection.sub(right);

    // If no movement keys, dash forward
    if (this.dashDirection.length() === 0) {
      this.dashDirection.copy(forward);
    } else {
      this.dashDirection.normalize();
    }

    this.isDashing = true;
    this.dashTimer = CONFIG.DASH_DURATION;
    this.dashCooldown = CONFIG.DASH_COOLDOWN;
  }

  setHealthChangeCallback(callback: (health: number, maxHealth: number) => void): void {
    this.onHealthChange = callback;
    // Trigger initial update
    callback(this.health, this.maxHealth);
  }

  takeDamage(amount: number): void {
    if (this.invulnerabilityTimer > 0) return;
    
    this.health -= amount;
    this.damageFlashTimer = 0.2;
    this.invulnerabilityTimer = 0.5; // Brief invulnerability after hit
    
    if (this.health < 0) this.health = 0;
    
    this.onHealthChange?.(this.health, this.maxHealth);
    
    console.log(`Player took ${amount} damage! Health: ${this.health}/${this.maxHealth}`);
  }

  isInvulnerable(): boolean {
    return this.invulnerabilityTimer > 0;
  }

  updateTimers(dt: number): void {
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer -= dt;
    if (this.doorCooldown > 0) this.doorCooldown -= dt;
  }

  setDoorCallback(callback: (targetScene: SceneType) => void): void {
    this.onDoorEnter = callback;
  }

  setScene(scene: SceneType): void {
    this.currentScene = scene;
  }

  getScene(): SceneType {
    return this.currentScene;
  }

  teleportTo(x: number, z: number, facingAngle?: number): void {
    this.position.x = x;
    this.position.z = z;
    if (facingAngle !== undefined) {
      this.euler.y = facingAngle;
    }
    this.camera.position.copy(this.position);
    this.camera.quaternion.setFromEuler(this.euler);
  }
}

// ============================================================================
// COIN MANAGER
// ============================================================================

class CoinManager {
  private scene: THREE.Scene;
  private textures: TextureManager;
  private inventoryManager: InventoryManager;
  private coins: CoinData[] = [];
  private coinMaterial: THREE.SpriteMaterial | null = null;
  private onCoinCollected?: (total: number) => void;
  private totalCollected = 0;
  private animTime = 0;

  constructor(scene: THREE.Scene, textures: TextureManager, inventoryManager: InventoryManager) {
    this.scene = scene;
    this.textures = textures;
    this.inventoryManager = inventoryManager;
    this.setupMaterial();
  }

  private setupMaterial(): void {
    const tex = this.textures.get('coin');
    if (tex) {
      this.coinMaterial = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.1,
      });
      console.log('Coin material created');
    } else {
      // Fallback yellow placeholder
      this.coinMaterial = new THREE.SpriteMaterial({
        color: 0xffdd44,
        transparent: true,
      });
      console.warn('Coin texture not found - using placeholder');
    }
  }

  spawnCoin(x: number, z: number, y: number = 0.4): void {
    if (!this.coinMaterial) return;

    const sprite = new THREE.Sprite(this.coinMaterial.clone());
    sprite.scale.set(0.3, 0.3, 0.3);
    sprite.position.set(x, y, z);
    
    const coin: CoinData = {
      sprite,
      x,
      z,
      baseY: y,
      bobOffset: Math.random() * Math.PI * 2,
      animOffset: 0,
      collected: false,
    };

    this.coins.push(coin);
    this.scene.add(sprite);
  }

  spawnCoinsInRoom(positions: Array<{x: number, z: number}>): void {
    positions.forEach(pos => this.spawnCoin(pos.x, pos.z));
  }

  setCollectionCallback(callback: (total: number) => void): void {
    this.onCoinCollected = callback;
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    this.animTime += dt;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      
      if (coin.collected) continue;

      // Bobbing animation
      const bobY = Math.sin(this.animTime * CONFIG.COIN_BOB_SPEED + coin.bobOffset) * CONFIG.COIN_BOB_HEIGHT;
      coin.sprite.position.y = coin.baseY + bobY;

      // Check for pickup
      const dx = playerPos.x - coin.x;
      const dz = playerPos.z - coin.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < CONFIG.COIN_PICKUP_RADIUS) {
        this.collectCoin(coin, i);
      }
    }
  }

  private collectCoin(coin: CoinData, index: number): void {
    // Try to add to inventory
    const added = this.inventoryManager.addItem('gold', 1);
    
    if (added) {
      coin.collected = true;
      this.scene.remove(coin.sprite);
      this.coins.splice(index, 1);
      
      this.totalCollected++;
      this.onCoinCollected?.(this.totalCollected);
      
      console.log(`Coin collected! Total: ${this.totalCollected}`);
    } else {
      // Inventory full - maybe show a message?
      // console.log('Inventory full!');
    }
  }

  getTotalCollected(): number {
    return this.totalCollected;
  }

  getActiveCoins(): number {
    return this.coins.length;
  }
}

// ============================================================================
// ENEMY MANAGER
// ============================================================================

class EnemyManager {
  private scene: THREE.Scene;
  private textures: TextureManager;
  private enemies: EnemyData[] = [];
  private camera: THREE.Camera;
  private player: PlayerController | null = null;

  constructor(scene: THREE.Scene, textures: TextureManager, camera: THREE.Camera) {
    this.scene = scene;
    this.textures = textures;
    this.camera = camera;
    this.setupSpawnKeys();
  }

  setPlayer(player: PlayerController): void {
    this.player = player;
  }

  private setupSpawnKeys(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.spawnEnemy(0);
      if (e.code === 'Digit2') this.spawnEnemy(1);
      if (e.code === 'Digit3') this.spawnEnemy(2);
    });
  }

  spawnEnemy(presetIndex: number): void {
    const preset = ENEMY_PRESETS[presetIndex];
    if (!preset) return;

    // Find spawn position in front of camera
    const cam = this.camera;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const spawnDist = 3 + Math.random() * 2;
    
    let spawnX = cam.position.x + dir.x * spawnDist;
    let spawnZ = cam.position.z + dir.z * spawnDist;

    // Ensure valid spawn position
    const mapX = Math.floor(spawnX);
    const mapZ = Math.floor(spawnZ);
    if (mapX < 1 || mapX >= CONFIG.MAP_SIZE - 1 || mapZ < 1 || mapZ >= CONFIG.MAP_SIZE - 1) return;
    if (WORLD_MAP[mapZ][mapX] !== 0) return;

    // Create sprite for enemy
    const slimeTexture = this.textures.get('slime');
    const material = new THREE.SpriteMaterial({ 
      map: slimeTexture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(spawnX, 0.4, spawnZ);
    sprite.scale.set(0.8, 0.8, 0.8);
    
    this.scene.add(sprite);

    const enemy: EnemyData = {
      mesh: sprite,
      x: spawnX,
      y: spawnZ,
      health: preset.maxHealth,
      maxHealth: preset.maxHealth,
      state: 'idle',
      speed: preset.speed,
      detectionRange: CONFIG.ENEMY_DETECTION_RANGE,
      damageFlashTimer: 0,
      deathTimer: 0,
      attackCooldown: 0,
    };

    this.enemies.push(enemy);
    console.log(`Spawned ${preset.name} at (${spawnX.toFixed(1)}, ${spawnZ.toFixed(1)})`);
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.state === 'defeated') {
        enemy.deathTimer -= dt;
        // Fade out
        if (enemy.mesh instanceof THREE.Sprite) {
          enemy.mesh.material.opacity = Math.max(0, enemy.deathTimer / 1.0);
        }
        if (enemy.deathTimer <= 0) {
          this.scene.remove(enemy.mesh);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Damage flash
      if (enemy.damageFlashTimer > 0) {
        enemy.damageFlashTimer -= dt;
        if (enemy.mesh instanceof THREE.Sprite) {
          enemy.mesh.material.color.setHex(enemy.damageFlashTimer > 0 ? 0xff4444 : 0xffffff);
        }
      }

      // AI behavior
      const dx = playerPos.x - enemy.x;
      const dz = playerPos.z - enemy.y;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Update attack cooldown
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= dt;
      }

      if (dist < enemy.detectionRange) {
        enemy.state = 'chase';
        
        // Attack player if close enough
        if (dist < 0.8 && enemy.attackCooldown <= 0 && this.player) {
          this.player.takeDamage(CONFIG.ENEMY_ATTACK_DAMAGE);
          enemy.attackCooldown = CONFIG.ENEMY_ATTACK_COOLDOWN;
        }
        
        // Move toward player
        if (dist > 0.8) {
          const moveX = (dx / dist) * enemy.speed * dt;
          const moveZ = (dz / dist) * enemy.speed * dt;
          
          const newX = enemy.x + moveX;
          const newZ = enemy.y + moveZ;
          
          // Simple collision check
          const mapX = Math.floor(newX);
          const mapZ = Math.floor(newZ);
          if (WORLD_MAP[mapZ]?.[mapX] === 0) {
            enemy.x = newX;
            enemy.y = newZ;
          }
        }
      } else if (dist > enemy.detectionRange * 1.5) {
        enemy.state = 'idle';
      }

      // Update mesh position
      enemy.mesh.position.set(enemy.x, 0.4, enemy.y);
    }
  }

  damageEnemyAt(x: number, z: number, damage: number): boolean {
    for (const enemy of this.enemies) {
      if (enemy.state === 'defeated') continue;
      
      const dx = enemy.x - x;
      const dz = enemy.y - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < CONFIG.ENEMY_HIT_RADIUS) {
        enemy.health -= damage;
        enemy.damageFlashTimer = 0.1;
        
        if (enemy.health <= 0) {
          enemy.state = 'defeated';
          enemy.deathTimer = 1.0;
        }
        return true;
      }
    }
    return false;
  }

  getEnemies(): EnemyData[] {
    return this.enemies;
  }
}

// ============================================================================
// PROJECTILE MANAGER
// ============================================================================

class ProjectileManager {
  private scene: THREE.Scene;
  private projectiles: ProjectileData[] = [];
  private enemyManager: EnemyManager;

  constructor(scene: THREE.Scene, enemyManager: EnemyManager) {
    this.scene = scene;
    this.enemyManager = enemyManager;
  }

  fire(position: THREE.Vector3, direction: THREE.Vector3, hand: 'left' | 'right'): void {
    // Create projectile mesh
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const color = hand === 'left' ? 0x4488ff : 0xff8844;
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    // Offset to the side based on hand
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1), direction
    ));
    
    const offset = hand === 'left' ? -0.3 : 0.3;
    mesh.position.copy(position).add(right.multiplyScalar(offset));
    mesh.position.y -= 0.1;

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3 
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    // Add point light
    const light = new THREE.PointLight(color, 0.5, 3);
    mesh.add(light);

    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      dirX: direction.x,
      dirY: direction.z,
      lifetime: CONFIG.PROJECTILE_LIFETIME,
      hand,
    });
  }

  update(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // Move projectile
      proj.mesh.position.x += proj.dirX * CONFIG.PROJECTILE_SPEED * dt;
      proj.mesh.position.z += proj.dirY * CONFIG.PROJECTILE_SPEED * dt;

      // Check wall collision
      const mapX = Math.floor(proj.mesh.position.x);
      const mapZ = Math.floor(proj.mesh.position.z);
      
      let shouldRemove = false;

      if (mapX < 0 || mapX >= CONFIG.MAP_SIZE || mapZ < 0 || mapZ >= CONFIG.MAP_SIZE) {
        shouldRemove = true;
      } else if (WORLD_MAP[mapZ][mapX] !== 0) {
        shouldRemove = true;
      }

      // Check enemy collision
      if (!shouldRemove && this.enemyManager.damageEnemyAt(
        proj.mesh.position.x, 
        proj.mesh.position.z, 
        CONFIG.PROJECTILE_DAMAGE
      )) {
        shouldRemove = true;
      }

      // Lifetime
      proj.lifetime -= dt;
      if (proj.lifetime <= 0) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
}

// ============================================================================
// HUD MANAGER
// ============================================================================

class HUDManager {
  private rightHandSprite: THREE.Sprite | null = null;
  private leftHandSprite: THREE.Sprite | null = null;
  private camera: THREE.Camera;
  private textures: TextureManager;
  private leftCastTimer = 0;
  private rightCastTimer = 0;
  private castDuration = 0.15;
  private bobPhase = 0;
  
  // Hand selection
  private availableHands: string[] = ['hand', 'hand-lady', 'hand-m1911', 'hand-plate', 'hand-shotgun', 'hand-mage-right'];
  private currentHandIndex = 0;
  private handIndicatorTimeout: number | null = null;

  // Magic hand lights
  private leftHandLight: THREE.PointLight | null = null;
  private rightHandLight: THREE.PointLight | null = null;
  private magicPulsePhase = 0;
  
  // Health display
  private heartSprites: THREE.Sprite[] = [];
  private currentHealth = CONFIG.PLAYER_MAX_HEALTH;
  private maxHealth = CONFIG.PLAYER_MAX_HEALTH;
  private heartTexture: THREE.Texture | undefined;

  constructor(scene: THREE.Scene, camera: THREE.Camera, textures: TextureManager) {
    this.camera = camera;
    this.textures = textures;
    this.heartTexture = textures.get('heart');

    // Create heart sprites for health display
    this.createHeartSprites();

    // Create hand sprites if textures available
    this.updateRightHandTexture();
    
    const leftHandTexture = textures.get('hand-left');
    
    // Right hand (initialized in updateRightHandTexture)

    // Left hand (using dedicated left hand texture)
    if (leftHandTexture) {
      // Prevent edge bleeding artifacts
      leftHandTexture.wrapS = THREE.ClampToEdgeWrapping;
      leftHandTexture.wrapT = THREE.ClampToEdgeWrapping;
      leftHandTexture.premultiplyAlpha = false;

      const leftMaterial = new THREE.SpriteMaterial({
        map: leftHandTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        alphaTest: 0.5,
      });
      this.leftHandSprite = new THREE.Sprite(leftMaterial);
      this.leftHandSprite.scale.set(0.4, 0.4, 0.4);
      this.leftHandSprite.renderOrder = 999;
      camera.add(this.leftHandSprite);
    }

    // Create magic ambient lights for hands
    this.createHandLights();

    this.updateHandPositions();
    this.updateHeartPositions();
  }

  private updateRightHandTexture(): void {
    const textureName = this.availableHands[this.currentHandIndex];
    const texture = this.textures.get(textureName);

    if (!texture) return;

    // Prevent edge bleeding artifacts
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.premultiplyAlpha = false;

    if (!this.rightHandSprite) {
      const rightMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        alphaTest: 0.5,
      });
      this.rightHandSprite = new THREE.Sprite(rightMaterial);
      this.rightHandSprite.scale.set(0.4, 0.4, 0.4);
      this.rightHandSprite.renderOrder = 999;
      this.camera.add(this.rightHandSprite);
    } else {
      this.rightHandSprite.material.map = texture;
      this.rightHandSprite.material.needsUpdate = true;
    }
  }

  public cycleHand(direction: number): void {
    if (direction > 0) {
      this.currentHandIndex = (this.currentHandIndex + 1) % this.availableHands.length;
    } else {
      this.currentHandIndex = (this.currentHandIndex - 1 + this.availableHands.length) % this.availableHands.length;
    }
    this.updateRightHandTexture();
    
    // Reset bob phase to sync animation with switch
    this.bobPhase = 0;

    // Show indicator
    const indicator = document.getElementById('hand-indicator');
    if (indicator) {
      const handName = this.availableHands[this.currentHandIndex].replace('hand-', '').replace('hand', 'Mage Hand').toUpperCase();
      indicator.textContent = handName;
      indicator.classList.add('visible');
      
      if (this.handIndicatorTimeout) {
        window.clearTimeout(this.handIndicatorTimeout);
      }
      
      this.handIndicatorTimeout = window.setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    }
  }

  private createHandLights(): void {
    // Left hand - blue/cyan magic glow
    this.leftHandLight = new THREE.PointLight(0x4488ff, 0.6, 3);
    this.leftHandLight.position.set(-0.3, -0.1, -0.4);
    this.camera.add(this.leftHandLight);

    // Right hand - orange/fire magic glow
    this.rightHandLight = new THREE.PointLight(0xff8844, 0.6, 3);
    this.rightHandLight.position.set(0.3, -0.1, -0.4);
    this.camera.add(this.rightHandLight);
  }

  private createHeartSprites(): void {
    if (!this.heartTexture) {
      console.warn('Heart texture not loaded, health display unavailable');
      return;
    }

    // Configure base texture
    this.heartTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.heartTexture.wrapT = THREE.ClampToEdgeWrapping;

    // Create one sprite per heart (each heart = 2 HP for half-heart support)
    const heartCount = Math.ceil(this.maxHealth / 2);
    for (let i = 0; i < heartCount; i++) {
      // Clone texture for each sprite so we can independently modify UV for half-hearts
      const clonedTexture = this.heartTexture.clone();
      clonedTexture.wrapS = THREE.ClampToEdgeWrapping;
      clonedTexture.wrapT = THREE.ClampToEdgeWrapping;

      const material = new THREE.SpriteMaterial({
        map: clonedTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(0.06, 0.06, 0.06);
      sprite.renderOrder = 1000;
      this.camera.add(sprite);
      this.heartSprites.push(sprite);
    }
    console.log(`Created ${heartCount} heart sprites for health display (half-heart support enabled)`);
  }

  private updateHeartPositions(): void {
    const heartSize = 0.06;
    const heartSpacing = 0.07;
    const startX = -0.35; // Top-left of screen
    const startY = 0.28;

    // Calculate full and half hearts based on health (each heart = 2 HP)
    const fullHearts = Math.floor(this.currentHealth / 2);
    const hasHalfHeart = this.currentHealth % 2 === 1;

    for (let i = 0; i < this.heartSprites.length; i++) {
      const sprite = this.heartSprites[i];
      const material = sprite.material as THREE.SpriteMaterial;
      const texture = material.map;

      if (i < fullHearts) {
        // Full heart - show complete texture
        sprite.visible = true;
        sprite.scale.set(heartSize, heartSize, heartSize);
        sprite.position.set(startX + i * heartSpacing, startY, -0.5);
        if (texture) {
          texture.offset.set(0, 0);
          texture.repeat.set(1, 1);
        }
      } else if (i === fullHearts && hasHalfHeart) {
        // Half heart - cull right half by showing only left portion of texture
        sprite.visible = true;
        // Scale width to half to show only half the heart
        sprite.scale.set(heartSize / 2, heartSize, heartSize);
        // Offset position to align with where full heart left edge would be
        sprite.position.set(startX + i * heartSpacing - heartSize / 4, startY, -0.5);
        if (texture) {
          // Show only left half of texture
          texture.offset.set(0, 0);
          texture.repeat.set(0.5, 1);
        }
      } else {
        // Empty heart slot - hide sprite
        sprite.visible = false;
      }
    }
  }

  updateHealth(health: number, maxHealth: number): void {
    this.currentHealth = health;
    this.maxHealth = maxHealth;
    this.updateHeartPositions();
  }

  private updateHandPositions(): void {
    // Idle bob animation (slightly offset between hands)
    const bobRight = Math.sin(this.bobPhase) * 0.01;
    const bobLeft = Math.sin(this.bobPhase + 0.5) * 0.01;

    // Right hand - lower right of view
    if (this.rightHandSprite) {
      const rightCastOffset = this.rightCastTimer > 0
        ? Math.sin((this.rightCastTimer / this.castDuration) * Math.PI) * 0.08
        : 0;
      const offsetX = 0.25 - rightCastOffset * 0.3;
      const offsetY = -0.2 + rightCastOffset + bobRight;
      this.rightHandSprite.position.set(offsetX, offsetY, -0.5);
    }

    // Left hand - lower left of view (mirrored)
    if (this.leftHandSprite) {
      const leftCastOffset = this.leftCastTimer > 0
        ? Math.sin((this.leftCastTimer / this.castDuration) * Math.PI) * 0.08
        : 0;
      const offsetX = -0.25 + leftCastOffset * 0.3;
      const offsetY = -0.2 + leftCastOffset + bobLeft;
      this.leftHandSprite.position.set(offsetX, offsetY, -0.5);
    }
  }

  triggerCast(hand: 'left' | 'right'): void {
    if (hand === 'left') {
      this.leftCastTimer = this.castDuration;
    } else {
      this.rightCastTimer = this.castDuration;
    }
  }

  update(dt: number): void {
    // Update cast timers
    if (this.leftCastTimer > 0) {
      this.leftCastTimer -= dt;
      if (this.leftCastTimer < 0) this.leftCastTimer = 0;
    }
    if (this.rightCastTimer > 0) {
      this.rightCastTimer -= dt;
      if (this.rightCastTimer < 0) this.rightCastTimer = 0;
    }

    // Update bob phase
    this.bobPhase += dt * 3;

    // Update magic pulse phase for ambient hand glow
    this.magicPulsePhase += dt * 4;

    // Update hand light intensities with pulsing effect
    this.updateHandLights();

    this.updateHandPositions();
  }

  private updateHandLights(): void {
    // Base pulse intensity (subtle ambient glow)
    const basePulse = 0.4 + Math.sin(this.magicPulsePhase) * 0.15;
    
    // Left hand light - boost during casting
    if (this.leftHandLight) {
      const castBoost = this.leftCastTimer > 0 
        ? Math.sin((this.leftCastTimer / this.castDuration) * Math.PI) * 1.5 
        : 0;
      this.leftHandLight.intensity = basePulse + castBoost;
      
      // Update position to follow hand sprite
      if (this.leftHandSprite) {
        this.leftHandLight.position.copy(this.leftHandSprite.position);
        this.leftHandLight.position.z += 0.1; // Slightly in front of hand
      }
    }

    // Right hand light - boost during casting  
    if (this.rightHandLight) {
      const castBoost = this.rightCastTimer > 0 
        ? Math.sin((this.rightCastTimer / this.castDuration) * Math.PI) * 1.5 
        : 0;
      this.rightHandLight.intensity = basePulse + castBoost;
      
      // Update position to follow hand sprite
      if (this.rightHandSprite) {
        this.rightHandLight.position.copy(this.rightHandSprite.position);
        this.rightHandLight.position.z += 0.1; // Slightly in front of hand
      }
    }
  }
}

// ============================================================================
// MAIN GAME CLASS
// ============================================================================

export class Game {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private dungeon2Scene!: THREE.Scene;
  private textures!: TextureManager;
  private player!: PlayerController;
  private worldBuilder!: WorldBuilder;
  private dungeon2Builder!: Dungeon2Builder;
  private enemyManager!: EnemyManager;
  private projectileManager!: ProjectileManager;
  private hudManager!: HUDManager;
  private coinManager!: CoinManager;
  private inventoryManager!: InventoryManager;
  private clock = new THREE.Clock();
  private currentScene: SceneType = 'dungeon';

  constructor() {
    console.log('Game constructor started');
    
    // Get canvas
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }
    console.log('Canvas found:', canvas.width, canvas.height);

    // Create renderer with advanced settings
    this.renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(CONFIG.SCREEN_WIDTH, CONFIG.SCREEN_HEIGHT);
    this.renderer.setPixelRatio(CONFIG.PIXEL_RATIO);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    console.log('Renderer created');

    // Create scene
    this.scene = new THREE.Scene();
    
    // Create fog for atmosphere
    this.scene.fog = new THREE.FogExp2(0x111122, 0.08);

    // Initialize managers
    this.textures = new TextureManager();
    this.player = new PlayerController(canvas);
    
    // Add camera to scene
    this.scene.add(this.player.camera);
    console.log('Player created at', this.player.position);

    // Setup mouse click for firing
    document.addEventListener('mousedown', (e) => {
      if (!this.player.isActive()) return;
      
      if (e.button === 0) {
        this.fireProjectile('left');
      } else if (e.button === 2) {
        this.fireProjectile('right');
      }
    });

    // Mouse wheel for hand cycling
    document.addEventListener('wheel', (e) => {
      if (!this.player.isActive()) return;
      
      if (this.hudManager) {
        // Normalize deltaY to direction (-1 or 1)
        const direction = e.deltaY > 0 ? 1 : -1;
        this.hudManager.cycleHand(direction);
      }
    });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Start loading and initialize
    this.init();
  }

  private async init(): Promise<void> {
    console.log('Initializing game...');

    try {
      // Load all textures
      await this.textures.loadAll();

      // Set dungeon skybox or fallback color
      if (this.textures.skybox) {
        this.scene.background = this.textures.skybox;
      } else {
        this.scene.background = new THREE.Color(0x111122);
      }

      // Build dungeon world
      this.worldBuilder = new WorldBuilder(this.scene, this.textures);
      this.worldBuilder.build();
      console.log('Dungeon world built');

      // Create dungeon2 scene
      this.dungeon2Scene = new THREE.Scene();
      if (this.textures.dungeon2Skybox) {
        this.dungeon2Scene.background = this.textures.dungeon2Skybox;
      } else {
        this.dungeon2Scene.background = new THREE.Color(0x111122);
      }
      // Dark fog for dungeon2 atmosphere
      this.dungeon2Scene.fog = new THREE.FogExp2(0x110022, 0.1);

      // Build dungeon2
      this.dungeon2Builder = new Dungeon2Builder(this.dungeon2Scene, this.textures);
      this.dungeon2Builder.build();
      console.log('Dungeon2 built');

      // Create managers (for dungeon scene)
      this.enemyManager = new EnemyManager(this.scene, this.textures, this.player.camera);
      this.enemyManager.setPlayer(this.player);
      this.projectileManager = new ProjectileManager(this.scene, this.enemyManager);
      this.hudManager = new HUDManager(this.scene, this.player.camera, this.textures);
      
      // Initialize Inventory
      this.inventoryManager = new InventoryManager();
      document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'i') {
          this.inventoryManager.toggleVisibility();
        }
      });

      // Create coin manager and spawn coins
      this.coinManager = new CoinManager(this.scene, this.textures, this.inventoryManager);
      this.coinManager.setCollectionCallback((total) => {
        // Gold is now handled by inventory
        console.log('Gold collected');
      });
      this.spawnDungeonCoins();

      // Connect player health to HUD
      this.player.setHealthChangeCallback((health, maxHealth) => {
        this.hudManager.updateHealth(health, maxHealth);
      });

      // Set up door transition callback
      this.player.setDoorCallback((targetScene: SceneType) => {
        this.transitionToScene(targetScene);
      });

      console.log('Managers created');

      // Start game loop
      console.log('Starting game loop');
      this.animate();
    } catch (error) {
      console.error('Error during initialization:', error);
      // Still try to start animate loop for debugging
      this.scene.background = new THREE.Color(0xff0000); // Red background for error
      this.animate();
    }
  }

  private transitionToScene(targetScene: SceneType): void {
    if (this.currentScene === targetScene) return;

    console.log(`Transitioning from ${this.currentScene} to ${targetScene}`);

    // Remove camera from old scene
    const activeScene = this.currentScene === 'dungeon' ? this.scene : this.dungeon2Scene;
    activeScene.remove(this.player.camera);

    // Update current scene
    this.currentScene = targetScene;
    this.player.setScene(targetScene);

    // Add camera to new scene
    const newScene = targetScene === 'dungeon' ? this.scene : this.dungeon2Scene;
    newScene.add(this.player.camera);

    // Teleport player to appropriate spawn point
    if (targetScene === 'dungeon2') {
      // Spawn near the door in dungeon2, facing north (into the room)
      this.player.teleportTo(
        5.5, // x position near door
        9.0, // z position (north of door)
        0    // Face north
      );
    } else {
      // Spawn near the door in dungeon, facing into the dungeon
      this.player.teleportTo(7.5, 2.5, Math.PI); // Face south into dungeon
    }

    console.log(`Now in ${targetScene} scene`);
  }

  private fireProjectile(hand: 'left' | 'right'): void {
    const dir = this.player.getDirection();
    this.projectileManager.fire(this.player.position.clone(), dir, hand);
    this.hudManager.triggerCast(hand);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const dt = this.clock.getDelta();

    // Update systems
    this.player?.update(dt);
    this.player?.updateTimers(dt);
    this.player?.checkDoorProximity();

    // Only update dungeon-specific managers when in dungeon
    if (this.currentScene === 'dungeon') {
      this.enemyManager?.update(dt, this.player?.position);
      this.projectileManager?.update(dt);
      this.coinManager?.update(dt, this.player?.position);
    }

    this.hudManager?.update(dt);

    // Update sprint status indicator
    this.updateSprintStatus();

    // Update torch position in current scene
    const activeScene = this.currentScene === 'dungeon' ? this.scene : this.dungeon2Scene;
    const torch = activeScene?.getObjectByName('playerTorch') as THREE.PointLight;
    if (torch && this.player) {
      torch.position.copy(this.player.position);
      torch.position.y += 0.3;
    }

    // Render current scene
    if (this.renderer && this.player?.camera) {
      this.renderer.render(activeScene, this.player.camera);
    }
  };

  private updateSprintStatus(): void {
    const statusEl = document.getElementById('status-indicator');
    const cooldownBar = document.getElementById('dash-cooldown');
    const cooldownFill = document.getElementById('dash-cooldown-fill');
    
    if (!this.player) return;

    const isDashing = this.player.getIsDashing();
    const cooldownPercent = this.player.getDashCooldownPercent();
    const isReady = cooldownPercent <= 0;
    
    // Update status text
    if (statusEl) {
      if (isDashing) {
        statusEl.textContent = 'DASH!';
        statusEl.className = 'sprinting';
      } else if (!isReady) {
        statusEl.textContent = 'DASH';
        statusEl.className = 'exploring';
      } else {
        statusEl.textContent = 'DASH READY';
        statusEl.className = 'sprinting';
      }
    }
    
    // Update cooldown bar at crosshair
    if (cooldownBar && cooldownFill) {
      // Show bar when on cooldown or briefly when ready
      if (!isReady || isDashing) {
        cooldownBar.classList.add('visible');
        cooldownBar.classList.remove('ready');
        // Fill from 0% to 100% as cooldown completes
        const fillPercent = (1 - cooldownPercent) * 100;
        cooldownFill.style.width = `${fillPercent}%`;
      } else {
        // Fully ready - show green briefly then hide
        cooldownBar.classList.add('ready');
        cooldownFill.style.width = '100%';
        // Hide after a moment
        setTimeout(() => {
          if (this.player && this.player.getDashCooldownPercent() <= 0) {
            cooldownBar.classList.remove('visible');
          }
        }, 300);
      }
    }
  }

  private spawnDungeonCoins(): void {
    // Spawn coins at predefined positions in the dungeon
    const coinPositions = [
      { x: 3.5, z: 3.5 },
      { x: 6.5, z: 2.5 },
      { x: 2.5, z: 6.5 },
      { x: 7.5, z: 7.5 },
      { x: 5.5, z: 5.5 },
    ];
    this.coinManager.spawnCoinsInRoom(coinPositions);
    console.log(`Spawned ${coinPositions.length} coins in dungeon`);
  }
}
