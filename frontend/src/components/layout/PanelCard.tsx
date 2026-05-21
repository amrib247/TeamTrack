import { cn } from '@/components/ui/utils';

interface PanelCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PanelCard({
  title,
  description,
  action,
  children,
  className,
}: PanelCardProps) {
  return (
    <div className={cn('border border-gray-200 bg-white shadow-sm', className)}>
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-6">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
