/**
 * GTFS-Realtime Cron Endpoint
 *
 * This endpoint is triggered by Vercel Cron to fetch and process real-time
 * transit data from Metlink's GTFS-RT API.
 *
 * Schedule: Every minute (Vercel Cron minimum)
 * The handler fetches twice per invocation to achieve ~30s update frequency.
 *
 * Authentication: Validates CRON_SECRET header from Vercel
 */

import { NextResponse } from "next/server";
import { syncGtfsRealtime, type SyncResult } from "@metlink/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds for the cron job

/**
 * Verify the request is from Vercel Cron
 */
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow unauthenticated requests
  if (process.env.NODE_ENV === "development" && !cronSecret) {
    return true;
  }

  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - rejecting request");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request): Promise<Response> {
  // Verify the request is authorized
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: SyncResult[] = [];

  try {
    // First sync
    const result1 = await syncGtfsRealtime();
    results.push(result1);

    // Wait 30 seconds then sync again to achieve ~30s update frequency
    // Vercel Cron minimum interval is 1 minute, so we do two syncs per invocation
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Second sync
    const result2 = await syncGtfsRealtime();
    results.push(result2);

    // Aggregate results
    const totalTripUpdates = results.reduce((sum, r) => sum + r.tripUpdates, 0);
    const totalVehiclePositions = results.reduce(
      (sum, r) => sum + r.vehiclePositions,
      0
    );
    const totalServiceAlerts = results.reduce(
      (sum, r) => sum + r.serviceAlerts,
      0
    );
    const allErrors = results.flatMap((r) => r.errors);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    const response = {
      success: allErrors.length === 0,
      syncs: results.length,
      totals: {
        tripUpdates: totalTripUpdates,
        vehiclePositions: totalVehiclePositions,
        serviceAlerts: totalServiceAlerts,
      },
      duration: totalDuration,
      errors: allErrors.length > 0 ? allErrors : undefined,
      timestamp: new Date().toISOString(),
    };

    // Log results for monitoring
    console.log("[GTFS-RT Cron]", JSON.stringify(response));

    return NextResponse.json(response, {
      status: allErrors.length > 0 ? 207 : 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[GTFS-RT Cron] Fatal error:", message);

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
