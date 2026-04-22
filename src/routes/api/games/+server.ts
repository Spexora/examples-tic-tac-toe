import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { createSession } from "$lib/game-store.server.js";

export const POST: RequestHandler = () => {
  const session = createSession();
  return json({ id: session.id, role: session.hostRole });
};
