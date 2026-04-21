import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Given, When, Then } from "@cucumber/cucumber";
import {
  createGame,
  makeMove,
  type GameState,
  type Player,
} from "../../src/lib/game.js";
import {
  createMultiplayerSession,
  joinSession,
  clientSendMove,
  serverProcessMove,
  serverPublishState,
  type MultiplayerSession,
  type Role,
} from "../../src/lib/multiplayerGame.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Shared game state for scenarios
// ─────────────────────────────────────────────────────────────

let game: GameState;
let selectedIndex: number;

// ─────────────────────────────────────────────────────────────
// Multiplayer state for scenarios
// ─────────────────────────────────────────────────────────────

let mpSession: MultiplayerSession;
let crossSelectedIndex: number;
let circleSelectedIndex: number;
let crossMoveSent: boolean;
let lastServerAccepted: boolean;

// ─────────────────────────────────────────────────────────────
// Game feature steps
// ─────────────────────────────────────────────────────────────

Given("the application is open", function () {
  // Application is considered open; nothing to initialise yet
});

When("the user starts a new game", function () {
  game = createGame();
});

Then("a 3x3 game board is shown", function () {
  assert.equal(game.board.length, 9, "Board should have 9 cells (3x3)");
});

Given("a new game has started", function () {
  game = createGame();
});

When("the user selects an empty square", function () {
  selectedIndex = game.board.findIndex((cell) => cell === null);
  assert.ok(selectedIndex !== -1, "There should be an empty square");
  game = makeMove(game, selectedIndex);
});

Then("a cross is shown in that square", function () {
  assert.equal(
    game.board[selectedIndex],
    "X",
    "The selected square should show a cross",
  );
});

Given("a game has started", function () {
  game = createGame();
});

Given("one square already contains a cross", function () {
  selectedIndex = 0;
  game = makeMove(game, selectedIndex);
  // Sync multiplayer session server state if a multiplayer scenario is active
  if (mpSession) {
    mpSession = { ...mpSession, serverState: { ...game } };
    mpSession = serverPublishState(mpSession);
  }
});

When("the user selects a different empty square", function () {
  const newIndex = game.board.findIndex((cell) => cell === null);
  assert.ok(newIndex !== -1, "There should be an empty square");
  selectedIndex = newIndex;
  game = makeMove(game, selectedIndex);
});

Then("a circle is shown in that square", function () {
  assert.equal(
    game.board[selectedIndex],
    "O",
    "The selected square should show a circle",
  );
});

Given("a square already contains a cross or a circle", function () {
  // Make a move to occupy a square
  game = makeMove(game, 0);
  selectedIndex = 0;
});

When("the user selects that square", function () {
  const boardBefore = [...game.board];
  game = makeMove(game, selectedIndex);
  // Store the before state for assertion
  (this as any).boardBefore = boardBefore;
});

Then("the board does not change", function () {
  const boardBefore: (string | null)[] = (this as any).boardBefore;
  assert.deepEqual(
    game.board,
    boardBefore,
    "Board should not change when occupied square is selected",
  );
});

Given("two squares in a row contain crosses", function () {
  // Place crosses at positions 0 and 1 (row 0), with circles placed elsewhere
  // X at 0, O at 3, X at 1, O at 4 — next X to win at 2
  game = makeMove(game, 0); // X at 0
  game = makeMove(game, 3); // O at 3
  game = makeMove(game, 1); // X at 1
  game = makeMove(game, 4); // O at 4
  selectedIndex = 2; // winning square for X
});

When("the user selects the remaining empty square in that row", function () {
  game = makeMove(game, selectedIndex);
});

Then("crosses win the game", function () {
  assert.equal(game.status, "won", "Game status should be won");
  assert.equal(game.winner, "X", "Crosses (X) should have won");
});

Given("all squares are filled", function () {
  // Create a tie board: X O X / X O X / O X O
  // No winner
  const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
  for (const m of moves) {
    game = makeMove(game, m);
  }
});

Given("no player has three in a row", function () {
  // Verified by the board setup above; if the board has no winner it will be a tie
});

Then("the game ends in a tie", function () {
  assert.equal(game.status, "tied", "Game should end in a tie");
});

Given("the game has ended in a tie", function () {
  game = createGame();
  const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
  for (const m of moves) {
    game = makeMove(game, m);
  }
  assert.equal(game.status, "tied");
});

Then("a game over message is shown", function () {
  assert.ok(game.status !== "playing", "Game should be over to show a message");
});

Then("the message says the game is a tie", function () {
  assert.equal(game.status, "tied", "Game status should be tied");
});

Given("crosses have won the game", function () {
  game = createGame();
  // X wins top row
  game = makeMove(game, 0); // X
  game = makeMove(game, 3); // O
  game = makeMove(game, 1); // X
  game = makeMove(game, 4); // O
  game = makeMove(game, 2); // X wins
  assert.equal(game.winner, "X");
});

Then("the message says crosses won", function () {
  assert.equal(game.winner, "X", "Crosses (X) should have won");
});

Given("circles have won the game", function () {
  game = createGame();
  // O wins: X at 0,1 O at 3,4,5
  game = makeMove(game, 0); // X
  game = makeMove(game, 3); // O
  game = makeMove(game, 1); // X
  game = makeMove(game, 4); // O
  game = makeMove(game, 8); // X (elsewhere)
  game = makeMove(game, 5); // O wins col 1
  assert.equal(game.winner, "O");
});

Then("the message says circles won", function () {
  assert.equal(game.winner, "O", "Circles (O) should have won");
});

// ─────────────────────────────────────────────────────────────
// Visual theme steps
// ─────────────────────────────────────────────────────────────

function readPageSource(): string {
  const pagePath = join(__dirname, "../../src/routes/+page.svelte");
  return readFileSync(pagePath, "utf-8");
}

/** Parse a CSS hex colour into { r, g, b } 0-255 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

/** Relative luminance per WCAG 2.x */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

When("the user opens the application", function () {
  // Reading the source is sufficient as the app is static-rendered
});

Then("the background is dark", function () {
  const source = readPageSource();
  // Find background-color of :global(body) block
  const bodyMatch = source.match(/:global\(body\)[^{]*\{([^}]+)\}/s);
  assert.ok(bodyMatch, "Should have a :global(body) style rule");

  const bgMatch = bodyMatch[1].match(
    /background-color\s*:\s*(#[0-9a-fA-F]{3,6})/,
  );
  assert.ok(bgMatch, "Should have a background-color set on body");

  const color = hexToRgb(bgMatch[1]);
  assert.ok(color, "Background color should be a valid hex colour");

  const lum = relativeLuminance(color.r, color.g, color.b);
  assert.ok(
    lum < 0.2,
    `Background luminance ${lum.toFixed(3)} should be < 0.2 (dark)`,
  );
});

Then("the foreground text has sufficient contrast to be readable", function () {
  const source = readPageSource();

  const bodyMatch = source.match(/:global\(body\)[^{]*\{([^}]+)\}/s);
  assert.ok(bodyMatch, "Should have a :global(body) style rule");

  const bgMatch = bodyMatch[1].match(
    /background-color\s*:\s*(#[0-9a-fA-F]{3,6})/,
  );
  const fgMatch = bodyMatch[1].match(
    /(?<![-\w])color\s*:\s*(#[0-9a-fA-F]{3,6})/,
  );
  assert.ok(bgMatch, "Should have a background-color");
  assert.ok(fgMatch, "Should have a foreground color");

  const bg = hexToRgb(bgMatch[1])!;
  const fg = hexToRgb(fgMatch[1])!;

  const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
  const fgLum = relativeLuminance(fg.r, fg.g, fg.b);
  const ratio = contrastRatio(bgLum, fgLum);

  assert.ok(
    ratio >= 4.5,
    `Contrast ratio ${ratio.toFixed(2)} should be >= 4.5 (WCAG AA)`,
  );
});

When("the user hovers over a button", function () {
  // Hovering is a visual interaction; verified via CSS below
});

Then("the button changes appearance", function () {
  const source = readPageSource();
  // Check for a hover rule on .new-game-btn (or generic button hover)
  const hasHover =
    /\.new-game-btn:hover\s*\{[^}]+\}/.test(source) ||
    /button:hover\s*\{[^}]+\}/.test(source);
  assert.ok(hasHover, "Should have a CSS hover rule for buttons");
});

When("the user hovers over an empty grid cell", function () {
  // Hovering is a visual interaction; verified via CSS below
});

Then("the cell changes appearance", function () {
  const source = readPageSource();
  const hasHover =
    /\.cell:not\(:disabled\):hover\s*\{[^}]+\}/.test(source) ||
    /\.cell:hover\s*\{[^}]+\}/.test(source);
  assert.ok(hasHover, "Should have a CSS hover rule for grid cells");
});

// ─────────────────────────────────────────────────────────────
// Multiplayer feature steps
// ─────────────────────────────────────────────────────────────

Given("the user has not started a game", function () {
  // No game has been started yet; mode selection screen is shown
});

Then("singleplayer and multiplayer options are shown", function () {
  const source = readPageSource();
  const hasSingleplayer = /singleplayer|single.player/i.test(source);
  const hasMultiplayer = /multiplayer|multi.player/i.test(source);
  assert.ok(hasSingleplayer, "Page should contain a singleplayer option");
  assert.ok(hasMultiplayer, "Page should contain a multiplayer option");
});

When("the user selects the multiplayer option", function () {
  mpSession = createMultiplayerSession();
});

Then("an invite link is shown", function () {
  const source = readPageSource();
  assert.ok(
    /invite/i.test(source),
    "Page should contain an invite link section",
  );
  assert.ok(mpSession.inviteCode, "Session should have an invite code");
});

Given("the user has selected the multiplayer option", function () {
  mpSession = createMultiplayerSession();
});

When("an opponent joins the game", function () {
  mpSession = joinSession(mpSession);
  game = { ...mpSession.serverState };
});

Given("a new game has been created", function () {
  mpSession = createMultiplayerSession();
  game = { ...mpSession.serverState };
});

When("a user joins through the invite link", function () {
  mpSession = joinSession(mpSession);
  game = { ...mpSession.serverState };
});

Then("one user is assigned a cross and the other a circle", function () {
  assert.notEqual(
    mpSession.hostRole,
    mpSession.guestRole,
    "Host and guest should have different roles",
  );
  assert.ok(
    (mpSession.hostRole === "X" && mpSession.guestRole === "O") ||
      (mpSession.hostRole === "O" && mpSession.guestRole === "X"),
    "One player should be assigned X and the other O",
  );
});

Given("a user has joined through the invite link", function () {
  mpSession = joinSession(mpSession);
  game = { ...mpSession.serverState };
});

Given("no moves have been made", function () {
  assert.ok(
    mpSession.serverState.board.every((cell) => cell === null),
    "No moves should have been made yet",
  );
});

When("the cross user selects an empty square", function () {
  crossSelectedIndex = mpSession.serverState.board.findIndex(
    (cell) => cell === null,
  );
  assert.ok(crossSelectedIndex !== -1, "There should be an empty square");
  const result = clientSendMove(mpSession, "X", crossSelectedIndex);
  mpSession = result.session;
  crossMoveSent = result.sent;
});

Then("that square shows a cross for both users", function () {
  // Server processes the pending move
  const { session: processed, accepted } = serverProcessMove(mpSession);
  assert.ok(accepted, "Server should accept the cross move");
  mpSession = processed;
  // Server publishes updated state to both clients (SSE)
  mpSession = serverPublishState(mpSession);
  assert.equal(
    mpSession.hostLocalState!.board[crossSelectedIndex],
    "X",
    "Host should see a cross at the selected square",
  );
  assert.equal(
    mpSession.guestLocalState!.board[crossSelectedIndex],
    "X",
    "Guest should see a cross at the selected square",
  );
});

When("the circle user selects an empty square", function () {
  circleSelectedIndex = mpSession.serverState.board.findIndex(
    (cell) => cell === null,
  );
  assert.ok(circleSelectedIndex !== -1, "There should be an empty square");
  // Save board state for "the board does not change" assertion
  (this as any).boardBefore = [...mpSession.serverState.board];
  const result = clientSendMove(mpSession, "O", circleSelectedIndex);
  mpSession = result.session;
  // Note: server processing happens in the Then steps
});

Then("that square shows a circle for both users", function () {
  // Server processes the pending move
  const { session: processed, accepted } = serverProcessMove(mpSession);
  assert.ok(accepted, "Server should accept the circle move");
  mpSession = processed;
  // Server publishes updated state to both clients (SSE)
  mpSession = serverPublishState(mpSession);
  assert.equal(
    mpSession.hostLocalState!.board[circleSelectedIndex],
    "O",
    "Host should see a circle at the selected square",
  );
  assert.equal(
    mpSession.guestLocalState!.board[circleSelectedIndex],
    "O",
    "Guest should see a circle at the selected square",
  );
});

// ─────────────────────────────────────────────────────────────
// Managed-by-server feature steps
// ─────────────────────────────────────────────────────────────

Given("a multiplayer game is in progress", function () {
  mpSession = createMultiplayerSession();
  mpSession = joinSession(mpSession);
  game = { ...mpSession.serverState };
});

Given("it is the cross user's turn", function () {
  assert.equal(
    mpSession.serverState.currentPlayer,
    "X",
    "It should be the cross user's turn",
  );
});

Then("the client sends the move to the server", function () {
  assert.ok(crossMoveSent, "The move should have been sent to the server");
  assert.ok(
    mpSession.pendingMove !== null,
    "There should be a pending move awaiting server processing",
  );
});

Then("the move is not applied only in the local client state", function () {
  assert.equal(
    mpSession.hostLocalState!.board[crossSelectedIndex],
    null,
    "The host local state should not have the move applied yet",
  );
  assert.equal(
    mpSession.guestLocalState!.board[crossSelectedIndex],
    null,
    "The guest local state should not have the move applied yet",
  );
});

Given("the server receives a valid move", function () {
  crossSelectedIndex = mpSession.serverState.board.findIndex(
    (cell) => cell === null,
  );
  assert.ok(crossSelectedIndex !== -1, "There should be an empty square");
  const result = clientSendMove(mpSession, "X", crossSelectedIndex);
  mpSession = result.session;
  crossMoveSent = result.sent;
});

When("the server processes the move", function () {
  (this as any).prevServerBoard = [...mpSession.serverState.board];
  const { session: processed, accepted } = serverProcessMove(mpSession);
  mpSession = processed;
  lastServerAccepted = accepted;
});

Then("the server updates the game state", function () {
  assert.ok(lastServerAccepted, "Server should have accepted the move");
  const prevBoard: (string | null)[] = (this as any).prevServerBoard;
  assert.notDeepEqual(
    [...mpSession.serverState.board],
    prevBoard,
    "Server board should have changed after processing the move",
  );
});

Then(
  "the server publishes the updated game state to both clients",
  function () {
    const prevHostBoard = mpSession.hostLocalState
      ? [...mpSession.hostLocalState.board]
      : null;
    mpSession = serverPublishState(mpSession);
    assert.deepEqual(
      [...mpSession.hostLocalState!.board],
      [...mpSession.serverState.board],
      "Host local state should match the server state",
    );
    assert.deepEqual(
      [...mpSession.guestLocalState!.board],
      [...mpSession.serverState.board],
      "Guest local state should match the server state",
    );
  },
);

Given("the server has published a game state update", function () {
  // Make a valid move, process it, and publish it to both clients
  const index = mpSession.serverState.board.findIndex((cell) => cell === null);
  assert.ok(index !== -1, "There should be an empty square to move to");
  const result = clientSendMove(mpSession, "X", index);
  mpSession = result.session;
  const { session: processed, accepted } = serverProcessMove(mpSession);
  assert.ok(accepted, "The move should be accepted");
  mpSession = processed;
  mpSession = serverPublishState(mpSession);
});

When("both clients receive the server-sent event", function () {
  // The server-sent event has already been applied via serverPublishState.
  // Both clients now hold the published state.
});

Then("both clients show the same board state", function () {
  assert.deepEqual(
    mpSession.hostLocalState!.board,
    mpSession.guestLocalState!.board,
    "Both clients should show the same board state",
  );
});

Given("a square is already occupied", function () {
  // X makes the first move at position 0; server processes and publishes
  selectedIndex = 0;
  const result = clientSendMove(mpSession, "X", selectedIndex);
  mpSession = result.session;
  const { session: processed, accepted } = serverProcessMove(mpSession);
  assert.ok(accepted, "X move should be accepted");
  mpSession = processed;
  mpSession = serverPublishState(mpSession);
  game = { ...mpSession.serverState };
});

When("a user selects that square", function () {
  // A user (O, whose turn it is) attempts to select the already-occupied square
  const boardBefore = [...mpSession.serverState.board];
  (this as any).boardBefore = boardBefore;
  const result = clientSendMove(mpSession, "O", selectedIndex);
  mpSession = result.session;
});

Then("the client sends the move attempt to the server", function () {
  assert.ok(
    mpSession.pendingMove !== null,
    "There should be a pending move attempt sent to the server",
  );
});

Then("the server rejects the move", function () {
  const { session: processed, accepted } = serverProcessMove(mpSession);
  mpSession = processed;
  assert.ok(!accepted, "Server should reject the move on an occupied square");
});

Then("the board does not change for either user", function () {
  mpSession = serverPublishState(mpSession);
  const boardBefore: (string | null)[] = (this as any).boardBefore;
  assert.deepEqual(
    mpSession.hostLocalState!.board,
    boardBefore,
    "Host board should not have changed",
  );
  assert.deepEqual(
    mpSession.guestLocalState!.board,
    boardBefore,
    "Guest board should not have changed",
  );
});
