import { json } from "@sveltejs/kit";
import { sessionManager } from "$lib/gameSession.js";
import type { RequestHandler } from "./$types.js";

/** POST /api/games — create a new multiplayer game session */
export const POST: RequestHandler = async () => {
  const sessionId = sessionManager.createSession();
  return json({ sessionId }, { status: 201 });
};
