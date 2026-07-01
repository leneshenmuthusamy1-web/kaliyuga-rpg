import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { LORE_ENTRIES } from '../data/lore.js';
import { ITEMS } from '../data/items.js';
import { COMPANIONS } from '../data/companions.js';
import { SaveManager } from '../core/SaveManager.js';

const loreEl = document.getElementById('lore-archive');
const invEl = document.getElementById('inventory-panel');
const pauseEl = document.getElementById('pause-menu');

function anyPanelOpen() {
  return !loreEl.classList.contains('hidden') || !invEl.classList.contains('hidden') || !pauseEl.classList.contains('hidden');
}

function closeAll() {
  loreEl.classList.add('hidden');
  invEl.classList.add('hidden');
  pauseEl.classList.add('hidden');
}

export const PanelsUI = {
  init({ playerController, onQuitToTitle }) {
    this.playerController = playerController;
    this.onQuitToTitle = onQuitToTitle;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleLore();
      } else if (e.code === 'KeyI') {
        this.toggleInventory();
      } else if (e.code === 'Escape') {
        this.togglePause();
      }
    });
  },

  _setEnabled(enabled) {
    if (this.playerController) this.playerController.enabled = enabled;
  },

  toggleLore() {
    if (!loreEl.classList.contains('hidden')) {
      closeAll();
      this._setEnabled(true);
      return;
    }
    closeAll();
    this.renderLore();
    loreEl.classList.remove('hidden');
    this._setEnabled(false);
  },

  renderLore() {
    const entriesHtml = LORE_ENTRIES.map((entry) => {
      const unlocked = gameState.unlockedLore.has(entry.unlock);
      return `<div class="lore-entry ${unlocked ? '' : 'locked'}">
        <h3>${unlocked ? entry.title : '??? — Undiscovered'}</h3>
        <p>${unlocked ? entry.text : 'This entry unlocks through gameplay — find items, complete quests, or speak with Narada.'}</p>
      </div>`;
    }).join('');
    loreEl.innerHTML = `<button class="close-btn" data-close>Close</button><h2>Lore Archive</h2>${entriesHtml}`;
    loreEl.querySelector('[data-close]').addEventListener('click', () => this.toggleLore());
  },

  toggleInventory() {
    if (!invEl.classList.contains('hidden')) {
      closeAll();
      this._setEnabled(true);
      return;
    }
    closeAll();
    this.renderInventory();
    invEl.classList.remove('hidden');
    this._setEnabled(false);
  },

  renderInventory() {
    const itemsHtml = Object.entries(gameState.inventory)
      .map(([id, count]) => `<div class="lore-entry"><h3>${ITEMS[id]?.name ?? id} x${count}</h3><p>${ITEMS[id]?.flavor ?? ''}</p></div>`)
      .join('') || '<p>No items.</p>';

    const rosterHtml = Array.from(gameState.recruitedCompanions)
      .map((id) => {
        const c = COMPANIONS[id];
        const active = gameState.activeParty.includes(id);
        return `<div class="lore-entry"><h3>${c.name} ${active ? '(active)' : ''}</h3><p>${c.role} — ${c.ability.name}: ${c.ability.desc}</p></div>`;
      })
      .join('') || '<p>No companions recruited yet.</p>';

    invEl.innerHTML = `
      <button class="close-btn" data-close>Close</button>
      <h2>Inventory</h2>${itemsHtml}
      <h2>Party Roster</h2>${rosterHtml}
    `;
    invEl.querySelector('[data-close]').addEventListener('click', () => this.toggleInventory());
  },

  togglePause() {
    if (!pauseEl.classList.contains('hidden')) {
      closeAll();
      this._setEnabled(true);
      return;
    }
    closeAll();
    this.renderPause();
    pauseEl.classList.remove('hidden');
    this._setEnabled(false);
  },

  renderPause() {
    pauseEl.innerHTML = `
      <h2>Paused</h2>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
        <button data-resume>Resume</button>
        <button data-save>Save Game</button>
        <button data-quit>Quit to Title</button>
      </div>
    `;
    pauseEl.querySelector('[data-resume]').addEventListener('click', () => this.togglePause());
    pauseEl.querySelector('[data-save]').addEventListener('click', () => {
      SaveManager.save(gameState);
      eventBus.emit('world:notification', { text: 'Game saved.' });
    });
    pauseEl.querySelector('[data-quit]').addEventListener('click', () => {
      closeAll();
      this.onQuitToTitle?.();
    });
  },
};

export { anyPanelOpen };
