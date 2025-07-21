import { NextResponse } from "next/server";
import {
  suiClient,
  PACKAGE_ID,
  ADMIN_ADDRESS,
  CONFIG_ID,
  TREASURY_CAP_ID,
} from "@/lib/sui";

interface AnalyticsData {
  supplyStats: {
    totalSupply: string;
    maxSupply: string;
    circulatingSupply: string;
    burnedTokens: string;
    supplyUtilization: number;
  };
  distributionStats: {
    holders: Array<{
      address: string;
      balance: string;
      percentage: number;
      label: string;
    }>;
    totalHolders: number;
  };
  transactionStats: {
    totalMints: number;
    totalTransfers: number;
    totalBurns: number;
    totalVolume: string;
  };
}

export async function GET() {
  try {
    // Get analytics data in parallel
    const [supplyData, distributionData, transactionData] = await Promise.all([
      getSupplyAnalytics(),
      getDistributionAnalytics(),
      getTransactionAnalytics(),
    ]);

    const analytics: AnalyticsData = {
      supplyStats: supplyData,
      distributionStats: distributionData,
      transactionStats: transactionData,
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function getSupplyAnalytics() {
  try {
    // Get config data for max supply and current supply tracking
    const configObject = await suiClient.getObject({
      id: CONFIG_ID,
      options: { showContent: true },
    });

    // Get treasury cap for total supply
    const treasuryObject = await suiClient.getObject({
      id: TREASURY_CAP_ID,
      options: { showContent: true },
    });

    // Parse config data
    const configContent = configObject.data?.content as any;
    const maxSupply = configContent?.fields?.max_supply || "5000000000000000"; // Default 5B
    const currentSupply = configContent?.fields?.current_supply || "0";

    // Get all SEEDS coins to calculate circulating supply
    const allCoins = await suiClient.getAllCoins({
      coinType: `${PACKAGE_ID}::seeds_coin::SEEDS_COIN`,
    });

    let circulatingSupply = BigInt(0);
    allCoins.data.forEach((coin) => {
      circulatingSupply += BigInt(coin.balance);
    });

    // Calculate burned tokens (minted - circulating)
    const totalMinted = BigInt(currentSupply);
    const burnedTokens = totalMinted - circulatingSupply;

    // Calculate supply utilization percentage
    const supplyUtilization = (Number(totalMinted) / Number(maxSupply)) * 100;

    return {
      totalSupply: formatTokenAmount(currentSupply),
      maxSupply: formatTokenAmount(maxSupply),
      circulatingSupply: formatTokenAmount(circulatingSupply.toString()),
      burnedTokens: formatTokenAmount(burnedTokens.toString()),
      supplyUtilization: Math.round(supplyUtilization * 100) / 100,
    };
  } catch (error) {
    console.error("Error in getSupplyAnalytics:", error);
    return {
      totalSupply: "0",
      maxSupply: "5000000000",
      circulatingSupply: "0",
      burnedTokens: "0",
      supplyUtilization: 0,
    };
  }
}

async function getDistributionAnalytics() {
  try {
    // Get all SEEDS coins
    const allCoins = await suiClient.getAllCoins({
      coinType: `${PACKAGE_ID}::seeds_coin::SEEDS_COIN`,
    });

    // Group by owner address
    const balancesByAddress: { [key: string]: bigint } = {};

    allCoins.data.forEach((coin) => {
      const owner = coin.owner;
      if (typeof owner === "object" && "AddressOwner" in owner) {
        const address = owner.AddressOwner;
        balancesByAddress[address] =
          (balancesByAddress[address] || BigInt(0)) + BigInt(coin.balance);
      }
    });

    // Convert to array and sort by balance
    const holders = Object.entries(balancesByAddress)
      .map(([address, balance]) => ({
        address,
        balance: balance.toString(),
        formattedBalance: formatTokenAmount(balance.toString()),
      }))
      .sort((a, b) => Number(BigInt(b.balance) - BigInt(a.balance)));

    // Calculate total supply for percentage calculation
    const totalSupply = holders.reduce(
      (sum, holder) => sum + BigInt(holder.balance),
      BigInt(0)
    );

    // Add percentages and labels
    const holdersWithStats = holders.map((holder, index) => {
      const percentage =
        totalSupply > 0
          ? (Number(BigInt(holder.balance)) / Number(totalSupply)) * 100
          : 0;
      let label = "Other";

      if (holder.address === ADMIN_ADDRESS) {
        label = "Admin Wallet";
      } else if (index === 0 && holder.address !== ADMIN_ADDRESS) {
        label = "Top Holder";
      } else if (index < 5) {
        label = `Holder #${index + 1}`;
      }

      return {
        address: holder.address,
        balance: holder.formattedBalance,
        percentage: Math.round(percentage * 100) / 100,
        label,
      };
    });

    return {
      holders: holdersWithStats.slice(0, 10), // Top 10 holders
      totalHolders: holders.length,
    };
  } catch (error) {
    console.error("Error in getDistributionAnalytics:", error);
    return {
      holders: [],
      totalHolders: 0,
    };
  }
}

async function getTransactionAnalytics() {
  try {
    // Get transaction history
    const transactionHistory = await suiClient.queryTransactionBlocks({
      filter: {
        MoveFunction: {
          package: PACKAGE_ID,
          module: "seeds_coin",
        },
      },
      options: {
        showEvents: true,
      },
      limit: 100, // Get recent transactions for stats
    });

    let totalMints = 0;
    let totalTransfers = 0;
    let totalBurns = 0;
    let totalVolume = BigInt(0);

    for (const tx of transactionHistory.data) {
      const events = tx.events || [];

      for (const event of events) {
        if (event.type?.includes("::seeds_coin::")) {
          const eventData = event.parsedJson as any;
          const amount = BigInt(eventData.amount || "0");

          if (event.type.includes("MintEvent")) {
            totalMints++;
            totalVolume += amount;
          } else if (event.type.includes("TransferEvent")) {
            totalTransfers++;
            totalVolume += amount;
          } else if (event.type.includes("BurnEvent")) {
            totalBurns++;
            totalVolume += amount;
          }
        }
      }
    }

    return {
      totalMints,
      totalTransfers,
      totalBurns,
      totalVolume: formatTokenAmount(totalVolume.toString()),
    };
  } catch (error) {
    console.error("Error in getTransactionAnalytics:", error);
    return {
      totalMints: 0,
      totalTransfers: 0,
      totalBurns: 0,
      totalVolume: "0",
    };
  }
}

function formatTokenAmount(amount: string): string {
  const num = Number(amount) / 1000000; // 6 decimals
  return num.toFixed(6);
}
