// Key items and crafting recipes from the design spec.

export const ITEMS = {
  rajans_blade: {
    id: 'rajans_blade',
    name: "Rajan's Second-Best Blade",
    type: 'weapon',
    effect: { attackAll: 1 },
    flavor: 'Left in a sealed clay pot for when things go wrong. They have gone wrong.',
  },
  yali_binding_stone_fragment: {
    id: 'yali_binding_stone_fragment',
    name: 'Yali Binding-Stone Fragment',
    type: 'quest',
    effect: { unlocksQuest: 'yali_liberation' },
    flavor: 'Warm to the touch, as though something inside it remembers being alive.',
  },
  river_stone_shard: {
    id: 'river_stone_shard',
    name: 'River-Stone Shard',
    type: 'quest',
    stackable: true,
    effect: { assemblesInto: 'vasukis_voice' },
    flavor: 'One of five. Together they carry Vasuki\'s last free words.',
  },
  sindoor_pouch: {
    id: 'sindoor_pouch',
    name: 'Sindoor Pouch',
    type: 'consumable',
    singleUse: true,
    effect: { presence: 20 },
    flavor: 'Dropped in the dust after Hanuman left. It is warm.',
  },
  devimaas_rice: {
    id: 'devimaas_rice',
    name: "Devimaa's Rice",
    type: 'consumable',
    effect: { hp: 50 },
    flavor: 'Heals 50 HP. Tastes like home.',
  },
  black_mantra_residue: {
    id: 'black_mantra_residue',
    type: 'material',
    name: 'Black Mantra Residue',
    stackable: true,
    flavor: 'Craft material for counter-charms. Drops from all Legion enemies.',
  },
  saptarishi_star_map: {
    id: 'saptarishi_star_map',
    name: 'Saptarishi Star-Map',
    type: 'quest',
    effect: { revealsHiddenPaths: true },
    flavor: 'Reward for five conversations with Narada. Reveals hidden paths on all maps.',
  },
  dharma_counter_charm: {
    id: 'dharma_counter_charm',
    name: 'Dharma Counter-Charm',
    type: 'consumable',
    effect: { enemyManaReduction: 0.3 },
    flavor: 'Crafted from Black Mantra Residue x3. Cuts enemy mana by 30%.',
  },
  purified_stone: {
    id: 'purified_stone',
    name: 'Purified Stone',
    type: 'quest',
    effect: { yaliOffering: true },
    flavor: 'A River-Stone Shard, cleansed with Black Mantra Residue. An offering the Yali will recognize.',
  },
  devotion_token: {
    id: 'devotion_token',
    name: 'Devotion Token',
    type: 'consumable',
    effect: { presence: 10 },
    flavor: 'Sindoor and river-stone, bound together. Hanuman approves.',
  },
};

export const CRAFTING_RECIPES = [
  {
    id: 'dharma_counter_charm',
    result: 'dharma_counter_charm',
    ingredients: { black_mantra_residue: 3 },
  },
  {
    id: 'purified_stone',
    result: 'purified_stone',
    ingredients: { river_stone_shard: 1, black_mantra_residue: 1 },
  },
  {
    id: 'devotion_token',
    result: 'devotion_token',
    ingredients: { sindoor_pouch: 1, river_stone_shard: 1 },
  },
];

export function getItem(id) {
  const item = ITEMS[id];
  if (!item) throw new Error(`Unknown item id: ${id}`);
  return item;
}
