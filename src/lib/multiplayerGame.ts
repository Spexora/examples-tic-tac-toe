import { createGame, makeMove, type GameState, type Player } from "./game.js";

export type Role = Player;

export interface MultiplayerSession {
  id: string;
  inviteCode: string;
  hostRole: Role;
  guestRole: Role;
  serverState: GameState;
  hostLocalState: GameState | null;
  guestLocalState: GameState | null;
  pendingMove: { role: Role; index: number } | null;
  lastRejectedMove: { role: Role; index: number } | null;
  hostJoined: boolean;
  guestJoined: boolean;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function createMultiplayerSession(): MultiplayerSession {
  const initialState = createGame();
  return {
    id: generateId(),
    inviteCode: generateId(),
    hostRole: "X",
    guestRole: "O",
    serverState: initialState,
    hostLocalState: null,
    guestLocalState: null,
    pendingMove: null,
    lastRejectedMove: null,
    hostJoined: true,
    guestJoined: false,
  };
}

export function joinSession(session: MultiplayerSession): MultiplayerSession {
  return {
    ...session,
    guestJoined: true,
    hostLocalState: {
      ...session.serverState,
      board: [...session.serverState.board],
    },
    guestLocalState: {
      ...session.serverState,
      board: [...session.serverState.board],
    },
  };
}

/**
 * Client sends a move to the server.
 * The move is recorded as pending and is NOT applied to local client state.
 */
export function clientSendMove(
  session: MultiplayerSession,
  role: Role,
  index: number,
): { session: MultiplayerSession; sent: boolean } {
  return {
    session: { ...session, pendingMove: { role, index } },
    sent: true,
  };
}

/**
 * Server validates and processes the pending move.
 * Returns whether the move was accepted.
 */
export function serverProcessMove(session: MultiplayerSession): {
  session: MultiplayerSession;
  accepted: boolean;
} {
  if (!session.pendingMove) {
    return { session, accepted: false };
  }
  const { role, index } = session.pendingMove;
  const state = session.serverState;

  if (
    state.board[index] !== null ||
    state.status !== "playing" ||
    state.currentPlayer !== role
  ) {
    return {
      session: {
        ...session,
        pendingMove: null,
        lastRejectedMove: session.pendingMove,
      },
      accepted: false,
    };
  }

  const newServerState = makeMove(state, index);
  return {
    session: {
      ...session,
      serverState: newServerState,
      pendingMove: null,
      lastRejectedMove: null,
    },
    accepted: true,
  };
}

/**
 * Server publishes the authoritative game state to both clients (via SSE).
 * Both client local states are updated to match the server state.
 */
export function serverPublishState(
  session: MultiplayerSession,
): MultiplayerSession {
  return {
    ...session,
    hostLocalState: {
      ...session.serverState,
      board: [...session.serverState.board],
    },
    guestLocalState: {
      ...session.serverState,
      board: [...session.serverState.board],
    },
  };
}
