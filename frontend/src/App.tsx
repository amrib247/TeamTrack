import React, { useState, useRef } from 'react';
import { authService } from './services/authService';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types/Auth';
import { UserRole } from './types/Auth';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
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

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!isLogin) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      // Check for letters and numbers
      if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        setError('Password must contain both letters and numbers');
        return;
      }
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First name and last name are required');
        return;
      }
      if (formData.phoneNumber.trim() && formData.phoneNumber.trim().length !== 10) {
        setError('Phone number must be exactly 10 digits long (or leave blank)');
        return;
      }
      if (formData.phoneNumber.trim() && !/^\d{10}$/.test(formData.phoneNumber.trim())) {
        setError('Phone number must contain only digits');
        return;
      }
      if (!formData.dateOfBirth) {
        setError('Date of birth is required');
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const loginRequest: LoginRequest = {
          email: formData.email,
          password: formData.password
        };
        const user = await authService.login(loginRequest);
        setCurrentUser(user);
        setError('');
      } else {
        const registerRequest: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth
        };
        const user = await authService.register(registerRequest);
        setCurrentUser(user);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: ''
    });
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: ''
    });
  };

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
      setCurrentUser(updatedUser);
      
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
      handleLogout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  if (currentUser) {
    return (
      <div className="app">
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
            <button className="btn btn-secondary" onClick={handleLogout}>
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

  return (
    <div className="app">
      <div className="container">
        <h1>TeamTrack</h1>
        <p className="subtitle">Sports Team Management System</p>
        
        <div className="auth-container">
          <div className="auth-header">
            <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
            <button 
              className="toggle-btn" 
              onClick={toggleMode}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                placeholder={isLogin ? "Enter your password" : "At least 6 chars, letters & numbers"}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10 digits (optional)"
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;