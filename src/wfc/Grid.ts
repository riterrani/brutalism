import { Cell, Direction, DIRECTION_OFFSETS, TileDef, cellKey } from './types';

export class Grid {
  readonly sizeX: number;
  readonly sizeY: number;
  readonly sizeZ: number;
  private cells: Map<string, Cell> = new Map();

  constructor(sizeX: number, sizeY: number, sizeZ: number, tiles: TileDef[]) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.initialize(tiles);
  }

  private initialize(tiles: TileDef[]): void {
    const maxY = this.sizeY - 1;

    for (let y = 0; y < this.sizeY; y++) {
      for (let x = 0; x < this.sizeX; x++) {
        for (let z = 0; z < this.sizeZ; z++) {
          // Filter tiles by Y-level constraints
          const possible = new Set<string>();

          for (const tile of tiles) {
            if (tile.minY !== null && y < tile.minY) continue;
            if (tile.maxY !== null && y > tile.maxY) continue;
            if (tile.roofOnly && y !== maxY) continue;
            // Ground-only tiles (maxY === 0) should only be at Y=0
            if (tile.maxY === 0 && y !== 0) continue;
            possible.add(tile.id);
          }

          const key = cellKey(x, y, z);
          this.cells.set(key, {
            x,
            y,
            z,
            collapsed: false,
            possibleTiles: possible,
          });
        }
      }
    }
  }

  getCell(x: number, y: number, z: number): Cell | undefined {
    return this.cells.get(cellKey(x, y, z));
  }

  getCellByKey(key: string): Cell | undefined {
    return this.cells.get(key);
  }

  getAllCells(): Cell[] {
    return Array.from(this.cells.values());
  }

  getUncollapsedCells(): Cell[] {
    return this.getAllCells().filter((c) => !c.collapsed);
  }

  getNeighbor(cell: Cell, direction: Direction): Cell | undefined {
    const [dx, dy, dz] = DIRECTION_OFFSETS[direction];
    const nx = cell.x + dx;
    const ny = cell.y + dy;
    const nz = cell.z + dz;

    if (nx < 0 || nx >= this.sizeX) return undefined;
    if (ny < 0 || ny >= this.sizeY) return undefined;
    if (nz < 0 || nz >= this.sizeZ) return undefined;

    return this.getCell(nx, ny, nz);
  }

  collapse(cell: Cell, tileId: string): void {
    cell.possibleTiles = new Set([tileId]);
    cell.collapsed = true;
  }

  constrain(cell: Cell, tileId: string): boolean {
    if (!cell.possibleTiles.has(tileId)) return false;
    cell.possibleTiles.delete(tileId);
    return true; // changed
  }

  // Build result map: "x,y,z" -> tileId
  getResultMap(): Map<string, string> {
    const result = new Map<string, string>();
    for (const [key, cell] of this.cells) {
      if (cell.collapsed && cell.possibleTiles.size === 1) {
        result.set(key, cell.possibleTiles.values().next().value!);
      }
    }
    return result;
  }
}
