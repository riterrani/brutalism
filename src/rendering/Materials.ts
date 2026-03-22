import * as THREE from 'three';
import { CONCRETE_COLOR, DARK_CONCRETE_COLOR, GLASS_COLOR, OBSERVATORY_COLOR, ACCENT_COLOR } from '../utils/constants';

// Generates a board-marked concrete bump texture
// Simulates formwork plank lines with wood grain — the signature brutalist surface
function createNoiseBumpMap(size: number = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const x = i % size;
    const y = Math.floor(i / size);

    // Board-marked formwork: vertical plank lines every ~24px
    const plankWidth = 24;
    const plankEdge = x % plankWidth;
    const plankLine = plankEdge < 2 ? -40 : 0;

    // Wood grain running vertically along planks
    const grain = Math.sin(y * 0.8 + Math.sin(x * 0.1) * 3) * 15;

    // Concrete porosity and aggregate
    const noise1 = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 25;
    const noise2 = (Math.random() - 0.5) * 50;

    // Occasional bug holes (deeper pits in the concrete surface)
    const pit = Math.random() < 0.005 ? -60 : 0;

    data[i] = Math.max(0, Math.min(255, 128 + plankLine + grain + noise1 + noise2 + pit));
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export class MaterialLibrary {
  readonly concrete: THREE.MeshStandardMaterial;
  readonly concreteDouble: THREE.MeshStandardMaterial;
  readonly darkConcrete: THREE.MeshStandardMaterial;
  readonly glass: THREE.MeshStandardMaterial;
  readonly ground: THREE.MeshStandardMaterial;
  readonly observatory: THREE.MeshStandardMaterial;
  readonly accent: THREE.MeshStandardMaterial;

  constructor() {
    const bumpMap = createNoiseBumpMap();

    this.concrete = new THREE.MeshStandardMaterial({
      color: CONCRETE_COLOR,
      roughness: 0.85,
      metalness: 0.0,
      bumpMap: bumpMap,
      bumpScale: 0.3,
    });

    this.concreteDouble = new THREE.MeshStandardMaterial({
      color: CONCRETE_COLOR,
      roughness: 0.85,
      metalness: 0.0,
      bumpMap: bumpMap,
      bumpScale: 0.3,
      side: THREE.DoubleSide,
    });

    this.darkConcrete = new THREE.MeshStandardMaterial({
      color: DARK_CONCRETE_COLOR,
      roughness: 0.85,
      metalness: 0.0,
    });

    this.glass = new THREE.MeshStandardMaterial({
      color: 0x6a8a9a,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    this.ground = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.95,
      metalness: 0.0,
    });

    this.observatory = new THREE.MeshStandardMaterial({
      color: OBSERVATORY_COLOR,
      roughness: 0.6,
      metalness: 0.3,
    });

    this.accent = new THREE.MeshStandardMaterial({
      color: ACCENT_COLOR,
      roughness: 0.7,
      metalness: 0.0,
    });
  }

  // Apply correct material to a tile group based on mesh userData
  applyMaterials(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const type = child.userData.materialType as string | undefined;
        switch (type) {
          case 'concreteDouble':
            child.material = this.concreteDouble;
            break;
          case 'darkConcrete':
            child.material = this.darkConcrete;
            break;
          case 'glass':
            child.material = this.glass;
            child.renderOrder = 1;
            break;
          case 'observatory':
            child.material = this.observatory;
            break;
          case 'accent':
            child.material = this.accent;
            break;
          default:
            child.material = this.concrete;
            break;
        }
      }
    });
  }
}
