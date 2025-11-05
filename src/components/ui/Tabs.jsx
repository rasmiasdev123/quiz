import { useState, createContext, useContext } from 'react';
import { cn } from '../../lib/utils.js';

const TabsContext = createContext();

const Tabs = ({
  children,
  defaultValue,
  value,
  onChange,
  className = '',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex gap-1 bg-gray-100 p-1 rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({
  children,
  value,
  className = '',
  ...props
}) => {
  const { value: currentValue, onChange } = useContext(TabsContext);
  const isActive = currentValue === value;
  
  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        isActive
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({
  children,
  value,
  className = '',
  ...props
}) => {
  const { value: currentValue } = useContext(TabsContext);
  
  if (currentValue !== value) return null;
  
  return (
    <div
      className={cn('mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
};

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export default Tabs;

