import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService } from '../services/tournamentService';
import type { Tournament, AuthResponse, UpdateTournamentRequest } from '../types/Auth';
import TournamentSafetyPrompt from '../components/TournamentSafetyPrompt';
import TournamentSchedule from '../components/TournamentSchedule';
import './TournamentPage.css';

interface TournamentPageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
}

function TournamentPage({ currentUser, onLogout }: TournamentPageProps) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'organizers' | 'teams' | 'scheduling' | 'settings'>('organizers');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Organizers state
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  
  // Invite state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: ''
  });
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState<string>('');
  
  // Settings state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Leave tournament state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Safety prompt state
  const [showSafetyPrompt, setShowSafetyPrompt] = useState(false);
  const [safetyPromptAction, setSafetyPromptAction] = useState<'LEAVE_TOURNAMENT' | 'DELETE_ACCOUNT'>('LEAVE_TOURNAMENT');

  // Team invite state
  const [showTeamInviteForm, setShowTeamInviteForm] = useState(false);
  const [teamInviteForm, setTeamInviteForm] = useState({
    teamName: ''
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingTeams, setSearchingTeams] = useState(false);
  const [invitingTeam, setInvitingTeam] = useState(false);
  const [teamInviteError, setTeamInviteError] = useState<string>('');
  const [teamInvites, setTeamInvites] = useState<any[]>([]);
  const [loadingTeamInvites, setLoadingTeamInvites] = useState(false);
  const [enrolledTeams, setEnrolledTeams] = useState<any[]>([]);
  const [loadingEnrolledTeams, setLoadingEnrolledTeams] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      setError('Tournament ID is required');
      setLoading(false);
      return;
    }

    const loadTournament = async () => {
      try {
        setLoading(true);
        const tournamentData = await tournamentService.getTournamentById(tournamentId);
        if (tournamentData) {
          setTournament(tournamentData);
        } else {
          setError('Tournament not found');
        }
      } catch (error) {
        console.error('Failed to load tournament:', error);
        setError('Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId]);

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

  // Fetch team invites when teams tab is active
  useEffect(() => {
    const loadTeamInvites = async () => {
      if (activeTab === 'teams' && tournamentId) {
        try {
          setLoadingTeamInvites(true);
          const invitesData = await tournamentService.getTournamentTeamInvites(tournamentId);
          setTeamInvites(invitesData);
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
          setEnrolledTeams(teams);
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
  
  // Invite functions
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.email.trim()) {
      setInviteError('Please enter an email address');
      return;
    }
    
    if (!tournamentId) return;
    
    try {
      setInvitingUser(true);
      setInviteError('');
      
      await tournamentService.inviteUserToTournament(tournamentId, inviteForm.email.trim());
      
      alert('User invited successfully!');
      setInviteForm({ email: '' });
      setShowInviteForm(false);
      
      // Refresh organizers to show the new invite
      if (activeTab === 'organizers') {
        const organizersData = await tournamentService.getTournamentOrganizers(tournamentId);
        setOrganizers(organizersData);
      }
      
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInvitingUser(false);
    }
  };

  // Team invite functions
  const handleTeamInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // This form is just for searching, actual invite happens in handleInviteTeam
  };

  const handleSearchTeams = async () => {
    if (!teamInviteForm.teamName.trim()) return;
    
    try {
      setSearchingTeams(true);
      setTeamInviteError('');
      
      // Import teamService dynamically to avoid circular dependencies
      const { teamService } = await import('../services/teamService');
      const teams = await teamService.searchTeamsByName(teamInviteForm.teamName.trim());
      setSearchResults(teams);
      
    } catch (err) {
      setTeamInviteError(err instanceof Error ? err.message : 'Failed to search teams');
    } finally {
      setSearchingTeams(false);
    }
  };

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
      
      alert('Team invited successfully!');
      setSearchResults([]);
      setTeamInviteForm({ teamName: '' });
      setShowTeamInviteForm(false);
      
      // Refresh team invites
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
      
      alert('Team removed successfully!');
      
      // Refresh tournament data to update team count
      const updatedTournament = await tournamentService.getTournamentById(tournamentId);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
      
      // Refresh enrolled teams
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
      alert('Tournament updated successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tournament');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournamentId) return;
    
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm tournament deletion');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      
      await tournamentService.deleteTournament(tournamentId);
      
      alert('Tournament deleted successfully!');
      navigate('/home');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tournament');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveTournament = async () => {
    if (!tournamentId) return;
    
    if (leaveConfirm !== 'LEAVE') {
      setError('Please type LEAVE to confirm leaving the tournament');
      return;
    }

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
        setShowLeaveConfirm(false);
        setLeaveConfirm('');
        return;
      }
      
      // Safe to proceed with leaving
      await tournamentService.removeOrganizerFromTournament(tournamentId, currentUser.id);
      
      alert('You have left the tournament successfully!');
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
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="tournament-page">
        <div className="loading-spinner">Loading tournament...</div>
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
          <div className="tab-content active">
            <div className="organizers-header">
              <h3>Tournament Organizers</h3>
              <button 
                className="btn btn-invite"
                onClick={() => setShowInviteForm(true)}
              >
                ✉️ Invite Organizer
              </button>
            </div>
            <div className="organizers-content">
              {/* Organizers List */}
              {loadingOrganizers ? (
                <div className="loading-message">
                  <p>Loading organizers...</p>
                </div>
              ) : organizers.length > 0 ? (
                <div className="organizers-container">
                  {organizers.map((organizer) => (
                    <div key={organizer.organizerId} className="organizer-member">
                      <div className="member-avatar">
                        {organizer.profilePhotoUrl ? (
                          <img 
                            src={organizer.profilePhotoUrl} 
                            alt={`${organizer.firstName} ${organizer.lastName}`}
                            className="profile-photo"
                          />
                        ) : (
                          <div className="profile-initials">
                            {organizer.firstName.charAt(0)}{organizer.lastName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="member-info">
                        <div className="member-name">
                          {organizer.firstName} {organizer.lastName}
                        </div>
                        <div className="member-role">
                          Tournament Organizer
                        </div>
                        <div className="member-details">
                          <span className="member-email">{organizer.email}</span>
                          {organizer.phoneNumber && (
                            <span className="member-phone">Phone: {organizer.phoneNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-organizers">
                  <p>No organizers found for this tournament.</p>
                </div>
              )}
            </div>
            
            {/* Invite Form Modal */}
            {showInviteForm && (
              <div className="invite-form-modal">
                <div className="invite-form-content">
                  <h3>Invite User to Tournament</h3>
                  <form onSubmit={handleInviteUser}>
                    <div className="form-group">
                      <label htmlFor="inviteEmail">Email Address</label>
                      <input
                        type="email"
                        id="inviteEmail"
                        name="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter user's email address"
                        required
                      />
                    </div>
                    
                    {inviteError && (
                      <div className="error-message">
                        {inviteError}
                      </div>
                    )}
                    
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteForm({ email: '' });
                          setInviteError('');
                        }}
                        disabled={invitingUser}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={invitingUser}
                      >
                        {invitingUser ? 'Inviting...' : 'Send Invite'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'scheduling':
        return (
          <div className="tab-content active">
            <TournamentSchedule
              tournamentId={tournamentId || ''}
              tournamentName={tournament?.name || 'Tournament'}
            />
          </div>
        );

      case 'teams':
        return (
          <div className="tab-content active">
            <div className="teams-content">
              <div className="teams-header">
                <h3>Tournament Teams</h3>
                {tournament && tournament.teamCount >= tournament.maxSize ? (
                  <div className="tournament-full-notice">
                    <span className="full-indicator">🏆 Tournament Full ({tournament.teamCount}/{tournament.maxSize})</span>
                    <button 
                      className="btn btn-invite"
                      disabled
                      title="Tournament is at maximum capacity"
                    >
                      Invite Team
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-invite"
                    onClick={() => setShowTeamInviteForm(true)}
                  >
                    Invite Team
                  </button>
                )}
              </div>

              {/* Team Invite Form Modal */}
              {showTeamInviteForm && (
                <div className="invite-form-modal">
                  <div className="invite-form-content">
                    <h3>Invite Team to Tournament</h3>
                    <form onSubmit={handleTeamInvite}>
                      <div className="form-group">
                        <label htmlFor="teamName">Team Name</label>
                        <input
                          type="text"
                          id="teamName"
                          value={teamInviteForm.teamName}
                          onChange={(e) => setTeamInviteForm(prev => ({ ...prev, teamName: e.target.value }))}
                          placeholder="Enter team name to search"
                          required
                        />
                      </div>
                      
                      {teamInviteForm.teamName && (
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={handleSearchTeams}
                          disabled={searchingTeams}
                        >
                          {searchingTeams ? 'Searching...' : 'Search Teams'}
                        </button>
                      )}

                      {searchResults.length > 0 && (
                        <div className="search-results">
                          <h4>Found Teams:</h4>
                          <div className="team-list">
                            {searchResults.map((team) => (
                              <div key={team.id} className="team-item">
                                <div className="team-info">
                                  <div className="team-name">{team.teamName}</div>
                                  <div className="team-sport">{team.sport} - {team.ageGroup}</div>
                                </div>
                                <button 
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleInviteTeam(team.id)}
                                  disabled={invitingTeam}
                                >
                                  {invitingTeam ? 'Inviting...' : 'Invite'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {teamInviteError && (
                        <div className="error-message">
                          {teamInviteError}
                        </div>
                      )}

                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowTeamInviteForm(false);
                            setTeamInviteForm({ teamName: '' });
                            setSearchResults([]);
                            setTeamInviteError('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Display Enrolled Teams */}
              <div className="enrolled-teams">
                <h4>Enrolled Teams ({enrolledTeams.length})</h4>
                {loadingEnrolledTeams ? (
                  <p>Loading enrolled teams...</p>
                ) : enrolledTeams.length === 0 ? (
                  <div className="empty-organizers">
                    <p>No teams have joined this tournament yet.</p>
                    <p>Use the "Invite Team" button above to invite teams to participate.</p>
                  </div>
                ) : (
                  <div className="team-cards">
                    {enrolledTeams.map((teamInvite) => (
                      <div key={teamInvite.id} className="organizer-member">
                        <div className="member-info">
                          <div className="member-name">Team ID: {teamInvite.teamId.substring(0, 8)}...</div>
                          <div className="member-role">Joined: {new Date(teamInvite.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button 
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleRemoveTeam(teamInvite.teamId)}
                          disabled={invitingTeam}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Display Pending Invites */}
              <div className="pending-invites">
                <h4>Pending Team Invites</h4>
                {loadingTeamInvites ? (
                  <p>Loading pending invites...</p>
                ) : teamInvites.length > 0 ? (
                  <div className="team-cards">
                    {teamInvites.map((invite) => (
                      <div key={invite.id} className="organizer-member">
                        <div className="member-info">
                          <div className="member-name">Team ID: {invite.teamId.substring(0, 8)}...</div>
                          <div className="member-role">Invited: {new Date(invite.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No pending team invites.</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="tab-content active">
            <div className="settings-content">
              <h3>Tournament Settings</h3>
              
              {/* Tournament Information Display */}
              <div className="edit-mode">
                <strong>Tournament Information</strong>
                <div className="form-group">
                  <label>Name:</label>
                  <div className="info-display">{tournament.name}</div>
                </div>
                <div className="form-group">
                  <label>Max Teams:</label>
                  <div className="info-display">{tournament.maxSize}</div>
                </div>
                <div className="form-group">
                  <label>Current Teams:</label>
                  <div className="info-display">{tournament.teamCount}</div>
                </div>
                <div className="form-group">
                  <label>Organizers:</label>
                  <div className="info-display">{tournament.organizerCount}</div>
                </div>
                <div className="form-group">
                  <label>Created:</label>
                  <div className="info-display">{new Date(tournament.createdAt).toLocaleDateString()}</div>
                </div>
                {tournament.description && (
                  <div className="form-group">
                    <label>Description:</label>
                    <div className="info-display">{tournament.description}</div>
                  </div>
                )}
              </div>

              {/* Edit Tournament Information */}
              <div className="edit-mode">
                <strong>Edit Tournament Information</strong>
                {isEditMode ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                    <div className="form-group">
                      <label htmlFor="tournamentName">Tournament Name</label>
                      <input
                        type="text"
                        id="tournamentName"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditInputChange}
                        placeholder="Enter tournament name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="tournamentDescription">Description</label>
                      <textarea
                        id="tournamentDescription"
                        name="description"
                        value={editForm.description}
                        placeholder="Optional tournament description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="edit-buttons">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleEditToggle}
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p>Update tournament name and description.</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleEditToggle}
                    >
                      ✏️ Edit Tournament
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Tournament */}
              <div className="delete-section">
                <h4>Danger Zone</h4>
                <p>⚠️ <strong>Warning:</strong> Deleting a tournament will permanently remove all tournament data, including team registrations and organizer information. This action cannot be undone.</p>
                
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑️ Delete Tournament
                  </button>
                ) : (
                  <div className="delete-confirm">
                    <p>Type "DELETE" to confirm tournament deletion:</p>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="Type DELETE"
                    />
                    <div className="delete-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirm('');
                          setError('');
                        }}
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteTournament}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Leave Tournament */}
              <div className="leave-section">
                <h4>Leave Tournament</h4>
                <div className="leave-warning">
                  <h5>🚪 <strong>Leave Tournament:</strong></h5>
                  <p>You will no longer be an organizer of this tournament. You can rejoin if invited again.</p>
                </div>
                
                {!showLeaveConfirm ? (
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    🚪 Leave Tournament
                  </button>
                ) : (
                  <div className="leave-confirm">
                    <p>Type "LEAVE" to confirm leaving the tournament:</p>
                    <input
                      type="text"
                      value={leaveConfirm}
                      onChange={(e) => setLeaveConfirm(e.target.value)}
                      placeholder="Type LEAVE"
                      className="leave-input"
                    />
                    <div className="leave-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowLeaveConfirm(false);
                          setLeaveConfirm('');
                          setError('');
                        }}
                        disabled={isLeaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={handleLeaveTournament}
                        disabled={isLeaving}
                      >
                        {isLeaving ? 'Leaving...' : 'Confirm Leave'}
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="tournament-page">
      {/* Header */}
      <div className="tournament-header">
        <button className="btn btn-back" onClick={() => navigate('/home')}>
          ← Back to Home
        </button>
        <h1>{loading ? 'Loading...' : tournament?.name || 'Unknown Tournament'}</h1>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="tournament-layout">
        {/* Sidebar */}
        <div className="tournament-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeTab === 'organizers' ? 'active' : ''}`}
              onClick={() => setActiveTab('organizers')}
            >
              <span className="sidebar-icon">👑</span>
              <span className="sidebar-text">Organizers</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <span className="sidebar-icon">👥</span>
              <span className="sidebar-text">Teams</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'scheduling' ? 'active' : ''}`}
              onClick={() => setActiveTab('scheduling')}
            >
              <span className="sidebar-icon">📅</span>
              <span className="sidebar-text">Scheduling</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="sidebar-icon">⚙️</span>
              <span className="sidebar-text">Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="tournament-content">
          {renderTabContent()}
        </div>
      </div>
      
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
