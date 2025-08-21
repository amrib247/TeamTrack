import React, { useState, useEffect } from 'react';
import type { Event, CreateEventRequest } from '../types/Event';
import { eventService } from '../services/eventService';
import './Schedule.css';

// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDateForCalendar = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const getEventsForDate = (events: Event[], date: string) => {
  return events.filter(event => formatDateForCalendar(event.date) === date);
};

interface ScheduleProps {
  teamId: string;
  userRole: string;
  teamName: string;
}

const Schedule: React.FC<ScheduleProps> = ({ teamId, userRole, teamName }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(false);

  // Form state for creating/editing events
  const [formData, setFormData] = useState<CreateEventRequest>({
    teamId: teamId,
    name: '',
    tournamentLeague: '',
    date: '',
    startTime: '',
    lengthMinutes: 60,
    location: '',
    description: '',
    score: ''
  });

  // Initialize formData teamId when teamId changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, teamId }));
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      loadEvents();
    }
  }, [teamId]);

  const loadEvents = async () => {
    if (!teamId) return;
    
    setLoading(true);
    setError('');
    try {
      const teamEvents = await eventService.getEventsByTeamId(teamId);
      setEvents(teamEvents);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate score format if provided
    if (formData.score && !/^\d+-\d+$/.test(formData.score)) {
      setError('Score must be in format: number-number (e.g., 3-1)');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const newEvent = await eventService.createEvent(formData);
      setEvents(prev => [...prev, newEvent]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    // Validate score format if provided
    if (formData.score && !/^\d+-\d+$/.test(formData.score)) {
      setError('Score must be in format: number-number (e.g., 3-1)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedEvent = await eventService.updateEvent(selectedEvent.id, formData);
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? updatedEvent : event
      ));
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
    } catch (err) {
      setError('Failed to update event');
      console.error('Error updating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      setError('Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      teamId: teamId,
      name: '',
      tournamentLeague: '',
      date: '',
      startTime: '',
      lengthMinutes: 60,
      location: '',
      description: '',
      score: ''
    });
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      teamId: event.teamId,
      name: event.name,
      tournamentLeague: event.tournamentLeague,
      date: event.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
      startTime: event.startTime,
      lengthMinutes: event.lengthMinutes,
      location: event.location,
      description: event.description || '',
      score: event.score || ''
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const canManageEvents = () => {
    return userRole === 'COACH';
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const closeEventDetails = () => {
    setShowEventDetails(false);
    setSelectedEvent(null);
  };

  return (
    <div className="schedule-section">
      <div className="schedule-header">
        <h3>{teamName} Schedule</h3>
        <div className="schedule-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>

          {canManageEvents() && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Add Event
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading events...</div>
      ) : (
        <div className="schedule-content">
          {viewMode === 'list' ? (
            <div className="events-list">
              {events.length === 0 ? (
                <div className="no-events">
                  <p>No events scheduled for this team.</p>
                  {canManageEvents() && (
                    <button className="btn btn-primary" onClick={openCreateModal}>
                      Add Your First Event
                    </button>
                  )}
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h4>{event.name}</h4>
                      {canManageEvents() && (
                        <div className="event-actions">
                          <button 
                            className="btn btn-small btn-secondary"
                            onClick={() => openEditModal(event)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="event-content">
                      <div className="event-details">
                        <div className="event-column">
                          <div className="event-info">
                            <span className="event-label">Tournament/League</span>
                            <span className="event-value">{event.tournamentLeague}</span>
                          </div>
                          <div className="event-info">
                            <span className="event-label">Date</span>
                            <span className="event-value">{formatDate(event.date)}</span>
                          </div>
                          {event.description && (
                            <div className="event-info">
                              <span className="event-label">Description</span>
                              <span className="event-value">{event.description}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="event-column">
                          <div className="event-info">
                            <span className="event-label">Time</span>
                            <span className="event-value">{formatTime(event.startTime)} ({formatDuration(event.lengthMinutes)})</span>
                          </div>
                          <div className="event-info">
                            <span className="event-label">Location</span>
                            <span className="event-value">{event.location}</span>
                          </div>
                        </div>
                        
                        {event.score && (
                          <div className="event-score-section">
                            <span className="event-score-label">Final Score</span>
                            <span className="event-score-value">{event.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="calendar-view">
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
                  ‹
                </button>
                <h4 className="calendar-title">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button className="calendar-nav-btn" onClick={goToNextMonth}>
                  ›
                </button>
                <button className="calendar-today-btn" onClick={goToToday}>
                  Today
                </button>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                  ))}
                </div>
                
                <div className="calendar-days">
                  {(() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const daysInMonth = getDaysInMonth(year, month);
                    const firstDayOfMonth = getFirstDayOfMonth(year, month);
                    const days = [];
                    
                    // Add empty cells for days before the first day of the month
                    for (let i = 0; i < firstDayOfMonth; i++) {
                      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                    }
                    
                    // Add cells for each day of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayEvents = getEventsForDate(events, dateString);
                      const isToday = dateString === new Date().toISOString().split('T')[0];
                      
                      days.push(
                        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                          <div className="calendar-day-number">{day}</div>
                          <div className="calendar-day-events">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className="calendar-event-card"
                                onClick={() => openEventDetails(event)}
                              >
                                <div className="calendar-event-name">{event.name}</div>
                                <div className="calendar-event-time">{formatTime(event.startTime)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Event</h3>
              <button 
                className="close-button" 
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="event-form">
              <div className="form-group">
                <label htmlFor="name">Event Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tournamentLeague">Tournament/League</label>
                <input
                  type="text"
                  id="tournamentLeague"
                  value={formData.tournamentLeague}
                  onChange={(e) => setFormData(prev => ({ ...prev, tournamentLeague: e.target.value }))}
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
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lengthMinutes">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="lengthMinutes"
                    value={formData.lengthMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, lengthMinutes: parseInt(e.target.value) || 60 }))}
                    min="15"
                    step="15"
                    required
                  />
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
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter event description, details, or notes..."
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="score">Score (Optional)</label>
                <input
                  type="text"
                  id="score"
                  value={formData.score}
                  onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                  placeholder="Enter final score (e.g., 3-1, 2-0, etc.)"
                  pattern="^\d+-\d+$"
                  title="Score must be in format: number-number (e.g., 3-1)"
                />
                {formData.score && !/^\d+-\d+$/.test(formData.score) && (
                  <div className="error-message">Score must be in format: number-number (e.g., 3-1)</div>
                )}
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
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Event</h3>
              <button 
                className="close-button" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="event-form">
              <div className="form-group">
                <label htmlFor="edit-name">Event Name *</label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-tournamentLeague">Tournament/League</label>
                <input
                  type="text"
                  id="edit-tournamentLeague"
                  value={formData.tournamentLeague}
                  onChange={(e) => setFormData(prev => ({ ...prev, tournamentLeague: e.target.value }))}
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
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-lengthMinutes">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="edit-lengthMinutes"
                    value={formData.lengthMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, lengthMinutes: parseInt(e.target.value) || 60 }))}
                    min="15"
                    step="15"
                    required
                  />
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
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-description">Description (Optional)</label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter event description, details, or notes..."
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-score">Score (Optional)</label>
                <input
                  type="text"
                  id="edit-score"
                  value={formData.score}
                  onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
                  placeholder="Enter final score (e.g., 3-1, 2-0, etc.)"
                  pattern="^\d+-\d+$"
                  title="Score must be in format: number-number (e.g., 3-1)"
                />
                {formData.score && !/^\d+-\d+$/.test(formData.score) && (
                  <div className="error-message">Score must be in format: number-number (e.g., 3-1)</div>
                )}
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
                  {loading ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="modal-overlay" onClick={closeEventDetails}>
          <div className="modal event-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.name}</h3>
              <button 
                className="close-button" 
                onClick={closeEventDetails}
              >
                ×
              </button>
            </div>
            <div className="event-details-content">
              <div className="event-details-grid">
                <div className="event-detail-item">
                  <span className="detail-label">Tournament/League</span>
                  <span className="detail-value">{selectedEvent.tournamentLeague}</span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDate(selectedEvent.date)}</span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{formatTime(selectedEvent.startTime)} ({formatDuration(selectedEvent.lengthMinutes)})</span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{selectedEvent.location}</span>
                </div>
                {selectedEvent.description && (
                  <div className="event-detail-item">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{selectedEvent.description}</span>
                  </div>
                )}
                {selectedEvent.score && (
                  <div className="event-detail-item score-item">
                    <span className="detail-label">Final Score</span>
                    <span className="detail-value score-value">{selectedEvent.score}</span>
                  </div>
                )}
              </div>
              
              {canManageEvents() && (
                <div className="event-details-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      closeEventDetails();
                      openEditModal(selectedEvent);
                    }}
                  >
                    Edit Event
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this event?')) {
                        handleDeleteEvent(selectedEvent.id);
                        closeEventDetails();
                      }
                    }}
                  >
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
