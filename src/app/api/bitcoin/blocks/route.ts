import { NextResponse } from "next/server";
import { bitcoin } from "@/lib/bitcoin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const startHeight = parseInt(searchParams.get("startHeight") || "0");

    // Get current blockchain height
    const blockCount = await bitcoin.getBlockCount();
    const startBlock = startHeight || blockCount;

    // Fetch blocks
    const blocks = [];
    for (let height = startBlock; height > Math.max(0, startBlock - limit); height--) {
      const hash = await bitcoin.getBlockHash(height);
      const block = await bitcoin.getBlock(hash, 2); // verbosity 2 for full transaction data
      blocks.push(block);
    }

    return NextResponse.json({
      status: "success",
      data: blocks,
    });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch blocks",
      },
      { status: 500 }
    );
  }
} 