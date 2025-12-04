/**
 * Retro Dungeon Engine - Three.js Version
 * Implements a first-person dungeon crawler using Three.js
 */

import * as THREE from 'three';

// --- Constants ---
const MOVE_SPEED = 5.0;
const MOUSE_SENSITIVITY = 0.002;
const TEX_WIDTH = 64;
const TEX_HEIGHT = 64;




// --- World Data ---
// 0 = empty, 1 = stone wall, 2 = brick wall, 3 = wood
const MAP_SIZE = 16;
const WORLD_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

interface Sprite {
  x: number;
  y: number;
  textureId: number;
}

const SPRITES: Sprite[] = [
  { x: 10.5, y: 10.5, textureId: 0 }, // Green Slime
  { x: 7.5, y: 7.5, textureId: 1 },   // Red Orb
  { x: 12.5, y: 3.5, textureId: 0 },  // Green Slime
];

// --- Texture Generation ---
// Generates procedural textures as canvas elements for Three.js
function createTextureCanvas(width: number, height: number, fillFn: (x: number, y: number) => string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = fillFn(x, y);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function generateWallTextures(): THREE.CanvasTexture[] {
  const textures: THREE.CanvasTexture[] = [];
  
  // 0: Stone (Grey noise with borders)
  textures.push(createTextureCanvas(TEX_WIDTH, TEX_HEIGHT, (x, y) => {
    if (x === 0 || y === 0 || x === TEX_WIDTH - 1 || y === TEX_HEIGHT - 1) {
      return '#444444';
    }
    const shade = Math.floor(100 + Math.random() * 50);
    return `rgb(${shade}, ${shade}, ${shade})`;
  }));
  
  // 1: Brick (Red/Brown pattern)
  textures.push(createTextureCanvas(TEX_WIDTH, TEX_HEIGHT, (x, y) => {
    const mortar = (y % 16 < 2) || ((Math.floor(y / 16) % 2 === 0 ? x : x + 32) % 64 < 2);
    if (mortar) {
      return '#cccccc';
    }
    const shade = Math.floor(80 + Math.random() * 40);
    return `rgb(${shade + 40}, 40, 40)`;
  }));
  
  // 2: Wood
  textures.push(createTextureCanvas(TEX_WIDTH, TEX_HEIGHT, (x, y) => {
    const shade = Math.floor(60 + Math.random() * 40);
    const grain = ((x + y * TEX_WIDTH) % 7 === 0) ? 20 : 0;
    const r = shade + 40 - grain;
    const g = shade - grain;
    const b = 20;
    return `rgb(${r}, ${g}, ${b})`;
  }));
  
  return textures;
}

function generateSpriteTextures(): THREE.CanvasTexture[] {
  const textures: THREE.CanvasTexture[] = [];
  
  // 0: Green Slime
  textures.push(createTextureCanvas(TEX_WIDTH, TEX_HEIGHT, (x, y) => {
    const dx = x - 32;
    const dy = y - 32;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 25) {
      const intensity = 1 - (dist / 25);
      const g = Math.floor(100 + intensity * 155);
      
      // Eyes
      if ((Math.abs(dx - 8) < 4 || Math.abs(dx + 8) < 4) && Math.abs(dy + 5) < 4) {
        return '#000000';
      }
      return `rgb(20, ${g}, 20)`;
    }
    return 'rgba(0, 0, 0, 0)';
  }));
  
  // 1: Red Orb
  textures.push(createTextureCanvas(TEX_WIDTH, TEX_HEIGHT, (x, y) => {
    const dx = x - 32;
    const dy = y - 32;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 10) {
      return '#ff0000';
    } else if (dist < 20) {
      return 'rgba(136, 0, 0, 0.5)';
    }
    return 'rgba(0, 0, 0, 0)';
  }));
  
  return textures;
}


// --- Three.js Game Engine ---
class Game {
  // Three.js components
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  
  // Game state
  posX = 3.5;
  posY = 3.5;
  yaw = Math.PI; // Facing -X direction (dirX=-1, dirY=0)
  pitch = 0;
  
  // Input state
  keys: {[key: string]: boolean} = {};
  lastTime = 0;
  running = false;
  
  // Sprites
  spriteMeshes: THREE.Sprite[] = [];
  
  constructor() {
    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    
    // Setup camera (first-person)
    this.camera = new THREE.PerspectiveCamera(
      60, // FOV
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(this.posX, 0.5, this.posY); // Y=0.5 is eye height
    
    // Setup renderer
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: false 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1); // Keep it pixelated
    
    // Generate textures
    const wallTextures = generateWallTextures();
    const spriteTextures = generateSpriteTextures();
    
    // Build the world
    this.buildWorld(wallTextures);
    
    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x222222,
      side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(MAP_SIZE / 2, 0, MAP_SIZE / 2);
    this.scene.add(floor);
    
    // Add ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
    const ceilingMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x443333,
      side: THREE.DoubleSide 
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(MAP_SIZE / 2, 1, MAP_SIZE / 2);
    this.scene.add(ceiling);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);
    
    // Add sprites
    this.addSprites(spriteTextures);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Bind Inputs
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    
    // Pointer Lock
    const overlay = document.getElementById('overlay');
    overlay?.addEventListener('click', () => {
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === canvas) {
        this.running = true;
        overlay?.classList.add('hidden');
      } else {
        this.running = false;
        overlay?.classList.remove('hidden');
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.running) return;
      this.handleMouseLook(e.movementX, e.movementY);
    });

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }
  
  buildWorld(textures: THREE.CanvasTexture[]) {
    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        const cellType = WORLD_MAP[x][y];
        if (cellType > 0) {
          // Create a wall block
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshBasicMaterial({ 
            map: textures[(cellType - 1) % textures.length]
          });
          const wall = new THREE.Mesh(geometry, material);
          wall.position.set(x + 0.5, 0.5, y + 0.5);
          this.scene.add(wall);
        }
      }
    }
  }
  
  addSprites(textures: THREE.CanvasTexture[]) {
    for (const sprite of SPRITES) {
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: textures[sprite.textureId % textures.length],
        transparent: true
      });
      const spriteMesh = new THREE.Sprite(spriteMaterial);
      spriteMesh.position.set(sprite.x, 0.5, sprite.y);
      spriteMesh.scale.set(1, 1, 1);
      this.scene.add(spriteMesh);
      this.spriteMeshes.push(spriteMesh);
    }
  }

  handleMouseLook(dx: number, dy: number) {
    // Yaw (left/right)
    this.yaw -= dx * MOUSE_SENSITIVITY;
    
    // Pitch (up/down) - Clamp to avoid flipping
    this.pitch -= dy * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    
    // Update camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  update(dt: number) {
    if (!this.running) return;

    const moveSpeed = MOVE_SPEED * dt;
    
    // Calculate movement direction based on yaw
    const dirX = -Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    
    // Movement vector
    let mx = 0;
    let mz = 0;

    if (this.keys['KeyW']) {
      mx += dirX;
      mz += dirZ;
    }
    if (this.keys['KeyS']) {
      mx -= dirX;
      mz -= dirZ;
    }
    if (this.keys['KeyA']) {
      // Strafe left
      mx -= dirZ;
      mz += dirX;
    }
    if (this.keys['KeyD']) {
      // Strafe right
      mx += dirZ;
      mz -= dirX;
    }

    // Normalize diagonal movement
    if (mx !== 0 || mz !== 0) {
      const len = Math.sqrt(mx * mx + mz * mz);
      mx /= len;
      mz /= len;
      
      const newX = this.posX + mx * moveSpeed;
      const newZ = this.posY + mz * moveSpeed;
      
      // Wall collision (check if the new position is walkable)
      if (WORLD_MAP[Math.floor(newX)][Math.floor(this.posY)] === 0) {
        this.posX = newX;
      }
      if (WORLD_MAP[Math.floor(this.posX)][Math.floor(newZ)] === 0) {
        this.posY = newZ;
      }
      
      // Update camera position
      this.camera.position.set(this.posX, 0.5, this.posY);
    }
    
    // Make sprites always face the camera
    for (const sprite of this.spriteMeshes) {
      sprite.lookAt(this.camera.position);
    }
  }

  loop = (timestamp: number) => {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    
    requestAnimationFrame(this.loop);
  }
}

// Start the game
window.onload = () => {
  new Game();
};