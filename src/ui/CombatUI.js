import { eventBus } from '../core/EventBus.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { gameState } from '../core/GameState.js';
import { ITEMS } from '../data/items.js';

const root = document.getElementById('combat-ui');

const TARGETED_ACTIONS = new Set(['attack', 'gnosis', 'tandava_low']);
const USABLE_ITEM_IDS = ['devimaas_rice', 'sindoor_pouch', 'dharma_counter_charm', 'devotion_token'];

export const CombatUI = {
  init() {
    this.log = [];
    this.awaitingTargetFor = null;
    this.choosingItem = false;

    eventBus.on('combat:started', (state) => { this.log = []; this.show(state); });
    eventBus.on('combat:log', ({ text }) => { if (text) this.log.push(text); this.renderLog(); });
    eventBus.on('combat:turn', (payload) => this.renderCombatants(payload.state));
    eventBus.on('combat:damage', () => this.renderCombatants(CombatSystem.getState()));
    eventBus.on('combat:awaitingPlayerAction', ({ state }) => {
      this.awaitingTargetFor = null;
      this.choosingItem = false;
      this.renderCombatants(state);
      this.renderActions();
    });
    eventBus.on('combat:ended', () => this.hide());
  },

  show(state) {
    root.classList.remove('hidden');
    this.renderCombatants(state);
    this.renderActions();
  },

  hide() {
    root.classList.add('hidden');
    root.innerHTML = '';
  },

  renderCombatants(state) {
    if (!state) return;
    const partyHtml = state.party
      .map((c) => {
        const dead = c.hp <= 0;
        const acting = state.acting === c.id ? 'acting' : '';
        return `<div class="combatant-card ${dead ? 'dead' : ''} ${acting}">
          <div class="cname">${c.name}</div>
          <div>HP: ${Math.max(0, c.hp)}/${c.maxHp}</div>
          ${c.mana !== undefined ? `<div>Mana: ${Math.max(0, c.mana)}/${c.maxMana}</div>` : ''}
        </div>`;
      })
      .join('');

    const enemyHtml = state.enemies
      .map((e) => {
        const dead = e.currentHp <= 0;
        const acting = state.acting === e.instanceId ? 'acting' : '';
        const targetable = this.awaitingTargetFor && !dead ? 'style="cursor:pointer;outline:1px solid #f2c46d"' : '';
        return `<div class="combatant-card ${dead ? 'dead' : ''} ${acting}" data-target="${e.instanceId}" ${targetable}>
          <div class="cname">${e.name}${e.boss ? ' ★' : ''}</div>
          <div>HP: ${e.revealed ? Math.max(0, e.currentHp) : '?'}/${e.revealed ? e.hp : '?'}</div>
          ${e.revealed ? `<div style="color:#b98af2">Weak: ${e.weakness}</div>` : ''}
        </div>`;
      })
      .join('');

    let logHtml = this.container()?.querySelector('.combat-log');
    root.innerHTML = `
      <div class="combatants">
        <div class="party-col">${partyHtml}</div>
        <div class="enemy-col">${enemyHtml}</div>
      </div>
      <div class="combat-log">${this.log.map((l) => `<div>${l}</div>`).join('')}</div>
      <div class="combat-actions"></div>
    `;

    if (this.awaitingTargetFor) {
      root.querySelectorAll('[data-target]').forEach((el) => {
        el.addEventListener('click', () => {
          const instanceId = el.dataset.target;
          CombatSystem.playerAction(this.awaitingTargetFor, instanceId);
          this.awaitingTargetFor = null;
        });
      });
    }
    this.renderActions();
    this.scrollLog();
  },

  container() {
    return root;
  },

  scrollLog() {
    const el = root.querySelector('.combat-log');
    if (el) el.scrollTop = el.scrollHeight;
  },

  renderLog() {
    const el = root.querySelector('.combat-log');
    if (el) {
      el.innerHTML = this.log.map((l) => `<div>${l}</div>`).join('');
      this.scrollLog();
    }
  },

  renderActions() {
    const actionsEl = root.querySelector('.combat-actions');
    if (!actionsEl) return;

    if (this.choosingItem) {
      const items = USABLE_ITEM_IDS.filter((id) => gameState.hasItem(id));
      actionsEl.innerHTML = items.length
        ? items.map((id) => `<button data-item="${id}">${ITEMS[id].name}<span class="cost">x${gameState.inventory[id]}</span></button>`).join('') + '<button data-cancel="1">Cancel</button>'
        : '<div>No usable items.</div><button data-cancel="1">Back</button>';
      actionsEl.querySelectorAll('[data-item]').forEach((btn) => {
        btn.addEventListener('click', () => {
          CombatSystem.playerAction('use_item', null, btn.dataset.item);
          this.choosingItem = false;
        });
      });
      actionsEl.querySelector('[data-cancel]')?.addEventListener('click', () => {
        this.choosingItem = false;
        this.renderActions();
      });
      return;
    }

    const actions = CombatSystem.availableActions();
    actionsEl.innerHTML = actions
      .map(
        (a) => `<button data-action="${a.id}" ${a.disabled ? 'disabled' : ''}>${a.name}${a.manaCost ? `<span class="cost">${a.manaCost} mana</span>` : ''}${a.presenceCost ? `<span class="cost">-${a.presenceCost} presence</span>` : ''}</button>`
      )
      .join('');

    actionsEl.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action;
        if (actionId === 'use_item') {
          this.choosingItem = true;
          this.renderActions();
          return;
        }
        if (TARGETED_ACTIONS.has(actionId) && actionId !== 'gnosis') {
          this.awaitingTargetFor = actionId;
          this.renderCombatants(CombatSystem.getState());
          return;
        }
        if (actionId === 'gnosis') {
          // Full Pattern skill hits everyone; otherwise target the first living enemy for simplicity.
          CombatSystem.playerAction('gnosis', null);
          return;
        }
        CombatSystem.playerAction(actionId, null);
      });
    });
  },
};
