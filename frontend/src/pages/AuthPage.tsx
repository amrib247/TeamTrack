import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseAuthService } from '../services/firebaseAuthService';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/Auth';
import { EmailNotVerifiedError } from '../types/authErrors';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-2 inline-flex flex-col items-center gap-2">
            <Target className="size-10 text-blue-600" aria-hidden />
            <span className="text-2xl font-semibold text-gray-900">TeamTrack</span>
          </Link>
          <p className="text-gray-600">Sports Management Made Simple</p>
        </div>

        <div className="border border-gray-200 bg-white p-8 shadow-sm">
          {verifyEmail ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">Verify your email</h2>
              <p className="text-muted-foreground text-sm">
                We sent a verification link to <strong>{verifyEmail}</strong>. Open the link in
                your email, then return here and continue.
              </p>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                  {error}
                </p>
              )}
              {successMessage && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-md">
                  {successMessage}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <Button type="button" onClick={handleCheckVerified} disabled={loading}>
                  {loading ? 'Checking...' : "I've verified — continue"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Resend email (${resendCooldown}s)`
                    : 'Resend verification email'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSignOutFromVerify}
                  disabled={loading}
                >
                  Use a different email
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                {isLogin ? 'Log In' : 'Create Account'}
              </h2>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="you@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder={isLogin ? '••••••••' : 'Letters and numbers, 6+ chars'}
                    className="mt-1"
                  />
                </div>

                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone (Optional)</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="10 digits"
                        maxLength={10}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
