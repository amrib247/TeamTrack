import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentService } from '../services/tournamentService';
import type { Tournament, AuthResponse, UpdateTournamentRequest } from '../types/Auth';
import './TournamentPage.css';

interface TournamentPageProps {
  currentUser: AuthResponse;
}

function TournamentPage({ currentUser }: TournamentPageProps) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'organizers' | 'teams' | 'scheduling' | 'settings'>('organizers');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
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
          <div className="tab-content">
            <h2>Tournament Organizers</h2>
            <div className="organizers-content">
              <div className="organizer-info">
                <h3>Tournament Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{tournament.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Size:</label>
                    <span>{tournament.teamIds.length}/{tournament.maxSize} teams</span>
                  </div>
                  <div className="info-item">
                    <label>Created:</label>
                    <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
                  </div>
                  {tournament.description && (
                    <div className="info-item">
                      <label>Description:</label>
                      <span>{tournament.description}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="organizer-info">
                <h3>Status</h3>
                <div className="status-info">
                  {tournament.teamIds.length >= tournament.maxSize ? (
                    <span className="status-full">🏆 Tournament is Full</span>
                  ) : (
                    <span className="status-open">📝 Open for Registration</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'scheduling':
        return (
          <div className="tab-content">
            <h2>Tournament Scheduling</h2>
            <div className="scheduling-content">
              <p>Tournament scheduling functionality will be implemented here.</p>
              <p>This will include:</p>
              <ul>
                <li>Match scheduling</li>
                <li>Bracket generation</li>
                <li>Game times and venues</li>
                <li>Results tracking</li>
              </ul>
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="tab-content">
            <h2>Tournament Teams</h2>
            <div className="teams-content">
              {tournament.teamIds.length === 0 ? (
                <div className="no-teams">
                  <p>No teams have joined this tournament yet.</p>
                </div>
              ) : (
                <div className="teams-list">
                  <h3>Registered Teams ({tournament.teamIds.length})</h3>
                  <div className="team-cards">
                    {tournament.teamIds.map((teamId, index) => (
                      <div key={teamId} className="team-card">
                        <div className="team-info">
                          <h4>Team {index + 1}</h4>
                          <p>ID: {teamId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="tab-content">
            <h2>Tournament Settings</h2>
            <div className="settings-content">
              
              {/* Tournament Information Display */}
              <div className="tournament-info">
                <h3>Tournament Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{tournament.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Max Teams:</label>
                    <span>{tournament.maxSize}</span>
                  </div>
                  <div className="info-item">
                    <label>Current Teams:</label>
                    <span>{tournament.teamIds.length}</span>
                  </div>
                  <div className="info-item">
                    <label>Created:</label>
                    <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
                  </div>
                  {tournament.description && (
                    <div className="info-item">
                      <label>Description:</label>
                      <span>{tournament.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Tournament Information */}
              <div className="settings-section">
                <h4>Edit Tournament Information</h4>
                {isEditMode ? (
                  <form className="edit-tournament-form" onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
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
                        onChange={handleEditInputChange}
                        placeholder="Optional tournament description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="form-actions">
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
                  <div className="edit-tournament-actions">
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
              <div className="settings-section danger-zone">
                <h4>Danger Zone</h4>
                <div className="danger-warning">
                  <p>⚠️ <strong>Warning:</strong> Deleting a tournament will permanently remove all tournament data, including team registrations and organizer information. This action cannot be undone.</p>
                </div>
                
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
                      className="delete-input"
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
      <div className="tournament-sidebar">
        <div className="sidebar-header">
          <h2>{tournament.name}</h2>
          <p className="tournament-subtitle">Tournament Management</p>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'organizers' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizers')}
          >
            👑 Organizers
          </button>
          <button
            className={`nav-item ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            👥 Teams
          </button>
          <button
            className={`nav-item ${activeTab === 'scheduling' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduling')}
          >
            📅 Scheduling
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>

      <div className="tournament-main">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default TournamentPage;
