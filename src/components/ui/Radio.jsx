import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const Radio = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 border-2 rounded-full transition-all duration-200',
              'flex items-center justify-center',
              props.checked
                ? 'border-indigo-600 bg-white'
                : 'border-gray-300 bg-white group-hover:border-indigo-400',
              props.disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-red-500'
            )}
          >
            {props.checked && (
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" />
            )}
          </div>
        </div>
        <div className="flex-1">
          {label && (
            <span className={cn(
              'text-sm font-medium',
              props.checked ? 'text-gray-900' : 'text-gray-700',
              props.disabled && 'opacity-50'
            )}>
              {label}
            </span>
          )}
          {error && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      </label>
    </div>
  );
});

Radio.displayName = 'Radio';

export default Radio;

