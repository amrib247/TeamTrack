package com.example.TeamTrack_backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.dto.LoginRequest;
import com.example.TeamTrack_backend.dto.RegisterRequest;
import com.example.TeamTrack_backend.dto.UpdateUserRequest;
import com.example.TeamTrack_backend.dto.UserDto;
import com.example.TeamTrack_backend.services.AuthService;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * User login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            UserDto user = authService.login(loginRequest);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * User registration endpoint
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            UserDto user = authService.register(registerRequest);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Delete user account endpoint
     */
    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestBody LoginRequest deleteRequest) {
        try {
            boolean deleted = authService.deleteAccount(deleteRequest.getEmail(), deleteRequest.getPassword());
            if (deleted) {
                return ResponseEntity.ok().body("{\"message\": \"Account deleted successfully\"}");
            } else {
                return ResponseEntity.badRequest().body("{\"error\": \"Failed to delete account\"}");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Internal server error: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Update user information endpoint
     */
    @PostMapping("/update-user")
    public ResponseEntity<?> updateUser(@RequestBody UpdateUserRequest updateRequest) {
        try {
            UserDto updatedUser = authService.updateUser(updateRequest);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Test endpoint
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Auth controller is working!");
    }
}
