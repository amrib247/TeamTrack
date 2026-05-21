import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from './PageContainer';

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onLogout: () => void;
}

export function WorkspaceHeader({
  title,
  subtitle,
  badge,
  onLogout,
}: WorkspaceHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-gray-200 bg-white">
      <PageContainer className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 border-gray-300"
              onClick={() => navigate('/home')}
              aria-label="Back to home"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold text-gray-900">{title}</h1>
                {badge}
              </div>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-gray-300"
            onClick={onLogout}
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </div>
      </PageContainer>
    </header>
  );
}
