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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await context.params;

    // Start a transaction
    const transaction = db.transaction(() => {
      // First, delete all tickets associated with the event
      db.prepare("DELETE FROM tickets WHERE eventId = ?").run(eventId);
      
      // Then, delete the event
      const result = db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
      
      if (result.changes === 0) {
        throw new Error("Event not found");
      }
    });

    // Execute the transaction
    transaction();

    return Response.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete event" },
      { status: error instanceof Error && error.message === "Event not found" ? 404 : 500 }
    );
  }
} 