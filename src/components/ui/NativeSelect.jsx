import { forwardRef, useState, useEffect, useRef, useCallback, Children } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const NativeSelect = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  children,
  value: controlledValue,
  onChange: controlledOnChange,
  onBlur,
  name,
  ...props
}, ref) => {
  // React Hook Form register passes value and onChange in props
  const rHFValue = props.value;
  const rHFOnChange = props.onChange;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  // Parse options from children using React.Children utilities
  const parseOption = (child) => {
    if (!child || typeof child !== 'object') return null;
    
    // Handle React element - check if it has props (could be option element or any element with props)
    if ('props' in child) {
      // Check if it looks like an option element (has value prop or type is 'option')
      const hasValueProp = 'value' in (child.props || {});
      const isOptionType = child.type === 'option';
      
      if (hasValueProp || isOptionType) {
        const childValue = child.props?.value ?? '';
        let childLabel = child.props?.children;
        
        // Extract text from children
        if (typeof childLabel === 'string') {
          // Already a string - keep it
        } else if (Array.isArray(childLabel)) {
          // Flatten array of text nodes
          childLabel = childLabel
            .map(item => {
              if (typeof item === 'string') return item;
              if (typeof item === 'number') return String(item);
              if (item && typeof item === 'object' && 'props' in item) {
                return item.props?.children || '';
              }
              return '';
            })
            .filter(Boolean)
            .join('');
        } else if (typeof childLabel === 'number') {
          childLabel = String(childLabel);
        } else if (childLabel && typeof childLabel === 'object' && 'props' in childLabel) {
          // Nested React element
          childLabel = childLabel.props?.children || childValue;
        } else {
          // Fallback to value or empty
          childLabel = childValue || '';
        }
        
        return {
          value: childValue,
          label: String(childLabel || childValue || ''),
        };
      }
    }
    
    return null;
  };

  const options = [];
  if (children) {
    // Use React.Children.toArray to flatten any nested arrays
    const childrenArray = Children.toArray(children);
    childrenArray.forEach((child) => {
      const option = parseOption(child);
      if (option) {
        options.push(option);
      }
    });
  }

  // Get value from props or controlled value - prioritize React Hook Form value
  const value = controlledValue !== undefined 
    ? controlledValue 
    : (rHFValue !== undefined ? rHFValue : '');

  // Find selected option text - update when value or options change
  useEffect(() => {
    if (options.length === 0) {
      setSelectedText('Select an option');
      return;
    }
    
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    if (selectedOption) {
      setSelectedText(selectedOption.label);
    } else if (value === '' || value === undefined || value === null) {
      // Find the default option (usually the first one with empty value)
      const defaultOption = options.find(opt => opt.value === '');
      setSelectedText(defaultOption ? defaultOption.label : 'Select an option');
    } else {
      // Value doesn't match any option - might be a race condition, try again after a short delay
      const timer = setTimeout(() => {
        const retryOption = options.find(opt => String(opt.value) === String(value));
        if (retryOption) {
          setSelectedText(retryOption.label);
        } else {
          setSelectedText('Select an option');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [value, options]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8, // 8px gap below button (using viewport coordinates for fixed positioning)
        left: buttonRect.left,
        width: buttonRect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    updateDropdownPosition();
  }, [updateDropdownPosition]);

  // Update position on scroll and resize
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = options.findIndex(opt => String(opt.value) === String(value));
        let newIndex = currentIndex;

        if (event.key === 'ArrowDown') {
          newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        }

        const newOption = options[newIndex];
        if (newOption) {
          const syntheticEvent = {
            target: { value: newOption.value, name: name },
            currentTarget: { value: newOption.value, name: name },
          };
          if (controlledOnChange) {
            controlledOnChange(syntheticEvent);
          } else if (rHFOnChange) {
            rHFOnChange(syntheticEvent);
          } else if (props.onChange) {
            props.onChange(syntheticEvent);
          }
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, value, options, controlledOnChange, props.onChange, name]);

  const handleOptionClick = (optionValue) => {
    const syntheticEvent = {
      target: { value: optionValue, name: name },
      currentTarget: { value: optionValue, name: name },
    };

    // Handle React Hook Form onChange - prioritize controlled, then RHF, then props
    if (controlledOnChange) {
      controlledOnChange(syntheticEvent);
    } else if (rHFOnChange) {
      rHFOnChange(syntheticEvent);
    } else if (props.onChange) {
      props.onChange(syntheticEvent);
    }

    // Call onBlur if provided (for React Hook Form)
    if (onBlur) {
      onBlur();
    }

    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={(node) => {
            buttonRef.current = node;
            // Support React Hook Form ref
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type="button"
          onClick={() => !props.disabled && setIsOpen(!isOpen)}
          disabled={props.disabled}
          name={name}
          className={cn(
            'w-full px-4 py-3 pr-10 text-left bg-white border rounded-xl',
            'transition-all duration-200 appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500',
            'shadow-sm hover:shadow-md hover:border-gray-400',
            'flex items-center justify-between',
            error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300',
            props.disabled && 'opacity-50 cursor-not-allowed bg-gray-50 hover:shadow-sm',
            className
          )}
          {...props}
        >
          <span className={cn(
            'block truncate',
            value && value !== '' ? 'text-gray-900' : 'text-gray-400'
          )}>
            {selectedText || 'Select an option'}
          </span>
          <ChevronDown className={cn(
            'w-5 h-5 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )} />
        </button>

        {/* Custom dropdown menu - rendered via portal to avoid overflow clipping */}
        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              animation: 'fadeInDown 0.2s ease-out',
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent dropdown from closing when clicking inside
          >
            <div className="py-1">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options available
                </div>
              ) : (
                options.map((option, index) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <button
                      key={`${option.value}-${index}`}
                      type="button"
                      onClick={() => handleOptionClick(option.value)}
                      className={cn(
                        'w-full px-4 py-3 text-left flex items-center justify-between',
                        'transition-all duration-150 relative',
                        'hover:bg-indigo-50 hover:text-indigo-700',
                        isSelected 
                          ? 'bg-indigo-50 text-indigo-700 font-medium' 
                          : 'text-gray-700'
                      )}
                    >
                      <span className="flex-1">{option.label}</span>
                      {isSelected && (
                        <>
                          <Check className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-2" />
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full"></div>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

NativeSelect.displayName = 'NativeSelect';

export default NativeSelect;
