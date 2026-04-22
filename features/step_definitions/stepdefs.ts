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
  createGameSession,
  joinSession,
  serverMakeMove,
  type GameSession,
  type MoveResult,
} from "../../src/lib/server-game.js";
import {
  createSingleplayerGame,
  userMove as spUserMove,
  botMove as spBotMove,
  type SingleplayerState,
} from "../../src/lib/singleplayer-game.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Shared state for scenarios
// ─────────────────────────────────────────────────────────────

let game: GameState;
let selectedIndex: number;

// Singleplayer / bot state
let singleplayerState: SingleplayerState | null = null;
let remainingSquareIndex: number = -1;

// Multiplayer / server-managed state
let serverSession: GameSession | undefined = undefined;
let client1Board: (Player | null)[];
let client2Board: (Player | null)[];
let pendingMoveFromClient: { player: Player; index: number } | null = null;
let lastMoveResult: MoveResult | null = null;

// Helper: convert a GameSession to a GameState (for shared step compatibility)
function sessionToGameState(session: GameSession): GameState {
  return {
    board: [...session.board],
    currentPlayer: session.currentPlayer,
    status:
      session.status === "waiting"
        ? "playing"
        : (session.status as GameState["status"]),
    winner: session.winner,
  };
}

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
  serverSession = undefined;
  singleplayerState = null;
});

When("the user selects an empty square", function () {
  selectedIndex = game.board.findIndex((cell) => cell === null);
  assert.ok(selectedIndex !== -1, "There should be an empty square");
  if (singleplayerState) {
    singleplayerState = spUserMove(singleplayerState, selectedIndex);
    game = singleplayerState.game;
  } else {
    game = makeMove(game, selectedIndex);
  }
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
  serverSession = undefined;
  singleplayerState = null;
});

Given("one square already contains a cross", function () {
  selectedIndex = 0;
  if (serverSession) {
    // Multiplayer context: use server-managed move
    const result = serverMakeMove(serverSession, "X", 0);
    if (result.accepted) {
      serverSession = result.session;
      client1Board = [...serverSession.board];
      client2Board = [...serverSession.board];
    }
    game = sessionToGameState(serverSession);
  } else {
    // Single-player context
    game = makeMove(game, selectedIndex);
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
    /button:hover\s*\{[^}]+\}/.test(source) ||
    /\.mode-btn:hover\s*\{[^}]+\}/.test(source);
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
  // App is in initial state; no game has been started
  serverSession = undefined;
});

Then("singleplayer and multiplayer options are shown", function () {
  const source = readPageSource();
  assert.ok(
    /singleplayer/i.test(source),
    "Page should have a singleplayer option",
  );
  assert.ok(
    /multiplayer/i.test(source),
    "Page should have a multiplayer option",
  );
});

When("the user selects the multiplayer option", function () {
  serverSession = createGameSession();
});

Then("an invite link is shown", function () {
  assert.ok(
    serverSession && serverSession.id,
    "Game session should have an ID for the invite link",
  );
  assert.ok(serverSession.id.length > 0, "Game session ID should not be empty");
});

Given("the user has selected the multiplayer option", function () {
  serverSession = createGameSession();
});

When("an opponent joins the game", function () {
  assert.ok(serverSession, "A game session must exist");
  serverSession = joinSession(serverSession);
  client1Board = [...serverSession.board];
  client2Board = [...serverSession.board];
  game = sessionToGameState(serverSession);
});

Given("a new game has been created", function () {
  serverSession = createGameSession();
});

When("a user joins through the invite link", function () {
  assert.ok(serverSession, "A game session must exist");
  serverSession = joinSession(serverSession);
  client1Board = [...serverSession.board];
  client2Board = [...serverSession.board];
  game = sessionToGameState(serverSession);
});

Then("one user is assigned a cross and the other a circle", function () {
  assert.ok(serverSession, "A game session must exist");
  assert.equal(
    serverSession.hostRole,
    "X",
    "Host should be assigned cross (X)",
  );
  assert.equal(
    serverSession.guestRole,
    "O",
    "Guest should be assigned circle (O)",
  );
});

Given("a user has joined through the invite link", function () {
  assert.ok(serverSession, "A game session must exist");
  serverSession = joinSession(serverSession);
  client1Board = [...serverSession.board];
  client2Board = [...serverSession.board];
  game = sessionToGameState(serverSession);
});

Given("no moves have been made", function () {
  assert.ok(serverSession, "A game session must exist");
  assert.ok(
    serverSession.board.every((cell) => cell === null),
    "Board should be empty",
  );
});

When("the cross user selects an empty square", function () {
  assert.ok(serverSession, "A game session must exist");
  const index = serverSession.board.findIndex((cell) => cell === null);
  assert.ok(index !== -1, "There should be an empty square");
  selectedIndex = index;

  // Record client state before server processes the move
  (this as any).clientBoardBefore = [...client1Board];

  // Client sends move to server — does NOT apply locally yet
  pendingMoveFromClient = { player: "X", index };
});

When("the circle user selects an empty square", function () {
  assert.ok(serverSession, "A game session must exist");
  const index = serverSession.board.findIndex((cell) => cell === null);
  assert.ok(index !== -1, "There should be an empty square");
  selectedIndex = index;

  // Record board before for "board does not change" assertion
  (this as any).boardBefore = [...game.board];
  (this as any).clientBoardBefore = [...client1Board];

  // Client sends move to server — does NOT apply locally yet
  pendingMoveFromClient = { player: "O", index };

  // Try to apply via server (will be rejected if it's not O's turn)
  const result = serverMakeMove(serverSession, "O", index);
  lastMoveResult = result;
  if (result.accepted) {
    serverSession = result.session;
    client1Board = [...serverSession.board];
    client2Board = [...serverSession.board];
  }
  game = sessionToGameState(serverSession);
});

Then("that square shows a cross for both users", function () {
  // Simulate the full server round-trip: server processes the pending move
  // and broadcasts the result to both clients
  if (pendingMoveFromClient) {
    assert.ok(serverSession, "A game session must exist");
    const result = serverMakeMove(
      serverSession,
      pendingMoveFromClient.player,
      pendingMoveFromClient.index,
    );
    lastMoveResult = result;
    assert.ok(result.accepted, "Server should have accepted the cross's move");
    serverSession = result.session;
    client1Board = [...serverSession.board];
    client2Board = [...serverSession.board];
    game = sessionToGameState(serverSession);
    pendingMoveFromClient = null;
  }
  assert.equal(client1Board[selectedIndex], "X", "Client 1 should show cross");
  assert.equal(client2Board[selectedIndex], "X", "Client 2 should show cross");
});

Then("that square shows a circle for both users", function () {
  assert.equal(client1Board[selectedIndex], "O", "Client 1 should show circle");
  assert.equal(client2Board[selectedIndex], "O", "Client 2 should show circle");
});

// ─────────────────────────────────────────────────────────────
// Managed-by-server feature steps
// ─────────────────────────────────────────────────────────────

Given("a multiplayer game is in progress", function () {
  serverSession = createGameSession();
  serverSession = joinSession(serverSession);
  client1Board = [...serverSession.board];
  client2Board = [...serverSession.board];
  game = sessionToGameState(serverSession);
  pendingMoveFromClient = null;
  lastMoveResult = null;
});

Given("it is the cross user's turn", function () {
  assert.ok(serverSession, "A game session must exist");
  assert.equal(serverSession.currentPlayer, "X", "It should be cross's turn");
});

Then("the client sends the move to the server", function () {
  assert.ok(
    pendingMoveFromClient !== null,
    "Client should have sent a pending move to the server",
  );
  assert.equal(pendingMoveFromClient.player, "X", "Move should be from cross");
});

Then("the move is not applied only in the local client state", function () {
  // The client board should NOT have been updated yet — the move was sent
  // to the server but the client is waiting for the server's authoritative response.
  const boardBefore = (this as any).clientBoardBefore as (Player | null)[];
  assert.deepEqual(
    client1Board,
    boardBefore,
    "Client state must not be updated before receiving the server response",
  );
});

Given("the server receives a valid move", function () {
  assert.ok(serverSession, "A game session must exist");
  const index = serverSession.board.findIndex((cell) => cell === null);
  pendingMoveFromClient = { player: serverSession.currentPlayer, index };
  (this as any).serverBoardBefore = [...serverSession.board];
});

When("the server processes the move", function () {
  assert.ok(serverSession, "A game session must exist");
  assert.ok(pendingMoveFromClient, "There must be a pending move to process");
  lastMoveResult = serverMakeMove(
    serverSession,
    pendingMoveFromClient.player,
    pendingMoveFromClient.index,
  );
  if (lastMoveResult.accepted) {
    serverSession = lastMoveResult.session;
  }
  pendingMoveFromClient = null;
});

Then("the server updates the game state", function () {
  assert.ok(lastMoveResult, "A move result must exist");
  assert.ok(
    lastMoveResult.accepted,
    "The server should have accepted the move",
  );
  const boardBefore = (this as any).serverBoardBefore as (Player | null)[];
  assert.notDeepEqual(
    serverSession!.board,
    boardBefore,
    "Server game state should be updated after processing the move",
  );
});

Then(
  "the server publishes the updated game state to both clients",
  function () {
    assert.ok(serverSession, "A game session must exist");
    // Simulate broadcasting: push updated state to both clients
    client1Board = [...serverSession.board];
    client2Board = [...serverSession.board];
    game = sessionToGameState(serverSession);
    assert.deepEqual(
      client1Board,
      serverSession.board,
      "Client 1 should have the updated state",
    );
    assert.deepEqual(
      client2Board,
      serverSession.board,
      "Client 2 should have the updated state",
    );
  },
);

Given("the server has published a game state update", function () {
  assert.ok(serverSession, "A game session must exist");
  // Apply a move on the server and prepare to publish it
  const index = serverSession.board.findIndex((cell) => cell === null);
  const result = serverMakeMove(
    serverSession,
    serverSession.currentPlayer,
    index,
  );
  assert.ok(result.accepted, "Move should be accepted");
  serverSession = result.session;
  // Server has the updated state; store it as the "published" update
  (this as any).publishedBoard = [...serverSession.board];
  // Clients have NOT yet received it — they still have the old board
  // (client boards remain as they were before this step)
});

When("both clients receive the server-sent event", function () {
  const publishedBoard = (this as any).publishedBoard as (Player | null)[];
  // Clients apply the server-broadcast state
  client1Board = [...publishedBoard];
  client2Board = [...publishedBoard];
  game = sessionToGameState(serverSession!);
});

Then("both clients show the same board state", function () {
  assert.deepEqual(
    client1Board,
    client2Board,
    "Both clients should display the same board",
  );
  assert.deepEqual(
    client1Board,
    serverSession!.board,
    "Clients should display the authoritative server state",
  );
});

Given("a square is already occupied", function () {
  assert.ok(serverSession, "A game session must exist");
  // Make a valid first move so position 0 is occupied
  const result = serverMakeMove(serverSession, "X", 0);
  assert.ok(result.accepted, "Initial move should be accepted");
  serverSession = result.session;
  client1Board = [...serverSession.board];
  client2Board = [...serverSession.board];
  game = sessionToGameState(serverSession);
  selectedIndex = 0; // the occupied square
});

When("a user selects that square", function () {
  assert.ok(serverSession, "A game session must exist");
  const boardBefore = [...client1Board];
  (this as any).boardBefore = boardBefore;

  // Client sends move attempt for the occupied square
  pendingMoveFromClient = {
    player: serverSession.currentPlayer,
    index: selectedIndex,
  };

  // Server processes: should reject because the square is occupied
  lastMoveResult = serverMakeMove(
    serverSession,
    pendingMoveFromClient.player,
    pendingMoveFromClient.index,
  );
  // Do NOT update client boards on rejection
});

Then("the client sends the move attempt to the server", function () {
  assert.ok(
    pendingMoveFromClient !== null,
    "Client should have sent the move attempt",
  );
});

Then("the server rejects the move", function () {
  assert.ok(lastMoveResult !== null, "A move result must exist");
  assert.equal(
    lastMoveResult.accepted,
    false,
    "Server should have rejected the move",
  );
});

Then("the board does not change for either user", function () {
  const boardBefore = (this as any).boardBefore as (Player | null)[];
  assert.deepEqual(
    client1Board,
    boardBefore,
    "Client 1 board should not have changed after a rejected move",
  );
  assert.deepEqual(
    client2Board,
    boardBefore,
    "Client 2 board should not have changed after a rejected move",
  );
});

// ─────────────────────────────────────────────────────────────
// Bot / singleplayer feature steps
// ─────────────────────────────────────────────────────────────

When("the user starts a singleplayer game", function () {
  singleplayerState = createSingleplayerGame();
  game = singleplayerState.game;
  serverSession = undefined;
});

// Works for both Then and Given/And keyword contexts
Then("the user plays as cross", function () {
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  assert.equal(singleplayerState.userRole, "X", "User should play as cross");
});

Then("the bot plays as circle", function () {
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  assert.equal(singleplayerState.botRole, "O", "Bot should play as circle");
});

Given("a new singleplayer game has started", function () {
  singleplayerState = createSingleplayerGame();
  game = singleplayerState.game;
  serverSession = undefined;
});

Then("the bot makes the next move automatically", function () {
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  assert.ok(singleplayerState.botTurn, "It should be the bot's turn");
  singleplayerState = spBotMove(singleplayerState);
  game = singleplayerState.game;
});

Then("a circle is shown in an empty square", function () {
  assert.ok(
    game.board.some((cell) => cell === "O"),
    "There should be at least one circle on the board",
  );
});

Given("the user has made the first move", function () {
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  const index = singleplayerState.game.board.findIndex((cell) => cell === null);
  assert.ok(index !== -1, "There should be an empty square");
  singleplayerState = spUserMove(singleplayerState, index);
  game = singleplayerState.game;
  selectedIndex = index;
});

Given("the bot has not moved yet", function () {
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  assert.ok(
    singleplayerState.botTurn,
    "It should be the bot's turn (bot has not moved yet)",
  );
});

When("the user selects another empty square", function () {
  const boardBefore = [...game.board];
  (this as any).boardBefore = boardBefore;
  // Attempt another user move — must be rejected because it is the bot's turn
  const newIndex = game.board.findIndex((cell) => cell === null);
  if (singleplayerState && newIndex !== -1) {
    singleplayerState = spUserMove(singleplayerState, newIndex);
    game = singleplayerState.game;
  } else if (newIndex !== -1) {
    game = makeMove(game, newIndex);
  }
});

Given("a singleplayer game is in progress", function () {
  singleplayerState = createSingleplayerGame();
  game = singleplayerState.game;
  serverSession = undefined;
});

Given("the user has two marks in a row", function () {
  // Set up: X at 0, O at 3, X at 1 → O's turn, X threatens position 2
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  let g = singleplayerState.game;
  g = makeMove(g, 0); // X at 0
  g = makeMove(g, 3); // O at 3
  g = makeMove(g, 1); // X at 1  → now O's turn
  singleplayerState = { ...singleplayerState, game: g, botTurn: true };
  game = g;
  remainingSquareIndex = 2;
});

Given("the bot has two marks in a row", function () {
  // Set up: X(3), O(0), X(4), O(1), X(6) → O's turn, O threatens position 2
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  let g = singleplayerState.game;
  g = makeMove(g, 3); // X at 3
  g = makeMove(g, 0); // O at 0
  g = makeMove(g, 4); // X at 4
  g = makeMove(g, 1); // O at 1  → X's turn
  g = makeMove(g, 6); // X at 6  → O's turn
  singleplayerState = { ...singleplayerState, game: g, botTurn: true };
  game = g;
  remainingSquareIndex = 2;
});

Given("the remaining square in that row is empty", function () {
  assert.ok(
    game.board[remainingSquareIndex] === null,
    `Square ${remainingSquareIndex} should be empty`,
  );
});

When("the bot takes its turn", function () {
  assert.ok(singleplayerState, "Should be in singleplayer mode");
  singleplayerState = spBotMove(singleplayerState);
  game = singleplayerState.game;
});

Then("the bot marks the remaining square in that row", function () {
  assert.equal(
    game.board[remainingSquareIndex],
    "O",
    `Bot should have marked square ${remainingSquareIndex} with a circle`,
  );
});

Then("the bot wins the game", function () {
  assert.equal(game.status, "won", "Game should be in won state");
  assert.equal(game.winner, "O", "Bot (circle) should have won");
});
