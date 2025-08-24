
import type { Tournament } from '../types/Auth';
import './Tournament.css';
import { useNavigate } from 'react-router-dom';

interface TournamentProps {
  tournament: Tournament;
}

function Tournament({ tournament }: TournamentProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  // Note: With the new invite system, we need to check for active tournament invites
  // instead of directly checking teamIds. For now, we'll show basic information.
  const isFull = tournament.teamCount >= tournament.maxSize;

  // Note: Join/leave functionality removed - tournaments now use an invite system

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
            <strong>Size:</strong> {tournament.teamCount}/{tournament.maxSize} teams
          </div>
          <div className="info-item">
            <strong>Organizers:</strong> {tournament.organizerCount}
          </div>
          <div className="info-item">
            <strong>Created:</strong> {formatDate(tournament.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tournament;
