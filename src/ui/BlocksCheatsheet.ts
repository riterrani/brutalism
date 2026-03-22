import * as THREE from 'three';
import { TileConfig } from '../wfc/TileConfig';
import { TileGeometry } from '../rendering/TileGeometry';
import { MaterialLibrary } from '../rendering/Materials';
import { Direction, Socket } from '../wfc/types';

const ITEMS_PER_PAGE = 8;

export interface BlocksCheatsheetCallbacks {
  onChange: () => void;
}

export class BlocksCheatsheet {
  private container: HTMLElement;
  private content: HTMLElement;
  private footer: HTMLElement;
  private toggleBtn: HTMLElement;
  private closeBtn: HTMLElement;
  private config: TileConfig;
  private callbacks: BlocksCheatsheetCallbacks;
  private materials: MaterialLibrary;
  
  private currentPage = 0;
  private isOpen = false;

  private renderers: Map<string, { scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, mesh: THREE.Group }> = new Map();

  constructor(config: TileConfig, callbacks: BlocksCheatsheetCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.materials = new MaterialLibrary();

    this.container = document.getElementById('cheatsheet')!;
    this.content = document.getElementById('cheatsheet-content')!;
    this.footer = document.getElementById('cheatsheet-footer')!;
    this.toggleBtn = document.getElementById('cheatsheet-toggle-btn')!;
    this.closeBtn = document.getElementById('cheatsheet-close')!;

    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.closeBtn.addEventListener('click', () => this.hide());
    
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.hide();
    });

    this.render();
  }

  private toggle(): void {
    if (this.isOpen) this.hide();
    else this.show();
  }

  private show(): void {
    this.isOpen = true;
    this.container.style.display = 'flex';
    this.render();
    this.startAnimation();
  }

  private hide(): void {
    this.isOpen = false;
    this.container.style.display = 'none';
    this.stopAnimation();
  }

  private render(): void {
    this.content.innerHTML = '';
    this.footer.innerHTML = '';

    const allEntries = this.config.getAllEntries();
    const totalPages = Math.ceil(allEntries.length / ITEMS_PER_PAGE);
    
    const start = this.currentPage * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, allEntries.length);
    const pageItems = allEntries.slice(start, end);

    // Build cards
    pageItems.forEach(entry => {
      const card = this.createCard(entry);
      this.content.appendChild(card);
    });

    // Build pagination
    for (let i = 0; i < totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
      btn.textContent = String(i + 1);
      btn.addEventListener('click', () => {
        this.currentPage = i;
        this.render();
      });
      this.footer.appendChild(btn);
    }
  }

  private createCard(entry: any): HTMLElement {
    const card = document.createElement('div');
    card.className = 'block-card';

    // Preview container
    const preview = document.createElement('div');
    preview.className = 'block-preview';
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    preview.appendChild(canvas);
    card.appendChild(preview);

    // Info
    const info = document.createElement('div');
    info.className = 'block-info';
    
    const idLabel = document.createElement('div');
    idLabel.className = 'block-id';
    idLabel.textContent = entry.def.id;
    info.appendChild(idLabel);

    // Sockets
    const socketsGrid = document.createElement('div');
    socketsGrid.className = 'block-sockets';
    
    const dirs = [
        { label: 'TOP', dir: Direction.POS_Y },
        { label: 'BTM', dir: Direction.NEG_Y },
        { label: 'PX', dir: Direction.POS_X },
        { label: 'NX', dir: Direction.NEG_X },
        { label: 'PZ', dir: Direction.POS_Z },
        { label: 'NZ', dir: Direction.NEG_Z },
    ];

    dirs.forEach(d => {
        const socket = (entry.sockets ? entry.sockets[d.dir] : entry.def.sockets[d.dir])[0];
        
        const select = document.createElement('select');
        select.className = `socket-box ${socket !== Socket.EMPTY ? 'active' : ''}`;
        
        Object.values(Socket).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = `${d.label}: ${s.substring(0, 3)}`;
            if (s === socket) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => {
            this.config.setTileSocket(entry.def.id, d.dir, [select.value as Socket]);
            this.callbacks.onChange();
            this.render(); // Re-render to update classes if needed
        });

        socketsGrid.appendChild(select);
    });
    info.appendChild(socketsGrid);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'block-controls';
    
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = entry.enabled;
    cb.addEventListener('change', () => {
        this.config.setEnabled(entry.def.id, cb.checked);
        this.callbacks.onChange();
    });
    controls.appendChild(cb);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '5';
    slider.step = '0.1';
    slider.value = String(entry.weight);
    
    const valLabel = document.createElement('span');
    valLabel.textContent = entry.weight.toFixed(1);

    slider.addEventListener('input', () => {
        const w = parseFloat(slider.value);
        this.config.setWeight(entry.def.id, w);
        valLabel.textContent = w.toFixed(1);
        this.callbacks.onChange();
    });

    controls.appendChild(slider);
    controls.appendChild(valLabel);
    info.appendChild(controls);

    card.appendChild(info);

    // Setup Three.js for this card
    this.setupPreview(entry.def.id, canvas);

    return card;
  }

  private setupPreview(id: string, canvas: HTMLCanvasElement): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(200, 200);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const mesh = TileGeometry.createTile(id);
    this.materials.applyMaterials(mesh);
    scene.add(mesh);

    this.renderers.set(id, { scene, camera, renderer, mesh });
  }

  private animationId: number | null = null;

  private startAnimation(): void {
    if (this.animationId !== null) return;
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.renderers.forEach(r => {
        r.mesh.rotation.y += 0.01;
        r.renderer.render(r.scene, r.camera);
      });
    };
    animate();
  }

  private stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clean up renderers to save memory
    this.renderers.forEach(r => r.renderer.dispose());
    this.renderers.clear();
  }
}
