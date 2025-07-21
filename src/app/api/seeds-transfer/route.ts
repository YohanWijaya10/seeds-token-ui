//
import { NextResponse } from "next/server";
import { suiClient, adminKeypair, PACKAGE_ID, ADMIN_ADDRESS } from "@/lib/sui";
import { TransactionBlock } from "@mysten/sui.js/transactions";

export async function POST(request: Request) {
  try {
    if (!adminKeypair) {
      return NextResponse.json(
        { success: false, error: "Admin keypair not configured" },
        { status: 500 }
      );
    }

    const { amount, recipient, fromAddress } = await request.json();

    // Validasi input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient address is required" },
        { status: 400 }
      );
    }

    if (recipient === (fromAddress || ADMIN_ADDRESS)) {
      return NextResponse.json(
        { success: false, error: "Cannot transfer to the same address" },
        { status: 400 }
      );
    }

    // Convert amount to proper format (6 decimals)
    const transferAmount = Math.floor(amount * 1000000);

    // Get SEEDS coins from admin wallet
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

    if (totalBalance < BigInt(transferAmount)) {
      const availableFormatted = (Number(totalBalance) / 1000000).toFixed(6);
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ${availableFormatted} SEEDS`,
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
    const remainingAmount = BigInt(transferAmount);
    const primaryCoinBalance = BigInt(sortedCoins[0].balance);

    // If primary coin has enough balance, split from it
    if (primaryCoinBalance >= remainingAmount) {
      if (primaryCoinBalance > remainingAmount) {
        // Split the exact amount needed
        const splitCoin = txb.splitCoins(primaryCoin, [
          txb.pure(transferAmount),
        ]);
        primaryCoin = splitCoin;
      }
      // If balance equals transfer amount, use the coin directly
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
        const splitCoin = txb.splitCoins(primaryCoin, [
          txb.pure(transferAmount),
        ]);
        primaryCoin = splitCoin;
      }
    }

    // Transfer the coin to recipient
    txb.transferObjects([primaryCoin], txb.pure(recipient));

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
          amount: transferAmount,
          formattedAmount: amount,
          recipient,
          from: fromAddress || ADMIN_ADDRESS,
          gasUsed: result.effects.gasUsed,
          objectChanges: result.objectChanges,
        },
      });
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error("Error transferring tokens:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to transfer tokens",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
