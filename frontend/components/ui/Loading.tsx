// ============================================
// Loading Component
// Multiple loading states and spinners
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}) => {
  // Size mappings
  const sizes = {
    sm: { spinner: 'w-4 h-4', dot: 'w-2 h-2', text: 'text-sm' },
    md: { spinner: 'w-8 h-8', dot: 'w-3 h-3', text: 'text-base' },
    lg: { spinner: 'w-12 h-12', dot: 'w-4 h-4', text: 'text-lg' },
  };

  // Spinner variant
  const SpinnerIcon = () => (
    <svg
      className={cn('animate-spin text-[var(--primary)]', sizes[size].spinner)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Dots variant
  const DotsIcon = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-[var(--primary)] animate-pulse',
            sizes[size].dot
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  // Pulse variant
  const PulseIcon = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn('w-1 bg-[var(--primary)] rounded-full animate-pulse')}
          style={{
            height: size === 'sm' ? '16px' : size === 'md' ? '24px' : '32px',
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  // Select variant component
  const LoadingIcon = () => {
    switch (variant) {
      case 'dots':
        return <DotsIcon />;
      case 'pulse':
        return <PulseIcon />;
      case 'spinner':
      default:
        return <SpinnerIcon />;
    }
  };

  // Content
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'min-h-screen',
        className
      )}
    >
      <LoadingIcon />
      {text && (
        <p className={cn('text-[var(--metal)] font-medium', sizes[size].text)}>
          {text}
        </p>
      )}
    </div>
  );

  // Full screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;

// Skeleton loader component for content placeholders
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--muted)]',
        variants[variant],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'circular' ? width : '1rem'),
      }}
    />
  );
};
