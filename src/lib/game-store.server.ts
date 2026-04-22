import {
  createGameSession,
  joinSession,
  serverMakeMove,
  type GameSession,
  type Player,
  type MoveResult,
} from "./server-game.js";

const sessions = new Map<string, GameSession>();
const listeners = new Map<string, Set<(session: GameSession) => void>>();

function emit(id: string, session: GameSession): void {
  const sessionListeners = listeners.get(id);
  if (sessionListeners) {
    sessionListeners.forEach((fn) => fn(session));
  }
}

export function createSession(): GameSession {
  const session = createGameSession();
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): GameSession | undefined {
  return sessions.get(id);
}

export function joinGameSession(id: string): GameSession | null {
  const session = sessions.get(id);
  if (!session) return null;
  const updated = joinSession(session);
  sessions.set(id, updated);
  emit(id, updated);
  return updated;
}

export function makeMove(
  id: string,
  player: Player,
  index: number,
): MoveResult {
  const session = sessions.get(id);
  if (!session)
    return {
      accepted: false,
      session: {
        id,
        board: Array(9).fill(null),
        currentPlayer: "X",
        status: "waiting",
        winner: null,
        players: 0,
        hostRole: "X",
        guestRole: "O",
      },
    };
  const result = serverMakeMove(session, player, index);
  if (result.accepted) {
    sessions.set(id, result.session);
    emit(id, result.session);
  }
  return result;
}

export function subscribe(
  id: string,
  callback: (session: GameSession) => void,
): () => void {
  if (!listeners.has(id)) {
    listeners.set(id, new Set());
  }
  listeners.get(id)!.add(callback);
  return () => {
    listeners.get(id)?.delete(callback);
    if (listeners.get(id)?.size === 0) {
      listeners.delete(id);
    }
  };
}
