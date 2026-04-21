# Tic-Tac-Toe

A single-player tic-tac-toe game built with [SvelteKit](https://kit.svelte.dev/).

## Features

- Classic 3×3 tic-tac-toe board
- Alternating turns: crosses (X) go first, then circles (O)
- Win detection for all rows, columns, and diagonals
- Tie detection when all squares are filled
- Game-over messages for wins and ties
- Dark visual theme with high-contrast text (WCAG AA compliant)
- Hover feedback on board cells and buttons

## Stack

| Layer     | Technology     |
| --------- | -------------- |
| Framework | SvelteKit      |
| Language  | TypeScript     |
| Testing   | Cucumber (BDD) |
| Bundler   | Vite           |

## Getting Started

```bash
npm install
```

### Development server

```bash
npm run dev
```

Opens the app at [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## Scripts

| Script             | Description                            |
| ------------------ | -------------------------------------- |
| `npm run dev`      | Start the SvelteKit development server |
| `npm run build`    | Build the application for production   |
| `npm run preview`  | Preview the production build locally   |
| `npm test`         | Run Cucumber BDD tests                 |
| `npm run prettier` | Format all source files with Prettier  |

## Tests

Behaviour is specified in Cucumber feature files under `features/`:

- `features/game.feature` – game logic (moves, wins, ties)
- `features/visual_theme.feature` – dark theme and hover feedback

Run them with:

```bash
npm test
```

Step definitions are in `features/step_definitions/stepdefs.ts` and exercise the
game logic (`src/lib/game.ts`) directly, as well as inspecting the Svelte source
for visual-theme compliance.

## Project Structure

```
src/
  lib/
    game.ts          # Pure game logic (state, moves, win/tie detection)
  routes/
    +page.svelte     # Main tic-tac-toe page with UI and styling
  app.html           # SvelteKit HTML shell
features/
  game.feature       # BDD specs for game behaviour
  visual_theme.feature
  step_definitions/
    stepdefs.ts      # Cucumber step implementations
```
