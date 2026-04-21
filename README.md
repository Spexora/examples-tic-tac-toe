# Tic-Tac-Toe

A single-player tic-tac-toe game built with SvelteKit, tested with Cucumber.

## Project Structure

```
src/
  lib/
    game.ts          # Pure game logic (board state, moves, win detection)
  routes/
    +page.svelte     # SvelteKit page with game UI and dark-theme CSS
  app.html           # SvelteKit app shell
features/
  game.feature       # Cucumber specs for game rules
  visual_theme.feature  # Cucumber specs for visual/UX requirements
  step_definitions/
    stepdefs.ts      # Cucumber step implementations
```

## Scripts

| Script   | Description                    |
| -------- | ------------------------------ |
| test     | Run Cucumber tests             |
| prettier | Format all files with Prettier |

## Running Tests

```sh
npm test
```

Tests are written in Cucumber/Gherkin and cover:

- **Game logic**: board setup, move placement (X/O alternation), occupied-square prevention, win detection (rows/columns/diagonals), and tie detection.
- **Visual theme**: dark background, sufficient text contrast (WCAG AA ≥ 4.5:1), hover feedback for buttons and board cells.

## Game Logic

The game logic in `src/lib/game.ts` is a pure TypeScript module with no side effects:

- `createGame()` — returns a fresh 3×3 game state (X goes first)
- `makeMove(state, index)` — returns a new state after placing the current player's mark; ignores invalid moves (occupied cell, game already over)
- `checkResult(board)` — returns `'X_WINS'`, `'O_WINS'`, `'TIE'`, or `null`

## Visual Theme

The UI (`src/routes/+page.svelte`) uses a dark colour scheme:

- **Background**: `#0f0f23` (dark navy, luminance ≈ 0.006)
- **Text**: `#cccccc` (light grey, contrast ratio ≈ 11.7:1 – well above WCAG AA)
- Buttons and board cells have CSS `:hover` transitions for clear interaction feedback.
