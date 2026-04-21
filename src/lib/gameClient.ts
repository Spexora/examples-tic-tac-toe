import type { GameState } from "./game.js";
import type { MoveRequest, PlayerId, SessionId } from "./gameSession.js";

/**
 * Represents the client side of a multiplayer game.
 * The client does NOT apply moves locally; it sends move requests to the server
 * and updates its local state only when the server broadcasts an update.
 */
export class GameClient {
  private localState: GameState | null = null;
  private pendingMoves: MoveRequest[] = [];
  private stateListeners: ((state: GameState) => void)[] = [];

  constructor(
    public readonly playerId: PlayerId,
    public readonly sessionId: SessionId,
  ) {}

  /**
   * Send a move request to the server. Does NOT update local state.
   * Local state is only updated via receiveServerUpdate (server-sent event).
   */
  sendMove(index: number): MoveRequest {
    const request: MoveRequest = {
      index,
      playerId: this.playerId,
      sessionId: this.sessionId,
    };
    this.pendingMoves.push(request);
    return request;
  }

  getPendingMoves(): MoveRequest[] {
    return [...this.pendingMoves];
  }

  /**
   * Called when the server publishes a state update (server-sent event).
   * This is the ONLY way the client's local state can change.
   */
  receiveServerUpdate(state: GameState): void {
    this.localState = state;
    this.pendingMoves = [];
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  onStateChange(callback: (state: GameState) => void): void {
    this.stateListeners.push(callback);
  }

  getLocalState(): GameState | null {
    return this.localState;
  }
}
