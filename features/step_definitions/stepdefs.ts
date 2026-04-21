import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Before, Given, When, Then } from "@cucumber/cucumber";
import {
  createGame,
  makeMove,
  type GameState,
  type Player,
} from "../../src/lib/game.js";
import {
  GameSession,
  GameSessionManager,
  type MoveRequest,
  type MoveResult,
  type PlayerId,
  type SessionId,
} from "../../src/lib/gameSession.js";
import { GameClient } from "../../src/lib/gameClient.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// Shared game state for scenarios
// ─────────────────────────────────────────────────────────────

let game: GameState;
let selectedIndex: number;

// Multiplayer state
let multiSession: GameSession | null = null;
let sessionId: SessionId;
let crossClient: GameClient;
let circleClient: GameClient;
let lastMoveRequest: MoveRequest | null = null;
let lastMoveResult: MoveResult | null = null;

// Reset multiplayer state before each scenario
Before(function () {
  multiSession = null;
  lastMoveRequest = null;
  lastMoveResult = null;
});

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
  const board = multiSession ? multiSession.getState().board : game.board;
  assert.equal(board.length, 9, "Board should have 9 cells (3x3)");
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
  if (multiSession) {
    // Multiplayer: route the move through the server
    const emptyIdx = multiSession.getState().board.findIndex((c) => c === null);
    assert.ok(emptyIdx !== -1, "There should be an empty square for cross");
    selectedIndex = emptyIdx;
    const req: MoveRequest = {
      index: emptyIdx,
      playerId: crossClient.playerId,
      sessionId,
    };
    multiSession.receiveMove(req);
    multiSession.processMove(req);
    game = multiSession.getState();
  } else {
    selectedIndex = 0;
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
  if (multiSession) {
    // Multiplayer: send move attempt through server
    const boardBefore = [...multiSession.getState().board];
    (this as any).boardBefore = boardBefore;
    const req: MoveRequest = {
      index: selectedIndex,
      playerId: crossClient.playerId,
      sessionId,
    };
    multiSession.receiveMove(req);
    lastMoveRequest = req;
    lastMoveResult = multiSession.processMove(req);
    game = multiSession.getState();
  } else {
    const boardBefore = [...game.board];
    game = makeMove(game, selectedIndex);
    (this as any).boardBefore = boardBefore;
  }
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

function readGamePageSource(): string {
  const pagePath = join(__dirname, "../../src/routes/game/[id]/+page.svelte");
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

/** Helper: create a fresh multiplayer session with cross and circle players */
function setupMultiplayerSession(): void {
  const manager = new GameSessionManager();
  sessionId = manager.createSession();
  multiSession = manager.getSession(sessionId)!;

  const xId = "player-x";
  const oId = "player-o";
  multiSession.addPlayer(xId); // X (cross)
  multiSession.addPlayer(oId); // O (circle)

  crossClient = new GameClient(xId, sessionId);
  circleClient = new GameClient(oId, sessionId);

  // Subscribe both clients to server state updates
  multiSession.subscribe(xId, (state) =>
    crossClient.receiveServerUpdate(state),
  );
  multiSession.subscribe(oId, (state) =>
    circleClient.receiveServerUpdate(state),
  );

  game = multiSession.getState();
}

Given("the user has not started a game", function () {
  // No game has been started; default state
  multiSession = null;
});

Then("singleplayer and multiplayer options are shown", function () {
  const source = readPageSource();
  const hasSingleplayer =
    /singleplayer/i.test(source) || /single.?player/i.test(source);
  const hasMultiplayer =
    /multiplayer/i.test(source) || /multi.?player/i.test(source);
  assert.ok(hasSingleplayer, "Page should show a singleplayer option");
  assert.ok(hasMultiplayer, "Page should show a multiplayer option");
});

When("the user selects the multiplayer option", function () {
  // Simulate creating a new game session (what clicking Multiplayer does)
  const manager = new GameSessionManager();
  sessionId = manager.createSession();
  multiSession = manager.getSession(sessionId)!;

  // Host joins as X
  const hostId = "player-x";
  multiSession.addPlayer(hostId);
  crossClient = new GameClient(hostId, sessionId);
  multiSession.subscribe(hostId, (state) =>
    crossClient.receiveServerUpdate(state),
  );
});

Then("an invite link is shown", function () {
  // Verify a session ID was generated (forms the invite link /game/<sessionId>)
  assert.ok(sessionId, "A session ID should have been created");
  assert.ok(sessionId.length > 0, "Session ID should be non-empty");

  // Also verify the game page source shows invite link functionality
  const source = readGamePageSource();
  const hasInviteLink = /invite/i.test(source) || /inviteLink/i.test(source);
  assert.ok(hasInviteLink, "Game page should display an invite link");
});

Given("the user has selected the multiplayer option", function () {
  const manager = new GameSessionManager();
  sessionId = manager.createSession();
  multiSession = manager.getSession(sessionId)!;

  const hostId = "player-x";
  multiSession.addPlayer(hostId);
  crossClient = new GameClient(hostId, sessionId);
  multiSession.subscribe(hostId, (state) =>
    crossClient.receiveServerUpdate(state),
  );
});

When("an opponent joins the game", function () {
  assert.ok(multiSession, "A multiplayer session should exist");
  const oId = "player-o";
  multiSession!.addPlayer(oId);
  circleClient = new GameClient(oId, sessionId);
  multiSession!.subscribe(oId, (state) =>
    circleClient.receiveServerUpdate(state),
  );
  // Server publishes updated state to notify both clients
  multiSession!.publishState();
  game = multiSession!.getState();
});

Given("a new game has been created", function () {
  const manager = new GameSessionManager();
  sessionId = manager.createSession();
  multiSession = manager.getSession(sessionId)!;

  // Host joins as cross (X)
  const hostId = "player-x";
  multiSession.addPlayer(hostId);
  crossClient = new GameClient(hostId, sessionId);
  multiSession.subscribe(hostId, (state) =>
    crossClient.receiveServerUpdate(state),
  );

  game = multiSession.getState();
});

When("a user joins through the invite link", function () {
  assert.ok(multiSession, "A game session should exist to join");
  const joinerId = "player-o";
  multiSession!.addPlayer(joinerId);
  circleClient = new GameClient(joinerId, sessionId);
  multiSession!.subscribe(joinerId, (state) =>
    circleClient.receiveServerUpdate(state),
  );
  multiSession!.publishState();
  game = multiSession!.getState();
});

Then("one user is assigned a cross and the other a circle", function () {
  assert.ok(multiSession, "Session should exist");
  assert.equal(
    multiSession!.getPlayerRole(crossClient.playerId),
    "X",
    "First player should be cross (X)",
  );
  assert.equal(
    multiSession!.getPlayerRole(circleClient.playerId),
    "O",
    "Second player should be circle (O)",
  );
  assert.notEqual(
    crossClient.playerId,
    circleClient.playerId,
    "Players should have different IDs",
  );
});

Given("a user has joined through the invite link", function () {
  assert.ok(multiSession, "A game session should already exist");
  if (multiSession!.getPlayerCount() < 2) {
    const joinerId = "player-o";
    multiSession!.addPlayer(joinerId);
    circleClient = new GameClient(joinerId, sessionId);
    multiSession!.subscribe(joinerId, (state) =>
      circleClient.receiveServerUpdate(state),
    );
    multiSession!.publishState();
  }
  game = multiSession!.getState();
});

Given("no moves have been made", function () {
  const board = multiSession ? multiSession.getState().board : game.board;
  assert.ok(
    board.every((cell) => cell === null),
    "Board should be empty — no moves made yet",
  );
});

When("the cross user selects an empty square", function () {
  assert.ok(multiSession, "Multiplayer session required");
  const emptyIdx = multiSession!.getState().board.findIndex((c) => c === null);
  assert.ok(emptyIdx !== -1, "There should be an empty square");
  selectedIndex = emptyIdx;
  (this as any).boardBefore = [...multiSession!.getState().board];

  // Client sends move to server; server validates and broadcasts
  const req = crossClient.sendMove(emptyIdx);
  lastMoveRequest = req;
  multiSession!.receiveMove(req);
  lastMoveResult = multiSession!.processMove(req);
  game = multiSession!.getState();
});

Then("that square shows a cross for both users", function () {
  const xState = crossClient.getLocalState();
  const oState = circleClient.getLocalState();
  assert.ok(xState, "Cross client should have received a state update");
  assert.ok(oState, "Circle client should have received a state update");
  assert.equal(
    xState!.board[selectedIndex],
    "X",
    "Cross client should see X at the selected square",
  );
  assert.equal(
    oState!.board[selectedIndex],
    "X",
    "Circle client should see X at the selected square",
  );
});

When("the circle user selects an empty square", function () {
  assert.ok(multiSession, "Multiplayer session required");
  const emptyIdx = multiSession!.getState().board.findIndex((c) => c === null);
  assert.ok(emptyIdx !== -1, "There should be an empty square");
  selectedIndex = emptyIdx;
  (this as any).boardBefore = [...multiSession!.getState().board];

  // Client sends move to server; server validates and broadcasts (may reject)
  const req = circleClient.sendMove(emptyIdx);
  lastMoveRequest = req;
  multiSession!.receiveMove(req);
  lastMoveResult = multiSession!.processMove(req);
  game = multiSession!.getState();
});

Then("that square shows a circle for both users", function () {
  const xState = crossClient.getLocalState();
  const oState = circleClient.getLocalState();
  assert.ok(xState, "Cross client should have received a state update");
  assert.ok(oState, "Circle client should have received a state update");
  assert.equal(
    xState!.board[selectedIndex],
    "O",
    "Cross client should see O at the selected square",
  );
  assert.equal(
    oState!.board[selectedIndex],
    "O",
    "Circle client should see O at the selected square",
  );
});

// ─────────────────────────────────────────────────────────────
// Managed-by-server feature steps
// ─────────────────────────────────────────────────────────────

Given("a multiplayer game is in progress", function () {
  setupMultiplayerSession();
});

Given("it is the cross user's turn", function () {
  assert.ok(multiSession, "Session required");
  assert.equal(
    multiSession!.getState().currentPlayer,
    "X",
    "It should be cross's turn",
  );
});

Then("the client sends the move to the server", function () {
  assert.ok(
    lastMoveRequest !== null,
    "A move request should have been sent to the server",
  );
  const received = multiSession!.getReceivedMoves();
  const found = received.some(
    (r) =>
      r.index === lastMoveRequest!.index &&
      r.playerId === lastMoveRequest!.playerId,
  );
  assert.ok(found, "Server should have received the move request");
});

Then("the move is not applied only in the local client state", function () {
  // The move was applied via the server (server is the authority), not local computation.
  // The client's local state should match the server's authoritative state.
  const clientState = crossClient.getLocalState();
  const serverState = multiSession!.getState();
  assert.ok(
    clientState !== null,
    "Client should have received state from server",
  );
  assert.deepEqual(
    clientState!.board,
    serverState.board,
    "Client state should reflect the server state (move applied via server, not local-only)",
  );
});

Given("the server receives a valid move", function () {
  assert.ok(multiSession, "Session required");
  const emptyIdx = multiSession!.getState().board.findIndex((c) => c === null);
  assert.ok(
    emptyIdx !== -1,
    "There should be an empty square for a valid move",
  );
  const req: MoveRequest = {
    index: emptyIdx,
    playerId: crossClient.playerId,
    sessionId,
  };
  multiSession!.receiveMove(req);
  lastMoveRequest = req;
});

When("the server processes the move", function () {
  assert.ok(multiSession, "Session required");
  assert.ok(lastMoveRequest, "A move request should be pending");
  lastMoveResult = multiSession!.processMove(lastMoveRequest!);
  game = multiSession!.getState();
});

Then("the server updates the game state", function () {
  assert.ok(lastMoveResult, "A move result should exist");
  assert.ok(
    lastMoveResult!.accepted,
    "The server should have accepted the move",
  );
  assert.equal(
    lastMoveResult!.state.board[lastMoveRequest!.index],
    "X",
    "Server state should have X at the played index",
  );
});

Then(
  "the server publishes the updated game state to both clients",
  function () {
    const xState = crossClient.getLocalState();
    const oState = circleClient.getLocalState();
    assert.ok(
      xState !== null,
      "Cross client should have received the server state update",
    );
    assert.ok(
      oState !== null,
      "Circle client should have received the server state update",
    );
    assert.deepEqual(
      xState!.board,
      multiSession!.getState().board,
      "Cross client state should match server state",
    );
    assert.deepEqual(
      oState!.board,
      multiSession!.getState().board,
      "Circle client state should match server state",
    );
  },
);

Given("the server has published a game state update", function () {
  assert.ok(multiSession, "Session required");
  const emptyIdx = multiSession!.getState().board.findIndex((c) => c === null);
  assert.ok(emptyIdx !== -1, "There should be an empty square");
  const req: MoveRequest = {
    index: emptyIdx,
    playerId: crossClient.playerId,
    sessionId,
  };
  multiSession!.receiveMove(req);
  multiSession!.processMove(req); // processes and broadcasts to both clients
  game = multiSession!.getState();
});

When("both clients receive the server-sent event", function () {
  // In our synchronous model, clients receive updates via subscription callbacks
  // immediately when the server publishes. Verify both clients have state.
  const xState = crossClient.getLocalState();
  const oState = circleClient.getLocalState();
  assert.ok(xState !== null, "Cross client should have received state");
  assert.ok(oState !== null, "Circle client should have received state");
});

Then("both clients show the same board state", function () {
  const xState = crossClient.getLocalState();
  const oState = circleClient.getLocalState();
  assert.ok(xState, "Cross client must have a state");
  assert.ok(oState, "Circle client must have a state");
  assert.deepEqual(
    xState!.board,
    oState!.board,
    "Both clients should display the same board state",
  );
});

Given("a square is already occupied", function () {
  assert.ok(multiSession, "Session required");
  // Make X's first move to occupy a square
  selectedIndex = 0;
  const req: MoveRequest = {
    index: selectedIndex,
    playerId: crossClient.playerId,
    sessionId,
  };
  multiSession!.receiveMove(req);
  multiSession!.processMove(req);
  game = multiSession!.getState();
});

// "When a user selects that square" — used in managed_by_server invalid move scenario
When("a user selects that square", function () {
  assert.ok(multiSession, "Session required");
  // Record the board state before the attempt
  (this as any).boardBefore = [...multiSession!.getState().board];

  // The current player attempts to play on the already-occupied square
  const currentPlayer = multiSession!.getState().currentPlayer;
  const attemptingClient = currentPlayer === "X" ? crossClient : circleClient;

  const req: MoveRequest = {
    index: selectedIndex,
    playerId: attemptingClient.playerId,
    sessionId,
  };
  lastMoveRequest = req;
  multiSession!.receiveMove(req);
  lastMoveResult = multiSession!.processMove(req);
  game = multiSession!.getState();
});

Then("the client sends the move attempt to the server", function () {
  assert.ok(
    lastMoveRequest !== null,
    "A move attempt should have been sent to the server",
  );
  const received = multiSession!.getReceivedMoves();
  const found = received.some(
    (r) =>
      r.index === lastMoveRequest!.index &&
      r.playerId === lastMoveRequest!.playerId,
  );
  assert.ok(found, "Server should have received the move attempt");
});

Then("the server rejects the move", function () {
  assert.ok(lastMoveResult !== null, "A move result should exist");
  assert.ok(
    !lastMoveResult!.accepted,
    "Server should have rejected the invalid move",
  );
});

Then("the board does not change for either user", function () {
  const boardBefore: (string | null)[] | undefined = (this as any).boardBefore;
  assert.ok(
    boardBefore,
    "boardBefore should have been set before the move attempt",
  );

  const xBoard =
    crossClient.getLocalState()?.board ?? multiSession!.getState().board;
  const oBoard =
    circleClient.getLocalState()?.board ?? multiSession!.getState().board;

  assert.deepEqual(
    xBoard,
    boardBefore,
    "Cross client board should not have changed after rejected move",
  );
  assert.deepEqual(
    oBoard,
    boardBefore,
    "Circle client board should not have changed after rejected move",
  );
});
