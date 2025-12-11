/**
 * SSE Endpoint for Real-time Departure Updates
 *
 * Streams departure updates for a specific stop using Server-Sent Events.
 * Polls Redis every 5 seconds and pushes changes to connected clients.
 *
 * Usage:
 *   const eventSource = new EventSource('/api/sse/stop/WELL');
 *   eventSource.onmessage = (event) => {
 *     const data = JSON.parse(event.data);
 *     console.log(data.departures);
 *   };
 */

import { fetchDeparturesForSSE } from "@metlink/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_DURATION_MS = 55000; // 55 seconds (leave buffer before Vercel timeout)

interface SSEMessage {
  event?: string;
  data: string;
  id?: string;
}

function formatSSEMessage(message: SSEMessage): string {
  let result = "";
  if (message.event) {
    result += `event: ${message.event}\n`;
  }
  if (message.id) {
    result += `id: ${message.id}\n`;
  }
  result += `data: ${message.data}\n\n`;
  return result;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stopId: string }> }
): Promise<Response> {
  const { stopId } = await params;

  if (!stopId) {
    return new Response(
      JSON.stringify({ error: "stopId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  let isActive = true;
  let lastHash = "";
  let messageId = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();

      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          formatSSEMessage({
            event: "connected",
            data: JSON.stringify({ stopId, timestamp: Date.now() }),
          })
        )
      );

      // Poll loop
      while (isActive && Date.now() - startTime < MAX_DURATION_MS) {
        try {
          const data = await fetchDeparturesForSSE(stopId);

          // Only send if data has changed
          if (data.hash !== lastHash) {
            lastHash = data.hash;
            messageId++;

            controller.enqueue(
              encoder.encode(
                formatSSEMessage({
                  event: "departures",
                  data: JSON.stringify(data),
                  id: String(messageId),
                })
              )
            );
          }
        } catch (error) {
          // Send error event but continue polling
          controller.enqueue(
            encoder.encode(
              formatSSEMessage({
                event: "error",
                data: JSON.stringify({
                  error: error instanceof Error ? error.message : "Unknown error",
                  timestamp: Date.now(),
                }),
              })
            )
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      // Send reconnect hint before closing
      controller.enqueue(
        encoder.encode(
          formatSSEMessage({
            event: "reconnect",
            data: JSON.stringify({
              reason: "timeout",
              retryMs: 1000,
            }),
          })
        )
      );

      controller.close();
    },

    cancel() {
      isActive = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
