import { cn } from '@/components/ui/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('max-w-7xl mx-auto px-6', className)}>{children}</div>
  );
}
