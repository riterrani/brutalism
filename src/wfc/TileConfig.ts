import { Socket, TileDef, Direction } from './types';
import { ALL_TILES, DEFAULT_SOCKET_COMPAT, buildAdjacencyMap, AdjacencyMap } from './TileRegistry';
import {
  GRID_SIZE_X,
  GRID_SIZE_Z,
  GRID_SIZE_Y_DEFAULT,
} from '../utils/constants';

// Per-tile mutable state
export interface TileEntry {
  def: TileDef;
  enabled: boolean;
  weight: number;
  sockets?: Record<Direction, Socket[]>;
}

// Serializable config format
export interface TileConfigJSON {
  tiles: { id: string; enabled: boolean; weight: number; sockets?: Record<string, string[][]> }[];
  socketCompat: Record<string, string[]>;
  gridSizeX: number;
  gridSizeZ: number;
  gridSizeY: number;
}

export class TileConfig {
  private tiles: Map<string, TileEntry> = new Map();
  private socketCompat: Map<Socket, Set<Socket>>;
  gridSizeX: number = GRID_SIZE_X;
  gridSizeZ: number = GRID_SIZE_Z;
  gridSizeY: number = GRID_SIZE_Y_DEFAULT;

  constructor() {
    // Initialize from hardcoded defaults
    for (const tile of ALL_TILES) {
      this.tiles.set(tile.id, {
        def: tile,
        enabled: true,
        weight: tile.weight,
      });
    }

    // Deep-copy socket compatibility
    this.socketCompat = this.cloneSocketCompat(DEFAULT_SOCKET_COMPAT);
  }

  private cloneSocketCompat(src: Map<Socket, Set<Socket>>): Map<Socket, Set<Socket>> {
    const clone = new Map<Socket, Set<Socket>>();
    for (const [key, value] of src) {
      clone.set(key, new Set(value));
    }
    return clone;
  }

  // Get all tile entries (for UI iteration)
  getAllEntries(): TileEntry[] {
    return Array.from(this.tiles.values());
  }

  // Get entry by ID
  getEntry(id: string): TileEntry | undefined {
    return this.tiles.get(id);
  }

  // Set tile weight
  setWeight(id: string, weight: number): void {
    const entry = this.tiles.get(id);
    if (entry) entry.weight = weight;
  }

  // Set tile enabled
  setEnabled(id: string, enabled: boolean): void {
    const entry = this.tiles.get(id);
    if (entry) entry.enabled = enabled;
  }

  // Set tile sockets override
  setTileSocket(id: string, dir: Direction, sockets: Socket[]): void {
    const entry = this.tiles.get(id);
    if (entry) {
      if (!entry.sockets) {
        entry.sockets = JSON.parse(JSON.stringify(entry.def.sockets));
      }
      entry.sockets![dir] = sockets;
    }
  }

  // Set socket compatibility
  setSocketCompat(a: Socket, b: Socket, compatible: boolean): void {
    const setA = this.socketCompat.get(a);
    const setB = this.socketCompat.get(b);
    if (compatible) {
      setA?.add(b);
      setB?.add(a);
    } else {
      setA?.delete(b);
      setB?.delete(a);
    }
  }

  // Check if two sockets are compatible
  isSocketCompatible(a: Socket, b: Socket): boolean {
    return this.socketCompat.get(a)?.has(b) ?? false;
  }

  // Get the socket compat map (for adjacency building)
  getSocketCompat(): Map<Socket, Set<Socket>> {
    return this.socketCompat;
  }

  // Get the filtered tile list (enabled tiles with current weights applied)
  getActiveTiles(): TileDef[] {
    const result: TileDef[] = [];
    for (const entry of this.tiles.values()) {
      if (!entry.enabled) continue;
      // Return a copy of the def with the current weight and sockets
      result.push({ 
        ...entry.def, 
        weight: entry.weight,
        sockets: entry.sockets || entry.def.sockets 
      });
    }
    return result;
  }

  // Build adjacency map from current config state
  buildAdjacency(): AdjacencyMap {
    return buildAdjacencyMap(this.getActiveTiles(), this.socketCompat);
  }

  // Export to JSON
  toJSON(): TileConfigJSON {
    const tiles: TileConfigJSON['tiles'] = [];
    for (const entry of this.tiles.values()) {
      tiles.push({
        id: entry.def.id,
        enabled: entry.enabled,
        weight: entry.weight,
        sockets: entry.sockets as any,
      });
    }

    const socketCompat: Record<string, string[]> = {};
    for (const [key, value] of this.socketCompat) {
      socketCompat[key] = Array.from(value);
    }

    return {
      tiles,
      socketCompat,
      gridSizeX: this.gridSizeX,
      gridSizeZ: this.gridSizeZ,
      gridSizeY: this.gridSizeY,
    };
  }

  // Import from JSON
  fromJSON(json: TileConfigJSON): void {
    // Restore tile state
    for (const t of json.tiles) {
      const entry = this.tiles.get(t.id);
      if (entry) {
        entry.enabled = t.enabled;
        entry.weight = t.weight;
        if (t.sockets) {
          entry.sockets = t.sockets as any;
        }
      }
    }

    // Restore socket compat
    if (json.socketCompat) {
      this.socketCompat = new Map();
      for (const [key, values] of Object.entries(json.socketCompat)) {
        this.socketCompat.set(key as Socket, new Set(values as Socket[]));
      }
    }

    // Restore grid dimensions
    if (json.gridSizeX != null) this.gridSizeX = json.gridSizeX;
    if (json.gridSizeZ != null) this.gridSizeZ = json.gridSizeZ;
    if (json.gridSizeY != null) this.gridSizeY = json.gridSizeY;
  }
}
