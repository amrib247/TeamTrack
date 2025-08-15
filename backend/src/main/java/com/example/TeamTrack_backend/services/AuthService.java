package com.example.TeamTrack_backend.services;

import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.LoginRequest;
import com.example.TeamTrack_backend.dto.RegisterRequest;
import com.example.TeamTrack_backend.dto.UpdateUserRequest;
import com.example.TeamTrack_backend.dto.UserDto;
import com.example.TeamTrack_backend.dto.UserWithTeamsDto;
import com.example.TeamTrack_backend.models.User;

@Service
public class AuthService {

    @Autowired
    private UserService userService;
    
    @Autowired
    private PasswordService passwordService;
    
    @Autowired
    private UserTeamService userTeamService;

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

        // Find user by email
        User user = userService.findUserByEmail(loginRequest.getEmail());
        if (user == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Check password using encrypted verification
        if (!passwordService.verifyPassword(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Check if user is active
        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is deactivated");
        }

        // Get user's teams
        try {
            var userTeams = userTeamService.getUserTeams(user.getId()).get();
            return new UserWithTeamsDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.isActive(),
                userTeams
            );
        } catch (Exception e) {
            // If we can't get teams, return user without teams
            return new UserWithTeamsDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getDateOfBirth(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.isActive(),
                new java.util.ArrayList<>()
            );
        }
    }

    /**
     * Register a new user
     */
    public UserWithTeamsDto register(RegisterRequest registerRequest) {
        // Validate input
        validateRegistrationRequest(registerRequest);

        // Check if email already exists
        if (userService.findUserByEmail(registerRequest.getEmail()) != null) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Encrypt the password before storing
        String encryptedPassword = passwordService.encryptPassword(registerRequest.getPassword());

        // Create new user (no default role or team - will be assigned when joining teams)
        User newUser = new User(
            registerRequest.getEmail(),
            encryptedPassword, // Store encrypted password
            registerRequest.getFirstName(),
            registerRequest.getLastName(),
            registerRequest.getPhoneNumber(),
            registerRequest.getDateOfBirth()
        );

        // Save user
        UserDto savedUser = userService.createUser(newUser);
        
        // Return user with empty teams list
        return new UserWithTeamsDto(
            savedUser.getId(),
            savedUser.getEmail(),
            savedUser.getFirstName(),
            savedUser.getLastName(),
            savedUser.getPhoneNumber(),
            savedUser.getDateOfBirth(),
            savedUser.getCreatedAt(),
            savedUser.getUpdatedAt(),
            savedUser.isActive(),
            new java.util.ArrayList<>()
        );
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

        // Find user by email
        User user = userService.findUserByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        // Verify password
        if (!passwordService.verifyPassword(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        // Check if user is active
        if (!user.isActive()) {
            throw new IllegalArgumentException("Account is already deactivated");
        }

        // Delete the user account
        return userService.deleteUser(user.getId());
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

        // Find user by email
        User user = userService.findUserByEmail(updateRequest.getEmail());
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        // Verify password
        if (!passwordService.verifyPassword(updateRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        // Update user fields if provided
        if (updateRequest.getFirstName() != null && !updateRequest.getFirstName().trim().isEmpty()) {
            user.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null && !updateRequest.getLastName().trim().isEmpty()) {
            user.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getPhoneNumber() != null) {
            // Allow empty string to clear phone number
            user.setPhoneNumber(updateRequest.getPhoneNumber());
        }

        // Update timestamp
        user.setUpdatedAt(java.time.LocalDateTime.now().toString());

        // Save updated user
        UserDto updatedUser = userService.updateUser(user.getId(), user);
        
        // Get user's teams
        try {
            var userTeams = userTeamService.getUserTeams(user.getId()).get();
            return new UserWithTeamsDto(
                updatedUser.getId(),
                updatedUser.getEmail(),
                updatedUser.getFirstName(),
                updatedUser.getLastName(),
                updatedUser.getPhoneNumber(),
                updatedUser.getDateOfBirth(),
                updatedUser.getCreatedAt(),
                updatedUser.getUpdatedAt(),
                updatedUser.isActive(),
                userTeams
            );
        } catch (Exception e) {
            // If we can't get teams, return user without teams
            return new UserWithTeamsDto(
                updatedUser.getId(),
                updatedUser.getEmail(),
                updatedUser.getFirstName(),
                updatedUser.getLastName(),
                updatedUser.getPhoneNumber(),
                updatedUser.getDateOfBirth(),
                updatedUser.getCreatedAt(),
                updatedUser.getUpdatedAt(),
                updatedUser.isActive(),
                new java.util.ArrayList<>()
            );
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

        // Password validation using PasswordService
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (!passwordService.isPasswordValid(request.getPassword())) {
            throw new IllegalArgumentException("Password must be at least 6 characters long and contain both letters and numbers");
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
