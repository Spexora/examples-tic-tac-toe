import { createGame, makeMove, type GameState, type Player } from "./game.js";

export type PlayerId = string;
export type SessionId = string;

export interface MoveRequest {
  sessionId: SessionId;
  playerId: PlayerId;
  index: number;
}

export interface MoveResult {
  accepted: boolean;
  state: GameState;
  reason?: string;
}

export class GameSession {
  private state: GameState;
  private xPlayerId: PlayerId | null = null;
  private oPlayerId: PlayerId | null = null;
  private subscribers: Map<PlayerId, (state: GameState) => void> = new Map();
  private receivedMoves: MoveRequest[] = [];

  constructor() {
    this.state = createGame();
  }

  addPlayer(playerId: PlayerId): Player {
    if (!this.xPlayerId) {
      this.xPlayerId = playerId;
      return "X";
    }
    if (!this.oPlayerId) {
      this.oPlayerId = playerId;
      return "O";
    }
    throw new Error("Session is full");
  }

  getPlayerRole(playerId: PlayerId): Player | undefined {
    if (this.xPlayerId === playerId) return "X";
    if (this.oPlayerId === playerId) return "O";
    return undefined;
  }

  getXPlayerId(): PlayerId | null {
    return this.xPlayerId;
  }

  getOPlayerId(): PlayerId | null {
    return this.oPlayerId;
  }

  getPlayerCount(): number {
    return (this.xPlayerId ? 1 : 0) + (this.oPlayerId ? 1 : 0);
  }

  receiveMove(request: MoveRequest): void {
    this.receivedMoves.push(request);
  }

  getReceivedMoves(): MoveRequest[] {
    return [...this.receivedMoves];
  }

  processMove(request: MoveRequest): MoveResult {
    const role = this.getPlayerRole(request.playerId);

    if (!role) {
      return { accepted: false, state: this.state, reason: "Unknown player" };
    }

    if (role !== this.state.currentPlayer) {
      return { accepted: false, state: this.state, reason: "Not your turn" };
    }

    if (this.state.status !== "playing") {
      return { accepted: false, state: this.state, reason: "Game is over" };
    }

    if (this.state.board[request.index] !== null) {
      return {
        accepted: false,
        state: this.state,
        reason: "Square already occupied",
      };
    }

    const newState = makeMove(this.state, request.index);
    if (newState === this.state) {
      return { accepted: false, state: this.state, reason: "Invalid move" };
    }

    this.state = newState;
    this.publishToAll();
    return { accepted: true, state: this.state };
  }

  subscribe(playerId: PlayerId, callback: (state: GameState) => void): void {
    this.subscribers.set(playerId, callback);
  }

  unsubscribe(playerId: PlayerId): void {
    this.subscribers.delete(playerId);
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  getState(): GameState {
    return this.state;
  }

  publishState(): void {
    this.publishToAll();
  }

  private publishToAll(): void {
    for (const callback of this.subscribers.values()) {
      callback(this.state);
    }
  }
}

export class GameSessionManager {
  private sessions: Map<SessionId, GameSession> = new Map();

  createSession(): SessionId {
    const id = this.generateId();
    this.sessions.set(id, new GameSession());
    return id;
  }

  getSession(id: SessionId): GameSession | undefined {
    return this.sessions.get(id);
  }

  hasSession(id: SessionId): boolean {
    return this.sessions.has(id);
  }

  private generateId(): SessionId {
    return Math.random().toString(36).slice(2, 10);
  }
}

export const sessionManager = new GameSessionManager();
