import * as THREE from 'three';
import { RoomBuilder, RoomMetadata, TILE_SIZE } from '../room';

/**
 * Creates a basic 2x2 square room with 4 doorways (one on each side).
 * This serves as a fundamental building block for the dungeon.
 */
export function createBasicRoom(materials: { floor: THREE.Material, wall: THREE.Material }): THREE.Group {
  // 1. Define Room Metadata
  const roomData: RoomMetadata = {
    name: 'BasicRoom_2x2',
    dimensions: { width: 2, depth: 2, height: 1 },
    theme: 'stone_dungeon',
    difficulty: 'beginner',
    connections: {
      north: { 
        position: new THREE.Vector3(TILE_SIZE, 0, 0), 
        direction: 'north' 
      },
      south: { 
        position: new THREE.Vector3(TILE_SIZE, 0, 2 * TILE_SIZE), 
        direction: 'south' 
      },
      east: { 
        position: new THREE.Vector3(2 * TILE_SIZE, 0, TILE_SIZE), 
        direction: 'east' 
      },
      west: { 
        position: new THREE.Vector3(0, 0, TILE_SIZE), 
        direction: 'west' 
      }
    }
  };

  // 2. Create Group Container
  const room = RoomBuilder.createRoomGroup(roomData);

  // 3. Build Geometry
  // Floor (2x2 tiles)
  // We place the floor center at (1, 0, 1) * TILE_SIZE
  const floor = RoomBuilder.createFloor(
    TILE_SIZE, // x center
    TILE_SIZE, // z center
    2 * TILE_SIZE, // width
    2 * TILE_SIZE, // depth
    materials.floor
  );
  room.add(floor);

  // Walls
  // We need to leave gaps for doors at the center of each side.
  // A 2x2 room is 2 units wide.
  // North Wall (z=0): Needs gap at x=1. Segments: [0-0.5] gap [1.5-2] ? 
  // Actually, let's keep it simple: 
  // Corners are walls. Doorways are open.
  
  // Corner Pillars (0.5 x 0.5 size for simplicity in this style)
  const wallThickness = 0.2;
  const halfTile = TILE_SIZE / 2;

  // Helper to place a wall segment
  const addWall = (x: number, z: number, w: number, d: number) => {
    room.add(RoomBuilder.createWall(x, z, w, d, materials.wall));
  };

  // North Wall Segments (z=0)
  // Full width is 2.0. Door is at center (x=1.0), width 1.0 (one tile).
  // So we actually have open walls for this basic room if it's 2x2 and doors are 1x1.
  // But let's make corners.
  
  // Corner NW
  addWall(0, 0, wallThickness, wallThickness);
  // Corner NE
  addWall(2 * TILE_SIZE, 0, wallThickness, wallThickness);
  // Corner SW
  addWall(0, 2 * TILE_SIZE, wallThickness, wallThickness);
  // Corner SE
  addWall(2 * TILE_SIZE, 2 * TILE_SIZE, wallThickness, wallThickness);

  // To make it look like a room, let's fill the corners a bit more
  // North Wall (Left of door, Right of door)
  // Door is at x=1 (center of tile 1? No, 2x2 tiles: 0..1, 1..2)
  // Door centers: North=(1,0), South=(1,2), East=(2,1), West=(0,1)
  
  // North Wall parts (z=0)
  addWall(0.25 * TILE_SIZE, 0, 0.5 * TILE_SIZE, wallThickness); // Left of North door
  addWall(1.75 * TILE_SIZE, 0, 0.5 * TILE_SIZE, wallThickness); // Right of North door

  // South Wall parts (z=2)
  addWall(0.25 * TILE_SIZE, 2 * TILE_SIZE, 0.5 * TILE_SIZE, wallThickness);
  addWall(1.75 * TILE_SIZE, 2 * TILE_SIZE, 0.5 * TILE_SIZE, wallThickness);

  // West Wall parts (x=0)
  addWall(0, 0.25 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);
  addWall(0, 1.75 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);

  // East Wall parts (x=2)
  addWall(2 * TILE_SIZE, 0.25 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);
  addWall(2 * TILE_SIZE, 1.75 * TILE_SIZE, wallThickness, 0.5 * TILE_SIZE);

  // 4. Add Lighting
  const light = new THREE.PointLight(0xffaa00, 0.5, 4);
  light.position.set(TILE_SIZE, 0.8, TILE_SIZE);
  room.add(light);

  return room;
}
