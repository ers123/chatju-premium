'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { PaddleProductType } from '@/types';

// Paddle.js types
declare global {
  interface Window {
    Paddle?: {
      Initialize: (config: PaddleInitConfig) => void;
      Checkout: {
        open: (config: PaddleCheckoutConfig) => void;
      };
    };
  }
}

interface PaddleInitConfig {
  token: string;
  checkout?: {
    settings?: {
      variant?: 'one-page' | 'multi-page';
    };
  };
}

interface PaddleCheckoutConfig {
  items: Array<{ priceId: string; quantity: number }>;
  customData?: Record<string, string>;
  customer?: { email: string };
  settings?: {
    successUrl?: string;
    theme?: 'light' | 'dark';
  };
}

interface PaddleCheckoutProps {
  productType: PaddleProductType;
  email: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

// Load Paddle.js script
const loadPaddleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Paddle) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="paddle.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(script);
  });
};

export function PaddleCheckout({
  productType,
  email,
  onSuccess,
  onError,
  onClose,
  className = '',
  children,
  disabled = false,
}: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  // Load Paddle.js on mount
  useEffect(() => {
    loadPaddleScript()
      .then(() => setIsPaddleReady(true))
      .catch((err) => {
        console.error('Failed to load Paddle:', err);
        onError?.('Failed to load payment system');
      });
  }, [onError]);

  const handleCheckout = useCallback(async () => {
    if (!isPaddleReady || !window.Paddle) {
      onError?.('Payment system not ready');
      return;
    }

    setIsLoading(true);

    try {
      // Get checkout data from backend
      const response = await apiClient.createPaddlePayment({
        productType,
        email,
      });

      if (!response.success) {
        throw new Error('Failed to create payment session');
      }

      const { priceId, customData, clientToken, orderId } = response;

      // Initialize Paddle with client token
      window.Paddle.Initialize({
        token: clientToken,
        checkout: {
          settings: {
            variant: 'one-page', // Use the 2024 one-page checkout
          },
        },
      });

      // Open the Paddle Overlay checkout
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: {
          orderId: customData.orderId,
          userId: customData.userId,
        },
        customer: { email },
        settings: {
          successUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
          theme: 'light',
        },
      });

      // Note: Paddle handles the checkout flow from here
      // Success/failure is communicated via webhooks to the backend
      // The successUrl redirect happens after successful payment

    } catch (error) {
      console.error('Paddle checkout error:', error);
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  }, [isPaddleReady, productType, email, onError]);

  // Default button content
  const buttonContent = children || (
    <>
      {isLoading ? 'Processing...' : `Pay with Paddle (${productType === 'deluxe' ? '$19.99' : '$9.99'})`}
    </>
  );

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || isLoading || !isPaddleReady}
      className={`
        inline-flex items-center justify-center
        px-6 py-3 rounded-lg font-medium
        bg-[#0a84ff] text-white
        hover:bg-[#0077ed]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {buttonContent}
    </button>
  );
}

export default PaddleCheckout;
