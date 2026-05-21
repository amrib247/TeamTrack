import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService } from '../services/tournamentService';
import type {
  Tournament,
  AuthResponse,
  UpdateTournamentRequest,
  ReminderLeadTime,
} from '../types/Auth';
import { resolveRefereeNotificationPreferences } from '../services/tournamentService';
import TournamentSafetyPrompt from '../components/TournamentSafetyPrompt';
import TournamentSchedule from '../components/TournamentSchedule';
import Chat from '../components/Chat';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { ToastBanner } from '@/components/layout/ToastBanner';
import { TournamentOrganizersPanel } from '@/components/tournament/TournamentOrganizersPanel';
import { TournamentRefereesPanel } from '@/components/tournament/TournamentRefereesPanel';
import { TournamentTeamsPanel } from '@/components/tournament/TournamentTeamsPanel';
import { TournamentSettingsPanel } from '@/components/tournament/TournamentSettingsPanel';
import {
  workspaceTabsListClass,
  workspaceTabsTriggerClass,
} from '@/components/team/workspaceTabs';


interface TournamentPageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
}

function TournamentPage({ currentUser, onLogout }: TournamentPageProps) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'organizers' | 'referees' | 'teams' | 'scheduling' | 'chat' | 'settings'>('organizers');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 4000);
  };
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userRole, setUserRole] = useState<'organizer' | 'referee' | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const isOrganizer = userRole === 'organizer';
  const isReferee = userRole === 'referee';
  const canManage = isOrganizer;
  
  // Organizers state
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState<string>('');
  
  // Settings state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Safety prompt state
  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
  const [safetyPromptAction, setSafetyPromptAction] = useState<'LEAVE_TOURNAMENT' | 'DELETE_ACCOUNT'>('LEAVE_TOURNAMENT');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingTeams, setSearchingTeams] = useState(false);
  const [invitingTeam, setInvitingTeam] = useState(false);
  const [teamInviteError, setTeamInviteError] = useState<string>('');
  const [teamInvites, setTeamInvites] = useState<any[]>([]);
  const [loadingTeamInvites, setLoadingTeamInvites] = useState(false);
  const [enrolledTeams, setEnrolledTeams] = useState<any[]>([]);
  const [loadingEnrolledTeams, setLoadingEnrolledTeams] = useState(false);

  // Referees state
  const [referees, setReferees] = useState<any[]>([]);
  const [pendingRefereeInvites, setPendingRefereeInvites] = useState<any[]>([]);
  const [loadingReferees, setLoadingReferees] = useState(false);
  const [invitingReferee, setInvitingReferee] = useState(false);
  const [refereeInviteError, setRefereeInviteError] = useState<string>('');
  const [isLeavingAsReferee, setIsLeavingAsReferee] = useState(false);

  // Referee notification prefs
  const [refereeTournamentId, setRefereeTournamentId] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotificationsEnabled: true,
    reminderLeadTime: '1d' as ReminderLeadTime,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    if (!tournamentId) {
      setError('Tournament ID is required');
      setLoading(false);
      return;
    }

    const loadTournament = async () => {
      try {
        setLoading(true);
        setAccessDenied(false);
        const [tournamentData, role] = await Promise.all([
          tournamentService.getTournamentById(tournamentId),
          tournamentService.getUserTournamentRole(currentUser.id, tournamentId),
        ]);
        if (!tournamentData) {
          setError('Tournament not found');
          return;
        }
        if (!role) {
          setAccessDenied(true);
          setTournament(tournamentData);
          return;
        }
        setTournament(tournamentData);
        setUserRole(role);
        if (role === 'referee') {
          setActiveTab('scheduling');
        }
      } catch (error) {
        console.error('Failed to load tournament:', error);
        setError('Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId, currentUser.id]);

  useEffect(() => {
    const loadRefereeNotificationPrefs = async () => {
      if (!tournamentId || !isReferee) return;
      try {
        const membership = await tournamentService.getRefereeTournamentMembership(
          currentUser.id,
          tournamentId
        );
        if (!membership) return;
        setRefereeTournamentId(membership.id);
        setNotificationPrefs(resolveRefereeNotificationPreferences(membership));
      } catch (err) {
        console.error('Failed to load referee notification preferences:', err);
      }
    };

    loadRefereeNotificationPrefs();
  }, [tournamentId, currentUser.id, isReferee]);

  const handleSaveRefereeNotificationPrefs = async () => {
    if (!refereeTournamentId) return;
    setSavingNotifications(true);
    setNotificationMessage('');
    try {
      await tournamentService.updateRefereeNotificationPreferences(
        refereeTournamentId,
        currentUser.id,
        notificationPrefs
      );
      setNotificationMessage('Reminder preferences saved.');
    } catch (err) {
      setNotificationMessage(
        err instanceof Error ? err.message : 'Failed to save preferences'
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  // Fetch organizers when organizers tab is active
  useEffect(() => {
    const loadOrganizers = async () => {
      if (activeTab === 'organizers' && tournamentId) {
        try {
          setLoadingOrganizers(true);
          const organizersData = await tournamentService.getTournamentOrganizers(tournamentId);
          setOrganizers(organizersData);
        } catch (error) {
          console.error('Failed to load organizers:', error);
          setError('Failed to load organizers');
        } finally {
          setLoadingOrganizers(false);
        }
      }
    };
    
    loadOrganizers();
  }, [activeTab, tournamentId]);

  // Fetch referees when referees or scheduling tab is active
  useEffect(() => {
    const loadReferees = async () => {
      if (
        (activeTab === 'referees' || activeTab === 'scheduling') &&
        tournamentId &&
        userRole
      ) {
        try {
          setLoadingReferees(true);
          const [refereesData, pendingData] = await Promise.all([
            tournamentService.getTournamentReferees(tournamentId),
            canManage
              ? tournamentService.getPendingRefereeInvitesForTournament(tournamentId)
              : Promise.resolve([]),
          ]);
          setReferees(refereesData);
          setPendingRefereeInvites(pendingData);
        } catch (error) {
          console.error('Failed to load referees:', error);
          setError('Failed to load referees');
        } finally {
          setLoadingReferees(false);
        }
      }
    };

    loadReferees();
  }, [activeTab, tournamentId, canManage, userRole]);

  const enrichTeamInviteRecords = async (
    records: Array<{ id: string; teamId: string; createdAt?: string }>
  ) => {
    const { teamService } = await import('../services/teamService');
    return Promise.all(
      records.map(async (record) => {
        const teamId = String(record.teamId);
        try {
          const team = await teamService.getTeam(teamId);
          return {
            ...record,
            teamId,
            teamName: team.teamName,
            sport: team.sport,
            ageGroup: team.ageGroup,
            createdAt:
              record.createdAt != null
                ? String(record.createdAt)
                : undefined,
          };
        } catch {
          return { ...record, teamId };
        }
      })
    );
  };

  // Fetch team invites when teams tab is active
  useEffect(() => {
    const loadTeamInvites = async () => {
      if (activeTab === 'teams' && tournamentId) {
        try {
          setLoadingTeamInvites(true);
          const invitesData = await tournamentService.getTournamentTeamInvites(tournamentId);
          const enriched = await enrichTeamInviteRecords(
            invitesData.map((inv) => ({
              id: String(inv.id),
              teamId: String(inv.teamId),
              createdAt: inv.createdAt != null ? String(inv.createdAt) : undefined,
            }))
          );
          setTeamInvites(enriched);
        } catch (error) {
          console.error('Failed to load team invites:', error);
          setError('Failed to load team invites');
        } finally {
          setLoadingTeamInvites(false);
        }
      }
    };

    loadTeamInvites();
  }, [activeTab, tournamentId]);

  // Fetch enrolled teams when teams tab is active
  useEffect(() => {
    const loadEnrolledTeams = async () => {
      if (activeTab === 'teams' && tournamentId) {
        try {
          setLoadingEnrolledTeams(true);
          const teams = await tournamentService.getAcceptedTournamentTeamInvites(tournamentId);
          const enriched = await enrichTeamInviteRecords(teams);
          setEnrolledTeams(enriched);
        } catch (error) {
          console.error('Failed to load enrolled teams:', error);
          setError('Failed to load enrolled teams');
        } finally {
          setLoadingEnrolledTeams(false);
        }
      }
    };

    loadEnrolledTeams();
  }, [activeTab, tournamentId]);
  
  const handleInviteTeam = async (teamId: string) => {
    if (!tournamentId || !tournament) return;
    
    // Frontend safety check: prevent invites to full tournaments
    if (tournament.teamCount >= tournament.maxSize) {
      setTeamInviteError('Cannot invite team - tournament is already at maximum capacity');
      return;
    }
    
    try {
      setInvitingTeam(true);
      setTeamInviteError('');
      
      // Check if team already has an invite or is enrolled
      const existingInvite = await tournamentService.checkExistingInvite(tournamentId, teamId);
      if (existingInvite) {
        setTeamInviteError('This team already has an invite or is enrolled in the tournament');
        return;
      }
      
      await tournamentService.inviteTeamToTournament(tournamentId, teamId);
      
      showToast('Team invited successfully!');
      setSearchResults([]);
      
      if (activeTab === 'teams') {
        const invites = await tournamentService.getTournamentTeamInvites(tournamentId);
        const enriched = await enrichTeamInviteRecords(
          invites.map((inv) => ({
            id: String(inv.id),
            teamId: String(inv.teamId),
            createdAt: inv.createdAt != null ? String(inv.createdAt) : undefined,
          }))
        );
        setTeamInvites(enriched);
      }
      
    } catch (err) {
      setTeamInviteError(err instanceof Error ? err.message : 'Failed to invite team');
    } finally {
      setInvitingTeam(false);
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    if (!tournamentId) return;
    
    if (!window.confirm('Are you sure you want to remove this team from the tournament?')) {
      return;
    }
    
    try {
      await tournamentService.removeTeamFromTournament(tournamentId, teamId);
      
      showToast('Team removed successfully!');
      
      // Refresh tournament data to update team count
      const updatedTournament = await tournamentService.getTournamentById(tournamentId);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
      
      if (activeTab === 'teams') {
        const teams = await tournamentService.getAcceptedTournamentTeamInvites(tournamentId);
        setEnrolledTeams(await enrichTeamInviteRecords(teams));
      }
      
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove team');
    }
  };

  // Settings functions
  const handleEditToggle = () => {
    if (!tournament) return;
    
    if (isEditMode) {
      // Cancel edit
      setIsEditMode(false);
      setEditForm({
        name: tournament.name,
        description: tournament.description || ''
      });
      setError('');
    } else {
      // Start edit
      setIsEditMode(true);
      setEditForm({
        name: tournament.name,
        description: tournament.description || ''
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!tournament || !tournamentId) return;
    
    if (!editForm.name.trim()) {
      setError('Tournament name is required');
      return;
    }

    try {
      setIsUpdating(true);
      setError('');
      
      const updateRequest: UpdateTournamentRequest = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined
      };

      const updatedTournament = await tournamentService.updateTournament(tournamentId, updateRequest);
      setTournament(updatedTournament);
      setIsEditMode(false);
      showToast('Tournament updated successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tournament');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournamentId) return;
    
try {
      setIsDeleting(true);
      setError('');
      
      await tournamentService.deleteTournament(tournamentId);
      
      showToast('Tournament deleted successfully!');
      navigate('/home');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveTournament = async () => {
    if (!tournamentId) return;
    
try {
      setIsLeaving(true);
      setError('');
      
      // First check if it's safe to leave the tournament
      const safetyCheck = await tournamentService.checkOrganizerSafety(
        currentUser.id, 
        tournamentId, 
        'LEAVE_TOURNAMENT'
      );
      
      if (!safetyCheck.canProceed) {
        // Show safety prompt instead of error
        setSafetyPromptAction('LEAVE_TOURNAMENT');
        setShowSafetyPrompt(true);
        setIsLeaving(false);
        return;
      }
      
      // Safe to proceed with leaving
      await tournamentService.removeOrganizerFromTournament(tournamentId, currentUser.id);
      
      showToast('You have left the tournament successfully!');
      navigate('/home');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave tournament');
    } finally {
      setIsLeaving(false);
    }
  };

  // Safety prompt handlers
  const handleAddOrganizer = () => {
    setShowSafetyPrompt(false);
    setActiveTab('organizers');
  };

  const handleDeleteTournamentFromPrompt = () => {
    setShowSafetyPrompt(false);
    setActiveTab('settings');
  };

  const handleRemoveReferee = async (userId: string) => {
    if (!tournamentId) return;

    if (!window.confirm('Remove this referee from the tournament?')) {
      return;
    }

    try {
      await tournamentService.removeRefereeFromTournament(tournamentId, userId);
      const [refereesData, pendingData] = await Promise.all([
        tournamentService.getTournamentReferees(tournamentId),
        tournamentService.getPendingRefereeInvitesForTournament(tournamentId),
      ]);
      setReferees(refereesData);
      setPendingRefereeInvites(pendingData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove referee');
    }
  };

  const handleLeaveAsReferee = async () => {
    if (!tournamentId) return;

try {
      setIsLeavingAsReferee(true);
      setError('');

      await tournamentService.removeRefereeFromTournament(tournamentId, currentUser.id);

      showToast('You have left the tournament successfully!');
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave tournament');
    } finally {
      setIsLeavingAsReferee(false);
    }
  };

  if (loading) {
    return (
      <div className="tournament-page">
        <div className="loading-spinner">Loading tournament...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="tournament-page">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You do not have access to this tournament. Ask an organizer to invite you as a referee.</p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="tournament-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Tournament not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const inviteOrganizer = async (email: string): Promise<boolean> => {
    if (!email.trim()) {
      setInviteError('Please enter an email address');
      return false;
    }
    if (!tournamentId) return false;
    try {
      setInvitingUser(true);
      setInviteError('');
      await tournamentService.inviteUserToTournament(tournamentId, email.trim());
      showToast('User invited successfully!');
      const organizersData = await tournamentService.getTournamentOrganizers(tournamentId);
      setOrganizers(organizersData);
      return true;
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
      return false;
    } finally {
      setInvitingUser(false);
    }
  };

  const inviteReferee = async (email: string): Promise<boolean> => {
    if (!email.trim()) {
      setRefereeInviteError('Please enter an email address');
      return false;
    }
    if (!tournamentId) return false;
    try {
      setInvitingReferee(true);
      setRefereeInviteError('');
      await tournamentService.inviteRefereeToTournament(tournamentId, email.trim());
      showToast('Referee invited successfully!');
      const [refereesData, pendingData] = await Promise.all([
        tournamentService.getTournamentReferees(tournamentId),
        tournamentService.getPendingRefereeInvitesForTournament(tournamentId),
      ]);
      setReferees(refereesData);
      setPendingRefereeInvites(pendingData);
      return true;
    } catch (err) {
      setRefereeInviteError(err instanceof Error ? err.message : 'Failed to invite referee');
      return false;
    } finally {
      setInvitingReferee(false);
    }
  };

  const searchTeamsByName = async (teamName: string) => {
    try {
      setSearchingTeams(true);
      setTeamInviteError('');
      const { teamService } = await import('../services/teamService');
      const teams = await teamService.searchTeamsByName(teamName);
      setSearchResults(teams);
    } catch (err) {
      setTeamInviteError(err instanceof Error ? err.message : 'Failed to search teams');
    } finally {
      setSearchingTeams(false);
    }
  };

  const organizersPanel = (
    <TournamentOrganizersPanel
      organizers={organizers}
      loading={loadingOrganizers}
      canManage={canManage}
      inviting={invitingUser}
      inviteError={inviteError}
      onInvite={inviteOrganizer}
    />
  );

  const refereesPanel = (
    <TournamentRefereesPanel
      referees={referees}
      pendingInvites={pendingRefereeInvites}
      loading={loadingReferees}
      canManage={canManage}
      inviting={invitingReferee}
      inviteError={refereeInviteError}
      onInvite={inviteReferee}
      onRemove={handleRemoveReferee}
    />
  );

  const teamsPanel = tournament ? (
    <TournamentTeamsPanel
      tournament={tournament}
      enrolled={enrolledTeams}
      pendingInvites={teamInvites}
      loadingEnrolled={loadingEnrolledTeams}
      loadingPending={loadingTeamInvites}
      canManage={canManage}
      searching={searchingTeams}
      inviting={invitingTeam}
      searchResults={searchResults}
      inviteError={teamInviteError}
      onSearch={searchTeamsByName}
      onInviteTeam={handleInviteTeam}
      onRemoveTeam={handleRemoveTeam}
    />
  ) : null;

  const settingsPanel = tournament ? (
    <TournamentSettingsPanel
      tournament={tournament}
      isOrganizer={isOrganizer}
      isReferee={isReferee}
      isEditMode={isEditMode}
      editForm={editForm}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
      isLeaving={isLeaving}
      isLeavingAsReferee={isLeavingAsReferee}
      notificationPrefs={notificationPrefs}
      savingNotifications={savingNotifications}
      notificationMessage={notificationMessage}
      canSaveRefereeNotifications={!!refereeTournamentId}
      panelError={activeTab === 'settings' ? error : undefined}
      onEditToggle={handleEditToggle}
      onEditFormChange={handleEditInputChange}
      onSaveChanges={handleSaveChanges}
      onDeleteTournament={handleDeleteTournament}
      onLeaveAsOrganizer={handleLeaveTournament}
      onLeaveAsReferee={handleLeaveAsReferee}
      onNotificationPrefsChange={setNotificationPrefs}
      onSaveRefereeNotifications={handleSaveRefereeNotificationPrefs}
    />
  ) : null;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <ToastBanner message={toastMessage} onDismiss={() => setToastMessage('')} />
      <WorkspaceHeader
        title={loading ? 'Loading...' : tournament?.name || 'Unknown Tournament'}
        subtitle={userRole ? `Your role: ${userRole === 'organizer' ? 'Organizer' : 'Referee'}` : undefined}
        badge={
          isReferee ? (
            <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50">
              Read-only
            </Badge>
          ) : undefined
        }
        onLogout={onLogout}
      />

      {isReferee && (
        <PageContainer className="pt-6 pb-0">
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="size-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              You are viewing this tournament as a Referee. You have read-only access to
              scheduling information.
            </AlertDescription>
          </Alert>
        </PageContainer>
      )}

      <PageContainer className="py-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as typeof activeTab)
          }
          className="space-y-6"
        >
          <TabsList className={workspaceTabsListClass}>
            {isOrganizer && (
              <>
                <TabsTrigger value="organizers" className={workspaceTabsTriggerClass}>
                  Organizers
                </TabsTrigger>
                <TabsTrigger value="referees" className={workspaceTabsTriggerClass}>
                  Referees
                </TabsTrigger>
                <TabsTrigger value="teams" className={workspaceTabsTriggerClass}>
                  Teams
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="scheduling" className={workspaceTabsTriggerClass}>
              Scheduling
            </TabsTrigger>
            <TabsTrigger value="chat" className={workspaceTabsTriggerClass}>
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className={workspaceTabsTriggerClass}>
              Settings
            </TabsTrigger>
          </TabsList>

          {isOrganizer && (
            <TabsContent value="organizers" className="mt-0 outline-none">
              {organizersPanel}
            </TabsContent>
          )}
          {isOrganizer && (
            <TabsContent value="referees" className="mt-0 outline-none">
              {refereesPanel}
            </TabsContent>
          )}
          {isOrganizer && (
            <TabsContent value="teams" className="mt-0 outline-none">
              {teamsPanel}
            </TabsContent>
          )}
          <TabsContent value="scheduling" className="mt-0 outline-none">
            <TournamentSchedule
              tournamentId={tournamentId || ''}
              tournamentName={tournament?.name || 'Tournament'}
              canManageEvents={isOrganizer}
              canAssignReferees={isOrganizer}
              tournamentReferees={referees}
            />
          </TabsContent>
          <TabsContent value="chat" className="mt-0 outline-none">
            <Chat
              scope="tournament"
              scopeId={tournamentId!}
              currentUserId={currentUser.id}
              displayName={tournament?.name || 'Loading...'}
            />
          </TabsContent>
          <TabsContent value="settings" className="mt-0 outline-none">
            {settingsPanel}
          </TabsContent>
        </Tabs>
      </PageContainer>
      
      {/* Tournament Safety Prompt */}
      <TournamentSafetyPrompt
        isOpen={showSafetyPrompt}
        onClose={() => setShowSafetyPrompt(false)}
        onAddOrganizer={handleAddOrganizer}
        onDeleteTournament={handleDeleteTournamentFromPrompt}
        tournamentName={tournament?.name}
        action={safetyPromptAction}
      />
    </div>
  );
}

export default TournamentPage;
