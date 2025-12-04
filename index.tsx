/**
 * Retro Dungeon Raycaster Engine
 * Implements a DDA-based raycasting engine with textured walls and billboard sprites.
 */

// --- Constants ---
const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 360;
const TEX_WIDTH = 64;
const TEX_HEIGHT = 64;
const FOV = 0.66; // Field of View (tan(60/2) approx)
const MOVE_SPEED = 5.0;
const ROT_SPEED = 3.0;
const MOUSE_SENSITIVITY = 0.002;

// --- Math Types ---
class Vec2 {
  constructor(public x: number, public y: number) {}
  add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number) { return new Vec2(this.x * s, this.y * s); }
  rot(angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
}

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
  { x: 7.5, y: 7.5, textureId: 1 },   // Red Pillar
  { x: 12.5, y: 3.5, textureId: 0 },  // Green Slime
];

// --- Texture Generation ---
// Generates simple procedural pixel textures
const textures: Uint32Array[] = [];

function generateTextures() {
  // 0: Stone (Grey noise with borders)
  const stone = new Uint32Array(TEX_WIDTH * TEX_HEIGHT);
  for (let i = 0; i < TEX_WIDTH * TEX_HEIGHT; i++) {
    const x = i % TEX_WIDTH;
    const y = Math.floor(i / TEX_WIDTH);
    // Border
    if (x === 0 || y === 0 || x === TEX_WIDTH - 1 || y === TEX_HEIGHT - 1) {
      stone[i] = 0xFF444444; 
    } else {
      // Noise
      const shade = 100 + Math.random() * 50;
      stone[i] = (255 << 24) | (shade << 16) | (shade << 8) | shade; // ABGR
    }
  }
  textures.push(stone); // World ID 1 maps to this (index 0)

  // 1: Brick (Red/Brown pattern)
  const brick = new Uint32Array(TEX_WIDTH * TEX_HEIGHT);
  for (let i = 0; i < TEX_WIDTH * TEX_HEIGHT; i++) {
    const x = i % TEX_WIDTH;
    const y = Math.floor(i / TEX_WIDTH);
    // Brick mortar
    const mortar = (y % 16 < 2) || ((Math.floor(y / 16) % 2 === 0 ? x : x + 32) % 64 < 2);
    if (mortar) {
      brick[i] = 0xFFCCCCCC;
    } else {
      const shade = 80 + Math.random() * 40;
      brick[i] = (255 << 24) | (40 << 16) | (40 << 8) | (shade + 40); // ABGR (Little Endian: A B G R)
    }
  }
  textures.push(brick); // World ID 2

  // 2: Wood
  const wood = new Uint32Array(TEX_WIDTH * TEX_HEIGHT);
  for (let i = 0; i < TEX_WIDTH * TEX_HEIGHT; i++) {
     const shade = 60 + Math.random() * 40;
     // Simple vertical grain
     const grain = (i % 7 === 0) ? 20 : 0;
     const r = shade + 40 - grain;
     const g = shade - grain;
     const b = 20;
     wood[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  textures.push(wood); // World ID 3
}

const spriteTextures: Uint32Array[] = [];
function generateSpriteTextures() {
  // 0: Green Slime
  const slime = new Uint32Array(TEX_WIDTH * TEX_HEIGHT);
  for (let y = 0; y < TEX_HEIGHT; y++) {
    for (let x = 0; x < TEX_WIDTH; x++) {
      const dx = x - 32;
      const dy = y - 32;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 25) {
        // Shading
        const intensity = 1 - (dist / 25);
        const g = Math.floor(100 + intensity * 155);
        // Eyes
        let isEye = false;
        if ((Math.abs(dx - 8) < 4 || Math.abs(dx + 8) < 4) && Math.abs(dy + 5) < 4) isEye = true;
        
        if (isEye) {
            slime[y * TEX_WIDTH + x] = 0xFF000000;
        } else {
            slime[y * TEX_WIDTH + x] = (255 << 24) | (20 << 16) | (g << 8) | 20;
        }
      } else {
        slime[y * TEX_WIDTH + x] = 0x00000000; // Transparent
      }
    }
  }
  spriteTextures.push(slime);

  // 1: Red Orb/Pillar thing
  const orb = new Uint32Array(TEX_WIDTH * TEX_HEIGHT);
  for (let y = 0; y < TEX_HEIGHT; y++) {
    for (let x = 0; x < TEX_WIDTH; x++) {
       const dx = x - 32;
       const dy = y - 32;
       const dist = Math.sqrt(dx*dx + dy*dy);
       if (dist < 10) {
         orb[y * TEX_WIDTH + x] = 0xFF0000FF; // Red center
       } else if (dist < 20) {
         orb[y * TEX_WIDTH + x] = 0x88000088; // Darker red aura
       } else {
         orb[y * TEX_WIDTH + x] = 0x00000000;
       }
    }
  }
  spriteTextures.push(orb);
}

// --- Engine Core ---

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pixels: Uint32Array;
  
  // Player state
  posX = 3.5;
  posY = 3.5;
  dirX = -1;
  dirY = 0;
  planeX = 0;
  planeY = 0.66; // FOV
  
  // Look state
  pitch = 0; // Look up/down offset

  // Input state
  keys: {[key: string]: boolean} = {};
  lastTime = 0;
  running = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    
    // Create pixel buffer for direct manipulation
    const imgData = this.ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    // Use a view for 32-bit manipulation
    this.pixels = new Uint32Array(imgData.data.buffer);

    // Initialize Textures
    generateTextures();
    generateSpriteTextures();

    // Bind Inputs
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    
    // Pointer Lock
    const overlay = document.getElementById('overlay');
    overlay?.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.canvas) {
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

  handleMouseLook(dx: number, dy: number) {
    // Rotate Player (Yaw)
    // Invert dx to match standard FPS controls (Mouse Right -> Turn Right)
    const rotSpeed = -dx * MOUSE_SENSITIVITY;
    
    const oldDirX = this.dirX;
    this.dirX = this.dirX * Math.cos(rotSpeed) - this.dirY * Math.sin(rotSpeed);
    this.dirY = oldDirX * Math.sin(rotSpeed) + this.dirY * Math.cos(rotSpeed);
    const oldPlaneX = this.planeX;
    this.planeX = this.planeX * Math.cos(rotSpeed) - this.planeY * Math.sin(rotSpeed);
    this.planeY = oldPlaneX * Math.sin(rotSpeed) + this.planeY * Math.cos(rotSpeed);

    // Pitch (Look Up/Down) - Clamp to avoid flipping
    // Standard FPS: Mouse Down (dy > 0) -> Look Down (Pitch < 0 -> Horizon Up)
    this.pitch -= dy * 2; 
    if (this.pitch > 200) this.pitch = 200;
    if (this.pitch < -200) this.pitch = -200;
  }

  update(dt: number) {
    if (!this.running) return;

    const moveSpeed = MOVE_SPEED * dt;
    
    // Movement vector
    let mx = 0;
    let my = 0;

    if (this.keys['KeyW']) {
      mx += this.dirX;
      my += this.dirY;
    }
    if (this.keys['KeyS']) {
      mx -= this.dirX;
      my -= this.dirY;
    }
    if (this.keys['KeyA']) {
      // Strafe Left (Swapped logic from original KeyD)
      // Original KeyA (mx+=dirY, my-=dirX) was strafing right.
      mx -= this.dirY;
      my += this.dirX;
    }
    if (this.keys['KeyD']) {
      // Strafe Right (Swapped logic from original KeyA)
      mx += this.dirY;
      my -= this.dirX;
    }

    // Normalize diagonal movement
    if (mx !== 0 || my !== 0) {
        const len = Math.sqrt(mx*mx + my*my);
        mx /= len;
        my /= len;
        
        // Wall Collision
        // Check X axis independently
        if (WORLD_MAP[Math.floor(this.posX + mx * moveSpeed)][Math.floor(this.posY)] === 0) {
            this.posX += mx * moveSpeed;
        }
        // Check Y axis independently
        if (WORLD_MAP[Math.floor(this.posX)][Math.floor(this.posY + my * moveSpeed)] === 0) {
            this.posY += my * moveSpeed;
        }
    }
  }

  draw() {
    // Clear buffer with ceiling and floor
    // We can do a gradient or solid color. Let's do solid for performance/style.
    const floorColor = 0xFF222222; // ABGR: 0x222222 (Dark Grey)
    const ceilingColor = 0xFF443333; // ABGR: 0x333344 (Dark Blue-ish)

    // Optimization: Fill arrays directly
    // Since we have pitch, the horizon moves. 
    // We can't just fill half/half efficiently without calculating the horizon line per column, 
    // but clearing the whole buffer is fast enough for this resolution.
    this.pixels.fill(ceilingColor);
    
    // Draw floor (lower half roughly, adjusted by pitch)
    const horizon = SCREEN_HEIGHT / 2 + this.pitch;
    // Simple fill for floor below horizon if visible
    if (horizon < SCREEN_HEIGHT) {
        // This is a naive fill, proper floor casting is expensive in JS without WebGL.
        // We'll just fill the bottom part of the screen buffer manually or via fillRect if using context, 
        // but since we are manipulating pixels:
        const startIndex = Math.max(0, Math.floor(horizon)) * SCREEN_WIDTH;
        for(let i=startIndex; i<this.pixels.length; i++) {
            this.pixels[i] = floorColor;
        }
    }

    const zBuffer = new Float64Array(SCREEN_WIDTH);

    // --- Wall Casting ---
    for (let x = 0; x < SCREEN_WIDTH; x++) {
      // Calculate ray position and direction
      const cameraX = 2 * x / SCREEN_WIDTH - 1; // x-coordinate in camera space
      const rayDirX = this.dirX + this.planeX * cameraX;
      const rayDirY = this.dirY + this.planeY * cameraX;

      // Which box of the map we're in
      let mapX = Math.floor(this.posX);
      let mapY = Math.floor(this.posY);

      // Length of ray from current position to next x or y-side
      let sideDistX;
      let sideDistY;

      // Length of ray from one x or y-side to next x or y-side
      const deltaDistX = Math.abs(1 / rayDirX);
      const deltaDistY = Math.abs(1 / rayDirY);
      let perpWallDist;

      // Step direction
      let stepX;
      let stepY;

      let hit = 0; // Was there a wall hit?
      let side = 0; // NS or EW wall hit?

      // Calculate step and initial sideDist
      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (this.posX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - this.posX) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (this.posY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - this.posY) * deltaDistY;
      }

      // Perform DDA
      while (hit === 0) {
        // Jump to next map square
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        // Check if ray has hit a wall
        if (WORLD_MAP[mapX][mapY] > 0) hit = 1;
      }

      // Calculate distance projected on camera direction (Euclidean distance will give fisheye effect!)
      if (side === 0) perpWallDist = (mapX - this.posX + (1 - stepX) / 2) / rayDirX;
      else           perpWallDist = (mapY - this.posY + (1 - stepY) / 2) / rayDirY;

      zBuffer[x] = perpWallDist;

      // Calculate height of line to draw on screen
      const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);

      // Calculate lowest and highest pixel to fill in current stripe
      // Add pitch to drawStart/End to look up/down
      let drawStart = -lineHeight / 2 + SCREEN_HEIGHT / 2 + this.pitch;
      let drawEnd = lineHeight / 2 + SCREEN_HEIGHT / 2 + this.pitch;

      // Texturing
      const texNum = WORLD_MAP[mapX][mapY] - 1; // 1-based in map, 0-based in array
      
      // Calculate value of wallX
      let wallX; 
      if (side === 0) wallX = this.posY + perpWallDist * rayDirY;
      else           wallX = this.posX + perpWallDist * rayDirX;
      wallX -= Math.floor(wallX);

      // x coordinate on the texture
      let texX = Math.floor(wallX * TEX_WIDTH);
      if(side === 0 && rayDirX > 0) texX = TEX_WIDTH - texX - 1;
      if(side === 1 && rayDirY < 0) texX = TEX_WIDTH - texX - 1;

      // Draw the vertical strip
      // Clamp draw range to screen
      const yStart = Math.max(0, Math.floor(drawStart));
      const yEnd = Math.min(SCREEN_HEIGHT - 1, Math.floor(drawEnd));

      // Perspective correct texture mapping loop
      const step = 1.0 * TEX_HEIGHT / lineHeight;
      let texPos = (yStart - this.pitch - SCREEN_HEIGHT / 2 + lineHeight / 2) * step;

      const texture = textures[texNum % textures.length];

      for (let y = yStart; y < yEnd; y++) {
        const texY = Math.floor(texPos) & (TEX_HEIGHT - 1);
        texPos += step;
        let color = texture[TEX_WIDTH * texY + texX];
        
        // Simple lighting: make side 1 darker
        if (side === 1) {
            // Darken by shifting or masking. ABGR format.
            // (color >> 1) & 0x7F7F7F7F prevents overflow but messes alpha.
            // Just hacking a darker shade:
            const r = (color & 0xFF) >> 1;
            const g = ((color >> 8) & 0xFF) >> 1;
            const b = ((color >> 16) & 0xFF) >> 1;
            color = (255 << 24) | (b << 16) | (g << 8) | r; 
        }
        
        this.pixels[y * SCREEN_WIDTH + x] = color;
      }
    }

    // --- Sprite Casting ---
    // 1. Sort sprites by distance
    const spriteOrder = SPRITES.map((sprite, i) => {
      const dist = ((this.posX - sprite.x) * (this.posX - sprite.x) + (this.posY - sprite.y) * (this.posY - sprite.y));
      return { index: i, dist: dist };
    }).sort((a, b) => b.dist - a.dist);

    // 2. Project and Draw
    for (const item of spriteOrder) {
      const sprite = SPRITES[item.index];
      const spriteX = sprite.x - this.posX;
      const spriteY = sprite.y - this.posY;

      // Transform sprite with the inverse camera matrix
      // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
      // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
      // [ planeY   dirY ]                                          [ -planeY  planeX ]

      const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
      
      const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
      const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY); // Depth inside screen

      if (transformY <= 0) continue; // Behind player

      const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));

      // Calculate height of the sprite on screen
      // Using 'transformY' instead of real distance prevents fisheye
      const spriteHeight = Math.abs(Math.floor(SCREEN_HEIGHT / transformY)); 
      
      // Calculate width of the sprite
      const spriteWidth = Math.abs(Math.floor(SCREEN_HEIGHT / transformY));

      // Calculate drawing bounds
      let drawStartY = -spriteHeight / 2 + SCREEN_HEIGHT / 2 + this.pitch;
      let drawEndY = spriteHeight / 2 + SCREEN_HEIGHT / 2 + this.pitch;
      let drawStartX = -spriteWidth / 2 + spriteScreenX;
      let drawEndX = spriteWidth / 2 + spriteScreenX;

      // Draw the sprite
      const tex = spriteTextures[sprite.textureId % spriteTextures.length];
      
      // Loop through vertical stripes
      for (let stripe = Math.floor(drawStartX); stripe < Math.floor(drawEndX); stripe++) {
        if (stripe >= 0 && stripe < SCREEN_WIDTH && transformY < zBuffer[stripe]) {
             const texX = Math.floor((stripe - (-spriteWidth / 2 + spriteScreenX)) * TEX_WIDTH / spriteWidth);
             
             // Draw vertical pixels
             const yStart = Math.max(0, Math.floor(drawStartY));
             const yEnd = Math.min(SCREEN_HEIGHT - 1, Math.floor(drawEndY));

             for (let y = yStart; y < yEnd; y++) {
                 const d = (y - this.pitch) * 256 - SCREEN_HEIGHT * 128 + spriteHeight * 128; 
                 const texY = ((d * TEX_HEIGHT) / spriteHeight) / 256;
                 
                 const color = tex[TEX_WIDTH * (Math.floor(texY) & (TEX_HEIGHT - 1)) + texX];
                 if ((color & 0xFF000000) !== 0) { // Check alpha
                     this.pixels[y * SCREEN_WIDTH + stripe] = color;
                 }
             }
        }
      }
    }

    // Blit to canvas
    this.ctx.putImageData(new ImageData(new Uint8ClampedArray(this.pixels.buffer), SCREEN_WIDTH, SCREEN_HEIGHT), 0, 0);
  }

  loop = (timestamp: number) => {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    this.update(dt);
    this.draw();
    
    requestAnimationFrame(this.loop);
  }
}

// Start the game
window.onload = () => {
    new Game();
};