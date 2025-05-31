import { NextRequest } from "next/server";
import { lndClient } from "@/lib/lnd";

export async function GET(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = lndClient.subscribeToInvoices((invoice) => {
        const data = {
          paymentRequest: invoice.payment_request,
          amount: Number(invoice.value || 0),
          memo: "",
          expiry: 3600,
          rHash: invoice.r_hash.toString('hex'),
          paymentAddr: invoice.payment_addr.toString('hex'),
          isPaid: invoice.state === "SETTLED" || invoice.settled === true,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      });

      // Clean up subscription when the client disconnects
      request.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 