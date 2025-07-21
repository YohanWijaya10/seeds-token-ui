"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}

export default function SeedsAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/seeds-analytics");
      const data: AnalyticsResponse = await response.json();

      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatNumber = (num: string | number) => {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-64">
            <CardContent className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Loading analytics...</span>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">Failed to load analytics</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  // Prepare data for supply analytics pie chart
  const supplyData = [
    {
      name: "Circulating",
      value: parseFloat(analytics.supplyStats.circulatingSupply),
      color: "#10B981", // green-500
    },
    {
      name: "Burned",
      value: parseFloat(analytics.supplyStats.burnedTokens),
      color: "#EF4444", // red-500
    },
    {
      name: "Available",
      value:
        parseFloat(analytics.supplyStats.maxSupply) -
        parseFloat(analytics.supplyStats.totalSupply),
      color: "#E5E7EB", // gray-200
    },
  ].filter((item) => item.value > 0);

  // Prepare data for token distribution
  const distributionData = analytics.distributionStats.holders
    .slice(0, 8)
    .map((holder) => ({
      name: holder.label,
      balance: parseFloat(holder.balance),
      percentage: holder.percentage,
      address: holder.address,
    }));

  // Prepare data for transaction analytics
  const transactionData = [
    {
      name: "Mints",
      count: analytics.transactionStats.totalMints,
      color: "#10B981",
    },
    {
      name: "Transfers",
      count: analytics.transactionStats.totalTransfers,
      color: "#3B82F6",
    },
    {
      name: "Burns",
      count: analytics.transactionStats.totalBurns,
      color: "#EF4444",
    },
  ];

  const COLORS = [
    "#10B981",
    "#EF4444",
    "#E5E7EB",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#EC4899",
    "#6B7280",
  ];

  return (
    <div className="space-y-6">
      {/* Supply Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-green-100 text-sm">Total Supply</p>
              <p className="text-2xl font-bold">
                {formatNumber(analytics.supplyStats.totalSupply)}
              </p>
              <p className="text-green-100 text-xs">SEEDS</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-blue-100 text-sm">Circulating</p>
              <p className="text-2xl font-bold">
                {formatNumber(analytics.supplyStats.circulatingSupply)}
              </p>
              <p className="text-blue-100 text-xs">SEEDS</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-100 text-sm">Burned</p>
              <p className="text-2xl font-bold">
                {formatNumber(analytics.supplyStats.burnedTokens)}
              </p>
              <p className="text-red-100 text-xs">SEEDS</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-purple-100 text-sm">Supply Usage</p>
              <p className="text-2xl font-bold">
                {formatPercentage(analytics.supplyStats.supplyUtilization)}
              </p>
              <p className="text-purple-100 text-xs">of Max Supply</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Supply Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${formatNumber(value)} (${(
                        percent * 100
                      ).toFixed(1)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {supplyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatNumber(value), "SEEDS"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Token Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>👥</span>
              Top Holders Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      formatNumber(value),
                      "SEEDS",
                    ]}
                    labelFormatter={(label) => `Holder: ${label}`}
                  />
                  <Bar dataKey="balance" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📈</span>
              Transaction Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {transactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Holder Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span>
              Holder Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-green-600">
                  {analytics.distributionStats.totalHolders}
                </p>
                <p className="text-gray-600">Total Holders</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Top Holders:</h4>
                {analytics.distributionStats.holders
                  .slice(0, 5)
                  .map((holder, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{holder.label}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {holder.address.slice(0, 6)}...
                          {holder.address.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatNumber(holder.balance)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPercentage(holder.percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            Summary Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.transactionStats.totalMints}
              </p>
              <p className="text-gray-600 text-sm">Total Mints</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.transactionStats.totalTransfers}
              </p>
              <p className="text-gray-600 text-sm">Total Transfers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.transactionStats.totalBurns}
              </p>
              <p className="text-gray-600 text-sm">Total Burns</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics.transactionStats.totalVolume)}
              </p>
              <p className="text-gray-600 text-sm">Total Volume</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </div>
    </div>
  );
}
