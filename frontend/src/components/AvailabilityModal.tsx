import React, { useState, useEffect } from 'react';
import { availabilityService } from '../services/availabilityService';
import './AvailabilityModal.css';

// Define interfaces locally to avoid import issues
interface TeamMemberAvailability {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';
  isCurrentUser: boolean;
}

interface TeamAvailabilityResponse {
  teamAvailability: TeamMemberAvailability[];
  totalMembers: number;
}

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  teamId: string;
  currentUserId: string;
  userRole: string;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  eventId,
  teamId,
  currentUserId,
  userRole
}) => {
  const [availability, setAvailability] = useState<TeamAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventId && teamId) {
      loadAvailability();
    }
  }, [isOpen, eventId, teamId]);

  const loadAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await availabilityService.getTeamAvailabilityForEvent(teamId, eventId, currentUserId);
      setAvailability(data);
    } catch (err) {
      setError('Failed to load availability');
      console.error('Error loading availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'YES' | 'NO' | 'MAYBE') => {
    if (userId !== currentUserId) return; // Only allow users to update their own status
    
    setUpdatingStatus(userId);
    try {
      await availabilityService.setAvailability(currentUserId, teamId, eventId, newStatus);
      // Reload availability to get updated data
      await loadAvailability();
    } catch (err) {
      setError('Failed to update availability');
      console.error('Error updating availability:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'YES':
        return 'status-yes';
      case 'NO':
        return 'status-no';
      case 'MAYBE':
        return 'status-maybe';
      default:
        return 'status-unknown';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'YES':
        return 'Going';
      case 'NO':
        return 'Not Going';
      case 'MAYBE':
        return 'Maybe';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal availability-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Team Availability</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-message">Loading availability...</div>
          ) : availability ? (
            <div className="availability-content">
              <div className="availability-summary">
                <p>Total Team Members: {availability.totalMembers}</p>
              </div>
              
              <div className="availability-list">
                {availability.teamAvailability.map((member) => (
                  <div 
                    key={member.userId} 
                    className={`availability-member ${member.isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="member-info">
                      <div className="member-name">
                        {member.firstName} {member.lastName}
                        {member.isCurrentUser && <span className="current-user-badge">You</span>}
                      </div>
                      <div className="member-role">{member.role}</div>
                    </div>
                    
                    <div className="member-availability">
                      {member.isCurrentUser ? (
                        <div className="status-selector">
                          <button
                            className={`status-btn ${member.status === 'YES' ? 'active' : ''}`}
                            onClick={() => handleStatusUpdate(member.userId, 'YES')}
                            disabled={updatingStatus === member.userId}
                          >
                            Going
                          </button>
                          <button
                            className={`status-btn ${member.status === 'MAYBE' ? 'active' : ''}`}
                            onClick={() => handleStatusUpdate(member.userId, 'MAYBE')}
                            disabled={updatingStatus === member.userId}
                          >
                            Maybe
                          </button>
                          <button
                            className={`status-btn ${member.status === 'NO' ? 'active' : ''}`}
                            onClick={() => handleStatusUpdate(member.userId, 'NO')}
                            disabled={updatingStatus === member.userId}
                          >
                            Not Going
                          </button>
                        </div>
                      ) : (
                        <div className={`status-display ${getStatusColor(member.status)}`}>
                          {getStatusText(member.status)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-availability">
              <p>No availability information available.</p>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
