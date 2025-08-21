import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { UserTeam } from '../types/Auth';
import { teamService, type TeamMember } from '../services/teamService';
import Schedule from '../components/Schedule';
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

  // Leave team states
  const [showLeaveTeamConfirm, setShowLeaveTeamConfirm] = useState(false);
  const [leaveTeamConfirm, setLeaveTeamConfirm] = useState('');
  
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
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'PLAYER'
  });
  const [invitingUser, setInvitingUser] = useState(false);
  const [inviteError, setInviteError] = useState<string>('');

  // State for user management (coaches only)
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  // State for coach count
  const [coachCount, setCoachCount] = useState<number>(0);
  const [loadingCoachCount, setLoadingCoachCount] = useState(false);
  const [showCoachSafetyModal, setShowCoachSafetyModal] = useState(false);
  const [coachSafetyData, setCoachSafetyData] = useState<any>(null);

  // Debug logging
  console.log('🔍 TeamPage Debug:', {
    userTeamId,
    userTeam,
    allTeams: currentUser.teams.map(t => ({ id: t.id, teamId: t.teamId }))
  });
  
  // Early return if userTeam is not found
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
          console.log('🔍 Fetching team members for teamId:', userTeam.teamId);
          const members = await teamService.getTeamMembers(userTeam.teamId);
          setTeamMembers(members);
          console.log('✅ Team members fetched:', members);
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
          console.log('👥 Fetching coach count for teamId:', userTeam.teamId);
          const count = await teamService.getCoachCount(userTeam.teamId);
          setCoachCount(count);
          console.log('✅ Coach count fetched:', count);
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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleBackToHome = () => {
    navigate('/home');
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

  const handleLeaveTeam = async () => {
    if (leaveTeamConfirm !== 'LEAVE') {
      setError('Please type LEAVE to confirm leaving the team');
      return;
    }

    try {
      setError('');
      
      // Call the backend API to leave team
      console.log('👋 Leaving team with userTeamId:', userTeamId);
      await teamService.leaveTeam(userTeamId!, currentUser.id);
      
      // Show success message and redirect
      alert('You have left the team successfully!');
      
      // Refresh user data to update the home page
      // We need to navigate back to home first, then refresh
      navigate('/home');
      
      // Force a page reload to ensure the home page shows updated data
      window.location.reload();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave team';
      console.log('🔍 Leave team error:', errorMessage);
      
      // Check if this is a coach safety error
      if (errorMessage.includes("You are the only coach")) {
        console.log('✅ Coach safety error detected, showing modal');
        // Show the coach safety modal instead of error message
        setShowCoachSafetyModal(true);
        // Clear any existing error message
        setError('');
      } else {
        console.log('❌ Not a coach safety error, showing error message');
        console.log('❌ Error message was:', errorMessage);
        // Only show error message if it's not a coach safety issue
        setError(errorMessage);
      }
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.email.trim() || !inviteForm.role) {
      setInviteError('Please fill in all fields');
      return;
    }

    try {
      setInvitingUser(true);
      setInviteError('');
      
      await teamService.inviteUserToTeam(userTeam.teamId, inviteForm.email, inviteForm.role);
      
      // Show success message
      alert('User invited successfully!');
      
      // Reset form and close
      setInviteForm({ email: '', role: 'PLAYER' });
      setShowInviteForm(false);
      
      // Refresh team members to show the new invite
      if (activeTab === 'roster') {
        const members = await teamService.getTeamMembers(userTeam.teamId);
        setTeamMembers(members);
      }
      
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInvitingUser(false);
    }
  };

  // Helper function to sort team members by role
  const sortTeamMembersByRole = (members: TeamMember[]) => {
    const roleOrder = { 'COACH': 1, 'PARENT': 2, 'PLAYER': 3 };
    return [...members].sort((a, b) => {
      const orderA = roleOrder[a.role as keyof typeof roleOrder] || 4;
      const orderB = roleOrder[b.role as keyof typeof roleOrder] || 4;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If same role, sort by last name, then first name
      if (a.lastName !== b.lastName) {
        return a.lastName.localeCompare(b.lastName);
      }
      return a.firstName.localeCompare(b.firstName);
    });
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'COACH': return 'Coach';
      case 'PARENT': return 'Parent';
      case 'PLAYER': return 'Player';
      default: return role;
    }
  };

  // User management functions (coaches only)
  const handleUserClick = (user: TeamMember) => {
    if (userTeam.role === 'COACH' && user.userId !== currentUser.id) {
      setSelectedUser(user);
      setNewRole(user.role);
      setShowUserManagementModal(true);
    }
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser || !newRole.trim()) {
      setError('Please select a valid role');
      return;
    }

    // Prevent coaches from changing their own role
    if (selectedUser.userId === currentUser.id) {
      setError('You cannot change your own role');
      return;
    }

    try {
      setError('');
      await teamService.updateUserRole(selectedUser.id, newRole);
      
      // Update local state
      setTeamMembers(prev => prev.map(member => 
        member.id === selectedUser.id 
          ? { ...member, role: newRole }
          : member
      ));
      
      alert('User role updated successfully!');
      setShowUserManagementModal(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleRemoveUserFromTeam = async () => {
    if (!selectedUser) {
      setError('No user selected');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${selectedUser.firstName} ${selectedUser.lastName} from the team? This action cannot be undone.`)) {
      try {
        setError('');
        await teamService.removeUserFromTeam(selectedUser.id);
        
        // Update local state
        setTeamMembers(prev => prev.filter(member => member.id !== selectedUser.id));
        
        alert('User removed from team successfully!');
        setShowUserManagementModal(false);
        setSelectedUser(null);
        setNewRole('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove user from team');
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'roster':
        return (
          <div className="content-roster">
            <div className="roster-header">
              <h2>Team Roster</h2>
              <div className="roster-header-actions">
                {/* Coach Count Display */}
                <div className="coach-count-display">
                  <span className="coach-count-label">👥 Coaches:</span>
                  {loadingCoachCount ? (
                    <span className="coach-count-loading">Loading...</span>
                  ) : (
                    <span className="coach-count-value">{coachCount}</span>
                  )}
                </div>
                
                {userTeam.role === 'COACH' && (
                  <>
                    <p className="coach-hint">💡 Click on any roster member (except yourself) to manage their role. Coaches can change other coaches' roles but cannot change their own.</p>
                    <button 
                      className="btn btn-invite"
                      onClick={() => setShowInviteForm(true)}
                    >
                      Invite User
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Invite Form Modal */}
            {showInviteForm && (
              <div className="invite-form-modal">
                <div className="invite-form-content">
                  <h3>Invite User to Team</h3>
                  <form onSubmit={handleInviteUser}>
                    <div className="form-group">
                      <label htmlFor="inviteEmail">Email Address</label>
                      <input
                        type="email"
                        id="inviteEmail"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter user's email"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="inviteRole">Role</label>
                      <select
                        id="inviteRole"
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                        required
                      >
                        <option value="PLAYER">Player</option>
                        <option value="PARENT">Parent</option>
                        <option value="COACH">Coach</option>
                      </select>
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
                          setInviteForm({ email: '', role: 'PLAYER' });
                          setInviteError('');
                        }}
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
            
            {loadingTeamMembers ? (
              <div className="loading-message">
                <p>Loading team roster...</p>
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="roster-container">
                {sortTeamMembersByRole(teamMembers).map((member) => {
                  const isClickable = userTeam.role === 'COACH' && member.userId !== currentUser.id;
                  return (
                    <div 
                      key={member.id} 
                      className={`roster-member ${isClickable ? 'clickable' : ''}`} 
                      data-role={member.role}
                      onClick={() => handleUserClick(member)}
                      style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    >
                    <div className="member-avatar">
                      <div className="profile-photo">
                        {member.profilePhotoUrl ? (
                          <img src={member.profilePhotoUrl} alt={`${member.firstName} ${member.lastName}`} />
                        ) : (
                          <div className="profile-initials">
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="member-info">
                      <div className="member-name">
                        {member.firstName} {member.lastName}
                        {!member.inviteAccepted && (
                          <span className="invite-pending"> (Invite Pending)</span>
                        )}
                      </div>
                      <div className="member-role">
                        {getRoleDisplayName(member.role)}
                      </div>
                      <div className="member-details">
                        <span className="member-email">{member.email}</span>
                        {member.phoneNumber && (
                          <span className="member-phone">Phone: {member.phoneNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-roster">
                <p>No team members found.</p>
                <p>Team roster will appear here once members are added.</p>
              </div>
            )}

            {/* User Management Modal */}
            {showUserManagementModal && selectedUser && (
              <div className="modal-overlay" onClick={() => setShowUserManagementModal(false)}>
                <div className="modal user-management-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Manage User: {selectedUser.firstName} {selectedUser.lastName}</h3>
                  
                  <div className="form-group">
                    <label htmlFor="newRole">Role</label>
                    <select
                      id="newRole"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      required
                    >
                      <option value="PLAYER">Player</option>
                      <option value="PARENT">Parent</option>
                      {selectedUser.userId !== currentUser.id && (
                        <option value="COACH">Coach</option>
                      )}
                    </select>
                  </div>

                  {selectedUser.role === 'COACH' && (
                    <div className="info-message">
                      <p>💡 <strong>Note:</strong> Coaches cannot be removed from the team, but their role can be changed by other coaches.</p>
                    </div>
                  )}

                  {selectedUser.userId === currentUser.id && (
                    <div className="info-message">
                      <p>⚠️ <strong>Note:</strong> You cannot change your own role.</p>
                    </div>
                  )}

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowUserManagementModal(false);
                        setSelectedUser(null);
                        setNewRole('');
                        setError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-warning"
                      onClick={handleUpdateUserRole}
                    >
                      Update Role
                    </button>
                    {selectedUser.role !== 'COACH' && (
                      <button 
                        type="button" 
                        className="btn btn-danger"
                        onClick={handleRemoveUserFromTeam}
                      >
                        Remove from Team
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'schedule':
        return (
          <div className="content-schedule">
            <Schedule 
              teamId={userTeam.teamId}
              userRole={userTeam.role}
              teamName={teamDetails?.teamName || 'Loading...'}
              currentUserId={currentUser.id}
            />
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

            {/* Leave Team Section for Coaches */}
            <div className="settings-section danger-zone">
              <h4>Leave Team</h4>
              <div className="danger-warning">
                <p>⚠️ <strong>Warning:</strong> Leaving the team will remove you from the roster and you will lose access to team information. This action cannot be undone.</p>
                <p><strong>Note:</strong> As a coach, leaving the team will transfer ownership to another team member or the team may become inactive.</p>
              </div>
              
              {!showLeaveTeamConfirm ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowLeaveTeamConfirm(true)}
                >
                  🚪 Leave Team
                </button>
              ) : (
                <div className="leave-team-confirm">
                  <p>Type "LEAVE" to confirm leaving the team:</p>
                  <input
                    type="text"
                    value={leaveTeamConfirm}
                    onChange={(e) => setLeaveTeamConfirm(e.target.value)}
                    placeholder="Type LEAVE"
                    className="leave-team-input"
                  />
                  <div className="leave-team-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowLeaveTeamConfirm(false);
                        setLeaveTeamConfirm('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleLeaveTeam}
                      disabled={leaveTeamConfirm !== 'LEAVE'}
                    >
                      Confirm Leave
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

        {/* View-only settings for non-coach users */}
        {userTeam.role !== 'COACH' && teamDetails && (
          <div className="view-only-settings">
            
            {/* Leave Team Section */}
            <div className="settings-section danger-zone">
              <h4>Leave Team</h4>
              <div className="danger-warning">
                <p>⚠️ <strong>Warning:</strong> Leaving the team will remove you from the roster and you will lose access to team information. This action cannot be undone.</p>
              </div>
              
              {!showLeaveTeamConfirm ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowLeaveTeamConfirm(true)}
                >
                  🚪 Leave Team
                </button>
              ) : (
                <div className="leave-team-confirm">
                  <p>Type "LEAVE" to confirm leaving the team:</p>
                  <input
                    type="text"
                    value={leaveTeamConfirm}
                    onChange={(e) => setLeaveTeamConfirm(e.target.value)}
                    placeholder="Type LEAVE"
                    className="leave-team-input"
                  />
                  <div className="leave-team-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowLeaveTeamConfirm(false);
                        setLeaveTeamConfirm('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleLeaveTeam}
                      disabled={leaveTeamConfirm !== 'LEAVE'}
                    >
                      Confirm Leave
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Coach Safety Modal */}
      {showCoachSafetyModal && (
        <div className="modal-overlay" onClick={() => setShowCoachSafetyModal(false)}>
          <div className="modal coach-safety-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Coach Safety Check</h3>
            <p>You are the only coach of this team. You must take action before you can leave the team.</p>
            
            <div className="coach-safety-options">
              <div className="option-card">
                <h4>👑 Promote Someone to Coach</h4>
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
                <h4>🗑️ Delete Team</h4>
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