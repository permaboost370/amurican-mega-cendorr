# Tessera — HD-2D Persistent Multiplayer City-Builder

A Travian-class persistent multiplayer strategy game where every player's
city is a living Octopath Traveler-style HD-2D diorama: pixel-art billboard
citizens inside a low-poly 3D miniature world, running in the browser
(Godot 4.x → WebGL2) on top of an authoritative Node.js/PostgreSQL backend.

**The master plan — full game design, art pipeline, architecture, and
production model — lives in [GAME_PLAN.md](GAME_PLAN.md).**

## Structure

```
├── assets/
│   ├── sprites/     # Pixel-art character sheets, UI textures
│   └── models/      # Low-poly .gltf/.fbx meshes & textures
├── src/
│   ├── autoload/    # Global singletons (GlobalSignal, GameState)
│   ├── entities/    # Player, NPCs, interactive objects
│   ├── scenes/      # World levels, town maps, dungeon scenes
│   └── shaders/     # Tilt-shift post-processing, custom spatial shaders
└── project.godot
```

## Implemented

- **Project configuration** — Compatibility renderer (WebGL2), nearest-neighbor
  texture filtering, hard low-res shadows, arrow-key + WASD input map.
- **`src/entities/Player3D.gd`** — discrete grid movement (2.0-unit cells,
  0.25 s tweened steps) with input buffering and pre-step collision sweeps.
- **`src/entities/BillboardSprite.gd`** — strict cylindrical (Y-axis only)
  billboarding so standee sprites never lean back under a pitched camera.

## Status

Milestone M0 (rendering foundation) is complete: a runnable diorama test
scene (`src/scenes/world.tscn`, set as main scene) with grid movement,
billboard standee, hard shadows, and the tilt-shift post-processing shader.
Next: M1 (city diorama client) per [GAME_PLAN.md](GAME_PLAN.md).

## Running

Open the project in Godot 4.3+ and press F5. Move with arrow keys or WASD.
