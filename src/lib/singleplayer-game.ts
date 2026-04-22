import type { GameState, Player, Cell } from "./game.js";
import { createGame, makeMove } from "./game.js";

export type { Player, Cell };

export interface SingleplayerState {
  game: GameState;
  botTurn: boolean;
  userRole: Player;
  botRole: Player;
}

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

/**
 * Find the index of a winning move for the given player,
 * i.e. a line where the player has 2 marks and one empty cell.
 * Returns -1 if no such move exists.
 */
function findWinningMove(board: (Player | null)[], player: Player): number {
  for (const [a, b, c] of WIN_LINES) {
    const line = [board[a], board[b], board[c]];
    const playerCount = line.filter((cell) => cell === player).length;
    const emptyCount = line.filter((cell) => cell === null).length;
    if (playerCount === 2 && emptyCount === 1) {
      const positions = [a, b, c];
      return positions[line.indexOf(null)];
    }
  }
  return -1;
}

/**
 * Choose the best move for the bot (O):
 * 1. Take a winning move if available.
 * 2. Block the opponent from winning.
 * 3. Fall back to the first empty square.
 */
function chooseBotMove(game: GameState): number {
  // 1. Win if possible
  const winMove = findWinningMove(game.board, "O");
  if (winMove !== -1) return winMove;

  // 2. Block the user from winning
  const blockMove = findWinningMove(game.board, "X");
  if (blockMove !== -1) return blockMove;

  // 3. First available square
  return game.board.findIndex((cell) => cell === null);
}

export function createSingleplayerGame(): SingleplayerState {
  return {
    game: createGame(),
    botTurn: false,
    userRole: "X",
    botRole: "O",
  };
}

/**
 * Apply a user move. Rejected if it is currently the bot's turn or the
 * underlying move is invalid (occupied square / game already over).
 */
export function userMove(
  state: SingleplayerState,
  index: number,
): SingleplayerState {
  if (state.botTurn || state.game.currentPlayer !== state.userRole) {
    return state;
  }

  const newGame = makeMove(state.game, index);
  if (newGame === state.game) {
    return state; // Invalid move (occupied square or game over)
  }

  return {
    ...state,
    game: newGame,
    botTurn: newGame.status === "playing",
  };
}

/**
 * Apply the bot's move. Only runs when it is the bot's turn and the game
 * is still in progress.
 */
export function botMove(state: SingleplayerState): SingleplayerState {
  if (!state.botTurn || state.game.currentPlayer !== state.botRole) {
    return state;
  }

  const index = chooseBotMove(state.game);
  if (index === -1) return state;

  const newGame = makeMove(state.game, index);
  return {
    ...state,
    game: newGame,
    botTurn: false,
  };
}
