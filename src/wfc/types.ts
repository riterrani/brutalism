// Socket types for tile face connections
export enum Socket {
  EMPTY = 'EMPTY',
  STRUCT = 'STRUCT',
  CONCRETE = 'CONCRETE',
  WINDOW = 'WINDOW',
  GLASS = 'GLASS',
  STAIRS = 'STAIRS',
  BRIDGE = 'BRIDGE',
  GROUND = 'GROUND',
}

// 3D directions for adjacency
export enum Direction {
  POS_X = 'POS_X', // +X
  NEG_X = 'NEG_X', // -X
  POS_Y = 'POS_Y', // +Y (up)
  NEG_Y = 'NEG_Y', // -Y (down)
  POS_Z = 'POS_Z', // +Z
  NEG_Z = 'NEG_Z', // -Z
}

// Tile definition: describes one module type
export interface TileDef {
  id: string;
  // Sockets per face — arrays to support multi-socket faces (e.g. CONCRETE|WINDOW)
  sockets: Record<Direction, Socket[]>;
  weight: number;
  // Y-level constraints: minY/maxY (null = no constraint)
  minY: number | null;
  maxY: number | null;
  // If true, tile can only appear at exactly maxY (the roof level)
  roofOnly: boolean;
}

// A single cell in the WFC grid
export interface Cell {
  x: number;
  y: number;
  z: number;
  collapsed: boolean;
  possibleTiles: Set<string>;
}

// Result of a WFC solve attempt
export interface SolveResult {
  success: boolean;
  grid: Map<string, string>; // "x,y,z" → tileId
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  // Designated observatory column (tallest forced-solid column)
  observatoryX: number;
  observatoryZ: number;
}

// Direction offset map
export const DIRECTION_OFFSETS: Record<Direction, [number, number, number]> = {
  [Direction.POS_X]: [1, 0, 0],
  [Direction.NEG_X]: [-1, 0, 0],
  [Direction.POS_Y]: [0, 1, 0],
  [Direction.NEG_Y]: [0, -1, 0],
  [Direction.POS_Z]: [0, 0, 1],
  [Direction.NEG_Z]: [0, 0, -1],
};

// Opposite direction lookup
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.POS_X]: Direction.NEG_X,
  [Direction.NEG_X]: Direction.POS_X,
  [Direction.POS_Y]: Direction.NEG_Y,
  [Direction.NEG_Y]: Direction.POS_Y,
  [Direction.POS_Z]: Direction.NEG_Z,
  [Direction.NEG_Z]: Direction.POS_Z,
};

// Key utility
export function cellKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}
