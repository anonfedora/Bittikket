import { NextResponse } from "next/server";
import { bitcoin } from "@/lib/bitcoin";

export async function GET(
  request: Request,
  props: { params: Promise<{ txid: string }> }
) {
  const params = await props.params;
  try {
    const txid = params.txid;
    const tx = await bitcoin.getRawTransaction(txid, true);

    return NextResponse.json({
      status: "success",
      data: tx,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch transaction details",
      },
      { status: 500 }
    );
  }
}
