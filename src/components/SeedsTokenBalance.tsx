// src/components/SeedsTokenBalance.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SeedsTokenBalance as SeedsTokenBalanceType } from "@/types/seeds";

interface ApiResponse {
  success: boolean;
  data?: {
    balance: string;
    formattedBalance: string;
    decimals: number;
    coinCount: number;
  };
  error?: string;
}

interface SeedsTokenBalanceProps {
  onBalanceUpdate?: (balance: string) => void;
}

export default function SeedsTokenBalance({
  onBalanceUpdate,
}: SeedsTokenBalanceProps) {
  const [balance, setBalance] = useState<SeedsTokenBalanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🌱 Fetching balance..."); // Debug log

      const response = await fetch("/api/seeds-balance");
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        console.log("🌱 Balance fetched:", data.data.formattedBalance); // Debug log

        setBalance({
          balance: data.data.balance,
          formattedBalance: data.data.formattedBalance,
          decimals: data.data.decimals,
        });
        setLastUpdated(new Date());

        // Notify parent component about balance update
        if (onBalanceUpdate) {
          console.log(
            "🔄 Calling onBalanceUpdate with:",
            data.data.formattedBalance
          ); // Debug log
          onBalanceUpdate(data.data.formattedBalance);
        } else {
          console.log("❌ onBalanceUpdate is undefined!"); // Debug log
        }
      } else {
        throw new Error(data.error || "Failed to fetch balance");
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !balance) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>SEEDS Token Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchBalance}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          SEEDS Token Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Admin Wallet Balance</p>
            <p className="text-3xl font-bold text-green-600">
              {balance?.formattedBalance} SEEDS
            </p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Raw Balance: {balance?.balance}</p>
            <p>Decimals: {balance?.decimals}</p>
            {lastUpdated && (
              <p>Last Updated: {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>

          <button
            onClick={fetchBalance}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
