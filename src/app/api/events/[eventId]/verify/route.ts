import { NextRequest } from "next/server";
import db from "@/lib/db";

interface VerifiedTicket {
  id: string;
  eventTitle: string;
  eventDate: string;
  status: string;
}

export async function POST(
  request: NextRequest,
  context: { params: { eventId: string } }
): Promise<Response> {
  try {
    const { eventId } = context.params;
    const { ticketId } = await request.json();

    if (!ticketId) {
      return Response.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const ticket = await Promise.resolve(
      db.prepare(`
        SELECT t.*, e.title as eventTitle, e.date as eventDate
        FROM tickets t
        JOIN events e ON t.eventId = e.id
        WHERE t.id = ? AND t.eventId = ?
      `).get(ticketId, eventId)
    ) as VerifiedTicket | undefined;

    if (!ticket) {
      return Response.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    if (ticket.status !== 'confirmed') {
      return Response.json(
        { error: "Ticket is not confirmed" },
        { status: 400 }
      );
    }

    return Response.json({
      valid: true,
      ticket: {
        id: ticket.id,
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        status: ticket.status
      }
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return Response.json(
      { error: "Failed to verify ticket" },
      { status: 500 }
    );
  }
} 