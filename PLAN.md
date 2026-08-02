# Implementation Plan — HD-2D RPG Prototype

**Engine:** Godot 4.3+ · **Target:** HTML5 (WebGL2, Compatibility renderer)
**Aesthetic:** Octopath Traveler — 2D pixel-art standees in a low-poly 3D diorama
**Mechanics:** Octopath-style turn-based combat (Break & Boost), towns, dungeons, party progression

This is the single source of truth for build order. Each phase ends with a
committed, runnable state and explicit acceptance criteria. We do not start a
phase until the previous one meets its criteria.

---

## Design Pillars

1. **Diorama presentation** — billboarded pixel sprites, tilt-shift blur,
   hard retro shadows, pitched-down camera. The world should read as a
   miniature toy set.
2. **Break & Boost combat** — the Octopath core loop: probe enemy weaknesses,
   shave shield points, break enemies to stun them, spend banked Boost Points
   for burst turns.
3. **Browser-first performance** — every system is built knowing it ships as
   a WebGL2 export. No feature lands if it can't run smoothly in a browser.

## Asset Pipeline

| Asset type | Source | Format | Destination |
|---|---|---|---|
| Character/NPC sprite sheets | Retrodiffusion / Pixellab | PNG (nearest-filtered) | `assets/sprites/` |
| Environment meshes | Meshy.ai | glTF (.glb preferred over .fbx) | `assets/models/` |
| UI textures | Pixellab / hand-made | PNG | `assets/sprites/` |
| Audio | TBD (e.g. jsfxr, purchased packs) | OGG (web-safe) | `assets/audio/` |

Placeholder procedural resources (gradient standees, box meshes) are used
until real assets land; every placeholder is swappable without code changes.

---

## Phase 0 — Foundation ✅ DONE

- Project config: Compatibility renderer, nearest filtering, hard 1024px shadows,
  arrow + WASD input map.
- `Player3D.gd`: grid movement (2.0-unit cells, 0.25 s linear tween), input
  buffering, pre-step collision sweep via `test_move()`.
- `BillboardSprite.gd`: strict Y-axis cylindrical billboarding.

## Phase 1 — Visual Proof (Diorama Test Scene)

**Goal:** walk a standee around a lit 3D diorama with tilt-shift, in-browser look achieved.

- [ ] `src/shaders/tilt_shift.gdshader` — Godot 4 syntax (`hint_screen_texture`),
      12-tap poisson blur scaling toward top/bottom of screen, crisp center band,
      tunable uniforms (focus center, band height, falloff, max radius).
- [ ] `src/scenes/player.tscn` — CharacterBody3D + box collider + billboard
      Sprite3D (procedural placeholder standee) + pitched follow camera.
- [ ] `src/scenes/world.tscn` — ground plane, obstacle blocks on grid cells,
      directional sun with hard shadows, sky environment, full-screen tilt-shift
      ColorRect on a CanvasLayer. Set as main scene.

**Accept when:** F5 runs; player steps cell-to-cell, blocks stop movement, sprite
never tilts, top/bottom of screen visibly blurred, center crisp.

## Phase 2 — Core Architecture (Autoloads & Interaction)

**Goal:** the skeleton every later system plugs into.

- [ ] `src/autoload/GlobalSignal.gd` — signal bus (interaction, dialogue,
      battle start/end, scene change requests).
- [ ] `src/autoload/GameState.gd` — party roster, inventory, flags, gold;
      serializable to Dictionary from day one (save-ready).
- [ ] `src/autoload/SceneManager.gd` — scene transitions with fade in/out,
      spawn-point targeting.
- [ ] Interaction system: `Interactable` base (Area3D), player raycasts the cell
      it faces, `ui_accept` triggers. First interactables: sign, chest.
- [ ] Dialogue UI: bottom text box, typewriter reveal, multi-page, portrait slot.

**Accept when:** player reads a sign, opens a chest (item enters GameState),
and transitions between two maps through a door with a fade.

## Phase 3 — World Content (NPCs & Town)

**Goal:** one town + one dungeon-entrance map that feel inhabited.

- [ ] `NPC3D.tscn` — billboard standee, optional grid wander, dialogue data
      (Resource-based, not hardcoded strings).
- [ ] Town map: shops-to-be, homes, NPCs with dialogue.
- [ ] Dungeon exterior/interior maps wired via SceneManager.
- [ ] First real art pass: swap placeholder standees for Retrodiffusion sheets
      (idle + 4-direction walk), first Meshy.ai environment meshes.

**Accept when:** walking the town, talking to 3+ NPCs, and entering the dungeon
all work with real(ish) art.

## Phase 4 — Battle Core (Break & Boost)

**Goal:** the Octopath combat loop, functional with debug UI.

Combat rules (locked now so systems agree):

- **Turn order:** speed-sorted initiative, recalculated each round; current and
  next-round order displayed on a bar.
- **Shields & weaknesses:** every enemy has shield points and a weakness set
  (weapon types + elements). A hit matching a weakness removes 1 shield point
  (+1 per Boost level). At 0 → **Break**: enemy loses its next turn, takes
  ×2 damage until the end of that turn, then shields reset.
- **Boost:** each battler gains 1 BP at the start of their turn (max 5) unless
  they spent BP on their previous turn. Spend up to 3 BP on an action: extra
  weapon hits or amplified skill power.
- Battlers, skills, and enemies are data-driven `Resource`s (`BattlerStats`,
  `SkillData`, `EnemyData`) so content is added without touching logic.

- [ ] `BattleManager` state machine (round start → turn → resolve → win/lose).
- [ ] Damage formula with variance, weakness/break multipliers, boost scaling.
- [ ] Minimal battle scene: side-view diorama stage, party standees vs enemy
      standees, debug command list (Attack / Skill / Boost / Defend / Flee).

**Accept when:** a scripted 2v2 battle is winnable/losable purely through the
Break & Boost rules above.

## Phase 5 — Battle Presentation & AI

- [ ] Real battle UI: command menu, target picker, shield/weakness readout
      (hidden until discovered, Octopath-style "???" reveal), turn-order bar,
      BP pips, damage popups.
- [ ] Enemy AI: weighted action selection, weakness-probing patterns, boss flags.
- [ ] Attack/hit/break animations (sprite frame swaps + tweens), screen shake,
      break flash.

**Accept when:** a battle is fully playable without reading debug output.

## Phase 6 — Progression Systems

- [ ] XP/levels, stat growth curves.
- [ ] Jobs: 4 starter jobs (e.g. Warrior, Cleric, Scholar, Thief), job skills
      bought with JP, one passive each.
- [ ] Inventory & equipment (weapon type ties into weakness system), consumables.
- [ ] Shops (buy/sell) and inn (heal) in town.

**Accept when:** a character can level, learn a skill, equip a new weapon, and
that weapon's type matters against enemy weaknesses.

## Phase 7 — Encounters & Dungeon Loop

- [ ] Step-based random encounters on grid movement (zone-configured rates and
      enemy tables), battle transition swirl.
- [ ] One full dungeon: 3+ maps, chests, a miniboss, a boss.
- [ ] Game over → title flow; victory rewards (XP/JP/gold/items).

**Accept when:** town → dungeon → boss → back to town is a complete, balanced
15-minute play loop.

## Phase 8 — Persistence & Audio

- [ ] Save/load (GameState → JSON, browser `user://` storage — test IndexedDB
      persistence in the actual web export early).
- [ ] Music per scene (town/dungeon/battle) with crossfade; SFX for UI, steps,
      combat hits, breaks.

## Phase 9 — Web Export & Polish

- [ ] HTML5 export preset; verify Compatibility rendering, texture compression,
      total download size budget (< ~50 MB initial target).
- [ ] Loading screen, itch.io (or static host) deployment, mobile-browser sanity
      check.
- [ ] Performance pass: draw calls, shadow distance, tilt-shift tap count.

---

## Working Agreements

- Every phase = at least one commit with a runnable project.
- Static typing everywhere; no placeholder-comment stubs.
- Content lives in `Resource` files, logic in scripts — swapping placeholder
  art or data never requires code edits.
- Anything that might behave differently in WebGL2 (shaders, storage, audio)
  gets verified in an actual web export during its phase, not at the end.
