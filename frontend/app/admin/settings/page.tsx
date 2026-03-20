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
      router.push('/auth/signin');
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
        router.push('/auth/signin');
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
        router.push('/auth/signin');
      } else {
        setError(err.response?.data?.error || 'Failed to switch AI provider');
      }
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FEFDFB' }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
            style={{ border: '4px solid #EBE5DF', borderTopColor: '#1A3D2E' }}
          ></div>
          <p style={{ color: '#6B5E52' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FEFDFB' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center"
            style={{ color: '#1A3D2E' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F2A1E')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1A3D2E')}
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold" style={{ color: '#2D3A35' }}>Admin Settings</h1>
          <p className="mt-2" style={{ color: '#6B5E52' }}>Manage AI provider and system configuration</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-6 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(90, 125, 107, 0.1)',
              border: '1px solid rgba(90, 125, 107, 0.3)',
              color: '#5A7D6B',
            }}
          >
            ✅ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(198, 123, 111, 0.1)',
              border: '1px solid rgba(198, 123, 111, 0.3)',
              color: '#C67B6F',
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* AI Provider Section */}
        <div className="card-paper overflow-hidden mb-6">
          <div
            className="px-6 py-4 border-b"
            style={{
              backgroundColor: 'rgba(26, 61, 46, 0.05)',
              borderColor: '#EBE5DF',
            }}
          >
            <h2 className="text-xl font-semibold" style={{ color: '#2D3A35' }}>AI Provider Configuration</h2>
            <p className="text-sm mt-1" style={{ color: '#6B5E52' }}>
              Choose which AI model to use for fortune-telling interpretations
            </p>
          </div>

          <div className="p-6">
            {providerInfo && (
              <>
                {/* Current Provider */}
                <div
                  className="mb-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(85, 107, 126, 0.08)',
                    border: '1px solid rgba(85, 107, 126, 0.2)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1" style={{ color: '#6B5E52' }}>Current Provider</p>
                      <p className="text-2xl font-bold" style={{ color: '#2D3A35' }}>
                        {providerInfo.details[providerInfo.current].name}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#6B5E52' }}>
                        Model: {providerInfo.details[providerInfo.current].model}
                      </p>
                      <p className="text-sm" style={{ color: '#6B5E52' }}>
                        Cost: {providerInfo.details[providerInfo.current].costPer1MTokens}
                      </p>
                    </div>
                    <div className="text-4xl">🤖</div>
                  </div>
                </div>

                {/* Provider Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-3" style={{ color: '#2D3A35' }}>
                    Available Providers
                  </h3>

                  {providerInfo.available.map((providerId) => {
                    const provider = providerInfo.details[providerId];
                    const isCurrent = providerId === providerInfo.current;

                    return (
                      <div
                        key={providerId}
                        className="p-4 border rounded-lg transition-all"
                        style={
                          isCurrent
                            ? { borderColor: '#1A3D2E', backgroundColor: 'rgba(26, 61, 46, 0.05)' }
                            : { borderColor: '#EBE5DF' }
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold flex items-center" style={{ color: '#2D3A35' }}>
                              {provider.name}
                              {isCurrent && (
                                <span
                                  className="ml-2 px-2 py-1 text-xs rounded"
                                  style={{ backgroundColor: '#1A3D2E', color: 'white' }}
                                >
                                  Active
                                </span>
                              )}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: '#6B5E52' }}>Model: {provider.model}</p>
                            <p className="text-sm" style={{ color: '#6B5E52' }}>
                              Cost: {provider.costPer1MTokens}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSwitchProvider(providerId)}
                            disabled={isCurrent || switching}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors${switching ? ' opacity-50 cursor-wait' : ''}`}
                            style={
                              isCurrent
                                ? { backgroundColor: '#EBE5DF', color: '#8B8580', cursor: 'not-allowed' }
                                : { backgroundColor: '#1A3D2E', color: 'white' }
                            }
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
                          className="p-4 border rounded-lg opacity-60"
                          style={{ borderColor: '#EBE5DF', backgroundColor: '#FEFDFB' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold flex items-center" style={{ color: '#6B5E52' }}>
                                {provider.name}
                                <span
                                  className="ml-2 px-2 py-1 text-xs rounded"
                                  style={{ backgroundColor: 'rgba(198, 123, 111, 0.15)', color: '#C67B6F' }}
                                >
                                  Not Configured
                                </span>
                              </h4>
                              <p className="text-sm mt-1" style={{ color: '#8B8580' }}>Model: {provider.model}</p>
                              <p className="text-sm" style={{ color: '#8B8580' }}>
                                Cost: {provider.costPer1MTokens}
                              </p>
                              <p className="text-xs mt-2" style={{ color: '#8B8580' }}>
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
        <div className="card-paper overflow-hidden">
          <div
            className="px-6 py-4 border-b"
            style={{ backgroundColor: '#FEFDFB', borderColor: '#EBE5DF' }}
          >
            <h2 className="text-xl font-semibold" style={{ color: '#2D3A35' }}>Statistics (Coming Soon)</h2>
          </div>

          <div className="p-6">
            <p className="mb-4" style={{ color: '#6B5E52' }}>
              Future features will include:
            </p>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#6B5E52' }}>
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
