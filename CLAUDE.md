# Kek Battles — Claude Code Session Context

## What this project is

**Kek Battles: Rise of the Kekistan Republic** — an HD-2D persistent
multiplayer city-builder (Travian-class) for the browser. Godot 4.3+ client
(WebGL2, Compatibility renderer) + authoritative Node.js/TypeScript backend.

**`GAME_PLAN.md` is the single source of truth.** Read it before designing or
building anything. It contains the full game design (with balance numbers),
art pipeline, architecture, milestones, and working agreements. Any change to
the game is a change to that file first.

## Current status

- **M0 complete** (rendering foundation): project config, grid movement
  (`src/entities/Player3D.gd`), cylindrical billboards
  (`src/entities/BillboardSprite.gd`), tilt-shift shader
  (`src/shaders/tilt_shift.gdshader`), runnable test diorama
  (`src/scenes/world.tscn`, main scene).
- **Next: M1** (city diorama client on mock data) ∥ **M2** (rules engine +
  backend core) — see GAME_PLAN.md §30.

## Execution model (GAME_PLAN.md §29)

The main session (Fable 5) is architect/orchestrator: it decomposes milestones
into work packages, reviews all output, integrates, and updates the plan.
Implementation is delegated to **Opus 5 subagents** (Agent tool,
`model: "opus"`), run in parallel when packages are independent. No unreviewed
agent code lands.

## Hard rules (release-blocking, from GAME_PLAN.md)

1. **Server authority:** the client never computes a gameplay outcome.
2. **Balance numbers live in data files**, never hardcoded in logic.
3. **Brand safety (§18):** no canonical Kekistan flag layouts, no Pepe
   likeness, no real-world politics, no copyrighted anthem. Every frog and
   flag asset passes the §18 checklist.
4. **Nothing on-chain grants gameplay power.**
5. Anything browser-sensitive is verified in a real web export in its
   milestone.

## Code conventions

- **GDScript:** Godot 4, explicit static typing (`var x: Vector3`,
  `-> void`), no placeholder comments — write every line of logic. Resource
  paths use `res://` per the layout in GAME_PLAN.md §23.
- **Rendering constraints:** Compatibility renderer only; nearest-neighbor
  filtering; hard shadows; `pixel_size = 0.05` and the sprite density rules in
  §16 are fixed.
- **Server (when it exists):** TypeScript strict mode; the rules engine in
  `server/src/engine/` stays pure (deterministic, zero I/O) with golden-vector
  tests.
- Commit at every runnable state; every milestone ends committed and
  demoable.
