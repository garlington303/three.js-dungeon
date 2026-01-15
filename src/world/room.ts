import * as THREE from 'three';

// ============================================================================
// ROOM SYSTEM TYPES & UTILITIES
// ============================================================================

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface RoomConnection {
  position: THREE.Vector3;
  direction: Direction;
  connectedTo?: string; // ID of the connected room
}

export interface RoomDimensions {
  width: number;  // in tiles
  depth: number;  // in tiles
  height: number; // in tiles
}

/**
 * Room metadata used when defining room templates.
 * Does NOT include the group reference (that's added by RoomManager).
 */
export interface RoomMetadata {
  name: string;
  dimensions: RoomDimensions;
  connections: Record<Direction, RoomConnection | null>;
  theme: string;
  difficulty: string;
}

/**
 * Complete room data including the Three.js group reference.
 * Used by RoomManager for tracking active rooms.
 */
export interface RoomData extends RoomMetadata {
  group: THREE.Group; // The actual Three.js group containing this room's geometry
}

export const TILE_SIZE = 1.0; // Matching CONFIG.CELL_SIZE in game.ts
export const WALL_HEIGHT = 1.0; // Matching CONFIG.WALL_HEIGHT in game.ts

/**
 * Base helper to create a standardized room group
 */
export class RoomBuilder {
  static createRoomGroup(data: RoomMetadata): THREE.Group {
    const room = new THREE.Group();
    room.name = data.name;
    room.userData = {
      ...data,
      isRoom: true
    };
    return room;
  }

  /**
   * Creates a wall with an invisible collision mesh
   */
  static createWall(
    x: number, 
    z: number, 
    width: number, 
    depth: number, 
    material: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    
    // Visual Mesh
    const geometry = new THREE.BoxGeometry(width, WALL_HEIGHT, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = WALL_HEIGHT / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Collision Mesh (Invisible)
    const collisionGeo = new THREE.BoxGeometry(width, WALL_HEIGHT, depth);
    const collisionMat = new THREE.MeshBasicMaterial({ visible: false });
    const collisionMesh = new THREE.Mesh(collisionGeo, collisionMat);
    collisionMesh.position.y = WALL_HEIGHT / 2;
    collisionMesh.userData = { isCollisionMesh: true, type: 'wall' };
    group.add(collisionMesh);

    group.position.set(x, 0, z);
    return group;
  }

  /**
   * Creates a floor tile with collision
   */
  static createFloor(
    x: number, 
    z: number, 
    width: number, 
    depth: number, 
    material: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();

    // Visual Mesh
    const geometry = new THREE.PlaneGeometry(width, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Collision Mesh (Invisible - slightly lower to prevent z-fighting if needed, or same level)
    // Note: Floor usually doesn't need collision for horizontal movement, 
    // but good for raycasting "what am I standing on"
    const collisionGeo = new THREE.PlaneGeometry(width, depth);
    const collisionMat = new THREE.MeshBasicMaterial({ visible: false });
    const collisionMesh = new THREE.Mesh(collisionGeo, collisionMat);
    collisionMesh.rotation.x = -Math.PI / 2;
    collisionMesh.userData = { isCollisionMesh: true, type: 'floor' };
    group.add(collisionMesh);

    group.position.set(x, 0, z);
    return group;
  }
}
