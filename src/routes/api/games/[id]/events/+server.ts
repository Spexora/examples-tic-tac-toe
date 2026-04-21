import { error } from "@sveltejs/kit";
import { sessionManager } from "$lib/gameSession.js";
import type { RequestHandler } from "./$types.js";

/**
 * GET /api/games/:id/events?playerId=...
 * Server-Sent Events stream: broadcasts game state updates to connected clients.
 */
export const GET: RequestHandler = async ({ params, url }) => {
  const session = sessionManager.getSession(params.id);
  if (!session) {
    throw error(404, "Game session not found");
  }

  const playerId = url.searchParams.get("playerId");
  if (!playerId) {
    throw error(400, "playerId query parameter is required");
  }

  const role = session.getPlayerRole(playerId);
  if (!role) {
    throw error(403, "Player not part of this session");
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (state: object) => {
        const data = `data: ${JSON.stringify(state)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      // Subscribe to state updates
      session.subscribe(playerId, send);

      // Send the initial state immediately
      send(session.getState());
    },
    cancel() {
      session.unsubscribe(playerId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
