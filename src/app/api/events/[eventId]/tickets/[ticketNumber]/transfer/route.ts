import { NextRequest } from "next/server";
import { Ticket } from "@/types/event";

// Temporary in-memory storage for tickets
// TODO: Replace with database in production
const tickets: Ticket[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string; ticketNumber: string } }
) {
  try {
    const { eventId, ticketNumber } = params;
    const { newOwnerAddress } = await request.json();

    if (!newOwnerAddress) {
      return new Response(
        JSON.stringify({ error: "New owner address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const ticket = tickets.find(
      (t: Ticket) => t.id === ticketNumber && t.eventId === eventId
    );

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update ticket owner
    ticket.ownerAddress = newOwnerAddress;
    ticket.transferHistory.push({
      from: ticket.ownerAddress,
      to: newOwnerAddress,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify(ticket), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to transfer ticket" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 