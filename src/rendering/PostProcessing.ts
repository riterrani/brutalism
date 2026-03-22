import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class PostProcessing {
  readonly composer: EffectComposer;
  private ssaoPass: SSAOPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.composer = new EffectComposer(renderer);

    // Base render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // SSAO for ambient occlusion — tighter radius for cleaner shadows
    this.ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    this.ssaoPass.kernelRadius = 4;
    this.ssaoPass.minDistance = 0.003;
    this.ssaoPass.maxDistance = 0.08;
    this.composer.addPass(this.ssaoPass);

    // Output pass (tone mapping, color space conversion)
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  render(): void {
    this.composer.render();
  }

  private onResize(): void {
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}
