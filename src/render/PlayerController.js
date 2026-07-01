import * as THREE from 'three';

const WALK_SPEED = 4.2;
const SPRINT_SPEED = 7.2;
const MOUSE_SENSITIVITY = 0.0022;
const PLAYER_RADIUS = 0.45;

// Third-person controller: WASD relative to camera yaw, pointer-lock mouse look,
// simple sphere-vs-box collision against static obstacles registered per region.
// Flat-ground only (no verticality) — fits the tutorial valley; later regions can
// extend this with a heightmap sample if needed.
export class PlayerController {
  constructor({ canvas, camera, playerMesh }) {
    this.canvas = canvas;
    this.camera = camera;
    this.playerMesh = playerMesh;

    this.position = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = -0.25;

    this.keys = new Set();
    this.obstacles = []; // { min: Vector3, max: Vector3 }
    this.locked = false;
    this.enabled = true;

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    this.canvas.addEventListener('click', () => {
      if (this.enabled) this.canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      this.yaw -= e.movementX * MOUSE_SENSITIVITY;
      this.pitch -= e.movementY * MOUSE_SENSITIVITY;
      this.pitch = Math.max(-1.1, Math.min(0.6, this.pitch));
    });
  }

  setPosition(x, z, yaw = 0) {
    this.position.set(x, 0, z);
    this.yaw = yaw;
  }

  setObstacles(obstacles) {
    this.obstacles = obstacles;
  }

  _collides(x, z) {
    for (const box of this.obstacles) {
      const closestX = Math.max(box.min.x, Math.min(x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(z, box.max.z));
      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
    }
    return false;
  }

  update(dt) {
    if (!this.enabled) return;

    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.sin(this.yaw + Math.PI / 2), 0, Math.cos(this.yaw + Math.PI / 2));

    let move = new THREE.Vector3();
    if (this.keys.has('KeyW')) move.add(forward);
    if (this.keys.has('KeyS')) move.sub(forward);
    if (this.keys.has('KeyD')) move.add(right);
    if (this.keys.has('KeyA')) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize();
      const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? SPRINT_SPEED : WALK_SPEED;
      const nextX = this.position.x + move.x * speed * dt;
      const nextZ = this.position.z + move.z * speed * dt;

      if (!this._collides(nextX, this.position.z)) this.position.x = nextX;
      if (!this._collides(this.position.x, nextZ)) this.position.z = nextZ;

      const targetAngle = Math.atan2(move.x, move.z);
      if (this.playerMesh) {
        const meshYaw = this.playerMesh.rotation.y;
        let diff = targetAngle - meshYaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.playerMesh.rotation.y += diff * Math.min(1, dt * 10);
      }
    }

    if (this.playerMesh) {
      this.playerMesh.position.set(this.position.x, 0.9, this.position.z);
    }

    const camDistance = 6;
    const camHeight = 2.6;
    const camX = this.position.x - Math.sin(this.yaw) * camDistance * Math.cos(this.pitch);
    const camZ = this.position.z - Math.cos(this.yaw) * camDistance * Math.cos(this.pitch);
    const camY = 1.6 + camHeight * Math.sin(this.pitch + 0.5);

    this.camera.position.set(camX, Math.max(1.2, camY), camZ);
    this.camera.lookAt(this.position.x, 1.4, this.position.z);
  }
}
