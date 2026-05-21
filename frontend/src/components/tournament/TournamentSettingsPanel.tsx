import { useState } from 'react';
import type { ReminderLeadTime, Tournament } from '@/types/Auth';
import { REMINDER_LEAD_TIME_OPTIONS } from '@/types/Auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export interface TournamentSettingsPanelProps {
  tournament: Tournament;
  isOrganizer: boolean;
  isReferee: boolean;
  isEditMode: boolean;
  editForm: { name: string; description: string };
  isUpdating: boolean;
  isDeleting: boolean;
  isLeaving: boolean;
  isLeavingAsReferee: boolean;
  notificationPrefs: {
    emailNotificationsEnabled: boolean;
    reminderLeadTime: ReminderLeadTime;
  };
  savingNotifications: boolean;
  notificationMessage: string;
  canSaveRefereeNotifications: boolean;
  panelError?: string;
  onEditToggle: () => void;
  onEditFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSaveChanges: () => void;
  onDeleteTournament: () => void;
  onLeaveAsOrganizer: () => void;
  onLeaveAsReferee: () => void;
  onNotificationPrefsChange: (prefs: {
    emailNotificationsEnabled: boolean;
    reminderLeadTime: ReminderLeadTime;
  }) => void;
  onSaveRefereeNotifications: () => void;
}

export function TournamentSettingsPanel({
  tournament,
  isOrganizer,
  isReferee,
  isEditMode,
  editForm,
  isUpdating,
  isDeleting,
  isLeaving,
  isLeavingAsReferee,
  notificationPrefs,
  savingNotifications,
  notificationMessage,
  canSaveRefereeNotifications,
  panelError,
  onEditToggle,
  onEditFormChange,
  onSaveChanges,
  onDeleteTournament,
  onLeaveAsOrganizer,
  onLeaveAsReferee,
  onNotificationPrefsChange,
  onSaveRefereeNotifications,
}: TournamentSettingsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveText, setLeaveText] = useState('');

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Tournament Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          {isOrganizer
            ? 'Manage tournament information'
            : 'View tournament details and preferences'}
        </p>
      </div>

      <div className="space-y-8 p-6">
        {panelError && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {panelError}
          </p>
        )}

        <div>
          <h3 className="mb-4 font-semibold text-gray-900">Tournament Information</h3>
          {isOrganizer && isEditMode ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSaveChanges();
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="tournamentName">Tournament Name</Label>
                <Input
                  id="tournamentName"
                  name="name"
                  value={editForm.name}
                  onChange={onEditFormChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tournamentDescription">Description</Label>
                <Textarea
                  id="tournamentDescription"
                  name="description"
                  value={editForm.description}
                  onChange={onEditFormChange}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onEditToggle}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{tournament.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Max Teams</dt>
                <dd className="font-medium text-gray-900">{tournament.maxSize}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Current Teams</dt>
                <dd className="font-medium text-gray-900">{tournament.teamCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Organizers</dt>
                <dd className="font-medium text-gray-900">{tournament.organizerCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(tournament.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {tournament.description && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Description</dt>
                  <dd className="text-gray-900">{tournament.description}</dd>
                </div>
              )}
            </dl>
          )}
          {isOrganizer && !isEditMode && (
            <Button
              type="button"
              className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
              onClick={onEditToggle}
            >
              Edit Tournament
            </Button>
          )}
        </div>

        {isReferee && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="mb-4 font-semibold text-gray-900">Email Reminders</h3>
            <p className="mb-4 text-sm text-gray-600">
              Receive an email before tournament games you are assigned to referee.
            </p>
            <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notificationPrefs.emailNotificationsEnabled}
                onChange={(e) =>
                  onNotificationPrefsChange({
                    ...notificationPrefs,
                    emailNotificationsEnabled: e.target.checked,
                  })
                }
                className="size-4 rounded border-gray-300"
              />
              <span>Enable email reminders</span>
            </label>
            <div className="mb-4 max-w-xs">
              <Label htmlFor="refereeReminderLeadTime">Remind me before</Label>
              <Select
                value={notificationPrefs.reminderLeadTime}
                disabled={!notificationPrefs.emailNotificationsEnabled}
                onValueChange={(value) =>
                  onNotificationPrefsChange({
                    ...notificationPrefs,
                    reminderLeadTime: value as ReminderLeadTime,
                  })
                }
              >
                <SelectTrigger id="refereeReminderLeadTime" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_LEAD_TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={savingNotifications || !canSaveRefereeNotifications}
              onClick={onSaveRefereeNotifications}
            >
              {savingNotifications ? 'Saving...' : 'Save Reminder Preferences'}
            </Button>
            {notificationMessage && (
              <p
                className={`mt-2 text-sm ${
                  notificationMessage.includes('saved') ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {notificationMessage}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 font-semibold text-gray-900">Tournament Actions</h3>
          {isReferee && (
            <div>
              <p className="mb-3 text-sm text-gray-600">
                Leave this tournament as a referee. You can be re-invited later.
              </p>
              <Button
                type="button"
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-50"
                onClick={() => setShowLeaveDialog(true)}
              >
                Leave Tournament
              </Button>
            </div>
          )}
          {isOrganizer && (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-sm text-gray-600">
                  Stop organizing this tournament. You can rejoin if invited again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  Leave as Organizer
                </Button>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-red-600">Danger Zone</h4>
                <p className="mb-3 text-sm text-gray-600">
                  Permanently delete this tournament and all related data.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Tournament
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              Type DELETE to confirm. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="deleteConfirm">Confirmation</Label>
            <Input
              id="deleteConfirm"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteText !== 'DELETE' || isDeleting}
              onClick={() => {
                onDeleteTournament();
                setShowDeleteDialog(false);
                setDeleteText('');
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              Type LEAVE to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="leaveConfirm">Confirmation</Label>
            <Input
              id="leaveConfirm"
              value={leaveText}
              onChange={(e) => setLeaveText(e.target.value)}
              placeholder="LEAVE"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeaveText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={leaveText !== 'LEAVE' || isLeaving || isLeavingAsReferee}
              onClick={() => {
                if (isReferee) onLeaveAsReferee();
                else onLeaveAsOrganizer();
                setShowLeaveDialog(false);
                setLeaveText('');
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
