// ============================================================================
// INTEGRATION GUIDE - Adding Level Loader to Your Dungeon Crawler
// ============================================================================

// STEP 1: Include the loader in your HTML head
/*
<script src="dungeon_level_loader.js"></script>
*/

// STEP 2: Load your map JSON - Choose your preferred method

// METHOD A: Fetch from file
async function loadMapFromFile() {
    const response = await fetch('map_data.json');
    return await response.json();
}

// METHOD B: Inline JSON (copy your JSON directly into your code)
const mapData = {
    "config": {
        "width": 32,
        "height": 32,
        "seed": 12345,
        "scale": 0.1,
        "waterLevel": 0.35,
        "forestDensity": 0.4,
        "mode": "dungeon"
    },
    "map": [ /* your 32x32 map array here */ ],
    "tileSize": 32
};

// METHOD C: Let user upload JSON file (browser UI)
function createFileUploadInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const mapData = JSON.parse(text);
        loadLevel(mapData);
    });
    document.body.appendChild(input);
}

// STEP 3: Initialize loader in your game startup

// In your main game class or initialization function:
let levelLoader;

async function initializeDungeonLevel(mapJsonData) {
    // Create loader with your scene and collision system
    levelLoader = new DungeonLevelLoader(scene, collisionSystem);
    
    // Load the level from JSON
    const levelGroup = await levelLoader.loadFromJSON(mapJsonData);
    
    // Add lighting to the level
    levelLoader.addLighting();
    
    // Set player spawn position
    const spawnPoint = levelLoader.getSpawnPoint();
    player.position.copy(spawnPoint);
    
    // Verify collision bodies were registered
    console.log('Level loaded with collision bodies:', levelLoader.collisionBodies.length);
    
    return levelGroup;
}

// STEP 4: Full game startup example

class DungeonGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Your collision system
        this.collisionSystem = new CollisionSystem(); // or whatever your system is
        
        this.levelLoader = null;
        this.player = null;
    }
    
    async start(mapJsonData) {
        // Initialize level
        await this.initializeDungeonLevel(mapJsonData);
        
        // Initialize player
        this.initializePlayer();
        
        // Start game loop
        this.gameLoop();
    }
    
    async initializeDungeonLevel(mapJsonData) {
        this.levelLoader = new DungeonLevelLoader(this.scene, this.collisionSystem);
        await this.levelLoader.loadFromJSON(mapJsonData);
        this.levelLoader.addLighting();
    }
    
    initializePlayer() {
        // Create player
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x0088ff });
        this.player = new THREE.Mesh(geometry, material);
        
        // Position at spawn point
        const spawnPoint = this.levelLoader.getSpawnPoint();
        this.player.position.copy(spawnPoint);
        
        this.scene.add(this.player);
        
        // Setup camera to follow player
        this.camera.position.copy(this.player.position);
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        // Update player position
        this.player.position.y = 1.5; // Keep at eye level
        this.camera.position.copy(this.player.position);
        
        // Your game logic here
        
        this.renderer.render(this.scene, this.camera);
    }
}

// STEP 5: Launch the game

// Option A: Auto-load from file
window.addEventListener('DOMContentLoaded', async () => {
    const mapData = await (await fetch('map_data.json')).json();
    const game = new DungeonGame();
    await game.start(mapData);
});

// Option B: Load from button click
document.getElementById('loadButton').addEventListener('click', async () => {
    const mapData = await (await fetch('map_data.json')).json();
    const game = new DungeonGame();
    await game.start(mapData);
});

// STEP 6: Customizing the loader for your game

// If you want different wall heights:
levelLoader.createWall = function(x, z, size) {
    const geometry = new THREE.BoxGeometry(size, 5, size); // Taller walls
    const material = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x + size / 2, 2.5, z + size / 2);
    this.levelGroup.add(mesh);
    this.wallCount++;
};

// If you want textured walls:
const textureLoader = new THREE.TextureLoader();
const wallTexture = textureLoader.load('stone_texture.png');
const material = new THREE.MeshStandardMaterial({ map: wallTexture });

// If you want to add details to floors (cracks, marks, etc.):
levelLoader.createFloor = function(x, z, size) {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
        color: 0x5a4937,
        roughness: 0.95,
        metalness: 0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x + size / 2, 0.01, z + size / 2); // Slightly above collision plane
    this.levelGroup.add(mesh);
    this.floorCount++;
};

// STEP 7: Extending with new tile types

// In your map JSON, add a new tile type like "door" or "treasure"
// Then in your loader instance, add a method:

levelLoader.createDoor = function(x, z, size) {
    const geometry = new THREE.BoxGeometry(size * 0.8, 3, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x + size / 2, 1.5, z + size / 2);
    this.levelGroup.add(mesh);
};

// Then add to the switch statement in loadFromJSON():
// case 'door':
//     this.createDoor(worldX, worldZ, tileSize);
//     break;

// ============================================================================
// DEBUGGING - Console tools
// ============================================================================

// Check what was loaded
function debugLevel() {
    console.log('Level stats:');
    console.log('- Walls:', levelLoader.wallCount);
    console.log('- Floors:', levelLoader.floorCount);
    console.log('- Collision bodies:', levelLoader.collisionBodies.length);
    console.log('- Level group children:', levelLoader.levelGroup.children.length);
    
    // Visualize collision bodies
    levelLoader.collisionBodies.forEach((body, i) => {
        console.log(`Body ${i}:`, body.type, 'at', body.position);
    });
}

// ============================================================================
