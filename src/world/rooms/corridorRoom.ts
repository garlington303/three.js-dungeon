import * as THREE from 'three';
import { RoomBuilder, RoomMetadata, TILE_SIZE, WALL_HEIGHT } from '../room';

/**
 * Creates a straight corridor (1 tile wide, 3 tiles long).
 * Exits on north and south ends.
 */
export function createCorridorNS(materials: { floor: THREE.Material, wall: THREE.Material }): THREE.Group {
  const roomData: RoomMetadata = {
    name: 'Corridor_NS',
    dimensions: { width: 1, depth: 3, height: 1 },
    theme: 'stone_dungeon',
    difficulty: 'beginner',
    connections: {
      north: { position: new THREE.Vector3(0.5 * TILE_SIZE, 0, 0), direction: 'north' },
      south: { position: new THREE.Vector3(0.5 * TILE_SIZE, 0, 3 * TILE_SIZE), direction: 'south' },
      east: null,
      west: null,
    }
  };

  const room = RoomBuilder.createRoomGroup(roomData);
  const wallThickness = 0.15;

  // Floor (1x3 tiles)
  const floor = RoomBuilder.createFloor(
    0.5 * TILE_SIZE,
    1.5 * TILE_SIZE,
    TILE_SIZE,
    3 * TILE_SIZE,
    materials.floor
  );
  room.add(floor);

  // West wall (full length)
  room.add(RoomBuilder.createWall(0, 1.5 * TILE_SIZE, wallThickness, 3 * TILE_SIZE, materials.wall));
  
  // East wall (full length)
  room.add(RoomBuilder.createWall(TILE_SIZE, 1.5 * TILE_SIZE, wallThickness, 3 * TILE_SIZE, materials.wall));

  // Dim corridor lighting
  const light = new THREE.PointLight(0xff8844, 0.3, 3);
  light.position.set(0.5 * TILE_SIZE, 0.7, 1.5 * TILE_SIZE);
  room.add(light);

  return room;
}

/**
 * Creates an east-west corridor (3 tiles wide, 1 tile deep).
 * Exits on east and west ends.
 */
export function createCorridorEW(materials: { floor: THREE.Material, wall: THREE.Material }): THREE.Group {
  const roomData: RoomMetadata = {
    name: 'Corridor_EW',
    dimensions: { width: 3, depth: 1, height: 1 },
    theme: 'stone_dungeon',
    difficulty: 'beginner',
    connections: {
      north: null,
      south: null,
      east: { position: new THREE.Vector3(3 * TILE_SIZE, 0, 0.5 * TILE_SIZE), direction: 'east' },
      west: { position: new THREE.Vector3(0, 0, 0.5 * TILE_SIZE), direction: 'west' },
    }
  };

  const room = RoomBuilder.createRoomGroup(roomData);
  const wallThickness = 0.15;

  // Floor (3x1 tiles)
  const floor = RoomBuilder.createFloor(
    1.5 * TILE_SIZE,
    0.5 * TILE_SIZE,
    3 * TILE_SIZE,
    TILE_SIZE,
    materials.floor
  );
  room.add(floor);

  // North wall (full length)
  room.add(RoomBuilder.createWall(1.5 * TILE_SIZE, 0, 3 * TILE_SIZE, wallThickness, materials.wall));
  
  // South wall (full length)
  room.add(RoomBuilder.createWall(1.5 * TILE_SIZE, TILE_SIZE, 3 * TILE_SIZE, wallThickness, materials.wall));

  // Dim corridor lighting
  const light = new THREE.PointLight(0xff8844, 0.3, 3);
  light.position.set(1.5 * TILE_SIZE, 0.7, 0.5 * TILE_SIZE);
  room.add(light);

  return room;
}
