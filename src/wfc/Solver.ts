import { Cell, Direction, cellKey, SolveResult, TileDef } from './types';
import { AdjacencyMap } from './TileRegistry';
import { TileConfig } from './TileConfig';
import { Grid } from './Grid';

// Seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Solver {
  private config: TileConfig;

  constructor(config: TileConfig) {
    this.config = config;
  }

  solve(sizeX: number, sizeY: number, sizeZ: number, seed: number): SolveResult {
    const rng = mulberry32(seed);
    const activeTiles = this.config.getActiveTiles();
    const adjacency = this.config.buildAdjacency();
    const tileMap = new Map<string, TileDef>(activeTiles.map((t) => [t.id, t]));

    const grid = new Grid(sizeX, sizeY, sizeZ, activeTiles);
    const directions = Object.values(Direction) as Direction[];

    // === WIDE CLUSTER SEEDING (5x4 footprint) ===
    const seedPoints: [number, number][] = [];
    const footprintX = 5;
    const footprintZ = 4;
    const anchorX = Math.floor((sizeX - footprintX) / 2);
    const anchorZ = Math.floor((sizeZ - footprintZ) / 2);

    // Skip 2-4 cells for organic irregularity
    const totalCells = footprintX * footprintZ;
    const skipCount = 2 + Math.floor(rng() * 3);
    const skipIndices = new Set<number>();
    while (skipIndices.size < skipCount) {
      skipIndices.add(Math.floor(rng() * totalCells));
    }
    let idx = 0;
    for (let dx = 0; dx < footprintX; dx++) {
      for (let dz = 0; dz < footprintZ; dz++) {
        if (!skipIndices.has(idx)) {
          const nx = anchorX + dx;
          const nz = anchorZ + dz;
          if (nx >= 0 && nx < sizeX && nz >= 0 && nz < sizeZ) {
            seedPoints.push([nx, nz]);
          }
        }
        idx++;
      }
    }

    // === COLUMN HEIGHT VARIATION ===
    // Assign random target heights per seed column for a stepped silhouette
    const columnHeights = new Map<string, number>();
    const minH = 3;
    const maxH = sizeY - 1;

    for (const [sx, sz] of seedPoints) {
      const band = rng();
      let targetHeight: number;
      if (band < 0.25) {
        // Short columns (25%): 3-4 levels
        targetHeight = minH + Math.floor(rng() * 2);
      } else if (band < 0.70) {
        // Medium columns (45%): mid-range
        targetHeight = Math.floor(minH + (maxH - minH) * 0.4 + rng() * 2);
      } else {
        // Tall columns (30%): near max
        targetHeight = Math.floor(maxH - rng() * 2);
      }
      targetHeight = Math.min(Math.max(targetHeight, minH), maxH);
      columnHeights.set(`${sx},${sz}`, targetHeight);
    }

    // Ensure at least one column reaches maximum height (for the observatory)
    const tallestIdx = Math.floor(seedPoints.length / 2);
    const tallestX = seedPoints[tallestIdx][0];
    const tallestZ = seedPoints[tallestIdx][1];
    columnHeights.set(`${tallestX},${tallestZ}`, sizeY - 1);

    // Force Y=0 cells: only seed points can be solids, others must be empty
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const cell = grid.getCell(x, 0, z);
        if (!cell) continue;

        const isSeed = seedPoints.some(([sx, sz]) => sx === x && sz === z);
        if (isSeed) {
          // Keep only support tiles
          const supports = Array.from(cell.possibleTiles).filter(id => id !== 'EMPTY_GROUND');
          if (supports.length > 0) {
            cell.possibleTiles = new Set(supports);
          }
        } else {
          // Force empty ground
          if (cell.possibleTiles.has('EMPTY_GROUND')) {
            cell.possibleTiles = new Set(['EMPTY_GROUND']);
          }
        }
      }
    }

    // === FORCE HEIGHT CAPS ===
    // For each seed column, force cells above targetHeight to cap + void
    for (const [sx, sz] of seedPoints) {
      const targetH = columnHeights.get(`${sx},${sz}`) ?? sizeY - 1;
      if (targetH >= sizeY - 1) continue; // tallest column — no cap needed

      // At targetHeight: force LOSA_REMATE (column cap)
      const capCell = grid.getCell(sx, targetH, sz);
      if (capCell && capCell.possibleTiles.has('LOSA_REMATE')) {
        capCell.possibleTiles = new Set(['LOSA_REMATE']);
      }

      // From targetHeight+1 to sizeY-2: force VOID
      for (let y = targetH + 1; y < sizeY - 1; y++) {
        const cell = grid.getCell(sx, y, sz);
        if (!cell) continue;
        if (cell.possibleTiles.has('VOID')) {
          cell.possibleTiles = new Set(['VOID']);
        }
      }

      // At roof level: force EMPTY_ROOF
      const roofCell = grid.getCell(sx, sizeY - 1, sz);
      if (roofCell && roofCell.possibleTiles.has('EMPTY_ROOF')) {
        roofCell.possibleTiles = new Set(['EMPTY_ROOF']);
      }
    }

    // === FORCE TALLEST COLUMN SOLID (observatory tower) ===
    // Remove VOID and LOSA_REMATE from the tallest column so it builds solid all the way up
    for (let y = 2; y < sizeY - 1; y++) {
      const cell = grid.getCell(tallestX, y, tallestZ);
      if (!cell) continue;
      cell.possibleTiles.delete('VOID');
      cell.possibleTiles.delete('LOSA_REMATE');
    }

    let iterations = 0;
    const maxIterations = sizeX * sizeY * sizeZ * 10;

    while (iterations++ < maxIterations) {
      // === OBSERVE: find cell with minimum entropy ===
      const uncollapsed = grid.getUncollapsedCells();
      if (uncollapsed.length === 0) {
        return { success: true, grid: grid.getResultMap(), sizeX, sizeY, sizeZ, observatoryX: tallestX, observatoryZ: tallestZ };
      }

      let minEntropy = Infinity;
      let candidates: Cell[] = [];

      for (const cell of uncollapsed) {
        const entropy = cell.possibleTiles.size;
        if (entropy === 0) return { success: false, grid: new Map(), sizeX, sizeY, sizeZ, observatoryX: -1, observatoryZ: -1 };
        
        if (entropy < minEntropy) {
          minEntropy = entropy;
          candidates = [cell];
        } else if (entropy === minEntropy) {
          candidates.push(cell);
        }
      }

      // Tie-break: prefer cells with collapsed neighbors (promotes coherent growth from seeds)
      // and then prefer lower Y.
      candidates.sort((a, b) => {
        const scoreA = directions.reduce((sum, dir) => sum + (grid.getNeighbor(a, dir)?.collapsed ? 1 : 0), 0);
        const scoreB = directions.reduce((sum, dir) => sum + (grid.getNeighbor(b, dir)?.collapsed ? 1 : 0), 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.y - b.y;
      });

      // Pick from top candidates with minimal randomness
      const chosen = candidates[0];

      // === COLLAPSE ===
      const possibleIds = Array.from(chosen.possibleTiles);
      const weights = possibleIds.map((id) => {
        const def = tileMap.get(id);
        if (!def) return 1.0;
        let w = def.weight;

        // Vertical stacking: reduced bonuses for variety
        const below = grid.getNeighbor(chosen, Direction.NEG_Y);
        if (below && below.collapsed) {
          const belowId = Array.from(below.possibleTiles)[0];
          if (belowId === id) {
            w *= 1.5; // Mild preference to continue same type
          } else if (belowId !== 'VOID' && id !== 'VOID' && belowId !== 'LOSA_REMATE') {
            w *= 1.3; // Slight preference for solid-on-solid
            // Variety bonus: encourage different tile types for visual interest
            if (belowId !== id) {
              w *= 1.2;
            }
          }
        }
        return w;
      });

      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let r = rng() * totalWeight;
      let selectedId = possibleIds[0];
      for (let i = 0; i < possibleIds.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          selectedId = possibleIds[i];
          break;
        }
      }

      grid.collapse(chosen, selectedId);

      // === PROPAGATE ===
      const queue: string[] = [cellKey(chosen.x, chosen.y, chosen.z)];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const currentKey = queue.shift()!;
        if (visited.has(currentKey)) continue;
        visited.add(currentKey);

        const current = grid.getCellByKey(currentKey);
        if (!current) continue;

        for (const dir of directions) {
          const neighbor = grid.getNeighbor(current, dir);
          if (!neighbor || neighbor.collapsed) continue;

          const allowed = new Set<string>();
          for (const tileId of current.possibleTiles) {
            const tileAdj = adjacency.get(tileId);
            if (!tileAdj) continue;
            const compatSet = tileAdj.get(dir);
            if (!compatSet) continue;
            for (const compat of compatSet) allowed.add(compat);
          }

          let changed = false;
          const toRemove: string[] = [];
          for (const tileId of neighbor.possibleTiles) {
            if (!allowed.has(tileId)) toRemove.push(tileId);
          }

          for (const tileId of toRemove) {
            neighbor.possibleTiles.delete(tileId);
            changed = true;
          }

          if (neighbor.possibleTiles.size === 0) return { success: false, grid: new Map(), sizeX, sizeY, sizeZ, observatoryX: -1, observatoryZ: -1 };

          if (changed) {
            const nKey = cellKey(neighbor.x, neighbor.y, neighbor.z);
            visited.delete(nKey);
            queue.push(nKey);
          }
        }
      }
    }

    return { success: false, grid: new Map(), sizeX, sizeY, sizeZ, observatoryX: -1, observatoryZ: -1 };
  }
}
