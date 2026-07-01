import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { PresenceSystem } from './PresenceSystem.js';

// Dialogue trees are plain objects: { start: nodeId, nodes: { [nodeId]: node } }
// node = { speaker, line(state) => string, options: [ { tag, text, requires?, next, effects? } ] }
// tag is one of HONEST / TACTICAL / DEFLECT / NEUTRAL (NEUTRAL for plain lore-quiz nodes).
//
// Presence gates HONEST options at Low tier (see PresenceSystem). DEFLECT always costs
// a small Presence penalty per the design spec, representing the small ongoing cost of
// avoidance.

class DialogueSystemImpl {
  constructor() {
    this.activeTree = null;
    this.currentNodeId = null;
  }

  start(tree) {
    this.activeTree = tree;
    this.currentNodeId = tree.start;
    eventBus.emit('dialogue:started', { tree });
    this._emitNode();
  }

  _node() {
    return this.activeTree.nodes[this.currentNodeId];
  }

  _emitNode() {
    const node = this._node();
    if (!node) {
      this.end();
      return;
    }
    const line = typeof node.line === 'function' ? node.line(gameState) : node.line;
    const options = (node.options || [])
      .filter((opt) => !opt.requires || opt.requires(gameState))
      .map((opt) => ({
        tag: opt.tag,
        text: opt.text,
        locked: opt.tag === 'HONEST' && !PresenceSystem.isDialogueOptionAvailable('HONEST'),
        lockedReason: opt.tag === 'HONEST' ? PresenceSystem.honestLockedReason() : null,
        raw: opt,
      }));

    eventBus.emit('dialogue:node', {
      speaker: node.speaker,
      line,
      options,
    });

    if (!node.options || node.options.length === 0) {
      // Terminal node — auto-advance to end after UI shows the line.
    }
  }

  choose(index) {
    const node = this._node();
    if (!node || !node.options) return;
    const visible = node.options.filter((opt) => !opt.requires || opt.requires(gameState));
    const option = visible[index];
    if (!option) return;
    if (option.tag === 'HONEST' && !PresenceSystem.isDialogueOptionAvailable('HONEST')) return;

    this._applyEffects(option.effects);

    if (option.tag === 'DEFLECT') {
      gameState.adjustPresence(-5);
    }

    if (option.next === null || option.next === undefined) {
      this.end();
    } else {
      this.currentNodeId = option.next;
      this._emitNode();
    }
  }

  _applyEffects(effects) {
    if (!effects) return;
    if (effects.presence) gameState.adjustPresence(effects.presence);
    if (effects.setFlag) gameState.setFlag(effects.setFlag);
    if (effects.unlockLore) gameState.unlockLore(effects.unlockLore);
    if (effects.addItem) gameState.addItem(effects.addItem, effects.addItemCount || 1);
    if (effects.recruit) gameState.recruitCompanion(effects.recruit);
    if (effects.custom) effects.custom(gameState);
  }

  advance() {
    const node = this._node();
    if (node && (!node.options || node.options.length === 0)) {
      if (node.next) {
        this.currentNodeId = node.next;
        this._emitNode();
      } else {
        this.end();
      }
    }
  }

  end() {
    this.activeTree = null;
    this.currentNodeId = null;
    eventBus.emit('dialogue:ended', {});
  }
}

export const DialogueSystem = new DialogueSystemImpl();
