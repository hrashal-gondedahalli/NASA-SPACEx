# Junior Astronaut Mission Trainer 🚀

A browser-based space learning project for children, with two connected experiences: **Space Aero** for rocket building and simulated voyages, and **Orbit Academy** for astronaut training and science activities.

Built with HTML, CSS and JavaScript. No account, backend or production build step is required.

## Try the apps

| App | Open online | Main activities |
| --- | --- | --- |
| **Space Aero** | [Rocket workshop & space voyage](https://hrashal-gondedahalli.github.io/NASA-SPACEx/) | Customize a rocket, draw a blueprint, launch, explore and earn credits |
| **Orbit Academy** | [Junior astronaut training](https://hrashal-gondedahalli.github.io/NASA-SPACEx/junior-astronaut-mission-trainer/) | Complete checklists, discover planets, answer a quiz and compare gravity |

Each app includes a link to the other.

## Space Aero

### How to play

1. Select **Start Your Mission** and choose a destination.
2. Enter the workshop. Your rocket starts with an engine, fuel tank, body and nose cone.
3. Customize the rocket with component tiles. Click or tap to add/remove optional parts, or drag a tile onto the blueprint with a mouse.
4. Turn **Draw** on to sketch with a mouse, touch or pen. Use **Clear sketch** to erase the drawing.
5. Select **Test My Rocket** to review component readiness.
6. Begin the countdown, try the flight controls, then continue to exploration.
7. Deploy an installed satellite, collect science data and return to Earth for your mission score and credits.
8. Select **Plan Another Mission** to play again.

### Features

- **Eight destinations:** Moon, Mars, Jupiter, Saturn, Mercury, Venus, Asteroid Belt and Earth Orbit.
- **Six component types:** engine, fuel tank, rocket body, fins, satellite and nose cone.
- **Workshop credits:** start with 100 credits; purchased optional parts are refunded when removed or when the design is reset. Starter parts do not generate refunds.
- **Blueprint canvas:** decorative freehand drawing, clear/reset controls and sketch preservation when the viewport resizes.
- **Readiness checks:** body, engine and fuel tank are required; fins and satellite are optional.
- **Animated launch:** countdown, destination display, steering and animation-speed controls. Leaving the launch screen cancels its countdown.
- **Exploration objectives:** satellite deployment and science collection, followed by a results screen and credit rewards.

### Flight controls

| Action | Keyboard | On-screen control |
| --- | --- | --- |
| Steer left | Left arrow | Left |
| Steer right | Right arrow | Right |
| Faster animation | Up arrow | Thrust |
| Slower animation | Down arrow | Slow down |

The current controls change the rocket animation's position and speed. Fuel consumption, collision detection, landing physics and destination-specific success/failure challenges are not implemented. All destinations currently share the same exploration flow.

## Orbit Academy

| Activity | What the player does | Progress earned |
| --- | --- | --- |
| **Launch Sequence** | Complete five pre-flight learning checks | Flight Ready badge, 40 XP and one completed mission |
| **Planet Explorer** | Read facts about Mercury, Venus, Earth and Mars; collect discovery stamps | 15 XP per new planet; Planet Pathfinder badge after all four |
| **Space Quiz** | Answer five multiple-choice questions with explanations | 10 XP per correct answer plus 10 XP per completed attempt; Space Scholar badge and mission completion at 3/5 or better |
| **Gravity Playground** | Adjust rover mass from 5–100 kg and compare weight on Moon, Mars, Earth and Jupiter | Science activity explaining mass and weight |

The cadet dashboard includes a name, XP, level, completed mission count and four achievement badges. **Mission Master** is awarded after completing all three training missions. Each 100 XP increases the cadet level.

### Gravity calculations

Weight is calculated as **mass × gravitational acceleration**, in newtons (N). Mass stays the same between worlds.

| World | Gravity used |
| --- | --- |
| Moon | 1.62 m/s² |
| Mars | 3.71 m/s² |
| Earth | 9.81 m/s² |
| Jupiter | 24.79 m/s² |

For example, a 30 kg rover weighs **48.6 N on the Moon** and **294.3 N on Earth**.

## Saved progress

| App | Storage behaviour |
| --- | --- |
| **Space Aero** | Credits, rocket design, sketch and mission state last for the current page session. Refreshing resets them. |
| **Orbit Academy** | Cadet name, XP, best quiz score, discovery stamps and completion flags are stored in this browser's local storage. |

Orbit Academy progress does not sync between devices or browsers. Clearing site data removes saved progress. If storage writes are unavailable, the app remains usable for the current visit. An unfinished checklist or quiz attempt is not restored after a refresh.

## Run locally

Clone the repository and serve it with Python 3:

```sh
git clone https://github.com/hrashal-gondedahalli/NASA-SPACEx.git
cd NASA-SPACEx
python3 -m http.server 8000
```

Open:

- Space Aero: <http://localhost:8000/>
- Orbit Academy: <http://localhost:8000/junior-astronaut-mission-trainer/>

The app itself requires only a modern browser with JavaScript, Canvas, Pointer Events and ResizeObserver support. Node.js is needed only for the automated tests.

## Automated checks

Use **Node.js 22 or newer**:

```sh
npm install
npx playwright install --with-deps chromium
npm test
```

The Playwright tests start their own local server and cover:

- Desktop and emulated touch mobile layouts, including horizontal overflow checks.
- Blueprint drawing, clearing and preservation through resizing.
- Component purchase refunds and design reset.
- Countdown cancellation, flight controls and mission completion.
- Moon/Earth weight calculations.
- Orbit Academy saved progress and unavailable storage.
- Uncaught browser JavaScript errors along the tested journeys.

To use an existing Chromium installation:

```sh
CHROMIUM_PATH=/path/to/chromium npm test
```

GitHub Actions runs these checks on pull requests and pushes to `main`. Touch emulation does not replace testing on physical iOS and Android devices.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | Space Aero markup, styles and game logic |
| `junior-astronaut-mission-trainer/index.html` | Orbit Academy markup, styles and learning activities |
| `tests/site.test.cjs` | Automated browser regression checks and temporary test server |
| `package.json` | Test command and Playwright dependency |
| `.github/workflows/site-checks.yml` | GitHub Actions browser checks |

## Deployment

The site is hosted on **GitHub Pages**. The existing **pages build and deployment** workflow publishes the configured source after changes reach `main`; inspect its status in the repository's **Actions** tab.

Use the full app links above, including `/NASA-SPACEx/`. No bundling, API keys or server-side setup is required.

## Current scope and next steps

This is an educational prototype. It has no NASA or SpaceX API integration, live mission telemetry, user accounts or cloud storage.

Planned improvements, not yet implemented:

- A unified Mission Control dashboard and shared progress across both apps.
- Persistent Space Aero designs, credits and completed missions.
- An empty-workshop building mode with removable core components.
- Fuel-based gameplay, obstacles, failure feedback and retry flows.
- Distinct Earth-orbit satellite and Moon-landing missions.
- Expanded planet activities, quizzes and accessibility checks.

The experience uses simplified game rules and is not real spacecraft guidance or astronaut training.
