import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await context.params;
    const event = await Promise.resolve(
      db.prepare('SELECT * FROM events WHERE id = ?').get(eventId)
    );

    if (!event) {
      return Response.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return Response.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return Response.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
} 