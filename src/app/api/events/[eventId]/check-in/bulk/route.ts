import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { ticketNumbers } = await request.json();

    if (!ticketNumbers || !Array.isArray(ticketNumbers) || ticketNumbers.length === 0) {
      return NextResponse.json(
        { error: "Invalid ticket numbers" },
        { status: 400 }
      );
    }

    // Process check-ins in a transaction
    const results = (await db.transaction(async (tx) => {
      const checkInResults = [];

      for (const ticketNumber of ticketNumbers) {
        const ticket = await tx.get(
          `SELECT * FROM tickets 
           WHERE eventId = ? AND ticketNumber = ?`,
          [eventId, ticketNumber]
        );

        if (!ticket) {
          checkInResults.push({
            ticketNumber,
            status: "error",
            message: "Ticket not found",
          });
          continue;
        }

        if (ticket.status === "used") {
          checkInResults.push({
            ticketNumber,
            status: "error",
            message: "Ticket already used",
          });
          continue;
        }

        if (ticket.invoiceStatus !== "paid") {
          checkInResults.push({
            ticketNumber,
            status: "error",
            message: "Ticket not paid",
          });
          continue;
        }

        await tx.run(
          `UPDATE tickets 
           SET status = 'used', 
               checkedInAt = CURRENT_TIMESTAMP 
           WHERE eventId = ? AND ticketNumber = ?`,
          [eventId, ticketNumber]
        );

        checkInResults.push({
          ticketNumber,
          status: "success",
          message: "Checked in successfully",
        });
      }

      return checkInResults;
    })) as unknown as Array<{ ticketNumber: string; status: string; message: string }>;

    return NextResponse.json({
      results,
      summary: {
        total: ticketNumbers.length,
        successful: results.filter(r => r.status === "success").length,
        failed: results.filter(r => r.status === "error").length,
      },
    });
  } catch (error) {
    console.error("Error processing batch check-in:", error);
    return NextResponse.json(
      { error: "Failed to process check-ins" },
      { status: 500 }
    );
  }
} 