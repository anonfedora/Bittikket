import { NextResponse } from "next/server";
import db from "@/lib/db";
import { lndClient } from "@/lib/lnd";

// Define interface for the result of a database run operation
interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const { rHash } = await request.json();

    if (!rHash) {
      return NextResponse.json({ error: "Missing rHash" }, { status: 400 });
    }

    // Check if invoice is paid using the rHash
    const invoiceStatus = await lndClient.checkInvoiceStatus(Buffer.from(rHash, "hex"));

    if (!(invoiceStatus.settled || invoiceStatus.state === "SETTLED")) {
      return NextResponse.json({ error: "Invoice not paid" }, { status: 400 });
    }

    // Find all tickets associated with this invoice rHash and update their status
    const updateResult = await db.transaction(async (tx) => {
      const result = tx.run(
        `UPDATE tickets 
         SET status = 'valid', invoiceStatus = 'paid' 
         WHERE eventId = ? AND invoiceId = ? AND invoiceStatus = 'pending'`,
        [eventId, rHash]
      );
      return result;
    }) as any;

    if (updateResult.changes === 0) {
        return NextResponse.json({ success: false, message: "No pending tickets found for this invoice or they are already paid." }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated status for ${updateResult.changes} tickets.`,
      updatedCount: updateResult.changes,
    });
  } catch (error) {
    console.error("Error confirming bulk payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm bulk payment" },
      { status: 500 }
    );
  }
} 