export type Cell = "X" | "O" | null;
export type Board = Cell[][];

export class TicTacToe {
  board: Board;
  currentPlayer: "X" | "O";
  private lastMove: [number, number] | null;

  constructor() {
    this.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    this.currentPlayer = "X";
    this.lastMove = null;
  }

  selectSquare(row: number, col: number): boolean {
    if (this.board[row]?.[col] !== null || this.isGameOver()) {
      return false;
    }
    this.board[row]![col] = this.currentPlayer;
    this.lastMove = [row, col];
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    return true;
  }

  getLastMove(): [number, number] | null {
    return this.lastMove;
  }

  getWinner(): "X" | "O" | null {
    const lines = [
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const va = this.board[a![0]!]?.[a![1]!] ?? null;
      const vb = this.board[b![0]!]?.[b![1]!] ?? null;
      const vc = this.board[c![0]!]?.[c![1]!] ?? null;
      if (va !== null && va === vb && vb === vc) {
        return va;
      }
    }
    return null;
  }

  isTie(): boolean {
    return (
      this.board.flat().every((cell) => cell !== null) &&
      this.getWinner() === null
    );
  }

  isGameOver(): boolean {
    return this.getWinner() !== null || this.isTie();
  }
}
