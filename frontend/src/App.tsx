import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { auth } from './firebase';
import { firebaseAuthService } from './services/firebaseAuthService';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import TournamentPage from './pages/TournamentPage';
import type { AuthResponse } from './types/Auth';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await reload(firebaseUser);
          if (firebaseUser.emailVerified) {
            const userData = await firebaseAuthService.getCurrentUser();
            setCurrentUser(userData);
            setPendingVerificationEmail(null);
          } else {
            setCurrentUser(null);
            setPendingVerificationEmail(firebaseUser.email ?? null);
          }
        } catch (error) {
          console.error('Failed to get user data:', error);
          setCurrentUser(null);
          setPendingVerificationEmail(firebaseUser.email ?? null);
        }
      } else {
        setCurrentUser(null);
        setPendingVerificationEmail(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: AuthResponse) => {
    setCurrentUser(user);
    setPendingVerificationEmail(null);
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.logout();
      setCurrentUser(null);
      setPendingVerificationEmail(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        // Get updated user data from Firebase
        const updatedUser = await firebaseAuthService.getCurrentUser();
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing page - first page users see */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentication page */}
          <Route
            path="/auth"
            element={
              currentUser ? (
                <Navigate to="/home" replace />
              ) : (
                <AuthPage
                  onAuthSuccess={handleAuthSuccess}
                  pendingVerificationEmail={pendingVerificationEmail}
                />
              )
            }
          />
          
          {/* Home page - only accessible when logged in */}
          <Route 
            path="/home" 
            element={
              currentUser ? (
                <HomePage 
                  currentUser={currentUser} 
                  onLogout={handleLogout}
                  onRefreshUserData={refreshUserData}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          
          {/* Team page - only accessible when logged in */}
          <Route 
            path="/team/:teamId" 
            element={
              currentUser ? (
                <TeamPage 
                  currentUser={currentUser} 
                  onLogout={handleLogout}
                  onRefreshUserData={refreshUserData}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          
          {/* Tournament page - only accessible when logged in */}
          <Route 
            path="/tournament/:tournamentId" 
            element={
              currentUser ? (
                <TournamentPage currentUser={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          
          {/* Redirect any unknown routes to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;