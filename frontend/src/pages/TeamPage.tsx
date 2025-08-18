import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { UserTeam } from '../types/Auth';
import { teamService } from '../services/teamService';
import './TeamPage.css';

interface TeamPageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
}

interface AuthResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  teams: UserTeam[];
}

function TeamPage({ currentUser, onLogout }: TeamPageProps) {
  const { teamId: userTeamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('roster');
  
  // Team editing states
  const [editTeamForm, setEditTeamForm] = useState({
    teamName: '',
    sport: '',
    ageGroup: '',
    description: '',
    profilePhotoUrl: ''
  });
  const [editingTeam, setEditingTeam] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminateConfirm, setTerminateConfirm] = useState('');
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
  
  // Debug logging
  console.log('🔍 TeamPage Debug:', {
    userTeamId,
    userTeam,
    allTeams: currentUser.teams.map(t => ({ id: t.id, teamId: t.teamId }))
  });
  
  if (!userTeam) {
    return (
      <div className="team-page">
        <div className="error-message">
          <h2>Team Not Found</h2>
          <p>You don't have access to this team or it doesn't exist.</p>
          <p>Debug: userTeamId = {userTeamId}</p>
          <p>Available teams: {currentUser.teams.map(t => `(id: ${t.id}, teamId: ${t.teamId})`).join(', ')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  // Fetch team details when component mounts
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (userTeam?.teamId) {
        try {
          setLoadingTeamDetails(true);
          console.log('🔍 Fetching team details for teamId:', userTeam.teamId);
          const team = await teamService.getTeam(userTeam.teamId);
          setTeamDetails({
            teamName: team.teamName,
            sport: team.sport,
            ageGroup: team.ageGroup,
            description: team.description,
            profilePhotoUrl: team.profilePhotoUrl
          });
          
          // Initialize edit form with team details
          setEditTeamForm({
            teamName: team.teamName,
            sport: team.sport,
            ageGroup: team.ageGroup,
            description: team.description || '',
            profilePhotoUrl: team.profilePhotoUrl || ''
          });
          
          // Set photo preview if exists
          if (team.profilePhotoUrl) {
            setTeamPhotoPreview(team.profilePhotoUrl);
          }
          
          console.log('✅ Team details fetched:', team);
        } catch (error) {
          console.error('❌ Failed to fetch team details:', error);
          setError('Failed to load team information');
        } finally {
          setLoadingTeamDetails(false);
        }
      } else {
        setLoadingTeamDetails(false);
      }
    };
    
    fetchTeamDetails();
  }, [userTeam]);

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
      console.log('🔄 Updating team with actual teamId:', userTeam.teamId, 'and data:', updateRequest);
      console.log('🔍 Debug - userTeam object:', userTeam);
      console.log('🔍 Debug - userTeam.teamId type:', typeof userTeam.teamId);
      console.log('🔍 Debug - userTeam.teamId value:', userTeam.teamId);
      
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
       alert('Team updated successfully!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setEditingTeam(false);
    }
  };

  const handleTerminateTeam = async () => {
    if (terminateConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm team termination');
      return;
    }

    try {
      setError('');
      
      // Call the backend API to terminate team
      console.log('🗑️ Terminating team with actual teamId:', userTeam.teamId);
      await teamService.terminateTeam(userTeam.teamId);
      
      // Show success message and redirect
      alert('Team terminated successfully!');
      navigate('/home');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate team');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'roster':
        return (
          <div className="content-roster">
            <h2>Team Roster</h2>
            <p>Roster management coming soon...</p>
          </div>
        );
      case 'schedule':
        return (
          <div className="content-schedule">
            <h2>Team Schedule</h2>
            <p>Schedule management coming soon...</p>
          </div>
        );
      case 'tasks':
        return (
          <div className="content-tasks">
            <h2>Team Tasks</h2>
            <p>Task management coming soon...</p>
          </div>
        );
      case 'chat':
        return (
          <div className="content-chat">
            <h2>Team Chat</h2>
            <p>Team chat coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="content-settings">
            <h2>Team Settings</h2>
            
                         {/* Team Information Display */}
             <div className="team-info">
               {loadingTeamDetails ? (
                 <p>Loading team information...</p>
               ) : teamDetails ? (
                 <>
                   <div className="team-header-info">
                     {teamDetails.profilePhotoUrl && (
                       <div className="team-photo">
                         <img src={teamDetails.profilePhotoUrl} alt="Team photo" />
                       </div>
                     )}
                     <div className="team-text-info">
                       <h3>{teamDetails.teamName}</h3>
                       <p className="team-sport">{teamDetails.sport}</p>
                       <p className="team-age-group">Age Group: {teamDetails.ageGroup}</p>
                       {teamDetails.description && (
                         <p className="team-description">{teamDetails.description}</p>
                       )}
                     </div>
                   </div>
                 </>
               ) : (
                 <p>Failed to load team information</p>
               )}
               <p className="team-role">Your Role: {userTeam.role}</p>
               <p className="team-joined">Joined: {new Date(userTeam.joinedAt).toLocaleDateString()}</p>
             </div>

                             {/* Coach-only Settings */}
                 {userTeam.role === 'COACH' && !loadingTeamDetails && teamDetails && (
              <div className="coach-settings">
                <h3>Team Management</h3>
                
                {/* Edit Team Information */}
                <div className="settings-section">
                  <h4>Edit Team Information</h4>
                  <form className="edit-team-form" onSubmit={handleEditTeam}>
                    <div className="form-group">
                      <label htmlFor="teamName">Team Name</label>
                      <input
                        type="text"
                        id="teamName"
                        name="teamName"
                        value={editTeamForm.teamName}
                        onChange={handleEditTeamInputChange}
                        placeholder="Enter team name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="sport">Sport</label>
                      <select
                        id="sport"
                        name="sport"
                        value={editTeamForm.sport}
                        onChange={handleEditTeamInputChange}
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
                    
                    <div className="form-group">
                      <label htmlFor="ageGroup">Age Group</label>
                      <select
                        id="ageGroup"
                        name="ageGroup"
                        value={editTeamForm.ageGroup}
                        onChange={handleEditTeamInputChange}
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
                    
                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={editTeamForm.description}
                        onChange={handleEditTeamInputChange}
                        placeholder="Optional team description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Team Profile Photo</label>
                      <div className="photo-upload-section">
                        {teamPhotoPreview ? (
                          <div className="photo-preview">
                            <img src={teamPhotoPreview} alt="Team photo preview" />
                            <div className="photo-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                onClick={() => document.getElementById('teamPhotoInput')?.click()}
                              >
                                Change Photo
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-small"
                                onClick={removeTeamPhoto}
                              >
                                Remove Photo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => document.getElementById('teamPhotoInput')?.click()}
                          >
                            📷 Upload Photo
                          </button>
                        )}
                        <input
                          id="teamPhotoInput"
                          type="file"
                          accept="image/*"
                          onChange={handleTeamPhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={editingTeam}>
                        {editingTeam ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={resetEditForm}>
                        Reset
                      </button>
                    </div>
                  </form>
                </div>

                {/* Team Termination */}
                <div className="settings-section danger-zone">
                  <h4>Danger Zone</h4>
                  <div className="danger-warning">
                    <p>⚠️ <strong>Warning:</strong> Terminating a team will permanently delete all team data, including roster, schedule, and chat history. This action cannot be undone.</p>
                  </div>
                  
                  {!showTerminateConfirm ? (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setShowTerminateConfirm(true)}
                    >
                      🗑️ Terminate Team
                    </button>
                  ) : (
                    <div className="terminate-confirm">
                      <p>Type "DELETE" to confirm team termination:</p>
                      <input
                        type="text"
                        value={terminateConfirm}
                        onChange={(e) => setTerminateConfirm(e.target.value)}
                        placeholder="Type DELETE"
                        className="terminate-input"
                      />
                      <div className="terminate-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowTerminateConfirm(false);
                            setTerminateConfirm('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleTerminateTeam}
                          disabled={terminateConfirm !== 'DELETE'}
                        >
                          Confirm Termination
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Non-coach message */}
            {userTeam.role !== 'COACH' && (
              <div className="non-coach-message">
                <p>Only team coaches can modify team settings.</p>
                <p>Contact your team coach if you need changes made.</p>
              </div>
            )}

            {/* Loading state for coach */}
            {userTeam.role === 'COACH' && loadingTeamDetails && (
              <div className="coach-settings">
                <h3>Team Management</h3>
                <p>Loading team settings...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="content-roster">
            <h2>Team Roster</h2>
            <p>Roster management coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-header">
        <button className="btn btn-back" onClick={handleBackToHome}>
          ← Back to Home
        </button>
                 <h1>{loadingTeamDetails ? 'Loading...' : teamDetails?.teamName || 'Unknown Team'}</h1>
        <button className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="team-layout">
        {/* Sidebar */}
        <div className="team-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => handleTabChange('roster')}
            >
              <span className="sidebar-icon">👥</span>
              <span className="sidebar-text">Roster</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => handleTabChange('schedule')}
            >
              <span className="sidebar-icon">📅</span>
              <span className="sidebar-text">Schedule</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => handleTabChange('tasks')}
            >
              <span className="sidebar-icon">✅</span>
              <span className="sidebar-text">Tasks</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => handleTabChange('chat')}
            >
              <span className="sidebar-icon">💬</span>
              <span className="sidebar-text">Chat</span>
            </button>
            
            <button
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <span className="sidebar-icon">⚙️</span>
              <span className="sidebar-text">Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="team-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default TeamPage;
