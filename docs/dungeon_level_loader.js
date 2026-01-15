// ============================================================================
// DUNGEON LEVEL LOADER - Complete Three.js JSON Map Importer
// ============================================================================
// Drop this into your Three.js project. Creates 3D dungeon from JSON map data.
// Usage: const levelGroup = await loadDungeonLevel(mapJsonData, scene, collisionSystem);
// ============================================================================

class DungeonLevelLoader {
    constructor(scene, collisionSystem = null) {
        this.scene = scene;
        this.collisionSystem = collisionSystem;
        this.levelGroup = new THREE.Group();
        this.collisionBodies = [];
        this.scene.add(this.levelGroup);
    }

    async loadFromJSON(jsonData) {
        // Parse JSON if it's a string
        const mapData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        const { config, map } = mapData;
        const { width, height, tileSize } = config;

        console.log(`Loading dungeon: ${width}x${height} grid, ${tileSize} unit tiles`);

        // Iterate through map and create geometry for each tile
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tileType = map[y][x];
                const worldX = x * tileSize;
                const worldZ = y * tileSize;

                switch (tileType) {
                    case 'wall':
                        this.createWall(worldX, worldZ, tileSize);
                        break;
                    case 'floor':
                        this.createFloor(worldX, worldZ, tileSize);
                        break;
                    case 'empty':
                        // Don't create geometry for empty space
                        break;
                    default:
                        console.warn(`Unknown tile type: ${tileType}`);
                }
            }
        }

        console.log(`✓ Level loaded. Walls: ${this.wallCount}, Floors: ${this.floorCount}`);
        return this.levelGroup;
    }

    wallCount = 0;
    floorCount = 0;

    createWall(x, z, size) {
        // Wall geometry: full height cube
        const geometry = new THREE.BoxGeometry(size, 3, size); // 3 units tall
        
        // Simple material - you can replace with textures later
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.8,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x + size / 2, 1.5, z + size / 2);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = 'wall';

        this.levelGroup.add(mesh);
        this.wallCount++;

        // Add collision body if collision system exists
        if (this.collisionSystem) {
            const collisionBody = {
                type: 'box',
                position: [x + size / 2, 1.5, z + size / 2],
                size: [size, 3, size],
                mesh: mesh
            };
            this.collisionBodies.push(collisionBody);
            this.collisionSystem.addBody(collisionBody);
        }
    }

    createFloor(x, z, size) {
        // Floor geometry: thin plane
        const geometry = new THREE.PlaneGeometry(size, size);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x6b5847,
            roughness: 0.9,
            metalness: 0
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        mesh.position.set(x + size / 2, 0, z + size / 2);
        mesh.receiveShadow = true;
        mesh.userData.type = 'floor';

        this.levelGroup.add(mesh);
        this.floorCount++;

        // Optionally add collision plane (walkable surface)
        if (this.collisionSystem) {
            const collisionBody = {
                type: 'plane',
                position: [x + size / 2, 0, z + size / 2],
                size: [size, size],
                mesh: mesh
            };
            this.collisionBodies.push(collisionBody);
        }
    }

    // Helper method to add lighting to the level
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.levelGroup.add(ambientLight);

        // Directional light (sunlight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(16, 4, 16);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 50;
        this.levelGroup.add(directionalLight);

        return { ambientLight, directionalLight };
    }

    // Helper method to set collision system
    setCollisionSystem(collisionSystem) {
        this.collisionSystem = collisionSystem;
        this.registerCollisionBodies();
    }

    registerCollisionBodies() {
        if (this.collisionSystem) {
            this.collisionBodies.forEach(body => {
                this.collisionSystem.addBody(body);
            });
        }
    }

    // Helper method to get spawn point (first floor tile)
    getSpawnPoint(defaultY = 1.5) {
        if (this.levelGroup.children.length === 0) return new THREE.Vector3(0, defaultY, 0);
        
        const floors = this.levelGroup.children.filter(mesh => mesh.userData.type === 'floor');
        if (floors.length === 0) return new THREE.Vector3(0, defaultY, 0);
        
        const spawnFloor = floors[0];
        return new THREE.Vector3(spawnFloor.position.x, defaultY, spawnFloor.position.z);
    }

    // Helper method to clear the level
    clear() {
        this.levelGroup.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        this.levelGroup.clear();
        this.wallCount = 0;
        this.floorCount = 0;
        this.collisionBodies = [];
    }
}

// ============================================================================
// USAGE EXAMPLE - Copy this into your main game file
// ============================================================================
/*

// In your game initialization:
const loader = new DungeonLevelLoader(scene, yourCollisionSystem);
const levelGroup = await loader.loadFromJSON(mapJsonData);
loader.addLighting();

// Get player spawn point
const spawnPoint = loader.getSpawnPoint();
player.position.copy(spawnPoint);

*/

// ============================================================================
// QUICK START - Minimal setup
// ============================================================================
/*

// Step 1: Include this file in your HTML
<script src="dungeon_level_loader.js"></script>

// Step 2: Load your JSON (fetch from file or include as variable)
fetch('map_data.json')
    .then(res => res.json())
    .then(mapData => {
        const loader = new DungeonLevelLoader(scene);
        loader.loadFromJSON(mapData);
        loader.addLighting();
    });

*/

// ============================================================================
// TILE TYPE SYSTEM - Easy to extend
// ============================================================================
// To add new tile types:
// 1. Add case in loadFromJSON() switch statement
// 2. Create corresponding createXXX() method
// 3. Add collision body if needed
//
// Example - Adding treasure chests:
// case 'treasure':
//     this.createTreasure(worldX, worldZ, tileSize);
//     break;
//
// createTreasure(x, z, size) {
//     const geometry = new THREE.BoxGeometry(size * 0.5, size * 0.3, size * 0.5);
//     const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
//     const mesh = new THREE.Mesh(geometry, material);
//     mesh.position.set(x + size / 2, 0.15, z + size / 2);
//     this.levelGroup.add(mesh);
// }
// ============================================================================
