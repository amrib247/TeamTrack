import React, { useState, useEffect } from 'react';
import type { Task, CreateTaskRequest } from '../types/Task';
import { taskService } from '../services/taskService';
import TaskDetailsModal from './TaskDetailsModal';
import './TaskList.css';

// Task sorting helper function
// Sorts tasks by date and time in ascending order (oldest first)
const sortTasksByDateTime = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    try {
      const dateTimeA = new Date(a.date + 'T' + a.startTime);
      const dateTimeB = new Date(b.date + 'T' + b.startTime);
      return dateTimeA.getTime() - dateTimeB.getTime(); // Ascending order (oldest first)
    } catch (error) {
      // If parsing fails, keep original order
      return 0;
    }
  });
};

interface TaskListProps {
  teamId: string;
  userRole: string;
  teamName: string;
  currentUserId: string;
}

const TaskList: React.FC<TaskListProps> = ({ teamId, userRole, teamName, currentUserId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state for creating/editing tasks
  const [formData, setFormData] = useState<CreateTaskRequest>({
    teamId: teamId,
    name: '',
    location: '',
    description: '',
    date: '',
    startTime: '',
    maxSignups: 10,
    minSignups: 1,
    createdBy: currentUserId
  });

  // Initialize formData teamId when teamId changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, teamId, createdBy: currentUserId }));
  }, [teamId, currentUserId]);

  useEffect(() => {
    if (teamId) {
      loadTasks();
    }
  }, [teamId]);

  const loadTasks = async () => {
    if (!teamId) return;
    
    setLoading(true);
    setError('');
    try {
      const teamTasks = await taskService.getTasksByTeamId(teamId);
      // Ensure tasks are properly sorted by date and time
      setTasks(sortTasksByDateTime(teamTasks));
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate signup limits
    if (formData.minSignups > formData.maxSignups) {
      setError('Minimum signups cannot exceed maximum signups');
      return;
    }
    
    if (formData.minSignups < 0 || formData.maxSignups < 1) {
      setError('Invalid signup limits');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const newTask = await taskService.createTask(formData);
      // Add new task and sort by date and time (oldest first)
      setTasks(prev => sortTasksByDateTime([...prev, newTask]));
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Validate signup limits
    if (formData.minSignups > formData.maxSignups) {
      setError('Minimum signups cannot exceed maximum signups');
      return;
    }
    
    if (formData.minSignups < 0 || formData.maxSignups < 1) {
      setError('Invalid signup limits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedTask = await taskService.updateTask(selectedTask.id, formData);
      // Update task and sort by date and time (oldest first)
      setTasks(prev => {
        const updatedTasks = prev.map(task => 
          task.id === selectedTask.id ? updatedTask : task
        );
        return sortTasksByDateTime(updatedTasks);
      });
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleSignUp = async (taskId: string) => {
    try {
      const updatedTask = await taskService.signUpForTask(taskId, currentUserId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      // Check if the error is about the user already being signed up
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('User is already signed up')) {
        // Silently ignore duplicate signup attempts
        console.log('User is already signed up for this task');
        // Optionally reload tasks to ensure UI is in sync
        loadTasks();
      } else {
        setError('Failed to sign up for task');
        console.error('Error signing up for task:', err);
      }
    }
  };

  const handleRemoveSignup = async (taskId: string) => {
    try {
      const updatedTask = await taskService.removeFromTask(taskId, currentUserId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      setError('Failed to remove signup');
      console.error('Error removing signup:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      teamId: teamId,
      name: '',
      location: '',
      description: '',
      date: '',
      startTime: '',
      maxSignups: 10,
      minSignups: 1,
      createdBy: currentUserId
    });
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      teamId: task.teamId,
      name: task.name,
      location: task.location,
      description: task.description,
      date: task.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
      startTime: task.startTime,
      maxSignups: task.maxSignups,
      minSignups: task.minSignups,
      createdBy: task.createdBy
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openDetailsModal = (task: Task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedTask(null);
    setShowDetailsModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
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

  const canManageTasks = () => {
    return userRole === 'COACH';
  };

  const isUserSignedUp = (task: Task) => {
    return task.signedUpUserIds.includes(currentUserId);
  };

  return (
    <div className="task-list-section">
      <div className="task-list-header">
        <h3>{teamName} Tasks</h3>
        <div className="task-list-controls">
          {canManageTasks() && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Add Task
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading tasks...</div>
      ) : (
        <div className="task-list-content">
          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="no-tasks">
                <p>No tasks scheduled for this team.</p>
                {canManageTasks() && (
                  <button className="btn btn-primary" onClick={openCreateModal}>
                    Add Your First Task
                  </button>
                )}
              </div>
            ) : (
              tasks.map(task => {
                // Compute helper properties for display
                const currentSignups = task.signedUpUserIds.length;
                const isFull = currentSignups >= task.maxSignups;
                const hasMinimumSignups = currentSignups >= task.minSignups;
                
                return (
                  <div 
                    key={task.id} 
                    className={`task-card ${!hasMinimumSignups ? 'task-card-warning' : ''} task-card-clickable`}
                    onClick={() => openDetailsModal(task)}
                    title="Click to view task details and signed up users"
                  >
                  <div className="task-header">
                    <h4 className="task-name">
                      {task.name}
                    </h4>
                    <div className="task-actions">
                      {isUserSignedUp(task) ? (
                        <button 
                          className="btn btn-small btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSignup(task.id);
                          }}
                          title={`Currently signed up. Click to remove signup.`}
                        >
                          ✓ Unsign Up
                        </button>
                      ) : (
                        <button 
                          className="btn btn-small btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignUp(task.id);
                          }}
                          disabled={isFull}
                          title={isFull ? 'Task is full' : 'Click to sign up for this task'}
                        >
                          {isFull ? 'Full' : '+ Sign Up'}
                        </button>
                      )}
                      {canManageTasks() && (
                        <>
                          <button 
                            className="btn btn-small btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(task);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-small btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="task-content">
                    <div className="task-details">
                      <div className="task-column">
                        <div className="task-info">
                          <span className="task-label">Date</span>
                          <span className="task-value">{formatDate(task.date)}</span>
                        </div>
                        {task.description && (
                          <div className="task-info">
                            <span className="task-label">Description</span>
                            <span className="task-value">{task.description}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="task-column">
                        <div className="task-info">
                          <span className="task-label">Time</span>
                          <span className="task-value">{formatTime(task.startTime)}</span>
                        </div>
                        <div className="task-info">
                          <span className="task-label">Location</span>
                          <span className="task-value">{task.location}</span>
                        </div>
                      </div>
                      
                      <div className="task-signup-section">
                        <div className="task-signup-info">
                          <span className="task-signup-label">Signups</span>
                          <span className="task-signup-value">
                            {currentSignups}/{task.maxSignups}
                          </span>
                        </div>
                        <div className="task-min-signup">
                          <span className="task-min-label">Min Required</span>
                          <span className="task-min-value">{task.minSignups}</span>
                        </div>
                        {isUserSignedUp(task) && (
                          <div className="task-status user-signed-up">
                            ✓ You are signed up
                          </div>
                        )}
                        {hasMinimumSignups && (
                          <div className="task-status success">
                            ✓ Minimum signups met
                          </div>
                        )}
                        {isFull && (
                          <div className="task-status full">
                            ✗ Task is full
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button 
                className="close-button" 
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label htmlFor="name">Task Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="time"
                    id="startTime"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minSignups">Minimum Signups *</label>
                  <input
                    type="number"
                    id="minSignups"
                    value={formData.minSignups}
                    onChange={(e) => setFormData(prev => ({ ...prev, minSignups: parseInt(e.target.value) || 1 }))}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="maxSignups">Maximum Signups *</label>
                  <input
                    type="number"
                    id="maxSignups"
                    value={formData.maxSignups}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSignups: parseInt(e.target.value) || 10 }))}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description, details, or notes..."
                  rows={3}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button 
                className="close-button" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="task-form">
              <div className="form-group">
                <label htmlFor="edit-name">Task Name *</label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-date">Date *</label>
                  <input
                    type="date"
                    id="edit-date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-startTime">Start Time *</label>
                  <input
                    type="time"
                    id="edit-startTime"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-location">Location</label>
                <input
                  type="text"
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-minSignups">Minimum Signups *</label>
                  <input
                    type="number"
                    id="edit-minSignups"
                    value={formData.minSignups}
                    onChange={(e) => setFormData(prev => ({ ...prev, minSignups: parseInt(e.target.value) || 1 }))}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-maxSignups">Maximum Signups *</label>
                  <input
                    type="number"
                    id="edit-maxSignups"
                    value={formData.maxSignups}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSignups: parseInt(e.target.value) || 10 }))}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-description">Description (Optional)</label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description, details, or notes..."
                  rows={3}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          onClose={closeDetailsModal}
        />
      )}
    </div>
  );
};

export default TaskList;
