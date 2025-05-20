import { NextRequest } from "next/server";
import { Ticket } from "@/types/event";

// Temporary in-memory storage for tickets
// TODO: Replace with database in production
const tickets: Ticket[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketNumber: string } }
) {
  try {
    const { eventId, ticketNumber } = params;

    const ticket = tickets.find(
      (t: Ticket) => t.id === ticketNumber && t.eventId === eventId
    );

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!ticket.invoiceId) {
      return new Response(
        JSON.stringify({ error: "No invoice found for this ticket" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // TODO: Check actual payment status with your payment provider
    // For now, we'll just return the stored status
    return new Response(
      JSON.stringify({ status: ticket.invoiceStatus || "pending" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to check payment status" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 