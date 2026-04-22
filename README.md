# Tic-Tac-Toe

A tic-tac-toe game with single-player and real-time multiplayer support, built with [SvelteKit](https://kit.svelte.dev/).

## Features

- **Mode selection** – choose between singleplayer and multiplayer on the home screen
- Classic 3×3 tic-tac-toe board
- Alternating turns: crosses (X) go first, then circles (O)
- Win detection for all rows, columns, and diagonals
- Tie detection when all squares are filled
- Game-over messages for wins and ties
- **Singleplayer bot** – the user always plays as X; the bot (O) responds automatically, blocks winning threats, and takes winning moves when available
- **Multiplayer** – create a game and share an invite link; state is managed by the server and broadcast to both clients via Server-Sent Events (SSE)
- Only the player whose turn it is can make a move; server validates and rejects invalid moves
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
- `features/bot.feature` – singleplayer bot behaviour (automatic moves, blocking, winning)
- `features/visual_theme.feature` – dark theme and hover feedback
- `features/multiplayer.feature` – multiplayer game flow (mode selection, invite links, role assignment)
- `features/managed_by_server.feature` – server-authoritative move processing and SSE broadcast

Run them with:

```bash
npm test
```

Step definitions are in `features/step_definitions/stepdefs.ts` and exercise the
game logic (`src/lib/game.ts`), bot logic (`src/lib/bot.ts`), and multiplayer session
logic (`src/lib/server-game.ts`) directly, as well as inspecting the Svelte source for
visual-theme compliance.

## Multiplayer Flow

1. On the home screen, click **Multiplayer**
2. A new game is created on the server and you navigate to `/game/<id>` as player X
3. Share the page URL as the invite link
4. The second player visits the invite link, joins as player O
5. The board appears for both players once both have joined
6. Moves are sent to the server; the server validates and publishes the updated state via SSE
7. Both clients update their boards from server-sent events only

## Project Structure

```
src/
  lib/
    game.ts                     # Pure game logic (singleplayer)
    bot.ts                      # Bot AI – move selection (win, block, centre, corner)
    server-game.ts              # Multiplayer session logic (pure functions)
    game-store.server.ts        # In-memory session store with SSE listeners
  routes/
    +page.svelte                # Home page (mode selection + singleplayer)
    game/
      [id]/
        +page.svelte            # Multiplayer game page
    api/
      games/
        +server.ts              # POST /api/games – create game
        [id]/
          +server.ts            # GET  /api/games/:id – game state
          events/
            +server.ts          # GET  /api/games/:id/events – SSE stream
          join/
            +server.ts          # POST /api/games/:id/join – join game
          move/
            +server.ts          # POST /api/games/:id/move – make move
  app.html                      # SvelteKit HTML shell
features/
  game.feature
  multiplayer.feature
  managed_by_server.feature
  visual_theme.feature
  step_definitions/
    stepdefs.ts                 # Cucumber step implementations
```
