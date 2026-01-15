import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3, AbstractMesh, PointerEventTypes, LinesMesh } from '@babylonjs/core';

export enum TileType {
    Empty = 0,
    StoneWall = 1,
    BrickWall = 2,
    WoodWall = 3,
    Door = 4
}

export interface LevelConfig {
    width: number;
    height: number;
    cellSize: number;
    wallHeight: number;
    playerSpawn: { x: number, z: number, facing: number };
}

export class GridSystem {
    private scene: Scene;
    private gridMesh: LinesMesh | null = null;
    private groundMesh: Mesh | null = null;
    private tileMeshes: Map<string, AbstractMesh> = new Map();
    private spawnMarker: Mesh | null = null;
    private enemyMarkers: Map<string, Mesh> = new Map();
    
    // Data model
    public width: number = 16;
    public height: number = 16;
    public cellSize: number = 1.0;
    public mapData: number[][] = [];
    public playerSpawn: { x: number, z: number, facing: number } = { x: 1.5, z: 1.5, facing: 0 };
    public enemies: Array<{ type: string, gridX: number, gridZ: number }> = [];

    // Materials
    private materials: Map<number, StandardMaterial> = new Map();
    private highlightMesh!: Mesh;
    
    // Editor State
    public currentTool: TileType | 'spawn' | 'enemy' = TileType.StoneWall;
    public currentEnemyType: string = 'draugr';

    constructor(scene: Scene) {
        this.scene = scene;
        this.initMaterials();
        this.initGrid();
        this.initInteraction();
        this.createHighlight();
        
        // Initialize empty map
        this.resetMap();
    }

    private initMaterials() {
        // 1: Stone (Dark Grey)
        const matStone = new StandardMaterial("matStone", this.scene);
        matStone.diffuseColor = Color3.FromHexString("#4a4a4a");
        this.materials.set(TileType.StoneWall, matStone);

        // 2: Brick (Reddish Brown)
        const matBrick = new StandardMaterial("matBrick", this.scene);
        matBrick.diffuseColor = Color3.FromHexString("#8a4a3a");
        this.materials.set(TileType.BrickWall, matBrick);

        // 3: Wood (Brown)
        const matWood = new StandardMaterial("matWood", this.scene);
        matWood.diffuseColor = Color3.FromHexString("#5c4033");
        this.materials.set(TileType.WoodWall, matWood);

        // 4: Door (Blue/Cyan)
        const matDoor = new StandardMaterial("matDoor", this.scene);
        matDoor.diffuseColor = Color3.FromHexString("#00ffff");
        matDoor.alpha = 0.6;
        this.materials.set(TileType.Door, matDoor);

        // 0: Empty (Floor)
        const matFloor = new StandardMaterial("matFloor", this.scene);
        matFloor.diffuseColor = Color3.FromHexString("#333333");
        this.materials.set(TileType.Empty, matFloor);
    }

    private initGrid() {
        if (this.gridMesh) this.gridMesh.dispose();
        if (this.groundMesh) this.groundMesh.dispose();

        const fullWidth = this.width * this.cellSize;
        const fullHeight = this.height * this.cellSize;

        // Create invisible ground plane for raycasting
        this.groundMesh = MeshBuilder.CreateGround("ground", { 
            width: fullWidth, 
            height: fullHeight 
        }, this.scene);
        this.groundMesh.position.x = fullWidth / 2;
        this.groundMesh.position.z = fullHeight / 2;
        
        const groundMat = new StandardMaterial("groundMat", this.scene);
        groundMat.diffuseColor = new Color3(0.15, 0.15, 0.18);
        groundMat.specularColor = new Color3(0, 0, 0);
        this.groundMesh.material = groundMat;
        this.groundMesh.isPickable = true;

        // Grid lines
        const points = [];

        // Vertical lines
        for (let x = 0; x <= this.width; x++) {
            points.push([new Vector3(x * this.cellSize, 0.01, 0), new Vector3(x * this.cellSize, 0.01, fullHeight)]);
        }
        // Horizontal lines
        for (let z = 0; z <= this.height; z++) {
            points.push([new Vector3(0, 0.01, z * this.cellSize), new Vector3(fullWidth, 0.01, z * this.cellSize)]);
        }

        this.gridMesh = MeshBuilder.CreateLineSystem("grid", { lines: points }, this.scene);
        this.gridMesh.color = new Color3(0.3, 0.3, 0.35);
    }

    private createHighlight() {
        this.highlightMesh = MeshBuilder.CreateBox("highlight", { size: this.cellSize * 0.95, height: 0.1 }, this.scene);
        const mat = new StandardMaterial("highlightMat", this.scene);
        mat.diffuseColor = new Color3(1, 1, 0);
        mat.alpha = 0.3;
        mat.emissiveColor = new Color3(0.3, 0.3, 0);
        this.highlightMesh.material = mat;
        this.highlightMesh.isPickable = false;
        this.highlightMesh.isVisible = false;
    }

    private initInteraction() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERMOVE:
                    this.onPointerMove(pointerInfo);
                    break;
                case PointerEventTypes.POINTERDOWN:
                    this.onPointerDown(pointerInfo);
                    break;
            }
        });
    }

    private getGridPosition(point: Vector3): { x: number, z: number } | null {
        const x = Math.floor(point.x / this.cellSize);
        const z = Math.floor(point.z / this.cellSize);

        if (x >= 0 && x < this.width && z >= 0 && z < this.height) {
            return { x, z };
        }
        return null;
    }

    private onPointerMove(pointerInfo: any) {
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedPoint) {
            const gridPos = this.getGridPosition(pointerInfo.pickInfo.pickedPoint);
            if (gridPos) {
                this.highlightMesh.isVisible = true;
                this.highlightMesh.position.x = gridPos.x * this.cellSize + this.cellSize / 2;
                this.highlightMesh.position.z = gridPos.z * this.cellSize + this.cellSize / 2;
                this.highlightMesh.position.y = 0.05;
            } else {
                this.highlightMesh.isVisible = false;
            }
        }
    }

    private onPointerDown(pointerInfo: any) {
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedPoint) {
            if (pointerInfo.event.button === 0) {
                const gridPos = this.getGridPosition(pointerInfo.pickInfo.pickedPoint);
                if (gridPos) {
                    this.applyTool(gridPos.x, gridPos.z);
                }
            } else if (pointerInfo.event.button === 2) {
                // Right click to erase
                const gridPos = this.getGridPosition(pointerInfo.pickInfo.pickedPoint);
                if (gridPos) {
                    this.setTile(gridPos.x, gridPos.z, TileType.Empty);
                }
            }
        }
    }

    private applyTool(x: number, z: number) {
        if (typeof this.currentTool === 'number') {
            // It's a tile type
            this.setTile(x, z, this.currentTool);
        } else if (this.currentTool === 'spawn') {
            this.setPlayerSpawn(x, z);
        } else if (this.currentTool === 'enemy') {
            this.addEnemy(x, z, this.currentEnemyType);
        }
    }

    public setTile(x: number, z: number, type: TileType) {
        if (x < 0 || x >= this.width || z < 0 || z >= this.height) return;

        this.mapData[z][x] = type;
        this.updateTileVisual(x, z);
    }

    public setPlayerSpawn(x: number, z: number) {
        this.playerSpawn.x = x * this.cellSize + this.cellSize / 2;
        this.playerSpawn.z = z * this.cellSize + this.cellSize / 2;
        
        // Update spawn marker visual
        if (this.spawnMarker) this.spawnMarker.dispose();
        
        this.spawnMarker = MeshBuilder.CreateCylinder("spawnMarker", {
            height: 0.3,
            diameterTop: 0.3,
            diameterBottom: 0.5
        }, this.scene);
        this.spawnMarker.position = new Vector3(this.playerSpawn.x, 0.15, this.playerSpawn.z);
        
        const spawnMat = new StandardMaterial("spawnMat", this.scene);
        spawnMat.diffuseColor = new Color3(0, 1, 0);
        spawnMat.emissiveColor = new Color3(0, 0.3, 0);
        this.spawnMarker.material = spawnMat;
        this.spawnMarker.isPickable = false;
        
        console.log(`✓ Spawn set to ${this.playerSpawn.x}, ${this.playerSpawn.z}`);
    }

    public addEnemy(x: number, z: number, type: string) {
        // Remove existing enemy at this spot if any
        const existingKey = `${x},${z}`;
        if (this.enemyMarkers.has(existingKey)) {
            this.enemyMarkers.get(existingKey)!.dispose();
            this.enemyMarkers.delete(existingKey);
        }
        this.enemies = this.enemies.filter(e => e.gridX !== x || e.gridZ !== z);
        
        this.enemies.push({ type, gridX: x, gridZ: z });
        
        // Visual marker for enemy
        const marker = MeshBuilder.CreateSphere("enemyMarker", { diameter: 0.4 }, this.scene);
        marker.position = new Vector3(
            x * this.cellSize + this.cellSize / 2,
            0.3,
            z * this.cellSize + this.cellSize / 2
        );
        
        const enemyMat = new StandardMaterial("enemyMat", this.scene);
        enemyMat.diffuseColor = type === 'draugr' ? new Color3(0.5, 0.2, 0.5) : new Color3(0.8, 0.2, 0.2);
        enemyMat.emissiveColor = type === 'draugr' ? new Color3(0.15, 0.05, 0.15) : new Color3(0.2, 0.05, 0.05);
        marker.material = enemyMat;
        marker.isPickable = false;
        
        this.enemyMarkers.set(existingKey, marker);
        
        console.log(`✓ Added ${type} at ${x}, ${z}`);
    }

    private updateTileVisual(x: number, z: number) {
        const key = `${x},${z}`;
        const type = this.mapData[z][x];

        // Remove existing mesh
        if (this.tileMeshes.has(key)) {
            this.tileMeshes.get(key)!.dispose();
            this.tileMeshes.delete(key);
        }

        const posX = x * this.cellSize + this.cellSize / 2;
        const posZ = z * this.cellSize + this.cellSize / 2;

        let mesh: AbstractMesh;

        if (type === TileType.Empty) {
            mesh = MeshBuilder.CreateGround("floor", { width: this.cellSize, height: this.cellSize }, this.scene);
            mesh.position.set(posX, 0.02, posZ);
            if (this.materials.has(TileType.Empty)) {
                mesh.material = this.materials.get(TileType.Empty)!;
            }
        } else if (type === TileType.Door) {
            // Door frame shape + floor
            const floor = MeshBuilder.CreateGround("floor", { width: this.cellSize, height: this.cellSize }, this.scene);
            floor.position.set(posX, 0.02, posZ);
            if (this.materials.has(TileType.Empty)) {
                floor.material = this.materials.get(TileType.Empty)!;
            }

            const door = MeshBuilder.CreateBox("door", { width: this.cellSize, height: 2, depth: this.cellSize * 0.2 }, this.scene);
            door.rotation.y = Math.PI / 2;
            door.position.y = 1; // Relative to floor
            door.parent = floor;
            
            if (this.materials.has(TileType.Door)) {
                door.material = this.materials.get(TileType.Door)!;
            }
            
            mesh = floor;
        } else {
            // Wall block
            const wall = MeshBuilder.CreateBox("wall", { size: this.cellSize, height: 1 }, this.scene);
            wall.scaling.y = 1.0;
            wall.position.set(posX, 0.5, posZ);
            
            if (this.materials.has(type)) {
                wall.material = this.materials.get(type)!;
            }
            mesh = wall;
        }

        mesh.isPickable = true;
        this.tileMeshes.set(key, mesh);
    }

    public toggleGrid() {
        if (this.gridMesh) {
            this.gridMesh.isVisible = !this.gridMesh.isVisible;
        }
    }

    public resetMap(w: number = 16, h: number = 16) {
        this.width = w;
        this.height = h;
        this.mapData = Array(h).fill(0).map(() => Array(w).fill(0));
        
        // Clear all visuals
        this.tileMeshes.forEach(m => m.dispose());
        this.tileMeshes.clear();
        
        this.enemyMarkers.forEach(m => m.dispose());
        this.enemyMarkers.clear();
        
        if (this.spawnMarker) {
            this.spawnMarker.dispose();
            this.spawnMarker = null;
        }
        
        this.enemies = [];
        this.playerSpawn = { x: 1.5, z: 1.5, facing: 0 };
        
        this.initGrid();

        // Initialize visuals for empty map
        for (let z = 0; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                this.updateTileVisual(x, z);
            }
        }
    }
    
    public loadMap(map: number[][], config: LevelConfig, enemies: any[]) {
        this.width = config.width;
        this.height = config.height;
        this.cellSize = config.cellSize;
        this.mapData = JSON.parse(JSON.stringify(map)); // Deep copy
        this.playerSpawn = config.playerSpawn || { x: 1.5, z: 1.5, facing: 0 };
        this.enemies = enemies || [];

        // Clear and rebuild visuals
        this.tileMeshes.forEach(m => m.dispose());
        this.tileMeshes.clear();
        this.enemyMarkers.forEach(m => m.dispose());
        this.enemyMarkers.clear();
        if (this.spawnMarker) this.spawnMarker.dispose();
        
        this.initGrid();

        for (let z = 0; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                this.updateTileVisual(x, z);
            }
        }
        
        // Recreate spawn marker
        if (this.playerSpawn) {
            const gridX = Math.floor(this.playerSpawn.x / this.cellSize);
            const gridZ = Math.floor(this.playerSpawn.z / this.cellSize);
            this.setPlayerSpawn(gridX, gridZ);
        }
        
        // Recreate enemy markers
        this.enemies.forEach(e => {
            this.addEnemy(e.gridX, e.gridZ, e.type);
        });
        
        console.log(`✓ Loaded map ${this.width}x${this.height}`);
    }
}
