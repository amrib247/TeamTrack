import React, { useState } from 'react';
import type { Tournament } from '../types/Auth';
import { tournamentService } from '../services/tournamentService';
import './Tournament.css';
import { useNavigate } from 'react-router-dom';

interface TournamentProps {
  tournament: Tournament;
  userTeamIds: string[];
  onTournamentUpdated: () => void;
}

function Tournament({ tournament, userTeamIds, onTournamentUpdated }: TournamentProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  const isUserInTournament = userTeamIds.some(teamId => 
    tournament.teamIds.includes(teamId)
  );

  const userTeamsInTournament = userTeamIds.filter(teamId => 
    tournament.teamIds.includes(teamId)
  );

  const isFull = tournament.teamIds.length >= tournament.maxSize;

  const handleJoinTournament = async () => {
    if (isFull) {
      setError('Tournament is full');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Find the first team that's not already in the tournament
      const availableTeamId = userTeamIds.find(teamId => 
        !tournament.teamIds.includes(teamId)
      );

      if (!availableTeamId) {
        setError('All your teams are already in this tournament');
        return;
      }

      await tournamentService.addTeamToTournament(tournament.id, availableTeamId);
      onTournamentUpdated();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join tournament');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveTournament = async () => {
    if (userTeamsInTournament.length === 0) {
      return;
    }

    setIsLeaving(true);
    setError('');

    try {
      // Remove the first team that's in the tournament
      const teamToRemove = userTeamsInTournament[0];
      await tournamentService.removeTeamFromTournament(tournament.id, teamToRemove);
      onTournamentUpdated();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to leave tournament');
    } finally {
      setIsLeaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="tournament-card clickable" onClick={handleCardClick}>
      <div className="tournament-header">
        <h3 className="tournament-name">{tournament.name}</h3>
        <div className="tournament-status">
          {isFull ? (
            <span className="status-full">🏆 Full</span>
          ) : (
            <span className="status-open">📝 Open</span>
          )}
        </div>
      </div>

      <div className="tournament-details">
        <div className="tournament-info">
          <div className="info-item">
            <strong>Size:</strong> {tournament.teamIds.length}/{tournament.maxSize} teams
          </div>
          <div className="info-item">
            <strong>Created:</strong> {formatDate(tournament.createdAt)}
          </div>
        </div>

        {userTeamsInTournament.length > 0 && (
          <div className="user-teams-in-tournament">
            <span className="user-team-badge">
              Your team joined
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tournament;
