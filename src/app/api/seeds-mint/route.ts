import { NextResponse } from "next/server";
import {
  suiClient,
  adminKeypair,
  PACKAGE_ID,
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

    const { amount, recipient } = await request.json();

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

    // Convert amount to proper format (6 decimals)
    const mintAmount = Math.floor(amount * 1000000); // Convert to smallest unit

    // Create transaction block
    const txb = new TransactionBlock();

    // Call mint function
    txb.moveCall({
      target: `${PACKAGE_ID}::seeds_coin::mint`,
      arguments: [
        txb.object(TREASURY_CAP_ID),
        txb.pure(mintAmount),
        txb.pure(recipient),
      ],
    });

    // Execute transaction
    const result = await suiClient.signAndExecuteTransactionBlock({
      signer: adminKeypair,
      transactionBlock: txb,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    if (result.effects?.status?.status === "success") {
      return NextResponse.json({
        success: true,
        data: {
          transactionDigest: result.digest,
          amount: mintAmount,
          formattedAmount: amount,
          recipient,
        },
      });
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error("Error minting tokens:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mint tokens",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
