import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SHADOW_MAP_SIZE, TILE_SIZE, GROUND_COLOR } from '../utils/constants';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;

  private dirLight!: THREE.DirectionalLight;
  private buildingGroup: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd0d0d0);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(35, 25, 35);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 5, 0);
    this.controls.update();

    // Lighting
    this.setupLighting();

    // Ground plane
    this.setupGround();

    // Building container group
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private setupLighting(): void {
    // Directional light (main shadow caster) — warm key light
    this.dirLight = new THREE.DirectionalLight(0xfff5e6, 2.8);
    this.dirLight.position.set(10, 20, 5);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -5;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Ambient light — softer fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Hemisphere light — sky/ground gradient for natural feel
    const hemi = new THREE.HemisphereLight(0xc8d8e8, 0x666666, 0.4);
    this.scene.add(hemi);
  }

  private setupGround(): void {
    const groundSize = 300;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);

    // Create grid texture: light gray base with darker gray grid lines
    const texSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d')!;

    // Light gray base
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, texSize, texSize);

    // Darker gray grid lines
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 1;
    const gridCells = 16;
    const cellSize = texSize / gridCells;
    for (let i = 0; i <= gridCells; i++) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, texSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(texSize, pos);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(groundSize / 20, groundSize / 20);

    const groundMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // Dynamically size the shadow camera frustum based on grid dimensions
  updateShadowFrustum(sizeX: number, sizeY: number, sizeZ: number): void {
    const extent = Math.max(sizeX, sizeZ) * TILE_SIZE;
    const height = sizeY * TILE_SIZE;

    this.dirLight.shadow.camera.left = -extent;
    this.dirLight.shadow.camera.right = extent;
    this.dirLight.shadow.camera.top = height + 5;
    this.dirLight.shadow.camera.bottom = -5;
    this.dirLight.shadow.camera.updateProjectionMatrix();
  }

  // Update orbit controls target to center of building
  updateCameraTarget(sizeX: number, sizeY: number, sizeZ: number): void {
    const centerY = (sizeY * TILE_SIZE) / 2;
    this.controls.target.set(0, centerY, 0);
    this.controls.update();
  }

  getBuildingGroup(): THREE.Group {
    return this.buildingGroup;
  }

  clearBuilding(): void {
    while (this.buildingGroup.children.length > 0) {
      const child = this.buildingGroup.children[0];
      this.buildingGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
