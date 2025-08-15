import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import type { AuthResponse } from './types/Auth';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);

  const handleAuthSuccess = (user: AuthResponse) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

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
                <AuthPage onAuthSuccess={handleAuthSuccess} />
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
                />
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