// ============================================
// Input Component
// Form input with label and error states
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, name, type = 'text', ...props }, ref) => {
    const inputId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
          >
            {label}
            {props.required && <span className="text-[var(--error)] ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          className={cn(
            // Base styles
            'w-full px-4 py-2 rounded-lg',
            'border border-[var(--border)]',
            'bg-white text-[var(--foreground)]',
            'transition-all duration-200',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
            // Hover styles
            'hover:border-[var(--metal)]',
            // Disabled styles
            'disabled:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50',
            // Error styles
            error && 'border-[var(--error)] focus:ring-[var(--error)]',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-[var(--error)] flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-[var(--metal)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
