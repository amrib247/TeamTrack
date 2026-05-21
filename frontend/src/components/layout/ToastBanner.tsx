import { cn } from '@/components/ui/utils';

interface ToastBannerProps {
  message: string;
  variant?: 'success' | 'error';
  onDismiss?: () => void;
}

export function ToastBanner({
  message,
  variant = 'success',
  onDismiss,
}: ToastBannerProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-md shadow-lg text-sm font-medium',
        variant === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-destructive text-destructive-foreground'
      )}
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="opacity-80 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
