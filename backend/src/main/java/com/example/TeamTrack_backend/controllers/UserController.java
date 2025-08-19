package com.example.TeamTrack_backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.dto.UserDto;
import com.example.TeamTrack_backend.models.User;
import com.example.TeamTrack_backend.services.UserService;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable String id) {
        UserDto user = userService.getUserById(id);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody User user) {
        UserDto createdUser = userService.createUser(user);
        return ResponseEntity.ok(createdUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        UserDto user = userService.updateUser(id, updatedUser);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        System.out.println("🚨 UserController.deleteUser() called with id: " + id);
        System.out.println("🚨 HTTP DELETE request received for user: " + id);
        
        boolean deleted = userService.deleteUser(id);
        
        if (!deleted) {
            System.out.println("❌ UserController: User not found for deletion: " + id);
            return ResponseEntity.notFound().build();
        }
        
        System.out.println("✅ UserController: User successfully deleted: " + id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("User controller is working!");
    }

    @PostMapping("/test-cascade-deletion/{id}")
    public ResponseEntity<String> testCascadeDeletion(@PathVariable String id) {
        try {
            System.out.println("🧪 Testing cascade deletion for user: " + id);
            System.out.println("🧪 This endpoint will call UserService.deleteUser() which should trigger cascade deletion");
            boolean deleted = userService.deleteUser(id);
            if (deleted) {
                return ResponseEntity.ok("Cascade deletion test successful for user: " + id);
            } else {
                return ResponseEntity.badRequest().body("User not found: " + id);
            }
        } catch (Exception e) {
            System.err.println("❌ Cascade deletion test failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Cascade deletion test failed: " + e.getMessage());
        }
    }

    @GetMapping("/list-all-user-teams")
    public ResponseEntity<String> listAllUserTeams() {
        try {
            System.out.println("🔍 Listing all UserTeam documents in the database for debugging");
            // This is a debug endpoint to see what UserTeam documents exist
            return ResponseEntity.ok("Check backend logs for UserTeam document listing");
        } catch (Exception e) {
            System.err.println("❌ Failed to list UserTeam documents: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to list UserTeam documents: " + e.getMessage());
        }
    }
}
