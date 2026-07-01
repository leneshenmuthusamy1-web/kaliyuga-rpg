import { gameState, PRESENCE_TIERS } from '../core/GameState.js';
import { getCompanion } from '../data/companions.js';

// Presence is the game's core tension: it governs which dialogue options are open,
// how companions speak to Vikram, and whether Priya's letter bonus is active.
export const PresenceSystem = {
  tier() {
    return gameState.presenceTier;
  },

  isDialogueOptionAvailable(tag) {
    const tier = this.tier();
    if (tag === 'HONEST') {
      // High: always. Medium: sometimes locked (we lock it deterministically off
      // rather than randomly, so a given conversation is consistent on replay).
      if (tier === PRESENCE_TIERS.LOW) return false;
      return true;
    }
    if (tag === 'TACTICAL' || tag === 'DEFLECT') return true;
    return true;
  },

  honestLockedReason() {
    return this.tier() === PRESENCE_TIERS.LOW
      ? 'Vikram cannot find the honest words. Presence too low.'
      : null;
  },

  companionLine(companionId) {
    const companion = getCompanion(companionId);
    const tier = this.tier();
    if (tier === PRESENCE_TIERS.HIGH) return companion.presenceLines.high;
    if (tier === PRESENCE_TIERS.MEDIUM) return companion.presenceLines.medium;
    return companion.presenceLines.low;
  },

  isPriyaLetterBonusActive() {
    return this.tier() !== PRESENCE_TIERS.LOW;
  },

  nilaKanthaWillSpeak() {
    return this.tier() !== PRESENCE_TIERS.LOW;
  },
};
