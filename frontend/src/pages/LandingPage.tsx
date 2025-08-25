import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <h1 className="logo">TeamTrack</h1>
          <p className="tagline">Professional Sports Team Management Platform</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-title">
              Elevate Your Sports Team
              <span className="highlight"> Management</span>
            </h2>
            <p className="hero-description">
              TeamTrack is the ultimate platform for coaches, players, and team administrators. 
              Manage multiple teams, organize tournaments, track performance, and streamline 
              communication with our comprehensive suite of professional tools.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
                Get Started
              </button>
              <button className="btn btn-secondary btn-large" onClick={handleLearnMore}>
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-placeholder">
              <div className="floating-card card-1">
                <span className="card-icon">👥</span>
                <span className="card-text">Multi-Team</span>
              </div>
              <div className="floating-card card-2">
                <span className="card-icon">🏆</span>
                <span className="card-text">Tournaments</span>
              </div>
              <div className="floating-card card-3">
                <span className="card-icon">📅</span>
                <span className="card-text">Scheduling</span>
              </div>
              <div className="floating-card card-4">
                <span className="card-icon">💬</span>
                <span className="card-text">Chat</span>
              </div>
              <div className="floating-card card-5">
                <span className="card-icon">✅</span>
                <span className="card-text">Tasks</span>
              </div>
              <div className="floating-card card-6">
                <span className="card-icon">📊</span>
                <span className="card-text">Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="features-section">
        <div className="container">
          <h2 className="section-title">Professional Features for Modern Sports Teams</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Multi-Team Management</h3>
              <p>Join multiple teams with different roles - be a player on one team and a coach on another. Perfect for multi-sport athletes and coaches.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Tournament & League Management</h3>
              <p>Create and manage tournaments with advanced scheduling, bracket management, and team enrollment. Track standings and results in real-time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Advanced Scheduling</h3>
              <p>Schedule practices, games, and events with location tracking, duration management, and conflict detection. Perfect for busy sports seasons.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Team Communication Hub</h3>
              <p>Real-time chat with file sharing, image support, and read receipts. Keep everyone connected and informed instantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Task & Availability Management</h3>
              <p>Create tasks with signup limits, track player availability, and manage team commitments efficiently. Never miss a practice or game.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Enterprise Security</h3>
              <p>Firebase-powered authentication with role-based access control. Secure user management for coaches, players, parents, and administrators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">Get Started in Seconds</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Account</h3>
              <p>Sign up with your email and basic information. Choose your role as Coach, Player, Parent, or Administrator.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Join or Create Teams</h3>
              <p>Join existing teams or create new ones. Set up roles, permissions, and team information in seconds.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Start Managing</h3>
              <p>Begin scheduling events, managing tournaments, communicating with your team, and tracking performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <div className="container">
          <h2 className="section-title">Perfect For Every Sports Organization</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <div className="use-case-icon">🏈</div>
              <h3>Youth Sports Leagues</h3>
              <p>Manage multiple age groups, coordinate practices, and organize seasonal tournaments with ease.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">⚽</div>
              <h3>Club Teams</h3>
              <p>Handle tryouts, manage rosters, schedule games, and track player development across multiple teams.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">🏀</div>
              <h3>School Athletics</h3>
              <p>Coordinate between coaches, manage facilities, schedule games, and communicate with parents effectively.</p>
            </div>
            <div className="use-case-card">
              <div className="use-case-icon">🎾</div>
              <h3>Recreational Sports</h3>
              <p>Organize casual leagues, manage player registrations, and keep everyone informed about schedules and events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Team Management?</h2>
          <p>Join coaches and administrators who trust TeamTrack to manage their sports organizations</p>
          <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>TeamTrack</h3>
              <p>Empowering sports teams with professional-grade management tools and seamless communication.</p>
            </div>
            <div className="footer-section">
              <h4>Core Features</h4>
              <ul>
                <li>Team Management</li>
                <li>Tournament Organization</li>
                <li>Event Scheduling</li>
                <li>Team Communication</li>
                <li>Task Management</li>
                <li>Performance Tracking</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Documentation</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 TeamTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
