const SAVE_KEY = 'kaliyuga_sandhi_save_v1';

export const SaveManager = {
  save(gameState) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState.serialize()));
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  load(gameState) {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      gameState.deserialize(JSON.parse(raw));
      return true;
    } catch (err) {
      console.error('Failed to load save:', err);
      return false;
    }
  },

  clear() {
    localStorage.removeItem(SAVE_KEY);
  },
};
