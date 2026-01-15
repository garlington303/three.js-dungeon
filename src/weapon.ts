import * as THREE from 'three';

export interface WeaponConfig {
  name?: string;
  fireRate: number; // shots per second
  reloadTime: number; // seconds
  magazine: number;
  recoilPitch: number; // radians applied to camera pitch
  recoilYaw: number; // radians random yaw spread
  damage: number;
  range: number;
}

export class Weapon {
  private cfg: WeaponConfig;
  private lastShotTime = 0;
  private ammo: number;
  private reloading = false;

  // External hooks
  public onAmmoChanged: ((current: number, max: number) => void) | null = null;

  constructor(cfg: WeaponConfig) {
    this.cfg = cfg;
    this.ammo = cfg.magazine;
  }

  getAmmo() { return this.ammo; }

  handleMouseDown(e: MouseEvent) {
    // Left (0) primary, right (2) alternate
    if (e.button === 0) this.triggerFire('left');
    else if (e.button === 2) this.triggerFire('right');
  }

  triggerFire(hand: 'left' | 'right') {
    if (this.reloading) return;
    const now = performance.now() / 1000;
    const minInterval = 1 / this.cfg.fireRate;
    if (now - this.lastShotTime < minInterval) return;

    if (this.ammo <= 0) {
      // TODO: dry-fire feedback
      return;
    }

    this.lastShotTime = now;
    this.ammo--;
    this.onAmmoChanged?.(this.ammo, this.cfg.magazine);

    // Actual firing effects and projectile spawning are performed by caller
    // Expose recoil values and damage via return
    return {
      recoil: { pitch: -this.cfg.recoilPitch, yaw: (Math.random() - 0.5) * this.cfg.recoilYaw },
      damage: this.cfg.damage,
      range: this.cfg.range,
    } as const;
  }

  startReload(): Promise<void> {
    if (this.reloading) return Promise.resolve();
    this.reloading = true;
    return new Promise((res) => {
      setTimeout(() => {
        this.ammo = this.cfg.magazine;
        this.reloading = false;
        this.onAmmoChanged?.(this.ammo, this.cfg.magazine);
        res();
      }, this.cfg.reloadTime * 1000);
    });
  }

  isReloading(): boolean { return this.reloading; }
}

export default Weapon;
