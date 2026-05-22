import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReminderLeadTime, AuthResponse } from '../types/Auth';
import { teamService, type TeamMember } from '../services/teamService';
import { tournamentService } from '../services/tournamentService';
import Schedule from '../components/Schedule';
import TaskList from '../components/TaskList';
import Chat from '../components/Chat';
import AppIcon from '../components/icons/AppIcon';
import { TeamRosterPanel } from '@/components/team/TeamRosterPanel';
import { TeamTournamentsPanel } from '@/components/team/TeamTournamentsPanel';
import { TeamSettingsPanel } from '@/components/team/TeamSettingsPanel';
import './TeamPage.css';

interface TeamPageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
  onRefreshUserData?: () => Promise<void>;
}

function TeamPage({ currentUser, onLogout, onRefreshUserData }: TeamPageProps) {
  const { teamId: userTeamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('roster');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 4000);
  };

  // Team editing states
  const [editTeamForm, setEditTeamForm] = useState({
    teamName: '',
    sport: '',
    ageGroup: '',
    description: '',
    profilePhotoUrl: '',
  });
  const [editingTeam, setEditingTeam] = useState(false);
  const [error, setError] = useState<string>('');
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);

  const userTeam = currentUser.teams.find((team) => team.id === userTeamId);

  const [teamDetails, setTeamDetails] = useState<{
    teamName: string;
    sport: string;
    ageGroup: string;
    description?: string;
    profilePhotoUrl?: string;
  } | null>(null);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(true);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'PLAYER' });
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState<string>('');

  const [coachCount, setCoachCount] = useState<number>(0);
  const [loadingCoachCount, setLoadingCoachCount] = useState(false);
  const [showCoachSafetyModal, setShowCoachSafetyModal] = useState(false);

  const [tournamentInvites, setTournamentInvites] = useState<any[]>([]);
  const [loadingTournamentInvites, setLoadingTournamentInvites] = useState(false);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [tournamentDetails, setTournamentDetails] = useState<{ [key: string]: any }>({});

  const [enrolledTournaments, setEnrolledTournaments] = useState<any[]>([]);
  const [loadingEnrolledTournaments, setLoadingEnrolledTournaments] = useState(false);

  const [leavingTournament, setLeavingTournament] = useState<string | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotificationsEnabled: true,
    reminderLeadTime: '1d' as ReminderLeadTime,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Early return if userTeam is not found
  if (!userTeam) {
    return (
      <div className="team-page">
        <div className="empty-state">
          <AppIcon name="alert" size={32} />
          <h2 className="empty-state-title">Team not found</h2>
          <p className="empty-state-desc">
            You don&apos;t have access to this team or it doesn&apos;t exist.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!userTeam) return;
      try {
        setLoadingTeamDetails(true);
        const team = await teamService.getTeam(userTeam.teamId);
        if (team) {
          setTeamDetails({
            teamName: team.teamName,
            sport: team.sport,
            ageGroup: team.ageGroup,
            description: team.description,
            profilePhotoUrl: team.profilePhotoUrl,
          });
        } else {
          setError('Team not found');
        }
      } catch (err) {
        console.error('Failed to fetch team details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch team details');
      } finally {
        setLoadingTeamDetails(false);
      }
    };
    fetchTeamDetails();
  }, [userTeam]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (activeTab === 'roster' && userTeam?.teamId) {
        try {
          setLoadingTeamMembers(true);
          const members = await teamService.getTeamMembers(userTeam.teamId);
          setTeamMembers(members);
        } catch (err) {
          console.error('Failed to fetch team members:', err);
          setError('Failed to load team roster');
        } finally {
          setLoadingTeamMembers(false);
        }
      }
    };
    fetchTeamMembers();
  }, [activeTab, userTeam]);

  useEffect(() => {
    const fetchCoachCount = async () => {
      if (activeTab === 'roster' && userTeam?.teamId) {
        try {
          setLoadingCoachCount(true);
          const count = await teamService.getCoachCount(userTeam.teamId);
          setCoachCount(count);
        } catch (err) {
          console.error('Failed to fetch coach count:', err);
        } finally {
          setLoadingCoachCount(false);
        }
      }
    };
    fetchCoachCount();
  }, [activeTab, userTeam]);

  useEffect(() => {
    const fetchTournamentInvites = async () => {
      if (activeTab === 'tournaments' && userTeam?.teamId) {
        try {
          setLoadingTournamentInvites(true);
          const invites = await teamService.getTournamentInvites(userTeam.teamId);
          setTournamentInvites(invites);

          const tournamentDetailsMap: { [key: string]: any } = {};
          for (const invite of invites) {
            try {
              const tournament = await tournamentService.getTournamentById(invite.tournamentId);
              if (tournament) {
                tournamentDetailsMap[invite.tournamentId] = tournament;
              }
            } catch (err) {
              console.error('Failed to fetch tournament details for:', invite.tournamentId, err);
            }
          }
          setTournamentDetails((prev) => ({ ...prev, ...tournamentDetailsMap }));
        } catch (err) {
          console.error('Failed to fetch tournament invites:', err);
          setError('Failed to load tournament invites');
        } finally {
          setLoadingTournamentInvites(false);
        }
      }
    };
    fetchTournamentInvites();
  }, [activeTab, userTeam]);

  const fetchEnrolledTournaments = async () => {
    if (!userTeam?.teamId) return;
    try {
      setLoadingEnrolledTournaments(true);
      const tournaments = await teamService.getAcceptedTournamentInvites(userTeam.teamId);
      setEnrolledTournaments(tournaments);

      const tournamentDetailsMap: { [key: string]: any } = {};
      for (const tournamentInvite of tournaments) {
        try {
          const tournament = await tournamentService.getTournamentById(
            tournamentInvite.tournamentId
          );
          if (tournament) {
            tournamentDetailsMap[tournamentInvite.tournamentId] = tournament;
          }
        } catch (err) {
          console.error(
            'Failed to fetch tournament details for:',
            tournamentInvite.tournamentId,
            err
          );
        }
      }
      setTournamentDetails((prev) => ({ ...prev, ...tournamentDetailsMap }));
    } catch (err) {
      console.error('Failed to fetch enrolled tournaments:', err);
      setError('Failed to load enrolled tournaments');
    } finally {
      setLoadingEnrolledTournaments(false);
    }
  };

  useEffect(() => {
    fetchEnrolledTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userTeam]);

  useEffect(() => {
    if (!userTeam) return;
    setNotificationPrefs({
      emailNotificationsEnabled: userTeam.emailNotificationsEnabled !== false,
      reminderLeadTime: userTeam.reminderLeadTime ?? '1d',
    });
  }, [userTeam?.id, userTeam?.emailNotificationsEnabled, userTeam?.reminderLeadTime]);

  const handleSaveNotificationPrefs = async () => {
    if (!userTeamId || !userTeam) return;
    setSavingNotifications(true);
    setNotificationMessage('');
    try {
      await teamService.updateNotificationPreferences(
        userTeamId,
        currentUser.id,
        notificationPrefs
      );
      if (onRefreshUserData) {
        await onRefreshUserData();
      }
      setNotificationMessage('Reminder preferences saved.');
    } catch (err) {
      setNotificationMessage(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleEditTeamInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditTeamForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetEditForm = () => {
    if (teamDetails) {
      setEditTeamForm({
        teamName: teamDetails.teamName,
        sport: teamDetails.sport,
        ageGroup: teamDetails.ageGroup,
        description: teamDetails.description || '',
        profilePhotoUrl: teamDetails.profilePhotoUrl || '',
      });
      setTeamPhotoPreview(teamDetails.profilePhotoUrl || null);
      setTeamPhotoFile(null);
    }
    setError('');
  };

  const handleTeamPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamPhotoFile(file);
      setTeamPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removeTeamPhoto = () => {
    setTeamPhotoFile(null);
    setTeamPhotoPreview(null);
    setEditTeamForm((prev) => ({ ...prev, profilePhotoUrl: '' }));
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editTeamForm.teamName.trim() || !editTeamForm.sport || !editTeamForm.ageGroup) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setEditingTeam(true);
      setError('');

      let photoUrl = editTeamForm.profilePhotoUrl;
      if (teamPhotoFile) {
        const reader = new FileReader();
        photoUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(teamPhotoFile);
        });
      }

      const updateRequest = { ...editTeamForm, profilePhotoUrl: photoUrl };

      if (!userTeam.teamId) {
        throw new Error('Team ID is missing from userTeam object');
      }

      const updatedTeam = await teamService.updateTeam(userTeam.teamId, updateRequest);

      setTeamDetails({
        teamName: updatedTeam.teamName,
        sport: updatedTeam.sport,
        ageGroup: updatedTeam.ageGroup,
        description: updatedTeam.description,
        profilePhotoUrl: updatedTeam.profilePhotoUrl,
      });

      setEditTeamForm({
        teamName: updatedTeam.teamName,
        sport: updatedTeam.sport,
        ageGroup: updatedTeam.ageGroup,
        description: updatedTeam.description || '',
        profilePhotoUrl: updatedTeam.profilePhotoUrl || '',
      });

      if (updatedTeam.profilePhotoUrl) {
        setTeamPhotoPreview(updatedTeam.profilePhotoUrl);
      }

      showToast('Team updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setEditingTeam(false);
    }
  };

  const handleTerminateTeam = async () => {
    try {
      setError('');
      await teamService.terminateTeam(userTeam.teamId);
      showToast('Team terminated successfully!');
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate team');
    }
  };

  const handleLeaveTeam = async () => {
    try {
      setError('');
      await teamService.leaveTeam(userTeamId!, currentUser.id);
      showToast('You have left the team successfully!');
      navigate('/home');
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave team';
      if (errorMessage.includes('You are the only coach')) {
        setShowCoachSafetyModal(true);
        setError('');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleInviteUser = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();

    if (!inviteForm.email.trim() || !inviteForm.role) {
      setInviteError('Please fill in all fields');
      return false;
    }

    try {
      setInvitingUser(true);
      setInviteError('');

      await teamService.inviteUserToTeam(userTeam.teamId, inviteForm.email, inviteForm.role);

      showToast('User invited successfully!');
      setInviteForm({ email: '', role: 'PLAYER' });

      if (activeTab === 'roster') {
        const members = await teamService.getTeamMembers(userTeam.teamId);
        setTeamMembers(members);
      }
      return true;
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
      return false;
    } finally {
      setInvitingUser(false);
    }
  };

  const handleAcceptTournamentInvite = async (inviteId: string) => {
    if (!userTeam?.teamId) return;
    try {
      setProcessingInvite(inviteId);
      setError('');
      await tournamentService.acceptTournamentInvite(inviteId);
      showToast('Tournament invite accepted successfully!');
      setTournamentInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      await fetchEnrolledTournaments();
    } catch (err) {
      console.error('Error in handleAcceptTournamentInvite:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept tournament invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeclineTournamentInvite = async (inviteId: string) => {
    try {
      setProcessingInvite(inviteId);
      setError('');
      await tournamentService.declineTournamentInvite(inviteId);
      showToast('Tournament invite declined successfully!');
      setTournamentInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline tournament invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleLeaveTournament = async (tournamentInviteId: string, tournamentId: string) => {
    if (!userTeam?.teamId) return;
    if (!window.confirm('Are you sure you want to leave this tournament?')) return;

    try {
      setLeavingTournament(tournamentInviteId);
      setError('');
      await teamService.leaveTournament(userTeam.teamId, tournamentId);
      showToast('Successfully left the tournament!');
      await fetchEnrolledTournaments();
    } catch (err) {
      console.error('Error in handleLeaveTournament:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave tournament');
    } finally {
      setLeavingTournament(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'roster':
        return (
          <TeamRosterPanel
            userRole={userTeam.role}
            currentUserId={currentUser.id}
            teamMembers={teamMembers}
            loading={loadingTeamMembers}
            coachCount={coachCount}
            loadingCoachCount={loadingCoachCount}
            inviteForm={inviteForm}
            inviteError={inviteError}
            invitingUser={invitingUser}
            onInviteFormChange={setInviteForm}
            onInviteSubmit={handleInviteUser}
            onUpdateRole={async (memberId, role) => {
              try {
                setError('');
                await teamService.updateUserRole(memberId, role);
                setTeamMembers((prev) =>
                  prev.map((m) => (m.id === memberId ? { ...m, role } : m))
                );
                showToast('User role updated successfully!');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to update user role');
                throw err;
              }
            }}
            onRemoveMember={async (member) => {
              try {
                setError('');
                await teamService.removeUserFromTeam(member.id);
                setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
                showToast('User removed from team successfully!');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to remove user from team');
                throw err;
              }
            }}
            panelError={activeTab === 'roster' ? error : undefined}
          />
        );
      case 'schedule':
        return (
          <Schedule
            teamId={userTeam.teamId}
            userRole={userTeam.role}
            teamName={teamDetails?.teamName || 'Loading...'}
            currentUserId={currentUser.id}
          />
        );
      case 'tasks':
        return (
          <TaskList
            teamId={userTeam.teamId}
            userRole={userTeam.role}
            teamName={teamDetails?.teamName || 'Loading...'}
            currentUserId={currentUser.id}
          />
        );
      case 'chat':
        return (
          <div className="content-chat">
            <Chat
              scope="team"
              scopeId={userTeam.teamId}
              currentUserId={currentUser.id}
              displayName={teamDetails?.teamName || 'Loading...'}
            />
          </div>
        );
      case 'tournaments':
        return (
          <TeamTournamentsPanel
            invites={tournamentInvites}
            enrolled={enrolledTournaments}
            tournamentDetails={tournamentDetails}
            loadingInvites={loadingTournamentInvites}
            loadingEnrolled={loadingEnrolledTournaments}
            processingInviteId={processingInvite}
            leavingTournamentId={leavingTournament}
            onAcceptInvite={handleAcceptTournamentInvite}
            onDeclineInvite={handleDeclineTournamentInvite}
            onLeaveTournament={handleLeaveTournament}
            panelError={activeTab === 'tournaments' ? error : undefined}
          />
        );
      case 'settings':
        return (
          <TeamSettingsPanel
            userRole={userTeam.role}
            joinedAt={userTeam.joinedAt}
            teamDetails={teamDetails}
            loadingTeamDetails={loadingTeamDetails}
            editForm={editTeamForm}
            teamPhotoPreview={teamPhotoPreview}
            editingTeam={editingTeam}
            notificationPrefs={notificationPrefs}
            savingNotifications={savingNotifications}
            notificationMessage={notificationMessage}
            panelError={activeTab === 'settings' ? error : undefined}
            onEditFormChange={handleEditTeamInputChange}
            onPhotoUpload={handleTeamPhotoUpload}
            onRemovePhoto={removeTeamPhoto}
            onResetForm={resetEditForm}
            onSaveTeam={handleEditTeam}
            onNotificationPrefsChange={setNotificationPrefs}
            onSaveNotifications={handleSaveNotificationPrefs}
            onLeaveTeam={handleLeaveTeam}
            onTerminateTeam={handleTerminateTeam}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="team-page">
      {/* Header (unchanged) */}
      <div className="team-header app-shell-header">
        <button className="btn btn-back" onClick={handleBackToHome}>
          ← Back to Home
        </button>
        <h1>{loadingTeamDetails ? 'Loading...' : teamDetails?.teamName || 'Unknown Team'}</h1>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="team-layout app-shell-layout">
        {/* Sidebar (unchanged) */}
        <div className="team-sidebar app-shell-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => handleTabChange('roster')}
            >
              <span className="sidebar-icon">
                <AppIcon name="users" size={18} />
              </span>
              <span className="sidebar-text">Roster</span>
            </button>

            <button
              className={`sidebar-item ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => handleTabChange('schedule')}
            >
              <span className="sidebar-icon">
                <AppIcon name="calendar" size={18} />
              </span>
              <span className="sidebar-text">Schedule</span>
            </button>

            <button
              className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => handleTabChange('tasks')}
            >
              <span className="sidebar-icon">
                <AppIcon name="check" size={18} />
              </span>
              <span className="sidebar-text">Tasks</span>
            </button>

            <button
              className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => handleTabChange('chat')}
            >
              <span className="sidebar-icon">
                <AppIcon name="message" size={18} />
              </span>
              <span className="sidebar-text">Chat</span>
            </button>

            {userTeam.role === 'COACH' && (
              <button
                className={`sidebar-item ${activeTab === 'tournaments' ? 'active' : ''}`}
                onClick={() => handleTabChange('tournaments')}
              >
                <span className="sidebar-icon">
                  <AppIcon name="trophy" size={18} />
                </span>
                <span className="sidebar-text">Tournaments</span>
              </button>
            )}

            <button
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <span className="sidebar-icon">
                <AppIcon name="settings" size={18} />
              </span>
              <span className="sidebar-text">Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="team-content app-shell-main-card">{renderContent()}</div>
      </div>

      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-md bg-green-600 px-4 py-3 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Coach Safety Modal */}
      {showCoachSafetyModal && (
        <div className="modal-overlay" onClick={() => setShowCoachSafetyModal(false)}>
          <div className="modal coach-safety-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              <AppIcon name="alert" size={20} /> Coach Safety Check
            </h3>
            <p>
              You are the only coach of this team. You must take action before you can leave the
              team.
            </p>

            <div className="coach-safety-options">
              <div className="option-card">
                <h4>
                  <AppIcon name="crown" size={18} /> Promote Someone to Coach
                </h4>
                <p>Promote another team member to coach so you can leave safely.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowCoachSafetyModal(false);
                    handleTabChange('roster');
                  }}
                >
                  Go to Roster
                </button>
              </div>

              <div className="option-card">
                <h4>
                  <AppIcon name="trash" size={18} /> Delete Team
                </h4>
                <p>Delete the entire team if you no longer want to manage it.</p>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setShowCoachSafetyModal(false);
                    handleTabChange('settings');
                  }}
                >
                  Go to Settings
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCoachSafetyModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamPage;
