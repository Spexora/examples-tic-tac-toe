import { json, error } from "@sveltejs/kit";
import { sessionManager } from "$lib/gameSession.js";
import type { RequestHandler } from "./$types.js";

/** POST /api/games/:id/move — submit a move to the server */
export const POST: RequestHandler = async ({ params, request }) => {
  const session = sessionManager.getSession(params.id);
  if (!session) {
    throw error(404, "Game session not found");
  }

  const body = await request.json();
  const { playerId, index } = body as { playerId: string; index: number };

  if (typeof index !== "number" || index < 0 || index > 8) {
    throw error(400, "Invalid move index");
  }

  const moveRequest = { sessionId: params.id, playerId, index };
  session.receiveMove(moveRequest);
  const result = session.processMove(moveRequest);

  return json({ accepted: result.accepted, reason: result.reason });
};
