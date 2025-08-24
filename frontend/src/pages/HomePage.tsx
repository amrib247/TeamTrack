import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService, type CreateTeamRequest } from '../services/teamService';
import { tournamentService } from '../services/tournamentService';
import { authService } from '../services/authService';
import type { AuthResponse, UserTeam, Tournament, CreateTournamentRequest } from '../types/Auth';
// Tournament component will be loaded dynamically
import './HomePage.css';

interface HomePageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
  onRefreshUserData: () => Promise<void>;
}

function HomePage({ currentUser, onLogout, onRefreshUserData }: HomePageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  // Settings modal states (restored)
  const [showSettings, setShowSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [editPassword, setEditPassword] = useState('');
  const [terminatePassword, setTerminatePassword] = useState('');
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminateConfirm, setTerminateConfirm] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create Team modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [createTeamForm, setCreateTeamForm] = useState({
    teamName: '',
    ageGroup: '',
    sport: '',
    description: ''
  });
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const teamPhotoInputRef = useRef<HTMLInputElement>(null);
  
     // Team details state
   const [teamDetails, setTeamDetails] = useState<Record<string, { teamName: string; sport: string; ageGroup: string; description?: string; profilePhotoUrl?: string } | null>>({});
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Tournament states
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [pendingTournamentInvites, setPendingTournamentInvites] = useState<any[]>([]);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [createTournamentForm, setCreateTournamentForm] = useState<CreateTournamentRequest>({
    name: '',
    maxSize: 4,
    description: ''
  });
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [TournamentComponent, setTournamentComponent] = useState<any>(null);

  // Settings modal functions (restored)
  const openSettings = () => {
    setShowSettings(true);
    setEditFormData({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phoneNumber: currentUser.phoneNumber
    });
    setProfilePhoto(currentUser.profilePhotoUrl || null);
  };

  const closeSettings = () => {
    setShowSettings(false);
    setIsEditMode(false);
    setError('');
    setProfilePhoto(null);
  };
  
  // Fetch team details for all user teams
  const fetchTeamDetails = async () => {
    if (currentUser.teams.length === 0) return;
    
    setLoadingTeams(true);
    try {
      const details: Record<string, { teamName: string; sport: string; ageGroup: string; description?: string; profilePhotoUrl?: string } | null> = {};
      const orphanedTeamIds: string[] = [];
      
      for (const userTeam of currentUser.teams) {
        try {
          const team = await teamService.getTeam(userTeam.teamId);
          if (team) {
            details[userTeam.teamId] = {
              teamName: team.teamName,
              sport: team.sport,
              ageGroup: team.ageGroup,
              description: team.description,
              profilePhotoUrl: team.profilePhotoUrl
            };
          } else {
            // Team doesn't exist, mark it for removal
            console.warn(`Team ${userTeam.teamId} not found, marking for removal`);
            details[userTeam.teamId] = null;
            orphanedTeamIds.push(userTeam.teamId);
          }
        } catch (error) {
          console.error(`Failed to fetch details for team ${userTeam.teamId}:`, error);
          // If we get a 404 or similar error, the team likely doesn't exist
          if (error instanceof Error && (error.message.includes('not found') || error.message.includes('404'))) {
            details[userTeam.teamId] = null;
            orphanedTeamIds.push(userTeam.teamId);
          } else {
            // Set placeholder data for other types of errors
            details[userTeam.teamId] = {
              teamName: 'Unknown Team',
              sport: 'Unknown Sport',
              ageGroup: 'Unknown Age Group'
            };
          }
        }
      }
      
      setTeamDetails(details);
      
      // Log orphaned teams for debugging
      if (orphanedTeamIds.length > 0) {
        console.warn(`Found ${orphanedTeamIds.length} orphaned teams:`, orphanedTeamIds);
        console.warn('These teams exist in userTeams but not in teams collection. They will be filtered out from display.');
      }
      
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Fetch tournaments organized by current user
  const loadTournaments = async () => {
    try {
      const tournamentsData = await tournamentService.getTournamentsByOrganizer(currentUser.id);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      setError('Failed to load tournaments');
    }
  };
  
  // Fetch team details when component mounts or teams change
  useEffect(() => {
    fetchTeamDetails();
  }, [currentUser.teams]);

  // Load tournaments when component mounts
  useEffect(() => {
    loadTournaments();
  }, []);
  
  // Load pending tournament organizer invites on mount
  useEffect(() => {
    const loadPendingTournamentInvites = async () => {
      try {
        const pendingInvites = await tournamentService.getPendingOrganizerInvites(currentUser.id);
        setPendingTournamentInvites(pendingInvites);
      } catch (error) {
        console.error('Failed to load pending tournament invites:', error);
      }
    };
    
    loadPendingTournamentInvites();
  }, [currentUser.id]);

  // Dynamically load Tournament component
  useEffect(() => {
    const loadTournamentComponent = async () => {
      try {
        const module = await import('../components/Tournament');
        setTournamentComponent(() => module.default);
      } catch (error) {
        console.error('Failed to load Tournament component:', error);
      }
    };
    loadTournamentComponent();
  }, []);

  // Debug profile photo URL
  useEffect(() => {
    console.log('Current user profile photo URL:', currentUser.profilePhotoUrl);
  }, [currentUser.profilePhotoUrl]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveChanges = async () => {
    try {
      setError('');
      
      if (!editPassword.trim()) {
        setError('Please enter your password to confirm changes');
        return;
      }
      
      // Import firebaseAuthService at the top of the file
      const { firebaseAuthService } = await import('../services/firebaseAuthService');
      
      // Handle profile photo if there's a new photo
      let photoUrl = currentUser.profilePhotoUrl;
      if (profilePhoto && profilePhoto !== currentUser.profilePhotoUrl) {
        // Convert file to data URL for now (in production, upload to cloud storage)
        // For now, we'll use the data URL directly
        photoUrl = profilePhoto;
      }
      
      // Update user profile
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phoneNumber: editFormData.phoneNumber,
        password: editPassword,
        profilePhotoUrl: photoUrl
      };
      
      await firebaseAuthService.updateUser(updateData);
      
      // Update the current user data
      await onRefreshUserData();
      
      // Exit edit mode
      setIsEditMode(false);
      setEditPassword('');
      setProfilePhoto(null);
      
      // Show success message
      alert('Profile updated successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(URL.createObjectURL(file));
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAccountTermination = async () => {
    if (terminateConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm account termination');
      return;
    }

    if (!terminatePassword.trim()) {
      setError('Please enter your password to confirm account termination');
      return;
    }

    try {
      setError('');
      
      // Use authService instead of firebaseAuthService to get proper error handling
      await authService.deleteAccount({
        email: currentUser.email,
        password: terminatePassword
      });
      
      // Logout and redirect
      onLogout();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate account';
      console.log('🔍 Account termination error:', errorMessage);
      
      // Check if this is a coach safety error
      if (errorMessage.includes("You are the only coach")) {
        console.log('✅ Coach safety error detected, showing modal');
        // Show the coach safety modal instead of error message
        setShowCoachSafetyModal(true);
        // Clear any existing error message
        setError('');
      } else if (errorMessage.includes("Cannot delete account - you are the last organizer")) {
        console.log('✅ Tournament organizer safety error detected, showing modal');
        // Show the tournament safety modal instead of error message
        setShowTournamentSafetyModal(true);
        // Clear any existing error message
        setError('');
      } else {
        console.log('❌ Not a safety error, showing error message');
        console.log('❌ Error message was:', errorMessage);
        // Only show error message if it's not a safety issue
        setError(errorMessage);
      }
    }
  };

  // Create Team functions
  const openCreateTeam = () => {
    setShowCreateTeam(true);
    setCreateTeamForm({
      teamName: '',
      ageGroup: '',
      sport: '',
      description: ''
    });
    setTeamPhotoPreview(null);
    setError('');
  };

  const closeCreateTeam = () => {
    setShowCreateTeam(false);
    setCreatingTeam(false);
    setError('');
  };

  const handleCreateTeamInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateTeamForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeamPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamPhotoPreview(URL.createObjectURL(file));
    }
  };

  const triggerTeamPhotoUpload = () => {
    teamPhotoInputRef.current?.click();
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createTeamForm.teamName.trim() || !createTeamForm.ageGroup || !createTeamForm.sport) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreatingTeam(true);
      setError('');
      
      // Create team request
      const createTeamRequest: CreateTeamRequest = {
        teamName: createTeamForm.teamName.trim(),
        sport: createTeamForm.sport,
        ageGroup: createTeamForm.ageGroup,
        description: createTeamForm.description.trim() || undefined,
        profilePhotoUrl: undefined // TODO: Implement photo upload to storage
      };

      // Call API to create team
      const newTeam = await teamService.createTeam(createTeamRequest, currentUser.id);
      
      // Close modal and show success
      closeCreateTeam();
      
      // Refresh user data to show new team
      await onRefreshUserData();
      
      // Show success message
      alert(`Team "${newTeam.teamName}" created successfully! You are now the coach.`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  // Tournament modal functions
  const openCreateTournament = () => {
    setShowCreateTournament(true);
    setCreateTournamentForm({
      name: '',
      maxSize: 4,
      description: ''
    });
    setError('');
  };

  const closeCreateTournament = () => {
    setShowCreateTournament(false);
    setCreatingTournament(false);
    setError('');
  };

  const handleCreateTournamentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateTournamentForm(prev => ({
      ...prev,
      [name]: name === 'maxSize' ? parseInt(value) || 0 : value
    }));
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createTournamentForm.name.trim() || createTournamentForm.maxSize < 4) {
      setError('Please provide a tournament name and minimum 4 teams');
      return;
    }

    try {
      setCreatingTournament(true);
      setError('');
      
      // Create tournament request
      const createTournamentRequest: CreateTournamentRequest = {
        name: createTournamentForm.name.trim(),
        maxSize: createTournamentForm.maxSize,
        description: createTournamentForm.description?.trim() || undefined
      };

      // Call API to create tournament
      const newTournament = await tournamentService.createTournament(createTournamentRequest, currentUser.id);
      
      // Close modal and show success
      closeCreateTournament();
      
      // Refresh tournaments list
      await loadTournaments();
      
      // Show success message
      alert(`Tournament "${newTournament.name}" created successfully!`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    } finally {
      setCreatingTournament(false);
    }
  };

  // Helper function to get role display name (restored)
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'COACH': return 'Coach';
      case 'PLAYER': return 'Player';
      case 'MANAGER': return 'Manager';
      case 'ASSISTANT_COACH': return 'Assistant Coach';
      default: return role;
    }
  };

  // Helper function to format sport names
  const formatSportName = (sport: string) => {
    if (!sport) return 'Unknown Sport';
    
    switch (sport.toLowerCase()) {
      case 'soccer': return '⚽ Soccer';
      case 'basketball': return '🏀 Basketball';
      case 'baseball': return '⚾ Baseball';
      case 'football': return '🏈 Football';
      case 'volleyball': return '🏐 Volleyball';
      case 'tennis': return '🎾 Tennis';
      case 'swimming': return '🏊 Swimming';
      case 'track & field': return '🏃 Track & Field';
      case 'other': return '🏆 Other';
      default: return `🏆 ${sport}`;
    }
  };

  // Pending invite modal state
  const [pendingInvite, setPendingInvite] = useState<{ userTeamId: string; teamName: string } | null>(null);
  const [pendingTournamentInvite, setPendingTournamentInvite] = useState<{ organizerTournamentId: string; tournamentName: string } | null>(null);
  const [showCoachSafetyModal, setShowCoachSafetyModal] = useState(false);
  const [showTournamentSafetyModal, setShowTournamentSafetyModal] = useState(false);

  // Handle team card click
  const handleTeamClick = (userTeamId: string) => {
    const team = currentUser.teams.find(t => t.id === userTeamId);
    if (team && team.inviteAccepted === false) {
      const name = teamDetails[team.teamId]?.teamName || 'This Team';
      setPendingInvite({ userTeamId, teamName: name });
      return;
    }
    navigate(`/team/${userTeamId}`);
  };

  // Handle accepting team invite
  const handleAcceptInvite = async (userTeamId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent team card click
    
    try {
      await teamService.acceptInvite(userTeamId);
      
      // Refresh user data to update invite status
      await onRefreshUserData();
      
      // Show success message
      alert('Team invite accepted successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  };
  
  // Handle accepting tournament organizer invite
  const handleAcceptTournamentInvite = async (organizerTournamentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tournament card click
    
    try {
      await tournamentService.acceptOrganizerInvite(organizerTournamentId);
      
      // Refresh user data to update invite status
      await onRefreshUserData();
      
      // Refresh pending invites list
      const pendingInvites = await tournamentService.getPendingOrganizerInvites(currentUser.id);
      setPendingTournamentInvites(pendingInvites);
      
      // Refresh tournaments list to show the newly accepted tournament
      await loadTournaments();
      
      // Show success message
      alert('Tournament organizer invite accepted successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept tournament invite');
    }
  };
  
  // Handle declining tournament organizer invite
  const handleDeclineTournamentInvite = async (organizerTournamentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tournament card click
    
    try {
      await tournamentService.declineOrganizerInvite(organizerTournamentId);
      
      // Refresh user data to update invite status
      await onRefreshUserData();
      
      // Refresh pending invites list
      const pendingInvites = await tournamentService.getPendingOrganizerInvites(currentUser.id);
      setPendingTournamentInvites(pendingInvites);
      
      // Show success message
      alert('Tournament organizer invite declined successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline tournament invite');
    }
  };
  
  // Handle clicking on pending tournament invite card
  const handlePendingTournamentInviteClick = (invite: any) => {
    setPendingTournamentInvite({
      organizerTournamentId: invite.organizerTournamentId,
      tournamentName: invite.tournamentName
    });
  };

  return (
    <div className="app home-page">
      <div className="container">
        {/* Header Navigation */}
        <div className="header-navigation">
          {/* Settings button at top right */}
          <button className="btn btn-settings" onClick={openSettings}>
            ⚙️ Settings
          </button>
        </div>

        <h1>Welcome, {currentUser.firstName}!</h1>

                 {/* Teams Display (restored) */}
         <div className="teams-section">
           <h3>Your Teams</h3>
           {(() => {
             const validTeams = currentUser.teams.filter((team: UserTeam) => teamDetails[team.teamId] !== null);
             return validTeams.length > 0 ? (
               <div className="teams-grid">
                 {validTeams.map((userTeam: UserTeam) => {
                   const isPending = userTeam.inviteAccepted === false;
                   return (
                   <div 
                     key={userTeam.id} 
                     className={`team-card clickable`}
                     onClick={() => handleTeamClick(userTeam.id)}
                   >
                                           <div className="team-header">
                        <div className="team-header-left">
                          {teamDetails[userTeam.teamId]?.profilePhotoUrl && (
                            <div className="team-photo-small">
                              <img src={teamDetails[userTeam.teamId]?.profilePhotoUrl} alt="Team photo" />
                            </div>
                          )}
                          <div className="team-header-text">
                            <h4>{teamDetails[userTeam.teamId]?.teamName || 'Loading...'}</h4>
                            <span className="team-sport">{formatSportName(teamDetails[userTeam.teamId]?.sport || 'Unknown')}</span>
                          </div>
                        </div>
                      </div>
                                           <div className="team-details">
                          <div className="team-role">
                            <strong>Role:</strong> {getRoleDisplayName(userTeam.role)}
                          </div>
                          <div className="team-joined">
                            <strong>Joined:</strong> {new Date(userTeam.joinedAt).toLocaleDateString()}
                          </div>
                          {isPending && (
                            <div className="invite-status invite-pending">
                              ⚠️ Invite Pending - Tap to accept or decline
                            </div>
                          )}
                          {teamDetails[userTeam.teamId]?.description && (
                            <div className="team-description">
                              <strong>Description:</strong> {teamDetails[userTeam.teamId]?.description}
                            </div>
                          )}
                        </div>
                   </div>
                 );})}
               </div>
             ) : (
               <div className="no-teams">
                 <p>You're not currently part of any teams.</p>
                 <p>Join or create a team to get started!</p>
               </div>
             );
           })()}
         </div>



        <div className="team-actions">
          <h3>Team Management</h3>
          <div className="action-buttons">
            <button className="btn btn-primary">
              🏆 Join a Team
            </button>
            <button className="btn btn-primary" onClick={openCreateTeam}>
              ➕ Create a Team
            </button>
          </div>
        </div>

        {/* Tournaments Section */}
        <div className="tournaments-section">
          <h3>🏆 Your Tournaments</h3>
          <div className="tournaments-header">
            <p>Create and organize tournaments for other teams!</p>
            <button className="btn btn-primary" onClick={openCreateTournament}>
              ➕ Create Tournament
            </button>
          </div>
          
          {(tournaments.length > 0 || pendingTournamentInvites.length > 0) ? (
            <div className="tournaments-grid">
              {/* Pending Tournament Invites */}
              {pendingTournamentInvites.map((invite) => (
                <div 
                  key={invite.organizerTournamentId} 
                  className="tournament-card tournament-invite clickable"
                  onClick={() => handlePendingTournamentInviteClick(invite)}
                >
                  <div className="tournament-header">
                    <h3 className="tournament-name">{invite.tournamentName}</h3>
                    <div className="tournament-status">
                      <span className="status-invite">📨 Invite</span>
                    </div>
                  </div>
                  <div className="tournament-details">
                    <div className="tournament-info">
                      <div className="info-item">
                        <strong>Type:</strong> Tournament Organizer Invite
                      </div>
                      {invite.tournamentDescription && (
                        <div className="info-item">
                          <strong>Description:</strong> {invite.tournamentDescription}
                        </div>
                      )}
                    </div>
                    <div className="invite-status invite-pending">
                      ⚠️ Tap to accept or decline this organizer invite
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Regular Tournaments */}
              {tournaments.map((tournament) => 
                TournamentComponent ? (
                  <TournamentComponent
                    key={tournament.id}
                    tournament={tournament}
                    userTeamIds={currentUser.teams.map(team => team.teamId)}
                    onTournamentUpdated={loadTournaments}
                  />
                ) : (
                  <div key={tournament.id} className="tournament-loading">
                    Loading tournament component...
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="no-tournaments">
              <p>No tournaments available yet.</p>
              <p>Create the first tournament to get started!</p>
            </div>
          )}
        </div>

        <div className="actions">
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="modal-overlay" onClick={closeCreateTeam}>
          <div className="modal create-team-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Team</h2>
              <button className="close-button" onClick={closeCreateTeam}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateTeam} className="create-team-form">
                {/* Team Name */}
                <div className="form-group">
                  <label htmlFor="teamName">Team Name *</label>
                  <input
                    type="text"
                    id="teamName"
                    name="teamName"
                    value={createTeamForm.teamName}
                    onChange={handleCreateTeamInputChange}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                {/* Sport */}
                <div className="form-group">
                  <label htmlFor="sport">Sport *</label>
                  <select
                    id="sport"
                    name="sport"
                    value={createTeamForm.sport}
                    onChange={handleCreateTeamInputChange}
                    required
                  >
                    <option value="">Select a sport</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Football">Football</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Track & Field">Track & Field</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Age Group */}
                <div className="form-group">
                  <label htmlFor="ageGroup">Age Group *</label>
                  <select
                    id="ageGroup"
                    name="ageGroup"
                    value={createTeamForm.ageGroup}
                    onChange={handleCreateTeamInputChange}
                    required
                  >
                    <option value="">Select age group</option>
                    <option value="5-7">5-7 years</option>
                    <option value="8-10">8-10 years</option>
                    <option value="11-13">11-13 years</option>
                    <option value="14-16">14-16 years</option>
                    <option value="17-18">17-18 years</option>
                    <option value="19+">19+ years</option>
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={createTeamForm.description}
                    onChange={handleCreateTeamInputChange}
                    placeholder="Optional team description"
                    rows={3}
                  />
                </div>

                {/* Team Profile Photo */}
                <div className="form-group">
                  <label>Team Profile Photo</label>
                  <div className="photo-upload-section">
                    {teamPhotoPreview ? (
                      <div className="photo-preview">
                        <img src={teamPhotoPreview} alt="Team photo preview" />
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            setTeamPhotoPreview(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={triggerTeamPhotoUpload}
                      >
                        📷 Upload Photo
                      </button>
                    )}
                    <input
                      ref={teamPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTeamPhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCreateTeam}
                    disabled={creatingTeam}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingTeam}
                  >
                    {creatingTeam ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateTournament && (
        <div className="modal-overlay" onClick={closeCreateTournament}>
          <div className="modal create-tournament-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Tournament</h2>
              <button className="close-button" onClick={closeCreateTournament}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateTournament} className="create-tournament-form">
                {/* Tournament Name */}
                <div className="form-group">
                  <label htmlFor="tournamentName">Tournament Name *</label>
                  <input
                    type="text"
                    id="tournamentName"
                    name="name"
                    value={createTournamentForm.name}
                    onChange={handleCreateTournamentInputChange}
                    placeholder="Enter tournament name"
                    required
                  />
                </div>

                {/* Max Size */}
                <div className="form-group">
                  <label htmlFor="maxSize">Maximum Teams *</label>
                  <select
                    id="maxSize"
                    name="maxSize"
                    value={createTournamentForm.maxSize}
                    onChange={handleCreateTournamentInputChange}
                    required
                  >
                    {Array.from({ length: 61 }, (_, i) => i + 4).map(size => (
                      <option key={size} value={size}>{size} teams</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="tournamentDescription">Description</label>
                  <textarea
                    id="tournamentDescription"
                    name="description"
                    value={createTournamentForm.description}
                    onChange={handleCreateTournamentInputChange}
                    placeholder="Optional tournament description"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCreateTournament}
                    disabled={creatingTournament}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingTournament}
                  >
                    {creatingTournament ? 'Creating...' : 'Create Tournament'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invite Modal */}
      {pendingInvite && (
        <div className="modal-overlay" onClick={() => setPendingInvite(null)}>
          <div className="modal pending-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Team Invitation</h2>
              <button className="close-button" onClick={() => setPendingInvite(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>You have been invited to join <strong>{pendingInvite.teamName}</strong>.</p>
              <p>Would you like to accept this invitation?</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setPendingInvite(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await teamService.declineInvite(pendingInvite.userTeamId);
                    setPendingInvite(null);
                    await onRefreshUserData();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to decline invite');
                  }
                }}
              >
                Decline
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await teamService.acceptInvite(pendingInvite.userTeamId);
                    setPendingInvite(null);
                    await onRefreshUserData();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to accept invite');
                  }
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Pending Tournament Organizer Invite Modal */}
      {pendingTournamentInvite && (
        <div className="modal-overlay" onClick={() => setPendingTournamentInvite(null)}>
          <div className="modal pending-invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tournament Organizer Invitation</h2>
              <button className="close-button" onClick={() => setPendingTournamentInvite(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>You have been invited to be an organizer of <strong>{pendingTournamentInvite.tournamentName}</strong>.</p>
              <p>Would you like to accept this invitation?</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setPendingTournamentInvite(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await tournamentService.declineOrganizerInvite(pendingTournamentInvite.organizerTournamentId);
                    setPendingTournamentInvite(null);
                    await onRefreshUserData();
                    
                    // Refresh pending invites list
                    const pendingInvites = await tournamentService.getPendingOrganizerInvites(currentUser.id);
                    setPendingTournamentInvites(pendingInvites);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to decline tournament invite');
                  }
                }}
              >
                Decline
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await tournamentService.acceptOrganizerInvite(pendingTournamentInvite.organizerTournamentId);
                    setPendingTournamentInvite(null);
                    await onRefreshUserData();
                    
                    // Refresh pending invites list
                    const pendingInvites = await tournamentService.getPendingOrganizerInvites(currentUser.id);
                    setPendingTournamentInvites(pendingInvites);
                    
                    // Refresh tournaments list to show the newly accepted tournament
                    await loadTournaments();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to accept tournament invite');
                  }
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (restored) */}
      {showSettings && (
        <div className="modal-overlay" onClick={closeSettings}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Settings & Profile</h2>
              <button className="close-button" onClick={closeSettings}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Profile Photo Section - Always Visible */}
              <div className="profile-section">
                <h4>Profile Photo</h4>
                <div className="photo-upload-section">
                  {isEditMode ? (
                    // Edit mode: show upload/remove options
                    <>
                      {profilePhoto ? (
                        <div className="photo-preview">
                          <img src={profilePhoto} alt="Profile preview" />
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => setProfilePhoto(null)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={triggerFileUpload}
                        >
                          📷 Upload Photo
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        style={{ display: 'none' }}
                      />
                    </>
                  ) : (
                    // View mode: show current photo or placeholder
                    <>
                      {currentUser.profilePhotoUrl ? (
                        <div className="current-profile-photo">
                          <img 
                            src={currentUser.profilePhotoUrl} 
                            alt="Current profile" 
                            onError={(e) => console.error('Image failed to load:', e)}
                            onLoad={() => console.log('Image loaded successfully')}
                          />
                        </div>
                      ) : (
                        <div className="no-photo-placeholder">
                          <span>📷 No profile photo</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="info-section">
                <h4>Personal Information</h4>
                {isEditMode ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label htmlFor="editFirstName">First Name</label>
                      <input
                        type="text"
                        id="editFirstName"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editLastName">Last Name</label>
                      <input
                        type="text"
                        id="editLastName"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editPhoneNumber">Phone Number</label>
                      <input
                        type="tel"
                        id="editPhoneNumber"
                        name="phoneNumber"
                        value={editFormData.phoneNumber}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editPassword">Password (to confirm changes)</label>
                      <input
                        type="password"
                        id="editPassword"
                        name="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setIsEditMode(false);
                          setProfilePhoto(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={saveChanges}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="info-display">
                    <div className="info-item">
                      <strong>First Name:</strong> {currentUser.firstName}
                    </div>
                    <div className="info-item">
                      <strong>Last Name:</strong> {currentUser.lastName}
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong> {currentUser.email}
                    </div>
                    <div className="info-item">
                      <strong>Phone Number:</strong> {currentUser.phoneNumber}
                    </div>
                    <div className="info-item">
                      <strong>Date of Birth:</strong> {new Date(currentUser.dateOfBirth).toLocaleDateString()}
                    </div>
                    <div className="info-item">
                      <strong>Member Since:</strong> {new Date(currentUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

                             {/* Teams and Roles Section (restored) */}
               <div className="info-section">
                 <h4>Teams & Roles</h4>
                 {(() => {
                   const validTeams = currentUser.teams.filter((team: UserTeam) => teamDetails[team.teamId] !== null);
                   return validTeams.length > 0 ? (
                     <div className="teams-info">
                                               {validTeams.map((team: UserTeam) => (
                          <div key={team.id} className="team-info-item">
                            <div className="team-name">{teamDetails[team.teamId]?.teamName || 'Loading...'}</div>
                            <div className="team-role">{getRoleDisplayName(team.role)}</div>
                            <div className="team-sport">{formatSportName(teamDetails[team.teamId]?.sport || 'Unknown')}</div>
                            <div className="team-joined">Joined: {new Date(team.joinedAt).toLocaleDateString()}</div>
                            {teamDetails[team.teamId]?.description && (
                              <div className="team-description">{teamDetails[team.teamId]?.description}</div>
                            )}
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="no-teams-info">
                       <p>You're not currently part of any teams.</p>
                     </div>
                   );
                 })()}
               </div>

              {/* Edit Button (restored) */}
              {!isEditMode && (
                <div className="edit-section">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={toggleEditMode}
                  >
                    ✏️ Edit Information
                  </button>
                </div>
              )}

              {/* Account Termination Section (restored) */}
              <div className="account-termination">
                <h4>Account Termination</h4>
                <p className="warning-text">
                  ⚠️ This action cannot be undone. All your data will be permanently deleted.
                </p>
                {!showTerminateConfirm ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowTerminateConfirm(true)}
                  >
                    🗑️ Terminate Account
                  </button>
                ) : (
                  <div className="terminate-confirm">
                    <p>Type "DELETE" to confirm account termination:</p>
                    <input
                      type="text"
                      value={terminateConfirm}
                      onChange={(e) => setTerminateConfirm(e.target.value)}
                      placeholder="Type DELETE"
                      className="terminate-input"
                    />
                    <div className="password-verification">
                      <label htmlFor="terminatePassword">Enter your password to confirm:</label>
                      <input
                        type="password"
                        id="terminatePassword"
                        value={terminatePassword}
                        onChange={(e) => setTerminatePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="terminate-password-input"
                      />
                    </div>
                    <div className="terminate-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowTerminateConfirm(false);
                          setTerminateConfirm('');
                          setTerminatePassword('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleAccountTermination}
                      >
                        Confirm Termination
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coach Safety Modal */}
      {showCoachSafetyModal && (
        <div className="modal-overlay" onClick={() => setShowCoachSafetyModal(false)}>
          <div className="modal coach-safety-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Coach Safety Check</h3>
            <p>You are the only coach of a team. You must take action before you can delete your account.</p>
            
            <div className="coach-safety-options">
              <div className="option-card">
                <h4>👑 Promote Someone to Coach</h4>
                <p>Promote another team member to coach so you can delete your account safely.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowCoachSafetyModal(false);
                    // Navigate to the first team where user is coach
                    const coachTeam = currentUser.teams.find(team => team.role === 'COACH');
                    if (coachTeam) {
                      navigate(`/team/${coachTeam.id}`);
                    }
                  }}
                >
                  Go to Team Roster
                </button>
              </div>
              
              <div className="option-card">
                <h4>🗑️ Delete Team</h4>
                <p>Delete the entire team if you no longer want to manage it.</p>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    setShowCoachSafetyModal(false);
                    // Navigate to the first team where user is coach
                    const coachTeam = currentUser.teams.find(team => team.role === 'COACH');
                    if (coachTeam) {
                      navigate(`/team/${coachTeam.id}`);
                    }
                  }}
                >
                  Go to Team Settings
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

      {/* Tournament Safety Modal */}
      {showTournamentSafetyModal && (
        <div className="modal-overlay" onClick={() => setShowTournamentSafetyModal(false)}>
          <div className="modal tournament-safety-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Tournament Organizer Safety Check</h3>
            <p>You are the last organizer of one or more tournaments. You must take action before you can delete your account.</p>
            
            <div className="tournament-safety-options">
              <div className="option-card">
                <h4>✉️ Add Another Organizer</h4>
                <p>Invite someone else to be an organizer of your tournaments so you can delete your account safely.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTournamentSafetyModal(false);
                    // Navigate to the first tournament where user is organizer
                    if (tournaments && tournaments.length > 0) {
                      navigate(`/tournament/${tournaments[0].id}`);
                    }
                  }}
                >
                  Go to Tournament Organizers
                </button>
              </div>
              
              <div className="option-card">
                <h4>🗑️ Delete Tournaments</h4>
                <p>Delete the tournaments if you no longer want to manage them.</p>
                <button 
                  className="btn btn-danger"
                  onClick={() => {
                    setShowTournamentSafetyModal(false);
                    // Navigate to the first tournament where user is organizer
                    if (tournaments && tournaments.length > 0) {
                      navigate(`/tournament/${tournaments[0].id}`);
                    }
                  }}
                >
                  Go to Tournament Settings
                </button>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTournamentSafetyModal(false)}
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

export default HomePage;
