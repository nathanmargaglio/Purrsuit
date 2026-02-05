# Purrsuit

A first-person cat-catching game built with Three.js. Chase cats through expanding ring arenas, deposit them at the crate, and upgrade your abilities between days.

**Play now:** [https://nathanmargaglio.github.io/Purrsuit/](https://nathanmargaglio.github.io/Purrsuit/)

## How to Play

- **Goal:** Catch as many cats as possible before time runs out each day
- **Movement:** WASD / Arrow keys (desktop) or left joystick (mobile)
- **Look:** Mouse (desktop) or right joystick (mobile)
- **Swing net:** Left click (desktop) or net button (mobile)
- **Deposit cats:** Press E near the crate (desktop) or deposit button (mobile)
- Clear all cats in a ring to unlock the next ring
- Spend earned cats on upgrades between days

## Project Structure

```
Purrsuit/
├── index.html              # Main HTML (game layout and UI elements)
├── css/
│   └── styles.css          # All game styles (HUD, menus, mobile controls, animations)
├── js/
│   ├── constants.js        # Game constants, ring themes, and helper functions
│   ├── state.js            # Game state object and derived stat functions
│   ├── sound.js            # Sound system (asset loading, playback, synth fallbacks)
│   ├── scene.js            # Three.js scene, camera, renderer, and lighting setup
│   ├── room.js             # Ring room geometry, expansion animation, and crate
│   ├── cats.js             # Cat spawning, AI behavior, and movement
│   ├── net.js              # Net swing mechanics and cat capture/deposit logic
│   ├── controls.js         # Desktop and mobile input handling, player movement
│   ├── ui.js               # HUD updates, upgrade screen, and flash effects
│   └── game.js             # Game loop, day start/end logic, and initialization
├── models/
│   └── maxwell_the_cat_dingus.glb
└── sounds/
    ├── sounds.json         # Sound manifest mapping categories to audio files
    ├── collect/            # Collection sound effects
    ├── meow/               # Cat meow sounds
    ├── music/              # Background music
    ├── purring/            # Cat purring sounds
    ├── screech/            # Cat screech sounds
    ├── tumbling/           # Wall tumbling sounds
    └── woosh/              # Net swing sounds
```

## Development

This is a static site with no build step. To develop locally:

1. Clone the repository
2. Serve the files with any static HTTP server, e.g.:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

## Deployment

The game is deployed via GitHub Pages from the `main` branch. Any push to `main` will automatically update the live site.

## Tech Stack

- [Three.js](https://threejs.org/) (r128) - 3D rendering
- Web Audio API - Sound effects and music
- Vanilla HTML/CSS/JS - No framework dependencies
