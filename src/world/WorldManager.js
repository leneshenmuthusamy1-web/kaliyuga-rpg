import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { devimaaDialogue } from '../data/dialogue/devimaa.js';
import { naradaDialogue } from '../data/dialogue/narada.js';
import * as ValleyOfKalini from './regions/valleyOfKalini.js';
import { REGION_STUBS } from './regions/regionStubs.js';

const DIALOGUE_TREES = {
  devimaa_ghost: devimaaDialogue,
  narada: naradaDialogue,
};

const REGION_BUILDERS = {
  [ValleyOfKalini.REGION_ID]: ValleyOfKalini.build,
};

function dist2(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

// Bridges the 3D scene to the game's systems: proximity-based interaction prompts,
// encounter-zone triggers into CombatSystem, and NPC markers into DialogueSystem.
// Regions without a Three.js builder yet (2-5) fall back to a placeholder scene built
// from REGION_STUBS so the architecture is provably extensible without pretending the
// content already exists.
export class WorldManager {
  constructor({ sceneManager, playerController, THREE }) {
    this.sceneManager = sceneManager;
    this.playerController = playerController;
    this.THREE = THREE;
    this.interactables = [];
    this.encounterZones = [];
    this.nearestInteractable = null;
    this.combatActive = false;
    this.dialogueActive = false;

    eventBus.on('combat:started', () => { this.combatActive = true; this.playerController.enabled = false; });
    eventBus.on('combat:ended', () => { this.combatActive = false; this.playerController.enabled = true; });
    eventBus.on('dialogue:started', () => {
      this.dialogueActive = true;
      this.playerController.enabled = false;
      if (this.nearestInteractable) {
        this.nearestInteractable = null;
        eventBus.emit('world:interactPrompt', { label: null });
      }
    });
    eventBus.on('dialogue:ended', () => { this.dialogueActive = false; this.playerController.enabled = true; });
  }

  loadRegion(regionId) {
    gameState.currentRegion = regionId;
    const builder = REGION_BUILDERS[regionId];

    const result = this.sceneManager.setScene((scene, THREE) => {
      if (builder) {
        return builder({ THREE, scene });
      }
      return this._buildStubScene(scene, THREE, regionId);
    });

    this.interactables = result.interactables || [];
    this.encounterZones = result.encounterZones || [];

    const THREE = this.THREE;
    const playerMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 1.0, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.75 })
    );
    playerMesh.castShadow = true;
    this.sceneManager.scene.add(playerMesh);
    this.playerController.playerMesh = playerMesh;

    this.playerController.setObstacles(result.obstacles || []);
    this.playerController.setPosition(result.playerStart?.x ?? 0, result.playerStart?.z ?? 0, result.playerStart?.yaw ?? 0);

    eventBus.emit('world:regionLoaded', { regionId, stub: !builder });
  }

  _buildStubScene(scene, THREE, regionId) {
    const stub = REGION_STUBS[regionId];
    scene.background = new THREE.Color(0x0d0f16);
    scene.add(new THREE.HemisphereLight(0x556677, 0x0a0a10, 0.8));
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Floating markers for each planned NPC/enemy/quest so the data model is visible
    // in-world even before full geometry exists for this region.
    const markerPositions = [];
    (stub?.markers || []).forEach((m, i) => {
      const angle = (i / (stub.markers.length || 1)) * Math.PI * 2;
      const x = Math.sin(angle) * 12;
      const z = Math.cos(angle) * 12;
      const geo = new THREE.OctahedronGeometry(0.8);
      const mat = new THREE.MeshStandardMaterial({ color: m.color || 0xf2c46d, emissive: m.color || 0xf2c46d, emissiveIntensity: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 1.2, z);
      scene.add(mesh);
      markerPositions.push({ x, z, label: m.label });
    });

    return {
      playerStart: { x: 0, z: 16, yaw: Math.PI },
      obstacles: [],
      interactables: markerPositions.map((m, i) => ({
        id: `stub_marker_${i}`,
        type: 'lore_stub',
        position: { x: m.x, z: m.z },
        radius: 3,
        label: `${m.label} (planned content)`,
        once: false,
        stubInfo: stub?.description,
      })),
      encounterZones: [],
    };
  }

  update() {
    if (this.combatActive || this.dialogueActive) return;
    const p = this.playerController.position;

    let nearest = null;
    let nearestDist = Infinity;
    for (const it of this.interactables) {
      if (it.once && it.flag && gameState.hasFlag(it.flag)) continue;
      if (it.requiresFlag && !gameState.hasFlag(it.requiresFlag)) continue;
      const d = dist2(p, it.position);
      if (d <= it.radius * it.radius && d < nearestDist) {
        nearest = it;
        nearestDist = d;
      }
    }
    if (nearest !== this.nearestInteractable) {
      this.nearestInteractable = nearest;
      eventBus.emit('world:interactPrompt', { label: nearest?.label ?? null });
    }

    for (const zone of this.encounterZones) {
      if (zone.once && gameState.hasFlag(zone.flag)) continue;
      if (zone.requiresFlag && !gameState.hasFlag(zone.requiresFlag)) continue;
      const d = dist2(p, zone.position);
      if (d <= zone.radius * zone.radius) {
        this._triggerEncounter(zone);
        break;
      }
    }
  }

  _triggerEncounter(zone) {
    if (zone.once) gameState.setFlag(zone.flag);
    CombatSystem.startEncounter(zone.enemyIds, {
      onEnd: (result) => {
        eventBus.emit('world:encounterResolved', { zone, result });
      },
    });
  }

  interact() {
    const it = this.nearestInteractable;
    if (!it) return;

    switch (it.type) {
      case 'chest': {
        // Rajan's blade is already in inventory from game start; this cache is a flavor beat.
        gameState.setFlag(it.flag);
        gameState.unlockLore('lore_boon');
        eventBus.emit('world:notification', { text: "Rajan's blade was already at your hip — but the pot held something else: a whetstone, and his handwriting. \"Left for when things go wrong.\"" });
        this.nearestInteractable = null;
        eventBus.emit('world:interactPrompt', { label: null });
        break;
      }
      case 'npc': {
        const tree = DIALOGUE_TREES[it.id];
        if (tree) DialogueSystem.start(tree);
        break;
      }
      case 'transition': {
        if (gameState.hasFlag('yaksha_liberated')) {
          eventBus.emit('world:notification', { text: 'The temple accepts you. (End of current vertical slice — Forest Road picks up from here.)' });
          gameState.setFlag('kalini_region_complete');
        } else {
          eventBus.emit('world:notification', { text: 'Something ancient still watches the temple steps. It will not let you pass while the Yaksha-child suffers.' });
        }
        break;
      }
      case 'lore_stub': {
        eventBus.emit('world:notification', { text: it.stubInfo || 'This region is data-modeled but not yet built as a 3D space.' });
        break;
      }
      default:
        break;
    }
  }
}
