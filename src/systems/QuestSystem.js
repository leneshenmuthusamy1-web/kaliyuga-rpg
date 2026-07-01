import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';

// Quests are just named flag sequences. Keeping this thin and flag-based means every
// choice the player makes (liberate vs. kill, honest vs. deflect, item found or not)
// composes into quest state without a separate branching-tree data structure to maintain.
export const QuestSystem = {
  start(questId) {
    gameState.setFlag(`quest_${questId}_started`);
    eventBus.emit('quest:started', { questId });
  },

  complete(questId, outcome = 'default') {
    gameState.setFlag(`quest_${questId}_complete`);
    gameState.setFlag(`quest_${questId}_outcome_${outcome}`);
    eventBus.emit('quest:completed', { questId, outcome });
  },

  isStarted(questId) {
    return gameState.hasFlag(`quest_${questId}_started`);
  },

  isComplete(questId) {
    return gameState.hasFlag(`quest_${questId}_complete`);
  },

  outcome(questId) {
    if (!this.isComplete(questId)) return null;
    for (const flag of gameState.flags) {
      const prefix = `quest_${questId}_outcome_`;
      if (flag.startsWith(prefix)) return flag.slice(prefix.length);
    }
    return 'default';
  },
};
