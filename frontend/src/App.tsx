import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
          <Route 
            path="/" 
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
          <Route 
            path="/auth" 
            element={
              currentUser ? (
                <Navigate to="/" replace />
              ) : (
                <AuthPage onAuthSuccess={handleAuthSuccess} />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;