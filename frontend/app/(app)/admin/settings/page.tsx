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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFCFA' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem auto',
              borderRadius: '9999px',
              border: '4px solid #EBE5DF',
              borderTopColor: '#2D3A35',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <p style={{ color: '#6B5E52' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDFCFA' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(235,229,223,0.6)' }}>
        <div style={{ maxWidth: '36rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => router.back()}
            style={{ color: '#2D3A35', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F2A1E')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#2D3A35')}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2D3A35', margin: 0 }}>Admin Settings</h1>
          <div style={{ width: '3rem' }}></div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: '36rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ color: '#6B5E52', marginBottom: '1.5rem' }}>Manage AI provider and system configuration</p>

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
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
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(198, 123, 111, 0.1)',
              border: '1px solid rgba(198, 123, 111, 0.3)',
              color: '#C67B6F',
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* AI Provider Section */}
        <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '1.25rem', marginBottom: '1rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)', overflow: 'hidden' }}>
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #EBE5DF',
              backgroundColor: 'rgba(26, 61, 46, 0.05)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2D3A35', margin: 0 }}>AI Provider Configuration</h2>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6B5E52' }}>
              Choose which AI model to use for fortune-telling interpretations
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {providerInfo && (
              <>
                {/* Current Provider */}
                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(85, 107, 126, 0.08)',
                    border: '1px solid rgba(85, 107, 126, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: '#6B5E52' }}>Current Provider</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2D3A35', margin: 0 }}>
                        {providerInfo.details[providerInfo.current].name}
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6B5E52' }}>
                        Model: {providerInfo.details[providerInfo.current].model}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6B5E52' }}>
                        Cost: {providerInfo.details[providerInfo.current].costPer1MTokens}
                      </p>
                    </div>
                    <div style={{ fontSize: '2.5rem' }}>🤖</div>
                  </div>
                </div>

                {/* Provider Options */}
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#2D3A35' }}>
                    Available Providers
                  </h3>

                  {providerInfo.available.map((providerId) => {
                    const provider = providerInfo.details[providerId];
                    const isCurrent = providerId === providerInfo.current;

                    return (
                      <div
                        key={providerId}
                        style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          marginBottom: '1rem',
                          transition: 'all 0.2s',
                          ...(isCurrent
                            ? { border: '1px solid #2D3A35', backgroundColor: 'rgba(26, 61, 46, 0.05)' }
                            : { border: '1px solid #EBE5DF' }),
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2D3A35', display: 'flex', alignItems: 'center', margin: 0 }}>
                              {provider.name}
                              {isCurrent && (
                                <span
                                  style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.25rem', backgroundColor: '#2D3A35', color: 'white' }}
                                >
                                  Active
                                </span>
                              )}
                            </h4>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6B5E52' }}>Model: {provider.model}</p>
                            <p style={{ fontSize: '0.875rem', color: '#6B5E52' }}>
                              Cost: {provider.costPer1MTokens}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSwitchProvider(providerId)}
                            disabled={isCurrent || switching}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '0.75rem',
                              fontWeight: 500,
                              border: 'none',
                              cursor: isCurrent ? 'not-allowed' : switching ? 'wait' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: switching && !isCurrent ? 0.5 : 1,
                              ...(isCurrent
                                ? { backgroundColor: '#EBE5DF', color: '#8B8580' }
                                : { backgroundColor: '#2D3A35', color: 'white' }),
                            }}
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
                          style={{ padding: '1rem', border: '1px solid #EBE5DF', borderRadius: '0.75rem', opacity: 0.6, backgroundColor: '#FDFCFA', marginBottom: '1rem' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#6B5E52', display: 'flex', alignItems: 'center', margin: 0 }}>
                                {provider.name}
                                <span
                                  style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.25rem', backgroundColor: 'rgba(198, 123, 111, 0.15)', color: '#C67B6F' }}
                                >
                                  Not Configured
                                </span>
                              </h4>
                              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#8B8580' }}>Model: {provider.model}</p>
                              <p style={{ fontSize: '0.875rem', color: '#8B8580' }}>
                                Cost: {provider.costPer1MTokens}
                              </p>
                              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#8B8580' }}>
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
        <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(235,229,223,0.6)', borderRadius: '1.25rem', marginBottom: '1rem', boxShadow: '0 4px 20px -4px rgba(45,58,53,0.06)', overflow: 'hidden' }}>
          <div
            style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #EBE5DF', backgroundColor: '#FDFCFA' }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2D3A35', margin: 0 }}>Statistics (Coming Soon)</h2>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '1rem', color: '#6B5E52' }}>
              Future features will include:
            </p>
            <ul style={{ color: '#6B5E52', paddingLeft: '1.25rem', listStyleType: 'disc' }}>
              <li style={{ marginBottom: '0.5rem' }}>Total users and active users</li>
              <li style={{ marginBottom: '0.5rem' }}>Payment statistics and revenue tracking</li>
              <li style={{ marginBottom: '0.5rem' }}>AI usage analytics (calls, tokens, costs)</li>
              <li>System health monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
