# Tic-Tac-Toe

A tic-tac-toe game built with [SvelteKit](https://kit.svelte.dev/) supporting both singleplayer and multiplayer modes.

## Features

- **Mode selection** – choose between singleplayer and multiplayer on the main screen
- Classic 3×3 tic-tac-toe board
- Alternating turns: crosses (X) go first, then circles (O)
- Win detection for all rows, columns, and diagonals
- Tie detection when all squares are filled
- Game-over messages for wins and ties
- **Multiplayer** – host creates a game and shares an invite link; game state is managed server-side and broadcast to both clients via SSE
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
- `features/multiplayer.feature` – multiplayer game flow (invite link, player roles, turns)
- `features/managed_by_server.feature` – server-side state management (move validation, SSE broadcast)

Run them with:

```bash
npm test
```

Step definitions are in `features/step_definitions/stepdefs.ts` and exercise the
game logic (`src/lib/game.ts`) and multiplayer session logic (`src/lib/multiplayerGame.ts`)
directly, as well as inspecting the Svelte source for visual-theme compliance.

## Project Structure

```
src/
  lib/
    game.ts              # Pure game logic (state, moves, win/tie detection)
    multiplayerGame.ts   # Multiplayer session management (server-side logic, SSE model)
  routes/
    +page.svelte         # Main page: mode selection, invite link, and game board
  app.html               # SvelteKit HTML shell
features/
  game.feature           # BDD specs for single-player game behaviour
  visual_theme.feature   # BDD specs for dark theme and hover feedback
  multiplayer.feature    # BDD specs for multiplayer game flow
  managed_by_server.feature  # BDD specs for server-managed state
  step_definitions/
    stepdefs.ts          # Cucumber step implementations
```
