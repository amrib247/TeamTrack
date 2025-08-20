package com.example.TeamTrack_backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.UserTeamWithUserDto;
import com.example.TeamTrack_backend.models.UserTeam;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;


@Service
public class UserTeamService {
    
    private final TeamService teamService;
    
    public UserTeamService(TeamService teamService) {
        this.teamService = teamService;
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 TeamService: Checking Firebase initialization...");
            System.out.println("🔍 TeamService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 TeamService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ TeamService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as UserService - this is the correct way!
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ TeamService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ TeamService: Failed to get Firestore instance: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // Add user to a team with a specific role (overloaded for backward compatibility)
    public CompletableFuture<UserTeam> addUserToTeam(String userId, String teamId, String role) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Create user-team relationship (without team details)
                UserTeam userTeam = new UserTeam(
                    null, // ID will be set after creation
                    userId,
                    teamId,
                    role,
                    java.time.LocalDateTime.now().toString(),
                    true, // isActive
                    true  // inviteAccepted - true for direct additions
                );
                
                // Generate unique ID for the relationship
                String userTeamId = firestore.collection("userTeams").document().getId();
                userTeam.setId(userTeamId);

                // Save to Firestore
                firestore.collection("userTeams").document(userTeamId).set(userTeam).get();

                return userTeam;
            } catch (Exception e) {
                throw new RuntimeException("Failed to add user to team: " + e.getMessage());
            }
        });
    }



    // Remove user from a team
    public CompletableFuture<Void> removeUserFromTeam(String userId, String teamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Remove user-team relationship
                firestore.collection("userTeams").document(userId + "_" + teamId).delete().get();
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove user from team: " + e.getMessage());
            }
        });
    }

    // Update user's role in a specific team
    public CompletableFuture<UserTeam> updateUserRole(String userId, String teamId, String newRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Get the current role to determine coach count delta
                String currentRole = null;
                try {
                    var currentDoc = firestore.collection("userTeams")
                        .whereEqualTo("userId", userId)
                        .whereEqualTo("teamId", teamId)
                        .get().get();
                    
                    if (!currentDoc.getDocuments().isEmpty()) {
                        UserTeam currentUserTeam = currentDoc.getDocuments().get(0).toObject(UserTeam.class);
                        if (currentUserTeam != null) {
                            currentRole = currentUserTeam.getRole();
                        }
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ Could not get current role, assuming new user: " + e.getMessage());
                }
                
                // Create updated user-team relationship
                UserTeam userTeam = new UserTeam(
                    null, // ID will be set after creation
                    userId,
                    teamId,
                    newRole,
                    java.time.LocalDateTime.now().toString(),
                    true, // isActive
                    true  // inviteAccepted - true for role updates
                );
                firestore.collection("userTeams").document(userId + "_" + teamId).set(userTeam).get();

                // Update coach count based on role change
                updateCoachCountForRoleChange(teamId, currentRole, newRole);

                return userTeam;
            } catch (Exception e) {
                throw new RuntimeException("Failed to update user role: " + e.getMessage());
            }
        });
    }

    // Get all teams for a specific user
    public CompletableFuture<List<UserTeam>> getUserTeams(String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                System.out.println("🔍 UserTeamService: Querying Firestore for user teams, userId: " + userId);
                
                // Query Firestore for all user-team relationships for this user
                // Temporarily removed isActive filter to debug the issue
                var future = firestore.collection("userTeams")
                    .whereEqualTo("userId", userId)
                    .get();
                
                var querySnapshot = future.get();
                List<UserTeam> userTeams = new ArrayList<>();
                
                System.out.println("🔍 UserTeamService: Query returned " + querySnapshot.size() + " documents");
                
                for (var document : querySnapshot.getDocuments()) {
                    System.out.println("🔍 UserTeamService: Processing document: " + document.getId());
                    System.out.println("🔍 UserTeamService: Document data: " + document.getData());
                    
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null) {
                        userTeam.setId(document.getId());
                        System.out.println("🔍 UserTeamService: Created UserTeam object with role: " + userTeam.getRole());
                        userTeams.add(userTeam);
                    } else {
                        System.err.println("❌ UserTeamService: Failed to convert document to UserTeam object");
                    }
                }
                
                System.out.println("🔍 UserTeamService: Found " + userTeams.size() + " teams for user " + userId);
                return userTeams;
                
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Error getting user teams: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get user teams: " + e.getMessage());
            }
        });
    }

    // Get all users for a specific team
    public CompletableFuture<List<UserTeamWithUserDto>> getTeamUsers(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 UserTeamService: Getting all users for team: " + teamId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Query for all user-team relationships for this team
                var future = firestore.collection("userTeams")
                    .whereEqualTo("teamId", teamId)
                    .get();
                
                var querySnapshot = future.get();
                List<UserTeamWithUserDto> teamUsers = new ArrayList<>();
                
                System.out.println("🔍 UserTeamService: Found " + querySnapshot.size() + " users in team: " + teamId);
                
                for (var document : querySnapshot.getDocuments()) {
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null) {
                        userTeam.setId(document.getId());
                        
                        try {
                            // Fetch user details from userProfiles collection (not users collection)
                            var userDocRef = firestore.collection("userProfiles").document(userTeam.getUserId());
                            var userDoc = userDocRef.get().get();
                            
                            if (userDoc.exists()) {
                                // Use UserProfile instead of User model
                                var userProfile = userDoc.toObject(com.example.TeamTrack_backend.models.UserProfile.class);
                                if (userProfile != null) {
                                    // Create DTO with user and team information
                                    UserTeamWithUserDto userTeamWithUser = new UserTeamWithUserDto(
                                        userTeam,
                                        userProfile.getFirstName(),
                                        userProfile.getLastName(),
                                        userProfile.getEmail(),
                                        userProfile.getPhoneNumber(),
                                        userProfile.getProfilePhotoUrl()
                                    );
                                    teamUsers.add(userTeamWithUser);
                                    System.out.println("🔍 UserTeamService: Added user " + userProfile.getFirstName() + " " + userProfile.getLastName() + " with role: " + userTeam.getRole());
                                } else {
                                    System.err.println("❌ UserTeamService: Failed to convert userProfile document to UserProfile object for userId: " + userTeam.getUserId());
                                }
                            } else {
                                System.err.println("❌ UserTeamService: UserProfile not found for userId: " + userTeam.getUserId());
                            }
                        } catch (Exception e) {
                            System.err.println("❌ UserTeamService: Error fetching user details for userId: " + userTeam.getUserId() + ": " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                }
                
                System.out.println("✅ UserTeamService: Successfully retrieved " + teamUsers.size() + " users for team: " + teamId);
                return teamUsers;
                
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Error getting team users: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get team users: " + e.getMessage());
            }
        });
    }

    // Check if user is in a specific team
    public CompletableFuture<Boolean> isUserInTeam(String userId, String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return false - this would need proper Firestore implementation
                // In a real implementation, you'd use Firestore listeners or REST API
                return false;
            } catch (Exception e) {
                throw new RuntimeException("Failed to check user-team relationship: " + e.getMessage());
            }
        });
    }

    // Get user's role in a specific team
    public CompletableFuture<String> getUserRoleInTeam(String userId, String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // For now, return null - this would need proper Firestore implementation
                // In a real implementation, you'd use Firestore listeners or REST API
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get user role: " + e.getMessage());
            }
        });
    }
    
    // Remove all users from a team (used when terminating a team)
    public CompletableFuture<Void> removeAllUsersFromTeam(String teamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🗑️ UserTeamService: Removing all users from team: " + teamId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Query for all user-team relationships for this team
                var future = firestore.collection("userTeams")
                    .whereEqualTo("teamId", teamId)
                    .get();
                
                var querySnapshot = future.get();
                System.out.println("🔍 UserTeamService: Found " + querySnapshot.size() + " user-team relationships to remove");
                
                // Delete all user-team relationships for this team
                for (var document : querySnapshot.getDocuments()) {
                    // Get the user's role before deleting to update coach count
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null && "COACH".equals(userTeam.getRole())) {
                        System.out.println("👥 UserTeamService: Removing COACH user, decrementing coach count for team: " + teamId);
                        try {
                            teamService.updateCoachCount(teamId, -1).get();
                        } catch (Exception e) {
                            System.err.println("❌ UserTeamService: Error updating coach count for removed user: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                    
                    firestore.collection("userTeams").document(document.getId()).delete().get();
                    System.out.println("🗑️ UserTeamService: Removed user-team relationship: " + document.getId());
                }
                
                System.out.println("✅ UserTeamService: Successfully removed all users from team: " + teamId);
                
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Error removing users from team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to remove users from team: " + e.getMessage());
            }
        });
    }
    
    // Remove all teams for a specific user (used when deleting a user)
    public CompletableFuture<Void> removeAllTeamsForUser(String userId) {
        return CompletableFuture.runAsync(() -> {
            try {
                System.out.println("🚨 UserTeamService.removeAllTeamsForUser() called with userId: " + userId);
                System.out.println("🚨 Stack trace for removeAllTeamsForUser call:");
                Thread.dumpStack();
                
                System.out.println("🗑️ UserTeamService: Removing all teams for user: " + userId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Query for all user-team relationships for this user
                var future = firestore.collection("userTeams")
                    .whereEqualTo("userId", userId)
                    .get();
                
                var querySnapshot = future.get();
                System.out.println("🔍 UserTeamService: Found " + querySnapshot.size() + " user-team relationships to remove for user: " + userId);
                
                // Delete all user-team relationships for this user
                for (var document : querySnapshot.getDocuments()) {
                    // Get the user's role and team ID before deleting to update coach count
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null && "COACH".equals(userTeam.getRole())) {
                        System.out.println("👥 UserTeamService: Removing COACH user, decrementing coach count for team: " + userTeam.getTeamId());
                        try {
                            teamService.updateCoachCount(userTeam.getTeamId(), -1).get();
                        } catch (Exception e) {
                            System.err.println("❌ UserTeamService: Error updating coach count for removed user: " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                    
                    firestore.collection("userTeams").document(document.getId()).delete().get();
                    System.out.println("🗑️ UserTeamService: Removed user-team relationship: " + document.getId());
                }
                
                System.out.println("✅ UserTeamService: Successfully removed all teams for user: " + userId);
                
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Error removing teams for user: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to remove teams for user: " + e.getMessage());
            }
        });
    }

    public CompletableFuture<UserTeam> inviteUserToTeam(String teamId, String userEmail, String role) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // First, find the user by email
                var userProfiles = firestore.collection("userProfiles")
                    .whereEqualTo("email", userEmail)
                    .get()
                    .get();
                
                if (userProfiles.isEmpty()) {
                    throw new RuntimeException("User with email " + userEmail + " not found");
                }
                
                var userProfile = userProfiles.getDocuments().get(0).toObject(com.example.TeamTrack_backend.models.UserProfile.class);
                if (userProfile == null) {
                    throw new RuntimeException("Failed to parse user profile");
                }
                
                String userId = userProfile.getUid();
                
                // Check if user is already in the team
                var existingUserTeam = firestore.collection("userTeams")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("teamId", teamId)
                    .get()
                    .get();
                
                if (!existingUserTeam.isEmpty()) {
                    throw new RuntimeException("User is already a member of this team");
                }
                
                // Create new UserTeam document
                UserTeam newUserTeam = new UserTeam(
                    null, // ID will be auto-generated
                    userId,
                    teamId,
                    role,
                    java.time.LocalDateTime.now().toString(),
                    true, // isActive
                    false  // inviteAccepted - initially false for invited users
                );
                
                // Save to Firestore
                var docRef = firestore.collection("userTeams").add(newUserTeam).get();
                newUserTeam.setId(docRef.getId());
                
                // Note: Coach count will only be incremented when the invite is accepted
                // This prevents counting coaches who haven't accepted yet
                
                return newUserTeam;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to invite user to team: " + e.getMessage(), e);
            }
        });
    }

    // Accept an invite for a user
    public CompletableFuture<UserTeam> acceptInvite(String userTeamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Get the existing UserTeam document
                var docRef = firestore.collection("userTeams").document(userTeamId);
                var doc = docRef.get().get();
                
                if (!doc.exists()) {
                    throw new RuntimeException("UserTeam relationship not found");
                }
                
                UserTeam userTeam = doc.toObject(UserTeam.class);
                if (userTeam == null) {
                    throw new RuntimeException("Failed to parse UserTeam document");
                }
                
                // Update the inviteAccepted field
                userTeam.setInviteAccepted(true);
                userTeam.setId(userTeamId);
                
                // Save the updated document
                docRef.set(userTeam).get();
                
                // Update coach count if the accepted invite is for a COACH role
                if ("COACH".equals(userTeam.getRole())) {
                    System.out.println("👥 UserTeamService: User accepted COACH invite, incrementing coach count for team: " + userTeam.getTeamId());
                    try {
                        teamService.updateCoachCount(userTeam.getTeamId(), 1).get();
                    } catch (Exception e) {
                        System.err.println("❌ UserTeamService: Error updating coach count for accepted invite: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                return userTeam;
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to accept invite: " + e.getMessage(), e);
            }
        });
    }

    // Decline an invite for a user (delete the UserTeam document by its ID)
    public CompletableFuture<Void> declineInvite(String userTeamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }

                // Get the user's role before deleting to update coach count
                String userRole = null;
                String teamId = null;
                try {
                    var doc = firestore.collection("userTeams").document(userTeamId).get().get();
                    if (doc.exists()) {
                        UserTeam userTeam = doc.toObject(UserTeam.class);
                        if (userTeam != null) {
                            userRole = userTeam.getRole();
                            teamId = userTeam.getTeamId();
                        }
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ Could not get user role before declining: " + e.getMessage());
                }

                // Delete the UserTeam document
                firestore.collection("userTeams").document(userTeamId).delete().get();
                
                // Update coach count if the declined invite was for a COACH role
                if ("COACH".equals(userRole) && teamId != null) {
                    System.out.println("👥 UserTeamService: COACH invite declined, decrementing coach count for team: " + teamId);
                    try {
                        teamService.updateCoachCount(teamId, -1).get();
                    } catch (Exception e) {
                        System.err.println("❌ UserTeamService: Error updating coach count for declined invite: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to decline invite: " + e.getMessage(), e);
            }
        });
    }

    // Leave a team (delete the UserTeam document by its ID)
    public CompletableFuture<Void> leaveTeam(String userTeamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Get the user's role and team ID before proceeding
                String userRole = null;
                String teamId = null;
                String userId = null;
                try {
                    var doc = firestore.collection("userTeams").document(userTeamId).get().get();
                    if (doc.exists()) {
                        UserTeam userTeam = doc.toObject(UserTeam.class);
                        if (userTeam != null) {
                            userRole = userTeam.getRole();
                            teamId = userTeam.getTeamId();
                            userId = userTeam.getUserId();
                        }
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ Could not get user role before leaving: " + e.getMessage());
                    throw new RuntimeException("Failed to get user information");
                }
                
                // If this is a COACH, check if they can safely leave
                if ("COACH".equals(userRole) && userId != null) {
                    var safetyCheck = checkCoachSafety(userId, "LEAVE_TEAM").get();
                    if (!safetyCheck.isCanProceed()) {
                        throw new RuntimeException("Coach safety check failed: " + safetyCheck.getMessage());
                    }
                }
                
                // Delete the UserTeam document
                firestore.collection("userTeams").document(userTeamId).delete().get();
                
                // Update coach count if the leaving user was a COACH
                if ("COACH".equals(userRole) && teamId != null) {
                    System.out.println("👥 UserTeamService: COACH user leaving team, decrementing coach count for team: " + teamId);
                    try {
                        teamService.updateCoachCount(teamId, -1).get();
                    } catch (Exception e) {
                        System.err.println("❌ UserTeamService: Error updating coach count for leaving user: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to leave team: " + e.getMessage(), e);
            }
        });
    }

    // Update user role in team
    public CompletableFuture<UserTeam> updateUserRole(String userTeamId, String newRole) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                var docRef = firestore.collection("userTeams").document(userTeamId);
                var doc = docRef.get().get();
                
                if (!doc.exists()) {
                    throw new RuntimeException("UserTeam not found");
                }
                
                UserTeam userTeam = doc.toObject(UserTeam.class);
                if (userTeam == null) {
                    throw new RuntimeException("Failed to parse UserTeam");
                }
                
                String oldRole = userTeam.getRole();
                userTeam.setRole(newRole);
                docRef.set(userTeam).get();
                
                // Update coach count based on role change
                updateCoachCountForRoleChange(userTeam.getTeamId(), oldRole, newRole);
                
                return userTeam;
            } catch (Exception e) {
                throw new RuntimeException("Failed to update user role", e);
            }
        });
    }

    // Remove user from team
    public CompletableFuture<Void> removeUserFromTeam(String userTeamId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Get the user's role before deleting to update coach count
                String userRole = null;
                String teamId = null;
                try {
                    var doc = firestore.collection("userTeams").document(userTeamId).get().get();
                    if (doc.exists()) {
                        UserTeam userTeam = doc.toObject(UserTeam.class);
                        if (userTeam != null) {
                            userRole = userTeam.getRole();
                            teamId = userTeam.getTeamId();
                        }
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ Could not get user role before removal: " + e.getMessage());
                }
                
                // Delete the UserTeam document
                firestore.collection("userTeams").document(userTeamId).delete().get();
                
                // Update coach count if the removed user was a COACH
                if ("COACH".equals(userRole) && teamId != null) {
                    System.out.println("👥 UserTeamService: Removing COACH user, decrementing coach count for team: " + teamId);
                    try {
                        teamService.updateCoachCount(teamId, -1).get();
                    } catch (Exception e) {
                        System.err.println("❌ UserTeamService: Error updating coach count for removed user: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove user from team", e);
            }
        });
    }

    // Ensure all existing UserTeam documents have the inviteAccepted field
    public CompletableFuture<Void> ensureInviteAcceptedField() {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Get all UserTeam documents
                var future = firestore.collection("userTeams").get();
                var querySnapshot = future.get();
                
                for (var document : querySnapshot.getDocuments()) {
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null) {
                        // Check if inviteAccepted field is false
                        // For team creators (COACH role), set to true
                        if (!userTeam.isInviteAccepted()) {
                            if ("COACH".equals(userTeam.getRole())) {
                                // Team creators should always have inviteAccepted = true
                                userTeam.setInviteAccepted(true);
                                userTeam.setId(document.getId());
                                firestore.collection("userTeams").document(document.getId()).set(userTeam).get();
                                System.out.println("✅ Updated UserTeam " + document.getId() + " for COACH to inviteAccepted = true");
                            }
                        }
                    }
                }
                
            } catch (Exception e) {
                System.err.println("❌ Error ensuring inviteAccepted field: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }
    
    // Fix existing UserTeam documents for team creators
    public CompletableFuture<Void> fixTeamCreatorsInviteStatus() {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                System.out.println("🔧 Fixing invite status for team creators...");
                
                // Get all UserTeam documents
                var future = firestore.collection("userTeams").get();
                var querySnapshot = future.get();
                
                int fixedCount = 0;
                for (var document : querySnapshot.getDocuments()) {
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null) {
                        // For team creators (COACH role), ensure inviteAccepted is true
                        if ("COACH".equals(userTeam.getRole()) && !userTeam.isInviteAccepted()) {
                            userTeam.setInviteAccepted(true);
                            userTeam.setId(document.getId());
                            firestore.collection("userTeams").document(document.getId()).set(userTeam).get();
                            System.out.println("✅ Fixed UserTeam " + document.getId() + " for COACH to inviteAccepted = true");
                            fixedCount++;
                        }
                    }
                }
                
                System.out.println("🎉 Fixed " + fixedCount + " team creator UserTeam documents");
                
            } catch (Exception e) {
                System.err.println("❌ Error fixing team creators invite status: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    /**
     * Helper method to update coach count when a user's role changes
     */
    private void updateCoachCountForRoleChange(String teamId, String oldRole, String newRole) {
        try {
            // Determine the delta for coach count
            int delta = 0;
            
            // If old role was COACH, decrement
            if ("COACH".equals(oldRole)) {
                delta -= 1;
            }
            
            // If new role is COACH, increment
            if ("COACH".equals(newRole)) {
                delta += 1;
            }
            
            // Only update if there's a change
            if (delta != 0) {
                System.out.println("👥 UserTeamService: Updating coach count for team " + teamId + 
                    " - old role: " + oldRole + ", new role: " + newRole + ", delta: " + delta);
                teamService.updateCoachCount(teamId, delta).get();
            }
            
        } catch (Exception e) {
            System.err.println("❌ UserTeamService: Error updating coach count: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Check if a coach can safely leave a team or delete their account
     * Returns a response indicating whether they can proceed or need to take action first
     */
    public CompletableFuture<com.example.TeamTrack_backend.dto.CoachSafetyCheckResponse> checkCoachSafety(String userId, String action) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔒 UserTeamService: Checking coach safety for user: " + userId + ", action: " + action);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase not available");
                }
                
                // Get all teams where this user is a COACH
                var future = firestore.collection("userTeams")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("role", "COACH")
                    .get();
                
                var querySnapshot = future.get();
                System.out.println("🔒 UserTeamService: Found " + querySnapshot.size() + " teams where user is COACH");
                
                // Check each team where user is a coach
                for (var document : querySnapshot.getDocuments()) {
                    UserTeam userTeam = document.toObject(UserTeam.class);
                    if (userTeam != null) {
                        String teamId = userTeam.getTeamId();
                        
                        // Get current coach count for this team
                        try {
                            int coachCount = teamService.getCoachCount(teamId).get();
                            System.out.println("🔒 UserTeamService: Team " + teamId + " has " + coachCount + " coaches");
                            
                            // If this is the only coach, they cannot proceed
                            if (coachCount == 1) {
                                // Get team name for better user experience
                                String teamName = "Unknown Team";
                                try {
                                    var teamDoc = firestore.collection("teams").document(teamId).get().get();
                                    if (teamDoc.exists()) {
                                        var team = teamDoc.toObject(com.example.TeamTrack_backend.models.Team.class);
                                        if (team != null) {
                                            teamName = team.getTeamName();
                                        }
                                    }
                                } catch (Exception e) {
                                    System.out.println("⚠️ Could not get team name: " + e.getMessage());
                                }
                                
                                String message = "You are the only coach of '" + teamName + "'. You must either promote someone else to coach or delete the team before you can " + 
                                    (action.equals("DELETE_ACCOUNT") ? "delete your account" : "leave the team") + ".";
                                
                                System.out.println("🚨 UserTeamService: Coach safety check failed - user is only coach of team: " + teamId);
                                
                                return new com.example.TeamTrack_backend.dto.CoachSafetyCheckResponse(
                                    false, // cannot proceed
                                    message,
                                    teamId,
                                    teamName,
                                    coachCount,
                                    action
                                );
                            }
                        } catch (Exception e) {
                            System.err.println("❌ UserTeamService: Error getting coach count for team " + teamId + ": " + e.getMessage());
                            e.printStackTrace();
                        }
                    }
                }
                
                // If we get here, the user can safely proceed
                System.out.println("✅ UserTeamService: Coach safety check passed - user can proceed with action: " + action);
                return new com.example.TeamTrack_backend.dto.CoachSafetyCheckResponse(
                    true, // can proceed
                    "You can safely proceed with this action.",
                    null,
                    null,
                    0,
                    action
                );
                
            } catch (Exception e) {
                System.err.println("❌ UserTeamService: Error checking coach safety: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to check coach safety: " + e.getMessage(), e);
            }
        });
    }
}
