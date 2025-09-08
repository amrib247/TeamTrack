import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseAuthService } from '../services/firebaseAuthService';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/Auth';
import './AuthPage.css';

interface AuthPageProps {
  onAuthSuccess: (user: AuthResponse) => void;
}

function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!isLogin) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      // Check for letters and numbers
      if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        setError('Password must contain both letters and numbers');
        return;
      }
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First name and last name are required');
        return;
      }
      if (formData.phoneNumber.trim() && formData.phoneNumber.trim().length !== 10) {
        setError('Phone number must be exactly 10 digits long (or leave blank)');
        return;
      }
      if (formData.phoneNumber.trim() && !/^\d{10}$/.test(formData.phoneNumber.trim())) {
        setError('Phone number must contain only digits');
        return;
      }
      if (!formData.dateOfBirth) {
        setError('Date of birth is required');
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const loginRequest: LoginRequest = {
          email: formData.email,
          password: formData.password
        };
        const user = await firebaseAuthService.login(loginRequest);
        onAuthSuccess(user);
        setError('');
        // Redirect to home page after successful login
        navigate('/home');
      } else {
        const registerRequest: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth
        };
        const user = await firebaseAuthService.register(registerRequest);
        onAuthSuccess(user);
        setError('');
        // Redirect to home page after successful registration
        navigate('/home');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: ''
    });
  };

  return (
    <div className="app auth-page">
      <div className="container">
        <div className="logo-header">
          <img src="/TeamTrack/TeamTrack-Logo.png?v=2" alt="TeamTrack Logo" className="logo-image" />
          <h1>TeamTrack</h1>
        </div>
        <p className="subtitle">Sports Team Management System</p>
        
        <div className="auth-container">
          <div className="auth-header">
            <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
            <button 
              className="toggle-btn" 
              onClick={toggleMode}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                placeholder={isLogin ? "Enter your password" : "At least 6 chars, letters & numbers"}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10 digits (optional)"
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
