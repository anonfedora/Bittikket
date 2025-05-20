import { NextRequest } from "next/server";
import db from "@/lib/db";
import { generateInvoice } from "@/lib/lightning";
import { Event } from "@/types/event";

interface ExpiredTicket {
  id: string;
}

// Clean up expired tickets
async function cleanupExpiredTickets(eventId: string) {
  try {
    const expiredTickets = await Promise.resolve(
      db.prepare(`
        SELECT id FROM tickets 
        WHERE eventId = ? 
        AND status = 'pending' 
        AND datetime(createdAt) < datetime('now', '-1 hour')
      `).all(eventId)
    ) as ExpiredTicket[];

    if (expiredTickets.length > 0) {
      await Promise.resolve(
        db.prepare(`
          DELETE FROM tickets 
          WHERE id IN (${expiredTickets.map(() => '?').join(',')})
        `).run(...expiredTickets.map(t => t.id))
      );
    }
  } catch (error) {
    console.error("Error cleaning up expired tickets:", error);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await context.params;
    
    // Clean up expired tickets before fetching
    await cleanupExpiredTickets(eventId);

    const eventTickets = await Promise.resolve(
      db.prepare('SELECT * FROM tickets WHERE eventId = ?').all(eventId)
    );

    return Response.json(eventTickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return Response.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<Response> {
  try {
    const { eventId } = await context.params;
    const body = await request.json();
    const { quantity = 1 } = body;

    // Start a transaction
    const transaction = db.transaction(async () => {
      // Get event details (no FOR UPDATE in SQLite)
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as Event | undefined;

      if (!event) {
        throw new Error("Event not found");
      }

      // Check if enough tickets are available
      if (event.ticketsSold + quantity > event.ticketCount) {
        throw new Error("Not enough tickets available");
      }

      // Calculate total amount
      const totalAmount = event.ticketPrice * quantity;

      // Generate Lightning invoice
      const invoice = await generateInvoice(
        totalAmount,
        `${quantity} ticket(s) for ${event.title}`
      );

      // Create new tickets
      const newTickets = Array.from({ length: quantity }, () => ({
        id: Math.random().toString(36).substring(7),
        eventId,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        invoiceId: invoice.id,
        invoiceRequest: invoice.request,
        invoiceStatus: "pending" as const
      }));

      // Insert tickets
      const insertTicket = db.prepare(`
        INSERT INTO tickets (
          id, eventId, status, createdAt, 
          invoiceId, invoiceRequest, invoiceStatus
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const ticket of newTickets) {
        insertTicket.run(
          ticket.id,
          ticket.eventId,
          ticket.status,
          ticket.createdAt,
          ticket.invoiceId,
          ticket.invoiceRequest,
          ticket.invoiceStatus
        );
      }

      // Update tickets sold count
      db.prepare(`
        UPDATE events 
        SET ticketsSold = ticketsSold + ? 
        WHERE id = ?
      `).run(quantity, eventId);

      return { tickets: newTickets, invoice, event };
    });

    const result = await Promise.resolve(transaction());

    return Response.json({
      tickets: result.tickets,
      invoice: {
        request: result.invoice.request,
        amount: result.event.ticketPrice * quantity,
        description: result.invoice.description,
        expires_at: result.invoice.expires_at
      }
    });
  } catch (error) {
    console.error("Error creating tickets:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create tickets" },
      { status: error instanceof Error && error.message === "Not enough tickets available" ? 400 : 500 }
    );
  }
} 