export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];
export type SessionStatus = "waiting" | "playing" | "won" | "tied";

export interface GameSession {
  id: string;
  board: Board;
  currentPlayer: Player;
  status: SessionStatus;
  winner: Player | null;
  players: number;
  hostRole: Player;
  guestRole: Player;
}

export interface MoveResult {
  accepted: boolean;
  session: GameSession;
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

function checkWinner(board: Board): Player | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createGameSession(): GameSession {
  return {
    id: generateId(),
    board: Array(9).fill(null),
    currentPlayer: "X",
    status: "waiting",
    winner: null,
    players: 1,
    hostRole: "X",
    guestRole: "O",
  };
}

export function joinSession(session: GameSession): GameSession {
  if (session.players >= 2) return session;
  return { ...session, players: 2, status: "playing" };
}

export function serverMakeMove(
  session: GameSession,
  player: Player,
  index: number,
): MoveResult {
  if (session.status !== "playing") return { accepted: false, session };
  if (session.currentPlayer !== player) return { accepted: false, session };
  if (session.board[index] !== null) return { accepted: false, session };

  const newBoard = [...session.board];
  newBoard[index] = player;

  const winner = checkWinner(newBoard);
  if (winner) {
    return {
      accepted: true,
      session: { ...session, board: newBoard, status: "won", winner },
    };
  }

  if (newBoard.every((cell) => cell !== null)) {
    return {
      accepted: true,
      session: { ...session, board: newBoard, status: "tied" },
    };
  }

  return {
    accepted: true,
    session: {
      ...session,
      board: newBoard,
      currentPlayer: player === "X" ? "O" : "X",
    },
  };
}
