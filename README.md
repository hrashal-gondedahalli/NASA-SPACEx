# Space Aero & Orbit Academy

Two standalone educational HTML apps, hosted by GitHub Pages:

- [Space Aero](https://hrashal-gondedahalli.github.io/NASA-SPACEx/): rocket workshop, blueprint drawing, simulated launch and exploration.
- [Orbit Academy](https://hrashal-gondedahalli.github.io/NASA-SPACEx/junior-astronaut-mission-trainer/): checklists, planet facts, quiz and gravity lab.

Both pages link to each other. No build step or backend is required. Orbit Academy saves progress in the current browser; Space Aero progress lasts for the current visit.

## Local checks

Use Node.js 22 or newer:

```sh
npm install
npx playwright install --with-deps chromium
npm test
```

The tests start their own local server and exercise desktop and emulated touch mobile layouts, sketch drawing/clearing/resizing, component refunds, countdown cancellation, mission completion, gravity calculations, saved progress and unavailable storage. To use a system Chromium installation, set `CHROMIUM_PATH` to its executable.

GitHub Actions runs these checks on pull requests and pushes to `main`. Touch emulation does not replace testing on physical iOS and Android devices.

## Publishing

GitHub Pages is already enabled. Its existing `pages build and deployment` workflow publishes the configured source after changes reach `main`. Open the full links above, including the repository path and trailing slash. Deployment status is visible under the repository's Actions tab.
