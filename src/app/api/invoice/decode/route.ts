import { NextRequest } from "next/server";
import { lndClient } from "@/lib/lnd";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { paymentRequest } = await request.json();
    if (!paymentRequest) {
      return Response.json({ error: "Missing paymentRequest" }, { status: 400 });
    }

    // Use lndClient to decode the payment request
    const decoded = await lndClient.decodePayReq(paymentRequest);

    // Return decoded invoice, including payment hash (rHash) as hex
    return Response.json({
      ...decoded,
      rHash: decoded.payment_hash,
    });
  } catch (error) {
    console.error("Error decoding invoice:", error);
    return Response.json({ error: "Failed to decode invoice" }, { status: 500 });
  }
} 