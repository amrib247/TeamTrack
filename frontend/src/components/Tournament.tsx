import type { Tournament } from '../types/Auth';
import './Tournament.css';
import { useNavigate } from 'react-router-dom';
import AppIcon from './icons/AppIcon';

interface TournamentProps {
  tournament: Tournament;
}

function Tournament({ tournament }: TournamentProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="team-card-compact tournament-card-compact clickable" onClick={handleCardClick}>
      <div className="team-header">
        <div className="team-header-left">
          <div className="team-card-avatar team-card-avatar-placeholder" aria-hidden="true">
            <AppIcon name="trophy" size={22} />
          </div>
          <div className="team-header-text">
            <h4>{tournament.name}</h4>
            <span className="team-sport">
              {tournament.teamCount}/{tournament.maxSize} teams
            </span>
          </div>
        </div>
      </div>
      <div className="team-details">
        <div className="team-role">
          <strong>Organizers:</strong> {tournament.organizerCount}
        </div>
        <div className="team-joined">
          <strong>Created:</strong> {formatDate(tournament.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default Tournament;
