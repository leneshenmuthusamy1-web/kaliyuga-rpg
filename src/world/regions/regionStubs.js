// Regions 2-5, modeled as structured data per the design spec but without built
// Three.js geometry yet. WorldManager renders these as a placeholder scene with
// floating markers for each planned NPC/enemy/quest so the data is inspectable
// in-game. To bring a region online: write `world/regions/<name>.js` with a
// `build({ THREE, scene })` export (see valleyOfKalini.js for the pattern) and
// register it in WorldManager's REGION_BUILDERS map.

export const REGION_STUBS = {
  forest_road: {
    name: 'The Forest Road',
    description: 'The ridgeline path south: teak forest, river fords, and the crossroads where Narada sits.',
    npcs: [
      { id: 'narada', name: 'Narada Muni', role: 'Lore / quest hints, revisitable', dialogue: 'narada' },
      { id: 'kanakavalli', name: 'Kanakavalli', role: 'Joins after clearing a patrol ambush', joinsParty: true },
    ],
    enemies: ['black_mantra_wolves', 'legion_captain'],
    keyMechanic: 'Ford crossings require Maya Leap or the rope in Meera\'s pack.',
    sideQuest: {
      id: 'wolf_who_remembered',
      name: 'The Wolf Who Remembered',
      summary: 'Find the corrupted wolf den and use Tandava to free the alpha. The freed alpha becomes a fast-travel mount between regions.',
    },
    lore: ['lore_narada', 'lore_boon'],
    markers: [
      { label: 'Narada at the Crossroads', color: 0xf2c46d },
      { label: 'Kanakavalli\'s Ambush', color: 0xd76a6a },
      { label: 'The Wolf Den', color: 0x6ad7a0 },
      { label: 'River Ford', color: 0x6ab0d7 },
    ],
  },

  shatamukha: {
    name: 'Shatamukha (City Hub)',
    description: 'The city that remembers — main hub between story beats.',
    districts: ['South Gate', 'The Ghat', 'The Archive', 'The Market', 'The Safehouse'],
    npcs: [
      { id: 'urmila', name: 'Urmila', role: 'Quest giver, lore master, tracks the binding-anchor map' },
      { id: 'devraj', name: 'Devraj', role: 'Companion, ranged DPS, notebook of witnessed miracles', joinsParty: true },
      { id: 'meera', name: 'Meera', role: 'Companion, dual blades, best combat stats', joinsParty: true },
      { id: 'kanakavalli_hub', name: 'Kanakavalli', role: 'Party leader, unlocks new patrol routes' },
      { id: 'freed_conscripts', name: '12 Freed Conscripts', role: 'Small quests, crafting recipes, track Presence' },
    ],
    storyMission: {
      id: 'siege_of_shatamukha',
      name: 'The Siege',
      waves: ['Wave 1: Vikram solo at the gate', 'Wave 2: with Devraj and Meera', 'Wave 3: Hanuman arrives'],
    },
    lore: ['lore_hanuman', 'lore_eclipse_legion'],
    markers: [
      { label: 'South Gate — Siege', color: 0xd76a6a },
      { label: 'The Ghat — Shrine/Save', color: 0x6ad7cf },
      { label: 'The Archive — Urmila', color: 0xf2c46d },
      { label: 'The Market', color: 0xd7b46a },
      { label: 'The Safehouse', color: 0x9a8f78 },
    ],
  },

  deep_forest: {
    name: 'The Deep Forest',
    description: 'East of Shatamukha; ancient Yali-guardian territories and the river where Nila-Kantha waits.',
    npcs: [
      { id: 'nila_kantha', name: 'Nila-Kantha', role: 'Joins after "The Five River Names" puzzle', joinsParty: true },
      { id: 'garuda', name: 'Garuda', role: 'Cameo — teaches Maya Leap upgrade, reveals binding-anchor + Yali binding-stone mechanic' },
    ],
    enemies: ['naga_kin_soldier', 'corrupted_yali'],
    keyMechanic: 'Yali Binding-Stones: find and Tandava them to liberate an entire clan. Liberated Yalis defend Shatamukha\'s gates.',
    sideQuest: {
      id: 'vasukis_voice',
      name: "Vasuki's Voice",
      summary: 'Find 5 River-Stone Shard fragments hidden in river tiles. Assembling them gives Nila-Kantha proof to trust Vikram fully.',
    },
    lore: ['lore_naga_binding', 'lore_yali'],
    markers: [
      { label: 'Nila-Kantha\'s River', color: 0x6ad7a0 },
      { label: 'Garuda\'s Cliff', color: 0xf2c46d },
      { label: 'Yali Clan Territory', color: 0xd7b46a },
      { label: 'River-Stone Shard Site', color: 0x6ab0d7 },
    ],
  },

  asura_road: {
    name: 'The Asura Road (End Game)',
    description: 'The march toward Mahisha-Vritra\'s throne — seven waypoints, each with a mini-boss.',
    waypoints: [
      'The Broken Ashram (free the Rishi, receive a blessing)',
      'The Chain-Bridge (recreate Rama\'s bridge logic)',
      'Airavata\'s Chains (full Tandava to begin the binding-break; high Presence cost, party reacts)',
      'The Eclipse-Legion Camp (large battle, stealth optional)',
      'The Naga-Kin Vault (Nila-Kantha\'s knowledge becomes essential)',
      'The Black Mantra Field (use Gnosis to read the field\'s logic)',
      'The Throne Hall (final confrontation)',
    ],
    finalBoss: {
      id: 'mahisha_vritra',
      phases: ['mahisha_vritra_p1', 'mahisha_vritra_p2', 'mahisha_vritra_p3'],
      summary: 'Intellectual (dialogue), Physical (party), and The Boon (full Tandava bypass, Presence check >30 for the good branch).',
    },
    lore: ['lore_airavata', 'lore_saptarishi', 'lore_villain_argument'],
    markers: [
      { label: 'The Broken Ashram', color: 0x9a8f78 },
      { label: 'The Chain-Bridge', color: 0x6ab0d7 },
      { label: "Airavata's Chains", color: 0xf2f2f2 },
      { label: 'Eclipse-Legion Camp', color: 0xd76a6a },
      { label: 'The Naga-Kin Vault', color: 0x6ad7a0 },
      { label: 'The Black Mantra Field', color: 0x3a2f6a },
      { label: 'The Throne Hall', color: 0xf2c46d },
    ],
  },
};
