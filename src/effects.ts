/**
 * Visual Effects System - Particles, Screen Shake, and Audio Feedback
 * Provides juice and polish to game interactions
 */

import * as THREE from 'three';

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

export interface ParticleOptions {
  position: THREE.Vector3;
  color?: number;
  count?: number;
  speed?: number;
  lifetime?: number;
  size?: number;
  spread?: number;
  gravity?: number;
  fadeOut?: boolean;
  shrink?: boolean;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  lifetime: number;
  maxLifetime: number;
  fadeOut: boolean;
  shrink: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private maxParticles = 1000;

  // Pre-allocated buffers for performance
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Initialize buffers
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    // Create geometry with attributes
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Create material with vertex colors
    this.material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  /**
   * Emit a burst of particles
   */
  emit(options: ParticleOptions): void {
    const {
      position,
      color = 0xffffff,
      count = 10,
      speed = 2,
      lifetime = 0.5,
      size = 0.1,
      spread = 1,
      gravity = -5,
      fadeOut = true,
      shrink = true,
    } = options;

    const baseColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        // Remove oldest particle
        this.particles.shift();
      }

      // Random direction with spread
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        Math.random() * spread * 0.5 + 0.5, // Bias upward
        (Math.random() - 0.5) * spread
      ).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.5));

      // Slight color variation
      const particleColor = baseColor.clone();
      particleColor.r += (Math.random() - 0.5) * 0.2;
      particleColor.g += (Math.random() - 0.5) * 0.2;
      particleColor.b += (Math.random() - 0.5) * 0.2;

      this.particles.push({
        position: position.clone(),
        velocity,
        color: particleColor,
        size: size * (0.5 + Math.random() * 0.5),
        lifetime,
        maxLifetime: lifetime,
        fadeOut,
        shrink,
      });
    }
  }

  /**
   * Emit hit sparks (for projectile impacts)
   */
  emitHitSparks(position: THREE.Vector3, color: number = 0xffaa44): void {
    this.emit({
      position,
      color,
      count: 15,
      speed: 4,
      lifetime: 0.3,
      size: 0.08,
      spread: 1.5,
      gravity: -8,
    });
  }

  /**
   * Emit damage numbers effect (blood/sparks)
   */
  emitDamage(position: THREE.Vector3, isCritical: boolean = false): void {
    this.emit({
      position,
      color: isCritical ? 0xff4444 : 0xff8866,
      count: isCritical ? 25 : 12,
      speed: isCritical ? 5 : 3,
      lifetime: 0.4,
      size: isCritical ? 0.12 : 0.08,
      spread: 1.2,
      gravity: -6,
    });
  }

  /**
   * Emit heal effect
   */
  emitHeal(position: THREE.Vector3): void {
    this.emit({
      position,
      color: 0x44ff88,
      count: 20,
      speed: 1.5,
      lifetime: 0.8,
      size: 0.1,
      spread: 0.5,
      gravity: 2, // Float upward
    });
  }

  /**
   * Emit coin pickup sparkles
   */
  emitCoinPickup(position: THREE.Vector3): void {
    this.emit({
      position,
      color: 0xffdd44,
      count: 12,
      speed: 2,
      lifetime: 0.5,
      size: 0.06,
      spread: 0.8,
      gravity: 1,
    });
  }

  /**
   * Emit dash trail effect
   */
  emitDashTrail(position: THREE.Vector3): void {
    this.emit({
      position,
      color: 0x8888ff,
      count: 3,
      speed: 0.5,
      lifetime: 0.2,
      size: 0.15,
      spread: 0.3,
      gravity: 0,
      shrink: true,
    });
  }

  /**
   * Emit enemy death explosion
   */
  emitEnemyDeath(position: THREE.Vector3): void {
    // Core explosion
    this.emit({
      position,
      color: 0xff6644,
      count: 30,
      speed: 5,
      lifetime: 0.6,
      size: 0.15,
      spread: 2,
      gravity: -4,
    });
    // Smoke
    this.emit({
      position,
      color: 0x444444,
      count: 15,
      speed: 2,
      lifetime: 1.0,
      size: 0.2,
      spread: 1,
      gravity: 1,
    });
  }

  /**
   * Emit magic cast effect from hand position
   */
  emitMagicCast(position: THREE.Vector3, color: number = 0xff8844): void {
    this.emit({
      position,
      color,
      count: 8,
      speed: 3,
      lifetime: 0.25,
      size: 0.08,
      spread: 0.5,
      gravity: 0,
    });
  }

  /**
   * Update all particles
   */
  update(dt: number): void {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute;

    let aliveCount = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update lifetime
      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Apply gravity
      p.velocity.y += -5 * dt; // Default gravity

      // Update position
      p.position.add(p.velocity.clone().multiplyScalar(dt));

      // Calculate life ratio for effects
      const lifeRatio = p.lifetime / p.maxLifetime;

      // Update buffer data
      const idx = aliveCount * 3;
      this.positions[idx] = p.position.x;
      this.positions[idx + 1] = p.position.y;
      this.positions[idx + 2] = p.position.z;

      // Apply fade
      const alpha = p.fadeOut ? lifeRatio : 1;
      this.colors[idx] = p.color.r * alpha;
      this.colors[idx + 1] = p.color.g * alpha;
      this.colors[idx + 2] = p.color.b * alpha;

      // Apply shrink
      this.sizes[aliveCount] = p.shrink ? p.size * lifeRatio : p.size;

      aliveCount++;
    }

    // Zero out unused slots
    for (let i = aliveCount; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
    }

    // Update geometry
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    this.geometry.setDrawRange(0, aliveCount);
  }

  /**
   * Attach to a new scene (for scene transitions)
   */
  attachToScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    this.scene.remove(this.points);
    this.scene = scene;
    this.scene.add(this.points);
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.points);
  }
}

// ============================================================================
// SCREEN SHAKE
// ============================================================================

export interface ShakeOptions {
  intensity?: number;
  duration?: number;
  frequency?: number;
  decay?: boolean;
}

export class ScreenShake {
  private camera: THREE.Camera;
  private originalPosition = new THREE.Vector3();
  private shakeOffset = new THREE.Vector3();
  private isShaking = false;
  private intensity = 0;
  private duration = 0;
  private elapsed = 0;
  private frequency = 25;
  private decay = true;
  private trauma = 0; // Accumulated trauma for layered shakes

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Trigger a screen shake
   */
  shake(options: ShakeOptions = {}): void {
    const {
      intensity = 0.1,
      duration = 0.2,
      frequency = 25,
      decay = true,
    } = options;

    // Add trauma instead of replacing (allows layered effects)
    this.trauma = Math.min(1, this.trauma + intensity);
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.frequency = frequency;
    this.decay = decay;
    this.elapsed = 0;

    if (!this.isShaking) {
      this.isShaking = true;
      this.originalPosition.copy(this.camera.position);
    }
  }

  /**
   * Small shake for minor impacts
   */
  shakeLight(): void {
    this.shake({ intensity: 0.03, duration: 0.1 });
  }

  /**
   * Medium shake for hits
   */
  shakeMedium(): void {
    this.shake({ intensity: 0.08, duration: 0.15 });
  }

  /**
   * Heavy shake for big impacts
   */
  shakeHeavy(): void {
    this.shake({ intensity: 0.15, duration: 0.25 });
  }

  /**
   * Damage shake (when player takes damage)
   */
  shakeDamage(): void {
    this.shake({ intensity: 0.12, duration: 0.2, frequency: 30 });
  }

  /**
   * Update shake effect - call every frame
   */
  update(dt: number): void {
    if (!this.isShaking) return;

    this.elapsed += dt;

    if (this.elapsed >= this.duration) {
      this.stopShake();
      return;
    }

    // Calculate shake amount using trauma squared (feels better)
    const traumaAmount = this.decay 
      ? this.trauma * (1 - this.elapsed / this.duration)
      : this.trauma;
    
    const shakeAmount = traumaAmount * traumaAmount * this.intensity;

    // Use noise-like pattern for organic feel
    const time = this.elapsed * this.frequency;
    this.shakeOffset.set(
      (Math.sin(time * 1.1) + Math.sin(time * 1.7)) * 0.5 * shakeAmount,
      (Math.sin(time * 1.3) + Math.sin(time * 1.9)) * 0.5 * shakeAmount,
      (Math.sin(time * 0.9) + Math.sin(time * 2.1)) * 0.25 * shakeAmount
    );

    // Apply offset (relative to current camera position, not original)
    // This works with the player controller since it updates camera position each frame
  }

  /**
   * Get current shake offset to apply to camera
   */
  getOffset(): THREE.Vector3 {
    return this.shakeOffset;
  }

  /**
   * Check if currently shaking
   */
  isActive(): boolean {
    return this.isShaking;
  }

  private stopShake(): void {
    this.isShaking = false;
    this.trauma = 0;
    this.shakeOffset.set(0, 0, 0);
  }
}

// ============================================================================
// AUDIO MANAGER
// ============================================================================

type SoundType = 
  | 'hit' 
  | 'enemyHit' 
  | 'enemyDeath' 
  | 'playerHurt'
  | 'dash'
  | 'shoot'
  | 'coinPickup'
  | 'itemPickup'
  | 'heal'
  | 'levelUp'
  | 'doorOpen';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  ramp?: 'up' | 'down' | 'updown';
  frequencyEnd?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  hit: {
    frequency: 200,
    duration: 0.1,
    type: 'square',
    volume: 0.15,
    ramp: 'down',
    frequencyEnd: 80,
  },
  enemyHit: {
    frequency: 440,
    duration: 0.08,
    type: 'sawtooth',
    volume: 0.1,
    ramp: 'down',
    frequencyEnd: 220,
  },
  enemyDeath: {
    frequency: 150,
    duration: 0.3,
    type: 'sawtooth',
    volume: 0.2,
    ramp: 'down',
    frequencyEnd: 40,
  },
  playerHurt: {
    frequency: 200,
    duration: 0.2,
    type: 'square',
    volume: 0.2,
    ramp: 'down',
    frequencyEnd: 100,
  },
  dash: {
    frequency: 300,
    duration: 0.15,
    type: 'sine',
    volume: 0.1,
    ramp: 'updown',
    frequencyEnd: 600,
  },
  shoot: {
    frequency: 880,
    duration: 0.1,
    type: 'sine',
    volume: 0.08,
    ramp: 'down',
    frequencyEnd: 440,
  },
  coinPickup: {
    frequency: 987, // B5
    duration: 0.1,
    type: 'sine',
    volume: 0.12,
    ramp: 'up',
    frequencyEnd: 1318, // E6
  },
  itemPickup: {
    frequency: 523, // C5
    duration: 0.15,
    type: 'triangle',
    volume: 0.15,
    ramp: 'up',
    frequencyEnd: 784, // G5
  },
  heal: {
    frequency: 523,
    duration: 0.3,
    type: 'sine',
    volume: 0.12,
    ramp: 'up',
    frequencyEnd: 1046, // C6
  },
  levelUp: {
    frequency: 440,
    duration: 0.4,
    type: 'triangle',
    volume: 0.15,
    ramp: 'up',
    frequencyEnd: 880,
  },
  doorOpen: {
    frequency: 200,
    duration: 0.25,
    type: 'triangle',
    volume: 0.1,
    ramp: 'up',
    frequencyEnd: 400,
  },
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterVolume = 0.5;
  private muted = false;

  constructor() {
    // Audio context is created lazily on first user interaction
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Play a predefined sound effect
   */
  play(type: SoundType): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const config = SOUND_CONFIGS[type];
    if (!config) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = config.type;
      
      const now = ctx.currentTime;
      const endTime = now + config.duration;
      const volume = config.volume * this.masterVolume;

      // Frequency envelope
      osc.frequency.setValueAtTime(config.frequency, now);
      if (config.frequencyEnd !== undefined) {
        if (config.ramp === 'updown') {
          osc.frequency.linearRampToValueAtTime(config.frequencyEnd, now + config.duration * 0.5);
          osc.frequency.linearRampToValueAtTime(config.frequency, endTime);
        } else {
          osc.frequency.linearRampToValueAtTime(config.frequencyEnd, endTime);
        }
      }

      // Volume envelope
      gain.gain.setValueAtTime(0.001, now);
      if (config.ramp === 'up' || config.ramp === 'updown') {
        gain.gain.exponentialRampToValueAtTime(volume, now + config.duration * 0.3);
      } else {
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(endTime);
    } catch {
      // Ignore audio failures
    }
  }

  /**
   * Play a custom tone
   */
  playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = frequency;
      
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.1 * this.masterVolume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio failures
    }
  }

  /**
   * Play a multi-note jingle (for level up, achievements, etc.)
   */
  playJingle(notes: number[], noteDuration: number = 0.1): void {
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, noteDuration * 1.5, 'triangle'), i * noteDuration * 1000);
    });
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.muted;
  }
}

// ============================================================================
// DAMAGE NUMBERS (Floating Combat Text)
// ============================================================================

interface DamageNumber {
  element: HTMLDivElement;
  startTime: number;
  duration: number;
  startY: number;
}

export class DamageNumberManager {
  private container: HTMLDivElement;
  private numbers: DamageNumber[] = [];
  private camera: THREE.Camera;
  private canvas: HTMLCanvasElement;

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;

    // Create container for damage numbers
    this.container = document.createElement('div');
    this.container.id = 'damage-numbers';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 100;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Show a damage number at world position
   */
  show(worldPos: THREE.Vector3, damage: number, isCritical: boolean = false): void {
    // Project world position to screen
    const screenPos = this.worldToScreen(worldPos);
    if (!screenPos) return;

    const el = document.createElement('div');
    el.textContent = isCritical ? `${damage}!` : String(damage);
    el.style.cssText = `
      position: absolute;
      left: ${screenPos.x}px;
      top: ${screenPos.y}px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: ${isCritical ? '28px' : '20px'};
      color: ${isCritical ? '#ff4444' : '#ffcc44'};
      text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
      transform: translate(-50%, -50%);
      transition: none;
      z-index: 101;
    `;

    this.container.appendChild(el);

    this.numbers.push({
      element: el,
      startTime: performance.now(),
      duration: isCritical ? 1200 : 800,
      startY: screenPos.y,
    });
  }

  /**
   * Show heal number
   */
  showHeal(worldPos: THREE.Vector3, amount: number): void {
    const screenPos = this.worldToScreen(worldPos);
    if (!screenPos) return;

    const el = document.createElement('div');
    el.textContent = `+${amount}`;
    el.style.cssText = `
      position: absolute;
      left: ${screenPos.x}px;
      top: ${screenPos.y}px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 22px;
      color: #44ff88;
      text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
      transform: translate(-50%, -50%);
      z-index: 101;
    `;

    this.container.appendChild(el);

    this.numbers.push({
      element: el,
      startTime: performance.now(),
      duration: 1000,
      startY: screenPos.y,
    });
  }

  /**
   * Update all damage numbers
   */
  update(): void {
    const now = performance.now();

    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const num = this.numbers[i];
      const elapsed = now - num.startTime;
      const progress = elapsed / num.duration;

      if (progress >= 1) {
        num.element.remove();
        this.numbers.splice(i, 1);
        continue;
      }

      // Float upward and fade out
      const yOffset = progress * 60;
      const opacity = 1 - progress;
      const scale = 1 + progress * 0.3;

      num.element.style.top = `${num.startY - yOffset}px`;
      num.element.style.opacity = String(opacity);
      num.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
  }

  private worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } | null {
    const pos = worldPos.clone();
    pos.project(this.camera);

    // Check if behind camera
    if (pos.z > 1) return null;

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (pos.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-pos.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }

  dispose(): void {
    this.numbers.forEach(n => n.element.remove());
    this.container.remove();
  }
}

// ============================================================================
// HIT FLASH OVERLAY
// ============================================================================

export class HitFlashOverlay {
  private overlay: HTMLDivElement;
  private fadeTimer: number | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'hit-flash';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(255, 0, 0, 0.3) 100%);
      opacity: 0;
      transition: opacity 0.05s ease-in;
      z-index: 99;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Flash red when player takes damage
   */
  flashDamage(): void {
    this.flash('rgba(255, 0, 0, 0.35)', 200);
  }

  /**
   * Flash green when player heals
   */
  flashHeal(): void {
    this.flash('rgba(0, 255, 100, 0.25)', 300);
  }

  /**
   * Flash blue when dashing
   */
  flashDash(): void {
    this.flash('rgba(100, 150, 255, 0.2)', 150);
  }

  private flash(color: string, duration: number): void {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
    }

    // Update gradient color
    this.overlay.style.background = `radial-gradient(ellipse at center, transparent 0%, ${color} 100%)`;
    this.overlay.style.opacity = '1';

    this.fadeTimer = window.setTimeout(() => {
      this.overlay.style.opacity = '0';
      this.fadeTimer = null;
    }, duration);
  }

  dispose(): void {
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.overlay.remove();
  }
}

// ============================================================================
// EFFECTS MANAGER (Central coordinator)
// ============================================================================

export class EffectsManager {
  public particles: ParticleSystem;
  public shake: ScreenShake;
  public audio: AudioManager;
  public damageNumbers: DamageNumberManager;
  public hitFlash: HitFlashOverlay;

  constructor(scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.particles = new ParticleSystem(scene);
    this.shake = new ScreenShake(camera);
    this.audio = new AudioManager();
    this.damageNumbers = new DamageNumberManager(camera, canvas);
    this.hitFlash = new HitFlashOverlay();
  }

  /**
   * Update all effect systems
   */
  update(dt: number): void {
    this.particles.update(dt);
    this.shake.update(dt);
    this.damageNumbers.update();
  }

  /**
   * Player takes damage - full feedback
   */
  onPlayerDamage(position: THREE.Vector3, damage: number): void {
    this.shake.shakeDamage();
    this.hitFlash.flashDamage();
    this.audio.play('playerHurt');
    this.particles.emitDamage(position);
  }

  /**
   * Player heals - positive feedback
   */
  onPlayerHeal(position: THREE.Vector3, amount: number): void {
    this.hitFlash.flashHeal();
    this.audio.play('heal');
    this.particles.emitHeal(position);
    this.damageNumbers.showHeal(position, amount);
  }

  /**
   * Enemy takes damage
   */
  onEnemyDamage(position: THREE.Vector3, damage: number, isCritical: boolean = false): void {
    this.shake.shakeLight();
    this.audio.play('enemyHit');
    this.particles.emitDamage(position, isCritical);
    this.damageNumbers.show(position, damage, isCritical);
  }

  /**
   * Enemy dies
   */
  onEnemyDeath(position: THREE.Vector3): void {
    this.shake.shakeMedium();
    this.audio.play('enemyDeath');
    this.particles.emitEnemyDeath(position);
  }

  /**
   * Player dashes
   */
  onDash(position: THREE.Vector3): void {
    this.hitFlash.flashDash();
    this.audio.play('dash');
    this.particles.emitDashTrail(position);
  }

  /**
   * Projectile fired
   */
  onShoot(position: THREE.Vector3, color: number): void {
    this.audio.play('shoot');
    this.particles.emitMagicCast(position, color);
  }

  /**
   * Projectile hits something
   */
  onProjectileHit(position: THREE.Vector3): void {
    this.shake.shakeLight();
    this.particles.emitHitSparks(position);
  }

  /**
   * Coin pickup
   */
  onCoinPickup(position: THREE.Vector3): void {
    this.audio.play('coinPickup');
    this.particles.emitCoinPickup(position);
  }

  /**
   * Item pickup
   */
  onItemPickup(position: THREE.Vector3): void {
    this.audio.play('itemPickup');
    this.particles.emitCoinPickup(position); // Reuse sparkle effect
  }

  /**
   * Attach particle system to new scene (for transitions)
   */
  attachToScene(scene: THREE.Scene): void {
    this.particles.attachToScene(scene);
  }

  dispose(): void {
    this.particles.dispose();
    this.damageNumbers.dispose();
    this.hitFlash.dispose();
  }
}
