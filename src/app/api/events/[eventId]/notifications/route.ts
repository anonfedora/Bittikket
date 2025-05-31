import { NextResponse } from "next/server";
import db from "@/lib/db";

interface NotificationRequest {
  subject: string;
  message: string;
  filters?: {
    status?: string;
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const body = await request.json() as NotificationRequest;
    const { subject, message, filters } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Build query conditions
    let query = "SELECT * FROM tickets WHERE eventId = ?";
    const params = [eventId];

    if (filters?.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    // Get tickets matching the filters
    const matchingTickets = db.prepare(query).all(...params);

    // TODO: Implement actual email sending logic here
    // For now, we'll just simulate sending emails
    const results = {
      summary: {
        total: matchingTickets.length,
        successful: matchingTickets.length,
        failed: 0,
      },
      details: matchingTickets.map((ticket: any) => ({
        ticketNumber: ticket.id,
        status: "sent",
      })),
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
} 