import { useState } from 'react';
import { Mail, UserPlus, UserMinus } from 'lucide-react';
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

export interface TournamentReferee {
  refereeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
}

export interface PendingRefereeInvite {
  refereeTournamentId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TournamentRefereesPanelProps {
  referees: TournamentReferee[];
  pendingInvites: PendingRefereeInvite[];
  loading: boolean;
  canManage: boolean;
  inviting: boolean;
  inviteError: string;
  onInvite: (email: string) => Promise<boolean>;
  onRemove: (userId: string) => void;
}

export function TournamentRefereesPanel({
  referees,
  pendingInvites,
  loading,
  canManage,
  inviting,
  inviteError,
  onInvite,
  onRemove,
}: TournamentRefereesPanelProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onInvite(email);
    if (ok) {
      setShowInvite(false);
      setEmail('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tournament Referees</h2>
              <p className="mt-1 text-sm text-gray-600">
                {loading
                  ? 'Loading...'
                  : `${referees.length} active referee${referees.length === 1 ? '' : 's'}`}
              </p>
            </div>
            {canManage && (
              <Button
                type="button"
                className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus className="mr-2 size-4" />
                Invite Referee
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading referees...</p>
          ) : referees.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No referees yet.</p>
          ) : (
            referees.map((referee) => (
              <div
                key={referee.refereeId}
                className="flex flex-col gap-4 border border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {referee.profilePhotoUrl ? (
                      <img
                        src={referee.profilePhotoUrl}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <>
                        {referee.firstName.charAt(0)}
                        {referee.lastName.charAt(0)}
                      </>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      {referee.firstName} {referee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">Tournament Referee</p>
                    <div className="mt-1 flex items-center gap-2 break-all text-sm text-gray-600">
                      <Mail className="size-4 shrink-0" />
                      <span>{referee.email}</span>
                    </div>
                  </div>
                </div>
                {canManage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onRemove(referee.userId)}
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

      {canManage && (
        <div className="border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Pending Referee Invites</h2>
          </div>
          <div className="space-y-4 p-6">
            {pendingInvites.length === 0 ? (
              <p className="text-sm text-gray-500">No pending referee invites.</p>
            ) : (
              pendingInvites.map((invite) => (
                <div key={invite.refereeTournamentId} className="border border-gray-200 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {invite.firstName} {invite.lastName}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-orange-300 bg-orange-50 text-orange-700"
                    >
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="size-4 shrink-0" />
                    <span>{invite.email}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Referee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="refereeEmail">Email Address</Label>
              <Input
                id="refereeEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={inviting}
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
