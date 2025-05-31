import { NextResponse } from "next/server";
import db from "@/lib/db";
import { nanoid } from "nanoid";
import { generateInvoice } from "@/lib/lightning";

interface Event {
  id: string;
  name: string;
  registrationAmount: number;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { quantity, category, seatNumbers } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    // Get event details
    const event = await db.prepare(
      "SELECT * FROM events WHERE id = ?"
    ).get(eventId) as Event | undefined;

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = event.registrationAmount * quantity;

    // Create Lightning invoice
    const invoice = await generateInvoice(
      totalAmount,
      `${quantity} tickets for ${event.name}`
    );

    if (!invoice) {
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }

    // Create tickets in a transaction
    const tickets = await db.transaction(async (tx) => {
      const newTickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = nanoid(6);
        const seatNumber = seatNumbers?.[i] || null;
        
        await tx.run(
          `INSERT INTO tickets (
            eventId,
            ticketNumber,
            status,
            invoiceId,
            invoiceStatus,
            category,
            seatNumber
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            eventId,
            ticketNumber,
            "pending",
            invoice.id,
            "pending",
            category || null,
            seatNumber
          ]
        );

        newTickets.push({
          ticketNumber,
          seatNumber,
          category,
        });
      }
      return newTickets;
    });

    return NextResponse.json({
      tickets,
      invoice: invoice.request,
      totalAmount,
    });
  } catch (error) {
    console.error("Error creating bulk tickets:", error);
    return NextResponse.json(
      { error: "Failed to create tickets" },
      { status: 500 }
    );
  }
} 