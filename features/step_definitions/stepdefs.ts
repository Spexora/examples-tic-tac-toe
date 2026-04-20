import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Given, When, Then } from "@cucumber/cucumber";
import { TicTacToe, type Cell } from "../../src/game.ts";

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------
let game: TicTacToe;
let lastMoveRow: number;
let lastMoveCol: number;
let occupiedRow: number;
let occupiedCol: number;
let boardSnapshot: Cell[][];
let winningRow: number;
let cssContent: string;

function snapshotBoard(b: Cell[][]): Cell[][] {
  return b.map((row) => [...row]);
}

// ---------------------------------------------------------------------------
// CSS helpers for visual-theme tests
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] | null {
  const short = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (short) {
    hex =
      "#" +
      short[1]! +
      short[1]! +
      short[2]! +
      short[2]! +
      short[3]! +
      short[3]!;
  }
  const full = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!full) return null;
  return [
    parseInt(full[1]!, 16),
    parseInt(full[2]!, 16),
    parseInt(full[3]!, 16),
  ];
}

function linearize(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Extract the first hex colour value from a CSS property declaration.
 *  Uses a negative lookbehind so that e.g. `color:` does not match inside
 *  `background-color:`. */
function extractHexColor(css: string, property: string): string | null {
  const re = new RegExp(
    `(?<![a-zA-Z-])${property}\\s*:\\s*(#[0-9a-fA-F]{3,6})`,
    "i",
  );
  const m = re.exec(css);
  return m ? (m[1] ?? null) : null;
}

/** Return the CSS text inside the first matching rule block. */
function extractRuleBlock(css: string, selector: string): string | null {
  // Escape special chars in selector for regex
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped + "\\s*\\{([^}]*)\\}", "i");
  const m = re.exec(css);
  return m ? (m[1] ?? null) : null;
}

// ---------------------------------------------------------------------------
// Game feature steps
// ---------------------------------------------------------------------------

Given("the application is open", function () {
  // Nothing to set up; app state initialised in "starts a new game"
});

When("the user starts a new game", function () {
  game = new TicTacToe();
});

Then("a 3x3 game board is shown", function () {
  assert.strictEqual(game.board.length, 3);
  for (const row of game.board) {
    assert.strictEqual(row.length, 3);
  }
});

// ---

Given("a new game has started", function () {
  game = new TicTacToe();
});

When("the user selects an empty square", function () {
  lastMoveRow = 0;
  lastMoveCol = 0;
  game.selectSquare(lastMoveRow, lastMoveCol);
});

Then("a cross is shown in that square", function () {
  assert.strictEqual(game.board[lastMoveRow]![lastMoveCol], "X");
});

// ---

Given("a game has started", function () {
  game = new TicTacToe();
});

Given("one square already contains a cross", function () {
  // X plays at [0,0]; now it's O's turn
  lastMoveRow = 0;
  lastMoveCol = 0;
  game.selectSquare(lastMoveRow, lastMoveCol);
});

When("the user selects a different empty square", function () {
  // Now O's turn – pick a different empty square
  lastMoveRow = 1;
  lastMoveCol = 1;
  game.selectSquare(lastMoveRow, lastMoveCol);
});

Then("a circle is shown in that square", function () {
  assert.strictEqual(game.board[lastMoveRow]![lastMoveCol], "O");
});

// ---

Given("a square already contains a cross or a circle", function () {
  // Make one move so [0,0] holds X
  occupiedRow = 0;
  occupiedCol = 0;
  game.selectSquare(occupiedRow, occupiedCol);
});

When("the user selects that square", function () {
  boardSnapshot = snapshotBoard(game.board);
  game.selectSquare(occupiedRow, occupiedCol); // should be rejected
});

Then("the board does not change", function () {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      assert.strictEqual(game.board[r]![c], boardSnapshot[r]![c]);
    }
  }
});

// ---

Given("two squares in a row contain crosses", function () {
  // Directly set board: X X _ / _ _ _ / _ _ _
  // Leave currentPlayer as X so the next call places X at [0,2]
  game.board[0]![0] = "X";
  game.board[0]![1] = "X";
  game.currentPlayer = "X";
  winningRow = 0;
});

When("the user selects the remaining empty square in that row", function () {
  for (let col = 0; col < 3; col++) {
    if (game.board[winningRow]![col] === null) {
      lastMoveRow = winningRow;
      lastMoveCol = col;
      game.selectSquare(lastMoveRow, lastMoveCol);
      break;
    }
  }
});

Then("crosses win the game", function () {
  assert.strictEqual(game.getWinner(), "X");
});

// ---

Given("all squares are filled", function () {
  // Set a known tie board:
  // X O X
  // X X O
  // O X O
  game.board = [
    ["X", "O", "X"],
    ["X", "X", "O"],
    ["O", "X", "O"],
  ];
});

Given("no player has three in a row", function () {
  assert.strictEqual(game.getWinner(), null);
});

Then("the game ends in a tie", function () {
  assert.ok(game.isTie());
});

// ---

Given("the game has ended in a tie", function () {
  game = new TicTacToe();
  game.board = [
    ["X", "O", "X"],
    ["X", "X", "O"],
    ["O", "X", "O"],
  ];
});

Then("a game over message is shown", function () {
  assert.ok(game.isGameOver());
});

Then("the message says the game is a tie", function () {
  assert.ok(game.isTie());
});

// ---

Given("crosses have won the game", function () {
  game = new TicTacToe();
  // X wins row 0: X X X / O O _ / _ _ _
  game.board = [
    ["X", "X", "X"],
    ["O", "O", null],
    [null, null, null],
  ];
});

Then("the message says crosses won", function () {
  assert.strictEqual(game.getWinner(), "X");
});

// ---

Given("circles have won the game", function () {
  game = new TicTacToe();
  // O wins col 1: X _ X / _ O _ / X O O  – wait, let's do row 1: _ X _ / O O O / X _ X
  game.board = [
    [null, "X", null],
    ["O", "O", "O"],
    ["X", null, "X"],
  ];
});

Then("the message says circles won", function () {
  assert.strictEqual(game.getWinner(), "O");
});

// ---------------------------------------------------------------------------
// Visual theme steps
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_FILE = path.resolve(__dirname, "../../src/style.css");

When("the user opens the application", function () {
  cssContent = fs.readFileSync(CSS_FILE, "utf-8");
});

Then("the background is dark", function () {
  const bodyBlock = extractRuleBlock(cssContent, "body");
  assert.ok(bodyBlock, "No body rule found in CSS");
  const hex = extractHexColor(bodyBlock!, "background-color");
  assert.ok(hex, "No background-color found in body rule");
  const rgb = hexToRgb(hex!);
  assert.ok(rgb, `Could not parse colour ${hex}`);
  const lum = relativeLuminance(...rgb!);
  assert.ok(lum < 0.5, `Background luminance ${lum} is not dark (>= 0.5)`);
});

Then("the foreground text has sufficient contrast to be readable", function () {
  const bodyBlock = extractRuleBlock(cssContent, "body");
  assert.ok(bodyBlock, "No body rule found in CSS");
  const bgHex = extractHexColor(bodyBlock!, "background-color");
  const fgHex = extractHexColor(bodyBlock!, "color");
  assert.ok(bgHex, "No background-color in body");
  assert.ok(fgHex, "No color in body");
  const bgRgb = hexToRgb(bgHex!);
  const fgRgb = hexToRgb(fgHex!);
  assert.ok(bgRgb && fgRgb, "Could not parse body colours");
  const bgLum = relativeLuminance(...bgRgb!);
  const fgLum = relativeLuminance(...fgRgb!);
  const ratio = contrastRatio(bgLum, fgLum);
  assert.ok(
    ratio >= 4.5,
    `Contrast ratio ${ratio.toFixed(2)} is below WCAG AA threshold of 4.5`,
  );
});

When("the user hovers over a button", function () {
  cssContent = fs.readFileSync(CSS_FILE, "utf-8");
});

Then("the button changes appearance", function () {
  const hoverBlock = extractRuleBlock(cssContent, "button:hover");
  assert.ok(
    hoverBlock && hoverBlock.trim().length > 0,
    "No button:hover rule with styles found in CSS",
  );
});

When("the user hovers over an empty grid cell", function () {
  cssContent = fs.readFileSync(CSS_FILE, "utf-8");
});

Then("the cell changes appearance", function () {
  const hoverBlock = extractRuleBlock(cssContent, ".cell:hover");
  assert.ok(
    hoverBlock && hoverBlock.trim().length > 0,
    "No .cell:hover rule with styles found in CSS",
  );
});
