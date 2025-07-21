"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Transaction {
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

interface TransactionHistoryResponse {
  success: boolean;
  data?: {
    transactions: Transaction[];
    hasNextPage: boolean;
    nextCursor: string | null;
    totalCount: number;
  };
  error?: string;
}

interface Filters {
  type: "all" | "mint" | "transfer" | "burn";
  fromDate: string;
  toDate: string;
  minAmount: string;
  maxAmount: string;
  address: string;
}

export default function SeedsTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    type: "all",
    fromDate: "",
    toDate: "",
    minAmount: "",
    maxAmount: "",
    address: "",
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.type !== "all") params.append("type", filters.type);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.minAmount) params.append("minAmount", filters.minAmount);
      if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);
      if (filters.address) params.append("address", filters.address);

      const response = await fetch(
        `/api/seeds-transactions?${params.toString()}`
      );
      const data: TransactionHistoryResponse = await response.json();

      if (data.success && data.data) {
        setTransactions(data.data.transactions);
      } else {
        throw new Error(data.error || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchTransactions();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
      address: "",
    });
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;

    const headers = [
      "Date",
      "Type",
      "Amount",
      "From",
      "To",
      "Transaction Hash",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...transactions.map((tx) =>
        [
          new Date(tx.timestamp).toLocaleString(),
          tx.type.toUpperCase(),
          tx.formattedAmount,
          tx.from || "",
          tx.to || "",
          tx.txDigest,
          tx.status.toUpperCase(),
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seeds-transactions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mint":
        return "⚡";
      case "transfer":
        return "💸";
      case "burn":
        return "🔥";
      default:
        return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mint":
        return "text-green-600 bg-green-50";
      case "transfer":
        return "text-blue-600 bg-blue-50";
      case "burn":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading && transactions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Transaction History
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors text-sm font-medium"
            >
              🔍 Filter
            </button>
            <button
              onClick={exportToCSV}
              disabled={transactions.length === 0}
              className="px-3 py-1 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors text-sm font-medium disabled:opacity-50"
            >
              📊 Export CSV
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 bg-gray-50">
        {/* Tambahkan background gray-50 */}
        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-3">
              Filter Transactions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Types</option>
                  <option value="mint">Mint</option>
                  <option value="transfer">Transfer</option>
                  <option value="burn">Burn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) =>
                    handleFilterChange("fromDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={filters.minAmount}
                  onChange={(e) =>
                    handleFilterChange("minAmount", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    handleFilterChange("maxAmount", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={filters.address}
                  onChange={(e) =>
                    handleFilterChange("address", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0x..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800 font-medium">
              Error loading transactions
            </p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={fetchTransactions}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    From
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    To
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Transaction
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((tx, index) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-medium">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          tx.type
                        )}`}
                      >
                        {getTypeIcon(tx.type)}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-gray-900 font-medium">
                        {tx.formattedAmount}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">SEEDS</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-600 text-sm">
                        {tx.from ? truncateAddress(tx.from) : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-gray-600 text-sm">
                        {tx.to ? truncateAddress(tx.to) : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://suiexplorer.com/txblock/${tx.txDigest}?network=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 hover:underline font-mono text-sm transition-colors"
                      >
                        {truncateAddress(tx.txDigest)}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === "success"
                            ? "text-green-700 bg-green-100 border border-green-200"
                            : "text-red-700 bg-red-100 border border-red-200"
                        }`}
                      >
                        {tx.status === "success" ? "✅" : "❌"}
                        <span className="ml-1">{tx.status.toUpperCase()}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && transactions.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </div>
        )}

        {/* Summary */}
        {transactions.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Showing {transactions.length} transactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
