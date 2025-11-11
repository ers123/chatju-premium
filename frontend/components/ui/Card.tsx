// ============================================
// Card Component
// Container component with Korean-inspired design
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, children, variant = 'default', ...props }, ref) => {
    // Variant styles
    const variants = {
      default: 'bg-white border border-[var(--border)]',
      bordered: 'bg-white border-2 border-[var(--primary)]',
      elevated: 'bg-white shadow-lg border border-[var(--border)]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6',
          'transition-all duration-200',
          variants[variant],
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-xl font-semibold text-[var(--primary)] mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--metal)]">
                {subtitle}
              </p>
            )}
            {(title || subtitle) && <div className="divider-korean mt-3" />}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
