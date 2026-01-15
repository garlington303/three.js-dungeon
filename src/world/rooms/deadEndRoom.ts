import * as THREE from 'three';
import { RoomBuilder, RoomMetadata, TILE_SIZE, Direction } from '../room';

export interface DeadEndOptions {
  materials: { floor: THREE.Material, wall: THREE.Material };
  entrance: Direction; // Which direction the single entrance faces
  variant?: 'treasure' | 'shrine' | 'empty'; // Visual variant
}

/**
 * Creates a 2x2 dead-end room with a single entrance.
 * Good for treasure rooms, shrines, or boss arenas.
 */
export function createDeadEndRoom(options: DeadEndOptions): THREE.Group {
  const { materials, entrance, variant = 'empty' } = options;

  // Build connections - only one exit based on entrance direction
  const connections: Record<Direction, { position: THREE.Vector3; direction: Direction } | null> = {
    north: null,
    south: null,
    east: null,
    west: null,
  };

  // Set the entrance connection
  switch (entrance) {
    case 'north':
      connections.north = { position: new THREE.Vector3(TILE_SIZE, 0, 0), direction: 'north' };
      break;
    case 'south':
      connections.south = { position: new THREE.Vector3(TILE_SIZE, 0, 2 * TILE_SIZE), direction: 'south' };
      break;
    case 'east':
      connections.east = { position: new THREE.Vector3(2 * TILE_SIZE, 0, TILE_SIZE), direction: 'east' };
      break;
    case 'west':
      connections.west = { position: new THREE.Vector3(0, 0, TILE_SIZE), direction: 'west' };
      break;
  }

  const roomData: RoomMetadata = {
    name: `DeadEnd_${entrance}_${variant}`,
    dimensions: { width: 2, depth: 2, height: 1 },
    theme: 'stone_dungeon',
    difficulty: variant === 'treasure' ? 'reward' : 'normal',
    connections,
  };

  const room = RoomBuilder.createRoomGroup(roomData);
  const wallThickness = 0.15;

  // Floor (2x2 tiles)
  const floor = RoomBuilder.createFloor(
    TILE_SIZE,
    TILE_SIZE,
    2 * TILE_SIZE,
    2 * TILE_SIZE,
    materials.floor
  );
  room.add(floor);

  const addWall = (x: number, z: number, w: number, d: number) => {
    room.add(RoomBuilder.createWall(x, z, w, d, materials.wall));
  };

  // Build walls based on entrance direction
  // North wall
  if (entrance === 'north') {
    // Door in center, walls on sides
    addWall(0.25 * TILE_SIZE, 0, 0.5 * TILE_SIZE, wallThickness);
    addWall(1.75 * TILE_SIZE, 0, 0.5 * TILE_SIZE, wallThickness);
  } else {
    // Full wall
    addWall(TILE_SIZE, 0, 2 * TILE_SIZE, wallThickness);
  }

  // South wall
  if (entrance === 'south') {
    addWall(0.25 * TILE_SIZE, 2 * TILE_SIZE, 0.5 * TILE_SIZE, wallThickness);
    addWall(1.75 * TILE_SIZE, 2 * TILE_SIZE, 0.5 * TILE_SIZE, wallThickness);
  } else {
    addWall(TILE_SIZE, 2 * TILE_SIZE, 2 * TILE_SIZE, wallThickness);
  }

  // West wall
  if (entrance === 'west') {
    addWall(0, 0.25 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);
    addWall(0, 1.75 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);
  } else {
    addWall(0, TILE_SIZE, wallThickness, 2 * TILE_SIZE);
  }

  // East wall
  if (entrance === 'east') {
    addWall(2 * TILE_SIZE, 0.25 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);
    addWall(2 * TILE_SIZE, 1.75 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);
  } else {
    addWall(2 * TILE_SIZE, TILE_SIZE, wallThickness, 2 * TILE_SIZE);
  }

  // Corner pillars
  addWall(0, 0, wallThickness * 1.5, wallThickness * 1.5);
  addWall(2 * TILE_SIZE, 0, wallThickness * 1.5, wallThickness * 1.5);
  addWall(0, 2 * TILE_SIZE, wallThickness * 1.5, wallThickness * 1.5);
  addWall(2 * TILE_SIZE, 2 * TILE_SIZE, wallThickness * 1.5, wallThickness * 1.5);

  // Variant-specific decorations
  if (variant === 'treasure') {
    // Golden light for treasure rooms
    const light = new THREE.PointLight(0xffdd44, 0.8, 4);
    light.position.set(TILE_SIZE, 0.8, TILE_SIZE);
    room.add(light);
    
    // Mark for item spawning
    room.userData.spawnPoint = new THREE.Vector3(TILE_SIZE, 0.4, TILE_SIZE);
    room.userData.roomType = 'treasure';
  } else if (variant === 'shrine') {
    // Mystical blue light for shrines
    const light = new THREE.PointLight(0x4488ff, 0.7, 4);
    light.position.set(TILE_SIZE, 0.8, TILE_SIZE);
    room.add(light);
    
    room.userData.roomType = 'shrine';
  } else {
    // Standard lighting
    const light = new THREE.PointLight(0xff8844, 0.4, 3);
    light.position.set(TILE_SIZE, 0.7, TILE_SIZE);
    room.add(light);
  }

  return room;
}
