import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const Alert = ({
  children,
  variant = 'info',
  title,
  showIcon = true,
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    danger: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
  };
  
  const variantConfig = variants[variant];
  const Icon = variantConfig.icon;
  
  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border',
        variantConfig.container,
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variantConfig.iconColor)} />
      )}
      <div className="flex-1">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

