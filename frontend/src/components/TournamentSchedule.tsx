import React, { useState, useEffect } from 'react';
import type { Event, CreateEventRequest } from '../types/Event';
import { eventService } from '../services/eventService';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import './TournamentSchedule.css';

// Calendar helper functions for weekly view
const getWeekDates = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDates.push(day);
  }
  return weekDates;
};

const formatDateForCalendar = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const getEventsForDate = (events: Event[], date: string) => {
  return events.filter(event => formatDateForCalendar(event.date) === date);
};

// Event sorting helper function
const sortEventsByDateTime = (events: Event[]): Event[] => {
  return events.sort((a, b) => {
    try {
      const dateTimeA = new Date(a.date + 'T' + a.startTime);
      const dateTimeB = new Date(b.date + 'T' + b.startTime);
      return dateTimeA.getTime() - dateTimeB.getTime();
    } catch (error) {
      return 0;
    }
  });
};

// Group events that represent the same game
const groupGameEvents = (events: Event[]): Event[][] => {
  const gameGroups: Event[][] = [];
  const processedEvents = new Set<string>();
  
  events.forEach(event => {
    if (processedEvents.has(event.id)) return;
    
    // Find all events that represent the same game
    const sameGameEvents = events.filter(otherEvent => {
      if (otherEvent.id === event.id) return true;
      if (processedEvents.has(otherEvent.id)) return false;
      
      // Check if events represent the same game (same date, time, location, tournament)
      return (
        otherEvent.date === event.date &&
        otherEvent.startTime === event.startTime &&
        otherEvent.location === event.location &&
        otherEvent.tournamentId === event.tournamentId &&
        otherEvent.lengthMinutes === event.lengthMinutes
      );
    });
    
    if (sameGameEvents.length > 0) {
      gameGroups.push(sameGameEvents);
      sameGameEvents.forEach(e => processedEvents.add(e.id));
    }
  });
  
  return gameGroups;
};

// Get the display name for a game group
const getGameDisplayName = (gameEvents: Event[], tournamentTeams: Team[]): string => {
  if (gameEvents.length === 0) return 'Unknown Game';
  
  const firstEvent = gameEvents[0];
  const teamNames = gameEvents.map(event => {
    const team = tournamentTeams.find(t => t.id === event.teamId);
    return team?.teamName || 'Unknown Team';
  });
  
  if (teamNames.length === 2) {
    return `${teamNames[0]} vs ${teamNames[1]}`;
  }
  
  return firstEvent.name;
};

interface TournamentScheduleProps {
  tournamentId: string;
  tournamentName: string;
}

interface Team {
  id: string;
  teamName: string;
  sport: string;
  ageGroup: string;
}

const TournamentSchedule: React.FC<TournamentScheduleProps> = ({ 
  tournamentId, 
  tournamentName
}) => {
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

  // Tournament teams state
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Form state for creating/editing events
  const [formData, setFormData] = useState<CreateEventRequest>({
    teamId: '',
    name: '',
    tournamentId: tournamentId,
    date: '',
    startTime: '',
    lengthMinutes: 60,
    location: '',
    description: '',
    score: ''
  });

  // Team selection state
  const [selectedTeam1, setSelectedTeam1] = useState<string>('');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('');

  useEffect(() => {
    if (tournamentId) {
      loadTournamentTeams();
    }
  }, [tournamentId]);

  useEffect(() => {
    if (tournamentId && tournamentTeams.length > 0) {
      loadEvents();
    }
  }, [tournamentId, tournamentTeams]);

  const loadEvents = async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    setError('');
    try {
      // Try to get events directly by tournament ID first
      try {
        const tournamentEvents = await eventService.getEventsByTournamentId(tournamentId);
        setEvents(sortEventsByDateTime(tournamentEvents));
        return;
      } catch (err) {
        // Fallback: get events for each team and filter by tournament
        console.log('Falling back to team-based event loading');
      }
      
      // Fallback method: Get all events for all teams in the tournament
      const allEvents: Event[] = [];
      
      const teamEvents = await Promise.all(
        tournamentTeams.map(team => eventService.getEventsByTeamId(team.id))
      );
      
      teamEvents.forEach(events => {
        events.forEach(event => {
          if (event.tournamentId === tournamentId) {
            allEvents.push(event);
          }
        });
      });
      
      setEvents(sortEventsByDateTime(allEvents));
    } catch (err) {
      setError('Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentTeams = async () => {
    if (!tournamentId) return;
    
    setLoadingTeams(true);
    try {
      const enrolledTeams = await tournamentService.getAcceptedTournamentTeamInvites(tournamentId);
      
      // Get team details for each enrolled team
      const teamDetails = await Promise.all(
        enrolledTeams.map(async (enrolledTeam) => {
          try {
            return await teamService.getTeam(enrolledTeam.teamId);
          } catch (err) {
            console.error('Failed to get team details:', err);
            return null;
          }
        })
      );
      
      const validTeams = teamDetails.filter(team => team !== null) as Team[];
      setTournamentTeams(validTeams);
    } catch (err) {
      console.error('Error loading tournament teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam1 || !selectedTeam2) {
      setError('Please select two teams');
      return;
    }
    
    if (selectedTeam1 === selectedTeam2) {
      setError('Please select two different teams');
      return;
    }
    
    // Validate score format if provided
    if (formData.score && !/^\d+-\d+$/.test(formData.score)) {
      setError('Score must be in format: number-number (e.g., 3-1)');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Create two events - one for each team
      const team1Name = tournamentTeams.find(t => t.id === selectedTeam1)?.teamName || 'Team 1';
      const team2Name = tournamentTeams.find(t => t.id === selectedTeam2)?.teamName || 'Team 2';
      
             const event1Data: CreateEventRequest = {
         ...formData,
         teamId: selectedTeam1,
         name: `Game vs ${team2Name}`,
         tournamentId: tournamentId
       };
       
       const event2Data: CreateEventRequest = {
         ...formData,
         teamId: selectedTeam2,
         name: `Game vs ${team1Name}`,
         tournamentId: tournamentId
       };
      
      // Create both events
      const [newEvent1, newEvent2] = await Promise.all([
        eventService.createEvent(event1Data),
        eventService.createEvent(event2Data)
      ]);
      
      // Add new events and sort by date and time
      setEvents(prev => sortEventsByDateTime([...prev, newEvent1, newEvent2]));
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create events');
      console.error('Error creating events:', err);
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
      // Find all events that represent the same game
      const sameGameEvents = events.filter(event => 
        event.date === selectedEvent.date &&
        event.startTime === selectedEvent.startTime &&
        event.location === selectedEvent.location &&
        event.tournamentId === selectedEvent.tournamentId &&
        event.lengthMinutes === selectedEvent.lengthMinutes
      );

             // Update all related events
       const updatePromises = sameGameEvents.map(event => {
         const updateData = {
           ...formData,
           teamId: event.teamId, // Keep the original team ID for each event
           name: event.name // Keep the original name for each event
         };
         // Remove the name field from formData since it's not editable
         delete updateData.name;
         return eventService.updateEvent(event.id, updateData);
       });

      const updatedEvents = await Promise.all(updatePromises);
      
      // Update events in state and sort by date and time
      setEvents(prev => {
        const updatedEventsMap = new Map(updatedEvents.map(event => [event.id, event]));
        const newEvents = prev.map(event => 
          updatedEventsMap.has(event.id) ? updatedEventsMap.get(event.id)! : event
        );
        return sortEventsByDateTime(newEvents);
      });
      
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
    } catch (err) {
      setError('Failed to update events');
      console.error('Error updating events:', err);
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
      teamId: '',
      name: '',
      tournamentId: tournamentId,
      date: '',
      startTime: '',
      lengthMinutes: 60,
      location: '',
      description: '',
      score: ''
    });
    setSelectedTeam1('');
    setSelectedTeam2('');
    setError(''); // Clear any previous errors
  };

     const openEditModal = (event: Event) => {
     setSelectedEvent(event);
     setFormData({
       teamId: event.teamId,
       name: '', // Name is not editable in tournaments
       tournamentId: event.tournamentId || '',
       date: event.date.split('T')[0],
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
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
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
    return true; // All tournament users are organizers
  };

  // Calendar navigation functions
  const goToPreviousWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
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

  const weekDates = getWeekDates(currentDate);

  return (
    <div className="tournament-schedule-section">
      <div className="schedule-header">
        <h3>{tournamentName} Schedule</h3>
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

          <button className="btn btn-primary" onClick={openCreateModal} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
            ✚ Add Event
          </button>
        </div>
      </div>

      

      {loading || loadingTeams ? (
        <div className="loading-message">
          {loadingTeams ? 'Loading tournament teams...' : 'Loading events...'}
        </div>
      ) : (
        <div className="schedule-content">
          {viewMode === 'list' ? (
            <div className="events-list">
              {tournamentTeams.length === 0 ? (
                <div className="no-events">
                  <p>No teams have joined this tournament yet.</p>
                  <p>Please invite teams to the tournament before scheduling events.</p>
                </div>
              ) : events.length === 0 ? (
                <div className="no-events">
                  <p>No events scheduled for this tournament.</p>
                  <button className="btn btn-primary" onClick={openCreateModal} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                    ✚ Add Your First Event
                  </button>
                </div>
                             ) : (
                 (() => {
                   const gameGroups = groupGameEvents(events);
                   return gameGroups.map((gameEvents, index) => {
                     const firstEvent = gameEvents[0];
                     const displayName = getGameDisplayName(gameEvents, tournamentTeams);
                     
                     return (
                       <div key={`game-${index}`} className="event-card game-card">
                         <div className="event-header">
                           <h4>{displayName}</h4>
                           <div className="event-actions">
                             {canManageEvents() && (
                               <>
                                 <button 
                                   className="btn btn-small btn-secondary"
                                   onClick={() => openEditModal(firstEvent)}
                                 >
                                   Edit
                                 </button>
                                 <button 
                                   className="btn btn-small btn-danger"
                                   onClick={() => {
                                     // Delete all events in the game group
                                     if (window.confirm('Are you sure you want to delete this game? This will remove it from all teams.')) {
                                       gameEvents.forEach(event => handleDeleteEvent(event.id));
                                     }
                                   }}
                                 >
                                   Delete
                                 </button>
                               </>
                             )}
                           </div>
                         </div>
                         
                         <div className="event-content">
                           <div className="event-details">
                             <div className="event-column">
                               <div className="event-info">
                                 <span className="event-label">Teams</span>
                                 <span className="event-value">
                                   {gameEvents.map(event => {
                                     const team = tournamentTeams.find(t => t.id === event.teamId);
                                     return team?.teamName || 'Unknown Team';
                                   }).join(' vs ')}
                                 </span>
                               </div>
                               <div className="event-info">
                                 <span className="event-label">Date</span>
                                 <span className="event-value">{formatDate(firstEvent.date)}</span>
                               </div>
                               {firstEvent.description && (
                                 <div className="event-info">
                                   <span className="event-label">Description</span>
                                   <span className="event-value">{firstEvent.description}</span>
                                 </div>
                               )}
                             </div>
                             
                             <div className="event-column">
                               <div className="event-info">
                                 <span className="event-label">Time</span>
                                 <span className="event-value">{formatTime(firstEvent.startTime)} ({formatDuration(firstEvent.lengthMinutes)})</span>
                               </div>
                               <div className="event-info">
                                 <span className="event-label">Location</span>
                                 <span className="event-value">{firstEvent.location}</span>
                               </div>
                             </div>
                             
                             {firstEvent.score && (
                               <div className="event-score-section">
                                 <span className="event-score-label">Final Score</span>
                                 <span className="event-score-value">{firstEvent.score}</span>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     );
                   });
                 })()
               )}
            </div>
          ) : (
            <div className="calendar-view">
              {tournamentTeams.length === 0 ? (
                <div className="no-events">
                  <p>No teams have joined this tournament yet.</p>
                  <p>Please invite teams to the tournament before viewing the calendar.</p>
                </div>
              ) : (
                <>
                  <div className="calendar-header">
                    <button className="calendar-nav-btn" onClick={goToPreviousWeek}>
                      ‹‹
                    </button>
                    <h4 className="calendar-title">
                      Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h4>
                    <button className="calendar-nav-btn" onClick={goToNextWeek}>
                      ››
                    </button>
                    <button className="calendar-today-btn" onClick={goToToday}>
                      Today
                    </button>
                  </div>
                  
                  <div className="calendar-grid weekly">
                 <div className="calendar-weekdays weekly">
                   {weekDates.map(date => (
                     <div key={date.toISOString()} className="calendar-weekday weekly">
                       <div className="weekday-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                       <div className="weekday-date">{date.getDate()}</div>
                     </div>
                   ))}
                 </div>
                 
                 <div className="calendar-days weekly">
                   {weekDates.map(date => {
                     const dateString = date.toISOString().split('T')[0];
                     const dayEvents = getEventsForDate(events, dateString);
                     const isToday = dateString === new Date().toISOString().split('T')[0];
                     
                     return (
                       <div key={dateString} className={`calendar-day weekly ${isToday ? 'today' : ''}`}>
                         <div className="calendar-day-events weekly">
                                                       {(() => {
                              const gameGroups = groupGameEvents(dayEvents);
                              return gameGroups.map((gameEvents, index) => {
                                const firstEvent = gameEvents[0];
                                const displayName = getGameDisplayName(gameEvents, tournamentTeams);
                                
                                return (
                                  <div
                                    key={`calendar-game-${index}`}
                                    className="calendar-event-card weekly game-event"
                                  >
                                    <div 
                                      className="calendar-event-info weekly"
                                      onClick={() => openEventDetails(firstEvent)}
                                    >
                                      <div className="calendar-event-name weekly">{displayName}</div>
                                      <div className="calendar-event-time weekly">{formatTime(firstEvent.startTime)}</div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

             {/* Create Event Modal */}
       {showCreateModal && (
         <div className="modal-overlay" onClick={() => {
           setShowCreateModal(false);
           setError(''); // Clear error when modal is closed
         }}>
          <div className="modal event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Tournament Game</h3>
                             <button 
                 className="close-button" 
                 onClick={() => {
                   setShowCreateModal(false);
                   setError(''); // Clear error when modal is closed
                 }}
               >
                 ×
               </button>
            </div>
            <form onSubmit={handleCreateEvent} className="event-form">
              {tournamentTeams.length === 0 ? (
                <div className="error-message">
                  No teams have joined this tournament yet. Please invite teams first.
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="team1">Team 1 *</label>
                    <select
                      id="team1"
                      value={selectedTeam1}
                      onChange={(e) => setSelectedTeam1(e.target.value)}
                      required
                    >
                      <option value="">Select Team 1</option>
                      {tournamentTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="team2">Team 2 *</label>
                    <select
                      id="team2"
                      value={selectedTeam2}
                      onChange={(e) => setSelectedTeam2(e.target.value)}
                      required
                    >
                      <option value="">Select Team 2</option>
                      {tournamentTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                                     </div>
                 </>
               )}
               
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
                  placeholder="Enter game description, details, or notes..."
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
                 <div className="modal-actions-left">
                   {error && <div className="error-message">{error}</div>}
                 </div>
                 <div className="modal-actions-right">
                   <button 
                     type="button" 
                     className="btn btn-secondary"
                     onClick={() => {
                       setShowCreateModal(false);
                       setError(''); // Clear error when modal is closed
                     }}
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     className="btn btn-primary"
                     disabled={loading || tournamentTeams.length === 0}
                   >
                     {loading ? 'Creating...' : 'Create Game'}
                   </button>
                 </div>
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
               <h3>Edit Tournament Game</h3>
               <button 
                className="close-button" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
                         <form onSubmit={handleUpdateEvent} className="event-form">
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
                 {(() => {
                   // Check if this is part of a game with multiple teams
                   const sameGameEvents = events.filter(event => 
                     event.date === selectedEvent.date &&
                     event.startTime === selectedEvent.startTime &&
                     event.location === selectedEvent.location &&
                     event.tournamentId === selectedEvent.tournamentId &&
                     event.lengthMinutes === selectedEvent.lengthMinutes
                   );
                   
                   if (sameGameEvents.length > 1) {
                     // This is a game event - show both teams
                     return (
                       <div className="event-detail-item">
                         <span className="detail-label">Teams</span>
                         <span className="detail-value">
                           {sameGameEvents.map(event => {
                             const team = tournamentTeams.find(t => t.id === event.teamId);
                             return team?.teamName || 'Unknown Team';
                           }).join(' vs ')}
                         </span>
                       </div>
                     );
                   } else {
                     // This is a regular event - show single team
                     return (
                       <div className="event-detail-item">
                         <span className="detail-label">Team</span>
                         <span className="detail-value">
                           {tournamentTeams.find(t => t.id === selectedEvent.teamId)?.teamName || 'Unknown Team'}
                         </span>
                       </div>
                     );
                   }
                 })()}
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

export default TournamentSchedule;
