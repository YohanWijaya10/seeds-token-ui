import { NextResponse } from "next/server";
import { suiClient, ADMIN_ADDRESS, PACKAGE_ID } from "@/lib/sui";

export async function GET() {
  try {
    // Get all SEEDS coins owned by admin
    const coins = await suiClient.getCoins({
      owner: ADMIN_ADDRESS,
      coinType: `${PACKAGE_ID}::seeds_coin::SEEDS_COIN`,
    });

    // Calculate total balance
    let totalBalance = BigInt(0);
    coins.data.forEach((coin) => {
      totalBalance += BigInt(coin.balance);
    });

    // Format balance (6 decimals)
    const decimals = 6;
    const formattedBalance = (
      Number(totalBalance) / Math.pow(10, decimals)
    ).toFixed(6);

    return NextResponse.json({
      success: true,
      data: {
        balance: totalBalance.toString(),
        formattedBalance,
        decimals,
        coinCount: coins.data.length,
        coins: coins.data,
      },
    });
  } catch (error) {
    console.error("Error fetching SEEDS balance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
