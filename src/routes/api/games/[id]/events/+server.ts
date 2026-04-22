import type { RequestHandler } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { getSession, subscribe } from "$lib/game-store.server.js";

export const GET: RequestHandler = ({ params }) => {
  const session = getSession(params.id);
  if (!session) error(404, "Game not found");

  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encode = (data: string) =>
        controller.enqueue(new TextEncoder().encode(data));

      // Send current state immediately
      encode(`data: ${JSON.stringify(session)}\n\n`);

      // Subscribe to future updates
      unsubscribe = subscribe(params.id, (updated) => {
        try {
          encode(`data: ${JSON.stringify(updated)}\n\n`);
        } catch {
          // Controller closed
        }
      });
    },
    cancel() {
      unsubscribe?.();
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
