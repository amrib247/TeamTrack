package com.example.TeamTrack_backend.services;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {
    
    private final BCryptPasswordEncoder passwordEncoder;
    
    public PasswordService() {
        // Using BCrypt with strength 12 (recommended for production)
        this.passwordEncoder = new BCryptPasswordEncoder(12);
    }
    
    /**
     * Encrypt a plain text password
     * @param plainPassword the plain text password to encrypt
     * @return the encrypted password hash
     */
    public String encryptPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        return passwordEncoder.encode(plainPassword);
    }
    
    /**
     * Verify if a plain text password matches an encrypted password
     * @param plainPassword the plain text password to check
     * @param encryptedPassword the encrypted password hash to compare against
     * @return true if passwords match, false otherwise
     */
    public boolean verifyPassword(String plainPassword, String encryptedPassword) {
        if (plainPassword == null || encryptedPassword == null) {
            return false;
        }
        return passwordEncoder.matches(plainPassword, encryptedPassword);
    }
    
    /**
     * Check if a password meets security requirements
     * @param password the password to validate
     * @return true if password meets requirements, false otherwise
     */
    public boolean isPasswordValid(String password) {
        if (password == null || password.trim().isEmpty()) {
            return false;
        }
        
        // Minimum length check
        if (password.length() < 6) {
            return false;
        }
        
        // Check for at least one letter and one number
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        boolean hasNumber = password.matches(".*\\d.*");
        
        return hasLetter && hasNumber;
    }
}
