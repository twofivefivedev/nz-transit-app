/**
 * QStash Cron Endpoint for GTFS-Realtime Data Sync
 *
 * This endpoint is triggered by Upstash QStash to fetch and process real-time
 * transit data from Metlink's GTFS-RT API and store it in Redis.
 *
 * Schedule: Configured in Upstash QStash console (can run as frequently as needed)
 * QStash signature verification ensures secure, authenticated requests only.
 */

import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { syncGtfsRealtime, type SyncResult } from "@metlink/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for the sync

/**
 * Initialize QStash receiver for signature verification
 */
function getReceiver(): Receiver {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentKey) {
    throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY environment variable");
  }

  return new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: nextKey,
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Verify the request is from QStash
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.warn("[QStash GTFS-RT] Missing signature header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const receiver = getReceiver();
    const body = await request.text();

    const isValid = await receiver.verify({ signature, body });
    if (!isValid) {
      console.warn("[QStash GTFS-RT] Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Perform the GTFS-RT sync
    const result: SyncResult = await syncGtfsRealtime();

    // Log results for monitoring
    console.log("[QStash GTFS-RT]", JSON.stringify(result));

    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[QStash GTFS-RT] Fatal error:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
