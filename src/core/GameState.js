import { eventBus } from './EventBus.js';
import { getItem } from '../data/items.js';
import { getCompanion } from '../data/companions.js';

const PRESENCE_MAX = 100;
const PRESENCE_MIN = 0;

export const PRESENCE_TIERS = {
  HIGH: 'high',     // 80-100
  MEDIUM: 'medium',  // 40-79
  LOW: 'low',        // 0-39
};

function tierFor(presence) {
  if (presence >= 80) return PRESENCE_TIERS.HIGH;
  if (presence >= 40) return PRESENCE_TIERS.MEDIUM;
  return PRESENCE_TIERS.LOW;
}

// Central mutable state for the whole run. Every system reads/writes through this
// object so save/load and the consequence engine only have one place to look.
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.player = {
      name: 'Vikram',
      level: 1,
      xp: 0,
      xpToNext: 100,
      hp: 120,
      maxHp: 120,
      mana: 60,
      maxMana: 60,
      stamina: 100,
      maxStamina: 100,
      presence: 100,
      weaponBonus: 1, // Rajan's Blade
      skills: [], // unlocked skill node ids
    };

    this.flags = new Set();          // story/consequence flags, e.g. 'yaksha_liberated'
    this.unlockedLore = new Set();    // lore entry ids revealed to the player
    this.inventory = {};              // itemId -> count
    this.recruitedCompanions = new Set(); // companion ids available in roster
    this.activeParty = [];            // up to 3 companion ids currently adventuring
    this.currentRegion = 'valley_of_kalini';
    this.liberatedEnemies = new Set(); // enemy instance ids liberated, not killed
    this.killedEnemies = new Set();

    this.inventory['rajans_blade'] = 1;
  }

  // ---- Presence ----
  get presenceTier() {
    return tierFor(this.player.presence);
  }

  adjustPresence(delta) {
    const before = this.player.presence;
    this.player.presence = Math.max(PRESENCE_MIN, Math.min(PRESENCE_MAX, this.player.presence + delta));
    if (tierFor(before) !== this.presenceTier) {
      eventBus.emit('presence:tierChanged', { from: tierFor(before), to: this.presenceTier });
    }
    eventBus.emit('presence:changed', { value: this.player.presence, delta });
    return this.player.presence;
  }

  // ---- Flags (consequence tracking) ----
  setFlag(flag) {
    if (!this.flags.has(flag)) {
      this.flags.add(flag);
      eventBus.emit('flag:set', { flag });
    }
  }

  hasFlag(flag) {
    return this.flags.has(flag);
  }

  // ---- Lore ----
  unlockLore(id) {
    if (!this.unlockedLore.has(id)) {
      this.unlockedLore.add(id);
      eventBus.emit('lore:unlocked', { id });
    }
  }

  // ---- Inventory ----
  addItem(id, count = 1) {
    this.inventory[id] = (this.inventory[id] || 0) + count;
    eventBus.emit('inventory:added', { id, count, item: getItem(id) });
  }

  removeItem(id, count = 1) {
    if (!this.inventory[id]) return false;
    this.inventory[id] = Math.max(0, this.inventory[id] - count);
    if (this.inventory[id] === 0) delete this.inventory[id];
    return true;
  }

  hasItem(id, count = 1) {
    return (this.inventory[id] || 0) >= count;
  }

  // ---- Companions / Party ----
  recruitCompanion(id) {
    this.recruitedCompanions.add(id);
    if (this.activeParty.length < 3) this.activeParty.push(id);
    eventBus.emit('companion:recruited', { id, companion: getCompanion(id) });
  }

  // ---- XP / Leveling ----
  addXp(amount) {
    this.player.xp += amount;
    eventBus.emit('xp:gained', { amount });
    while (this.player.xp >= this.player.xpToNext) {
      this.player.xp -= this.player.xpToNext;
      this._levelUp();
    }
  }

  _levelUp() {
    this.player.level += 1;
    this.player.maxHp += 10;
    this.player.hp = this.player.maxHp;
    this.player.maxMana += 5;
    this.player.mana = this.player.maxMana;
    this.player.xpToNext = Math.round(this.player.xpToNext * 1.25);
    eventBus.emit('player:levelUp', { level: this.player.level });
  }

  learnSkill(nodeId) {
    if (!this.player.skills.includes(nodeId)) {
      this.player.skills.push(nodeId);
      eventBus.emit('skill:learned', { nodeId });
    }
  }

  hasSkill(nodeId) {
    return this.player.skills.includes(nodeId);
  }

  // ---- Liberation vs. kill tracking (design statement: liberation is always better) ----
  recordLiberation(enemyInstanceId, xpBonusMultiplier = 1.5) {
    this.liberatedEnemies.add(enemyInstanceId);
    this.adjustPresence(5);
  }

  recordKill(enemyInstanceId) {
    this.killedEnemies.add(enemyInstanceId);
  }

  serialize() {
    return {
      player: this.player,
      flags: Array.from(this.flags),
      unlockedLore: Array.from(this.unlockedLore),
      inventory: this.inventory,
      recruitedCompanions: Array.from(this.recruitedCompanions),
      activeParty: this.activeParty,
      currentRegion: this.currentRegion,
      liberatedEnemies: Array.from(this.liberatedEnemies),
      killedEnemies: Array.from(this.killedEnemies),
    };
  }

  deserialize(data) {
    this.player = data.player;
    this.flags = new Set(data.flags || []);
    this.unlockedLore = new Set(data.unlockedLore || []);
    this.inventory = data.inventory || {};
    this.recruitedCompanions = new Set(data.recruitedCompanions || []);
    this.activeParty = data.activeParty || [];
    this.currentRegion = data.currentRegion || 'valley_of_kalini';
    this.liberatedEnemies = new Set(data.liberatedEnemies || []);
    this.killedEnemies = new Set(data.killedEnemies || []);
  }
}

export const gameState = new GameState();
