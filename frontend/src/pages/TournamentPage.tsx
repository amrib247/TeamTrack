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
import AppIcon from '../components/icons/AppIcon';
import { PanelCard } from '@/components/layout/PanelCard';
import { TournamentOrganizersPanel } from '@/components/tournament/TournamentOrganizersPanel';
import { TournamentRefereesPanel } from '@/components/tournament/TournamentRefereesPanel';
import { TournamentTeamsPanel } from '@/components/tournament/TournamentTeamsPanel';
import { TournamentSettingsPanel } from '@/components/tournament/TournamentSettingsPanel';
import './TournamentPage.css';

interface TournamentPageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
}

function TournamentPage({ currentUser, onLogout }: TournamentPageProps) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'organizers' | 'referees' | 'teams' | 'scheduling' | 'chat' | 'settings'
  >('organizers');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userRole, setUserRole] = useState<'organizer' | 'referee' | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const isOrganizer = userRole === 'organizer';
  const isReferee = userRole === 'referee';
  const canManage = isOrganizer;
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 4000);
  };

  // Organizers state
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);

  // Invite state
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState<string>('');

  // Settings state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Leave tournament state
  const [isLeaving, setIsLeaving] = useState(false);

  // Safety prompt state
  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
  const [safetyPromptAction, setSafetyPromptAction] = useState<
    'LEAVE_TOURNAMENT' | 'DELETE_ACCOUNT'
  >('LEAVE_TOURNAMENT');

  // Team invite state
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

  // Referee leave state
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
      } catch (err) {
        console.error('Failed to load tournament:', err);
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
        } catch (err) {
          console.error('Failed to load organizers:', err);
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
        } catch (err) {
          console.error('Failed to load referees:', err);
          setError('Failed to load referees');
        } finally {
          setLoadingReferees(false);
        }
      }
    };

    loadReferees();
  }, [activeTab, tournamentId, canManage, userRole]);

  // Fetch team invites when teams tab is active
  useEffect(() => {
    const loadTeamInvites = async () => {
      if (activeTab === 'teams' && tournamentId) {
        try {
          setLoadingTeamInvites(true);
          const invitesData = await tournamentService.getTournamentTeamInvites(tournamentId);
          const { teamService } = await import('../services/teamService');
          const enriched = await Promise.all(
            invitesData.map(async (invite) => {
              const teamId = String((invite as { teamId?: unknown }).teamId ?? '');
              if (!teamId) return invite;
              try {
                const team = await teamService.getTeam(teamId);
                return {
                  ...invite,
                  teamId,
                  teamName: team.teamName,
                  sport: team.sport,
                  ageGroup: team.ageGroup,
                };
              } catch (err) {
                console.error('Failed to load team details for invite:', err);
                return { ...invite, teamId };
              }
            })
          );
          setTeamInvites(enriched);
        } catch (err) {
          console.error('Failed to load team invites:', err);
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
          const { teamService } = await import('../services/teamService');
          const enriched = await Promise.all(
            teams.map(async (t) => {
              try {
                const team = await teamService.getTeam(t.teamId);
                return {
                  ...t,
                  teamName: team.teamName,
                  sport: team.sport,
                  ageGroup: team.ageGroup,
                };
              } catch (err) {
                console.error('Failed to load team details for enrolled team:', err);
                return t;
              }
            })
          );
          setEnrolledTeams(enriched);
        } catch (err) {
          console.error('Failed to load enrolled teams:', err);
          setError('Failed to load enrolled teams');
        } finally {
          setLoadingEnrolledTeams(false);
        }
      }
    };

    loadEnrolledTeams();
  }, [activeTab, tournamentId]);

  // Invite functions
  const handleInviteOrganizer = async (email: string): Promise<boolean> => {
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

      if (activeTab === 'organizers') {
        const organizersData = await tournamentService.getTournamentOrganizers(tournamentId);
        setOrganizers(organizersData);
      }
      return true;
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
      return false;
    } finally {
      setInvitingUser(false);
    }
  };

  const handleSearchTeams = async (teamName: string) => {
    if (!teamName.trim()) return;

    try {
      setSearchingTeams(true);
      setTeamInviteError('');

      const { teamService } = await import('../services/teamService');
      const teams = await teamService.searchTeamsByName(teamName.trim());
      setSearchResults(teams);
    } catch (err) {
      setTeamInviteError(err instanceof Error ? err.message : 'Failed to search teams');
    } finally {
      setSearchingTeams(false);
    }
  };

  const handleInviteTeam = async (teamId: string) => {
    if (!tournamentId || !tournament) return;

    if (tournament.teamCount >= tournament.maxSize) {
      setTeamInviteError('Cannot invite team - tournament is already at maximum capacity');
      return;
    }

    try {
      setInvitingTeam(true);
      setTeamInviteError('');

      const existingInvite = await tournamentService.checkExistingInvite(tournamentId, teamId);
      if (existingInvite) {
        setTeamInviteError(
          'This team already has an invite or is enrolled in the tournament'
        );
        return;
      }

      await tournamentService.inviteTeamToTournament(tournamentId, teamId);

      showToast('Team invited successfully!');
      setSearchResults([]);

      if (activeTab === 'teams') {
        const invites = await tournamentService.getTournamentTeamInvites(tournamentId);
        setTeamInvites(invites);
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

      const updatedTournament = await tournamentService.getTournamentById(tournamentId);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }

      if (activeTab === 'teams') {
        const teams = await tournamentService.getAcceptedTournamentTeamInvites(tournamentId);
        setEnrolledTeams(teams);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove team');
    }
  };

  // Settings functions
  const handleEditToggle = () => {
    if (!tournament) return;

    if (isEditMode) {
      setIsEditMode(false);
      setEditForm({ name: tournament.name, description: tournament.description || '' });
      setError('');
    } else {
      setIsEditMode(true);
      setEditForm({ name: tournament.name, description: tournament.description || '' });
    }
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
        description: editForm.description.trim() || undefined,
      };

      const updatedTournament = await tournamentService.updateTournament(
        tournamentId,
        updateRequest
      );
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

      const safetyCheck = await tournamentService.checkOrganizerSafety(
        currentUser.id,
        tournamentId,
        'LEAVE_TOURNAMENT'
      );

      if (!safetyCheck.canProceed) {
        setSafetyPromptAction('LEAVE_TOURNAMENT');
        setShowSafetyPrompt(true);
        setIsLeaving(false);
        return;
      }

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

  const handleInviteReferee = async (email: string): Promise<boolean> => {
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

      if (activeTab === 'referees') {
        const [refereesData, pendingData] = await Promise.all([
          tournamentService.getTournamentReferees(tournamentId),
          tournamentService.getPendingRefereeInvitesForTournament(tournamentId),
        ]);
        setReferees(refereesData);
        setPendingRefereeInvites(pendingData);
      }
      return true;
    } catch (err) {
      setRefereeInviteError(err instanceof Error ? err.message : 'Failed to invite referee');
      return false;
    } finally {
      setInvitingReferee(false);
    }
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
      alert(err instanceof Error ? err.message : 'Failed to remove referee');
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
          <p>
            You do not have access to this tournament. Ask an organizer to invite you as a
            referee.
          </p>
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'organizers':
        return (
          <TournamentOrganizersPanel
            organizers={organizers}
            loading={loadingOrganizers}
            canManage={canManage}
            inviting={invitingUser}
            inviteError={inviteError}
            onInvite={handleInviteOrganizer}
          />
        );
      case 'referees':
        return (
          <TournamentRefereesPanel
            referees={referees}
            pendingInvites={pendingRefereeInvites}
            loading={loadingReferees}
            canManage={canManage}
            inviting={invitingReferee}
            inviteError={refereeInviteError}
            onInvite={handleInviteReferee}
            onRemove={handleRemoveReferee}
          />
        );
      case 'teams':
        return (
          <TournamentTeamsPanel
            tournament={{ maxSize: tournament.maxSize, teamCount: tournament.teamCount }}
            enrolled={enrolledTeams}
            pendingInvites={teamInvites}
            loadingEnrolled={loadingEnrolledTeams}
            loadingPending={loadingTeamInvites}
            canManage={canManage}
            searching={searchingTeams}
            inviting={invitingTeam}
            searchResults={searchResults}
            inviteError={teamInviteError}
            onSearch={handleSearchTeams}
            onInviteTeam={handleInviteTeam}
            onRemoveTeam={handleRemoveTeam}
          />
        );
      case 'scheduling':
        return (
          <PanelCard title="Scheduling" description="Tournament games and brackets">
            <TournamentSchedule
              tournamentId={tournamentId!}
              tournamentName={tournament?.name || 'Tournament'}
              canManageEvents={isOrganizer}
              canAssignReferees={isOrganizer}
              tournamentReferees={referees}
            />
          </PanelCard>
        );
      case 'chat':
        return (
          <div className="content-chat">
            <Chat
              scope="tournament"
              scopeId={tournamentId!}
              currentUserId={currentUser.id}
              displayName={tournament.name}
            />
          </div>
        );
      case 'settings':
        return (
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
            panelError={error}
            onEditToggle={handleEditToggle}
            onEditFormChange={handleEditInputChange}
            onSaveChanges={handleSaveChanges}
            onDeleteTournament={handleDeleteTournament}
            onLeaveAsOrganizer={handleLeaveTournament}
            onLeaveAsReferee={handleLeaveAsReferee}
            onNotificationPrefsChange={setNotificationPrefs}
            onSaveRefereeNotifications={handleSaveRefereeNotificationPrefs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tournament-page">
      {/* Header (unchanged) */}
      <div className="tournament-header app-shell-header">
        <button className="btn btn-back" onClick={() => navigate('/home')}>
          ← Back to Home
        </button>
        <div className="tournament-header-center">
          <h1>{loading ? 'Loading...' : tournament?.name || 'Unknown Tournament'}</h1>
          {isReferee && (
            <span className="referee-view-badge">Viewing as referee (read-only)</span>
          )}
        </div>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="tournament-layout app-shell-layout">
        {/* Sidebar (unchanged) */}
        <div className="tournament-sidebar app-shell-sidebar">
          <nav
            className="sidebar-nav tournament-sidebar-nav"
            aria-label="Tournament sections"
          >
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'organizers' ? 'active' : ''}`}
              onClick={() => setActiveTab('organizers')}
            >
              <span className="sidebar-icon">
                <AppIcon name="crown" size={18} />
              </span>
              <span className="sidebar-text">Organizers</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'referees' ? 'active' : ''}`}
              onClick={() => setActiveTab('referees')}
              aria-label="Referees"
            >
              <span className="sidebar-icon">
                <AppIcon name="shield" size={18} />
              </span>
              <span className="sidebar-text">Referees</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <span className="sidebar-icon">
                <AppIcon name="users" size={18} />
              </span>
              <span className="sidebar-text">Teams</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'scheduling' ? 'active' : ''}`}
              onClick={() => setActiveTab('scheduling')}
            >
              <span className="sidebar-icon">
                <AppIcon name="calendar" size={18} />
              </span>
              <span className="sidebar-text">Scheduling</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <span className="sidebar-icon">
                <AppIcon name="message" size={18} />
              </span>
              <span className="sidebar-text">Chat</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="sidebar-icon">
                <AppIcon name="settings" size={18} />
              </span>
              <span className="sidebar-text">Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="tournament-content app-shell-main-card">{renderTabContent()}</div>
      </div>

      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-md bg-green-600 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}

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
