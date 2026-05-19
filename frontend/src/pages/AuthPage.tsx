import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseAuthService } from '../services/firebaseAuthService';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/Auth';
import { EmailNotVerifiedError } from '../types/authErrors';
import './AuthPage.css';

interface AuthPageProps {
  onAuthSuccess: (user: AuthResponse) => void;
  pendingVerificationEmail?: string | null;
}

const RESEND_COOLDOWN_SEC = 60;

function AuthPage({ onAuthSuccess, pendingVerificationEmail = null }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(pendingVerificationEmail);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    if (pendingVerificationEmail) {
      setVerifyEmail(pendingVerificationEmail);
    }
  }, [pendingVerificationEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showVerifyScreen = (email: string) => {
    setVerifyEmail(email);
    setError('');
    setSuccessMessage('Verification email sent. Check your inbox and spam folder.');
    setResendCooldown(RESEND_COOLDOWN_SEC);
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await firebaseAuthService.sendVerificationEmail();
      setSuccessMessage('Verification email sent again.');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const user = await firebaseAuthService.getCurrentUser();
      if (!user) {
        setError('Email not verified yet. Click the link in your email, then try again.');
        return;
      }
      setVerifyEmail(null);
      onAuthSuccess(user);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify status');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutFromVerify = async () => {
    setError('');
    try {
      await firebaseAuthService.logout();
      setVerifyEmail(null);
      setIsLogin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isLogin) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
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
          password: formData.password,
        };
        const user = await firebaseAuthService.login(loginRequest);
        onAuthSuccess(user);
        navigate('/home');
      } else {
        const registerRequest: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
        };
        const result = await firebaseAuthService.register(registerRequest);
        showVerifyScreen(result.email);
      }
    } catch (err) {
      if (err instanceof EmailNotVerifiedError) {
        showVerifyScreen(err.email);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setVerifyEmail(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: '',
    });
  };

  return (
    <div className="app auth-page">
      <div className="container">
        <div className="logo-header">
          <img
            src={`${import.meta.env.BASE_URL}logo-login.png`}
            alt="TeamTrack Logo"
            className="logo-image"
          />
          <h1>TeamTrack</h1>
        </div>
        <p className="subtitle">Sports Team Management System</p>

        <div className="auth-container">
          {verifyEmail ? (
            <div className="verify-email-panel">
              <h2>Verify your email</h2>
              <p className="verify-email-text">
                We sent a verification link to <strong>{verifyEmail}</strong>. Open the link in
                your email, then return here and continue.
              </p>

              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}

              <div className="verify-email-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCheckVerified}
                  disabled={loading}
                >
                  {loading ? 'Checking...' : "I've verified — continue"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResendVerification}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Resend email (${resendCooldown}s)`
                    : 'Resend verification email'}
                </button>
                <button
                  type="button"
                  className="toggle-btn verify-sign-out"
                  onClick={handleSignOutFromVerify}
                  disabled={loading}
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
                <button className="toggle-btn" onClick={toggleMode} type="button">
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email *</label>
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
                  <label htmlFor="password" className="form-label">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder={isLogin ? 'Enter your password' : 'At least 6 chars, letters & numbers'}
                  />
                </div>

                {!isLogin && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="firstName" className="form-label">First Name *</label>
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
                        <label htmlFor="lastName" className="form-label">Last Name *</label>
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
                      <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
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
                      <label htmlFor="dateOfBirth" className="form-label">Date of Birth *</label>
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

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
