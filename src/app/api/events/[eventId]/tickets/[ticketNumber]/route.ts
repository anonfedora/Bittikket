import { NextRequest } from "next/server";
import db from "@/lib/db";
import { Ticket } from "@/types/event";

// Temporary in-memory storage for tickets
// TODO: Replace with database in production
const tickets: Ticket[] = [];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string; ticketNumber: string }> }
): Promise<Response> {
  try {
    const { eventId, ticketNumber } = await context.params;

    const ticket = await Promise.resolve(
      db.prepare('SELECT * FROM tickets WHERE id = ? AND eventId = ?').get(ticketNumber, eventId)
    ) as Ticket | undefined;

    if (!ticket) {
      return Response.json({ error: "Ticket not found" }, { status: 404 });
    }

    return Response.json(ticket);
  } catch (error) {
    console.error("Error fetching single ticket:", error);
    return Response.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
} 