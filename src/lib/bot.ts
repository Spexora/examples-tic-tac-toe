import type { GameState, Player, Board } from "./game.js";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

function minimax(
  board: (Player | null)[],
  depth: number,
  isMaximizing: boolean,
  botPlayer: Player,
  userPlayer: Player,
): number {
  const winner = checkWinner(board as Board);
  if (winner === botPlayer) return 10 - depth;
  if (winner === userPlayer) return depth - 10;
  if (board.every((cell) => cell !== null)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = botPlayer;
        best = Math.max(
          best,
          minimax(board, depth + 1, false, botPlayer, userPlayer),
        );
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = userPlayer;
        best = Math.min(
          best,
          minimax(board, depth + 1, true, botPlayer, userPlayer),
        );
        board[i] = null;
      }
    }
    return best;
  }
}

/**
 * Returns the index of the best move for the bot using minimax.
 * @param state  Current game state
 * @param botPlayer  Which player the bot controls ('X' or 'O')
 */
export function getBotMove(state: GameState, botPlayer: Player): number {
  const userPlayer: Player = botPlayer === "O" ? "X" : "O";
  const board = [...state.board] as (Player | null)[];

  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = botPlayer;
      const score = minimax(board, 0, false, botPlayer, userPlayer);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}
