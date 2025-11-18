'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// ============================================
// Admin Settings Page
// ============================================
// Allows administrators to:
// 1. View current AI provider status
// 2. Switch between AI providers (OpenAI, Gemini, Claude)
// 3. View available providers and their details

interface ProviderDetails {
  name: string;
  model: string;
  costPer1MTokens: string;
}

interface AIProviderInfo {
  current: string;
  available: string[];
  details: {
    [key: string]: ProviderDetails;
  };
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [providerInfo, setProviderInfo] = useState<AIProviderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('chatju_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchProviderInfo();
  }, [router]);

  // Fetch current AI provider information
  const fetchProviderInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('chatju_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await axios.get(`${API_URL}/admin/ai-provider`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProviderInfo(response.data.data);
    } catch (err: any) {
      console.error('Error fetching provider info:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('chatju_token');
        router.push('/auth/login');
      } else {
        setError(err.response?.data?.error || 'Failed to load AI provider information');
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch AI provider
  const handleSwitchProvider = async (provider: string) => {
    try {
      setSwitching(true);
      setError(null);
      setSuccessMessage(null);

      const token = localStorage.getItem('chatju_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await axios.post(
        `${API_URL}/admin/ai-provider`,
        { provider },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setProviderInfo(response.data.data);
      setSuccessMessage(response.data.message);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error switching provider:', err);

      if (err.response?.status === 401) {
        localStorage.removeItem('chatju_token');
        router.push('/auth/login');
      } else {
        setError(err.response?.data?.error || 'Failed to switch AI provider');
      }
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-gray-600">Manage AI provider and system configuration</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            ✅ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* AI Provider Section */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <h2 className="text-xl font-semibold text-gray-900">AI Provider Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose which AI model to use for fortune-telling interpretations
            </p>
          </div>

          <div className="p-6">
            {providerInfo && (
              <>
                {/* Current Provider */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Provider</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {providerInfo.details[providerInfo.current].name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Model: {providerInfo.details[providerInfo.current].model}
                      </p>
                      <p className="text-sm text-gray-600">
                        Cost: {providerInfo.details[providerInfo.current].costPer1MTokens}
                      </p>
                    </div>
                    <div className="text-4xl">🤖</div>
                  </div>
                </div>

                {/* Provider Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Available Providers
                  </h3>

                  {providerInfo.available.map((providerId) => {
                    const provider = providerInfo.details[providerId];
                    const isCurrent = providerId === providerInfo.current;

                    return (
                      <div
                        key={providerId}
                        className={`p-4 border rounded-lg transition-all ${
                          isCurrent
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              {provider.name}
                              {isCurrent && (
                                <span className="ml-2 px-2 py-1 text-xs bg-indigo-600 text-white rounded">
                                  Active
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">Model: {provider.model}</p>
                            <p className="text-sm text-gray-600">
                              Cost: {provider.costPer1MTokens}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSwitchProvider(providerId)}
                            disabled={isCurrent || switching}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              isCurrent
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            } ${switching ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {isCurrent ? 'Current' : switching ? 'Switching...' : 'Switch'}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Unconfigured Providers */}
                  {Object.keys(providerInfo.details)
                    .filter((id) => !providerInfo.available.includes(id))
                    .map((providerId) => {
                      const provider = providerInfo.details[providerId];
                      return (
                        <div
                          key={providerId}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-600 flex items-center">
                                {provider.name}
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                  Not Configured
                                </span>
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">Model: {provider.model}</p>
                              <p className="text-sm text-gray-500">
                                Cost: {provider.costPer1MTokens}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Add API key to environment variables to enable
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Future Features Section */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Statistics (Coming Soon)</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Future features will include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Total users and active users</li>
              <li>Payment statistics and revenue tracking</li>
              <li>AI usage analytics (calls, tokens, costs)</li>
              <li>System health monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
