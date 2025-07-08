import { NextResponse } from "next/server";
import { adminKeypair, ADMIN_ADDRESS } from "@/lib/sui";

export async function GET() {
  try {
    const hasKeypair = adminKeypair !== null;
    let keypairAddress = null;

    if (adminKeypair) {
      keypairAddress = adminKeypair.getPublicKey().toSuiAddress();
    }

    return NextResponse.json({
      success: true,
      data: {
        hasKeypair,
        configuredAddress: ADMIN_ADDRESS,
        keypairAddress,
        addressMatch: keypairAddress === ADMIN_ADDRESS,
        privateKeyFormat:
          process.env.ADMIN_PRIVATE_KEY?.substring(0, 15) + "...",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get admin info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
