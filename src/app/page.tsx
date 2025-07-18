"use client";

import { useState } from "react";
import SeedsTokenBalance from "@/components/SeedsTokenBalance";
import SeedsMintForm from "@/components/SeedsMintForm";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMintSuccess = () => {
    // Trigger balance refresh when mint succeeds
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SEEDS Token Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage your SEEDS tokens on Sui Devnet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Balance Card */}
          <div>
            <SeedsTokenBalance key={refreshTrigger} />
          </div>

          {/* Mint Card */}
          <div>
            <SeedsMintForm onMintSuccess={handleMintSuccess} />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Connected to Sui Devnet</p>
          <p className="mt-1">
            Package ID: {process.env.NEXT_PUBLIC_PACKAGE_ID?.slice(0, 20)}...
          </p>
        </div>
      </div>
    </main>
  );
}
