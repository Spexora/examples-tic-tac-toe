import type { RequestHandler } from "@sveltejs/kit";
import { json, error } from "@sveltejs/kit";
import { makeMove, getSession } from "$lib/game-store.server.js";
import type { Player } from "$lib/server-game.js";

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json();
  const { player, index } = body as { player: Player; index: number };

  const session = getSession(params.id);
  if (!session) error(404, "Game not found");

  const result = makeMove(params.id, player, index);
  return json({ accepted: result.accepted, game: result.session });
};
