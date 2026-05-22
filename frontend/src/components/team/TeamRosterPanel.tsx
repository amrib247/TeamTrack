import { useState } from 'react';
import { Mail, Phone, UserPlus, UserMinus, UserCog } from 'lucide-react';
import type { TeamMember } from '@/services/teamService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function getRoleDisplayName(role: string) {
  switch (role) {
    case 'COACH':
      return 'Coach';
    case 'PARENT':
      return 'Parent';
    case 'PLAYER':
      return 'Player';
    default:
      return role;
  }
}

function sortTeamMembersByRole(members: TeamMember[]) {
  const roleOrder = { COACH: 1, PARENT: 2, PLAYER: 3 };
  return [...members].sort((a, b) => {
    const orderA = roleOrder[a.role as keyof typeof roleOrder] || 4;
    const orderB = roleOrder[b.role as keyof typeof roleOrder] || 4;
    if (orderA !== orderB) return orderA - orderB;
    if (a.lastName !== b.lastName) return a.lastName.localeCompare(b.lastName);
    return a.firstName.localeCompare(b.firstName);
  });
}

export interface TeamRosterPanelProps {
  userRole: string;
  currentUserId: string;
  teamMembers: TeamMember[];
  loading: boolean;
  coachCount: number;
  loadingCoachCount: boolean;
  inviteForm: { email: string; role: string };
  inviteError: string;
  invitingUser: boolean;
  onInviteFormChange: (form: { email: string; role: string }) => void;
  onInviteSubmit: (e: React.FormEvent) => Promise<boolean>;
  onUpdateRole: (memberId: string, role: string) => Promise<void>;
  onRemoveMember: (member: TeamMember) => Promise<void>;
  panelError?: string;
}

export function TeamRosterPanel({
  userRole,
  currentUserId,
  teamMembers,
  loading,
  coachCount,
  loadingCoachCount,
  inviteForm,
  inviteError,
  invitingUser,
  onInviteFormChange,
  onInviteSubmit,
  onUpdateRole,
  onRemoveMember,
  panelError,
}: TeamRosterPanelProps) {
  const isCoach = userRole === 'COACH';
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [manageMember, setManageMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState('');
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [removing, setRemoving] = useState(false);

  const activeCount = teamMembers.filter((m) => m.inviteAccepted).length;
  const sorted = sortTeamMembersByRole(teamMembers);

  const openManage = (member: TeamMember) => {
    setManageMember(member);
    setNewRole(member.role);
  };

  const handleSaveRole = async () => {
    if (!manageMember || !newRole) return;
    setSavingRole(true);
    try {
      await onUpdateRole(manageMember.id, newRole);
      setManageMember(null);
    } finally {
      setSavingRole(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeMember) return;
    setRemoving(true);
    try {
      await onRemoveMember(removeMember);
      setRemoveMember(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Roster</h2>
            <p className="mt-1 text-sm text-gray-600">
              {loading ? 'Loading...' : `${activeCount} active member${activeCount === 1 ? '' : 's'}`}
              {!loadingCoachCount && isCoach && (
                <span className="text-gray-500"> · {coachCount} coach{coachCount === 1 ? '' : 'es'}</span>
              )}
            </p>
          </div>
          {isCoach && (
            <Button
              type="button"
              className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="mr-2 size-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {panelError && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {panelError}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading team roster...</p>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No team members yet.</p>
            {isCoach && <p className="mt-1 text-sm">Invite someone to get started.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((member) => {
              const isPending = !member.inviteAccepted;
              const canManage =
                isCoach &&
                member.inviteAccepted &&
                member.userId !== currentUserId &&
                member.role !== 'COACH';

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 border border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </h3>
                      <Badge variant={member.role === 'COACH' ? 'default' : 'secondary'}>
                        {getRoleDisplayName(member.role)}
                      </Badge>
                      {isPending && (
                        <Badge
                          variant="outline"
                          className="border-orange-300 bg-orange-50 text-orange-700"
                        >
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2 break-all">
                        <Mail className="size-4 shrink-0" />
                        <span>{member.email}</span>
                      </div>
                      {member.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="size-4 shrink-0" />
                          <span>{member.phoneNumber}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 flex-wrap gap-2 sm:ml-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-gray-300"
                        onClick={() => openManage(member)}
                      >
                        <UserCog className="mr-1 size-4" />
                        Change Role
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setRemoveMember(member)}
                      >
                        <UserMinus className="mr-1 size-4" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await onInviteSubmit(e);
              if (ok) setShowInviteModal(false);
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  onInviteFormChange({ ...inviteForm, email: e.target.value })
                }
                placeholder="member@example.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) =>
                  onInviteFormChange({ ...inviteForm, role: value })
                }
              >
                <SelectTrigger id="inviteRole" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAYER">Player</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="COACH">Coach</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <p className="text-sm text-red-600">{inviteError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={invitingUser}
              >
                {invitingUser ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!manageMember}
        onOpenChange={(open) => !open && setManageMember(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Change role: {manageMember?.firstName} {manageMember?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newRole">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="newRole" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAYER">Player</SelectItem>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  {manageMember?.userId !== currentUserId && (
                    <SelectItem value="COACH">Coach</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {manageMember?.role === 'COACH' && (
              <p className="text-sm text-gray-600">
                Coaches cannot be removed from the team, but their role can be changed by
                other coaches.
              </p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setManageMember(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={savingRole}
                onClick={handleSaveRole}
              >
                {savingRole ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeMember}
        onOpenChange={(open) => !open && setRemoveMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeMember?.firstName} {removeMember?.lastName} from the team? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={removing}
              onClick={handleConfirmRemove}
            >
              {removing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
