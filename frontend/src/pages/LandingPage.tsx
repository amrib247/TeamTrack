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
          <p className="tagline">Sports Team Management System</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-title">
              Manage Your Sports Teams
              <span className="highlight"> Like Never Before</span>
            </h2>
            <p className="hero-description">
              TeamTrack is the ultimate platform for coaches, players, and team administrators. 
              Streamline communication, track performance, and build stronger teams with our 
              comprehensive management tools.
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
                <span className="card-icon">🔐</span>
                <span className="card-text">Security</span>
              </div>
              <div className="floating-card card-3">
                <span className="card-icon">📱</span>
                <span className="card-text">Mobile</span>
              </div>
              <div className="floating-card card-4">
                <span className="card-icon">⚡</span>
                <span className="card-text">Real-time</span>
              </div>
              <div className="floating-card card-5">
                <span className="card-icon">📊</span>
                <span className="card-text">Analytics</span>
              </div>
              <div className="floating-card card-6">
                <span className="card-icon">🏆</span>
                <span className="card-text">Tournaments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose TeamTrack?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Multi-Team Support</h3>
              <p>Join multiple teams with different roles. Be a player on one team and a coach on another.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>Enterprise-grade security with encrypted passwords and secure user management.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Works perfectly on all devices - desktop, tablet, and mobile phones.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Updates</h3>
              <p>Instant notifications and real-time team updates keep everyone in sync.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Performance Tracking</h3>
              <p>Monitor team and individual performance with detailed analytics and insights.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Tournaments</h3>
              <p>Create leagues and tournaments for teams to enroll in, with advanced scheduling and bracket management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up with your email and basic information to get started.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Join Teams</h3>
              <p>Join existing teams or create new ones with specific roles and permissions.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Start Managing</h3>
              <p>Begin managing your teams with our comprehensive set of tools and features.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Team Management?</h2>
          <p>Join thousands of coaches and players who trust TeamTrack</p>
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
              <p>Empowering sports teams with better management tools.</p>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul>
                <li>Team Management</li>
                <li>User Roles</li>
                <li>Performance Tracking</li>
                <li>Communication</li>
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
