import type { RequestHandler } from "@sveltejs/kit";
import { json, error } from "@sveltejs/kit";
import { joinGameSession, getSession } from "$lib/game-store.server.js";

export const POST: RequestHandler = ({ params }) => {
  const existing = getSession(params.id);
  if (!existing) error(404, "Game not found");
  if (existing.players >= 2) error(409, "Game already full");

  const session = joinGameSession(params.id);
  if (!session) error(404, "Game not found");

  return json({ role: session.guestRole, gameId: params.id });
};
