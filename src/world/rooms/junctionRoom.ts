import * as THREE from 'three';
import { RoomBuilder, RoomMetadata, TILE_SIZE } from '../room';

/**
 * Creates a 3x3 junction/hub room with exits in all 4 directions.
 * Central crossroads area for dungeon intersections.
 */
export function createJunctionRoom(materials: { floor: THREE.Material, wall: THREE.Material }): THREE.Group {
  const roomData: RoomMetadata = {
    name: 'Junction_3x3',
    dimensions: { width: 3, depth: 3, height: 1 },
    theme: 'stone_dungeon',
    difficulty: 'normal',
    connections: {
      north: { position: new THREE.Vector3(1.5 * TILE_SIZE, 0, 0), direction: 'north' },
      south: { position: new THREE.Vector3(1.5 * TILE_SIZE, 0, 3 * TILE_SIZE), direction: 'south' },
      east: { position: new THREE.Vector3(3 * TILE_SIZE, 0, 1.5 * TILE_SIZE), direction: 'east' },
      west: { position: new THREE.Vector3(0, 0, 1.5 * TILE_SIZE), direction: 'west' },
    }
  };

  const room = RoomBuilder.createRoomGroup(roomData);
  const wallThickness = 0.15;
  const doorWidth = TILE_SIZE; // 1 tile wide doors

  // Floor (3x3 tiles)
  const floor = RoomBuilder.createFloor(
    1.5 * TILE_SIZE,
    1.5 * TILE_SIZE,
    3 * TILE_SIZE,
    3 * TILE_SIZE,
    materials.floor
  );
  room.add(floor);

  // Helper for wall placement
  const addWall = (x: number, z: number, w: number, d: number) => {
    room.add(RoomBuilder.createWall(x, z, w, d, materials.wall));
  };

  // North wall with center door gap
  // Left segment: x = 0 to 1 (width 1), Right segment: x = 2 to 3 (width 1)
  addWall(0.5 * TILE_SIZE, 0, TILE_SIZE, wallThickness);
  addWall(2.5 * TILE_SIZE, 0, TILE_SIZE, wallThickness);

  // South wall with center door gap
  addWall(0.5 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE, wallThickness);
  addWall(2.5 * TILE_SIZE, 3 * TILE_SIZE, TILE_SIZE, wallThickness);

  // West wall with center door gap
  addWall(0, 0.5 * TILE_SIZE, wallThickness, TILE_SIZE);
  addWall(0, 2.5 * TILE_SIZE, wallThickness, TILE_SIZE);

  // East wall with center door gap
  addWall(3 * TILE_SIZE, 0.5 * TILE_SIZE, wallThickness, TILE_SIZE);
  addWall(3 * TILE_SIZE, 2.5 * TILE_SIZE, wallThickness, TILE_SIZE);

  // Corner pillars for visual interest
  addWall(0, 0, wallThickness * 2, wallThickness * 2);
  addWall(3 * TILE_SIZE, 0, wallThickness * 2, wallThickness * 2);
  addWall(0, 3 * TILE_SIZE, wallThickness * 2, wallThickness * 2);
  addWall(3 * TILE_SIZE, 3 * TILE_SIZE, wallThickness * 2, wallThickness * 2);

  // Central pillar (optional decorative element)
  addWall(1.5 * TILE_SIZE, 1.5 * TILE_SIZE, 0.3, 0.3);

  // Brighter hub lighting
  const light = new THREE.PointLight(0xffcc66, 0.6, 5);
  light.position.set(1.5 * TILE_SIZE, 0.9, 1.5 * TILE_SIZE);
  room.add(light);

  return room;
}
