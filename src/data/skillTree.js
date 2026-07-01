// Three-branch skill tree matching the three divine gifts. Unlocked at the noted
// level; the player picks one upgrade per level-up (see systems/ProgressionSystem.js).

export const SKILL_TREE = {
  brahma: {
    name: 'Brahma Branch (Gnosis)',
    gift: 'gnosis',
    nodes: [
      { level: 3, id: 'gnosis_free', name: 'Gnosis now free to use', desc: 'Still once per combat but costs 0 mana.' },
      { level: 6, id: 'karmic_reading', name: 'Passive Karmic Reading', desc: 'Enemies with exploitable weaknesses glow faintly, even outside combat.' },
      { level: 9, id: 'full_pattern', name: 'Full Pattern', desc: 'Gnosis reveals the entire enemy team at once, not just one target.' },
      { level: 12, id: 'karmic_trajectory', name: 'Karmic Trajectory', desc: 'See which enemies are "on the edge" of liberation — ready to free with one Tandava.' },
    ],
  },
  vishnu: {
    name: 'Vishnu Branch (Maya)',
    gift: 'maya',
    nodes: [
      { level: 3, id: 'second_wind', name: 'Second Wind', desc: 'Once per combat, Maya auto-heals 30 HP at the 20% HP threshold.' },
      { level: 6, id: 'maya_veil', name: 'Maya Veil', desc: 'Brief invisibility (2 turns) using Vishnu\'s seeming power.' },
      { level: 9, id: 'extended_leap', name: 'Extended Leap', desc: 'Double the leap range; reach second-floor positions.' },
      { level: 12, id: 'form_hold', name: 'Form-Hold', desc: 'Survive one killing blow at 1 HP — Maya restructures the body in the moment.' },
    ],
  },
  shiva: {
    name: 'Shiva Branch (Tandava)',
    gift: 'tandava',
    nodes: [
      { level: 3, id: 'reduced_extension_cost', name: 'Reduced Extension Cost', desc: 'Full Extension costs less Presence to channel.' },
      { level: 6, id: 'purifying_touch', name: 'Purifying Touch', desc: 'Melee variant of Tandava — contact range, no mana cost.' },
      { level: 9, id: 'karma_read', name: 'Karma-Read', desc: 'Before using Tandava, see exactly what will be burned from Vikram.' },
      { level: 12, id: 'pashupatastra', name: 'Pashupatastra (Endgame)', desc: 'Shiva\'s own weapon-form of the Tandava. Single target, instant, uncounterable. Costs 60 Presence. Use wisely.' },
    ],
  },
};

export function allNodesUpToLevel(level) {
  return Object.values(SKILL_TREE).flatMap((branch) =>
    branch.nodes.filter((n) => n.level <= level).map((n) => ({ ...n, branch: branch.gift }))
  );
}
