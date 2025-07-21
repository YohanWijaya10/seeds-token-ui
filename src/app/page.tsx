"use client";

import { useState } from "react";
import SeedsTokenBalance from "@/components/SeedsTokenBalance";
import SeedsMintForm from "@/components/SeedsMintForm";
import SeedsTransferForm from "@/components/SeedsTransferForm";
import SeedsBurnForm from "@/components/SeedsBurnForm";
import SeedsTransactionHistory from "@/components/SeedsTransactionHistory";
import SeedsAnalyticsDashboard from "@/components/SeedsAnalyticsDashboard";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentBalance, setCurrentBalance] = useState<string>("0");
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "history"
  >("overview");

  const handleTransactionSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBalanceUpdate = (balance: string) => {
    setCurrentBalance(balance);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SEEDS Token Dashboard
          </h1>
          <p className="text-gray-600">
            Complete token management and analytics platform
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "analytics"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📋 History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Action Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              <SeedsTokenBalance
                key={refreshTrigger}
                onBalanceUpdate={handleBalanceUpdate}
              />
              <SeedsMintForm onMintSuccess={handleTransactionSuccess} />
              <SeedsTransferForm
                onTransferSuccess={handleTransactionSuccess}
                currentBalance={currentBalance}
              />
              <SeedsBurnForm
                onBurnSuccess={handleTransactionSuccess}
                currentBalance={currentBalance}
              />
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <SeedsAnalyticsDashboard key={refreshTrigger} />
        )}

        {activeTab === "history" && (
          <SeedsTransactionHistory key={refreshTrigger} />
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Connected to Sui Devnet</p>
          <p className="mt-1">
            Complete Token Management: Overview • Analytics • History
          </p>
        </div>
      </div>
    </main>
  );
}
