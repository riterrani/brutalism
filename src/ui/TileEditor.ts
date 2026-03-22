import { Socket } from '../wfc/types';
import { TileConfig } from '../wfc/TileConfig';
import {
  GRID_SIZE_Y_MIN,
  GRID_SIZE_Y_MAX,
  GRID_SIZE_X_MIN,
  GRID_SIZE_X_MAX,
  GRID_SIZE_Z_MIN,
  GRID_SIZE_Z_MAX,
} from '../utils/constants';

const SOCKET_TYPES = Object.values(Socket);

// Short labels for the matrix header
const SOCKET_SHORT: Record<string, string> = {
  EMPTY: 'EMP',
  STRUCT: 'STR',
  CONCRETE: 'CON',
  WINDOW: 'WIN',
  GLASS: 'GLS',
  STAIRS: 'STA',
  BRIDGE: 'BRG',
  GROUND: 'GND',
};

export interface TileEditorCallbacks {
  onChange: () => void;
}

export class TileEditor {
  private container: HTMLElement;
  private config: TileConfig;
  private callbacks: TileEditorCallbacks;
  private panel: HTMLElement;
  private toggleBtn: HTMLElement;
  private collapsed = true;

  constructor(config: TileConfig, callbacks: TileEditorCallbacks) {
    this.container = document.getElementById('editor')!;
    this.config = config;
    this.callbacks = callbacks;

    // Toggle button
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'editor-toggle';
    this.toggleBtn.textContent = '\u2630';
    this.toggleBtn.title = 'Toggle Editor';
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.container.appendChild(this.toggleBtn);

    // Panel content
    this.panel = document.createElement('div');
    this.panel.id = 'editor-panel';
    this.panel.style.display = 'none'; // Start collapsed
    this.container.appendChild(this.panel);

    this.build();
  }

  private toggle(): void {
    this.collapsed = !this.collapsed;
    this.panel.style.display = this.collapsed ? 'none' : 'block';
    this.toggleBtn.textContent = this.collapsed ? '\u2630' : '\u2630';
  }

  private build(): void {
    this.panel.innerHTML = '';

    this.buildTileSection();
    this.buildSocketMatrix();
    this.buildGridSection();
    this.buildActions();
  }

  // Rebuild the entire editor UI (after import)
  rebuild(): void {
    this.build();
  }

  // === TILE CONTROLS ===
  private buildTileSection(): void {
    const section = this.createSection('TILES');

    const entries = this.config.getAllEntries();

    // Group tiles by role based on ID prefix patterns
    const groups: { label: string; ids: string[] }[] = [
      { label: 'Ground (Y=0)', ids: [] },
      { label: 'Structure', ids: [] },
      { label: 'Cantilevers', ids: [] },
      { label: 'Void / Air', ids: [] },
      { label: 'Connections', ids: [] },
      { label: 'Vertical', ids: [] },
      { label: 'Roof', ids: [] },
    ];

    for (const entry of entries) {
      const id = entry.def.id;
      if (id.includes('PILOTI') || id.includes('EMPTY_GROUND') || id.includes('DIAGONAL_BRACE')) {
        groups[0].ids.push(id);
      } else if (id.includes('BASIC_CUBE') || id.includes('CORNER_GLASS') || id.includes('STAIRWELL') || id.includes('OFFSET')) {
        groups[1].ids.push(id);
      } else if (id.includes('CANTILEVER') || id.includes('CIRCULAR_POD')) {
        groups[2].ids.push(id);
      } else if (id.includes('VOID')) {
        groups[3].ids.push(id);
      } else if (id.includes('BRIDGE') || id.includes('PLATFORM') || id.includes('SETBACK')) {
        groups[4].ids.push(id);
      } else if (id.includes('COLUMN') || id.includes('SERVICE_SPINE')) {
        groups[5].ids.push(id);
      } else {
        groups[6].ids.push(id);
      }
    }

    for (const group of groups) {
      if (group.ids.length === 0) continue;

      const groupHeader = document.createElement('div');
      groupHeader.className = 'tile-group-header';
      groupHeader.textContent = group.label;
      section.appendChild(groupHeader);

      for (const id of group.ids) {
        const entry = this.config.getEntry(id)!;
        const row = this.createTileRow(entry.def.id, entry.enabled, entry.weight);
        section.appendChild(row);
      }
    }

    this.panel.appendChild(section);
  }

  private createTileRow(id: string, enabled: boolean, weight: number): HTMLElement {
    const row = document.createElement('div');
    row.className = 'tile-row';

    // Checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = enabled;
    cb.addEventListener('change', () => {
      this.config.setEnabled(id, cb.checked);
      this.callbacks.onChange();
    });
    row.appendChild(cb);

    // Name (shortened)
    const name = document.createElement('span');
    name.className = 'tile-name';
    name.textContent = this.shortName(id);
    name.title = id;
    row.appendChild(name);

    // Weight slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '5';
    slider.step = '0.1';
    slider.value = String(weight);
    slider.className = 'tile-weight';

    const valLabel = document.createElement('span');
    valLabel.className = 'tile-weight-val';
    valLabel.textContent = weight.toFixed(1);

    slider.addEventListener('input', () => {
      const w = parseFloat(slider.value);
      this.config.setWeight(id, w);
      valLabel.textContent = w.toFixed(1);
      this.callbacks.onChange();
    });

    row.appendChild(slider);
    row.appendChild(valLabel);

    return row;
  }

  private shortName(id: string): string {
    // PILOTI_CENTRAL -> Pilo Cent
    const parts = id.split('_');
    return parts.map((p) => p.charAt(0) + p.slice(1, 4).toLowerCase()).join(' ');
  }

  // === SOCKET COMPATIBILITY MATRIX ===
  private buildSocketMatrix(): void {
    const section = this.createSection('SOCKET COMPAT');

    const table = document.createElement('table');
    table.className = 'socket-matrix';

    // Header row
    const thead = document.createElement('tr');
    const emptyTh = document.createElement('th');
    thead.appendChild(emptyTh);
    for (const s of SOCKET_TYPES) {
      const th = document.createElement('th');
      th.textContent = SOCKET_SHORT[s] || s;
      th.title = s;
      thead.appendChild(th);
    }
    table.appendChild(thead);

    // Data rows
    for (const row of SOCKET_TYPES) {
      const tr = document.createElement('tr');
      const rowLabel = document.createElement('td');
      rowLabel.textContent = SOCKET_SHORT[row] || row;
      rowLabel.title = row;
      rowLabel.className = 'socket-label';
      tr.appendChild(rowLabel);

      for (const col of SOCKET_TYPES) {
        const td = document.createElement('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = this.config.isSocketCompatible(row, col);
        cb.addEventListener('change', () => {
          this.config.setSocketCompat(row, col, cb.checked);
          // Keep the symmetric cell in sync
          const mirrorCb = table.querySelector(
            `[data-row="${col}"][data-col="${row}"]`
          ) as HTMLInputElement | null;
          if (mirrorCb && mirrorCb !== cb) {
            mirrorCb.checked = cb.checked;
          }
          this.callbacks.onChange();
        });
        cb.setAttribute('data-row', row);
        cb.setAttribute('data-col', col);
        td.appendChild(cb);
        tr.appendChild(td);
      }

      table.appendChild(tr);
    }

    section.appendChild(table);
    this.panel.appendChild(section);
  }

  // === GRID DIMENSIONS ===
  private buildGridSection(): void {
    const section = this.createSection('GRID SIZE');

    section.appendChild(
      this.createDimSlider('Width (X)', this.config.gridSizeX, GRID_SIZE_X_MIN, GRID_SIZE_X_MAX, (v) => {
        this.config.gridSizeX = v;
        this.callbacks.onChange();
      })
    );
    section.appendChild(
      this.createDimSlider('Depth (Z)', this.config.gridSizeZ, GRID_SIZE_Z_MIN, GRID_SIZE_Z_MAX, (v) => {
        this.config.gridSizeZ = v;
        this.callbacks.onChange();
      })
    );
    section.appendChild(
      this.createDimSlider('Height (Y)', this.config.gridSizeY, GRID_SIZE_Y_MIN, GRID_SIZE_Y_MAX, (v) => {
        this.config.gridSizeY = v;
        this.callbacks.onChange();
      })
    );

    this.panel.appendChild(section);
  }

  private createDimSlider(
    label: string,
    value: number,
    min: number,
    max: number,
    onInput: (v: number) => void
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'dim-row';

    const lbl = document.createElement('label');
    lbl.textContent = `${label}: ${value}`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      lbl.textContent = `${label}: ${v}`;
      onInput(v);
    });

    lbl.appendChild(slider);
    row.appendChild(lbl);
    return row;
  }

  // === ACTIONS ===
  private buildActions(): void {
    const section = this.createSection('CONFIG');

    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export JSON';
    exportBtn.addEventListener('click', () => this.exportConfig());
    section.appendChild(exportBtn);

    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import JSON';
    importBtn.addEventListener('click', () => this.importConfig());
    section.appendChild(importBtn);

    this.panel.appendChild(section);
  }

  private exportConfig(): void {
    const json = JSON.stringify(this.config.toJSON(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brutalism-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private importConfig(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          this.config.fromJSON(json);
          this.rebuild();
          this.callbacks.onChange();
        } catch (e) {
          console.error('Invalid config file:', e);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // === HELPERS ===
  private createSection(title: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'editor-section';

    const header = document.createElement('h3');
    header.textContent = title;
    section.appendChild(header);

    return section;
  }
}
