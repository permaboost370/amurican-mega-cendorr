# HD-2D RPG Prototype

An Octopath Traveler-style HD-2D RPG built in Godot 4.x: 2D pixel-art
billboard sprites inside a low-poly 3D environment, targeting an optimized
HTML5 (WebGL2 / Compatibility renderer) browser build.

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

## Roadmap

See [PLAN.md](PLAN.md) for the full phased implementation plan. Currently at
the end of Phase 1: a runnable diorama test scene (`src/scenes/world.tscn`,
set as main scene) with grid movement, billboard standee, hard shadows, and
the tilt-shift post-processing shader.

## Running

Open the project in Godot 4.3+ and press F5. Move with arrow keys or WASD.
