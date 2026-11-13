# Junior Astronaut Mission Trainer 🚀

A browser-based space learning project for children, with one **Mission Control** dashboard connecting rocket building, Space Voyage, astronaut training, Planet Explorer, Space Quiz and Gravity Playground.

Built with HTML, CSS and JavaScript. No account, backend or production build step is required.

## Open Mission Control

[Start your astronaut adventure](https://hrashal-gondedahalli.github.io/NASA-SPACEx/).

The former Orbit Academy URL redirects to Mission Control. Existing Academy progress is imported automatically on the same browser and origin.

- Enter and save an astronaut name on the dashboard.
- Choose an activity or use **Continue adventure** to resume the last activity.
- **Home**, **Back**, **Continue** and **Restart activity** provide shared navigation. Restart asks for confirmation and preserves profile, XP, badges and completed voyages.
- Flight school → Rocket Building → readiness check → Space Voyage → objectives → results → Planet Explorer → Space Quiz.
- Activities are also available individually from the dashboard. The Voyage card resumes its own checkpoint even after a visit to another activity.

## Space Aero

### How to play

1. Select **Build a rocket** and choose a destination.
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
| **Space Quiz** | Answer five multiple-choice questions with explanations | First attempt: 10 XP per correct answer plus 10 XP; later attempts award 10 XP per improvement to the best score; Space Scholar badge and mission completion at 3/5 or better |
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

One versioned browser save (`juniorAstronautSave`) holds the astronaut name, XP, badges, completed training, credits, rocket components, purchased-part refunds, blueprint strokes, completed-voyage count, objectives, unfinished checklist, quiz answers and science-lab settings.

Refresh opens Mission Control with a **Continue** button. A paused countdown resumes at the readiness check so it can restart safely. Completed results cannot award the same flight credits twice. Restarting an activity keeps earned badges and the profile; restarting a rocket mission refunds purchased parts under the existing workshop rules.

Progress does not sync between devices or browsers. Clearing site data removes saved progress. If storage is unavailable, the app remains usable for the current visit and shows a save-status message. Existing `orbitAcademySave` data is imported without deleting the original.

## Run locally

Clone the repository and serve it with Python 3:

```sh
git clone https://github.com/hrashal-gondedahalli/NASA-SPACEx.git
cd NASA-SPACEx
python3 -m http.server 8000
```

Open:

- Mission Control: <http://localhost:8000/>
- Legacy Academy URL (redirect): <http://localhost:8000/junior-astronaut-mission-trainer/>

The app itself requires only a modern browser with JavaScript, Canvas, Pointer Events and ResizeObserver support. Node.js is needed only for the automated tests.

## Automated checks

Use **Node.js 22 or newer**:

```sh
npm install
npx playwright install --with-deps chromium
npm test
```

The dependency-free state checks can run separately with `node --test tests/mission-control.test.cjs`. They check embedded-script behavior using a DOM adapter and do not verify browser rendering.

The Playwright tests start their own local server and cover:

- Desktop and emulated touch mobile layouts, including horizontal overflow checks.
- Blueprint drawing, clearing and preservation through resizing.
- Component purchase refunds and design reset.
- Countdown cancellation, flight controls and mission completion.
- Moon/Earth weight calculations.
- Shared profile, rocket/sketch persistence, quiz resume, legacy redirect and unavailable storage.
- Uncaught browser JavaScript errors along the tested journeys.

To use an existing Chromium installation:

```sh
CHROMIUM_PATH=/path/to/chromium npm test
```

GitHub Actions runs these checks on pull requests and pushes to `main`. Touch emulation does not replace testing on physical iOS and Android devices.

## Repository structure

| Path | Purpose |
| --- | --- |
| `index.html` | Unified Mission Control, engineering, flight and Academy activities |
| `junior-astronaut-mission-trainer/index.html` | Legacy redirect to Mission Control |
| `tests/mission-control.test.cjs` | Dependency-free state and migration checks |
| `tests/site.test.cjs` | Automated browser regression checks and temporary test server |
| `package.json` | Test command and Playwright dependency |
| `.github/workflows/site-checks.yml` | GitHub Actions browser checks |

## Deployment

The site is hosted on **GitHub Pages**. The existing **pages build and deployment** workflow publishes the configured source after changes reach `main`; inspect its status in the repository's **Actions** tab.

Use the full app links above, including `/NASA-SPACEx/`. No bundling, API keys or server-side setup is required.

## Current scope and next steps

This is an educational prototype. It has no NASA or SpaceX API integration, live mission telemetry, user accounts or cloud storage.

Planned improvements, not yet implemented:

- An empty-workshop building mode with removable core components.
- Fuel-based gameplay, obstacles, failure feedback and retry flows.
- Distinct Earth-orbit satellite and Moon-landing missions.
- Expanded planet activities, quizzes and accessibility checks.

The experience uses simplified game rules and is not real spacecraft guidance or astronaut training.

