import * as THREE from 'three';
import { Solver } from './wfc/Solver';
import { TileConfig } from './wfc/TileConfig';
import { TILE_SIZE, MAX_RETRIES } from './utils/constants';
import { SceneManager } from './rendering/SceneManager';
import { PostProcessing } from './rendering/PostProcessing';
import { TileGeometry } from './rendering/TileGeometry';
import { MaterialLibrary } from './rendering/Materials';
import { Controls } from './ui/Controls';
import { TileEditor } from './ui/TileEditor';
import { BlocksCheatsheet } from './ui/BlocksCheatsheet';

class App {
  private sceneManager: SceneManager;
  private postProcessing: PostProcessing;
  private materials: MaterialLibrary;
  private solver: Solver;
  private config: TileConfig;

  constructor() {
    const canvas = document.getElementById('c') as HTMLCanvasElement;

    this.sceneManager = new SceneManager(canvas);
    this.postProcessing = new PostProcessing(
      this.sceneManager.renderer,
      this.sceneManager.scene,
      this.sceneManager.camera
    );
    this.materials = new MaterialLibrary();

    // Mutable config drives tiles, weights, sockets, grid dims
    this.config = new TileConfig();
    this.solver = new Solver(this.config);

    new Controls({
      onGenerate: (seed) => this.generate(seed),
    });

    new TileEditor(this.config, {
      onChange: () => this.generate(),
    });

    new BlocksCheatsheet(this.config, {
      onChange: () => this.generate(),
    });

    // Initial generation
    this.generate();

    // Start animation loop
    this.animate();
  }

  generate(seed?: number): void {
    const usedSeed = seed ?? Math.floor(Math.random() * 999999);
    const statusEl = document.getElementById('status')!;

    const sizeX = this.config.gridSizeX;
    const sizeY = this.config.gridSizeY;
    const sizeZ = this.config.gridSizeZ;

    this.sceneManager.clearBuilding();

    let result = this.solver.solve(sizeX, sizeY, sizeZ, usedSeed);
    let attempts = 1;

    // Auto-retry on contradiction
    while (!result.success && attempts < MAX_RETRIES) {
      result = this.solver.solve(sizeX, sizeY, sizeZ, usedSeed + attempts);
      attempts++;
    }

    if (!result.success) {
      statusEl.textContent = `Failed after ${attempts} attempts. Try a different seed.`;
      console.warn('WFC solve failed after max retries');
      return;
    }

    // Post-solve: place observatory on the designated tallest column from solver
    const obsX = result.observatoryX;
    const obsZ = result.observatoryZ;
    if (obsX >= 0 && obsZ >= 0) {
      // Find the topmost solid tile in this specific column
      let topY = 0;
      for (let y = 0; y < sizeY; y++) {
        const tid = result.grid.get(`${obsX},${y},${obsZ}`);
        if (tid && tid !== 'VOID' && tid !== 'EMPTY_GROUND' && tid !== 'EMPTY_ROOF' && tid !== 'LOSA_REMATE') {
          topY = y;
        }
      }
      // Place CORONAMIENTO one tile above the topmost solid (support connects to building top)
      result.grid.set(`${obsX},${topY + 1},${obsZ}`, 'CORONAMIENTO');
    }

    // Place tile geometries
    const group = this.sceneManager.getBuildingGroup();
    const offsetX = ((sizeX - 1) * TILE_SIZE) / 2;
    const offsetZ = ((sizeZ - 1) * TILE_SIZE) / 2;

    for (const [key, tileId] of result.grid) {
      const [x, y, z] = key.split(',').map(Number);
      const tileGroup = TileGeometry.createTile(tileId);

      // Apply materials
      this.materials.applyMaterials(tileGroup);

      // Position: center the building at origin, bottom at y=0
      tileGroup.position.set(
        x * TILE_SIZE - offsetX,
        y * TILE_SIZE + TILE_SIZE / 2,
        z * TILE_SIZE - offsetZ
      );

      group.add(tileGroup);
    }

    // Add terraces on top of every topmost solid tile
    const nonSolid = new Set(['VOID', 'EMPTY_GROUND', 'EMPTY_ROOF', 'LOSA_REMATE', 'CORONAMIENTO', 'TERRAZA_PRETIL']);

    // Build topY map for all columns
    const topYMap = new Map<string, number>();
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        if (x === obsX && z === obsZ) continue;
        let topY = -1;
        for (let y = 0; y < sizeY; y++) {
          const tid = result.grid.get(`${x},${y},${z}`);
          if (tid && !nonSolid.has(tid)) topY = y;
        }
        if (topY >= 0) topYMap.set(`${x},${z}`, topY);
      }
    }

    const wallH = 0.6;
    const wallT = 0.06;
    const S = TILE_SIZE + 0.01;
    const H = S / 2;

    for (const [key, topY] of topYMap) {
      const [x, z] = key.split(',').map(Number);
      const terraceGroup = new THREE.Group();

      // Only add wall on edges where neighbor is absent or at a different topY
      const neighborTopY = (dx: number, dz: number) => topYMap.get(`${x + dx},${z + dz}`);

      if (neighborTopY(1, 0) !== topY) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, S));
        w.position.set(H - wallT / 2, wallH / 2, 0);
        terraceGroup.add(w);
      }
      if (neighborTopY(-1, 0) !== topY) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, S));
        w.position.set(-H + wallT / 2, wallH / 2, 0);
        terraceGroup.add(w);
      }
      if (neighborTopY(0, 1) !== topY) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(S, wallH, wallT));
        w.position.set(0, wallH / 2, H - wallT / 2);
        terraceGroup.add(w);
      }
      if (neighborTopY(0, -1) !== topY) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(S, wallH, wallT));
        w.position.set(0, wallH / 2, -H + wallT / 2);
        terraceGroup.add(w);
      }

      if (terraceGroup.children.length > 0) {
        this.materials.applyMaterials(terraceGroup);
        terraceGroup.position.set(
          x * TILE_SIZE - offsetX,
          (topY + 1) * TILE_SIZE,
          z * TILE_SIZE - offsetZ
        );
        group.add(terraceGroup);
      }
    }

    // Update camera and shadows
    this.sceneManager.updateShadowFrustum(sizeX, sizeY, sizeZ);
    this.sceneManager.updateCameraTarget(sizeX, sizeY, sizeZ);

    statusEl.textContent = `Seed: ${usedSeed + attempts - 1} | Tiles: ${result.grid.size} | Attempts: ${attempts}`;

    // Debug: count tile types
    const counts: Record<string, number> = {};
    for (const [, tileId] of result.grid) {
      counts[tileId] = (counts[tileId] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log('Tile counts:', sorted.map(([id, n]) => `${id}: ${n}`).join(', '));
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));
    this.sceneManager.controls.update();
    this.postProcessing.render();
  }
}

new App();
