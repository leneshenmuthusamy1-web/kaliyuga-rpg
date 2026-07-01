import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

const hudEl = document.getElementById('hud');
const promptEl = document.getElementById('interact-prompt');

function bar(label, value, max, cls) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return `
    <div class="bar-row">
      <div class="bar-label"><span>${label}</span><span>${Math.round(value)}/${Math.round(max)}</span></div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
}

export const HUD = {
  init() {
    hudEl.classList.remove('hidden');
    this.render();
    eventBus.on('presence:changed', () => this.render());
    eventBus.on('xp:gained', () => this.render());
    eventBus.on('player:levelUp', () => this.render());
    eventBus.on('combat:ended', () => this.render());
    eventBus.on('combat:damage', () => this.render());
    eventBus.on('world:interactPrompt', ({ label }) => this.setPrompt(label));
  },

  render() {
    const p = gameState.player;
    const tier = gameState.presenceTier;
    hudEl.innerHTML = `
      <div class="name"><span>${p.name}</span><span>Lv ${p.level}</span></div>
      ${bar('HP', p.hp, p.maxHp, 'hp')}
      ${bar('Mana', p.mana, p.maxMana, 'mana')}
      ${bar('Stamina', p.stamina, p.maxStamina, 'stamina')}
      ${bar('Presence', p.presence, 100, 'presence')}
      <div class="presence-tier ${tier}">Presence: ${tier}</div>
    `;
  },

  setPrompt(label) {
    if (!label) {
      promptEl.classList.add('hidden');
      return;
    }
    promptEl.innerHTML = `<kbd>E</kbd> ${label}`;
    promptEl.classList.remove('hidden');
  },
};
