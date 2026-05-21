import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReminderLeadTime, AuthResponse } from '../types/Auth';
import { teamService, type TeamMember } from '../services/teamService';
import { tournamentService } from '../services/tournamentService';
import Schedule from '../components/Schedule';
import TaskList from '../components/TaskList';
import Chat from '../components/Chat';
import AppIcon from '../components/icons/AppIcon';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToastBanner } from '@/components/layout/ToastBanner';
import { TeamRosterPanel } from '@/components/team/TeamRosterPanel';
import { TeamTournamentsPanel } from '@/components/team/TeamTournamentsPanel';
import { TeamSettingsPanel } from '@/components/team/TeamSettingsPanel';
import {
  workspaceTabsListClass,
  workspaceTabsTriggerClass,
} from '@/components/team/workspaceTabs';

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
    profilePhotoUrl: ''
  });
  const [editingTeam, setEditingTeam] = useState(false);
  const [error, setError] = useState<string>('');
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);

  
  // Find the team data for the current user
  // Note: teamId in URL is actually the userTeams document ID
  const userTeam = currentUser.teams.find(team => team.id === userTeamId);
  
  // State for team details
  const [teamDetails, setTeamDetails] = useState<{
    teamName: string;
    sport: string;
    ageGroup: string;
    description?: string;
    profilePhotoUrl?: string;
  } | null>(null);
  const [loadingTeamDetails, setLoadingTeamDetails] = useState(true);
  
  // State for team members (roster)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  
  // State for invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'PLAYER'
  });
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState<string>('');

  // State for coach count
  const [coachCount, setCoachCount] = useState<number>(0);
  const [loadingCoachCount, setLoadingCoachCount] = useState(false);
  const [showCoachSafetyModal, setShowCoachSafetyModal] = useState(false);


  // State for tournament invites
  const [tournamentInvites, setTournamentInvites] = useState<any[]>([]);
  const [loadingTournamentInvites, setLoadingTournamentInvites] = useState(false);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [tournamentDetails, setTournamentDetails] = useState<{[key: string]: any}>({});
  
  // State for enrolled tournaments
  const [enrolledTournaments, setEnrolledTournaments] = useState<any[]>([]);
  const [loadingEnrolledTournaments, setLoadingEnrolledTournaments] = useState(false);

  // State for leaving tournaments
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
  
  // Fetch team details when component mounts
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
            profilePhotoUrl: team.profilePhotoUrl
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

  // Fetch team members when roster tab is active
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (activeTab === 'roster' && userTeam?.teamId) {
        try {
          setLoadingTeamMembers(true);
          const members = await teamService.getTeamMembers(userTeam.teamId);
          setTeamMembers(members);
        } catch (error) {
          console.error('❌ Failed to fetch team members:', error);
          setError('Failed to load team roster');
        } finally {
          setLoadingTeamMembers(false);
        }
      }
    };
    
    fetchTeamMembers();
  }, [activeTab, userTeam]);

  // Fetch coach count when roster tab is active
  useEffect(() => {
    const fetchCoachCount = async () => {
      if (activeTab === 'roster' && userTeam?.teamId) {
        try {
          setLoadingCoachCount(true);
          const count = await teamService.getCoachCount(userTeam.teamId);
          setCoachCount(count);
        } catch (error) {
          console.error('❌ Failed to fetch coach count:', error);
          setError('Failed to load coach count');
        } finally {
          setLoadingCoachCount(false);
        }
      }
    };
    
    fetchCoachCount();
  }, [activeTab, userTeam]);

  // Fetch tournament invites when tournaments tab is active
  useEffect(() => {
    const fetchTournamentInvites = async () => {
      if (activeTab === 'tournaments' && userTeam?.teamId) {
        try {
          setLoadingTournamentInvites(true);
          const invites = await teamService.getTournamentInvites(userTeam.teamId);
          setTournamentInvites(invites);
          
          // Fetch tournament details for each invite
          const tournamentDetailsMap: {[key: string]: any} = {};
          for (const invite of invites) {
            try {
              const tournament = await tournamentService.getTournamentById(invite.tournamentId);
              if (tournament) {
                tournamentDetailsMap[invite.tournamentId] = tournament;
              }
            } catch (error) {
              console.error('❌ Failed to fetch tournament details for:', invite.tournamentId, error);
            }
          }
          setTournamentDetails(tournamentDetailsMap);
        } catch (error) {
          console.error('❌ Failed to fetch tournament invites:', error);
          setError('Failed to load tournament invites');
        } finally {
          setLoadingTournamentInvites(false);
        }
      }
    };
    
    fetchTournamentInvites();
  }, [activeTab, userTeam]);

  // Fetch enrolled tournaments when tournaments tab is active
  const fetchEnrolledTournaments = async () => {
    
    if (userTeam?.teamId) {
      try {
        setLoadingEnrolledTournaments(true);
        const tournaments = await teamService.getAcceptedTournamentInvites(userTeam.teamId);
        setEnrolledTournaments(tournaments);
        
        // Fetch tournament details for each enrolled tournament
        const tournamentDetailsMap: {[key: string]: any} = {};
        for (const tournamentInvite of tournaments) {
          try {
            const tournament = await tournamentService.getTournamentById(tournamentInvite.tournamentId);
            if (tournament) {
              tournamentDetailsMap[tournamentInvite.tournamentId] = tournament;
            }
          } catch (error) {
            console.error('❌ Failed to fetch tournament details for:', tournamentInvite.tournamentId, error);
          }
        }
        setTournamentDetails(prev => ({ ...prev, ...tournamentDetailsMap }));
      } catch (error) {
        console.error('❌ Failed to fetch enrolled tournaments:', error);
        setError('Failed to load enrolled tournaments');
      } finally {
        setLoadingEnrolledTournaments(false);
      }
    } else {
    }
  };

  useEffect(() => {
    fetchEnrolledTournaments();
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
      await teamService.updateNotificationPreferences(userTeamId, currentUser.id, notificationPrefs);
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

  const handleEditTeamInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditTeamForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetEditForm = () => {
    if (teamDetails) {
      setEditTeamForm({
        teamName: teamDetails.teamName,
        sport: teamDetails.sport,
        ageGroup: teamDetails.ageGroup,
        description: teamDetails.description || '',
        profilePhotoUrl: teamDetails.profilePhotoUrl || ''
      });
      // Reset photo preview
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
    setEditTeamForm(prev => ({
      ...prev,
      profilePhotoUrl: ''
    }));
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
      
      // Handle photo upload if there's a new photo file
      let photoUrl = editTeamForm.profilePhotoUrl;
      if (teamPhotoFile) {
        // Convert file to data URL for now (in production, upload to cloud storage)
        const reader = new FileReader();
        photoUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(teamPhotoFile);
        });
      }
      
      // Prepare update request
      const updateRequest = {
        ...editTeamForm,
        profilePhotoUrl: photoUrl
      };
      
      // Call the backend API to update team
      
      if (!userTeam.teamId) {
        throw new Error('Team ID is missing from userTeam object');
      }
      
      const updatedTeam = await teamService.updateTeam(userTeam.teamId, updateRequest);
       
       // Update the local teamDetails state with the new values
       setTeamDetails({
         teamName: updatedTeam.teamName,
         sport: updatedTeam.sport,
         ageGroup: updatedTeam.ageGroup,
         description: updatedTeam.description,
         profilePhotoUrl: updatedTeam.profilePhotoUrl
       });
       
       // Update the edit form to show the new values
       setEditTeamForm({
         teamName: updatedTeam.teamName,
         sport: updatedTeam.sport,
         ageGroup: updatedTeam.ageGroup,
         description: updatedTeam.description || '',
         profilePhotoUrl: updatedTeam.profilePhotoUrl || ''
       });
       
       // Update photo preview if changed
       if (updatedTeam.profilePhotoUrl) {
         setTeamPhotoPreview(updatedTeam.profilePhotoUrl);
       }
       
       // Show success message
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
      
      // Call the backend API to terminate team
      await teamService.terminateTeam(userTeam.teamId);
      
      // Show success message and redirect
      showToast('Team terminated successfully!');
      navigate('/home');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate team');
    }
  };

  const handleLeaveTeam = async () => {
    try {
      setError('');
      
      // Call the backend API to leave team
      await teamService.leaveTeam(userTeamId!, currentUser.id);
      
      // Show success message and redirect
      showToast('You have left the team successfully!');
      
      // Refresh user data to update the home page
      // We need to navigate back to home first, then refresh
      navigate('/home');
      
      // Force a page reload to ensure the home page shows updated data
      window.location.reload();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave team';
      
      // Check if this is a coach safety error
      if (errorMessage.includes("You are the only coach")) {
        // Show the coach safety modal instead of error message
        setShowCoachSafetyModal(true);
        // Clear any existing error message
        setError('');
      } else {
        // Only show error message if it's not a coach safety issue
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

  // Tournament invite handlers
  const handleAcceptTournamentInvite = async (inviteId: string) => {
    
    if (!userTeam?.teamId) {
      return;
    }
    
    try {
      setProcessingInvite(inviteId);
      setError('');
      
      // Import tournamentService dynamically to avoid circular dependencies
      const { tournamentService } = await import('../services/tournamentService');
      
      await tournamentService.acceptTournamentInvite(inviteId);
      
      // Show success message
      showToast('Tournament invite accepted successfully!');
      
      // Remove the accepted invite from the list
      setTournamentInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
      // Refresh enrolled tournaments to show the newly accepted tournament
      await fetchEnrolledTournaments();
      
    } catch (err) {
      console.error('❌ Error in handleAcceptTournamentInvite:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept tournament invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeclineTournamentInvite = async (inviteId: string) => {
    try {
      setProcessingInvite(inviteId);
      setError('');
      
      // Import tournamentService dynamically to avoid circular dependencies
      const { tournamentService } = await import('../services/tournamentService');
      await tournamentService.declineTournamentInvite(inviteId);
      
      // Show success message
      showToast('Tournament invite declined successfully!');
      
      // Remove the declined invite from the list
      setTournamentInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline tournament invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleLeaveTournament = async (tournamentInviteId: string, tournamentId: string) => {
    
    if (!userTeam?.teamId) {
      return;
    }
    
    if (!window.confirm('Are you sure you want to leave this tournament?')) {
      return;
    }
    
    try {
      setLeavingTournament(tournamentInviteId);
      setError('');
      
      // Import teamService dynamically to avoid circular dependencies
      const { teamService } = await import('../services/teamService');
      
      await teamService.leaveTournament(userTeam.teamId, tournamentId);
      
      // Show success message
      showToast('Successfully left the tournament!');
      
      // Refresh enrolled tournaments from server to ensure data consistency
      await fetchEnrolledTournaments();
      
    } catch (err) {
      console.error('❌ Error in handleLeaveTournament:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave tournament');
    } finally {
      setLeavingTournament(null);
    }
  };

  const rosterPanel = (
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

  const tournamentsPanel = (
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

  const settingsPanel = (
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

  const isCoach = userTeam?.role === 'COACH';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <ToastBanner message={toastMessage} onDismiss={() => setToastMessage('')} />
      <WorkspaceHeader
        title={loadingTeamDetails ? 'Loading...' : teamDetails?.teamName || 'Unknown Team'}
        subtitle={
          userTeam
            ? `Your role: ${userTeam.role === 'COACH' ? 'Coach' : 'Player'}`
            : undefined
        }
        onLogout={onLogout}
      />

      <PageContainer className="py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={workspaceTabsListClass}>
            <TabsTrigger value="roster" className={workspaceTabsTriggerClass}>
              Roster
            </TabsTrigger>
            <TabsTrigger value="schedule" className={workspaceTabsTriggerClass}>
              Schedule
            </TabsTrigger>
            <TabsTrigger value="tasks" className={workspaceTabsTriggerClass}>
              Tasks
            </TabsTrigger>
            <TabsTrigger value="chat" className={workspaceTabsTriggerClass}>
              Chat
            </TabsTrigger>
            {isCoach && (
              <TabsTrigger value="tournaments" className={workspaceTabsTriggerClass}>
                Tournaments
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className={workspaceTabsTriggerClass}>
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="mt-0 outline-none">
            {rosterPanel}
          </TabsContent>
          <TabsContent value="schedule" className="mt-0 outline-none">
            <Schedule
              teamId={userTeam.teamId}
              userRole={userTeam.role}
              teamName={teamDetails?.teamName || 'Loading...'}
              currentUserId={currentUser.id}
            />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0 outline-none">
            <TaskList
              teamId={userTeam.teamId}
              userRole={userTeam.role}
              teamName={teamDetails?.teamName || 'Loading...'}
              currentUserId={currentUser.id}
            />
          </TabsContent>
          <TabsContent value="chat" className="mt-0 outline-none">
            <Chat
              scope="team"
              scopeId={userTeam.teamId}
              currentUserId={currentUser.id}
              displayName={teamDetails?.teamName || 'Loading...'}
            />
          </TabsContent>
          {isCoach && (
            <TabsContent value="tournaments" className="mt-0 outline-none">
              {tournamentsPanel}
            </TabsContent>
          )}
          <TabsContent value="settings" className="mt-0 outline-none">
            {settingsPanel}
          </TabsContent>
        </Tabs>
      </PageContainer>

      {/* Coach Safety Modal */}
      {showCoachSafetyModal && (
        <div className="modal-overlay" onClick={() => setShowCoachSafetyModal(false)}>
          <div className="modal coach-safety-modal" onClick={(e) => e.stopPropagation()}>
            <h3><AppIcon name="alert" size={20} /> Coach Safety Check</h3>
            <p>You are the only coach of this team. You must take action before you can leave the team.</p>
            
            <div className="coach-safety-options">
              <div className="option-card">
                <h4><AppIcon name="crown" size={18} /> Promote Someone to Coach</h4>
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
                <h4><AppIcon name="trash" size={18} /> Delete Team</h4>
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
