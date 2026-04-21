import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Given, When, Then } from "@cucumber/cucumber";
import {
  createGame,
  makeMove,
  WIN_COMBINATIONS,
  type GameState,
  type Board,
} from "../../src/lib/game.js";

// ---------------------------------------------------------------------------
// Helpers for visual theme checks
// ---------------------------------------------------------------------------

function readSveltePage(): string {
  return readFileSync(join(process.cwd(), "src/routes/+page.svelte"), "utf-8");
}

function extractStyleBlock(svelte: string): string {
  const match = svelte.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  return match?.[1] ?? "";
}

function parseHexColor(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0]!, 16),
      parseInt(h[1]! + h[1]!, 16),
      parseInt(h[2]! + h[2]!, 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const linear = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// World state interface (typed via module augmentation)
// ---------------------------------------------------------------------------

interface World {
  game: GameState;
  selectedIndex: number;
  occupiedIndex: number;
  boardBefore: Board;
  winningSquare: number;
  sveltePage: string;
  bgColor: [number, number, number];
  textColor: [number, number, number];
}

// ---------------------------------------------------------------------------
// Tie-board move sequence that produces no winner
// Board result: [X, O, X, O, O, X, X, X, O] → TIE
// ---------------------------------------------------------------------------
const TIE_MOVES = [0, 1, 2, 3, 5, 4, 6, 8, 7];

function buildTieGame(): GameState {
  let state = createGame();
  for (const idx of TIE_MOVES) {
    state = makeMove(state, idx);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Helper: set up a game where X wins (row 0)
// Sequence: X:0, O:3, X:1, O:4, X:2 → X wins [0,1,2]
// ---------------------------------------------------------------------------
function buildXWinsGame(): GameState {
  let state = createGame();
  for (const idx of [0, 3, 1, 4, 2]) {
    state = makeMove(state, idx);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Helper: set up a game where O wins (row 1)
// Sequence: X:0, O:3, X:1, O:4, X:6, O:5 → O wins [3,4,5]
// ---------------------------------------------------------------------------
function buildOWinsGame(): GameState {
  let state = createGame();
  for (const idx of [0, 3, 1, 4, 6, 5]) {
    state = makeMove(state, idx);
  }
  return state;
}

// ---------------------------------------------------------------------------
// game.feature step definitions
// ---------------------------------------------------------------------------

Given("the application is open", function (this: World) {
  // Application context is ready; game not yet started
  this.game = null as unknown as GameState;
});

When("the user starts a new game", function (this: World) {
  this.game = createGame();
});

Then("a 3x3 game board is shown", function (this: World) {
  assert.equal(this.game.board.length, 9);
});

// ----

Given("a new game has started", function (this: World) {
  this.game = createGame();
});

When("the user selects an empty square", function (this: World) {
  const index = this.game.board.findIndex((cell) => cell === null);
  this.selectedIndex = index;
  this.game = makeMove(this.game, index);
});

Then("a cross is shown in that square", function (this: World) {
  assert.equal(this.game.board[this.selectedIndex], "X");
});

// ----

Given("a game has started", function (this: World) {
  this.game = createGame();
});

Given("one square already contains a cross", function (this: World) {
  this.game = makeMove(this.game, 0); // X at index 0
});

When("the user selects a different empty square", function (this: World) {
  const index = this.game.board.findIndex((cell) => cell === null);
  this.selectedIndex = index;
  this.game = makeMove(this.game, index);
});

Then("a circle is shown in that square", function (this: World) {
  assert.equal(this.game.board[this.selectedIndex], "O");
});

// ----

Given("a square already contains a cross or a circle", function (this: World) {
  this.game = makeMove(this.game, 0); // place X at index 0
  this.occupiedIndex = 0;
  this.boardBefore = [...this.game.board] as Board;
});

When("the user selects that square", function (this: World) {
  this.game = makeMove(this.game, this.occupiedIndex);
});

Then("the board does not change", function (this: World) {
  assert.deepEqual(this.game.board, this.boardBefore);
});

// ----

Given("two squares in a row contain crosses", function (this: World) {
  // X at 0, O at 3, X at 1, O at 4 → board[0]=X, board[1]=X, board[2]=empty (row 0)
  for (const idx of [0, 3, 1, 4]) {
    this.game = makeMove(this.game, idx);
  }
  this.winningSquare = 2; // completes row 0
});

When(
  "the user selects the remaining empty square in that row",
  function (this: World) {
    this.game = makeMove(this.game, this.winningSquare);
  },
);

Then("crosses win the game", function (this: World) {
  assert.equal(this.game.result, "X_WINS");
});

// ----

Given("all squares are filled", function (this: World) {
  this.game = buildTieGame();
});

Given("no player has three in a row", function (this: World) {
  const { board } = this.game;
  for (const [a, b, c] of WIN_COMBINATIONS) {
    const cellA = board[a];
    if (cellA && cellA === board[b] && cellA === board[c]) {
      throw new Error("A player has three in a row!");
    }
  }
  assert(
    board.every((cell) => cell !== null),
    "Not all squares are filled",
  );
});

Then("the game ends in a tie", function (this: World) {
  assert.equal(this.game.result, "TIE");
});

// ----

Given("the game has ended in a tie", function (this: World) {
  this.game = buildTieGame();
});

Given("crosses have won the game", function (this: World) {
  this.game = buildXWinsGame();
});

Given("circles have won the game", function (this: World) {
  this.game = buildOWinsGame();
});

Then("a game over message is shown", function (this: World) {
  assert.notEqual(this.game.result, null);
});

Then("the message says the game is a tie", function (this: World) {
  assert.equal(this.game.result, "TIE");
});

Then("the message says crosses won", function (this: World) {
  assert.equal(this.game.result, "X_WINS");
});

Then("the message says circles won", function (this: World) {
  assert.equal(this.game.result, "O_WINS");
});

// ---------------------------------------------------------------------------
// visual_theme.feature step definitions
// ---------------------------------------------------------------------------

When("the user opens the application", function (this: World) {
  this.sveltePage = readSveltePage();

  const style = extractStyleBlock(this.sveltePage);

  // Extract background-color
  const bgMatch = style.match(/background-color:\s*(#[0-9a-fA-F]{3,6})/);
  assert(bgMatch, "No background-color found in stylesheet");
  this.bgColor = parseHexColor(bgMatch[1]!);

  // Extract text color (first standalone `color:` not preceded by "background-")
  const colorMatch = style.match(
    /(?<!background-)(?:^|\s)color:\s*(#[0-9a-fA-F]{3,6})/m,
  );
  assert(colorMatch, "No text color found in stylesheet");
  this.textColor = parseHexColor(colorMatch[1]!);
});

Then("the background is dark", function (this: World) {
  const lum = relativeLuminance(...this.bgColor);
  assert(
    lum < 0.3,
    `Background luminance ${lum.toFixed(3)} is not dark enough (must be < 0.3)`,
  );
});

Then(
  "the foreground text has sufficient contrast to be readable",
  function (this: World) {
    const bgLum = relativeLuminance(...this.bgColor);
    const fgLum = relativeLuminance(...this.textColor);
    const ratio = contrastRatio(bgLum, fgLum);
    assert(
      ratio >= 4.5,
      `Contrast ratio ${ratio.toFixed(2)}:1 is insufficient (WCAG AA requires at least 4.5:1)`,
    );
  },
);

When("the user hovers over a button", function (this: World) {
  this.sveltePage = readSveltePage();
});

Then("the button changes appearance", function (this: World) {
  const style = extractStyleBlock(this.sveltePage);
  // Check for any button-related hover rule with at least one CSS property
  const hasButtonHover =
    /(?:button|\.new-game-btn)[^{]*:hover[^{]*\{[^}]+\}/.test(style) ||
    /:hover[^{]*(?:button|\.new-game-btn)[^{]*\{[^}]+\}/.test(style);
  assert(hasButtonHover, "No hover style found for buttons");
});

When("the user hovers over an empty grid cell", function (this: World) {
  this.sveltePage = readSveltePage();
});

Then("the cell changes appearance", function (this: World) {
  const style = extractStyleBlock(this.sveltePage);
  const hasCellHover = /\.cell[^{]*:hover[^{]*\{[^}]+\}/.test(style);
  assert(hasCellHover, "No hover style found for grid cells");
});
