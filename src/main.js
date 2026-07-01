import * as THREE from 'three';
import { SceneManager } from './render/SceneManager.js';
import { PlayerController } from './render/PlayerController.js';
import { WorldManager } from './world/WorldManager.js';
import { gameState } from './core/GameState.js';
import { SaveManager } from './core/SaveManager.js';
import { eventBus } from './core/EventBus.js';
import { DialogueSystem } from './systems/DialogueSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { HUD } from './ui/HUD.js';
import { DialogueUI } from './ui/DialogueUI.js';
import { CombatUI } from './ui/CombatUI.js';
import { PanelsUI, anyPanelOpen } from './ui/PanelsUI.js';
import { NotificationsUI } from './ui/NotificationsUI.js';
import { REGION_ID as VALLEY_OF_KALINI } from './world/regions/valleyOfKalini.js';

const canvas = document.getElementById('scene-canvas');
const bootScreen = document.getElementById('boot-screen');
const startButton = document.getElementById('start-button');
const continueButton = document.getElementById('continue-button');

const sceneManager = new SceneManager(canvas);
const playerController = new PlayerController({ canvas, camera: sceneManager.camera, playerMesh: null });
const worldManager = new WorldManager({ sceneManager, playerController, THREE });

HUD.init();
DialogueUI.init();
CombatUI.init();
NotificationsUI.init();
PanelsUI.init({
  playerController,
  onQuitToTitle: () => {
    sceneManager.stop();
    document.exitPointerLock?.();
    bootScreen.classList.remove('hidden');
  },
});

sceneManager.addUpdater((dt) => {
  playerController.update(dt);
  worldManager.update();
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyE') return;
  if (DialogueSystem.activeTree || CombatSystem.active || anyPanelOpen()) return;
  worldManager.interact();
});

function beginGame({ loadSave }) {
  bootScreen.classList.add('hidden');
  if (loadSave) SaveManager.load(gameState);
  worldManager.loadRegion(gameState.currentRegion || VALLEY_OF_KALINI);
  sceneManager.start();
  eventBus.emit('world:notification', {
    text: loadSave ? 'Welcome back, Vikram.' : 'The Valley of Kalini. Ash still on the wind.',
  });
}

// Exposed for manual debugging in the browser console (window.kaliyuga).
window.kaliyuga = { gameState, worldManager, playerController, sceneManager };

startButton.addEventListener('click', () => {
  gameState.reset();
  beginGame({ loadSave: false });
});

if (SaveManager.hasSave()) {
  continueButton.classList.remove('hidden');
  continueButton.addEventListener('click', () => beginGame({ loadSave: true }));
}
