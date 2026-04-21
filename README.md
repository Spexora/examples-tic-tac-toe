# Tic-Tac-Toe

A tic-tac-toe game with singleplayer and multiplayer support, built with [SvelteKit](https://kit.svelte.dev/).

## Features

- Mode selection screen (singleplayer or multiplayer)
- Classic 3×3 tic-tac-toe board
- Alternating turns: crosses (X) go first, then circles (O)
- Win detection for all rows, columns, and diagonals
- Tie detection when all squares are filled
- Game-over messages for wins and ties
- **Multiplayer**: create a game, share an invite link, play against an opponent in real time
- **Server-managed state**: moves are sent to the server; state is broadcast to both clients via Server-Sent Events (SSE)
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

- `features/game.feature` – single-player game logic (moves, wins, ties)
- `features/multiplayer.feature` – multiplayer flow (invite links, role assignment, shared board)
- `features/managed_by_server.feature` – server-managed state (client sends moves to server, SSE broadcasts)
- `features/visual_theme.feature` – dark theme and hover feedback

Run them with:

```bash
npm test
```

Step definitions are in `features/step_definitions/stepdefs.ts` and exercise:

- Pure game logic (`src/lib/game.ts`) directly for singleplayer scenarios
- `GameSession` and `GameClient` modules for multiplayer and server-managed scenarios
- Svelte source inspection for visual-theme compliance

## Project Structure

```
src/
  lib/
    game.ts           # Pure game logic (state, moves, win/tie detection)
    gameSession.ts    # Server-side multiplayer session management + SSE broadcasting
    gameClient.ts     # Client-side interface for multiplayer (sends moves, receives SSE updates)
  routes/
    +page.svelte      # Mode selection screen (singleplayer / multiplayer)
    game/
      [id]/
        +page.svelte  # Multiplayer game page (invite link, board, live updates)
    api/
      games/
        +server.ts              # POST /api/games — create a new game session
        [id]/
          join/+server.ts       # POST /api/games/:id/join — join as a player
          move/+server.ts       # POST /api/games/:id/move — submit a move
          events/+server.ts     # GET  /api/games/:id/events — SSE stream
  app.html            # SvelteKit HTML shell
features/
  game.feature
  multiplayer.feature
  managed_by_server.feature
  visual_theme.feature
  step_definitions/
    stepdefs.ts       # Cucumber step implementations
```

## Multiplayer Architecture

1. **Host** clicks "Multiplayer" → `POST /api/games` creates a session → navigates to `/game/<id>`
2. **Host** shares the URL (invite link) with an opponent
3. **Opponent** opens the URL → `POST /api/games/<id>/join` assigns them a role
4. Both players connect to `GET /api/games/<id>/events?playerId=<id>` (SSE stream)
5. When a player makes a move, `POST /api/games/<id>/move` is called
6. The server validates the move, updates game state, and broadcasts the new state to all subscribers via SSE
7. Both clients update their local state from the server broadcast — moves are never applied locally first
