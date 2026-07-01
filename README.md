# Kaliyuga: The Sandhi

A browser-based, Elder-Scrolls-flavored action RPG prototype built on the Vikram / Mahisha-Vritra
story bible. Vanilla JavaScript + [Three.js](https://threejs.org/) for a lightweight 3D world, no
game framework — everything (combat, dialogue, presence, quests) is hand-rolled and readable.

## Status: vertical slice

**Region 1 — The Valley of Kalini — is fully playable**: 3D movement, the Ghost of Devimaa
tutorial dialogue, a hidden forge cache, an Eclipse-Legion scout ambush, and the Corrupted
Yaksha-Child boss (which can only ever be *liberated*, never killed, by design).

**Regions 2–5** (Forest Road, Shatamukha, Deep Forest, Asura Road) are modeled as structured data —
NPCs, enemies, quests, key mechanics, lore hooks — and rendered as a placeholder scene with floating
markers, so the content is inspectable in-game before its geometry is built. See
`src/world/regions/regionStubs.js` and "Extending" below.

A "full" Oblivion-scale open world is a multi-year, multi-discipline project; this prototype focuses
on getting the RPG *systems* Oblivion is known for right — leveling, consequence, dialogue, combat —
in a structure that a region can be added to without touching the systems underneath.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
```

`npm run build` produces a static `dist/` bundle (`npm run preview` serves it).

Controls: **WASD** move, **mouse** look (click the canvas to lock the pointer), **E** interact,
**Tab** Lore Archive, **I** Inventory & Party, **Esc** pause/save.

## Project structure

```
src/
  core/            GameState (presence, HP/mana, flags, inventory, party), SaveManager, EventBus
  data/            Static content: lore.js, items.js, enemies.js, skillTree.js, companions.js
  data/dialogue/   Dialogue trees (devimaa.js, narada.js) — HONEST/TACTICAL/DEFLECT branching
  systems/         CombatSystem, DialogueSystem, PresenceSystem, QuestSystem
  world/           WorldManager (bridges 3D scene <-> systems), regions/*.js (per-region geometry
                   + data), regionStubs.js (data for regions 2-5)
  render/          SceneManager (Three.js boilerplate), PlayerController (movement/camera/collision)
  ui/              HUD, DialogueUI, CombatUI, PanelsUI (lore/inventory/pause), NotificationsUI
  styles/          main.css
```

Everything communicates through `core/EventBus.js` — systems don't import UI, and UI doesn't import
render code — so any one layer can be swapped or extended independently.

## Core systems

- **Presence meter** (`core/GameState.js`, `systems/PresenceSystem.js`): High (80–100) / Medium
  (40–79) / Low (0–39). Gates the `[HONEST]` dialogue option, changes companion reaction lines, and
  toggles whether Priya's letter bonus is active. Using Tandava drains it; liberating an enemy
  restores +5.
- **Consequence/flag engine** (`systems/QuestSystem.js` + `GameState.flags`): every choice —
  liberate vs. kill, HONEST/TACTICAL/DEFLECT, items found — sets a flag. Quests, dialogue
  availability, and encounter gating all read off the same flag set, so consequences compose instead
  of needing a separate branching-tree data structure.
- **Combat** (`systems/CombatSystem.js`): turn-based, Vikram-first initiative. Implements the full
  action kit from the spec (Attack, Gnosis, Maya Endure, Maya Leap, Tandava Low/Full, Item, Defend).
  **Liberation rule**: if the *killing blow* on a liberatable enemy is delivered by a Tandava action,
  the enemy is freed (bonus XP, Presence +5) instead of killed (standard XP). Enemies marked
  `unkillable` (e.g. the Corrupted Yaksha-Child) can't be finished by anything except their listed
  `weakness`, which is what forces "you must liberate this one" encounters to actually work that way.
- **Dialogue** (`systems/DialogueSystem.js`): plain-object trees, presence-gated options, effects
  (presence deltas, flags, lore unlocks, item grants, recruiting companions) declared inline per
  option.
- **Lore Archive** (`data/lore.js`, `ui/PanelsUI.js`): all lore entries from the story bible,
  locked until a gameplay trigger (`GameState.unlockLore`) reveals them.

## Extending

**Add a region's real geometry**: write `src/world/regions/<name>.js` exporting `REGION_ID` and a
`build({ THREE, scene })` function returning `{ playerStart, obstacles, interactables,
encounterZones }` (copy the shape from `valleyOfKalini.js`), then register it in
`WorldManager`'s `REGION_BUILDERS` map. Once registered, `regionStubs.js`'s placeholder is bypassed
automatically.

**Add a dialogue tree**: new file in `src/data/dialogue/`, register it in `WorldManager`'s
`DIALOGUE_TREES` map keyed by the NPC's interactable `id`.

**Add an enemy/item/skill**: add an entry to the relevant `src/data/*.js` table — the systems are
data-driven, no code changes needed for a new stat block.

## Balance note

Vikram has a small flat defense (`2 + level/2`) that reduces incoming hits, but no armor system
beyond that yet. Attack-spamming through a multi-enemy fight without ever using **Defend** (50%
reduction + mana) or **Maya Endure** will still burn through a lot of HP — that's intentional
(companions split incoming damage once Kanakavalli/Devraj/Meera are recruited in later regions),
not a bug.
