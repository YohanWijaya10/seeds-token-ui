"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface BurnResponse {
  success: boolean;
  data?: {
    transactionDigest: string;
    amount: number;
    formattedAmount: number;
    from: string;
    gasUsed?: {
      computationCost: string;
      storageCost: string;
      storageRebate: string;
      nonRefundableStorageFee: string;
    };
  };
  error?: string;
  details?: string;
}

interface SeedsBurnFormProps {
  onBurnSuccess?: () => void;
  currentBalance?: string;
}

export default function SeedsBurnForm({
  onBurnSuccess,
  currentBalance,
}: SeedsBurnFormProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BurnResponse | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate max burnable amount (leave some for gas)
  const maxAmount = currentBalance
    ? (parseFloat(currentBalance) * 0.95).toFixed(6)
    : "0";
  const availableBalance = currentBalance
    ? parseFloat(currentBalance).toFixed(6)
    : "0";

  const handleBurnRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount) {
      setResult({
        success: false,
        error: "Please enter amount to burn",
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      setResult({
        success: false,
        error: "Amount must be greater than 0",
      });
      return;
    }

    if (currentBalance && parseFloat(amount) > parseFloat(currentBalance)) {
      setResult({
        success: false,
        error: `Amount exceeds available balance (${availableBalance} SEEDS)`,
      });
      return;
    }

    // Show confirmation dialog instead of burning immediately
    setShowConfirmation(true);
    setResult(null);
  };

  const confirmBurn = async () => {
    setLoading(true);
    setShowConfirmation(false);
    setResult(null);

    try {
      const response = await fetch("/api/seeds-burn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
        }),
      });

      const data: BurnResponse = await response.json();
      setResult(data);

      if (data.success) {
        // Clear form on success
        setAmount("");
        // Trigger balance refresh
        if (onBurnSuccess) {
          onBurnSuccess();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({
        success: false,
        error: "Network error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelBurn = () => {
    setShowConfirmation(false);
  };

  const setMaxAmount = () => {
    setAmount(maxAmount);
  };

  const setHalfAmount = () => {
    const half = currentBalance
      ? (parseFloat(currentBalance) / 2).toFixed(6)
      : "0";
    setAmount(half);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Burn SEEDS Token
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Balance Info */}
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">Available Balance</p>
          <p className="text-lg font-semibold text-red-800">
            {availableBalance} SEEDS
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">⚠️</span>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">
                Permanent Action Warning
              </p>
              <p className="text-yellow-700 mt-1">
                Burning tokens will permanently destroy them and reduce total
                supply. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleBurnRequest} className="space-y-4">
          <div>
            <label
              htmlFor="burn-amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount to Burn (SEEDS)
            </label>
            <div className="relative">
              <input
                type="number"
                id="burn-amount"
                step="0.000001"
                min="0"
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter amount to burn"
                disabled={loading}
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={setHalfAmount}
                  className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                  disabled={loading || !currentBalance}
                >
                  Half
                </button>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                  disabled={loading || !currentBalance}
                >
                  Max
                </button>
              </div>
            </div>
            {amount &&
              currentBalance &&
              parseFloat(amount) > parseFloat(currentBalance) && (
                <p className="text-red-500 text-xs mt-1">
                  Amount exceeds available balance
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !amount ||
              (currentBalance &&
                parseFloat(amount) > parseFloat(currentBalance))
            }
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Burning...
              </span>
            ) : (
              "Burn Tokens"
            )}
          </button>
        </form>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔥 Confirm Token Burn
              </h3>
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-700">
                  You are about to permanently burn:
                </p>
                <p className="text-xl font-bold text-red-600">{amount} SEEDS</p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ This action is irreversible!</strong>
                  </p>
                  <ul className="text-xs text-red-700 mt-2 space-y-1">
                    <li>• Tokens will be permanently destroyed</li>
                    <li>• Total supply will be reduced</li>
                    <li>• This cannot be undone</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelBurn}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBurn}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  Yes, Burn Tokens
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div
            className={`mt-4 p-3 rounded-md ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <div>
                <p className="text-green-800 font-medium">
                  ✅ Burn Successful!
                </p>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <p>Burned: {result.data?.formattedAmount} SEEDS</p>
                  <p>TX: {result.data?.transactionDigest.slice(0, 10)}...</p>
                  <p className="font-medium">🔥 Tokens permanently destroyed</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-800 font-medium">❌ Burn Failed</p>
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
                {result.details && (
                  <p className="text-xs text-red-600 mt-1">{result.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>🔥 Burning reduces total token supply</p>
          <p>⛽ Small amount is reserved for gas fees</p>
          <p>💡 Consider implications before burning large amounts</p>
        </div>
      </CardContent>
    </Card>
  );
}
