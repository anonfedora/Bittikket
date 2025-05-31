import { NextResponse } from "next/server";
import db from "@/lib/db";

interface TransferResult {
  ticketNumber: string;
  status: "success" | "error";
  message: string;
  newOwnerEmail?: string;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { transfers } = await request.json();

    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
      return NextResponse.json(
        { error: "Invalid transfer data" },
        { status: 400 }
      );
    }

    // Process transfers in a transaction
    const transferResults = (await db.transaction(async (tx) => {
      const results: TransferResult[] = [];

      for (const transfer of transfers) {
        const { ticketNumber, newOwnerEmail } = transfer;

        if (!ticketNumber || !newOwnerEmail) {
          results.push({
            ticketNumber,
            status: "error",
            message: "Missing required fields",
          });
          continue;
        }

        const ticket = await tx.get(
          `SELECT * FROM tickets 
           WHERE eventId = ? AND ticketNumber = ?`,
          [eventId, ticketNumber]
        );

        if (!ticket) {
          results.push({
            ticketNumber,
            status: "error",
            message: "Ticket not found",
          });
          continue;
        }

        if (ticket.status === "used") {
          results.push({
            ticketNumber,
            status: "error",
            message: "Cannot transfer used ticket",
          });
          continue;
        }

        if (ticket.invoiceStatus !== "paid") {
          results.push({
            ticketNumber,
            status: "error",
            message: "Cannot transfer unpaid ticket",
          });
          continue;
        }

        await tx.run(
          `UPDATE tickets 
           SET ownerEmail = ?,
               transferredAt = CURRENT_TIMESTAMP 
           WHERE eventId = ? AND ticketNumber = ?`,
          [newOwnerEmail, eventId, ticketNumber]
        );

        results.push({
          ticketNumber,
          status: "success",
          message: "Transferred successfully",
          newOwnerEmail,
        });
      }

      return results;
    })) as unknown as TransferResult[];

    return NextResponse.json({
      results: transferResults,
      summary: {
        total: transfers.length,
        successful: transferResults.filter(r => r.status === "success").length,
        failed: transferResults.filter(r => r.status === "error").length,
      },
    });
  } catch (error) {
    console.error("Error processing bulk transfers:", error);
    return NextResponse.json(
      { error: "Failed to process transfers" },
      { status: 500 }
    );
  }
} 