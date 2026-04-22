import type { GameState, Player, Board } from "./game.js";

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Find the index of a winning move for the given player, or null if none exists.
 * A winning move is the third square in a line where the player has two marks
 * and the third square is empty.
 */
export function findWinningMove(board: Board, player: Player): number | null {
  for (const [a, b, c] of WIN_LINES) {
    const cells = [board[a], board[b], board[c]];
    const playerCount = cells.filter((cell) => cell === player).length;
    const emptyCount = cells.filter((cell) => cell === null).length;
    if (playerCount === 2 && emptyCount === 1) {
      const indices = [a, b, c];
      return indices.find((i) => board[i] === null)!;
    }
  }
  return null;
}

/**
 * Determine the best move index for the bot (always plays as O).
 * Strategy:
 *   1. Win if possible
 *   2. Block the user from winning
 *   3. Take the centre
 *   4. Take any empty corner
 *   5. Take any remaining empty square
 */
export function botMove(state: GameState): number {
  const board = state.board;

  // 1. Take winning move if available
  const winMove = findWinningMove(board, "O");
  if (winMove !== null) return winMove;

  // 2. Block the user's winning move
  const blockMove = findWinningMove(board, "X");
  if (blockMove !== null) return blockMove;

  // 3. Take the centre
  if (board[4] === null) return 4;

  // 4. Take a corner
  for (const corner of [0, 2, 6, 8]) {
    if (board[corner] === null) return corner;
  }

  // 5. Take any remaining empty square
  return board.findIndex((cell) => cell === null);
}
