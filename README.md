# Junior Astronaut Mission Trainer

Browser-based rocket building, flight and Moonbase survival. No login, backend or build step is needed.

## Rocket Builder

Open [Rocket Builder](https://hrashal-gondedahalli.github.io/NASA-SPACEx/simulator/?v=flight-20261113-3).

- 17 illustrated parts across control, landing, protection, staging, fuel, engines, boosters, utility and aero. Tap or drag to add to either connected stage; tap fitted equipment to remove it. Counts are capped, and undo/save/load remain available.
- Four tank sizes change fuel capacity, mass and visible height. Three engine types change thrust, efficiency and dry mass; choosing a type changes the selected stage's engine type. Side boosters add fuel, thrust and mass and require side releases.
- Separators enable staging. Parachutes deploy only in Earth air below 5 km and 250 m/s. Extended landing legs raise the model's safe touchdown limit to 12 m/s (8 without). RCS adds steering authority using separate propellant. Heat shields reduce heating in a simplified model. Nose cones reduce drag. Fairings can be jettisoned to shed mass. Use the flight ⚙ menu to deploy equipment or release fairings/side boosters.
- Construction is still a two-stage connected stack, not an arbitrary SFS free-placement editor. Booster fuel is shared within its stage; dropping boosters discards the proportional remaining fuel. Parts are original code-native illustrations and meshes, not SFS assets.
- Earth launch defaults to a pad-anchored camera: the rocket visibly rises relative to the pad. The camera position and aim remain fixed while its orthographic extent widens to keep ascent in view. Follow and Free modes are available. Wheel/pinch/button zoom in flight selects spacecraft-centred Follow; map zoom focuses the spacecraft rather than Earth's centre.
- Earth uses a bundled Blue Marble surface image, ocean/land detail, atmosphere, daylight sky and a local launchpad/ground reference. No live weather is implied. Image source: [Three.js r170 texture collection](https://github.com/mrdoob/three.js/blob/r170/examples/textures/planets/earth_atmos_2048.jpg); [NASA Blue Marble credit and background](https://science.nasa.gov/resource/blue-marble/). Credit: NASA Goddard Space Flight Center / Reto Stöckli and Robert Simmon; texture distributed with Three.js. See `simulator/textures/CREDITS.md`.
- All quiz screens, question gates and quiz badges have been removed. Mission completion depends on gameplay objectives only. Names, earlier earned XP and non-quiz saves are retained; retired activity bookmarks return safely to Mission Control.

## Flight model and limits

Three-dimensional position/velocity, inverse-square gravity, fuel mass flow, mass-dependent thrust, simplified atmospheric drag and heating. Planets have one-tenth real radius with surface gravity retained. Separate Earth-orbit and Moon-descent practice scenarios are available; no Earth-to-Moon transfer, terrain collision mesh, docking or full rigid-body dynamics. Parachutes do not work on the Moon. Heating, shielding, RCS, touchdown thresholds and engine parameters are fictional educational rules, not operational spacecraft engineering.

Arrow keys/WASD steer, X cuts thrust, Space stages, P pauses. Touch buttons support simultaneous input. Switching away or opening a dialog pauses flight. Time warp requires engines off and altitude above the atmosphere. Designs/records save in this browser; active flights do not survive a refresh.

## Moonbase: Seven Days

The independent outpost game at `outpost/` retains its seven-day resource-management mission, archived NASA DONKI reference, local saves and attribution. It does not require a flight or a quiz. See its in-app science panel for the distinction between real archive facts and fictional game consequences.

## Run, test and publish

Serve the repository root with `python -m http.server 8000`, then open `/simulator/`. ES modules need HTTP. Install test dependencies with `npm install`, then `npx playwright install chromium` and `npm test`. `CHROMIUM_PATH` may point to an installed Chromium executable. Browser tests capture desktop/mobile screenshots in `test-results/` and check the real WebGL renderer.

GitHub Pages publishes `main` from the repository root. All assets are relative and bundled locally. Selecting another branch in GitHub does not change the public website. URL asset versions prevent stale mixed layouts after updates.

Design/code were developed with AI assistance. List the team's actual tools and NASA/third-party resources in its challenge submission. This independent project is not endorsed by NASA, SpaceX or Spaceflight Simulator.
