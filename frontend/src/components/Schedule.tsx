import React, { useState, useEffect } from 'react';
import type { Event, CreateEventRequest } from '../types/Event';
import {
  calendarDateInZone,
  formatScheduledDate,
  formatScheduledTime,
  getTimeZoneOptions,
  getUserTimeZone,
  utcIsoToLocalParts,
} from '../lib/timezoneUtils';
import { eventService, isTournamentManagedEvent } from '../services/eventService';
import { tournamentService } from '../services/tournamentService';
import { availabilityService } from '../services/availabilityService';
import type { TeamAvailabilityResponse } from '../services/availabilityService';
import AppIcon from './icons/AppIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, MapPin, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import './Schedule.css';

type EventAvailabilitySummary = {
  going: number;
  notGoing: number;
  maybe: number;
  userStatus: 'YES' | 'NO' | 'MAYBE' | 'UNKNOWN';
};

type EventAvailabilityDetail = TeamAvailabilityResponse & { eventId: string };

// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const getEventsForDate = (events: Event[], date: string, viewerTimeZone: string) => {
  return events.filter(
    (event) => calendarDateInZone(event.startAtUtc, viewerTimeZone) === date
  );
};

const sortEventsByDateTime = (events: Event[]): Event[] => {
  return [...events].sort(
    (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
  );
};

interface ScheduleProps {
  teamId: string;
  userRole: string;
  teamName: string;
  currentUserId: string;
}

const Schedule: React.FC<ScheduleProps> = ({ teamId, userRole, teamName, currentUserId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventAvailability, setEventAvailability] = useState<Record<string, EventAvailabilitySummary>>({});
  const [expandedResponsesEventId, setExpandedResponsesEventId] = useState<string | null>(null);
  const [teamResponsesDetail, setTeamResponsesDetail] = useState<EventAvailabilityDetail | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [updatingRsvpEventId, setUpdatingRsvpEventId] = useState<string | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(false);
  
  // Tournament names state
  const [tournamentNames, setTournamentNames] = useState<Record<string, string>>({});

  // Form state for creating/editing events
  const [viewerTimeZone] = useState(() => getUserTimeZone());
  const timeZoneOptions = getTimeZoneOptions();

  const [formData, setFormData] = useState<CreateEventRequest>({
    teamId: teamId,
    name: '',
    date: '',
    startTime: '',
    timeZone: getUserTimeZone(),
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
      // Ensure events are properly sorted by date and time
      const sorted = sortEventsByDateTime(teamEvents);
      setEvents(sorted);
      await loadTournamentNames(sorted);
      await loadEventAvailabilitySummaries(sorted);
    } catch (err) {
      setError('Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const summarizeAvailability = (
    data: TeamAvailabilityResponse
  ): EventAvailabilitySummary => {
    let going = 0;
    let notGoing = 0;
    let maybe = 0;
    let userStatus: EventAvailabilitySummary['userStatus'] = 'UNKNOWN';
    for (const m of data.teamAvailability) {
      if (m.status === 'YES') going++;
      else if (m.status === 'NO') notGoing++;
      else if (m.status === 'MAYBE') maybe++;
      if (m.isCurrentUser) userStatus = m.status;
    }
    return { going, notGoing, maybe, userStatus };
  };

  const loadEventAvailabilitySummaries = async (eventList: Event[]) => {
    if (!teamId || !currentUserId || eventList.length === 0) {
      setEventAvailability({});
      return;
    }
    try {
      const entries = await Promise.all(
        eventList.map(async (event) => {
          const data = await availabilityService.getTeamAvailabilityForEvent(
            teamId,
            event.id,
            currentUserId
          );
          return [event.id, summarizeAvailability(data)] as const;
        })
      );
      setEventAvailability(Object.fromEntries(entries));
    } catch (err) {
      console.error('Error loading availability summaries:', err);
    }
  };

  const handleInlineRsvp = async (
    eventId: string,
    status: 'YES' | 'NO' | 'MAYBE'
  ) => {
    setUpdatingRsvpEventId(eventId);
    try {
      await availabilityService.setAvailability(
        currentUserId,
        teamId,
        eventId,
        status
      );
      const data = await availabilityService.getTeamAvailabilityForEvent(
        teamId,
        eventId,
        currentUserId
      );
      setEventAvailability((prev) => ({
        ...prev,
        [eventId]: summarizeAvailability(data),
      }));
      if (expandedResponsesEventId === eventId) {
        setTeamResponsesDetail({ ...data, eventId });
      }
    } catch (err) {
      setError('Failed to update availability');
      console.error(err);
    } finally {
      setUpdatingRsvpEventId(null);
    }
  };

  const toggleTeamResponses = async (eventId: string) => {
    if (expandedResponsesEventId === eventId) {
      setExpandedResponsesEventId(null);
      setTeamResponsesDetail(null);
      return;
    }
    setExpandedResponsesEventId(eventId);
    setLoadingResponses(true);
    try {
      const data = await availabilityService.getTeamAvailabilityForEvent(
        teamId,
        eventId,
        currentUserId
      );
      setTeamResponsesDetail({ ...data, eventId });
    } catch (err) {
      setError('Failed to load team responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  const loadTournamentNames = async (events: Event[]) => {
    const tournamentIds = events
      .map(event => event.tournamentId)
      .filter(id => id && id !== '') as string[];
    
    const uniqueTournamentIds = [...new Set(tournamentIds)];
    
    if (uniqueTournamentIds.length === 0) return;
    
    try {
      const tournamentNamesMap: Record<string, string> = {};
      
      for (const tournamentId of uniqueTournamentIds) {
        try {
          const tournament = await tournamentService.getTournamentById(tournamentId);
          if (tournament) {
            tournamentNamesMap[tournamentId] = tournament.name;
          }
        } catch (error) {
          console.warn(`Failed to load tournament name for ID: ${tournamentId}`, error);
          tournamentNamesMap[tournamentId] = `Tournament ID: ${tournamentId.substring(0, 8)}...`;
        }
      }
      
      setTournamentNames(tournamentNamesMap);
    } catch (error) {
      console.error('Failed to load tournament names:', error);
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
      const { tournamentId: _tid, ...rest } = formData;
      const newEvent = await eventService.createEvent({
        ...rest,
        tournamentId: formData.tournamentId || undefined,
      });
      // Add new event and sort by date and time (oldest first)
      setEvents(prev => sortEventsByDateTime([...prev, newEvent]));
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
      const updatedEvent = await eventService.updateEvent(selectedEvent.id, {
        ...formData,
        tournamentId: formData.tournamentId || undefined,
      });
      // Update event and sort by date and time (oldest first)
      setEvents(prev => {
        const updatedEvents = prev.map(event => 
          event.id === selectedEvent.id ? updatedEvent : event
        );
        return sortEventsByDateTime(updatedEvents);
      });
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
      date: '',
      startTime: '',
      timeZone: getUserTimeZone(),
      lengthMinutes: 60,
      location: '',
      description: '',
      score: '',
    });
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    const parts = utcIsoToLocalParts(event.startAtUtc, event.timeZone);
    setFormData({
      teamId: event.teamId,
      name: event.name,
      tournamentId: event.tournamentId,
      date: parts.date,
      startTime: parts.startTime,
      timeZone: event.timeZone,
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const canManageEvents = (event?: Event) => {
    if (event && isTournamentManagedEvent(event)) {
      return false;
    }
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

  const eventFormFields = (idPrefix: string) => (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-name`}>Event Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-startTime`}>Start Time</Label>
          <Input
            id={`${idPrefix}-startTime`}
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-timeZone`}>Time zone</Label>
        <Select
          value={formData.timeZone ?? viewerTimeZone}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, timeZone: value }))}
        >
          <SelectTrigger id={`${idPrefix}-timeZone`} className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeZoneOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${idPrefix}-length`}>Duration (minutes)</Label>
          <Input
            id={`${idPrefix}-length`}
            type="number"
            min={15}
            step={15}
            value={formData.lengthMinutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                lengthMinutes: parseInt(e.target.value, 10) || 60,
              }))
            }
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-location`}>Location</Label>
          <Input
            id={`${idPrefix}-location`}
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-score`}>Score (optional)</Label>
        <Input
          id={`${idPrefix}-score`}
          value={formData.score}
          onChange={(e) => setFormData((prev) => ({ ...prev, score: e.target.value }))}
          placeholder="e.g. 3-1"
          pattern="^\d+-\d+$"
          className="mt-1"
        />
        {formData.score && !/^\d+-\d+$/.test(formData.score) && (
          <p className="mt-1 text-sm text-red-600">Use format number-number (e.g. 3-1)</p>
        )}
      </div>
    </>
  );

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{teamName} Schedule</h2>
            <p className="mt-1 text-sm text-gray-600">Upcoming events and activities</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-gray-200 p-0.5">
              <button
                type="button"
                className={`rounded px-3 py-1.5 text-sm ${
                  viewMode === 'list' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600'
                }`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                type="button"
                className={`rounded px-3 py-1.5 text-sm ${
                  viewMode === 'calendar' ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600'
                }`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
            </div>
            {canManageEvents() && (
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={openCreateModal}
              >
                <Plus className="mr-2 size-4" />
                Create Event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

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
                    <Button
                      type="button"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={openCreateModal}
                    >
                      Create Your First Event
                    </Button>
                  )}
                </div>
              ) : (
                events.map((event) => {
                  const summary = eventAvailability[event.id];
                  const isUpdating = updatingRsvpEventId === event.id;
                  return (
                    <div
                      key={event.id}
                      className="mb-4 border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">{event.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-4" />
                              {formatScheduledDate(event.startAtUtc, viewerTimeZone)} at{' '}
                              {formatScheduledTime(event.startAtUtc, viewerTimeZone)}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-4" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManageEvents(event) && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(event)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>

                      {summary && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {summary.going} going · {summary.notGoing} not going · {summary.maybe}{' '}
                          maybe
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {(['YES', 'MAYBE', 'NO'] as const).map((status) => {
                          const active = summary?.userStatus === status;
                          const labels = {
                            YES: { text: 'Going', Icon: CheckCircle2 },
                            MAYBE: { text: 'Maybe', Icon: HelpCircle },
                            NO: { text: 'Not going', Icon: XCircle },
                          };
                          const { text, Icon } = labels[status];
                          return (
                            <Button
                              key={status}
                              type="button"
                              size="sm"
                              variant={active ? 'default' : 'outline'}
                              disabled={isUpdating}
                              onClick={() => handleInlineRsvp(event.id, status)}
                            >
                              <Icon className="size-4 mr-1" />
                              {text}
                            </Button>
                          );
                        })}
                      </div>

                      {userRole === 'COACH' && (
                        <div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => toggleTeamResponses(event.id)}
                          >
                            {expandedResponsesEventId === event.id ? (
                              <ChevronUp className="size-4 mr-1" />
                            ) : (
                              <ChevronDown className="size-4 mr-1" />
                            )}
                            View all responses
                          </Button>
                          {expandedResponsesEventId === event.id && (
                            <div className="mt-2 border border-border rounded-md p-3 text-sm">
                              {loadingResponses ? (
                                <p className="text-muted-foreground">Loading...</p>
                              ) : teamResponsesDetail?.eventId === event.id ? (
                                <ul className="space-y-2">
                                  {teamResponsesDetail.teamAvailability.map((m) => (
                                    <li
                                      key={m.userId}
                                      className="flex justify-between gap-2"
                                    >
                                      <span>
                                        {m.firstName} {m.lastName}
                                        {m.isCurrentUser && (
                                          <Badge variant="secondary" className="ml-2">
                                            You
                                          </Badge>
                                        )}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {m.status === 'UNKNOWN'
                                          ? 'Not set'
                                          : m.status === 'YES'
                                            ? 'Going'
                                            : m.status === 'NO'
                                              ? 'Not going'
                                              : 'Maybe'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )}

                      {event.score && (
                        <p className="text-sm mt-2">
                          <strong>Score:</strong> {event.score}
                        </p>
                      )}
                    </div>
                  );
                })
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
                      const dayEvents = getEventsForDate(events, dateString, viewerTimeZone);
                      const isToday = dateString === new Date().toISOString().split('T')[0];
                      
                      days.push(
                        <div key={day} className={`calendar-day ${isToday ? 'today' : ''}`}>
                          <div className="calendar-day-number">{day}</div>
                          <div className="calendar-day-events">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className="calendar-event-card"
                              >
                                <div 
                                  className="calendar-event-info"
                                  onClick={() => openEventDetails(event)}
                                >
                                  <div className="calendar-event-name">{event.name}</div>
                                  <div className="calendar-event-time">{formatScheduledTime(event.startAtUtc, viewerTimeZone)}</div>
                                </div>
                                <button
                                  type="button"
                                  className="calendar-availability-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEventDetails(event);
                                  }}
                                  title="Event details & RSVP"
                                >
                                  <AppIcon name="users" size={16} />
                                </button>
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
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            {eventFormFields('create')}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEvent} className="space-y-4">
            {eventFormFields('edit')}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                  <span className="detail-label">Tournament</span>
                  <span className="detail-value">
                    {selectedEvent.tournamentId 
                      ? (tournamentNames[selectedEvent.tournamentId] || `Tournament ID: ${selectedEvent.tournamentId.substring(0, 8)}...`)
                      : 'No tournament'
                    }
                  </span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatScheduledDate(selectedEvent.startAtUtc, viewerTimeZone)}</span>
                </div>
                <div className="event-detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{formatScheduledTime(selectedEvent.startAtUtc, viewerTimeZone)} ({formatDuration(selectedEvent.lengthMinutes)})</span>
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

              <div className="flex flex-wrap gap-2 my-4">
                {(['YES', 'MAYBE', 'NO'] as const).map((status) => {
                  const summary = eventAvailability[selectedEvent.id];
                  const active = summary?.userStatus === status;
                  const labels = {
                    YES: { text: 'Going', Icon: CheckCircle2 },
                    MAYBE: { text: 'Maybe', Icon: HelpCircle },
                    NO: { text: 'Not going', Icon: XCircle },
                  };
                  const { text, Icon } = labels[status];
                  return (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      disabled={updatingRsvpEventId === selectedEvent.id}
                      onClick={() => handleInlineRsvp(selectedEvent.id, status)}
                    >
                      <Icon className="size-4 mr-1" />
                      {text}
                    </Button>
                  );
                })}
              </div>
              
              {canManageEvents(selectedEvent) ? (
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      closeEventDetails();
                      openEditModal(selectedEvent);
                    }}
                  >
                    Edit Event
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this event?')) {
                        handleDeleteEvent(selectedEvent.id);
                        closeEventDetails();
                      }
                    }}
                  >
                    Delete Event
                  </Button>
                </div>
              ) : isTournamentManagedEvent(selectedEvent) ? (
                <div className="tournament-event-note">
                  <p>This is a tournament event and cannot be edited or deleted by team coaches.</p>
                  <p>Please contact the tournament organizer if changes are needed.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Schedule;
