import { Socket, Direction, TileDef } from './types';

const S = Socket;
const D = Direction;

// Helper: create a sockets record with the same socket on all 4 side faces
function sideSockets(sides: Socket[], top: Socket[], bottom: Socket[]): Record<Direction, Socket[]> {
  return {
    [D.POS_Y]: top,
    [D.NEG_Y]: bottom,
    [D.POS_X]: sides,
    [D.NEG_X]: sides,
    [D.POS_Z]: sides,
    [D.NEG_Z]: sides,
  };
}

// ==========================================
// GROUND-LEVEL TILES (Y = 0)
// ==========================================

const PILOTI_CENTRAL: TileDef = {
  id: 'PILOTI_CENTRAL',
  sockets: sideSockets([S.EMPTY], [S.STRUCT], [S.GROUND]),
  weight: 1.5,
  minY: 0,
  maxY: 0,
  roofOnly: false,
};

const PILOTI_ESQUINA_PX_PZ: TileDef = {
  id: 'PILOTI_ESQUINA_PX_PZ',
  sockets: sideSockets([S.EMPTY], [S.STRUCT], [S.GROUND]),
  weight: 1.2,
  minY: 0,
  maxY: 0,
  roofOnly: false,
};

const PILOTI_ESQUINA_NX_PZ: TileDef = {
  id: 'PILOTI_ESQUINA_NX_PZ',
  sockets: sideSockets([S.EMPTY], [S.STRUCT], [S.GROUND]),
  weight: 1.2,
  minY: 0,
  maxY: 0,
  roofOnly: false,
};

const PILOTI_ESQUINA_NX_NZ: TileDef = {
  id: 'PILOTI_ESQUINA_NX_NZ',
  sockets: sideSockets([S.EMPTY], [S.STRUCT], [S.GROUND]),
  weight: 1.2,
  minY: 0,
  maxY: 0,
  roofOnly: false,
};

const PILOTI_ESQUINA_PX_NZ: TileDef = {
  id: 'PILOTI_ESQUINA_PX_NZ',
  sockets: sideSockets([S.EMPTY], [S.STRUCT], [S.GROUND]),
  weight: 1.2,
  minY: 0,
  maxY: 0,
  roofOnly: false,
};

const EMPTY_GROUND: TileDef = {
  id: 'EMPTY_GROUND',
  sockets: sideSockets([S.EMPTY], [S.EMPTY], [S.GROUND]),
  weight: 3.0,
  minY: 0,
  maxY: 0,
  roofOnly: false,
};

// ==========================================
// ==========================================
// HABITATION MODULES (Y >= 1)
// ==========================================

// Module with protruding balcony — 4 rotations
// Balcony face is pure EMPTY; other side faces use [CONCRETE, EMPTY] to allow edge placement
const MODULO_BALCON_PX: TileDef = {
  id: 'MODULO_BALCON_PX',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.EMPTY],
    [D.NEG_X]: [S.CONCRETE],
    [D.POS_Z]: [S.CONCRETE, S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

const MODULO_BALCON_NX: TileDef = {
  id: 'MODULO_BALCON_NX',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.CONCRETE],
    [D.NEG_X]: [S.EMPTY],
    [D.POS_Z]: [S.CONCRETE, S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

const MODULO_BALCON_PZ: TileDef = {
  id: 'MODULO_BALCON_PZ',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.CONCRETE, S.EMPTY],
    [D.NEG_X]: [S.CONCRETE, S.EMPTY],
    [D.POS_Z]: [S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

const MODULO_BALCON_NZ: TileDef = {
  id: 'MODULO_BALCON_NZ',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.CONCRETE, S.EMPTY],
    [D.NEG_X]: [S.CONCRETE, S.EMPTY],
    [D.POS_Z]: [S.CONCRETE],
    [D.NEG_Z]: [S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

// Glazed module with glass corners — 4 rotations
// Glass faces use [GLASS, EMPTY] so they can face air; concrete faces use [CONCRETE, EMPTY]
const MODULO_ACRISTADO_PX_PZ: TileDef = {
  id: 'MODULO_ACRISTADO_PX_PZ',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.GLASS, S.EMPTY],
    [D.NEG_X]: [S.CONCRETE, S.EMPTY],
    [D.POS_Z]: [S.GLASS, S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

const MODULO_ACRISTADO_NX_PZ: TileDef = {
  id: 'MODULO_ACRISTADO_NX_PZ',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.CONCRETE, S.EMPTY],
    [D.NEG_X]: [S.GLASS, S.EMPTY],
    [D.POS_Z]: [S.GLASS, S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

const MODULO_ACRISTADO_NX_NZ: TileDef = {
  id: 'MODULO_ACRISTADO_NX_NZ',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.CONCRETE, S.EMPTY],
    [D.NEG_X]: [S.GLASS, S.EMPTY],
    [D.POS_Z]: [S.CONCRETE, S.EMPTY],
    [D.NEG_Z]: [S.GLASS, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

const MODULO_ACRISTADO_PX_NZ: TileDef = {
  id: 'MODULO_ACRISTADO_PX_NZ',
  sockets: {
    [D.POS_Y]: [S.CONCRETE],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.GLASS, S.EMPTY],
    [D.NEG_X]: [S.CONCRETE, S.EMPTY],
    [D.POS_Z]: [S.CONCRETE, S.EMPTY],
    [D.NEG_Z]: [S.GLASS, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

// Glazed module with half-height band windows — 4 rotations (same sockets as ACRISTADO)
const MODULO_ACRISTADO_BAND_PX_PZ: TileDef = {
  id: 'MODULO_ACRISTADO_BAND_PX_PZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.GLASS, S.EMPTY], [D.NEG_X]: [S.CONCRETE, S.EMPTY], [D.POS_Z]: [S.GLASS, S.EMPTY], [D.NEG_Z]: [S.CONCRETE, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};
const MODULO_ACRISTADO_BAND_NX_PZ: TileDef = {
  id: 'MODULO_ACRISTADO_BAND_NX_PZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.CONCRETE, S.EMPTY], [D.NEG_X]: [S.GLASS, S.EMPTY], [D.POS_Z]: [S.GLASS, S.EMPTY], [D.NEG_Z]: [S.CONCRETE, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};
const MODULO_ACRISTADO_BAND_NX_NZ: TileDef = {
  id: 'MODULO_ACRISTADO_BAND_NX_NZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.CONCRETE, S.EMPTY], [D.NEG_X]: [S.GLASS, S.EMPTY], [D.POS_Z]: [S.CONCRETE, S.EMPTY], [D.NEG_Z]: [S.GLASS, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};
const MODULO_ACRISTADO_BAND_PX_NZ: TileDef = {
  id: 'MODULO_ACRISTADO_BAND_PX_NZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.GLASS, S.EMPTY], [D.NEG_X]: [S.CONCRETE, S.EMPTY], [D.POS_Z]: [S.CONCRETE, S.EMPTY], [D.NEG_Z]: [S.GLASS, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};

// Glazed module with full corner window (glass wraps around corner) — 4 rotations
const MODULO_ACRISTADO_ESQUINA_PX_PZ: TileDef = {
  id: 'MODULO_ACRISTADO_ESQUINA_PX_PZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.GLASS, S.EMPTY], [D.NEG_X]: [S.CONCRETE, S.EMPTY], [D.POS_Z]: [S.GLASS, S.EMPTY], [D.NEG_Z]: [S.CONCRETE, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};
const MODULO_ACRISTADO_ESQUINA_NX_PZ: TileDef = {
  id: 'MODULO_ACRISTADO_ESQUINA_NX_PZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.CONCRETE, S.EMPTY], [D.NEG_X]: [S.GLASS, S.EMPTY], [D.POS_Z]: [S.GLASS, S.EMPTY], [D.NEG_Z]: [S.CONCRETE, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};
const MODULO_ACRISTADO_ESQUINA_NX_NZ: TileDef = {
  id: 'MODULO_ACRISTADO_ESQUINA_NX_NZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.CONCRETE, S.EMPTY], [D.NEG_X]: [S.GLASS, S.EMPTY], [D.POS_Z]: [S.CONCRETE, S.EMPTY], [D.NEG_Z]: [S.GLASS, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};
const MODULO_ACRISTADO_ESQUINA_PX_NZ: TileDef = {
  id: 'MODULO_ACRISTADO_ESQUINA_PX_NZ',
  sockets: { [D.POS_Y]: [S.CONCRETE], [D.NEG_Y]: [S.CONCRETE], [D.POS_X]: [S.GLASS, S.EMPTY], [D.NEG_X]: [S.CONCRETE, S.EMPTY], [D.POS_Z]: [S.CONCRETE, S.EMPTY], [D.NEG_Z]: [S.GLASS, S.EMPTY] },
  weight: 1.2, minY: 1, maxY: null, roofOnly: false,
};

// Stair tower — strong vertical core
// Bottom uses [STAIRS, STRUCT] so it can start from structural support (pilotis/beams)
// Sides use [CONCRETE, EMPTY] for edge placement
const TORRE_ESCALERA: TileDef = {
  id: 'TORRE_ESCALERA',
  sockets: {
    [D.POS_Y]: [S.STAIRS],
    [D.NEG_Y]: [S.STAIRS, S.STRUCT],
    [D.POS_X]: [S.CONCRETE, S.EMPTY],
    [D.NEG_X]: [S.CONCRETE, S.EMPTY],
    [D.POS_Z]: [S.CONCRETE, S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE, S.EMPTY],
  },
  weight: 2.0,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

// Stair elbow — L-shaped stair landing
const CODO_ESCALERA: TileDef = {
  id: 'CODO_ESCALERA',
  sockets: {
    [D.POS_Y]: [S.STAIRS],
    [D.NEG_Y]: [S.STAIRS, S.STRUCT],
    [D.POS_X]: [S.CONCRETE, S.EMPTY],
    [D.NEG_X]: [S.CONCRETE, S.EMPTY],
    [D.POS_Z]: [S.CONCRETE, S.EMPTY],
    [D.NEG_Z]: [S.CONCRETE, S.EMPTY],
  },
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

// Cantilevered corridor along X
const PASILLO_VOLADIZO_X: TileDef = {
  id: 'PASILLO_VOLADIZO_X',
  sockets: {
    [D.POS_Y]: [S.EMPTY],
    [D.NEG_Y]: [S.EMPTY],
    [D.POS_X]: [S.BRIDGE],
    [D.NEG_X]: [S.BRIDGE],
    [D.POS_Z]: [S.EMPTY],
    [D.NEG_Z]: [S.EMPTY],
  },
  weight: 0.0,
  minY: 3,
  maxY: null,
  roofOnly: false,
};

// Cantilevered corridor along Z
const PASILLO_VOLADIZO_Z: TileDef = {
  id: 'PASILLO_VOLADIZO_Z',
  sockets: {
    [D.POS_Y]: [S.EMPTY],
    [D.NEG_Y]: [S.EMPTY],
    [D.POS_X]: [S.EMPTY],
    [D.NEG_X]: [S.EMPTY],
    [D.POS_Z]: [S.BRIDGE],
    [D.NEG_Z]: [S.BRIDGE],
  },
  weight: 0.0,
  minY: 3,
  maxY: null,
  roofOnly: false,
};

// ==========================================
// MID-LEVEL VOID (Y >= 1)
// ==========================================

const VOID: TileDef = {
  id: 'VOID',
  sockets: sideSockets([S.EMPTY], [S.EMPTY], [S.EMPTY]),
  weight: 1.5,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

// ==========================================
// COLUMN CAP (variable height termination)
// ==========================================

const LOSA_REMATE: TileDef = {
  id: 'LOSA_REMATE',
  sockets: {
    [D.POS_Y]: [S.EMPTY],
    [D.NEG_Y]: [S.CONCRETE],
    [D.POS_X]: [S.EMPTY],
    [D.NEG_X]: [S.EMPTY],
    [D.POS_Z]: [S.EMPTY],
    [D.NEG_Z]: [S.EMPTY],
  },
  weight: 0.1,
  minY: 1,
  maxY: null,
  roofOnly: false,
};

// ==========================================
// ROOF / CORONAMIENTO (top level only)
// ==========================================

const TERRAZA_PRETIL: TileDef = {
  id: 'TERRAZA_PRETIL',
  sockets: sideSockets([S.EMPTY], [S.EMPTY], [S.CONCRETE]),
  weight: 1.0,
  minY: null,
  maxY: null,
  roofOnly: true,
};

const CORONAMIENTO: TileDef = {
  id: 'CORONAMIENTO',
  sockets: sideSockets([S.EMPTY], [S.EMPTY], [S.STRUCT]),
  weight: 0.5,
  minY: null,
  maxY: null,
  roofOnly: true,
};

const EMPTY_ROOF: TileDef = {
  id: 'EMPTY_ROOF',
  sockets: sideSockets([S.EMPTY], [S.EMPTY], [S.EMPTY]),
  weight: 1.0,
  minY: null,
  maxY: null,
  roofOnly: true,
};

// All tiles grouped by architectural role
export const ALL_TILES: TileDef[] = [
  // Ground supports
  PILOTI_CENTRAL,
  PILOTI_ESQUINA_PX_PZ,
  PILOTI_ESQUINA_NX_PZ,
  PILOTI_ESQUINA_NX_NZ,
  PILOTI_ESQUINA_PX_NZ,
  EMPTY_GROUND,
  // Habitation modules
  MODULO_BALCON_PX,
  MODULO_BALCON_NX,
  MODULO_BALCON_PZ,
  MODULO_BALCON_NZ,
  MODULO_ACRISTADO_PX_PZ,
  MODULO_ACRISTADO_NX_PZ,
  MODULO_ACRISTADO_NX_NZ,
  MODULO_ACRISTADO_PX_NZ,
  MODULO_ACRISTADO_BAND_PX_PZ,
  MODULO_ACRISTADO_BAND_NX_PZ,
  MODULO_ACRISTADO_BAND_NX_NZ,
  MODULO_ACRISTADO_BAND_PX_NZ,
  MODULO_ACRISTADO_ESQUINA_PX_PZ,
  MODULO_ACRISTADO_ESQUINA_NX_PZ,
  MODULO_ACRISTADO_ESQUINA_NX_NZ,
  MODULO_ACRISTADO_ESQUINA_PX_NZ,
  TORRE_ESCALERA,
  CODO_ESCALERA,
  // Connections
  PASILLO_VOLADIZO_X,
  PASILLO_VOLADIZO_Z,
  // Void
  VOID,
  // Column cap
  LOSA_REMATE,
  // Roof / Coronamiento
  TERRAZA_PRETIL,
  CORONAMIENTO,
  EMPTY_ROOF,
];

// Tile lookup by ID
export const TILE_MAP: Map<string, TileDef> = new Map(ALL_TILES.map((t) => [t.id, t]));

// Socket compatibility: which sockets can face each other across a boundary
export const DEFAULT_SOCKET_COMPAT = new Map<Socket, Set<Socket>>([
  [S.EMPTY, new Set([S.EMPTY])],
  [S.STRUCT, new Set([S.STRUCT, S.CONCRETE])],
  [S.CONCRETE, new Set([S.CONCRETE, S.STRUCT, S.WINDOW, S.GLASS, S.BRIDGE])],
  [S.WINDOW, new Set([S.CONCRETE])],
  [S.GLASS, new Set([S.CONCRETE])],
  [S.STAIRS, new Set([S.STAIRS])],
  [S.BRIDGE, new Set([S.BRIDGE, S.CONCRETE])],
  [S.GROUND, new Set([S.GROUND])],
]);

// Check if two socket arrays are compatible (any pair matches)
export function socketsCompatible(
  a: Socket[],
  b: Socket[],
  compatMap: Map<Socket, Set<Socket>> = DEFAULT_SOCKET_COMPAT
): boolean {
  for (const sa of a) {
    const compat = compatMap.get(sa);
    if (!compat) continue;
    for (const sb of b) {
      if (compat.has(sb)) return true;
    }
  }
  return false;
}

// Precomputed adjacency: for each (tileId, direction) → set of compatible tile IDs
export type AdjacencyMap = Map<string, Map<Direction, Set<string>>>;

export function buildAdjacencyMap(
  tiles: TileDef[],
  compatMap: Map<Socket, Set<Socket>> = DEFAULT_SOCKET_COMPAT
): AdjacencyMap {
  const map: AdjacencyMap = new Map();
  const directions = Object.values(Direction) as Direction[];
  const opposites: Record<string, Direction> = {
    [Direction.POS_X]: Direction.NEG_X,
    [Direction.NEG_X]: Direction.POS_X,
    [Direction.POS_Y]: Direction.NEG_Y,
    [Direction.NEG_Y]: Direction.POS_Y,
    [Direction.POS_Z]: Direction.NEG_Z,
    [Direction.NEG_Z]: Direction.POS_Z,
  };

  for (const tileA of tiles) {
    const dirMap = new Map<Direction, Set<string>>();

    for (const dir of directions) {
      const compatSet = new Set<string>();
      const socketA = tileA.sockets[dir];
      const oppositeDir = opposites[dir];

      for (const tileB of tiles) {
        const socketB = tileB.sockets[oppositeDir];
        if (socketsCompatible(socketA, socketB, compatMap)) {
          compatSet.add(tileB.id);
        }
      }

      dirMap.set(dir, compatSet);
    }

    map.set(tileA.id, dirMap);
  }

  return map;
}
