import * as THREE from 'three';
import { RoomMetadata, RoomData, Direction, TILE_SIZE } from './room';
import { RoomManager } from './roomManager';
import { createBasicRoom } from './rooms/basicRoom';
import { createCorridorNS, createCorridorEW } from './rooms/corridorRoom';
import { createJunctionRoom } from './rooms/junctionRoom';
import { createDeadEndRoom } from './rooms/deadEndRoom';

// ============================================================================
// DUNGEON GENERATOR TYPES
// ============================================================================

export type RoomType = 'basic' | 'corridor_ns' | 'corridor_ew' | 'junction' | 'dead_end';

export interface DungeonConfig {
  seed?: number;
  minRooms: number;
  maxRooms: number;
  treasureRoomChance: number; // 0-1
  shrineRoomChance: number;   // 0-1
  branchingFactor: number;    // How likely to create multiple paths (0-1)
}

export interface GridCell {
  roomId: string | null;
  occupied: boolean;
}

export interface RoomPlacement {
  id: string;
  type: RoomType;
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  connections: Map<Direction, string | null>;
  group: THREE.Group | null;
}

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

const DIRECTION_OFFSET: Record<Direction, { x: number; z: number }> = {
  north: { x: 0, z: -1 },
  south: { x: 0, z: 1 },
  east: { x: 1, z: 0 },
  west: { x: -1, z: 0 },
};

// ============================================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /** Returns a number between 0 and 1 */
  next(): number {
    // Mulberry32 algorithm
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /** Returns an integer from min (inclusive) to max (exclusive) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Shuffles an array in-place */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length)];
  }
}

// ============================================================================
// DUNGEON GENERATOR
// ============================================================================

export class DungeonGenerator {
  private config: DungeonConfig;
  private rng: SeededRandom;
  private grid: Map<string, GridCell> = new Map();
  private rooms: Map<string, RoomPlacement> = new Map();
  private roomIdCounter = 0;
  private materials: { floor: THREE.Material; wall: THREE.Material };

  // Dungeon statistics
  private treasureRoomCount = 0;
  private shrineRoomCount = 0;

  constructor(
    config: Partial<DungeonConfig>,
    materials: { floor: THREE.Material; wall: THREE.Material }
  ) {
    this.config = {
      seed: config.seed ?? Math.floor(Math.random() * 999999),
      minRooms: config.minRooms ?? 8,
      maxRooms: config.maxRooms ?? 15,
      treasureRoomChance: config.treasureRoomChance ?? 0.15,
      shrineRoomChance: config.shrineRoomChance ?? 0.08,
      branchingFactor: config.branchingFactor ?? 0.4,
    };
    this.rng = new SeededRandom(this.config.seed);
    this.materials = materials;

    console.log(`[DungeonGenerator] Initialized with seed: ${this.config.seed}`);
  }

  /**
   * Generates the dungeon layout and returns all room placements.
   * Does NOT create Three.js geometry yet - call buildRoom() to instantiate.
   */
  generate(): Map<string, RoomPlacement> {
    this.grid.clear();
    this.rooms.clear();
    this.roomIdCounter = 0;
    this.treasureRoomCount = 0;
    this.shrineRoomCount = 0;

    const targetRoomCount = this.rng.nextInt(this.config.minRooms, this.config.maxRooms + 1);
    console.log(`[DungeonGenerator] Generating ${targetRoomCount} rooms...`);

    // Start with spawn room at origin (junction for exploration options)
    const spawnRoom = this.placeRoom(0, 0, 'junction');
    if (!spawnRoom) {
      console.error('[DungeonGenerator] Failed to place spawn room!');
      return this.rooms;
    }
    spawnRoom.group = this.createRoomGroup(spawnRoom);

    // Queue of rooms that can still expand
    const frontier: RoomPlacement[] = [spawnRoom];

    while (this.rooms.size < targetRoomCount && frontier.length > 0) {
      // Pick a room from the frontier
      const currentRoom = this.rng.pick(frontier);
      
      // Try to expand from this room
      const expanded = this.expandFrom(currentRoom);
      
      if (!expanded) {
        // Remove from frontier if can't expand anymore
        const idx = frontier.indexOf(currentRoom);
        if (idx >= 0) frontier.splice(idx, 1);
      } else {
        // Add new room to frontier
        frontier.push(expanded);
      }
    }

    // Cap dead ends with special rooms (treasure/shrine)
    this.addSpecialRooms();

    console.log(`[DungeonGenerator] Generated ${this.rooms.size} rooms`);
    console.log(`  - Treasure rooms: ${this.treasureRoomCount}`);
    console.log(`  - Shrine rooms: ${this.shrineRoomCount}`);

    return this.rooms;
  }

  /**
   * Builds the Three.js geometry for a room if not already built.
   */
  buildRoom(roomId: string): THREE.Group | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (!room.group) {
      room.group = this.createRoomGroup(room);
    }

    return room.group;
  }

  /**
   * Builds all rooms and adds them to the scene.
   * Returns the spawn point position.
   */
  buildAllRooms(scene: THREE.Scene, roomManager: RoomManager): THREE.Vector3 {
    let spawnPoint = new THREE.Vector3(0, 0.5, 0);

    for (const [id, room] of this.rooms) {
      const group = this.buildRoom(id);
      if (group) {
        scene.add(group);
        roomManager.addRoom(group);

        // First room (junction) is spawn point
        if (id === 'room_0') {
          // Offset slightly from center to avoid central pillar decoration
          spawnPoint.set(
            room.worldX + 1.0 * TILE_SIZE,
            0.5,
            room.worldZ + 1.0 * TILE_SIZE
          );
        }
      }
    }

    return spawnPoint;
  }

  /**
   * Gets all room IDs within a certain grid distance of a position.
   * Useful for room streaming/loading nearby rooms.
   */
  getNearbyRooms(worldX: number, worldZ: number, gridRadius: number): string[] {
    const centerGridX = Math.floor(worldX / (3 * TILE_SIZE));
    const centerGridZ = Math.floor(worldZ / (3 * TILE_SIZE));
    
    const nearby: string[] = [];
    
    for (const [id, room] of this.rooms) {
      const dx = Math.abs(room.gridX - centerGridX);
      const dz = Math.abs(room.gridZ - centerGridZ);
      if (dx <= gridRadius && dz <= gridRadius) {
        nearby.push(id);
      }
    }

    return nearby;
  }

  /**
   * Returns the seed used for this generation (for persistence/sharing).
   */
  getSeed(): number {
    return this.config.seed;
  }

  // ========================
  // PRIVATE HELPERS
  // ========================

  private gridKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  private isOccupied(gridX: number, gridZ: number): boolean {
    const cell = this.grid.get(this.gridKey(gridX, gridZ));
    return cell?.occupied ?? false;
  }

  private markOccupied(gridX: number, gridZ: number, roomId: string): void {
    this.grid.set(this.gridKey(gridX, gridZ), { roomId, occupied: true });
  }

  private nextRoomId(): string {
    return `room_${this.roomIdCounter++}`;
  }

  private placeRoom(gridX: number, gridZ: number, type: RoomType): RoomPlacement | null {
    if (this.isOccupied(gridX, gridZ)) return null;

    const id = this.nextRoomId();
    const worldX = gridX * 3 * TILE_SIZE; // 3x3 tile spacing for junction-sized rooms
    const worldZ = gridZ * 3 * TILE_SIZE;

    const room: RoomPlacement = {
      id,
      type,
      gridX,
      gridZ,
      worldX,
      worldZ,
      connections: new Map(),
      group: null,
    };

    this.rooms.set(id, room);
    this.markOccupied(gridX, gridZ, id);

    return room;
  }

  private getAvailableDirections(room: RoomPlacement): Direction[] {
    const available: Direction[] = [];

    for (const dir of ['north', 'south', 'east', 'west'] as Direction[]) {
      // Skip if already connected
      if (room.connections.has(dir)) continue;

      const offset = DIRECTION_OFFSET[dir];
      const targetX = room.gridX + offset.x;
      const targetZ = room.gridZ + offset.z;

      if (!this.isOccupied(targetX, targetZ)) {
        available.push(dir);
      }
    }

    return available;
  }

  private expandFrom(room: RoomPlacement): RoomPlacement | null {
    const available = this.getAvailableDirections(room);
    if (available.length === 0) return null;

    // Pick a random direction
    const dir = this.rng.pick(available);
    const offset = DIRECTION_OFFSET[dir];
    const newGridX = room.gridX + offset.x;
    const newGridZ = room.gridZ + offset.z;

    // Determine room type
    let roomType: RoomType;
    const roomCount = this.rooms.size;
    
    if (roomCount < 3) {
      // Early rooms are corridors or basic for connectivity
      roomType = this.rng.chance(0.5) ? 'corridor_ns' : 'basic';
    } else if (this.rng.chance(this.config.branchingFactor)) {
      // Junction for branching
      roomType = 'junction';
    } else {
      // Regular room types
      roomType = this.rng.pick(['basic', 'corridor_ns', 'corridor_ew']);
    }

    const newRoom = this.placeRoom(newGridX, newGridZ, roomType);
    if (!newRoom) return null;

    // Link rooms together
    room.connections.set(dir, newRoom.id);
    newRoom.connections.set(OPPOSITE_DIRECTION[dir], room.id);

    // Build geometry for the new room
    newRoom.group = this.createRoomGroup(newRoom);

    return newRoom;
  }

  private addSpecialRooms(): void {
    // Find dead-ends (rooms with only 1 connection)
    for (const [id, room] of this.rooms) {
      const connectionCount = Array.from(room.connections.values()).filter(v => v !== null).length;
      
      if (connectionCount === 1 && room.type !== 'junction') {
        // This is a dead-end - chance to make it special
        if (this.rng.chance(this.config.treasureRoomChance) && this.treasureRoomCount < 2) {
          room.type = 'dead_end';
          room.group = this.createRoomGroup(room, 'treasure');
          this.treasureRoomCount++;
        } else if (this.rng.chance(this.config.shrineRoomChance) && this.shrineRoomCount < 1) {
          room.type = 'dead_end';
          room.group = this.createRoomGroup(room, 'shrine');
          this.shrineRoomCount++;
        }
      }
    }
  }

  private createRoomGroup(room: RoomPlacement, variant?: 'treasure' | 'shrine' | 'empty'): THREE.Group {
    let group: THREE.Group;

    switch (room.type) {
      case 'junction':
        group = createJunctionRoom(this.materials);
        break;
      case 'corridor_ns':
        group = createCorridorNS(this.materials);
        break;
      case 'corridor_ew':
        group = createCorridorEW(this.materials);
        break;
      case 'dead_end':
        // Determine entrance direction from connections
        let entrance: Direction = 'south';
        for (const [dir, target] of room.connections) {
          if (target !== null) {
            entrance = dir;
            break;
          }
        }
        group = createDeadEndRoom({
          materials: this.materials,
          entrance,
          variant: variant ?? 'empty',
        });
        break;
      case 'basic':
      default:
        group = createBasicRoom(this.materials);
        break;
    }

    // Position the room in world space
    group.position.set(room.worldX, 0, room.worldZ);
    group.userData.roomId = room.id;
    group.userData.gridX = room.gridX;
    group.userData.gridZ = room.gridZ;

    return group;
  }
}
