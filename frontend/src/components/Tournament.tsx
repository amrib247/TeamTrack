import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar } from 'lucide-react';
import type { Tournament } from '../types/Auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/components/ui/utils';

interface TournamentProps {
  tournament: Tournament;
  roleBadge?: 'Organizer' | 'Referee';
}

function Tournament({ tournament, roleBadge = 'Organizer' }: TournamentProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/tournament/${tournament.id}`)}
      className={cn(
        'w-full text-left block border border-border p-4',
        'hover:border-primary/40 hover:shadow-sm transition-all'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{tournament.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="size-3 shrink-0" />
            <span>
              {tournament.teamCount}/{tournament.maxSize} teams
            </span>
          </div>
        </div>
        <Badge variant={roleBadge === 'Referee' ? 'secondary' : 'default'}>
          {roleBadge === 'Referee' ? 'Read-only' : 'Organizer'}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="size-3 shrink-0" />
        <span>Created {new Date(tournament.createdAt).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

export default Tournament;
