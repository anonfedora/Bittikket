import { NextResponse } from "next/server";
import { bitcoin } from "@/lib/bitcoin";

export async function GET() {
  try {
    const [networkInfo, walletInfo] = await Promise.all([
      bitcoin.getNetworkInfo(),
      bitcoin.getWalletInfo(),
    ]);

    return NextResponse.json({
      status: "success",
      data: {
        network: {
          version: networkInfo.version,
          subversion: networkInfo.subversion,
          connections: networkInfo.connections,
          networkActive: networkInfo.networkactive,
          networks: networkInfo.networks,
          warnings: networkInfo.warnings,
        },
        wallet: {
          balance: walletInfo.balance,
          unconfirmedBalance: walletInfo.unconfirmed_balance,
          immatureBalance: walletInfo.immature_balance,
          txCount: walletInfo.txcount,
          walletName: walletInfo.walletname,
          walletVersion: walletInfo.walletversion,
          privateKeysEnabled: walletInfo.private_keys_enabled,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching Bitcoin info:", error);
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch Bitcoin info",
      },
      { status: 500 }
    );
  }
}
