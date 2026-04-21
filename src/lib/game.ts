export type Cell = "X" | "O" | null;
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];
export type Player = "X" | "O";
export type GameResult = "X_WINS" | "O_WINS" | "TIE" | null;

export interface GameState {
  board: Board;
  currentPlayer: Player;
  result: GameResult;
}

export const WIN_COMBINATIONS: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createGame(): GameState {
  return {
    board: [null, null, null, null, null, null, null, null, null],
    currentPlayer: "X",
    result: null,
  };
}

export function checkResult(board: Board): GameResult {
  for (const [a, b, c] of WIN_COMBINATIONS) {
    const cellA = board[a];
    const cellB = board[b];
    const cellC = board[c];
    if (cellA && cellA === cellB && cellA === cellC) {
      return cellA === "X" ? "X_WINS" : "O_WINS";
    }
  }
  if (board.every((cell) => cell !== null)) {
    return "TIE";
  }
  return null;
}

export function makeMove(state: GameState, index: number): GameState {
  if (state.result !== null || state.board[index] !== null) {
    return state;
  }
  const newBoard = [...state.board] as Board;
  newBoard[index] = state.currentPlayer;
  const result = checkResult(newBoard);
  return {
    board: newBoard,
    currentPlayer: state.currentPlayer === "X" ? "O" : "X",
    result,
  };
}
