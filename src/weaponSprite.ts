/**
 * WeaponSprite - First-person weapon display system for Three.js dungeon crawler.
 * 
 * Uses horizontal strip spritesheets (1 row, N columns) for weapon animations.
 * Designed to be rendered as a HUD overlay with viewport-relative sizing.
 * 
 * Usage:
 *   const weapon = new WeaponSprite('pistol', 0.25); // 25% of viewport height
 *   await weapon.load();
 *   document.body.appendChild(weapon.canvas);
 *   
 *   // In your game loop:
 *   weapon.update(deltaTime);
 *   
 *   // When player attacks:
 *   weapon.play('fire');
 */

// Weapon metadata structure matching weapon_metadata.json
interface WeaponFrame {
  index: number;
  filename: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

interface WeaponMetadata {
  weapon: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  sheetWidth: number;
  sheetHeight: number;
  frames: WeaponFrame[];
}

interface AnimationDef {
  startFrame: number;
  endFrame: number;
  fps: number;
  loop: boolean;
}

interface WeaponConfig {
  spritesheetPath: string;
  animations: { [name: string]: AnimationDef };
}

// Pre-defined weapon configurations
const WEAPON_CONFIGS: { [key: string]: WeaponConfig } = {
  crowbar: {
    spritesheetPath: '/src/assets/weapons/crowbar/crowbar_attack.png',
    animations: {
      idle: { startFrame: 0, endFrame: 0, fps: 1, loop: true },
      fire: { startFrame: 0, endFrame: 5, fps: 12, loop: false },
    }
  },
  hammer: {
    spritesheetPath: '/src/assets/weapons/hammer/hammer_attack.png',
    animations: {
      idle: { startFrame: 0, endFrame: 0, fps: 1, loop: true },
      fire: { startFrame: 0, endFrame: 3, fps: 10, loop: false },
    }
  },
  glock: {
    spritesheetPath: '/src/assets/weapons/glock/glock_fire.png',
    animations: {
      idle: { startFrame: 0, endFrame: 0, fps: 1, loop: true },
      fire: { startFrame: 0, endFrame: 4, fps: 15, loop: false },
      reload: { startFrame: 5, endFrame: 8, fps: 6, loop: false },
    }
  },
  pistol: {
    spritesheetPath: '/src/assets/weapons/pistol/pistol_fire.png',
    animations: {
      idle: { startFrame: 0, endFrame: 0, fps: 1, loop: true },
      fire: { startFrame: 0, endFrame: 4, fps: 15, loop: false },
      reload: { startFrame: 5, endFrame: 8, fps: 6, loop: false },
    }
  }
};

export class WeaponSprite {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private spritesheet: HTMLImageElement | null = null;
  private metadata: WeaponMetadata | null = null;
  private config: WeaponConfig;
  private weaponType: string;
  
  private currentAnim: string = 'idle';
  private frameIndex: number = 0;
  private elapsed: number = 0;
  private playing: boolean = false;
  
  // Direct scale factor for the PNG (0.3 = 30% of original size)
  private scale: number;
  
  // Viewmodel scale - how big it appears on screen (CSS transform)
  private viewmodelScale: number;
  
  private onAnimationEnd: (() => void) | null = null;

  /**
   * @param weaponType - Key from WEAPON_CONFIGS (e.g., 'pistol', 'glock')
   * @param scale - Scale factor for the PNG (0.3 = 30% of original size, default: 0.3)
   * @param viewmodelScale - How big the weapon appears on screen (1.0 = normal, 0.5 = half size)
   */
  constructor(weaponType: string, scale: number = 0.3, viewmodelScale: number = 1.0) {
    this.weaponType = weaponType;
    this.config = WEAPON_CONFIGS[weaponType] || WEAPON_CONFIGS.pistol;
    this.scale = scale;
    this.viewmodelScale = viewmodelScale;
    
    // Create canvas for rendering - positioned bottom center, aimed at crosshair
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'weapon-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      bottom: -80px;
      left: 60%;
      transform: translateX(-50%);
      pointer-events: none;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      z-index: 100;
    `;
    
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Load the weapon spritesheet and metadata.
   */
  async load(): Promise<void> {
    // Load metadata
    const metadataResponse = await fetch('/src/assets/weapons/weapon_metadata.json');
    const allMetadata = await metadataResponse.json();
    
    // Find our weapon's metadata
    this.metadata = allMetadata[this.weaponType] || allMetadata.pistol;
    
    if (!this.metadata) {
      console.error(`WeaponSprite: No metadata found for weapon "${this.weaponType}"`);
      return;
    }
    
    console.log(`WeaponSprite: Loading ${this.weaponType}`, {
      frameCount: this.metadata.frameCount,
      frameSize: `${this.metadata.frameWidth}x${this.metadata.frameHeight}`,
      sheetSize: `${this.metadata.sheetWidth}x${this.metadata.sheetHeight}`,
    });
    
    // Load spritesheet image
    return new Promise((resolve, reject) => {
      this.spritesheet = new Image();
      this.spritesheet.onload = () => {
        console.log(`WeaponSprite: Spritesheet loaded`, {
          naturalSize: `${this.spritesheet!.naturalWidth}x${this.spritesheet!.naturalHeight}`,
        });
        this.updateCanvasSize();
        this.render();
        resolve();
      };
      this.spritesheet.onerror = (e) => {
        console.error('WeaponSprite: Failed to load spritesheet', e);
        reject(e);
      };
      this.spritesheet.src = this.config.spritesheetPath;
    });
  }

  /**
   * Update canvas size based on frame dimensions and scale factors.
   */
  private updateCanvasSize(): void {
    if (!this.metadata) return;
    
    // Internal canvas resolution (high quality)
    const canvasWidth = Math.ceil(this.metadata.frameWidth * this.scale);
    const canvasHeight = Math.ceil(this.metadata.frameHeight * this.scale);
    
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    
    // Display size on screen (CSS controls visual size)
    const displayWidth = Math.ceil(canvasWidth * this.viewmodelScale);
    const displayHeight = Math.ceil(canvasHeight * this.viewmodelScale);
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
    
    // Ensure crisp rendering
    this.ctx.imageSmoothingEnabled = false;
    
    this.render();
  }

  /**
   * Play an animation by name.
   */
  play(animName: string, onEnd?: () => void): void {
    const anim = this.config.animations[animName];
    if (!anim) {
      console.warn(`WeaponSprite: animation "${animName}" not defined for ${this.weaponType}`);
      return;
    }
    
    // Don't restart if already playing this animation
    if (this.currentAnim === animName && this.playing && animName !== 'idle') {
      return;
    }
    
    this.currentAnim = animName;
    this.frameIndex = anim.startFrame;
    this.elapsed = 0;
    this.playing = true;
    this.onAnimationEnd = onEnd || null;
    this.render();
  }

  /**
   * Stop and return to idle.
   */
  stop(): void {
    this.playing = false;
    this.currentAnim = 'idle';
    this.frameIndex = 0;
    this.elapsed = 0;
    this.render();
  }

  /**
   * Update animation state.
   * @param dt Delta time in seconds.
   */
  update(dt: number): void {
    if (!this.metadata) return;
    
    const anim = this.config.animations[this.currentAnim];
    if (!anim) return;
    
    // Always render idle frame even when not "playing"
    if (!this.playing) {
      if (this.currentAnim === 'idle') {
        this.render();
      }
      return;
    }
    
    this.elapsed += dt;
    const frameDuration = 1 / anim.fps;
    
    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex++;
      
      if (this.frameIndex > anim.endFrame) {
        if (anim.loop) {
          this.frameIndex = anim.startFrame;
        } else {
          this.frameIndex = anim.startFrame; // Return to first frame of animation
          this.playing = false;
          
          // Call callback
          if (this.onAnimationEnd) {
            this.onAnimationEnd();
            this.onAnimationEnd = null;
          }
          
          // Return to idle after non-looping animation
          this.currentAnim = 'idle';
          const idleAnim = this.config.animations['idle'];
          if (idleAnim) {
            this.frameIndex = idleAnim.startFrame;
          }
          break;
        }
      }
    }
    
    this.render();
  }

  /**
   * Render the current frame to the canvas.
   */
  private render(): void {
    if (!this.spritesheet || !this.metadata) return;
    
    // Clamp frame index to valid range
    const safeFrameIndex = Math.min(this.frameIndex, this.metadata.frames.length - 1);
    const frame = this.metadata.frames[safeFrameIndex];
    if (!frame) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate destination dimensions using internal scale
    const destWidth = frame.width * this.scale;
    const destHeight = frame.height * this.scale;
    
    // Center the frame in the canvas
    const destX = (this.canvas.width - destWidth) / 2;
    const destY = this.canvas.height - destHeight;
    
    // Draw the current frame
    this.ctx.drawImage(
      this.spritesheet,
      frame.x, frame.y, frame.width, frame.height,  // Source rectangle
      destX, destY, destWidth, destHeight            // Destination rectangle
    );
  }

  /**
   * Set the scale factor and update sizing.
   */
  setScale(scale: number): void {
    this.scale = scale;
    this.updateCanvasSize();
  }

  /**
   * Check if currently playing an animation.
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Get current animation name.
   */
  getCurrentAnimation(): string {
    return this.currentAnim;
  }

  /**
   * Dispose resources.
   */
  dispose(): void {
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
