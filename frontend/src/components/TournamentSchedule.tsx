import React, { useState, useEffect } from 'react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/Event';
import {
  calendarDateInZone,
  formatScheduledDate,
  formatScheduledTime,
  getTimeZoneOptions,
  getUserTimeZone,
  utcIsoToLocalParts,
} from '../lib/timezoneUtils';
import { eventService } from '../services/eventService';
import { tournamentService } from '../services/tournamentService';
import { teamService } from '../services/teamService';
import { Button } from '@/components/ui/button';
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
import { Calendar, MapPin, Plus, UserPlus } from 'lucide-react';
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

const getEventsForDate = (events: Event[], date: string, viewerTimeZone: string) =>
  events.filter((event) => calendarDateInZone(event.startAtUtc, viewerTimeZone) === date);

const sortEventsByDateTime = (events: Event[]): Event[] =>
  [...events].sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime());

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
        otherEvent.startAtUtc === event.startAtUtc &&
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

export interface TournamentRefereeProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface TournamentScheduleProps {
  tournamentId: string;
  tournamentName: string;
  canManageEvents?: boolean;
  canAssignReferees?: boolean;
  tournamentReferees?: TournamentRefereeProfile[];
}

interface Team {
  id: string;
  teamName: string;
  sport: string;
  ageGroup: string;
}

function mapRefereeProfile(record: Record<string, unknown>): TournamentRefereeProfile {
  return {
    userId: String(record.userId),
    firstName: String(record.firstName ?? ''),
    lastName: String(record.lastName ?? ''),
    email: record.email ? String(record.email) : undefined,
  };
}

const getRefereeNames = (
  refereeUserIds: string[] | undefined,
  tournamentReferees: TournamentRefereeProfile[]
): string => {
  if (!refereeUserIds || refereeUserIds.length === 0) return 'None assigned';
  return refereeUserIds
    .map((id) => {
      const ref = tournamentReferees.find((r) => r.userId === id);
      return ref ? `${ref.firstName} ${ref.lastName}` : 'Unknown';
    })
    .join(', ');
};

const TournamentSchedule: React.FC<TournamentScheduleProps> = ({
  tournamentId,
  tournamentName,
  canManageEvents = true,
  canAssignReferees = false,
  tournamentReferees = [],
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
  const [showAssignRefereesModal, setShowAssignRefereesModal] = useState(false);
  const [refereesList, setRefereesList] = useState<TournamentRefereeProfile[]>(tournamentReferees);
  const [loadingReferees, setLoadingReferees] = useState(false);
  const [assignRefereeGameTitle, setAssignRefereeGameTitle] = useState('');

  // Tournament teams state
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [viewerTimeZone] = useState(() => getUserTimeZone());
  const timeZoneOptions = getTimeZoneOptions();

  // Form state for creating/editing events
  const [formData, setFormData] = useState<CreateEventRequest>({
    teamId: '',
    name: '',
    tournamentId: tournamentId,
    date: '',
    startTime: '',
    timeZone: getUserTimeZone(),
    lengthMinutes: 60,
    location: '',
    description: '',
    score: '',
  });

  // Team selection state
  const [selectedTeam1, setSelectedTeam1] = useState<string>('');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('');

  // Referee assignment state
  const [selectedGameEvents, setSelectedGameEvents] = useState<Event[]>([]);
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([]);
  const [savingReferees, setSavingReferees] = useState(false);

  useEffect(() => {
    if (tournamentReferees.length > 0) {
      setRefereesList(tournamentReferees);
    }
  }, [tournamentReferees]);

  useEffect(() => {
    if (!canAssignReferees || !tournamentId) return;

    const loadReferees = async () => {
      try {
        setLoadingReferees(true);
        const data = await tournamentService.getTournamentReferees(tournamentId);
        setRefereesList(data.map((r) => mapRefereeProfile(r)));
      } catch (err) {
        console.error('Failed to load tournament referees:', err);
      } finally {
        setLoadingReferees(false);
      }
    };

    loadReferees();
  }, [canAssignReferees, tournamentId]);

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
        tournamentId: tournamentId,
        opposingTeamId: selectedTeam2,
      };

      const event2Data: CreateEventRequest = {
        ...formData,
        teamId: selectedTeam2,
        name: `Game vs ${team1Name}`,
        tournamentId: tournamentId,
        opposingTeamId: selectedTeam1,
      };

      const [newEvent1, newEvent2] = await Promise.all([
        eventService.createEvent(event1Data),
        eventService.createEvent(event2Data),
      ]);

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

    if (formData.score && !/^\d+-\d+$/.test(formData.score)) {
      setError('Score must be in format: number-number (e.g., 3-1)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find all events that represent the same game
      const sameGameEvents = events.filter(event =>
        event.startAtUtc === selectedEvent.startAtUtc &&
        event.location === selectedEvent.location &&
        event.tournamentId === selectedEvent.tournamentId &&
        event.lengthMinutes === selectedEvent.lengthMinutes
      );

      const { name: _formName, teamId: _formTeamId, tournamentId: _formTournamentId, opposingTeamId: _formOpposing, ...sharedFields } =
        formData;

      const updatePromises = sameGameEvents.map((event) => {
        const updateData: UpdateEventRequest = {
          ...sharedFields,
          name: event.name,
          tournamentId: event.tournamentId,
          opposingTeamId: event.opposingTeamId,
        };
        return eventService.updateEvent(event.id, updateData);
      });

      const updatedEvents = await Promise.all(updatePromises);

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
      timeZone: getUserTimeZone(),
      lengthMinutes: 60,
      location: '',
      description: '',
      score: '',
    });
    setSelectedTeam1('');
    setSelectedTeam2('');
    setError('');
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    const parts = utcIsoToLocalParts(event.startAtUtc, event.timeZone);
    setFormData({
      teamId: event.teamId,
      name: '',
      tournamentId: event.tournamentId || '',
      date: parts.date,
      startTime: parts.startTime,
      timeZone: event.timeZone,
      lengthMinutes: event.lengthMinutes,
      location: event.location,
      description: event.description || '',
      score: event.score || '',
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

  const handleRefereeToggle = (userId: string) => {
    setSelectedRefereeIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, userId];
    });
  };

  const handleSaveReferees = async (closeDetails = true) => {
    if (!selectedGameEvents.length) return;

    setSavingReferees(true);
    setError('');
    try {
      await eventService.assignRefereesToGame(
        selectedGameEvents.map((e) => e.id),
        selectedRefereeIds,
        tournamentId
      );
      await loadEvents();
      setShowAssignRefereesModal(false);
      if (closeDetails) {
        setShowEventDetails(false);
        setSelectedEvent(null);
        setSelectedGameEvents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign referees');
    } finally {
      setSavingReferees(false);
    }
  };

  const openAssignRefereesForGame = (gameEvents: Event[]) => {
    const firstEvent = gameEvents[0];
    setSelectedGameEvents(gameEvents);
    setSelectedRefereeIds(firstEvent?.refereeUserIds ?? []);
    setAssignRefereeGameTitle(getGameDisplayName(gameEvents, tournamentTeams));
    setShowAssignRefereesModal(true);
    setError('');
  };

  const closeAssignRefereesModal = () => {
    setShowAssignRefereesModal(false);
    setError('');
  };

  const renderRefereeAssignment = (options?: {
    closeDetailsOnSave?: boolean;
    showSaveButton?: boolean;
    variant?: 'modal' | 'inline';
  }) => {
    const closeDetailsOnSave = options?.closeDetailsOnSave ?? true;
    const showSaveButton = options?.showSaveButton ?? true;
    const variant = options?.variant ?? 'inline';

    if (!canAssignReferees) {
      return (
        <p className="referee-readonly-value">
          {getRefereeNames(selectedGameEvents[0]?.refereeUserIds, refereesList)}
        </p>
      );
    }

    if (loadingReferees) {
      return (
        <div className="referee-assignment-state">
          <p>Loading referees...</p>
        </div>
      );
    }

    if (refereesList.length === 0) {
      return (
        <div className="referee-assignment-empty notice-empty">
          <p>No tournament referees yet.</p>
          <p className="referee-assignment-empty-hint">
            Open the <strong>Referees</strong> tab to invite referees, then return here to assign them to games.
          </p>
        </div>
      );
    }

    const atMax = selectedRefereeIds.length >= 3;

    return (
      <div className={`referee-assignment ${variant === 'modal' ? 'referee-assignment--modal' : 'referee-assignment--inline'}`}>
        <div className="referee-assignment-toolbar">
          <span className="referee-assignment-label">Select referees</span>
          <span className={`referee-selection-count ${atMax ? 'referee-selection-count--full' : ''}`}>
            {selectedRefereeIds.length} / 3
          </span>
        </div>

        <div className="referee-picker-grid" role="group" aria-label="Tournament referees">
          {refereesList.map((referee) => {
            const selected = selectedRefereeIds.includes(referee.userId);
            const disabled = !selected && atMax;
            return (
              <button
                key={referee.userId}
                type="button"
                className={`referee-picker-card ${selected ? 'referee-picker-card--selected' : ''}`}
                onClick={() => handleRefereeToggle(referee.userId)}
                disabled={disabled}
                aria-pressed={selected}
              >
                <span className="referee-picker-avatar" aria-hidden="true">
                  {referee.firstName.charAt(0)}
                  {referee.lastName.charAt(0)}
                </span>
                <span className="referee-picker-info">
                  <span className="referee-picker-name">
                    {referee.firstName} {referee.lastName}
                  </span>
                  {referee.email && (
                    <span className="referee-picker-email">{referee.email}</span>
                  )}
                </span>
                <span className="referee-picker-indicator" aria-hidden="true">
                  {selected ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {showSaveButton && (
          <div className="referee-assignment-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSaveReferees(closeDetailsOnSave)}
              disabled={savingReferees || selectedGameEvents.length === 0}
            >
              {savingReferees ? 'Saving...' : 'Save Referees'}
            </button>
          </div>
        )}
      </div>
    );
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
    const gameGroup = groupGameEvents(events).find((group) =>
      group.some((e) => e.id === event.id)
    ) ?? [event];
    setSelectedEvent(event);
    setSelectedGameEvents(gameGroup);
    setSelectedRefereeIds(gameGroup[0]?.refereeUserIds ?? []);
    setShowEventDetails(true);
  };

  const closeEventDetails = () => {
    setShowEventDetails(false);
    setSelectedEvent(null);
    setSelectedGameEvents([]);
    setSelectedRefereeIds([]);
  };

  const weekDates = getWeekDates(currentDate);

  const eventFormFields = (idPrefix: string, includeTeams: boolean) => (
    <>
      {includeTeams && (
        <>
          <div>
            <Label htmlFor={`${idPrefix}-team1`}>Team 1</Label>
            <Select value={selectedTeam1} onValueChange={setSelectedTeam1}>
              <SelectTrigger id={`${idPrefix}-team1`} className="mt-1">
                <SelectValue placeholder="Select Team 1" />
              </SelectTrigger>
              <SelectContent>
                {tournamentTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-team2`}>Team 2</Label>
            <Select value={selectedTeam2} onValueChange={setSelectedTeam2}>
              <SelectTrigger id={`${idPrefix}-team2`} className="mt-1">
                <SelectValue placeholder="Select Team 2" />
              </SelectTrigger>
              <SelectContent>
                {tournamentTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
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
            <h2 className="text-xl font-semibold text-gray-900">{tournamentName} Schedule</h2>
            <p className="mt-1 text-sm text-gray-600">Tournament games and brackets</p>
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
            {canManageEvents && (
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={openCreateModal}
              >
                <Plus className="mr-2 size-4" />
                Add Event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && !showAssignRefereesModal && !showCreateModal && !showEditModal && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

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
                    {canManageEvents && (
                      <Button
                        type="button"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={openCreateModal}
                      >
                        <Plus className="mr-2 size-4" />
                        Add Your First Event
                      </Button>
                    )}
                  </div>
                ) : (
                  (() => {
                    const gameGroups = groupGameEvents(events);
                    return gameGroups.map((gameEvents, index) => {
                      const firstEvent = gameEvents[0];
                      const displayName = getGameDisplayName(gameEvents, tournamentTeams);
                      const teamsLine = gameEvents
                        .map((event) => {
                          const team = tournamentTeams.find((t) => t.id === event.teamId);
                          return team?.teamName || 'Unknown Team';
                        })
                        .join(' vs ');

                      return (
                        <div
                          key={`game-${index}`}
                          className="mb-4 border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground">{displayName}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="size-4" />
                                  {formatScheduledDate(firstEvent.startAtUtc, viewerTimeZone)} at{' '}
                                  {formatScheduledTime(firstEvent.startAtUtc, viewerTimeZone)}
                                  {' '}
                                  ({formatDuration(firstEvent.lengthMinutes)})
                                </span>
                                {firstEvent.location && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="size-4" />
                                    {firstEvent.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            {canManageEvents && (
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(firstEvent)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        'Are you sure you want to delete this game? This will remove it from all teams.'
                                      )
                                    ) {
                                      gameEvents.forEach((event) => handleDeleteEvent(event.id));
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            <span className="font-medium text-foreground">Teams:</span> {teamsLine}
                          </p>

                          {firstEvent.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {firstEvent.description}
                            </p>
                          )}

                          {canAssignReferees && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openAssignRefereesForGame(gameEvents)}
                              >
                                <UserPlus className="size-4 mr-1" />
                                Assign Referees
                              </Button>
                            </div>
                          )}

                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Referees:</span>{' '}
                            {getRefereeNames(firstEvent.refereeUserIds, refereesList)}
                          </p>

                          {firstEvent.score && (
                            <p className="text-sm mt-2">
                              <strong>Score:</strong> {firstEvent.score}
                            </p>
                          )}
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
                      <div className="calendar-header-nav">
                        <button className="calendar-nav-btn" onClick={goToPreviousWeek}>
                          ‹‹
                        </button>
                        <h4 className="calendar-title">
                          Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </h4>
                        <button className="calendar-nav-btn" onClick={goToNextWeek}>
                          ››
                        </button>
                      </div>
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
                          const dayEvents = getEventsForDate(events, dateString, viewerTimeZone);
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
                                          <div className="calendar-event-time weekly">{formatScheduledTime(firstEvent.startAtUtc, viewerTimeZone)}</div>
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
      </div>

      {/* Create Game Dialog */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setError('');
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Tournament Game</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            {tournamentTeams.length === 0 ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                No teams have joined this tournament yet. Please invite teams first.
              </p>
            ) : (
              eventFormFields('create', true)
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading || tournamentTeams.length === 0}
              >
                {loading ? 'Creating...' : 'Create Game'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Game Dialog */}
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setError('');
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tournament Game</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEvent} className="space-y-4">
            {eventFormFields('edit', false)}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEditModal(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Referees Dialog */}
      <Dialog
        open={showAssignRefereesModal}
        onOpenChange={(open) => {
          if (!open) closeAssignRefereesModal();
          else setShowAssignRefereesModal(true);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Referees</DialogTitle>
          </DialogHeader>
          {assignRefereeGameTitle && (
            <p className="text-sm text-muted-foreground">{assignRefereeGameTitle}</p>
          )}
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="py-2">
            {renderRefereeAssignment({
              closeDetailsOnSave: false,
              showSaveButton: false,
              variant: 'modal',
            })}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeAssignRefereesModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => handleSaveReferees(false)}
              disabled={savingReferees || loadingReferees || refereesList.length === 0}
            >
              {savingReferees ? 'Saving...' : 'Save Referees'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Modal (legacy) */}
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
                    event.startAtUtc === selectedEvent.startAtUtc &&
                    event.location === selectedEvent.location &&
                    event.tournamentId === selectedEvent.tournamentId &&
                    event.lengthMinutes === selectedEvent.lengthMinutes
                  );

                  if (sameGameEvents.length > 1) {
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
                <div className="event-detail-item event-detail-item-referees">
                  <span className="detail-label">Referees</span>
                  <div className="referee-assignment-panel">
                    {renderRefereeAssignment({ variant: 'inline' })}
                  </div>
                </div>
              </div>

              {canManageEvents && (
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
                      if (window.confirm('Are you sure you want to delete this game?')) {
                        selectedGameEvents.forEach((ev) => handleDeleteEvent(ev.id));
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
