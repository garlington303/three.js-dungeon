/**
 * Level Loader - JSON-based dungeon loading for Three.js
 * Integrates with existing game architecture
 */

import * as THREE from 'three';
import type { SceneType } from './game';

export interface LevelConfig {
  width: number;
  height: number;
  cellSize: number;
  wallHeight: number;
  playerSpawn?: {
    x: number;
    z: number;
    facing: number;
  };
}

export interface EnemySpawn {
  type: string;
  gridX: number;
  gridZ: number;
}

export interface LevelData {
  name: string;
  config: LevelConfig;
  tileTypes: Record<string, string>;
  map: number[][];
  enemies?: EnemySpawn[];
}

export interface LoadedLevel {
  name: string;
  mapData: number[][];
  config: LevelConfig;
  enemies: EnemySpawn[];
}

export class LevelLoader {
  private static levelCache = new Map<string, LevelData>();

  /**
   * Load a level from JSON file
   */
  static async loadLevel(levelPath: string): Promise<LoadedLevel> {
    // Check cache first
    if (this.levelCache.has(levelPath)) {
      const cached = this.levelCache.get(levelPath)!;
      return this.processLevelData(cached);
    }

    try {
      const response = await fetch(levelPath);
      if (!response.ok) {
        throw new Error(`Failed to load level: ${response.statusText}`);
      }

      const levelData: LevelData = await response.json();
      
      // Validate level data
      this.validateLevelData(levelData);
      
      // Cache it
      this.levelCache.set(levelPath, levelData);
      
      return this.processLevelData(levelData);
    } catch (error) {
      console.error('Error loading level:', error);
      throw error;
    }
  }

  /**
   * Load the first dungeon level
   */
  static async loadDungeon1(): Promise<LoadedLevel> {
    return this.loadLevel('/src/assets/levels/dungeon1.json');
  }

  /**
   * Validate level data structure
   */
  private static validateLevelData(data: LevelData): void {
    if (!data.config || !data.map) {
      throw new Error('Invalid level data: missing config or map');
    }
    
    if (data.map.length !== data.config.height) {
      throw new Error(`Map height mismatch: expected ${data.config.height}, got ${data.map.length}`);
    }
    
    for (let i = 0; i < data.map.length; i++) {
      if (data.map[i].length !== data.config.width) {
        throw new Error(`Map width mismatch at row ${i}: expected ${data.config.width}, got ${data.map[i].length}`);
      }
    }
  }

  /**
   * Process raw level data into game-ready format
   */
  private static processLevelData(data: LevelData): LoadedLevel {
    return {
      name: data.name,
      mapData: data.map,
      config: data.config,
      enemies: data.enemies || [],
    };
  }

  /**
   * Convert grid coordinates to world position (center of cell)
   */
  static gridToWorld(gridX: number, gridZ: number, cellSize: number): THREE.Vector3 {
    return new THREE.Vector3(
      gridX * cellSize + cellSize * 0.5,
      0,
      gridZ * cellSize + cellSize * 0.5
    );
  }

  /**
   * Get spawn position from level data
   */
  static getSpawnPosition(level: LoadedLevel): THREE.Vector3 {
    if (level.config.playerSpawn) {
      return new THREE.Vector3(
        level.config.playerSpawn.x,
        0,
        level.config.playerSpawn.z
      );
    }
    
    // Default spawn in center of first empty cell
    for (let z = 0; z < level.config.height; z++) {
      for (let x = 0; x < level.config.width; x++) {
        if (level.mapData[z][x] === 0) {
          return this.gridToWorld(x, z, level.config.cellSize);
        }
      }
    }
    
    // Fallback to center
    return new THREE.Vector3(
      level.config.width * level.config.cellSize * 0.5,
      0,
      level.config.height * level.config.cellSize * 0.5
    );
  }

  /**
   * Get spawn facing angle
   */
  static getSpawnFacing(level: LoadedLevel): number {
    return level.config.playerSpawn?.facing ?? Math.PI;
  }

  /**
   * Clear level cache (for development/hot reload)
   */
  static clearCache(): void {
    this.levelCache.clear();
  }
}
