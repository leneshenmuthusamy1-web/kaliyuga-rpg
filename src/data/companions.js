// Companion definitions. Max 3 active at once (enforced by systems/PartySystem.js).
// lowPresenceLine / medPresenceLine / highPresenceLine are what the companion says
// when Vikram talks to them at camp, keyed to his current Presence tier.

export const COMPANIONS = {
  kanakavalli: {
    id: 'kanakavalli',
    name: 'Kanakavalli',
    role: 'Tank / Strategist',
    hp: 140,
    mana: 30,
    stamina: 100,
    ability: {
      id: 'formation',
      name: 'Formation',
      desc: 'Reduces all party damage taken by 40% for one turn.',
    },
    joinRegion: 'forest_road',
    joinFlag: 'kanakavalli_recruited',
    presenceLines: {
      high: "You fought today like no one in that courtyard had a name. I noticed.",
      medium: "Hold the line, Vikram. I need the commander, not just the weapon.",
      low: "You fought today like no one in that courtyard had a name. I noticed.",
    },
  },
  devraj: {
    id: 'devraj',
    name: 'Devraj',
    role: 'Ranged DPS',
    hp: 90,
    mana: 40,
    stamina: 110,
    ability: {
      id: 'precise_shot',
      name: 'Precise Shot',
      desc: 'Guaranteed critical hit on a revealed weak point.',
    },
    joinRegion: 'shatamukha',
    joinFlag: 'devraj_recruited',
    presenceLines: {
      high: "Adding this to the notebook, under 'things that restored my faith in commanders.'",
      medium: "Notebook's getting thick, Vikram. Mostly in a good way. Mostly.",
      low: "I'm writing this down in my notebook. Under 'things that worried me more than the Legion did.'",
    },
  },
  meera: {
    id: 'meera',
    name: 'Meera',
    role: 'Dual-Blade DPS',
    hp: 110,
    mana: 25,
    stamina: 130,
    ability: {
      id: 'ghost_step',
      name: 'Ghost Step',
      desc: 'Becomes untargetable for one turn.',
    },
    joinRegion: 'shatamukha',
    joinFlag: 'meera_recruited',
    presenceLines: {
      high: "Good. You ate something today. I checked.",
      medium: "Eat something, Vikram. That's an order, not a suggestion.",
      low: "Vikram. When did you last eat? Don't give me a tactical answer.",
    },
  },
  nila_kantha: {
    id: 'nila_kantha',
    name: 'Nila-Kantha',
    role: 'Magic / Support',
    hp: 100,
    mana: 60,
    stamina: 80,
    ability: {
      id: 'river_binding',
      name: 'River-Binding',
      desc: 'Roots all enemies for 2 turns.',
    },
    joinRegion: 'deep_forest',
    joinFlag: 'nila_kantha_recruited',
    joinCondition: 'five_river_names_solved',
    presenceLines: {
      high: "My father has been enslaved for thirty years, Vikram. I still trust you to be the one who ends it.",
      medium: "Stay who you are. I have seen what the alternative costs.",
      low: "My father has been enslaved for thirty years. Do not become the kind of man who makes me wonder if that was worse than this.",
    },
  },
};

export function getCompanion(id) {
  const c = COMPANIONS[id];
  if (!c) throw new Error(`Unknown companion id: ${id}`);
  return { ...c, currentHp: c.hp, currentMana: c.mana, currentStamina: c.stamina };
}
