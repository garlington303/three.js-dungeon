
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'key' | 'misc';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EquipmentSlot =
  | 'head'
  | 'torso'
  | 'legs'
  | 'feet';

// Item-side equip slots. Rings can be equipped into either ring slot.
export type ItemEquipSlot = Exclude<EquipmentSlot, 'ringLeft' | 'ringRight'> | 'ring';

export interface ItemTemplate {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  icon: string; // image path or data URI
  stackable: boolean;
  maxStack: number;
  description: string;

  // Stats/effects (MVP)
  damage?: number; // weapons
  defense?: number; // armor
  effect?: string; // consumables
  healAmount?: number; // health potion
  manaAmount?: number; // mana potion
  keyColor?: 'red' | 'blue' | 'yellow';
  equipSlot?: ItemEquipSlot;
  equipSlots?: ItemEquipSlot[];
}

export interface ItemStack {
  item: ItemTemplate;
  quantity: number;
}

export interface DerivedStats {
  attack: number;
  defense: number;
  moveSpeed: number;
}

export interface InventoryCallbacks {
  onOpenChanged?: (isOpen: boolean) => void;
  onToast?: (message: string) => void;
  onUseConsumable?: (stack: ItemStack) => void;
  onEquipmentChanged?: (stats: DerivedStats) => void;
  onSound?: (type: 'pickup' | 'equip' | 'use' | 'drop') => void;
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9a9a9a',
  uncommon: '#44ff88',
  rare: '#4488ff',
  epic: '#bb66ff',
  legendary: '#ff8844',
};

const RARITY_GLOW: Record<Rarity, string> = {
  common: 'rgba(150, 150, 150, 0.3)',
  uncommon: 'rgba(68, 255, 136, 0.5)',
  rare: 'rgba(68, 136, 255, 0.5)',
  epic: 'rgba(187, 102, 255, 0.6)',
  legendary: 'rgba(255, 136, 68, 0.7)',
};

function svgIcon(label: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="1" y="1" width="46" height="46" rx="6" ry="6" fill="${bg}" stroke="rgba(0,0,0,0.55)" stroke-width="2"/>
  <text x="24" y="29" text-anchor="middle" font-size="16" font-family="Courier New, monospace" fill="#fff" style="font-weight:700">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const ITEM_DB: Record<string, ItemTemplate> = {
  // Starter gear (paper doll)
  tunic_worn: {
    id: 'tunic_worn',
    name: 'Worn Leather Tunic',
    type: 'armor',
    rarity: 'common',
    icon: svgIcon('TU', '#553b2a'),
    stackable: false,
    maxStack: 1,
    description: 'Old but serviceable protection.',
    defense: 5,
    equipSlot: 'torso',
  },
  sword_rusty: {
    id: 'sword_rusty',
    name: 'Rusty Sword',
    type: 'weapon',
    rarity: 'common',
    icon: svgIcon('RS', '#666666'),
    stackable: false,
    maxStack: 1,
    description: 'It has seen better days.',
    damage: 15,
  },
  pants_tattered: {
    id: 'pants_tattered',
    name: 'Tattered Pants',
    type: 'armor',
    rarity: 'common',
    icon: svgIcon('PT', '#4a3a2a'),
    stackable: false,
    maxStack: 1,
    description: 'Barely holds together.',
    defense: 2,
    equipSlot: 'legs',
  },
  boots_old: {
    id: 'boots_old',
    name: 'Old Boots',
    type: 'armor',
    rarity: 'common',
    icon: svgIcon('BT', '#553322'),
    stackable: false,
    maxStack: 1,
    description: 'Worn boots with thin soles.',
    defense: 1,
    equipSlot: 'feet',
  },
  torch: {
    id: 'torch',
    name: 'Torch',
    type: 'misc',
    rarity: 'common',
    icon: svgIcon('TC', '#aa6622'),
    stackable: true,
    maxStack: 10,
    description: 'Provides light (placeholder).',
  },

  // Weapons
  sword_basic: {
    id: 'sword_basic',
    name: 'Iron Sword',
    type: 'weapon',
    rarity: 'common',
    icon: svgIcon('SW', '#555555'),
    stackable: false,
    maxStack: 1,
    description: 'A basic but reliable blade.',
    damage: 25,
  },
  axe_basic: {
    id: 'axe_basic',
    name: 'Worn Axe',
    type: 'weapon',
    rarity: 'uncommon',
    icon: svgIcon('AX', '#335533'),
    stackable: false,
    maxStack: 1,
    description: 'Heavy swings, heavy hits.',
    damage: 35,
  },
  crossbow_basic: {
    id: 'crossbow_basic',
    name: 'Crossbow',
    type: 'weapon',
    rarity: 'rare',
    icon: svgIcon('CB', '#334455'),
    stackable: false,
    maxStack: 1,
    description: 'A ranged weapon for cautious heroes.',
    damage: 30,
  },

  // Armor
  armor_leather: {
    id: 'armor_leather',
    name: 'Leather Armor',
    type: 'armor',
    rarity: 'common',
    icon: svgIcon('LE', '#553b2a'),
    stackable: false,
    maxStack: 1,
    description: 'Light protection.',
    defense: 1,
    equipSlot: 'torso',
  },
  armor_chain: {
    id: 'armor_chain',
    name: 'Chainmail',
    type: 'armor',
    rarity: 'uncommon',
    icon: svgIcon('CH', '#444444'),
    stackable: false,
    maxStack: 1,
    description: 'Good all-around defense.',
    defense: 2,
    equipSlot: 'torso',
  },
  armor_plate: {
    id: 'armor_plate',
    name: 'Plate Armor',
    type: 'armor',
    rarity: 'rare',
    icon: svgIcon('PL', '#666677'),
    stackable: false,
    maxStack: 1,
    description: 'Bulky but strong.',
    defense: 3,
    equipSlot: 'torso',
  },

  // Consumables
  potion_health: {
    id: 'potion_health',
    name: 'Health Potion',
    type: 'consumable',
    rarity: 'common',
    icon: svgIcon('HP', '#aa2222'),
    stackable: true,
    maxStack: 20,
    description: 'Restores 50 HP.',
    effect: 'Heal 50',
    healAmount: 50,
  },
  potion_mana: {
    id: 'potion_mana',
    name: 'Mana Potion',
    type: 'consumable',
    rarity: 'uncommon',
    icon: svgIcon('MP', '#2244aa'),
    stackable: true,
    maxStack: 20,
    description: 'Restores mana (placeholder).',
    effect: 'Restore mana',
    manaAmount: 50,
  },
  food_ration: {
    id: 'food_ration',
    name: 'Rations',
    type: 'consumable',
    rarity: 'common',
    icon: svgIcon('FD', '#886633'),
    stackable: true,
    maxStack: 10,
    description: 'A small meal (placeholder).',
    effect: 'Minor buff',
  },

  // Keys
  key_red: {
    id: 'key_red',
    name: 'Red Key',
    type: 'key',
    rarity: 'rare',
    icon: svgIcon('RK', '#aa2222'),
    stackable: true,
    maxStack: 5,
    description: 'Opens red locks.',
    keyColor: 'red',
  },
  key_blue: {
    id: 'key_blue',
    name: 'Blue Key',
    type: 'key',
    rarity: 'rare',
    icon: svgIcon('BK', '#2244aa'),
    stackable: true,
    maxStack: 5,
    description: 'Opens blue locks.',
    keyColor: 'blue',
  },
  key_yellow: {
    id: 'key_yellow',
    name: 'Yellow Key',
    type: 'key',
    rarity: 'rare',
    icon: svgIcon('YK', '#aa8822'),
    stackable: true,
    maxStack: 5,
    description: 'Opens yellow locks.',
    keyColor: 'yellow',
  },

  // Misc
  gold_coin: {
    id: 'gold_coin',
    name: 'Gold Coin',
    type: 'misc',
    rarity: 'common',
    icon: svgIcon('GC', '#aa8822'),
    stackable: true,
    maxStack: 999,
    description: 'Currency of the realm.',
  },
  ring_ember: {
    id: 'ring_ember',
    name: 'Ember Ring',
    type: 'misc',
    rarity: 'epic',
    icon: svgIcon('RG', '#773355'),
    stackable: false,
    maxStack: 1,
    description: 'An accessory (placeholder).',
  },
  quest_relic: {
    id: 'quest_relic',
    name: 'Ancient Relic',
    type: 'misc',
    rarity: 'legendary',
    icon: svgIcon('QR', '#884422'),
    stackable: false,
    maxStack: 1,
    description: 'A quest item (placeholder).',
  },

  // Epic/Legendary gear for visual showcase
  helm_dragon: {
    id: 'helm_dragon',
    name: 'Dragonbone Helm',
    type: 'armor',
    rarity: 'epic',
    icon: svgIcon('DH', '#6a4488'),
    stackable: false,
    maxStack: 1,
    description: 'Forged from the skull of an ancient wyrm.',
    defense: 12,
    equipSlot: 'head',
  },
  boots_shadow: {
    id: 'boots_shadow',
    name: 'Shadowstep Boots',
    type: 'armor',
    rarity: 'legendary',
    icon: svgIcon('SB', '#cc6622'),
    stackable: false,
    maxStack: 1,
    description: 'Move like a whisper through the dark.',
    defense: 8,
    equipSlot: 'feet',
  },
  sword_flame: {
    id: 'sword_flame',
    name: 'Inferno Blade',
    type: 'weapon',
    rarity: 'legendary',
    icon: svgIcon('IB', '#dd5511'),
    stackable: false,
    maxStack: 1,
    description: 'Burns with eternal flame.',
    damage: 65,
  },
  potion_greater: {
    id: 'potion_greater',
    name: 'Greater Health Potion',
    type: 'consumable',
    rarity: 'rare',
    icon: svgIcon('G+', '#cc3344'),
    stackable: true,
    maxStack: 10,
    description: 'Restores 150 HP.',
    effect: 'Heal 150',
    healAmount: 150,
  },
};

type SlotRef =
  | { kind: 'inv'; index: number }
  | { kind: 'equip'; slot: EquipmentSlot }
  | { kind: 'hotbar'; index: number };

function isSameItem(a: ItemStack, b: ItemStack): boolean {
  return a.item.id === b.item.id;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

class SimpleSound {
  private ctx: AudioContext | null = null;

  play(type: 'pickup' | 'equip' | 'use' | 'drop'): void {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';

      const now = ctx.currentTime;
      const freq = type === 'pickup' ? 660 : type === 'equip' ? 520 : type === 'use' ? 740 : 240;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore audio failures
    }
  }
}

export class InventoryManager {
  private readonly slotCount = 24;
  private slots: Array<ItemStack | null> = new Array(this.slotCount).fill(null);
  private hotbar: Array<ItemStack | null> = new Array(6).fill(null);
  private equipment: Record<EquipmentSlot, ItemStack | null> = {
    head: null,
    torso: null,
    legs: null,
    feet: null,
  };

  private isOpen = false;
  private callbacks: InventoryCallbacks;
  private sound = new SimpleSound();

  // Player-facing stats inputs
  private characterName = 'Adventurer';
  private hpCurrent = 10;
  private hpMax = 10;
  private baseAttack = 10;
  private baseDefense = 0;
  private baseMoveSpeed = 2.0;

  // Category filter state
  private activeCategory: ItemType | 'all' = 'all';
  private categoryBtns: NodeListOf<HTMLButtonElement> | null = null;

  // UI refs
  private overlay: HTMLElement;
  private gridEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private contextEl: HTMLElement;
  private ctxTitleEl: HTMLElement;
  private ctxSplitBtn: HTMLButtonElement;
  private ctxDropBtn: HTMLButtonElement;
  private ghostEl: HTMLImageElement;
  private toastEl: HTMLElement;
  private confirmEl: HTMLElement;
  private confirmMsgEl: HTMLElement;
  private confirmYesBtn: HTMLButtonElement;
  private confirmNoBtn: HTMLButtonElement;

  private statHpEl: HTMLElement;
  private statAtkEl: HTMLElement;
  private statDefEl: HTMLElement;
  private statMoveEl: HTMLElement;
  private capTextEl: HTMLElement;
  private capFillEl: HTMLElement;

  // Drag & tooltip state
  private dragging: { stack: ItemStack; from: SlotRef } | null = null;
  private dragLastMouse = { x: 0, y: 0 };
  private pendingDropConfirm: { stack: ItemStack; from: SlotRef } | null = null;

  private hoverTarget: SlotRef | null = null;
  private hoverTimer: number | null = null;

  private contextRef: SlotRef | null = null;

  constructor(callbacks: InventoryCallbacks = {}) {
    this.callbacks = callbacks;
    this.overlay = this.mustGet('inventory-overlay');
    this.gridEl = this.mustGet('inventory-grid');
    this.tooltipEl = this.mustGet('inv-tooltip');
    this.contextEl = this.mustGet('inv-context');
    this.ctxTitleEl = this.mustGet('ctx-title');
    this.ctxSplitBtn = this.mustGet('ctx-split') as HTMLButtonElement;
    this.ctxDropBtn = this.mustGet('ctx-drop') as HTMLButtonElement;
    this.ghostEl = this.mustGet('inv-drag-ghost') as HTMLImageElement;
    // Defensive: ensure the drag-ghost never steals clicks / native drag behaviors.
    this.ghostEl.style.pointerEvents = 'none';
    this.ghostEl.draggable = false;
    this.toastEl = this.mustGet('inv-toast');
    this.confirmEl = this.mustGet('inv-confirm');
    this.confirmMsgEl = this.mustGet('inv-confirm-msg');
    this.confirmYesBtn = this.mustGet('inv-confirm-yes') as HTMLButtonElement;
    this.confirmNoBtn = this.mustGet('inv-confirm-no') as HTMLButtonElement;

    this.statHpEl = this.mustGet('stat-hp');
    this.statAtkEl = this.mustGet('stat-attack');
    this.statDefEl = this.mustGet('stat-defense');
    this.statMoveEl = this.mustGet('stat-move');
    this.capTextEl = this.mustGet('inv-capacity-text');
    this.capFillEl = this.mustGet('inv-capacity-fill');

    this.buildGridDom();
    this.bindEvents();
    this.renderAll();
  }

  // ---------- Public API (Game integration) ----------

  public setPlayerInfo(info: { name?: string; hpCurrent: number; hpMax: number; baseAttack: number; baseDefense: number; baseMoveSpeed: number }): void {
    if (info.name) this.characterName = info.name;
    this.hpCurrent = info.hpCurrent;
    this.hpMax = info.hpMax;
    this.baseAttack = info.baseAttack;
    this.baseDefense = info.baseDefense;
    this.baseMoveSpeed = info.baseMoveSpeed;
    this.renderStats();
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getDerivedStats(): DerivedStats {
    const weaponBonus = this.equipment.rightArm?.item.damage ?? 0;
    const armorBonus = Object.values(this.equipment).reduce((sum, s) => sum + (s?.item.defense ?? 0), 0);
    return {
      attack: this.baseAttack + weaponBonus,
      defense: this.baseDefense + armorBonus,
      moveSpeed: this.baseMoveSpeed,
    };
  }

  public setStartingItems(): void {
    // Starting loadout - 4 equipment slots
    this.equipDirect({ item: ITEM_DB.tunic_worn, quantity: 1 }, 'torso');
    this.equipDirect({ item: ITEM_DB.pants_tattered, quantity: 1 }, 'legs');
    this.equipDirect({ item: ITEM_DB.boots_old, quantity: 1 }, 'feet');

    // Hotbar starters
    this.hotbar[0] = { item: ITEM_DB.potion_health, quantity: 3 };
    this.hotbar[1] = { item: ITEM_DB.potion_greater, quantity: 1 };
    this.hotbar[2] = { item: ITEM_DB.torch, quantity: 5 };

    // Add varied rarity items silently (no toast spam)
    const starterItems = [
      { id: 'gold_coin', qty: 50 },
      { id: 'sword_basic', qty: 1 },
      { id: 'axe_basic', qty: 1 },
      { id: 'crossbow_basic', qty: 1 },
      { id: 'helm_dragon', qty: 1 },
      { id: 'boots_shadow', qty: 1 },
      { id: 'sword_flame', qty: 1 },
      { id: 'ring_ember', qty: 1 },
      { id: 'quest_relic', qty: 1 },
      { id: 'key_red', qty: 1 },
      { id: 'armor_chain', qty: 1 },
    ];
    for (const { id, qty } of starterItems) {
      const tpl = ITEM_DB[id];
      if (tpl) this.tryAddStack({ item: tpl, quantity: qty });
    }

    this.toast('Starting gear equipped.');
  }

  public tryAddById(itemId: string, quantity: number): boolean {
    const tpl = ITEM_DB[itemId];
    if (!tpl) return false;
    const ok = this.tryAddStack({ item: tpl, quantity });
    if (ok) {
      this.callbacks.onSound?.('pickup');
      this.sound.play('pickup');
      this.toast(`${tpl.name} added to inventory`);
    } else {
      this.toast('Inventory full!');
    }
    return ok;
  }

  public tryAddStack(stack: ItemStack): boolean {
    let remaining = stack.quantity;

    // stack onto existing
    if (stack.item.stackable) {
      for (let i = 0; i < this.slots.length; i++) {
        const existing = this.slots[i];
        if (!existing) continue;
        if (!isSameItem(existing, stack)) continue;
        if (existing.quantity >= existing.item.maxStack) continue;
        const space = existing.item.maxStack - existing.quantity;
        const add = Math.min(space, remaining);
        existing.quantity += add;
        remaining -= add;
        if (remaining <= 0) break;
      }
    }

    // fill empty slots
    while (remaining > 0) {
      const idx = this.slots.findIndex(s => s === null);
      if (idx === -1) break;
      const add = stack.item.stackable ? Math.min(stack.item.maxStack, remaining) : 1;
      this.slots[idx] = { item: stack.item, quantity: add };
      remaining -= add;
    }

    this.renderAll();
    return remaining === 0;
  }

  public hasKey(color: 'red' | 'blue' | 'yellow'): boolean {
    return this.countItem(`key_${color}`) > 0;
  }

  public consumeKey(color: 'red' | 'blue' | 'yellow'): boolean {
    return this.consumeItem(`key_${color}`, 1);
  }

  public getEquippedWeaponDamage(): number {
    return this.equipment.rightArm?.item.damage ?? 0;
  }

  public getEquippedArmorDefense(): number {
    return Object.values(this.equipment).reduce((sum, s) => sum + (s?.item.defense ?? 0), 0);
  }

  // ---------- UI / Open/Close ----------

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.overlay.classList.add('open');
    this.overlay.setAttribute('aria-hidden', 'false');
    this.hideTooltip();
    this.closeContextMenu();
    this.callbacks.onOpenChanged?.(true);
    this.renderAll();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.classList.remove('open');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.hideTooltip();
    this.closeContextMenu();
    this.endDrag(true);
    this.closeConfirm(false);
    this.callbacks.onOpenChanged?.(false);
  }

  public toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  // ---------- Internals ----------

  private mustGet(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing required element #${id}`);
    return el;
  }

  private buildGridDom(): void {
    // Build inventory grid
    this.gridEl.innerHTML = '';
    for (let i = 0; i < this.slotCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.dataset.slotIndex = String(i);
      slot.tabIndex = -1;
      this.gridEl.appendChild(slot);
    }
  }

  private bindEvents(): void {
    // Optional close button in the inventory header.
    const closeBtn = document.getElementById('inv-close-btn');
    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.isOpen) this.close();
    });

    // Category tab switching
    this.categoryBtns = document.querySelectorAll<HTMLButtonElement>('.inv-cat-btn');
    this.categoryBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const category = btn.dataset.category as ItemType | 'all' | undefined;
        if (!category) return;
        this.setActiveCategory(category);
      });
    });

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'i' || e.key === 'Tab') {
        e.preventDefault();
        this.toggle();
        return;
      }
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        if (this.contextEl.classList.contains('open')) {
          this.closeContextMenu();
          return;
        }
        this.close();
      }
    }, { capture: true });

    // Prevent tabbing away / context menu when open
    window.addEventListener('contextmenu', (e) => {
      if (!this.isOpen) return;
      e.preventDefault();
    }, { capture: true });

    // Mouse interactions inside overlay
    this.overlay.addEventListener('mousedown', (e) => {
      if (!(e instanceof MouseEvent)) return;
      if (e.button !== 0) return;

      // any left click should dismiss the context menu
      this.closeContextMenu();

      const slotRef = this.findSlotRefFromEvent(e);
      if (!slotRef) return;

      const stack = this.getStack(slotRef);
      if (!stack) return;

      e.preventDefault();
      this.startDrag(slotRef, stack, e.clientX, e.clientY);
    });

    // Close context menu when clicking elsewhere
    window.addEventListener('mousedown', (e) => {
      if (!(e instanceof MouseEvent)) return;
      if (!this.isOpen) return;
      if (!this.contextEl.classList.contains('open')) return;
      const target = e.target as HTMLElement | null;
      if (target && this.contextEl.contains(target)) return;
      // don't close on right-click, since that's how we open it
      if (e.button === 2) return;
      this.closeContextMenu();
    }, { capture: true });

    // End drags even when mouseup happens outside the overlay.
    window.addEventListener('mouseup', (e) => {
      if (!(e instanceof MouseEvent)) return;
      if (e.button !== 0) return;
      if (!this.dragging) return;

      // If a drop-confirm is open, don't treat clicks as drop attempts.
      if (this.confirmEl.classList.contains('open')) return;

      e.preventDefault();
      const dropRef = this.findSlotRefFromEvent(e);
      if (!dropRef) {
        // dropped outside inventory panel => confirm drop
        this.openConfirmDrop(this.dragging.stack, this.dragging.from);
        return;
      }
      this.applyDrop(dropRef);
    }, { capture: true });

    window.addEventListener('mousemove', (e) => {
      this.dragLastMouse.x = e.clientX;
      this.dragLastMouse.y = e.clientY;
      if (this.dragging) {
        this.updateGhost(e.clientX, e.clientY);
        this.hideTooltip();
      } else if (this.isOpen) {
        // Check if mouse is over tooltip - if so, just update position
        const target = e.target as HTMLElement | null;
        if (target && this.tooltipEl.contains(target)) {
          // Mouse is over tooltip, keep it visible but don't reposition
          // (tooltip stays in place so buttons remain under cursor)
          return;
        }
        this.handleHover(e);
      }
    });

    // Right click opens a static context panel (Split/Drop)
    this.overlay.addEventListener('mousedown', (e) => {
      if (!(e instanceof MouseEvent)) return;
      if (e.button !== 2) return;
      const slotRef = this.findSlotRefFromEvent(e);
      if (!slotRef) {
        this.closeContextMenu();
        return;
      }
      const stack = this.getStack(slotRef);
      if (!stack) {
        this.closeContextMenu();
        return;
      }
      e.preventDefault();

      this.hideTooltip();
      this.openContextMenu(slotRef, stack, e.clientX, e.clientY);
    });

    // Context panel buttons
    this.ctxSplitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ref = this.contextRef;
      if (!ref) return;
      this.closeContextMenu();
      this.splitStack(ref);
    });
    this.ctxDropBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ref = this.contextRef;
      if (!ref) return;
      this.closeContextMenu();
      this.dropFrom(ref);
    });

    // Confirm modal
    this.confirmYesBtn.addEventListener('click', () => {
      if (!this.pendingDropConfirm) return;
      const { stack } = this.pendingDropConfirm;
      this.pendingDropConfirm = null;
      this.closeConfirm(true);
      this.callbacks.onSound?.('drop');
      this.sound.play('drop');
      this.toast(`${stack.item.name} dropped`);
      // discard item (already removed from slot when dragging)
      this.endDrag(false);
      this.renderAll();
    });
    this.confirmNoBtn.addEventListener('click', () => {
      this.closeConfirm(false);
      this.endDrag(true);
      this.renderAll();
    });
  }

  private toast(message: string): void {
    this.callbacks.onToast?.(message);
    this.toastEl.textContent = message;
    this.toastEl.classList.add('visible');
    window.setTimeout(() => this.toastEl.classList.remove('visible'), 1200);
  }

  private renderAll(): void {
    this.renderGrid();
    this.renderEquipment();
    this.renderHotbar();
    this.renderStats();
    this.renderCapacity();
    this.emitEquipmentStats();
  }

  private renderGrid(): void {
    const nodes = this.gridEl.querySelectorAll<HTMLElement>('.inv-slot');
    
    // Filter items based on active category
    const filteredSlots: Array<{ index: number; stack: ItemStack | null }> = [];
    for (let i = 0; i < this.slotCount; i++) {
      const stack = this.slots[i];
      if (this.activeCategory === 'all' || !stack || stack.item.type === this.activeCategory) {
        filteredSlots.push({ index: i, stack });
      }
    }

    nodes.forEach((slotEl, displayIndex) => {
      slotEl.innerHTML = '';
      // Clear rarity and visibility classes
      slotEl.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'hidden-slot');
      slotEl.classList.remove('drag-origin');
      slotEl.removeAttribute('data-real-index');

      const slotData = filteredSlots[displayIndex];
      if (!slotData) {
        // Hide extra slots when filtering
        slotEl.classList.add('hidden-slot');
        return;
      }

      const { index: realIndex, stack } = slotData;
      slotEl.dataset.slotIndex = String(realIndex);
      slotEl.dataset.realIndex = String(realIndex);

      // Mark drag origin
      const isDragOrigin = this.dragging?.from.kind === 'inv' && this.dragging.from.index === realIndex;
      slotEl.classList.toggle('drag-origin', isDragOrigin);

      if (!stack) return;

      // Add rarity class
      slotEl.classList.add(`rarity-${stack.item.rarity}`);

      const img = document.createElement('img');
      img.className = 'inv-item';
      img.src = stack.item.icon;
      img.alt = stack.item.name;
      slotEl.appendChild(img);

      if (stack.item.stackable && stack.quantity > 1) {
        const count = document.createElement('div');
        count.className = 'inv-count';
        count.textContent = `x${stack.quantity}`;
        slotEl.appendChild(count);
      }
    });
  }

  private setActiveCategory(category: ItemType | 'all'): void {
    this.activeCategory = category;
    
    // Update button active states
    this.categoryBtns?.forEach(btn => {
      const btnCat = btn.dataset.category;
      btn.classList.toggle('active', btnCat === category);
    });

    this.renderGrid();
    this.renderCapacity();
  }

  private renderEquipment(): void {
    const equipEls = document.querySelectorAll<HTMLElement>('.equip-slot');
    equipEls.forEach(el => {
      const slot = el.dataset.equipSlot as EquipmentSlot | undefined;
      if (!slot) return;
      const stack = this.equipment[slot];
      el.classList.toggle('equipped', !!stack);

      // Clear rarity classes
      el.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary');

      // Add drag-compatible highlight when dragging an equippable item
      let isCompatible = false;
      if (this.dragging) {
        isCompatible = this.canEquipTo(this.dragging.stack, slot);
      }
      el.classList.toggle('drag-compatible', isCompatible);

      // Find the content container (new structure)
      const contentEl = el.querySelector('.equip-slot-content');
      if (contentEl) {
        contentEl.innerHTML = '';
        if (stack) {
          // Add rarity class to slot
          el.classList.add(`rarity-${stack.item.rarity}`);

          const img = document.createElement('img');
          img.className = 'inv-item';
          img.src = stack.item.icon;
          img.alt = stack.item.name;
          contentEl.appendChild(img);
        }
      } else {
        // Fallback for old structure
        const hint = el.querySelector('.equip-hint');
        el.innerHTML = '';
        if (hint) el.appendChild(hint);

        if (stack) {
          el.classList.add(`rarity-${stack.item.rarity}`);
          const img = document.createElement('img');
          img.className = 'inv-item';
          img.src = stack.item.icon;
          img.alt = stack.item.name;
          el.appendChild(img);
        }
      }
    });
  }

  private renderHotbar(): void {
    const hotbarEls = document.querySelectorAll<HTMLElement>('.hotbar-slot');
    hotbarEls.forEach(el => {
      const idxStr = el.dataset.hotbarIndex;
      if (idxStr === undefined) return;
      const idx = Number(idxStr);

      // Clear rarity classes
      el.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary');

      const keyEl = el.querySelector('.hotbar-key');
      el.innerHTML = '';
      if (keyEl) el.appendChild(keyEl);

      const stack = this.hotbar[idx];
      if (!stack) return;

      // Add rarity class
      el.classList.add(`rarity-${stack.item.rarity}`);

      const img = document.createElement('img');
      img.className = 'inv-item';
      img.src = stack.item.icon;
      img.alt = stack.item.name;
      el.appendChild(img);

      if (stack.item.stackable && stack.quantity > 1) {
        const count = document.createElement('div');
        count.className = 'inv-count';
        count.textContent = `x${stack.quantity}`;
        el.appendChild(count);
      }
    });
  }

  private renderStats(): void {
    const derived = this.getDerivedStats();
    this.statHpEl.textContent = `${this.hpCurrent}/${this.hpMax}`;
    this.statHpEl.className = 'stat-value hp';
    this.statAtkEl.textContent = String(derived.attack);
    this.statAtkEl.className = 'stat-value attack';
    this.statDefEl.textContent = String(derived.defense);
    this.statDefEl.className = 'stat-value defense';
    this.statMoveEl.textContent = derived.moveSpeed.toFixed(1);
    this.statMoveEl.className = 'stat-value move';
  }

  private renderCapacity(): void {
    const totalUsed = this.slots.filter(s => s !== null).length;
    
    // Show filtered count when a category is active
    if (this.activeCategory !== 'all') {
      const filteredCount = this.slots.filter(s => s !== null && s.item.type === this.activeCategory).length;
      this.capTextEl.textContent = `${filteredCount} ${this.activeCategory} (${totalUsed} / ${this.slotCount} total)`;
    } else {
      this.capTextEl.textContent = `${totalUsed} / ${this.slotCount}`;
    }
    
    const pct = (totalUsed / this.slotCount) * 100;
    this.capFillEl.style.width = `${clamp(pct, 0, 100)}%`;
  }

  private emitEquipmentStats(): void {
    this.callbacks.onEquipmentChanged?.(this.getDerivedStats());
  }

  private findSlotRefFromEvent(e: MouseEvent): SlotRef | null {
    const target = e.target as HTMLElement | null;
    if (!target) return null;
    const invSlot = target.closest<HTMLElement>('.inv-slot');
    if (invSlot?.dataset.slotIndex !== undefined) {
      return { kind: 'inv', index: Number(invSlot.dataset.slotIndex) };
    }
    const hotbar = target.closest<HTMLElement>('.hotbar-slot');
    if (hotbar?.dataset.hotbarIndex !== undefined) {
      return { kind: 'hotbar', index: Number(hotbar.dataset.hotbarIndex) };
    }
    const equip = target.closest<HTMLElement>('.equip-slot');
    if (equip?.dataset.equipSlot) {
      return { kind: 'equip', slot: equip.dataset.equipSlot as EquipmentSlot };
    }
    return null;
  }

  private getStack(ref: SlotRef): ItemStack | null {
    if (ref.kind === 'inv') return this.slots[ref.index];
    if (ref.kind === 'hotbar') return this.hotbar[ref.index];
    return this.equipment[ref.slot];
  }

  private setStack(ref: SlotRef, stack: ItemStack | null): void {
    if (ref.kind === 'inv') this.slots[ref.index] = stack;
    else if (ref.kind === 'hotbar') this.hotbar[ref.index] = stack;
    else this.equipment[ref.slot] = stack;
  }

  private startDrag(from: SlotRef, stack: ItemStack, mouseX: number, mouseY: number): void {
    // remove from origin immediately
    this.setStack(from, null);
    this.dragging = { stack: { item: stack.item, quantity: stack.quantity }, from };
    this.ghostEl.src = stack.item.icon;
    this.ghostEl.style.display = 'block';
    // Set rarity glow on ghost
    this.ghostEl.style.setProperty('--ghost-rarity-glow', RARITY_GLOW[stack.item.rarity]);
    this.updateGhost(mouseX, mouseY);
    this.renderAll();
  }

  private updateGhost(mouseX: number, mouseY: number): void {
    this.ghostEl.style.left = `${mouseX + 10}px`;
    this.ghostEl.style.top = `${mouseY + 10}px`;
  }

  private applyDrop(to: SlotRef): void {
    if (!this.dragging) return;
    const held = this.dragging.stack;
    const from = this.dragging.from;

    // Equipment slot logic
    if (to.kind === 'equip') {
      if (!this.canEquipTo(held, to.slot)) {
        this.toast('Cannot equip that here');
        this.returnHeldToOrigin();
        return;
      }
      this.swapOrPlace(to, held);
      this.callbacks.onSound?.('equip');
      this.sound.play('equip');
      this.toast(`${held.item.name} equipped`);
      this.endDrag(false);
      this.renderAll();
      return;
    }

    // Hotbar logic (MVP): allow consumables, weapons, and torch
    if (to.kind === 'hotbar') {
      if (!(held.item.type === 'consumable' || held.item.type === 'weapon' || held.item.id === 'torch')) {
        this.toast('Only consumables or weapons can go in the hotbar');
        this.returnHeldToOrigin();
        return;
      }
      this.swapOrPlace(to, held);
      this.callbacks.onSound?.('equip');
      this.sound.play('equip');
      this.toast(`${held.item.name} placed on hotbar`);
      this.endDrag(false);
      this.renderAll();
      return;
    }

    // Drop into inventory slot
    const dest = this.getStack(to);
    if (!dest) {
      this.setStack(to, held);
      this.endDrag(false);
      this.renderAll();
      return;
    }

    // stack merge
    if (held.item.stackable && dest.item.stackable && isSameItem(held, dest)) {
      const space = dest.item.maxStack - dest.quantity;
      if (space > 0) {
        const add = Math.min(space, held.quantity);
        dest.quantity += add;
        held.quantity -= add;
        this.setStack(to, dest);
        if (held.quantity > 0) {
          // leftover returns to origin
          this.returnHeldToOrigin(held);
        }
        this.endDrag(false);
        this.renderAll();
        return;
      }
    }

    // swap
    this.setStack(to, held);
    this.setStack(from, dest);
    this.endDrag(false);
    this.renderAll();
  }

  private swapOrPlace(to: SlotRef, held: ItemStack): void {
    const dest = this.getStack(to);
    if (!dest) {
      this.setStack(to, held);
      return;
    }
    // swap, but equipment swap must remain valid
    if (to.kind === 'equip' && !this.canEquipTo(dest, to.slot)) {
      // can't swap if existing can't live anywhere? just reject
      return;
    }
    this.setStack(to, held);
    this.returnHeldToOrigin(dest);
  }

  private canEquipTo(stack: ItemStack, slot: EquipmentSlot): boolean {
    const allowed = this.getItemAllowedEquipSlots(stack.item);
    if (slot === 'ringLeft' || slot === 'ringRight') {
      return allowed.includes('ring') || allowed.includes('ringLeft') || allowed.includes('ringRight');
    }
    return allowed.includes(slot);
  }

  private getItemAllowedEquipSlots(item: ItemTemplate): ItemEquipSlot[] {
    if (item.equipSlots && item.equipSlots.length > 0) return item.equipSlots;
    if (item.equipSlot) return [item.equipSlot];
    if (item.type === 'weapon') return ['rightArm'];
    if (item.type === 'armor') return ['torso'];
    return [];
  }

  private returnHeldToOrigin(override?: ItemStack): void {
    if (!this.dragging) return;
    const toReturn = override ?? this.dragging.stack;
    const origin = this.dragging.from;

    // if origin occupied, find an empty slot
    if (this.getStack(origin) === null) {
      this.setStack(origin, toReturn);
      return;
    }
    const idx = this.slots.findIndex(s => s === null);
    if (idx !== -1) {
      this.slots[idx] = toReturn;
      return;
    }
    // last resort: drop it
    this.toast('Inventory full! Dropped item');
  }

  private endDrag(restoreIfHeld: boolean): void {
    if (!this.dragging) return;
    if (restoreIfHeld) {
      this.returnHeldToOrigin();
    }
    this.dragging = null;
    this.ghostEl.style.display = 'none';
  }

  private openConfirmDrop(stack: ItemStack, from: SlotRef): void {
    this.pendingDropConfirm = { stack, from };
    this.confirmMsgEl.textContent = `Drop ${stack.item.name}?`;
    this.confirmEl.classList.add('open');
    this.confirmEl.setAttribute('aria-hidden', 'false');
    // Hide the ghost so it can't visually/motionally interfere with modal clicks.
    this.ghostEl.style.display = 'none';
  }

  private closeConfirm(_dropped: boolean): void {
    this.confirmEl.classList.remove('open');
    this.confirmEl.setAttribute('aria-hidden', 'true');
    this.pendingDropConfirm = null;
  }

  private handleHover(e: MouseEvent): void {
    // Check if mouse is over the tooltip - if so, keep it visible
    const target = e.target as HTMLElement | null;
    if (target && this.tooltipEl.contains(target)) {
      // Mouse is over tooltip, don't clear it
      return;
    }

    const ref = this.findSlotRefFromEvent(e);
    if (!ref) {
      this.clearHover();
      return;
    }
    const stack = this.getStack(ref);
    if (!stack) {
      this.clearHover();
      return;
    }
    // same target => update position only
    if (this.hoverTarget && this.sameRef(this.hoverTarget, ref)) {
      if (this.tooltipEl.classList.contains('visible')) {
        this.positionTooltip(e.clientX, e.clientY);
      }
      return;
    }

    this.clearHover();
    this.hoverTarget = ref;
    this.hoverTimer = window.setTimeout(() => {
      if (!this.hoverTarget) return;
      const current = this.getStack(this.hoverTarget);
      if (!current) return;
      this.showTooltip(current, this.hoverTarget);
      this.positionTooltip(this.dragLastMouse.x, this.dragLastMouse.y);
    }, 500);
  }

  private clearHover(): void {
    if (this.hoverTimer) window.clearTimeout(this.hoverTimer);
    this.hoverTimer = null;
    this.hoverTarget = null;
    this.hideTooltip();
  }

  private showTooltip(stack: ItemStack, ref: SlotRef): void {
    const title = this.mustGet('tt-title');
    const type = this.mustGet('tt-type');
    const stats = this.mustGet('tt-stats');
    const desc = this.mustGet('tt-desc');
    const actions = this.mustGet('tt-actions');

    // Set rarity color CSS variable for the header bar
    this.tooltipEl.style.setProperty('--tooltip-rarity-color', RARITY_COLOR[stack.item.rarity]);

    title.textContent = stack.item.name;
    (title as HTMLElement).style.color = RARITY_COLOR[stack.item.rarity];

    type.textContent = `${stack.item.rarity.toUpperCase()} ${stack.item.type.toUpperCase()}`;

    // Build stats with color coding
    stats.innerHTML = '';
    if (stack.item.type === 'weapon' && stack.item.damage !== undefined) {
      const span = document.createElement('span');
      span.className = 'stat-positive';
      span.textContent = `+${stack.item.damage} Damage`;
      stats.appendChild(span);
    }
    if (stack.item.type === 'armor' && stack.item.defense !== undefined) {
      const span = document.createElement('span');
      span.className = 'stat-positive';
      span.textContent = `+${stack.item.defense} Defense`;
      stats.appendChild(span);
    }
    if (stack.item.type === 'consumable' && stack.item.effect) {
      stats.textContent = stack.item.effect;
    }

    desc.textContent = stack.item.description;

    actions.innerHTML = '';

    const mkBtn = (label: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.className = 'tt-btn';
      btn.textContent = label;
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        onClick();
      });
      return btn;
    };

    if (stack.item.type === 'consumable') {
      actions.appendChild(mkBtn('USE', () => this.useStack(ref)));
    }
    if (this.getItemAllowedEquipSlots(stack.item).length > 0) {
      actions.appendChild(mkBtn('EQUIP', () => this.equipSmart(ref)));
    }

    this.tooltipEl.classList.add('visible');
  }

  private openContextMenu(ref: SlotRef, stack: ItemStack, mouseX: number, mouseY: number): void {
    this.contextRef = ref;
    this.ctxTitleEl.textContent = stack.item.name.toUpperCase();
    const canSplit = stack.item.stackable && stack.quantity > 1;
    this.ctxSplitBtn.style.display = canSplit ? 'inline-block' : 'none';
    this.contextEl.classList.add('open');
    this.contextEl.setAttribute('aria-hidden', 'false');

    const pad = 10;
    const rect = this.contextEl.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - pad;
    const maxY = window.innerHeight - rect.height - pad;
    const x = clamp(mouseX + 8, pad, maxX);
    const y = clamp(mouseY + 8, pad, maxY);
    this.contextEl.style.left = `${x}px`;
    this.contextEl.style.top = `${y}px`;
  }

  private closeContextMenu(): void {
    this.contextRef = null;
    this.contextEl.classList.remove('open');
    this.contextEl.setAttribute('aria-hidden', 'true');
  }

  private positionTooltip(mouseX: number, mouseY: number): void {
    const pad = 12;
    const rect = this.tooltipEl.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - pad;
    const maxY = window.innerHeight - rect.height - pad;
    const x = clamp(mouseX + 16, pad, maxX);
    const y = clamp(mouseY + 16, pad, maxY);
    this.tooltipEl.style.left = `${x}px`;
    this.tooltipEl.style.top = `${y}px`;
  }

  private hideTooltip(): void {
    this.tooltipEl.classList.remove('visible');
  }

  private sameRef(a: SlotRef, b: SlotRef): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'inv') return a.index === (b as any).index;
    if (a.kind === 'hotbar') return a.index === (b as any).index;
    return a.slot === (b as any).slot;
  }

  private equipSmart(ref: SlotRef): void {
    const stack = this.getStack(ref);
    if (!stack) return;
    const allowed = this.getItemAllowedEquipSlots(stack.item);
    if (allowed.length === 0) {
      this.toast('Cannot equip that');
      return;
    }

    if (allowed.includes('ring')) {
      const preferred: EquipmentSlot = this.equipment.ringLeft ? 'ringRight' : 'ringLeft';
      this.equipFrom(ref, preferred);
      return;
    }

    const candidate = allowed[0];
    if (candidate === 'ring') return;
    this.equipFrom(ref, candidate as EquipmentSlot);
  }

  private equipFrom(ref: SlotRef, slot: EquipmentSlot): void {
    const stack = this.getStack(ref);
    if (!stack) return;
    if (!this.canEquipTo(stack, slot)) {
      this.toast('Cannot equip that');
      return;
    }
    // remove from origin and place
    this.setStack(ref, null);
    const replaced = this.equipment[slot];
    this.equipment[slot] = stack;
    if (replaced) {
      // put replaced back to origin if possible
      if (this.getStack(ref) === null) this.setStack(ref, replaced);
      else this.tryAddStack(replaced);
    }
    this.callbacks.onSound?.('equip');
    this.sound.play('equip');
    this.toast(`${stack.item.name} equipped`);
    this.renderAll();
  }

  private equipDirect(stack: ItemStack, slot: EquipmentSlot): void {
    if (!this.canEquipTo(stack, slot)) return;
    this.equipment[slot] = stack;
    this.renderAll();
  }

  private useStack(ref: SlotRef): void {
    const stack = this.getStack(ref);
    if (!stack) return;
    if (stack.item.type !== 'consumable') return;
    this.callbacks.onUseConsumable?.({ item: stack.item, quantity: 1 });
    this.callbacks.onSound?.('use');
    this.sound.play('use');
    this.toast(`${stack.item.name} used`);

    // consume one
    stack.quantity -= 1;
    if (stack.quantity <= 0) this.setStack(ref, null);
    this.renderAll();
  }

  private dropFrom(ref: SlotRef): void {
    const stack = this.getStack(ref);
    if (!stack) return;
    this.setStack(ref, null);
    this.callbacks.onSound?.('drop');
    this.sound.play('drop');
    this.toast(`${stack.item.name} dropped`);
    this.renderAll();
  }

  private splitStack(ref: SlotRef): void {
    const stack = this.getStack(ref);
    if (!stack) return;
    if (!stack.item.stackable || stack.quantity <= 1) return;
    const amountStr = window.prompt('Split amount:', String(Math.floor(stack.quantity / 2)));
    if (!amountStr) return;
    const amt = clamp(Number(amountStr), 1, stack.quantity - 1);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const empty = this.slots.findIndex(s => s === null);
    if (empty === -1) {
      this.toast('No empty slot to split into');
      return;
    }
    stack.quantity -= amt;
    this.slots[empty] = { item: stack.item, quantity: amt };
    this.renderAll();
  }

  private countItem(itemId: string): number {
    let total = 0;
    for (const s of this.slots) {
      if (s?.item.id === itemId) total += s.quantity;
    }
    return total;
  }

  private consumeItem(itemId: string, quantity: number): boolean {
    let remaining = quantity;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (!s) continue;
      if (s.item.id !== itemId) continue;
      const take = Math.min(s.quantity, remaining);
      s.quantity -= take;
      remaining -= take;
      if (s.quantity <= 0) this.slots[i] = null;
      if (remaining <= 0) break;
    }
    if (remaining <= 0) {
      this.renderAll();
      return true;
    }
    this.renderAll();
    return false;
  }
}
