import { NextResponse } from "next/server";
import { suiClient, PACKAGE_ID, ADMIN_ADDRESS } from "@/lib/sui";

interface TransactionFilter {
  type?: "all" | "mint" | "transfer" | "burn";
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  address?: string;
}

interface ParsedTransaction {
  id: string;
  type: "mint" | "transfer" | "burn";
  amount: string;
  formattedAmount: string;
  from?: string;
  to?: string;
  timestamp: number;
  txDigest: string;
  gasUsed?: string;
  status: "success" | "failed";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: TransactionFilter = {
      type: (searchParams.get("type") as any) || "all",
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      minAmount: searchParams.get("minAmount")
        ? parseFloat(searchParams.get("minAmount")!)
        : undefined,
      maxAmount: searchParams.get("maxAmount")
        ? parseFloat(searchParams.get("maxAmount")!)
        : undefined,
      address: searchParams.get("address") || undefined,
    };

    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor") || null;

    // Get transaction history from Sui
    const queryOptions: any = {
      filter: {
        MoveFunction: {
          package: PACKAGE_ID,
          module: "seeds_coin",
        },
      },
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
      limit,
    };

    if (cursor) {
      queryOptions.cursor = cursor;
    }

    const transactionHistory = await suiClient.queryTransactionBlocks(
      queryOptions
    );

    // Parse and filter transactions
    const parsedTransactions: ParsedTransaction[] = [];

    for (const tx of transactionHistory.data) {
      try {
        const parsedTx = await parseTransaction(tx);
        if (parsedTx && matchesFilters(parsedTx, filters)) {
          parsedTransactions.push(parsedTx);
        }
      } catch (error) {
        console.error("Error parsing transaction:", error);
        // Continue with next transaction
      }
    }

    // Sort by timestamp (newest first)
    parsedTransactions.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      data: {
        transactions: parsedTransactions,
        hasNextPage: transactionHistory.hasNextPage,
        nextCursor: transactionHistory.nextCursor,
        totalCount: parsedTransactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transaction history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function parseTransaction(tx: any): Promise<ParsedTransaction | null> {
  try {
    const events = tx.events || [];
    const effects = tx.effects;
    const timestamp = parseInt(tx.timestampMs || Date.now().toString());

    // Look for SEEDS-related events
    for (const event of events) {
      if (event.type?.includes("::seeds_coin::")) {
        const eventData = event.parsedJson;

        if (event.type.includes("MintEvent")) {
          return {
            id: tx.digest,
            type: "mint",
            amount: eventData.amount || "0",
            formattedAmount: formatAmount(eventData.amount || "0"),
            to: eventData.recipient,
            timestamp,
            txDigest: tx.digest,
            gasUsed: effects?.gasUsed?.computationCost || "0",
            status:
              effects?.status?.status === "success" ? "success" : "failed",
          };
        }

        if (event.type.includes("TransferEvent")) {
          return {
            id: tx.digest,
            type: "transfer",
            amount: eventData.amount || "0",
            formattedAmount: formatAmount(eventData.amount || "0"),
            from: eventData.from,
            to: eventData.to,
            timestamp,
            txDigest: tx.digest,
            gasUsed: effects?.gasUsed?.computationCost || "0",
            status:
              effects?.status?.status === "success" ? "success" : "failed",
          };
        }

        if (event.type.includes("BurnEvent")) {
          return {
            id: tx.digest,
            type: "burn",
            amount: eventData.amount || "0",
            formattedAmount: formatAmount(eventData.amount || "0"),
            from: eventData.burner,
            timestamp,
            txDigest: tx.digest,
            gasUsed: effects?.gasUsed?.computationCost || "0",
            status:
              effects?.status?.status === "success" ? "success" : "failed",
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing individual transaction:", error);
    return null;
  }
}

function formatAmount(amount: string): string {
  const num = Number(amount) / 1000000; // 6 decimals
  return num.toFixed(6);
}

function matchesFilters(
  tx: ParsedTransaction,
  filters: TransactionFilter
): boolean {
  // Type filter
  if (filters.type && filters.type !== "all" && tx.type !== filters.type) {
    return false;
  }

  // Date filters
  if (filters.fromDate) {
    const fromDate = new Date(filters.fromDate).getTime();
    if (tx.timestamp < fromDate) return false;
  }

  if (filters.toDate) {
    const toDate = new Date(filters.toDate).getTime();
    if (tx.timestamp > toDate) return false;
  }

  // Amount filters
  const amount = parseFloat(tx.formattedAmount);
  if (filters.minAmount && amount < filters.minAmount) return false;
  if (filters.maxAmount && amount > filters.maxAmount) return false;

  // Address filter
  if (filters.address) {
    const address = filters.address.toLowerCase();
    const matchesFrom = tx.from?.toLowerCase().includes(address);
    const matchesTo = tx.to?.toLowerCase().includes(address);
    if (!matchesFrom && !matchesTo) return false;
  }

  return true;
}
