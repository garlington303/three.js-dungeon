/**
 * AnimatedSprite - Spritesheet animation helper for Three.js billboarded sprites.
 *
 * Usage:
 *   const animSprite = new AnimatedSprite(texture, columns, rows);
 *   scene.add(animSprite.sprite);
 *   animSprite.setAnimation('idle', 0, 3, 8);   // frames 0–3 at 8 FPS
 *   animSprite.play();
 *   // In your update loop:
 *   animSprite.update(dt);
 */

import * as THREE from 'three';

export interface AnimationDef {
  startFrame: number;
  endFrame: number;
  fps: number;
  loop: boolean;
}

export class AnimatedSprite {
  public sprite: THREE.Sprite;
  public material: THREE.SpriteMaterial;

  private texture: THREE.Texture;
  private columns: number;
  private rows: number;
  private totalFrames: number;

  private animations: Map<string, AnimationDef> = new Map();
  private currentAnim: string | null = null;
  private frameIndex = 0;
  private elapsed = 0;
  private playing = false;

  /**
   * @param texture  The spritesheet texture (single PNG with frames laid out in a grid).
   * @param columns  Number of columns in the spritesheet.
   * @param rows     Number of rows in the spritesheet.
   */
  constructor(texture: THREE.Texture, columns: number, rows: number) {
    this.texture = texture;
    this.columns = columns;
    this.rows = rows;
    this.totalFrames = columns * rows;

    // Configure texture for crisp pixel art and spritesheet UV usage
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Set repeat to show one frame at a time
    texture.repeat.set(1 / columns, 1 / rows);

    this.material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    this.sprite = new THREE.Sprite(this.material);
    this.setFrame(0);
  }

  /**
   * Define a named animation.
   * @param name        Animation identifier (e.g. 'idle', 'walk', 'attack').
   * @param startFrame  First frame index (0-based, left-to-right then top-to-bottom).
   * @param endFrame    Last frame index (inclusive).
   * @param fps         Playback speed in frames per second.
   * @param loop        Whether to loop (default true).
   */
  setAnimation(name: string, startFrame: number, endFrame: number, fps: number, loop = true): void {
    this.animations.set(name, { startFrame, endFrame, fps, loop });
  }

  /**
   * Start playing an animation by name. If already playing this animation, does nothing.
   */
  play(name?: string): void {
    if (name && name !== this.currentAnim) {
      const anim = this.animations.get(name);
      if (!anim) {
        console.warn(`AnimatedSprite: animation "${name}" not defined`);
        return;
      }
      this.currentAnim = name;
      this.frameIndex = anim.startFrame;
      this.elapsed = 0;
      this.setFrame(this.frameIndex);
    }
    this.playing = true;
  }

  /**
   * Pause playback (sprite stays on current frame).
   */
  pause(): void {
    this.playing = false;
  }

  /**
   * Stop playback and reset to first frame of current animation.
   */
  stop(): void {
    this.playing = false;
    if (this.currentAnim) {
      const anim = this.animations.get(this.currentAnim);
      if (anim) {
        this.frameIndex = anim.startFrame;
        this.setFrame(this.frameIndex);
      }
    }
  }

  /**
   * Call every frame to advance the animation.
   * @param dt Delta time in seconds.
   */
  update(dt: number): void {
    if (!this.playing || !this.currentAnim) return;

    const anim = this.animations.get(this.currentAnim);
    if (!anim) return;

    this.elapsed += dt;
    const frameDuration = 1 / anim.fps;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frameIndex++;

      if (this.frameIndex > anim.endFrame) {
        if (anim.loop) {
          this.frameIndex = anim.startFrame;
        } else {
          this.frameIndex = anim.endFrame;
          this.playing = false;
        }
      }

      this.setFrame(this.frameIndex);
    }
  }

  /**
   * Directly set the displayed frame by index.
   */
  setFrame(frameIndex: number): void {
    const col = frameIndex % this.columns;
    // Rows go top-to-bottom; Three.js UV origin is bottom-left
    const row = Math.floor(frameIndex / this.columns);
    const rowFlipped = this.rows - 1 - row;

    this.texture.offset.set(col / this.columns, rowFlipped / this.rows);
  }

  /**
   * Get current frame index.
   */
  getFrame(): number {
    return this.frameIndex;
  }

  /**
   * Get currently playing animation name (or null).
   */
  getCurrentAnimation(): string | null {
    return this.currentAnim;
  }

  /**
   * Check if currently playing.
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Dispose of resources.
   */
  dispose(): void {
    this.material.dispose();
    // Note: texture disposal is the caller's responsibility if shared.
  }
}
