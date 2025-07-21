// src/components/SeedsTransferForm.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface TransferResponse {
  success: boolean;
  data?: {
    transactionDigest: string;
    amount: number;
    formattedAmount: number;
    recipient: string;
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

interface SeedsTransferFormProps {
  onTransferSuccess?: () => void;
  currentBalance?: string;
}

export default function SeedsTransferForm({
  onTransferSuccess,
  currentBalance,
}: SeedsTransferFormProps) {
  console.log("💸 Transfer form received currentBalance:", currentBalance); // Debug log

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);

  // Calculate max transferable amount (leave some for gas)
  const maxAmount = currentBalance
    ? (parseFloat(currentBalance) * 0.95).toFixed(6)
    : "0";
  const availableBalance = currentBalance
    ? parseFloat(currentBalance).toFixed(6)
    : "0";

  console.log("💸 Calculated availableBalance:", availableBalance); // Debug log

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !recipient) {
      setResult({
        success: false,
        error: "Please fill in all fields",
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

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/seeds-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          recipient: recipient.trim(),
        }),
      });

      const data: TransferResponse = await response.json();
      setResult(data);

      if (data.success) {
        // Clear form on success
        setAmount("");
        setRecipient("");
        // Trigger balance refresh
        if (onTransferSuccess) {
          onTransferSuccess();
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

  const setMaxAmount = () => {
    setAmount(maxAmount);
  };

  const setHalfAmount = () => {
    const half = currentBalance
      ? (parseFloat(currentBalance) / 2).toFixed(6)
      : "0";
    setAmount(half);
  };

  const validateAddress = (address: string): boolean => {
    return address.startsWith("0x") && address.length === 66;
  };

  const isValidRecipient = recipient ? validateAddress(recipient.trim()) : true;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          Transfer SEEDS Token
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Balance Info */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">Available Balance</p>
          <p className="text-lg font-semibold text-green-800">
            {availableBalance} SEEDS
          </p>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label
              htmlFor="transfer-amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount (SEEDS)
            </label>
            <div className="relative">
              <input
                type="number"
                id="transfer-amount"
                step="0.000001"
                min="0"
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter amount to transfer"
                disabled={loading}
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={setHalfAmount}
                  className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                  disabled={loading || !currentBalance}
                >
                  Half
                </button>
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
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

          <div>
            <label
              htmlFor="transfer-recipient"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Recipient Address
            </label>
            <input
              type="text"
              id="transfer-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                recipient && !isValidRecipient
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
              placeholder="0x..."
              disabled={loading}
            />
            {recipient && !isValidRecipient && (
              <p className="text-red-500 text-xs mt-1">
                Invalid Sui address format
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !amount ||
              !recipient ||
              !isValidRecipient ||
              (currentBalance &&
                parseFloat(amount) > parseFloat(currentBalance))
            }
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Transferring...
              </span>
            ) : (
              "Transfer Tokens"
            )}
          </button>
        </form>

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
                  ✅ Transfer Successful!
                </p>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <p>Amount: {result.data?.formattedAmount} SEEDS</p>
                  <p>
                    To: {result.data?.recipient.slice(0, 10)}...
                    {result.data?.recipient.slice(-6)}
                  </p>
                  <p>TX: {result.data?.transactionDigest.slice(0, 10)}...</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-800 font-medium">❌ Transfer Failed</p>
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
                {result.details && (
                  <p className="text-xs text-red-600 mt-1">{result.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>⚠️ Double-check the recipient address before transferring</p>
          <p>💡 Transfers are irreversible on the blockchain</p>
          <p>⛽ Small amount is reserved for gas fees</p>
        </div>
      </CardContent>
    </Card>
  );
}
