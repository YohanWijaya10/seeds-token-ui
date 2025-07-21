import { NextResponse } from "next/server";
import {
  suiClient,
  adminKeypair,
  PACKAGE_ID,
  ADMIN_ADDRESS,
  TREASURY_CAP_ID,
} from "@/lib/sui";
import { TransactionBlock } from "@mysten/sui.js/transactions";

export async function POST(request: Request) {
  try {
    if (!adminKeypair) {
      return NextResponse.json(
        { success: false, error: "Admin keypair not configured" },
        { status: 500 }
      );
    }

    const { amount, fromAddress } = await request.json();

    // Validasi input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Convert amount to proper format (6 decimals)
    const burnAmount = Math.floor(amount * 1000000);

    // Get SEEDS coins from wallet
    const coins = await suiClient.getCoins({
      owner: fromAddress || ADMIN_ADDRESS,
      coinType: `${PACKAGE_ID}::seeds_coin::SEEDS_COIN`,
    });

    if (coins.data.length === 0) {
      return NextResponse.json(
        { success: false, error: "No SEEDS coins found in wallet" },
        { status: 400 }
      );
    }

    // Calculate total available balance
    let totalBalance = BigInt(0);
    coins.data.forEach((coin) => {
      totalBalance += BigInt(coin.balance);
    });

    if (totalBalance < BigInt(burnAmount)) {
      const availableFormatted = (Number(totalBalance) / 1000000).toFixed(6);
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance to burn. Available: ${availableFormatted} SEEDS`,
        },
        { status: 400 }
      );
    }

    // Create transaction block
    const txb = new TransactionBlock();

    // Sort coins by balance (largest first) for efficient merging
    const sortedCoins = coins.data.sort((a, b) =>
      Number(BigInt(b.balance) - BigInt(a.balance))
    );

    // Use the largest coin as primary
    let primaryCoin = txb.object(sortedCoins[0].coinObjectId);
    const remainingAmount = BigInt(burnAmount);
    const primaryCoinBalance = BigInt(sortedCoins[0].balance);

    // If primary coin has enough balance, split from it
    if (primaryCoinBalance >= remainingAmount) {
      if (primaryCoinBalance > remainingAmount) {
        // Split the exact amount needed for burning
        const splitCoin = txb.splitCoins(primaryCoin, [txb.pure(burnAmount)]);
        primaryCoin = splitCoin;
      }
      // If balance equals burn amount, use the coin directly
    } else {
      // Need to merge multiple coins
      const coinsToMerge = [];
      let accumulatedBalance = primaryCoinBalance;

      // Add more coins until we have enough balance
      for (
        let i = 1;
        i < sortedCoins.length && accumulatedBalance < remainingAmount;
        i++
      ) {
        coinsToMerge.push(txb.object(sortedCoins[i].coinObjectId));
        accumulatedBalance += BigInt(sortedCoins[i].balance);
      }

      if (accumulatedBalance < remainingAmount) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient total balance after coin merging",
          },
          { status: 400 }
        );
      }

      // Merge coins if needed
      if (coinsToMerge.length > 0) {
        txb.mergeCoins(primaryCoin, coinsToMerge);
      }

      // Split the exact amount if we have more than needed
      if (accumulatedBalance > remainingAmount) {
        const splitCoin = txb.splitCoins(primaryCoin, [txb.pure(burnAmount)]);
        primaryCoin = splitCoin;
      }
    }

    // Burn the coin using secure_burn function
    txb.moveCall({
      target: `${PACKAGE_ID}::seeds_coin::burn_coin`,
      arguments: [txb.object(TREASURY_CAP_ID), primaryCoin],
    });

    // Execute transaction
    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: adminKeypair,
      transactionBlock: txb,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    if (result.effects?.status?.status === "success") {
      return NextResponse.json({
        success: true,
        data: {
          transactionDigest: result.digest,
          amount: burnAmount,
          formattedAmount: amount,
          from: fromAddress || ADMIN_ADDRESS,
          gasUsed: result.effects.gasUsed,
          events: result.events,
        },
      });
    } else {
      throw new Error("Burn transaction failed");
    }
  } catch (error) {
    console.error("Error burning tokens:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to burn tokens",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
