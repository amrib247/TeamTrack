import { useState } from 'react';
import type { ReminderLeadTime } from '@/types/Auth';
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

export interface TeamDetailsView {
  teamName: string;
  sport: string;
  ageGroup: string;
  description?: string;
  profilePhotoUrl?: string;
}

export interface TeamSettingsPanelProps {
  userRole: string;
  joinedAt: string;
  teamDetails: TeamDetailsView | null;
  loadingTeamDetails: boolean;
  editForm: {
    teamName: string;
    sport: string;
    ageGroup: string;
    description: string;
    profilePhotoUrl: string;
  };
  teamPhotoPreview: string | null;
  editingTeam: boolean;
  notificationPrefs: {
    emailNotificationsEnabled: boolean;
    reminderLeadTime: ReminderLeadTime;
  };
  savingNotifications: boolean;
  notificationMessage: string;
  panelError?: string;
  onEditFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onResetForm: () => void;
  onSaveTeam: (e: React.FormEvent) => void;
  onNotificationPrefsChange: (prefs: {
    emailNotificationsEnabled: boolean;
    reminderLeadTime: ReminderLeadTime;
  }) => void;
  onSaveNotifications: () => void;
  onLeaveTeam: () => void;
  onTerminateTeam: () => void;
}

const SPORTS = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Football',
  'Volleyball',
  'Tennis',
  'Swimming',
  'Track & Field',
  'Other',
];

const AGE_GROUPS = ['5-7', '8-10', '11-13', '14-16', '17-18', '19+'];

export function TeamSettingsPanel({
  userRole,
  joinedAt,
  teamDetails,
  loadingTeamDetails,
  editForm,
  teamPhotoPreview,
  editingTeam,
  notificationPrefs,
  savingNotifications,
  notificationMessage,
  panelError,
  onEditFormChange,
  onPhotoUpload,
  onRemovePhoto,
  onResetForm,
  onSaveTeam,
  onNotificationPrefsChange,
  onSaveNotifications,
  onLeaveTeam,
  onTerminateTeam,
}: TeamSettingsPanelProps) {
  const isCoach = userRole === 'COACH';
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [terminateText, setTerminateText] = useState('');

  const roleLabel =
    userRole === 'COACH' ? 'Coach' : userRole === 'PARENT' ? 'Parent' : 'Player';

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Team Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage team information and preferences
        </p>
      </div>

      <div className="space-y-8 p-6">
        {panelError && (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {panelError}
          </p>
        )}

        {loadingTeamDetails ? (
          <p className="text-sm text-gray-500">Loading team information...</p>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {(teamPhotoPreview || teamDetails?.profilePhotoUrl) && (
                <img
                  src={teamPhotoPreview || teamDetails?.profilePhotoUrl}
                  alt=""
                  className="size-20 shrink-0 rounded-lg border border-gray-200 object-cover"
                />
              )}
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Your role:</span> {roleLabel}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-gray-900">Joined:</span>{' '}
                  {new Date(joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {isCoach && teamDetails ? (
              <form onSubmit={onSaveTeam} className="space-y-6">
                <div>
                  <h3 className="mb-4 font-semibold text-gray-900">Team Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        name="teamName"
                        value={editForm.teamName}
                        onChange={onEditFormChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="sport">Sport</Label>
                        <Select
                          value={editForm.sport}
                          onValueChange={(value) =>
                            onEditFormChange({
                              target: { name: 'sport', value },
                            } as React.ChangeEvent<HTMLSelectElement>)
                          }
                        >
                          <SelectTrigger id="sport" className="mt-1">
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPORTS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ageGroup">Age Group</Label>
                        <Select
                          value={editForm.ageGroup}
                          onValueChange={(value) =>
                            onEditFormChange({
                              target: { name: 'ageGroup', value },
                            } as React.ChangeEvent<HTMLSelectElement>)
                          }
                        >
                          <SelectTrigger id="ageGroup" className="mt-1">
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent>
                            {AGE_GROUPS.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={editForm.description}
                        onChange={onEditFormChange}
                        rows={3}
                        className="mt-1"
                        placeholder="Optional team description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamPhotoInput">Team Photo</Label>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <Input
                          id="teamPhotoInput"
                          type="file"
                          accept="image/*"
                          onChange={onPhotoUpload}
                          className="max-w-xs"
                        />
                        {(teamPhotoPreview || editForm.profilePhotoUrl) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600"
                            onClick={onRemovePhoto}
                          >
                            Remove Photo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={editingTeam}
                  >
                    {editingTeam ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={onResetForm}>
                    Reset
                  </Button>
                </div>
              </form>
            ) : teamDetails ? (
              <div>
                <h3 className="mb-4 font-semibold text-gray-900">Team Information</h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Team Name</dt>
                    <dd className="font-medium text-gray-900">{teamDetails.teamName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Sport</dt>
                    <dd className="font-medium text-gray-900">{teamDetails.sport}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Age Group</dt>
                    <dd className="font-medium text-gray-900">{teamDetails.ageGroup}</dd>
                  </div>
                  {teamDetails.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">Description</dt>
                      <dd className="text-gray-900">{teamDetails.description}</dd>
                    </div>
                  )}
                </dl>
                {!isCoach && (
                  <p className="mt-4 text-sm text-gray-600">
                    Only team coaches can modify team settings. Contact your coach if you need
                    changes.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Failed to load team information.</p>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 font-semibold text-gray-900">Email Reminders</h3>
              <p className="mb-4 text-sm text-gray-600">
                Receive an email before upcoming games and tasks you&apos;re signed up for.
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
                <Label htmlFor="reminderLeadTime">Remind me before</Label>
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
                  <SelectTrigger id="reminderLeadTime" className="mt-1">
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
                disabled={savingNotifications}
                onClick={onSaveNotifications}
              >
                {savingNotifications ? 'Saving...' : 'Save Reminder Preferences'}
              </Button>
              {notificationMessage && (
                <p
                  className={`mt-2 text-sm ${
                    notificationMessage.includes('saved')
                      ? 'text-green-700'
                      : 'text-red-600'
                  }`}
                >
                  {notificationMessage}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 font-semibold text-gray-900">Team Actions</h3>
              {!isCoach && (
                <div>
                  <p className="mb-3 text-sm text-gray-600">
                    You can leave this team at any time. This action cannot be undone.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => setShowLeaveDialog(true)}
                  >
                    Leave Team
                  </Button>
                </div>
              )}
              {isCoach && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm text-gray-600">
                      Leave this team as coach. You may need another coach on the roster first.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                      onClick={() => setShowLeaveDialog(true)}
                    >
                      Leave Team
                    </Button>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-red-600">Danger Zone</h4>
                    <p className="mb-3 text-sm text-gray-600">
                      Terminating the team will permanently delete all team data, including
                      roster, schedule, and chat history.
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowTerminateDialog(true)}
                    >
                      Terminate Team
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave team?</AlertDialogTitle>
            <AlertDialogDescription>
              Type LEAVE below to confirm. You will lose access to this team&apos;s roster,
              schedule, and chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <LeaveConfirmForm
            onConfirm={() => {
              onLeaveTeam();
              setShowLeaveDialog(false);
            }}
            onCancel={() => setShowLeaveDialog(false)}
          />
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate team?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Type DELETE to confirm permanent deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="terminateConfirm">Confirmation</Label>
            <Input
              id="terminateConfirm"
              value={terminateText}
              onChange={(e) => setTerminateText(e.target.value)}
              placeholder="DELETE"
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setTerminateText('');
                setShowTerminateDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={terminateText !== 'DELETE'}
              onClick={() => {
                onTerminateTeam();
                setShowTerminateDialog(false);
                setTerminateText('');
              }}
            >
              Terminate Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LeaveConfirmForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  return (
    <>
      <div className="my-4">
        <Label htmlFor="leaveConfirm">Type LEAVE to confirm</Label>
        <Input
          id="leaveConfirm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="LEAVE"
          className="mt-1"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-red-600 hover:bg-red-700"
          disabled={text !== 'LEAVE'}
          onClick={onConfirm}
        >
          Leave Team
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
