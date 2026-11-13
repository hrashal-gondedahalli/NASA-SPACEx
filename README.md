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

## Moonbase: Seven Days — outpost survival

Start **Moonbase: Seven Days** on Mission Control or open `outpost/`. The 3D flight lab also links to the outpost. It is directly playable without passing a flight challenge, so younger children can start here.

- Seven decision rounds for two fictional astronauts, designed for ages 7–12. Three main gauges: battery power, oxygen and crew health. Water, food, next-day harvest and discovery points live in the supply locker.
- Allocate levels 0–2 to oxygen production, water recycling, greenhouse and research. Habitat needs 20 power each day; each level uses 10. Solar generation plus stored battery limits spending. Unused power charges a battery capped at 60.
- Crew consumes 18 oxygen, 12 water and 12 food each round. Oxygen production adds 12 per level; recycling adds 8 water per level. Greenhouse uses 3 water per level and produces 10 food per level **the next round**, making shelter days affect later supplies.
- Day 2 reduces solar generation from 60 to 40 until repaired. A repair costs 10 extra power and 6 oxygen and restores 60 solar power for the following round. Day 3 brings a fictional radiation alert: shelter costs 10 power and pauses greenhouse/research; unprotected indoor work costs 18 health, outside repair costs 35. Rest can recover 4 health when all stores are at least 20. Each store below 20 costs 12 health. Zero in any vital store or crew health triggers safe evacuation.
- Ask Earth once for advice (5 power), delivered at the start of the round two game days later. No supplies arrive. This delay is fictional and is not the Moon’s real signal travel time.
- Live plan preview, power validation, daily explanations, journal, saved completion badge, confirmation before restarting, desktop/touch controls and local browser progress. Outpost storage uses `junior-outpost-v1` and does not modify flight/academy saves. Storage failure leaves play available for the current visit. Invalid saves start a new mission with a visible notice. The badge belongs to this standalone mission and is replaced when starting over; it does not add Academy XP.

### NASA resource used in gameplay

The day 3 event is motivated by an archived **NASA CCMC DONKI** weekly report, ID `20240516-7D-001`, issued `2024-05-16T17:40:05Z`, covering 8–14 May 2024. It lists 12 X-class and 80 M-class flares. The game embeds this small attributed factual summary (see `outpost/engine.js`, `SOURCE`) and links the source in the visible science panel:

- [Archived DONKI weekly report](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/Alert/30944/1)
- [NASA CCMC May 2024 event overview](https://ccmc.gsfc.nasa.gov/storms/may2024/)

This is a curated archive reference, not a live API feed. The event motivates a shelter/production trade-off; flare classes and Earth geomagnetic indices are **not** converted into lunar astronaut dose. Resource units, health penalties, crop timing, scenario dates and communication delay are fictional teaching rules. Decision rounds do not model the lunar day/night cycle. NASA does not endorse the game. Design/code were developed with AI assistance; final submission should disclose the team’s actual AI use and cite this resource.

Suggested safe route: oxygen 2, recycling 1, greenhouse 1, research 0; repair on day 2; shelter on day 3; rest otherwise. Research can be added when stores and power allow. Complete all seven rounds with vital stores and health above zero to earn Moonbase Keeper.

Run `npm test` for engine and desktop/mobile regression checks. Outpost-specific tests cover full survival, failed missions, energy rejection without mutation, delayed harvest and advice, storm consequences, corrupted/blocked storage, reload, restart confirmation and independent Academy storage. The browser checks produce `test-results/outpost-desktop.png` and `outpost-mobile.png`.


## Run, test and publish

Serve the repository root with `python -m http.server 8000`, then open `/simulator/`. ES modules need HTTP. Install test dependencies with `npm install`, then `npx playwright install chromium` and `npm test`. `CHROMIUM_PATH` may point to an installed Chromium executable. Browser tests capture desktop/mobile screenshots in `test-results/` and check the real WebGL renderer.

GitHub Pages publishes `main` from the repository root. All assets are relative and bundled locally. Selecting another branch in GitHub does not change the public website. URL asset versions prevent stale mixed layouts after updates.

Design/code were developed with AI assistance. List the team's actual tools and NASA/third-party resources in its challenge submission. This independent project is not endorsed by NASA, SpaceX or Spaceflight Simulator.
