import * as THREE from 'three';

// Thin wrapper around the Three.js boilerplate every region scene needs:
// renderer, camera, lighting rig, resize handling, and a render loop that
// delegates per-frame work to whatever callbacks are registered.
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
    this.scene = new THREE.Scene();

    this._updaters = [];
    this._clock = new THREE.Clock();

    window.addEventListener('resize', () => this._onResize());
    this._onResize();
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setScene(buildFn) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0b0d14, 0.012);
    return buildFn(this.scene, THREE, this.camera);
  }

  addUpdater(fn) {
    this._updaters.push(fn);
    return () => {
      this._updaters = this._updaters.filter((u) => u !== fn);
    };
  }

  clearUpdaters() {
    this._updaters = [];
  }

  start() {
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      const dt = Math.min(this._clock.getDelta(), 0.1);
      this._updaters.forEach((u) => u(dt));
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
  }
}
