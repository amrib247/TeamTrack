import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService, type CreateTeamRequest } from '../services/teamService';
import type { AuthResponse, UserTeam } from '../types/Auth';
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
   const [teamDetails, setTeamDetails] = useState<Record<string, { teamName: string; sport: string; ageGroup: string; description?: string }>>({});
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Settings modal functions (restored)
  const openSettings = () => {
    setShowSettings(true);
    setEditFormData({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phoneNumber: currentUser.phoneNumber
    });
  };

  const closeSettings = () => {
    setShowSettings(false);
    setIsEditMode(false);
    setError('');
  };
  
  // Fetch team details for all user teams
  const fetchTeamDetails = async () => {
    if (currentUser.teams.length === 0) return;
    
    setLoadingTeams(true);
    try {
      const details: Record<string, { teamName: string; sport: string; ageGroup: string; description?: string }> = {};
      const orphanedTeamIds: string[] = [];
      
      for (const userTeam of currentUser.teams) {
        try {
          const team = await teamService.getTeam(userTeam.teamId);
          if (team) {
            details[userTeam.teamId] = {
              teamName: team.teamName,
              sport: team.sport,
              ageGroup: team.ageGroup,
              description: team.description
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
  
  // Fetch team details when component mounts or teams change
  useEffect(() => {
    fetchTeamDetails();
  }, [currentUser.teams]);

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
      
      // Update user profile
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phoneNumber: editFormData.phoneNumber,
        password: editPassword
      };
      
      await firebaseAuthService.updateUser(updateData);
      
      // Update the current user data
      await onRefreshUserData();
      
      // Exit edit mode
      setIsEditMode(false);
      setEditPassword('');
      
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
      
      // Import firebaseAuthService at the top of the file
      const { firebaseAuthService } = await import('../services/firebaseAuthService');
      
      // Delete the account
      await firebaseAuthService.deleteAccount(terminatePassword);
      
      // Logout and redirect
      onLogout();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate account');
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

  // Handle team card click
  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`);
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
                 {validTeams.map((team: UserTeam) => (
                   <div 
                     key={team.id} 
                     className="team-card clickable"
                     onClick={() => handleTeamClick(team.id)}
                   >
                                           <div className="team-header">
                        <div className="team-header-left">
                          {teamDetails[team.teamId]?.profilePhotoUrl && (
                            <div className="team-photo-small">
                              <img src={teamDetails[team.teamId]?.profilePhotoUrl} alt="Team photo" />
                            </div>
                          )}
                          <div className="team-header-text">
                            <h4>{teamDetails[team.teamId]?.teamName || 'Loading...'}</h4>
                            <span className="team-sport">{formatSportName(teamDetails[team.teamId]?.sport || 'Unknown')}</span>
                          </div>
                        </div>
                      </div>
                                           <div className="team-details">
                        <div className="team-role">
                          <strong>Role:</strong> {getRoleDisplayName(team.role)}
                        </div>
                        <div className="team-joined">
                          <strong>Joined:</strong> {new Date(team.joinedAt).toLocaleDateString()}
                        </div>
                        {teamDetails[team.teamId]?.description && (
                          <div className="team-description">
                            <strong>Description:</strong> {teamDetails[team.teamId]?.description}
                          </div>
                        )}
                      </div>
                   </div>
                 ))}
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

        <div className="actions">
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
          <p className="coming-soon">Team functionality coming soon!</p>
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
              {/* Profile Photo Section (restored) */}
              <div className="profile-section">
                <h4>Profile Photo</h4>
                <div className="photo-upload-section">
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
                </div>
              </div>

              {/* Personal Information Section (restored) */}
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
                        onClick={() => setIsEditMode(false)}
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
    </div>
  );
}

export default HomePage;
