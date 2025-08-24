package com.example.TeamTrack_backend.services;

import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.LoginRequest;
import com.example.TeamTrack_backend.dto.RegisterRequest;
import com.example.TeamTrack_backend.dto.UpdateUserRequest;
import com.example.TeamTrack_backend.dto.UserWithTeamsDto;
import com.example.TeamTrack_backend.models.UserProfile;

@Service
public class AuthService {

    @Autowired
    private FirebaseAuthService firebaseAuthService;
    
    @Autowired
    private UserTeamService userTeamService;
    
    @Autowired
    private OrganizerTournamentService organizerTournamentService;

    // Email validation pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    /**
     * Authenticate a user with email and password
     */
    public UserWithTeamsDto login(LoginRequest loginRequest) {
        // Validate input
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        try {
            // Firebase Auth handles the authentication
            UserProfile userProfile = firebaseAuthService.authenticateUser(loginRequest);
            if (userProfile == null) {
                throw new IllegalArgumentException("Invalid email or password");
            }

            // Check if user is active
            if (!userProfile.isActive()) {
                throw new IllegalArgumentException("Account is deactivated");
            }

            // Get user's teams
            try {
                var userTeams = userTeamService.getUserTeams(userProfile.getUid()).get();
                return new UserWithTeamsDto(
                    userProfile.getUid(),
                    userProfile.getEmail(),
                    userProfile.getFirstName(),
                    userProfile.getLastName(),
                    userProfile.getPhoneNumber(),
                    userProfile.getDateOfBirth(),
                    userProfile.getProfilePhotoUrl(),
                    userProfile.getCreatedAt(),
                    userProfile.getUpdatedAt(),
                    userProfile.isActive(),
                    userTeams
                );
            } catch (Exception e) {
                // If we can't get teams, return user without teams
                return new UserWithTeamsDto(
                    userProfile.getUid(),
                    userProfile.getEmail(),
                    userProfile.getFirstName(),
                    userProfile.getLastName(),
                    userProfile.getPhoneNumber(),
                    userProfile.getDateOfBirth(),
                    userProfile.getProfilePhotoUrl(),
                    userProfile.getCreatedAt(),
                    userProfile.getUpdatedAt(),
                    userProfile.isActive(),
                    new java.util.ArrayList<>()
                );
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid email or password");
        }
    }

    /**
     * Register a new user
     */
    public UserWithTeamsDto register(RegisterRequest registerRequest) {
        // Validate input
        validateRegistrationRequest(registerRequest);

        try {
            // Check if email already exists
            UserProfile existingUser = firebaseAuthService.getUserProfileByEmail(registerRequest.getEmail());
            if (existingUser != null) {
                throw new IllegalArgumentException("Email already registered");
            }

            // Create new user with Firebase Auth
            UserProfile newUserProfile = firebaseAuthService.registerUser(registerRequest);
            
            // Return user with empty teams list
            return new UserWithTeamsDto(
                newUserProfile.getUid(),
                newUserProfile.getEmail(),
                newUserProfile.getFirstName(),
                newUserProfile.getLastName(),
                newUserProfile.getPhoneNumber(),
                newUserProfile.getDateOfBirth(),
                newUserProfile.getProfilePhotoUrl(),
                newUserProfile.getCreatedAt(),
                newUserProfile.getUpdatedAt(),
                newUserProfile.isActive(),
                new java.util.ArrayList<>()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to register user: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a user account
     */
    public boolean deleteAccount(String email, String password) {
        // Validate input
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        try {
            System.out.println("🚨 AuthService.deleteAccount() called with email: " + email);
            
            // First, find the user by email to get the UID
            UserProfile userProfile = firebaseAuthService.getUserProfileByEmail(email);
            if (userProfile == null) {
                throw new IllegalArgumentException("User not found");
            }
            
            String uid = userProfile.getUid();
            System.out.println("🚨 AuthService.deleteAccount() found user with UID: " + uid);
            
            // Check if this user can safely delete their account (coach safety check)
            try {
                var safetyCheck = userTeamService.checkCoachSafety(uid, "DELETE_ACCOUNT").get();
                if (!safetyCheck.isCanProceed()) {
                    throw new RuntimeException("Cannot delete account: " + safetyCheck.getMessage());
                }
            } catch (Exception e) {
                if (e.getMessage().contains("Cannot delete account:")) {
                    throw e; // Re-throw our custom error
                }
                System.out.println("⚠️ Coach safety check failed, proceeding with deletion: " + e.getMessage());
            }
            
            // Check if this user can safely be removed from all tournaments (organizer safety check)
            try {
                boolean canRemoveFromTournaments = organizerTournamentService.checkUserCanBeRemovedFromAllTournaments(uid).get();
                if (!canRemoveFromTournaments) {
                    throw new RuntimeException("Cannot delete account - you are the last organizer of one or more tournaments. Please invite other organizers or delete the tournaments first.");
                }
            } catch (Exception e) {
                if (e.getMessage().contains("Cannot delete account")) {
                    throw e; // Re-throw our custom error
                }
                System.out.println("⚠️ Tournament organizer safety check failed, proceeding with deletion: " + e.getMessage());
            }
            
            // TODO: Verify password here if needed (Firebase Auth handles this)
            
            // Delete the user account from Firebase Auth and Firestore
            System.out.println("🚨 AuthService.deleteAccount() calling FirebaseAuthService.deleteUserAccount() with uid: " + uid);
            return firebaseAuthService.deleteUserAccount(uid);
        } catch (Exception e) {
            System.err.println("❌ AuthService.deleteAccount() failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete account: " + e.getMessage());
        }
    }

    /**
     * Update user information
     */
    public UserWithTeamsDto updateUser(UpdateUserRequest updateRequest) {
        // Validate input
        if (updateRequest == null) {
            throw new IllegalArgumentException("Update request cannot be null");
        }
        if (updateRequest.getEmail() == null || updateRequest.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        try {
            // Find user by email
            UserProfile userProfile = firebaseAuthService.getUserProfileByEmail(updateRequest.getEmail());
            if (userProfile == null) {
                throw new IllegalArgumentException("User not found");
            }

            // Update user fields if provided
            if (updateRequest.getFirstName() != null && !updateRequest.getFirstName().trim().isEmpty()) {
                userProfile.setFirstName(updateRequest.getFirstName());
            }
            if (updateRequest.getLastName() != null && !updateRequest.getLastName().trim().isEmpty()) {
                userProfile.setLastName(updateRequest.getLastName());
            }
            if (updateRequest.getPhoneNumber() != null) {
                // Allow empty string to clear phone number
                userProfile.setPhoneNumber(updateRequest.getPhoneNumber());
            }
            if (updateRequest.getProfilePhotoUrl() != null) {
                // Allow empty string to clear profile photo
                userProfile.setProfilePhotoUrl(updateRequest.getProfilePhotoUrl());
            }

            // Update timestamp
            userProfile.setUpdatedAt(java.time.LocalDateTime.now().toString());

            // Save updated user profile
            UserProfile updatedProfile = firebaseAuthService.updateUserProfile(userProfile.getUid(), userProfile);
            
            // Get user's teams
            try {
                var userTeams = userTeamService.getUserTeams(updatedProfile.getUid()).get();
                return new UserWithTeamsDto(
                    updatedProfile.getUid(),
                    updatedProfile.getEmail(),
                    updatedProfile.getFirstName(),
                    updatedProfile.getLastName(),
                    updatedProfile.getPhoneNumber(),
                    updatedProfile.getDateOfBirth(),
                    updatedProfile.getProfilePhotoUrl(),
                    updatedProfile.getCreatedAt(),
                    updatedProfile.getUpdatedAt(),
                    updatedProfile.isActive(),
                    userTeams
                );
            } catch (Exception e) {
                // If we can't get teams, return user without teams
                return new UserWithTeamsDto(
                    updatedProfile.getUid(),
                    updatedProfile.getEmail(),
                    updatedProfile.getFirstName(),
                    updatedProfile.getLastName(),
                    updatedProfile.getPhoneNumber(),
                    updatedProfile.getDateOfBirth(),
                    updatedProfile.getProfilePhotoUrl(),
                    updatedProfile.getCreatedAt(),
                    updatedProfile.getUpdatedAt(),
                    updatedProfile.isActive(),
                    new java.util.ArrayList<>()
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    /**
     * Get user by ID (for refreshing user data)
     */
    public UserWithTeamsDto getUserById(String uid) {
        try {
            // Find user by UID
            UserProfile userProfile = firebaseAuthService.getUserProfileByUid(uid);
            if (userProfile == null) {
                return null;
            }

            // Check if user is active
            if (!userProfile.isActive()) {
                return null;
            }

            // Get user's teams
            try {
                var userTeams = userTeamService.getUserTeams(userProfile.getUid()).get();
                return new UserWithTeamsDto(
                    userProfile.getUid(),
                    userProfile.getEmail(),
                    userProfile.getFirstName(),
                    userProfile.getLastName(),
                    userProfile.getPhoneNumber(),
                    userProfile.getDateOfBirth(),
                    userProfile.getProfilePhotoUrl(),
                    userProfile.getCreatedAt(),
                    userProfile.getUpdatedAt(),
                    userProfile.isActive(),
                    userTeams
                );
            } catch (Exception e) {
                // If we can't get teams, return user without teams
                return new UserWithTeamsDto(
                    userProfile.getUid(),
                    userProfile.getEmail(),
                    userProfile.getFirstName(),
                    userProfile.getLastName(),
                    userProfile.getPhoneNumber(),
                    userProfile.getDateOfBirth(),
                    userProfile.getProfilePhotoUrl(),
                    userProfile.getCreatedAt(),
                    userProfile.getUpdatedAt(),
                    userProfile.isActive(),
                    new java.util.ArrayList<>()
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user: " + e.getMessage(), e);
        }
    }

    /**
     * Validate registration request
     */
    private void validateRegistrationRequest(RegisterRequest request) {
        // Email validation
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!isValidEmail(request.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Password validation
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (request.getPassword().trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        // Name validation
        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("First name is required");
        }
        if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
            throw new IllegalArgumentException("Last name is required");
        }

        // Phone number validation (optional but must be 10 characters if provided)
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            if (request.getPhoneNumber().trim().length() != 10) {
                throw new IllegalArgumentException("Phone number must be exactly 10 digits long");
            }
            // Check if it contains only digits
            if (!request.getPhoneNumber().trim().matches("\\d{10}")) {
                throw new IllegalArgumentException("Phone number must contain only digits");
            }
        }

        // Date of birth validation
        if (request.getDateOfBirth() == null || request.getDateOfBirth().trim().isEmpty()) {
            throw new IllegalArgumentException("Date of birth is required");
        }
    }

    /**
     * Validate email format
     */
    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }
}
