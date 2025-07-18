"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MintResponse {
  success: boolean;
  data?: {
    transactionDigest: string;
    amount: number;
    formattedAmount: number;
    recipient: string;
  };
  error?: string;
  details?: string;
}

interface SeedsMintFormProps {
  onMintSuccess?: () => void;
}

export default function SeedsMintForm({ onMintSuccess }: SeedsMintFormProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MintResponse | null>(null);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !recipient) {
      setResult({
        success: false,
        error: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/seeds-mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          recipient: recipient.trim(),
        }),
      });

      const data: MintResponse = await response.json();
      setResult(data);

      if (data.success) {
        // Clear form on success
        setAmount("");
        setRecipient("");
        // Trigger balance refresh
        if (onMintSuccess) {
          onMintSuccess();
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

  const fillAdminAddress = () => {
    setRecipient(process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          Mint SEEDS Token
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleMint} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount (SEEDS)
            </label>
            <input
              type="number"
              id="amount"
              step="0.000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount to mint"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="recipient"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Recipient Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={fillAdminAddress}
                className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Self
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || !recipient}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Minting...
              </span>
            ) : (
              "Mint Tokens"
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
                <p className="text-green-800 font-medium">Mint Successful!</p>
                <div className="text-sm text-green-700 mt-2 space-y-1">
                  <p>Amount: {result.data?.formattedAmount} SEEDS</p>
                  <p>Recipient: {result.data?.recipient.slice(0, 10)}...</p>
                  <p>TX: {result.data?.transactionDigest.slice(0, 10)}...</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-800 font-medium">Mint Failed</p>
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
                {result.details && (
                  <p className="text-xs text-red-600 mt-1">{result.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>⚠️ This will mint tokens directly to the specified address</p>
          <p>💡 Use Self button to mint to admin wallet</p>
        </div>
      </CardContent>
    </Card>
  );
}
