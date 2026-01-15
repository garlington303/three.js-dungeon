import * as THREE from 'three';
import { RoomData, RoomMetadata } from './room';

interface CollisionBox {
  box: THREE.Box3;
  mesh: THREE.Object3D;
}

export class RoomManager {
  private scene: THREE.Scene;
  private rooms: RoomData[] = [];
  private collisionBoxes: CollisionBox[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Add a room group to the scene and register its collision meshes.
   * The room's THREE.Group should be positioned/rotated BEFORE calling this,
   * as we cache the world-space bounding boxes for static collision.
   * 
   * @param roomGroup The THREE.Group returned by a room factory (e.g., createBasicRoom)
   */
  addRoom(roomGroup: THREE.Group): void {
    // Extract RoomMetadata from userData (set by RoomBuilder.createRoomGroup)
    const userData = roomGroup.userData as Partial<RoomMetadata>;
    
    const roomData: RoomData = {
      name: userData.name ?? roomGroup.name ?? 'UnnamedRoom',
      dimensions: userData.dimensions ?? { width: 1, depth: 1, height: 1 },
      connections: userData.connections ?? { north: null, south: null, east: null, west: null },
      theme: userData.theme ?? 'default',
      difficulty: userData.difficulty ?? 'normal',
      group: roomGroup,
    };
    
    this.rooms.push(roomData);
    this.scene.add(roomGroup);
    
    // Ensure world matrices are up to date so bounding boxes are correct
    roomGroup.updateMatrixWorld(true);
    
    const boxesBefore = this.collisionBoxes.length;
    
    roomGroup.traverse((child) => {
      if (child.userData.isCollisionMesh) {
        // Skip floor collision meshes for player movement checks — floors
        // are useful for raycasts but should not block horizontal movement.
        if (child.userData.type === 'floor') return;

        // Create a precise bounding box for this wall/obstacle segment
        const box = new THREE.Box3().setFromObject(child);
        this.collisionBoxes.push({ box, mesh: child });
      }
    });
    
    const boxesAdded = this.collisionBoxes.length - boxesBefore;
    console.log(`RoomManager: Added "${roomData.name}" with ${boxesAdded} collision boxes (${this.collisionBoxes.length} total).`);
  }

  /**
   * Check if a circle at (x, z) with given radius collides with any room geometry.
   * Returns true if collision detected.
   */
  checkCollision(x: number, z: number, radius: number = 0.2): boolean {
    // Simple optimization: only check boxes that are close?
    // For now, linear scan is fine for a few rooms.
    
    for (const { box, mesh } of this.collisionBoxes) {
      // Check if the circle overlaps the AABB in X/Z plane
      // We expand the box by the radius to simplify to a point-in-box check
      if (x >= box.min.x - radius && x <= box.max.x + radius &&
          z >= box.min.z - radius && z <= box.max.z + radius) {
        console.log(`[RoomManager] Collision at (${x.toFixed(2)}, ${z.toFixed(2)}) with box:`, {
          min: { x: box.min.x.toFixed(2), z: box.min.z.toFixed(2) },
          max: { x: box.max.x.toFixed(2), z: box.max.z.toFixed(2) },
          meshType: mesh.userData.type,
          meshName: mesh.name
        });
        return true;
      }
    }
    
    return false;
  }
  
  update(dt: number): void {
    // Placeholder for future room logic (animations, triggers, etc.)
  }
}
