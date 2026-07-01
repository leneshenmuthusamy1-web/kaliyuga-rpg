import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { getEnemy } from '../data/enemies.js';
import { getCompanion } from '../data/companions.js';
import { getItem } from '../data/items.js';

// Turn-based combat per the design spec: Vikram always acts first (Maya enhancement),
// then active companions, then enemies. See ACTIONS below for Vikram's kit.
//
// Liberation rule (the game's core differentiator): if the killing blow against a
// liberatable enemy is delivered by a Tandava action, the enemy is freed instead of
// killed — bonus XP, a Presence boost, and (for flagged encounters) a permanent
// consequence. Enemies marked `unkillable` cannot be finished by any action except
// their listed `weakness`, which forces the correct approach (e.g. the Corrupted
// Yaksha-Child can only ever be liberated, never killed, by construction).
// A killing blow delivered by anything else is a kill: standard XP, one-time loot.

const ACTIONS = {
  attack: { id: 'attack', name: 'Attack', manaCost: 0 },
  gnosis: { id: 'gnosis', name: 'Gnosis', manaCost: 30, oncePerCombat: true },
  maya_endure: { id: 'maya_endure', name: 'Maya Endure', manaCostPerTurn: 8 },
  maya_leap: { id: 'maya_leap', name: 'Maya Leap', manaCost: 15 },
  tandava_low: { id: 'tandava_low', name: 'Tandava: Low Extension', manaCost: 20, presenceCost: 5 },
  tandava_full: { id: 'tandava_full', name: 'Tandava: Full Extension', manaCost: 50, presenceCost: 20, aoe: true },
  use_item: { id: 'use_item', name: 'Use Item', manaCost: 0 },
  defend: { id: 'defend', name: 'Defend', manaCost: 0, manaGain: 10 },
};

const TANDAVA_ACTIONS = new Set(['tandava_low', 'tandava_full']);

function playerBaseDamage() {
  return 5 + gameState.player.level * 2 + gameState.player.weaponBonus;
}

class CombatSystemImpl {
  constructor() {
    this.active = false;
    this.enemies = [];
    this.party = [];
    this.turnQueue = [];
    this.turnIndex = -1;
    this.log = [];
    this.gnosisUsed = false;
    this.mayaEndureActive = false;
    this.defending = new Set();
  }

  startEncounter(enemyIds, { onEnd } = {}) {
    this.active = true;
    this.onEnd = onEnd;
    this.gnosisUsed = false;
    this.mayaEndureActive = false;
    this.defending = new Set();
    this.log = [];

    this.party = [
      {
        id: 'vikram',
        name: 'Vikram',
        isPlayer: true,
        hp: gameState.player.hp,
        maxHp: gameState.player.maxHp,
        mana: gameState.player.mana,
        maxMana: gameState.player.maxMana,
        defense: 2 + Math.floor(gameState.player.level / 2), // sixteen years a bounty hunter buys some instinct for not getting hit
      },
      ...gameState.activeParty.map((cid) => {
        const c = getCompanion(cid);
        return { id: c.id, name: c.name, isCompanion: true, hp: c.currentHp, maxHp: c.hp, mana: c.currentMana, maxMana: c.mana, abilityUsed: false, ability: c.ability };
      }),
    ];

    this.enemies = enemyIds.map((eid, i) => ({ ...getEnemy(eid), instanceId: `${eid}_${i}`, revealed: false }));

    this._buildTurnQueue();
    this._log(`The Eclipse-Legion's line breaks. Combat begins.`);
    eventBus.emit('combat:started', this.getState());
    this.turnIndex = -1;
    this._advanceTurn();
  }

  _buildTurnQueue() {
    this.turnQueue = [
      ...this.party.filter((c) => c.hp > 0).map((c) => ({ side: 'party', ref: c })),
      ...this.enemies.filter((e) => e.currentHp > 0).map((e) => ({ side: 'enemy', ref: e })),
    ];
  }

  _log(text) {
    this.log.push(text);
    eventBus.emit('combat:log', { text });
  }

  getState() {
    return {
      party: this.party,
      enemies: this.enemies,
      log: this.log,
      acting: this.turnQueue[this.turnIndex]?.ref?.id ?? null,
    };
  }

  _checkVictoryOrDefeat() {
    const enemiesAlive = this.enemies.some((e) => e.currentHp > 0);
    const partyAlive = this.party.some((c) => c.hp > 0);
    if (!enemiesAlive) {
      this._log('Every enemy has fallen or been freed. Victory.');
      this._endCombat('victory');
      return true;
    }
    if (!partyAlive) {
      this._log('The party has fallen.');
      this._endCombat('defeat');
      return true;
    }
    return false;
  }

  _endCombat(result) {
    this.active = false;
    gameState.player.hp = Math.max(1, this.party.find((c) => c.isPlayer)?.hp ?? gameState.player.hp);
    gameState.player.mana = this.party.find((c) => c.isPlayer)?.mana ?? gameState.player.mana;
    eventBus.emit('combat:ended', { result, state: this.getState() });
    if (this.onEnd) this.onEnd(result);
  }

  _advanceTurn() {
    if (!this.active) return;
    this.turnIndex += 1;
    if (this.turnIndex >= this.turnQueue.length) {
      // New round: Maya Endure regen ticks, mana from defend already applied on grant.
      if (this.mayaEndureActive) {
        const vikram = this.party.find((c) => c.isPlayer);
        if (vikram && vikram.hp > 0) {
          vikram.hp = Math.min(vikram.maxHp, vikram.hp + 5);
          vikram.mana = Math.max(0, vikram.mana - ACTIONS.maya_endure.manaCostPerTurn);
          if (vikram.mana <= 0) this.mayaEndureActive = false;
        }
      }
      this.defending.clear();
      this._buildTurnQueue();
      this.turnIndex = 0;
      if (this.turnQueue.length === 0) return;
    }

    const turn = this.turnQueue[this.turnIndex];
    const isDead = turn && ((turn.ref.hp !== undefined && turn.ref.hp <= 0) || (turn.ref.currentHp !== undefined && turn.ref.currentHp <= 0));
    if (isDead) {
      return this._advanceTurn();
    }

    eventBus.emit('combat:turn', { actorId: turn.ref.id, side: turn.side, state: this.getState() });

    if (turn.side === 'party' && turn.ref.isPlayer) {
      eventBus.emit('combat:awaitingPlayerAction', { state: this.getState(), gnosisUsed: this.gnosisUsed });
      return; // wait for playerAction()
    }
    if (turn.side === 'party' && turn.ref.isCompanion) {
      this._companionAct(turn.ref);
      return;
    }
    if (turn.side === 'enemy') {
      this._enemyAct(turn.ref);
      return;
    }
  }

  availableActions() {
    const vikram = this.party.find((c) => c.isPlayer);
    return Object.values(ACTIONS).map((a) => {
      let disabled = false;
      let reason = '';
      const cost = a.manaCost ?? 0;
      if (a.id === 'gnosis' && this.gnosisUsed && !gameState.hasSkill('gnosis_free')) {
        disabled = true;
        reason = 'used this combat';
      } else if (cost > vikram.mana) {
        disabled = true;
        reason = 'not enough mana';
      }
      return { ...a, manaCost: a.id === 'gnosis' && gameState.hasSkill('gnosis_free') ? 0 : cost, disabled, reason };
    });
  }

  playerAction(actionId, targetInstanceId, itemId) {
    if (!this.active) return;
    const turn = this.turnQueue[this.turnIndex];
    if (!turn || !turn.ref.isPlayer) return;
    const vikram = turn.ref;
    const action = ACTIONS[actionId];
    if (!action) return;

    const gnosisFree = gameState.hasSkill('gnosis_free');
    const manaCost = actionId === 'gnosis' && gnosisFree ? 0 : (action.manaCost ?? 0);

    if (actionId === 'gnosis' && this.gnosisUsed && !gnosisFree) return;
    if (manaCost > vikram.mana) return;

    switch (actionId) {
      case 'attack': {
        const target = this._enemyByInstance(targetInstanceId) || this.enemies.find((e) => e.currentHp > 0);
        this._dealDamage(target, playerBaseDamage(), 'attack');
        this._log(`Vikram strikes ${target.name} with Rajan's blade.`);
        break;
      }
      case 'gnosis': {
        vikram.mana -= manaCost;
        this.gnosisUsed = true;
        const full = gameState.hasSkill('full_pattern');
        const targets = full ? this.enemies.filter((e) => e.currentHp > 0) : [this._enemyByInstance(targetInstanceId) || this.enemies.find((e) => e.currentHp > 0)];
        targets.forEach((t) => { if (t) t.revealed = true; });
        this._log(`Gnosis flares behind Vikram's eyes. ${full ? "The enemy formation's weaknesses lay bare." : "A weakness is revealed."}`);
        eventBus.emit('combat:gnosis', { targets });
        break;
      }
      case 'maya_endure': {
        this.mayaEndureActive = !this.mayaEndureActive;
        this._log(this.mayaEndureActive ? 'Vikram lets Vishnu\'s endurance settle into his limbs.' : 'Vikram releases the sustained endurance.');
        break;
      }
      case 'maya_leap': {
        vikram.mana -= manaCost;
        this._log('Vikram negotiates briefly with gravity and repositions.');
        break;
      }
      case 'tandava_low': {
        vikram.mana -= manaCost;
        const presenceCost = gameState.hasSkill('reduced_extension_cost') ? action.presenceCost : action.presenceCost;
        gameState.adjustPresence(-presenceCost);
        const target = this._enemyByInstance(targetInstanceId) || this.enemies.find((e) => e.currentHp > 0);
        const dmg = Math.round((20 + gameState.player.level * 2) * (target.weakness === 'tandava_low' ? 1.5 : 1));
        this._log(`Blue-white lightning burns Karma from ${target.name}.`);
        this._dealDamage(target, dmg, 'tandava_low');
        break;
      }
      case 'tandava_full': {
        vikram.mana -= manaCost;
        const presenceCost = gameState.hasSkill('reduced_extension_cost') ? Math.round(action.presenceCost * 0.6) : action.presenceCost;
        gameState.adjustPresence(-presenceCost);
        this._log('Full Extension — the Tandava-Force floods the whole field.');
        this.enemies.filter((e) => e.currentHp > 0).forEach((target) => {
          const dmg = Math.round((15 + gameState.player.level * 1.5) * (target.weakness === 'tandava_full' ? 1.5 : 1));
          this._dealDamage(target, dmg, 'tandava_full');
        });
        break;
      }
      case 'use_item': {
        this._useItem(vikram, itemId);
        break;
      }
      case 'defend': {
        this.defending.add(vikram.id);
        vikram.mana = Math.min(vikram.maxMana, vikram.mana + (action.manaGain || 0));
        this._log('Vikram braces, blade angled to turn the next blow.');
        break;
      }
      default:
        break;
    }

    if (this._checkVictoryOrDefeat()) return;
    this._advanceTurn();
  }

  _useItem(actor, itemId) {
    if (!itemId || !gameState.hasItem(itemId)) {
      this._log('No such item to use.');
      return;
    }
    const item = getItem(itemId);
    if (item.effect?.hp) {
      actor.hp = Math.min(actor.maxHp, actor.hp + item.effect.hp);
      this._log(`Vikram eats ${item.name}. ${item.flavor}`);
    }
    if (item.effect?.presence) {
      gameState.adjustPresence(item.effect.presence);
      this._log(`${item.name} steadies Vikram's sense of himself.`);
    }
    gameState.removeItem(itemId, 1);
  }

  _enemyByInstance(instanceId) {
    return this.enemies.find((e) => e.instanceId === instanceId && e.currentHp > 0);
  }

  _dealDamage(target, rawDamage, sourceAction) {
    if (!target || target.currentHp <= 0) return;
    let dmg = Math.max(1, rawDamage - (target.defense || 0));

    const isWeaknessMatch = target.weakness === sourceAction;
    const floor = target.unkillable && !isWeaknessMatch ? 1 : 0;

    target.currentHp = Math.max(floor, target.currentHp - dmg);
    eventBus.emit('combat:damage', { targetId: target.instanceId, amount: dmg, targetHp: target.currentHp });

    if (target.currentHp <= 0) {
      this._resolveDefeat(target, sourceAction);
    } else if (target.unkillable && floor === 1 && target.currentHp === 1) {
      this._log(`${target.name} will not fall to this. Something else is needed.`);
    }
  }

  _resolveDefeat(target, sourceAction) {
    const liberated = TANDAVA_ACTIONS.has(sourceAction) && target.liberatable;
    if (liberated) {
      gameState.recordLiberation(target.instanceId);
      gameState.addXp(Math.round(target.xp * 1.5));
      this._log(`${target.name} is freed, not destroyed. The Black Mantra burns away.`);
      if (target.id === 'corrupted_yaksha') gameState.setFlag('yaksha_liberated');
      eventBus.emit('combat:liberated', { target });
    } else {
      gameState.recordKill(target.instanceId);
      gameState.addXp(target.xp);
      this._log(`${target.name} falls.`);
      if (target.alwaysLiberate) gameState.setFlag('nila_kantha_angered');
      eventBus.emit('combat:killed', { target });
    }
  }

  _companionAct(companion) {
    const livingEnemies = this.enemies.filter((e) => e.currentHp > 0);
    if (livingEnemies.length === 0) return this._advanceTurn();
    const target = livingEnemies[0];

    if (!companion.abilityUsed && companion.mana >= 10) {
      companion.abilityUsed = true;
      this._log(`${companion.name} uses ${companion.ability.name}. ${companion.ability.desc}`);
      if (companion.ability.id === 'precise_shot') {
        this._dealDamage(target, 40, 'companion_ability');
      } else if (companion.ability.id === 'formation') {
        this.party.forEach((p) => { p.formationShield = true; });
      } else if (companion.ability.id === 'ghost_step') {
        companion.untargetable = true;
      } else if (companion.ability.id === 'river_binding') {
        this.enemies.forEach((e) => { e.rooted = true; });
      }
    } else {
      const dmg = 10;
      this._dealDamage(target, dmg, 'companion_attack');
      this._log(`${companion.name} strikes ${target.name}.`);
    }

    if (this._checkVictoryOrDefeat()) return;
    this._advanceTurn();
  }

  _enemyAct(enemy) {
    if (enemy.rooted) {
      this._log(`${enemy.name} strains against the river-binding and cannot act.`);
      return this._advanceTurn();
    }
    const targets = this.party.filter((c) => c.hp > 0 && !c.untargetable);
    if (targets.length === 0) return this._advanceTurn();
    const target = targets[Math.floor(Math.random() * targets.length)];

    let dmg = Math.max(1, (enemy.attack || 5) - (target.formationShield ? 2 : 0) - (target.defense || 0));
    if (this.defending.has(target.id)) dmg = Math.round(dmg * 0.5);
    if (target.formationShield) dmg = Math.round(dmg * 0.6);

    target.hp = Math.max(0, target.hp - dmg);
    this._log(`${enemy.name} strikes ${target.name} for ${dmg}.`);
    eventBus.emit('combat:damage', { targetId: target.id, amount: dmg, targetHp: target.hp });

    if (this._checkVictoryOrDefeat()) return;
    this._advanceTurn();
  }
}

export const CombatSystem = new CombatSystemImpl();
