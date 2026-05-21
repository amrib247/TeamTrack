import { Link } from 'react-router-dom';
import { Trophy, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface TournamentInviteItem {
  id: string;
  tournamentId: string;
  createdAt?: string;
}

export interface TournamentDetail {
  name: string;
  maxSize: number;
  teamCount: number;
  organizerCount?: number;
}

export interface TeamTournamentsPanelProps {
  invites: TournamentInviteItem[];
  enrolled: TournamentInviteItem[];
  tournamentDetails: Record<string, TournamentDetail>;
  loadingInvites: boolean;
  loadingEnrolled: boolean;
  processingInviteId: string | null;
  leavingTournamentId: string | null;
  onAcceptInvite: (inviteId: string) => void;
  onDeclineInvite: (inviteId: string) => void;
  onLeaveTournament: (inviteId: string, tournamentId: string) => void;
  panelError?: string;
}

export function TeamTournamentsPanel({
  invites,
  enrolled,
  tournamentDetails,
  loadingInvites,
  loadingEnrolled,
  processingInviteId,
  leavingTournamentId,
  onAcceptInvite,
  onDeclineInvite,
  onLeaveTournament,
  panelError,
}: TeamTournamentsPanelProps) {
  return (
    <div className="space-y-6">
      {panelError && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {panelError}
        </p>
      )}

      <div className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Tournament Invites
            </h2>
          </div>
        </div>
        <div className="space-y-4 p-6">
          {loadingInvites ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Loading tournament invites...
            </p>
          ) : invites.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No pending tournament invites</p>
            </div>
          ) : (
            invites.map((invite) => {
              const tournament = tournamentDetails[invite.tournamentId];
              const processing = processingInviteId === invite.id;
              return (
                <div key={invite.id} className="border border-gray-200 p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 font-semibold text-gray-900">
                        {tournament?.name ?? 'Tournament'}
                      </h3>
                      {tournament && (
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-4 shrink-0" />
                            {invite.createdAt
                              ? `Invited ${new Date(invite.createdAt).toLocaleDateString()}`
                              : 'Pending invite'}
                          </span>
                          <span>
                            {tournament.teamCount}/{tournament.maxSize} teams
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-orange-300 bg-orange-50 text-orange-700"
                    >
                      Pending
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      disabled={processing}
                      onClick={() => onAcceptInvite(invite.id)}
                    >
                      <CheckCircle2 className="mr-1 size-4" />
                      {processing ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={processing}
                      onClick={() => onDeclineInvite(invite.id)}
                    >
                      <XCircle className="mr-1 size-4" />
                      {processing ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Enrolled Tournaments</h2>
          </div>
        </div>
        <div className="space-y-4 p-6">
          {loadingEnrolled ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Loading enrolled tournaments...
            </p>
          ) : enrolled.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>Not enrolled in any tournaments yet</p>
            </div>
          ) : (
            enrolled.map((item) => {
              const tournament = tournamentDetails[item.tournamentId];
              const leaving = leavingTournamentId === item.id;
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Link
                      to={`/tournament/${item.tournamentId}`}
                      className="min-w-0 flex-1"
                    >
                      <h3 className="mb-1 font-semibold text-gray-900 hover:text-blue-600">
                        {tournament?.name ?? 'Tournament'}
                      </h3>
                      {tournament && (
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-4 shrink-0" />
                            {item.createdAt
                              ? `Joined ${new Date(item.createdAt).toLocaleDateString()}`
                              : 'Enrolled'}
                          </span>
                          <span>
                            {tournament.teamCount}/{tournament.maxSize} teams
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge className="bg-green-600 hover:bg-green-600">Enrolled</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled={leaving}
                        onClick={() => onLeaveTournament(item.id, item.tournamentId)}
                      >
                        {leaving ? 'Leaving...' : 'Leave Tournament'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
