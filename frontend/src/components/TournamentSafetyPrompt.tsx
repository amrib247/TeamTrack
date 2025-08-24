import React from 'react';
import './TournamentSafetyPrompt.css';

interface TournamentSafetyPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrganizer: () => void;
  onDeleteTournament: () => void;
  tournamentName?: string;
  action: 'LEAVE_TOURNAMENT' | 'DELETE_ACCOUNT';
}

const TournamentSafetyPrompt: React.FC<TournamentSafetyPromptProps> = ({
  isOpen,
  onClose,
  onAddOrganizer,
  onDeleteTournament,
  tournamentName = 'this tournament',
  action
}) => {
  if (!isOpen) return null;

  const getTitle = () => {
    if (action === 'LEAVE_TOURNAMENT') {
      return `Cannot Leave ${tournamentName}`;
    }
    return 'Cannot Delete Account';
  };

  const getMessage = () => {
    if (action === 'LEAVE_TOURNAMENT') {
      return `You are the last organizer of ${tournamentName}. You must either add another organizer or delete the tournament before leaving.`;
    }
    return `You are the last organizer of one or more tournaments. You must either add other organizers or delete the tournaments before deleting your account.`;
  };

  const getAddButtonText = () => {
    if (action === 'LEAVE_TOURNAMENT') {
      return 'Add Another Organizer';
    }
    return 'Add Organizers to Tournaments';
  };

  const getDeleteButtonText = () => {
    if (action === 'LEAVE_TOURNAMENT') {
      return 'Delete Tournament';
    }
    return 'Delete Tournaments';
  };

  return (
    <div className="tournament-safety-overlay">
      <div className="tournament-safety-modal">
        <div className="tournament-safety-header">
          <h2>{getTitle()}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="tournament-safety-content">
          <div className="warning-icon">⚠️</div>
          <p className="warning-message">{getMessage()}</p>
          
          <div className="tournament-safety-actions">
            <button 
              className="btn btn-primary add-organizer-btn"
              onClick={onAddOrganizer}
            >
              {getAddButtonText()}
            </button>
            
            <button 
              className="btn btn-danger delete-tournament-btn"
              onClick={onDeleteTournament}
            >
              {getDeleteButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentSafetyPrompt;
