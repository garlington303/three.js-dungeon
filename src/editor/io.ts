import { GridSystem, TileType, LevelConfig } from './grid';

export class IOSystem {
    private gridSystem: GridSystem;

    constructor(gridSystem: GridSystem) {
        this.gridSystem = gridSystem;
    }

    public exportToJSON(): string {
        const config: LevelConfig = {
            width: this.gridSystem.width,
            height: this.gridSystem.height,
            cellSize: this.gridSystem.cellSize,
            wallHeight: 1.0, // Hardcoded for now, or add to GridSystem state
            playerSpawn: this.gridSystem.playerSpawn
        };

        const levelData = {
            name: "Custom Dungeon",
            config: config,
            tileTypes: {
                "0": "empty",
                "1": "stone_wall",
                "2": "brick_wall",
                "3": "wood_wall",
                "4": "door_dungeon2"
            },
            map: this.gridSystem.mapData,
            enemies: this.gridSystem.enemies
        };

        return JSON.stringify(levelData, null, 2);
    }

    public importFromJSON(jsonString: string) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate basic structure
            if (!data.config || !data.map) {
                console.error("Invalid level data: missing config or map");
                alert("Invalid level file!");
                return;
            }

            this.gridSystem.loadMap(data.map, data.config, data.enemies);
            console.log("Level loaded successfully");
        } catch (e) {
            console.error("Failed to parse JSON", e);
            alert("Failed to parse JSON file!");
        }
    }

    public downloadLevel(filename: string = "dungeon.json") {
        const json = this.exportToJSON();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    public loadFromFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                this.importFromJSON(content);
            };
            reader.readAsText(file);
        };
        input.click();
    }
}
