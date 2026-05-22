import { useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface TournamentOrganizer {
  organizerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
}

export interface TournamentOrganizersPanelProps {
  organizers: TournamentOrganizer[];
  loading: boolean;
  canManage: boolean;
  inviting: boolean;
  inviteError: string;
  onInvite: (email: string) => Promise<boolean>;
}

export function TournamentOrganizersPanel({
  organizers,
  loading,
  canManage,
  inviting,
  inviteError,
  onInvite,
}: TournamentOrganizersPanelProps) {
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
    <div className="border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tournament Organizers</h2>
            <p className="mt-1 text-sm text-gray-600">
              {loading
                ? 'Loading...'
                : `${organizers.length} organizer${organizers.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {canManage && (
            <Button
              type="button"
              className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setShowInvite(true)}
            >
              <UserPlus className="mr-2 size-4" />
              Invite Organizer
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading organizers...</p>
        ) : organizers.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No organizers found.</p>
        ) : (
          organizers.map((organizer) => (
            <div
              key={organizer.organizerId}
              className="flex gap-4 border border-gray-200 p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                {organizer.profilePhotoUrl ? (
                  <img
                    src={organizer.profilePhotoUrl}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <>
                    {organizer.firstName.charAt(0)}
                    {organizer.lastName.charAt(0)}
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900">
                  {organizer.firstName} {organizer.lastName}
                </h3>
                <p className="text-sm text-gray-500">Tournament Organizer</p>
                <div className="mt-1 flex items-center gap-2 break-all text-sm text-gray-600">
                  <Mail className="size-4 shrink-0" />
                  <span>{organizer.email}</span>
                </div>
                {organizer.phoneNumber && (
                  <p className="mt-1 text-sm text-gray-600">Phone: {organizer.phoneNumber}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Organizer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="organizerEmail">Email Address</Label>
              <Input
                id="organizerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizer@example.com"
                required
                className="mt-1"
              />
            </div>
            {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowInvite(false)}
              >
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
