import { useNavigate } from 'react-router-dom';
import LandingIcon from '../components/landing/LandingIcon';
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
        block: 'start',
      });
    }
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="header-inner">
          <div className="header-brand">
            <img
              src={`${import.meta.env.BASE_URL}logo-login.png`}
              alt=""
              className="header-logo"
            />
            <span className="header-wordmark">TeamTrack</span>
          </div>
          <nav className="header-nav">
            <button type="button" className="header-link" onClick={handleLearnMore}>
              Learn more
            </button>
            <button type="button" className="btn btn-primary" onClick={handleGetStarted}>
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-eyebrow">Sports team management</p>
            <h1 className="hero-title">
              Elevate your sports team
              <span className="highlight"> management</span>
            </h1>
            <p className="hero-description">
              TeamTrack is the platform for coaches, players, and administrators.
              Manage multiple teams, organize tournaments, track availability, and
              keep everyone aligned with one professional toolkit.
            </p>
            <div className="hero-buttons">
              <button type="button" className="btn btn-primary btn-large" onClick={handleGetStarted}>
                Get Started
              </button>
              <button type="button" className="btn btn-secondary btn-large" onClick={handleLearnMore}>
                Learn More
              </button>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="app-preview">
              <div className="app-preview-titlebar">
                <div className="app-preview-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="app-preview-title">TeamTrack</span>
              </div>
              <div className="app-preview-body">
                <div className="app-preview-sidebar">
                  <button type="button" className="app-preview-nav-item active" tabIndex={-1}>
                    <LandingIcon name="users" size={18} />
                  </button>
                  <button type="button" className="app-preview-nav-item" tabIndex={-1}>
                    <LandingIcon name="calendar" size={18} />
                  </button>
                  <button type="button" className="app-preview-nav-item" tabIndex={-1}>
                    <LandingIcon name="message" size={18} />
                  </button>
                  <button type="button" className="app-preview-nav-item" tabIndex={-1}>
                    <LandingIcon name="check" size={18} />
                  </button>
                  <button type="button" className="app-preview-nav-item" tabIndex={-1}>
                    <LandingIcon name="trophy" size={18} />
                  </button>
                </div>
                <div className="app-preview-main">
                  <div className="preview-block">
                    <span className="preview-label">Upcoming</span>
                    <div className="preview-row preview-row--teal">
                      <LandingIcon name="calendar" size={16} />
                      <span>Practice · Tue 6:00 PM</span>
                    </div>
                    <div className="preview-row preview-row--bronze">
                      <LandingIcon name="trophy" size={16} />
                      <span>League game · Sat 2:00 PM</span>
                    </div>
                  </div>
                  <div className="preview-block">
                    <span className="preview-label">Team chat</span>
                    <div className="preview-row preview-row-muted preview-row--purple">
                      <LandingIcon name="message" size={16} />
                      <span>Coach: Bring cleats for Saturday</span>
                    </div>
                  </div>
                  <div className="preview-block">
                    <span className="preview-label">Tasks</span>
                    <div className="preview-row preview-row--green">
                      <LandingIcon name="check" size={16} />
                      <span>Snack signup · 3 of 8 spots filled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features-section" className="features-section">
        <div className="container">
          <h2 className="section-title">Professional features for modern sports teams</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="users" />
              </div>
              <h3>Multi-Team Management</h3>
              <p>
                Join multiple teams with different roles — be a player on one team and a
                coach on another. Perfect for multi-sport athletes and coaches.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="trophy" />
              </div>
              <h3>Tournament & League Management</h3>
              <p>
                Create and manage tournaments with advanced scheduling, bracket
                management, and team enrollment. Track standings and results in real-time.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="calendar" />
              </div>
              <h3>Advanced Scheduling</h3>
              <p>
                Schedule practices, games, and events with location tracking, duration
                management, and conflict detection. Perfect for busy sports seasons.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="message" />
              </div>
              <h3>Team Communication Hub</h3>
              <p>
                Real-time chat with file sharing, image support, and read receipts. Keep
                everyone connected and informed instantly.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="check" />
              </div>
              <h3>Task & Availability Management</h3>
              <p>
                Create tasks with signup limits, track player availability, and manage team
                commitments efficiently. Never miss a practice or game.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="shield" />
              </div>
              <h3>Enterprise Security</h3>
              <p>
                Firebase-powered authentication with role-based access control. Secure user
                management for coaches, players, parents, and administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">Get started in seconds</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <LandingIcon name="users" size={18} className="step-icon" />
              <h3>Create Your Account</h3>
              <p>
                Sign up with your email and basic information. Choose your role as Coach,
                Player, Parent, or Administrator.
              </p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <LandingIcon name="trophy" size={18} className="step-icon" />
              <h3>Join or Create Teams</h3>
              <p>
                Join existing teams or create new ones. Set up roles, permissions, and team
                information in seconds.
              </p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <LandingIcon name="calendar" size={18} className="step-icon" />
              <h3>Start Managing</h3>
              <p>
                Begin scheduling events, managing tournaments, communicating with your team,
                and tracking performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="use-cases-section">
        <div className="container">
          <h2 className="section-title">Perfect for every sports organization</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="building" />
              </div>
              <h3>Youth Sports Leagues</h3>
              <p>
                Manage multiple age groups, coordinate practices, and organize seasonal
                tournaments with ease.
              </p>
            </div>
            <div className="use-case-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="users" />
              </div>
              <h3>Club Teams</h3>
              <p>
                Handle tryouts, manage rosters, schedule games, and track player development
                across multiple teams.
              </p>
            </div>
            <div className="use-case-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="school" />
              </div>
              <h3>School Athletics</h3>
              <p>
                Coordinate between coaches, manage facilities, schedule games, and communicate
                with parents effectively.
              </p>
            </div>
            <div className="use-case-card">
              <div className="feature-icon-wrap">
                <LandingIcon name="leisure" />
              </div>
              <h3>Recreational Sports</h3>
              <p>
                Organize casual leagues, manage player registrations, and keep everyone
                informed about schedules and events.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to transform your team management?</h2>
          <p>
            Join coaches and administrators who trust TeamTrack to manage their sports
            organizations.
          </p>
          <button type="button" className="btn btn-primary btn-large" onClick={handleGetStarted}>
            Get Started Now
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>TeamTrack</h3>
              <p>
                Empowering sports teams with professional-grade management tools and seamless
                communication.
              </p>
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
            <p>&copy; 2026 TeamTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
