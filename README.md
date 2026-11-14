# Junior Astronaut Mission Trainer

Browser-based rocket building, flight and Moonbase survival. No login, backend or build step is needed.


## Solar system and continuous Earth–Moon expedition

Choose **🌍 → 🌙 Expedition** in Rocket Builder, or open settings and tap **🚀 Moon Explorer** to load a long-range rocket. Launch, then use **Reach orbit → Travel → Land**. Guidance performs finite engine burns, uses the actual remaining fuel, and separates the booster when empty. A departure-window search reduces the required transfer burn. **✋** or manual throttle/steering cancels guidance. Advanced mode provides manual flight without these guidance buttons.

- The same position, velocity, mass, fuel and clock continue from Earth launch through lunar capture and landing. Changing the primary for telemetry does not teleport the spacecraft. Earth and Moon gravity, plus differential solar gravity, act during the journey.
- Astronomy Engine supplies date-based Sun, Moon and planetary states. Mission date means UTC noon on the chosen date. Default: 2026-11-14. The 1:10 length scale is applied consistently: gravitational parameters scale by 0.01, model velocities by √0.1 and model time by √0.1. The displayed UTC date advances accordingly. These are explicitly scaled educational worlds.
- Map → **Solar system** shows the Sun and eight planets at calculated positions. Pick a planet to inspect it. Orbital curves are osculating two-body approximations at the selected epoch; the Moon path samples the ephemeris. Point markers are enlarged for visibility. Earth has a surface image; other solar-map planet surfaces are schematic. Only Earth–Moon flight is playable in this release.
- Map gold trajectories predict unpowered flight under the expedition gravity model. A transfer assistant is additional guidance, not a claim that the gold coast path reaches the destination without burns. Reference-frame conversion and adaptive stepping are tested.
- Time warp offers ×1, ×5, ×20, ×100, ×1000 and ×10000. Junior guidance selects a useful requested warp automatically; near-surface and powered-flight limits reduce the effective warp and then restore it for coasting. Arrival in Earth or lunar orbit returns to ×1. Manual control cancels the assistant and returns to ×1. A visibility fill light helps younger players see unlit spacecraft surfaces; Advanced mode retains the darker lighting. Pausing freezes the mission. Moon Explorer is a tested example; custom rockets may run out of fuel or fail to reach orbit.
- Flight status is still local to the open tab; saved rocket designs and completed records persist. Existing separate practice scenarios retain their earlier model.
- Surface collision remains a spherical-body approximation. Detailed terrain contact, Rapier rigid bodies, astronaut EVA, docking, Mars flight and a full solar-system N-body engine are not part of this milestone.

### Astronomy Engine attribution

[cosinekitty/astronomy](https://github.com/cosinekitty/astronomy), vendored from commit [865d3da7d8112bbc7911238052c6af4aaf877181](https://github.com/cosinekitty/astronomy/commit/865d3da7d8112bbc7911238052c6af4aaf877181), MIT license; see `simulator/vendor/ASTRONOMY-LICENSE.txt`. The bundled browser build runs locally with no API key or external runtime request. Spacekit and REBOUND are not runtime dependencies. Rapier is reserved for a later terrain/rigid-body milestone.

## Rocket Builder

Open [Rocket Builder](https://hrashal-gondedahalli.github.io/NASA-SPACEx/simulator/?v=space-20261113-4).

- 17 illustrated parts across control, landing, protection, staging, fuel, engines, boosters, utility and aero. Tap or drag to add to either connected stage; tap fitted equipment to remove it. Counts are capped, and undo/save/load remain available.
- Four tank sizes change fuel capacity, mass and visible height. Three engine types change thrust, efficiency and dry mass; choosing a type changes the selected stage's engine type. Side boosters add fuel, thrust and mass and require side releases.
- Separators enable staging. Parachutes deploy only in Earth air below 5 km and 250 m/s. Extended landing legs raise the model's safe touchdown limit to 12 m/s (8 without). RCS adds steering authority using separate propellant. Heat shields reduce heating in a simplified model. Nose cones reduce drag. Fairings can be jettisoned to shed mass. Use the flight ⚙ menu to deploy equipment or release fairings/side boosters.
- Construction is still a two-stage connected stack, not an arbitrary SFS free-placement editor. Booster fuel is shared within its stage; dropping boosters discards the proportional remaining fuel. Parts are original code-native illustrations and meshes, not SFS assets.
- Earth launch defaults to a pad-anchored camera: the rocket visibly rises relative to the pad. The Earth view stays framed on the pad and automatically widens as altitude increases. Moon descent uses a fixed perspective camera with a depth range that includes the entire lunar globe. Follow and Free modes are available. Moon descent also defaults to a fixed surface view with visible landmarks; the rocket is enlarged as an overview marker. Zoom preserves the selected Fixed/Follow/Free mode, framing the current rocket position once when zooming a fixed view. Map zoom focuses the spacecraft.
- Earth uses a bundled Blue Marble surface image, ocean/land detail, atmosphere, daylight sky and a local launchpad/ground reference. No live weather is implied. Image source: [Three.js r170 texture collection](https://github.com/mrdoob/three.js/blob/r170/examples/textures/planets/earth_atmos_2048.jpg); [NASA Blue Marble credit and background](https://science.nasa.gov/resource/blue-marble/). Credit: NASA Goddard Space Flight Center / Reto Stöckli and Robert Simmon; texture distributed with Three.js. See `simulator/textures/CREDITS.md`.
- All quiz screens, question gates and quiz badges have been removed. Mission completion depends on gameplay objectives only. Names, earlier earned XP and non-quiz saves are retained; retired activity bookmarks return safely to Mission Control.

## Flight model and limits

Three-dimensional position/velocity, inverse-square gravity, fuel mass flow, mass-dependent thrust, simplified atmospheric drag and heating. Planets have one-tenth real radius with surface gravity retained. Separate Earth-orbit, Moon-descent and 30 km lunar-orbit practice scenarios are available alongside the continuous expedition above. No terrain collision mesh, docking or full rigid-body dynamics. Parachutes do not work on the Moon. Heating, shielding, RCS, touchdown thresholds and engine parameters are fictional educational rules, not operational spacecraft engineering.

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

## Space and destination maps

Space uses a dark sky, restrained stars, directional sunlight, a day/night terminator and a sunlit atmospheric rim around Earth. The Moon uses bundled surface imagery with visible maria/craters. Local crater landmarks make lunar descent visibly move against the surface. Imagery and scientific reference credits are in `simulator/textures/CREDITS.md`.

Map's selector switches between the local flight orbit, an Earth–Moon overview and close views of either world. The Moon follows a Kepler ellipse with NASA mean eccentricity and ecliptic inclination. Sizes and separation share the existing 1:10 model scale; the period follows the model gravitational parameters. Initial phase is arbitrary, not today's Moon position. Companion bodies are visual references, not additional gravity or a playable transfer.

Gold is an osculating two-body coast trajectory derived from position/velocity, with Ap/Pe markers for visible apsides; it is not a prescribed route. The curve stops at the surface or escape asymptote. Thrust and atmospheric drag will change the future orbit. Lunar orbit practice starts in a physically circular orbit at 30 km above the model Moon; prograde/retrograde burns alter the path. The legend and in-app grown-up notes explain the model limits.
