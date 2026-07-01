import { eventBus } from '../core/EventBus.js';
import { getLoreEntry } from '../data/lore.js';

const root = document.getElementById('notifications');

function push(text) {
  const el = document.createElement('div');
  el.className = 'notification';
  el.textContent = text;
  root.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

export const NotificationsUI = {
  init() {
    eventBus.on('world:notification', ({ text }) => push(text));
    eventBus.on('inventory:added', ({ item, count }) => {
      if (count > 0) push(`Obtained: ${item.name}${count > 1 ? ` x${count}` : ''}`);
    });
    eventBus.on('lore:unlocked', ({ id }) => {
      const entry = getLoreEntry(id);
      push(`Lore Archive updated: "${entry?.title ?? id}"`);
    });
    eventBus.on('companion:recruited', ({ companion }) => push(`${companion.name} joins the party.`));
    eventBus.on('player:levelUp', ({ level }) => push(`Vikram reaches Level ${level}.`));
    eventBus.on('combat:liberated', ({ target }) => push(`${target.name} liberated — Presence restored.`));
    eventBus.on('presence:tierChanged', ({ to }) => push(`Presence shifts to ${to.toUpperCase()}.`));
  },
};
