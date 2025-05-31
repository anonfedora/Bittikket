import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await context.params;
    const { ticketId } = await request.json();

    if (!ticketId) {
      return Response.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    // Start a transaction
    const transaction = db.transaction(() => {
      // Get the ticket and verify it belongs to this event
      const ticket = db.prepare(`
        SELECT t.*, e.title as eventTitle, e.date as eventDate
        FROM tickets t
        JOIN events e ON t.eventId = e.id
        WHERE t.id = ? AND t.eventId = ?
      `).get(ticketId, eventId);

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      if (ticket.status === "used") {
        throw new Error("Ticket has already been used");
      }

      if (ticket.invoiceStatus !== "paid") {
        throw new Error("Ticket has not been paid for");
      }

      // Update the ticket status to used and set checkedInAt timestamp
      db.prepare("UPDATE tickets SET status = 'used', checkedInAt = ? WHERE id = ?").run(new Date().toISOString(), ticketId);
    });

    // Execute the transaction
    transaction();

    return Response.json({
      success: true,
      message: "Ticket checked in successfully"
    });
  } catch (error) {
    console.error("Error checking in ticket:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to check in ticket" },
      { status: error instanceof Error && error.message === "Ticket not found" ? 404 : 500 }
    );
  }
} 