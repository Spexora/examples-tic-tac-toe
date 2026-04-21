export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];

export type GameStatus = "playing" | "won" | "tied";

export interface GameState {
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
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
];

export function createGame(): GameState {
  return {
    board: Array(9).fill(null),
    currentPlayer: "X",
    status: "playing",
    winner: null,
  };
}

function checkWinner(board: Board): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

export function makeMove(state: GameState, index: number): GameState {
  if (state.board[index] !== null || state.status !== "playing") {
    return state; // No change for invalid moves
  }

  const newBoard = [...state.board];
  newBoard[index] = state.currentPlayer;

  const winner = checkWinner(newBoard);
  if (winner) {
    return {
      board: newBoard,
      currentPlayer: state.currentPlayer,
      status: "won",
      winner,
    };
  }

  if (newBoard.every((cell) => cell !== null)) {
    return {
      board: newBoard,
      currentPlayer: state.currentPlayer,
      status: "tied",
      winner: null,
    };
  }

  return {
    board: newBoard,
    currentPlayer: state.currentPlayer === "X" ? "O" : "X",
    status: "playing",
    winner: null,
  };
}
