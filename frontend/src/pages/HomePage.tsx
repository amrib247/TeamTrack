import React, { useState, useRef } from 'react';
import { authService } from '../services/authService';
import type { AuthResponse } from '../types/Auth';
import './HomePage.css';

interface HomePageProps {
  currentUser: AuthResponse;
  onLogout: () => void;
}

function HomePage({ currentUser, onLogout }: HomePageProps) {
  const [error, setError] = useState<string>('');
  
  // Settings modal states
  const [showSettings, setShowSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [terminatePassword, setTerminatePassword] = useState('');
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminateConfirm, setTerminateConfirm] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings modal functions
  const openSettings = () => {
    setShowSettings(true);
    setEditFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      phoneNumber: currentUser?.phoneNumber || ''
    });
    setIsEditMode(false);
    setEditPassword('');
    setTerminatePassword('');
    setShowTerminateConfirm(false);
    setTerminateConfirm('');
  };

  const closeSettings = () => {
    setShowSettings(false);
    setIsEditMode(false);
    setEditPassword('');
    setTerminatePassword('');
    setShowTerminateConfirm(false);
    setTerminateConfirm('');
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setEditPassword('');
      setEditFormData({
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        phoneNumber: currentUser?.phoneNumber || ''
      });
    } else {
      setIsEditMode(true);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveChanges = async () => {
    if (!editPassword.trim()) {
      setError('Please enter your password to save changes');
      return;
    }

    // Validate the edited form data
    if (!editFormData.firstName.trim() || !editFormData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    // Validate phone number if provided
    if (editFormData.phoneNumber.trim()) {
      if (editFormData.phoneNumber.trim().length !== 10) {
        setError('Phone number must be exactly 10 digits long (or leave blank)');
        return;
      }
      if (!/^\d{10}$/.test(editFormData.phoneNumber.trim())) {
        setError('Phone number must contain only digits');
        return;
      }
    }

    try {
      // Update user information using the backend service
      const updateRequest = {
        email: currentUser?.email || '', // Use current user's email since it can't be changed
        password: editPassword,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phoneNumber: editFormData.phoneNumber
      };
      
      const updatedUser = await authService.updateUser(updateRequest);
      
      // Update the current user with the new data
      // Note: In a real app, you'd want to update the parent state
      // For now, we'll just close the modal
      
      // Close edit mode
      setIsEditMode(false);
      setEditPassword('');
      setError('');
      
      // Show success message
      alert('Changes saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAccountTermination = async () => {
    if (!terminatePassword.trim()) {
      setError('Please enter your password');
      return;
    }
    if (terminateConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      // Actually delete the account using the backend service
      await authService.deleteAccount({
        email: currentUser?.email || '',
        password: terminatePassword
      });
      
      // Account was successfully deleted
      alert('Account has been permanently deleted.');
      closeSettings();
      onLogout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  return (
    <div className="app home-page">
      <div className="container">
        {/* Settings button at top left */}
        <div className="settings-button">
          <button className="btn btn-settings" onClick={openSettings}>
            ⚙️ Settings
          </button>
        </div>
        
        <h1>Welcome, {currentUser.firstName}!</h1>
         
         <div className="team-actions">
           <h3>Team Management</h3>
           <div className="action-buttons">
             <button className="btn btn-primary">
               🏆 Join a Team
             </button>
             <button className="btn btn-primary">
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

      {/* Settings Modal */}
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
              {/* Profile Photo Section */}
              <div className="profile-section">
                <div className="profile-photo">
                  <img 
                    src={profilePhoto || 'https://via.placeholder.com/120x120?text=Profile+Photo'} 
                    alt="Profile" 
                    onClick={triggerFileUpload}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                  />
                  <div className="upload-text" onClick={triggerFileUpload}>
                    Click to upload photo
                  </div>
                  {profilePhoto && (
                    <button 
                      className="btn btn-secondary remove-photo-btn" 
                      onClick={() => setProfilePhoto(null)}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="info-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>First Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditInputChange}
                      />
                    ) : (
                      <div className="info-display">{currentUser.firstName}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Last Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditInputChange}
                      />
                    ) : (
                      <div className="info-display">{currentUser.lastName}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <div className="info-display">{currentUser.email}</div>
                  </div>
                  <div className="info-item">
                    <label>Phone Number</label>
                    {isEditMode ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={editFormData.phoneNumber}
                        onChange={handleEditInputChange}
                        placeholder="10 digits (optional)"
                        maxLength={10}
                      />
                    ) : (
                      <div className="info-display">
                        {editFormData.phoneNumber && editFormData.phoneNumber.trim() ? editFormData.phoneNumber : 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Teams and Roles Section */}
              <div className="info-section">
                <h4>Teams & Roles</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Current Team</label>
                    <div className="info-display">{currentUser.teamId || 'Not assigned to any team'}</div>
                  </div>
                  <div className="info-item">
                    <label>Current Role</label>
                    <div className="info-display">{currentUser.role} (default)</div>
                  </div>
                  <div className="info-item">
                    <label>Date Joined</label>
                    <div className="info-display">{new Date(currentUser.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Edit Mode Controls */}
              {isEditMode && (
                <div className="edit-mode">
                  <strong>Edit Mode Active</strong> - Enter your password to save changes
                  <div className="password-verification">
                    <label>Password:</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                  </div>
                  <div className="edit-buttons">
                    <button className="btn btn-primary" onClick={saveChanges}>
                      Save Changes
                    </button>
                    <button className="btn btn-secondary" onClick={toggleEditMode}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Button */}
              {!isEditMode && (
                <div className="edit-buttons">
                  <button className="btn btn-primary" onClick={toggleEditMode}>
                    Edit Information
                  </button>
                </div>
              )}

              {/* Account Termination Section */}
              <div className="account-termination">
                <h4>⚠️ Danger Zone</h4>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                
                {!showTerminateConfirm ? (
                  <button 
                    className="terminate-button"
                    onClick={() => setShowTerminateConfirm(true)}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div>
                    <div className="password-verification">
                      <label>Enter your password:</label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={terminatePassword}
                        onChange={(e) => setTerminatePassword(e.target.value)}
                      />
                    </div>
                    <div className="password-verification">
                      <label>Type DELETE to confirm:</label>
                      <input
                        type="text"
                        placeholder="Type DELETE"
                        value={terminateConfirm}
                        onChange={(e) => setTerminateConfirm(e.target.value)}
                      />
                    </div>
                    <div className="edit-buttons">
                      <button 
                        className="terminate-button"
                        onClick={handleAccountTermination}
                        disabled={!terminatePassword.trim() || terminateConfirm !== 'DELETE'}
                      >
                        Permanently Delete Account
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowTerminateConfirm(false)}
                      >
                        Cancel
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
