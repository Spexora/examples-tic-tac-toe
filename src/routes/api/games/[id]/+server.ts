import type { RequestHandler } from "@sveltejs/kit";
import { json, error } from "@sveltejs/kit";
import { getSession } from "$lib/game-store.server.js";

export const GET: RequestHandler = ({ params }) => {
  const session = getSession(params.id);
  if (!session) error(404, "Game not found");
  return json(session);
};
