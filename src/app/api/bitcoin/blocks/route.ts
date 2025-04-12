import { NextResponse } from "next/server";
import BitcoinCLI from "@/lib/bitcoin-cli";

const bitcoin = new BitcoinCLI();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const start = parseInt(searchParams.get("start") || "0");

    // Get the current block count
    const blockCount = await bitcoin.getBlockCount();
    
    // Calculate the range of blocks to fetch
    const startHeight = Math.max(0, blockCount - start);
    const endHeight = Math.max(0, startHeight - limit);
    
    // Fetch blocks in parallel
    const blocks = await Promise.all(
      Array.from({ length: startHeight - endHeight }, async (_, i) => {
        const height = startHeight - i;
        const hash = await bitcoin.getBlockHash(height);
        const block = await bitcoin.getBlock(hash);
        const stats = await bitcoin.getBlockStats(height);
        
        return {
          ...block,
          stats,
          height,
        };
      })
    );

    return NextResponse.json(blocks);
  } catch (error) {
    console.error("Error fetching blocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocks" },
      { status: 500 }
    );
  }
} 