"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface AdminInfo {
  hasKeypair: boolean;
  configuredAddress: string;
  keypairAddress: string | null;
  addressMatch: boolean;
  privateKeyFormat: string;
}

interface TestResult {
  method: string;
  success: boolean;
  address?: string;
  error?: string;
  keyLength?: number;
}

interface TestKeypairResponse {
  success: boolean;
  data?: {
    inputPrivateKey: string;
    decodedLength: number | string;
    results: TestResult[];
    expectedAddress: string;
  };
  error?: string;
}

export default function AdminDebugInfo() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [testResults, setTestResults] = useState<TestKeypairResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin-info");
      const data = await response.json();

      if (data.success) {
        setAdminInfo(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch admin info");
    } finally {
      setLoading(false);
    }
  };

  const testKeypairGeneration = async () => {
    try {
      setTesting(true);
      const privateKey =
        process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY ||
        "suiprivkey1qql4lfpxejww0wk6fed9e8lerruz3zd3ycwglphm4gzsy8rlgldd5sgf4s8"; // Fallback for testing

      const response = await fetch("/api/test-keypair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateKey }),
      });

      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setError("Failed to test keypair generation");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            <span className="ml-2">Loading admin info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader className="bg-gray-100">
          <CardTitle className="text-sm">
            🔧 Admin Configuration Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {error ? (
            <div className="text-red-600">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : adminInfo ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Keypair Loaded:</span>
                <span
                  className={
                    adminInfo.hasKeypair ? "text-green-600" : "text-red-600"
                  }
                >
                  {adminInfo.hasKeypair ? "✅" : "❌"}
                </span>
              </div>

              <div>
                <p className="font-medium">Configured Address:</p>
                <p className="text-xs font-mono break-all">
                  {adminInfo.configuredAddress}
                </p>
              </div>

              {adminInfo.keypairAddress && (
                <div>
                  <p className="font-medium">Keypair Address:</p>
                  <p className="text-xs font-mono break-all">
                    {adminInfo.keypairAddress}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <span className="font-medium">Address Match:</span>
                <span
                  className={
                    adminInfo.addressMatch ? "text-green-600" : "text-red-600"
                  }
                >
                  {adminInfo.addressMatch ? "✅" : "❌"}
                </span>
              </div>

              <div>
                <p className="font-medium">Private Key Format:</p>
                <p className="text-xs font-mono">
                  {adminInfo.privateKeyFormat}
                </p>
              </div>

              {!adminInfo.hasKeypair && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                  <p className="text-yellow-800 text-xs">
                    ⚠️ Private key not properly configured. Try the keypair test
                    below.
                  </p>
                </div>
              )}

              {adminInfo.hasKeypair && !adminInfo.addressMatch && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
                  <p className="text-red-800 text-xs">
                    ❌ Private key doesnt match configured admin address!
                  </p>
                </div>
              )}

              {adminInfo.hasKeypair && adminInfo.addressMatch && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mt-4">
                  <p className="text-green-800 text-xs">
                    ✅ Admin configuration is correct!
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex gap-2 mt-4">
            <button
              onClick={fetchAdminInfo}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Refresh Info
            </button>
            <button
              onClick={testKeypairGeneration}
              disabled={testing}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Keypair Generation"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-sm">
              🧪 Keypair Generation Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {testResults.success ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Input Private Key:</p>
                  <p className="text-xs font-mono">
                    {testResults.data?.inputPrivateKey}
                  </p>
                </div>

                <div>
                  <p className="font-medium">
                    Decoded Length: {testResults.data?.decodedLength}
                  </p>
                  <p className="font-medium">Expected Address:</p>
                  <p className="text-xs font-mono break-all">
                    {testResults.data?.expectedAddress}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Generation Methods:</p>
                  <div className="space-y-2 mt-2">
                    {testResults.data?.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border ${
                          result.success
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{result.method}</span>
                          <span
                            className={
                              result.success ? "text-green-600" : "text-red-600"
                            }
                          >
                            {result.success ? "✅" : "❌"}
                          </span>
                        </div>
                        {result.success ? (
                          <div className="mt-1">
                            <p className="text-xs">Address: {result.address}</p>
                            <p
                              className={`text-xs ${
                                result.address ===
                                testResults.data?.expectedAddress
                                  ? "text-green-600 font-bold"
                                  : "text-orange-600"
                              }`}
                            >
                              {result.address ===
                              testResults.data?.expectedAddress
                                ? "🎯 MATCH!"
                                : "⚠️ Different address"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-red-600 mt-1">
                            {result.error}
                          </p>
                        )}
                        {result.keyLength && (
                          <p className="text-xs text-gray-600">
                            Key length: {result.keyLength}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <p>Test failed: {testResults.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
