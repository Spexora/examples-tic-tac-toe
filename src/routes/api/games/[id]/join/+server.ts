import { json, error } from "@sveltejs/kit";
import { sessionManager } from "$lib/gameSession.js";
import type { RequestHandler } from "./$types.js";

/** POST /api/games/:id/join — join an existing game session as a player */
export const POST: RequestHandler = async ({ params, request }) => {
  const session = sessionManager.getSession(params.id);
  if (!session) {
    throw error(404, "Game session not found");
  }

  if (session.getPlayerCount() >= 2) {
    throw error(409, "Game session is already full");
  }

  const body = await request.json();
  const { playerId } = body as { playerId: string };

  if (!playerId) {
    throw error(400, "playerId is required");
  }

  const role = session.addPlayer(playerId);
  const opponentJoined = session.getPlayerCount() === 2;

  // Notify existing subscribers that the opponent has joined
  if (opponentJoined) {
    session.publishState();
  }

  return json({ role, opponentJoined });
};
