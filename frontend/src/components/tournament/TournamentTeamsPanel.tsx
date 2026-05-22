import { useState } from 'react';
import { Search, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface TeamSearchResult {
  id: string;
  teamName: string;
  sport: string;
  ageGroup: string;
}

export interface TeamInviteRecord {
  id: string;
  teamId: string;
  teamName?: string;
  sport?: string;
  ageGroup?: string;
  createdAt?: string;
}

export interface TournamentTeamsPanelProps {
  tournament: { maxSize: number; teamCount: number };
  enrolled: TeamInviteRecord[];
  pendingInvites: TeamInviteRecord[];
  loadingEnrolled: boolean;
  loadingPending: boolean;
  canManage: boolean;
  searching: boolean;
  inviting: boolean;
  searchResults: TeamSearchResult[];
  inviteError: string;
  onSearch: (teamName: string) => void;
  onInviteTeam: (teamId: string) => void;
  onRemoveTeam: (teamId: string) => void;
}

export function TournamentTeamsPanel({
  tournament,
  enrolled,
  pendingInvites,
  loadingEnrolled,
  loadingPending,
  canManage,
  searching,
  inviting,
  searchResults,
  inviteError,
  onSearch,
  onInviteTeam,
  onRemoveTeam,
}: TournamentTeamsPanelProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [teamName, setTeamName] = useState('');
  const isFull = tournament.teamCount >= tournament.maxSize;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) onSearch(teamName.trim());
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Enrolled Teams</h2>
              <p className="mt-1 text-sm text-gray-600">
                {tournament.teamCount}/{tournament.maxSize} teams enrolled
              </p>
            </div>
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                {isFull && (
                  <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                    Tournament Full
                  </Badge>
                )}
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isFull}
                  onClick={() => setShowInvite(true)}
                >
                  Invite Team
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 p-6">
          {loadingEnrolled ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading teams...</p>
          ) : enrolled.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No teams enrolled yet.
              {canManage && ' Use Invite Team to add participants.'}
            </p>
          ) : (
            enrolled.map((team) => (
              <div
                key={team.id}
                className="flex flex-col gap-3 border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {team.teamName ?? `Team ${team.teamId.substring(0, 8)}…`}
                  </h3>
                  {(team.sport || team.ageGroup) && (
                    <p className="text-sm text-gray-600">
                      {[team.sport, team.ageGroup].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {team.createdAt && (
                    <p className="text-sm text-gray-600">
                      Joined {new Date(team.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {canManage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={inviting}
                    onClick={() => onRemoveTeam(team.teamId)}
                  >
                    <UserMinus className="mr-1 size-4" />
                    Remove
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Pending Team Invites</h2>
        </div>
        <div className="space-y-4 p-6">
          {loadingPending ? (
            <p className="text-sm text-gray-500">Loading pending invites...</p>
          ) : pendingInvites.length === 0 ? (
            <p className="text-sm text-gray-500">No pending team invites.</p>
          ) : (
            pendingInvites.map((invite) => (
                <div key={invite.id} className="border border-gray-200 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {invite.teamName ?? `Team ${invite.teamId.substring(0, 8)}…`}
                  </h3>
                  <Badge
                    variant="outline"
                    className="border-orange-300 bg-orange-50 text-orange-700"
                  >
                    Pending
                  </Badge>
                </div>
                {invite.createdAt && (
                  <p className="text-sm text-gray-600">
                    Invited {new Date(invite.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="teamSearch">Team Name</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="teamSearch"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Search by team name"
                  required
                />
                <Button type="submit" variant="outline" disabled={searching}>
                  <Search className="mr-1 size-4" />
                  {searching ? '...' : 'Search'}
                </Button>
              </div>
            </div>
            {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            {searchResults.length > 0 && (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {searchResults.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between gap-2 border border-gray-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{team.teamName}</p>
                      <p className="text-sm text-gray-600">
                        {team.sport} · {team.ageGroup}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                      disabled={inviting}
                      onClick={() => onInviteTeam(team.id)}
                    >
                      Invite
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" className="w-full" onClick={() => setShowInvite(false)}>
              Close
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
