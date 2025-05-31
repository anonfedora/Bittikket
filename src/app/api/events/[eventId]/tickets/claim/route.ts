import { NextRequest } from "next/server";
import db from "@/lib/db";
import { lndClient } from "@/lib/lnd";
import { Event } from "@/types/event";

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }): Promise<Response> {
  try {
    const { eventId } = await context.params;
    const { rHash } = await request.json();
    if (!rHash) {
      return Response.json({ error: "Missing rHash" }, { status: 400 });
    }

    // Check if invoice is paid
    const invoice = await lndClient.checkInvoiceStatus(Buffer.from(rHash, "hex"));
    if (!(invoice.settled || invoice.state === "SETTLED")) {
      console.error("Invoice not paid", { rHash, invoice });
      return Response.json({ error: "Invoice not paid" }, { status: 400 });
    }

    // Check if ticket already exists for this invoice
    const existing = db.prepare('SELECT * FROM tickets WHERE invoiceId = ? AND eventId = ?').get(rHash, eventId);
    if (existing) {
      return Response.json(existing);
    }

    // Get event details
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as Event | undefined;
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.ticketsSold >= event.ticketCount) {
      return Response.json({ error: "No tickets available" }, { status: 400 });
    }

    // Create ticket (status should be 'valid' for new tickets)
    const ticket = {
      id: Math.random().toString(36).substring(7),
      eventId,
      status: "valid",
      createdAt: new Date().toISOString(),
      invoiceId: rHash,
      invoiceRequest: null,
      invoiceStatus: "paid"
    };
    db.prepare(`
      INSERT INTO tickets (id, eventId, status, createdAt, invoiceId, invoiceRequest, invoiceStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(ticket.id, ticket.eventId, ticket.status, ticket.createdAt, ticket.invoiceId, ticket.invoiceRequest, ticket.invoiceStatus);
    db.prepare('UPDATE events SET ticketsSold = ticketsSold + 1 WHERE id = ?').run(eventId);

    return Response.json(ticket);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error claiming ticket:", error, error.stack);
      return Response.json({ error: error.message }, { status: 500 });
    } else {
      console.error("Error claiming ticket:", error);
      return Response.json({ error: "Failed to claim ticket" }, { status: 500 });
    }
  }
} 