import React, { useState, useEffect } from 'react';
import type { Task, TaskUser } from '../types/Task';
import { taskService } from '../services/taskService';
import './TaskDetailsModal.css';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  const [taskUsers, setTaskUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTaskUsers();
  }, [task.id]);

  const loadTaskUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const users = await taskService.getTaskUsers(task.id);
      setTaskUsers(users);
    } catch (err) {
      setError('Failed to load signed up users');
      console.error('Error loading task users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    try {
      // Parse the time string (assuming format like "14:30" or "14:30:00")
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      // Fallback to original format if parsing fails
      return timeString;
    }
  };

  const currentSignups = task.signedUpUserIds.length;
  const hasMinimumSignups = currentSignups >= task.minSignups;

  const getRoleBadgeClass = (role: string) => {
    return role === 'COACH' ? 'role-badge coach' : 'role-badge player';
  };

  const getRoleDisplayName = (role: string) => {
    return role === 'COACH' ? 'Coach' : 'Player';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task Details</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="task-details-content">
          {/* Task Information */}
          <div className="task-info-section">
            <h4 className="task-title">{task.name}</h4>
            
            <div className="task-info-grid">
              <div className="task-info-item">
                <span className="info-label">Date</span>
                <span className="info-value">{formatDate(task.date)}</span>
              </div>
              
              <div className="task-info-item">
                <span className="info-label">Time</span>
                <span className="info-value">{formatTime(task.startTime)}</span>
              </div>
              
              <div className="task-info-item">
                <span className="info-label">Location</span>
                <span className="info-value">{task.location || 'Not specified'}</span>
              </div>
              
              <div className="task-info-item">
                <span className="info-label">Signups</span>
                <span className="info-value">
                  {currentSignups}/{task.maxSignups}
                  {!hasMinimumSignups && (
                    <span className="warning-text"> (Min: {task.minSignups})</span>
                  )}
                </span>
              </div>
            </div>

            {task.description && (
              <div className="task-description">
                <span className="info-label">Description</span>
                <p className="description-text">{task.description}</p>
              </div>
            )}

            {/* Status Indicators */}
            <div className="task-status-indicators">
              {hasMinimumSignups ? (
                <div className="status-badge success">
                  ✓ Minimum signups met
                </div>
              ) : (
                <div className="status-badge warning">
                  ⚠ Needs {task.minSignups - currentSignups} more signup(s)
                </div>
              )}
              
              {currentSignups >= task.maxSignups && (
                <div className="status-badge full">
                  ✗ Task is full
                </div>
              )}
            </div>
          </div>

          {/* Signed Up Users */}
          <div className="users-section">
            <h4>Signed Up Users ({currentSignups})</h4>
            
            {loading ? (
              <div className="loading-message">Loading users...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : taskUsers.length === 0 ? (
              <div className="no-users-message">
                <p>No users have signed up for this task yet.</p>
              </div>
            ) : (
              <div className="users-list">
                {taskUsers.map((user) => (
                  <div key={user.userId} className="user-item">
                    <div className="user-info">
                      <span className="user-name">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <span className={getRoleBadgeClass(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
