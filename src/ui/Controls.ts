export interface ControlsCallbacks {
  onGenerate: (seed?: number) => void;
}

export class Controls {
  private container: HTMLElement;

  constructor(callbacks: ControlsCallbacks) {
    this.container = document.getElementById('ui')!;
    this.build(callbacks);
  }

  private build(callbacks: ControlsCallbacks): void {
    // Generate button
    const genBtn = document.createElement('button');
    genBtn.textContent = 'Generate New Building';
    genBtn.addEventListener('click', () => callbacks.onGenerate());
    this.container.appendChild(genBtn);

    // Seed input row (hidden)
    const seedRow = document.createElement('div');
    seedRow.style.display = 'none';

    const seedInput = document.createElement('input');
    seedInput.type = 'text';
    seedInput.placeholder = 'Seed...';
    seedInput.id = 'seed-input';
    seedRow.appendChild(seedInput);

    const seedBtn = document.createElement('button');
    seedBtn.textContent = 'Apply Seed';
    seedBtn.addEventListener('click', () => {
      const val = parseInt(seedInput.value, 10);
      if (!isNaN(val)) {
        callbacks.onGenerate(val);
      }
    });
    seedRow.appendChild(seedBtn);
    this.container.appendChild(seedRow);
  }
}
