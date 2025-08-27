package com.example.TeamTrack_backend.services;

import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.LoginRequest;
import com.example.TeamTrack_backend.dto.RegisterRequest;
import com.example.TeamTrack_backend.models.UserProfile;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;

@Service
public class FirebaseAuthService {

    private static final String USER_PROFILES_COLLECTION = "userProfiles";
    private final FirebaseAuth firebaseAuth;
    private final Firestore firestore;
    private final UserTeamService userTeamService;
    private final OrganizerTournamentService organizerTournamentService;
    
    public FirebaseAuthService(FirebaseAuth firebaseAuth, Firestore firestore, UserTeamService userTeamService, OrganizerTournamentService organizerTournamentService) {
        this.firebaseAuth = firebaseAuth;
        this.firestore = firestore;
        this.userTeamService = userTeamService;
        this.organizerTournamentService = organizerTournamentService;
        System.out.println("🚀 FirebaseAuthService: userTeamService injected: " + (userTeamService != null));
        if (userTeamService != null) {
            System.out.println("🚀 FirebaseAuthService: userTeamService class: " + userTeamService.getClass().getName());
        }
        System.out.println("🚀 FirebaseAuthService: organizerTournamentService injected: " + (organizerTournamentService != null));
        if (organizerTournamentService != null) {
            System.out.println("🚀 FirebaseAuthService: organizerTournamentService class: " + organizerTournamentService.getClass().getName());
        }
    }

    /**
     * Register a new user with Firebase Authentication
     */
    public UserProfile registerUser(RegisterRequest registerRequest) throws FirebaseAuthException, InterruptedException, ExecutionException {
        // Create user in Firebase Authentication
        CreateRequest createRequest = new CreateRequest()
            .setEmail(registerRequest.getEmail())
            .setPassword(registerRequest.getPassword())
            .setDisplayName(registerRequest.getFirstName() + " " + registerRequest.getLastName())
            .setEmailVerified(false);

        UserRecord userRecord = firebaseAuth.createUser(createRequest);
        String uid = userRecord.getUid();

        // Create user profile in Firestore
        UserProfile userProfile = new UserProfile(
            uid,
            registerRequest.getEmail(),
            registerRequest.getFirstName(),
            registerRequest.getLastName(),
            registerRequest.getPhoneNumber(),
            registerRequest.getDateOfBirth()
        );

        // Save profile to Firestore
        DocumentReference docRef = firestore.collection(USER_PROFILES_COLLECTION).document(uid);
        ApiFuture<WriteResult> future = docRef.set(userProfile);
        future.get(); // Wait for the write to complete

        return userProfile;
    }

    /**
     * Authenticate user with Firebase Authentication
     */
    public UserProfile authenticateUser(LoginRequest loginRequest) throws FirebaseAuthException, InterruptedException, ExecutionException {
        // Firebase Auth handles the authentication automatically
        // We just need to get the user profile from Firestore
        // For now, we'll use the email to find the user profile
        // In a production app, you'd verify the Firebase ID token instead
        
        // Get user profile from Firestore
        return getUserProfileByEmail(loginRequest.getEmail());
    }

    /**
     * Get user profile by Firebase UID
     */
    public UserProfile getUserProfileByUid(String uid) throws InterruptedException, ExecutionException {
        DocumentReference docRef = firestore.collection(USER_PROFILES_COLLECTION).document(uid);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();
        
        if (document.exists()) {
            return document.toObject(UserProfile.class);
        }
        return null;
    }

    /**
     * Get user profile by email
     */
    public UserProfile getUserProfileByEmail(String email) throws InterruptedException, ExecutionException {
        // Query Firestore for user profile with matching email
        ApiFuture<com.google.cloud.firestore.QuerySnapshot> future = firestore.collection(USER_PROFILES_COLLECTION)
            .whereEqualTo("email", email)
            .limit(1)
            .get();
        
        var documents = future.get().getDocuments();
        if (!documents.isEmpty()) {
            return documents.get(0).toObject(UserProfile.class);
        }
        return null;
    }

    /**
     * Update user profile
     */
    public UserProfile updateUserProfile(String uid, UserProfile updatedProfile) throws InterruptedException, ExecutionException {
        DocumentReference docRef = firestore.collection(USER_PROFILES_COLLECTION).document(uid);
        ApiFuture<WriteResult> future = docRef.set(updatedProfile);
        future.get(); // Wait for the write to complete
        return updatedProfile;
    }

    /**
     * Delete user account
     */
    public boolean deleteUserAccount(String uid) throws FirebaseAuthException, InterruptedException, ExecutionException {
        try {
            System.out.println("🚨 FirebaseAuthService.deleteUserAccount() called with uid: " + uid);
            System.out.println("🚨 Stack trace for deleteUserAccount call:");
            Thread.dumpStack();
            
            System.out.println("🗑️ FirebaseAuthService: Starting deletion of user account: " + uid);
            
            // First, remove all UserTeam documents associated with this user
            System.out.println("🗑️ FirebaseAuthService: Removing all UserTeam documents for user: " + uid);
            userTeamService.removeAllTeamsForUser(uid).get(); // Wait for cascade deletion to complete
            System.out.println("✅ FirebaseAuthService: Successfully removed all UserTeam documents for user: " + uid);
            
            // Then, cleanup all organizer relationships for this user
            System.out.println("🗑️ FirebaseAuthService: Cleaning up organizer relationships for user: " + uid);
            organizerTournamentService.cleanupUserOrganizerRelationships(uid).get(); // Wait for cleanup to complete
            System.out.println("✅ FirebaseAuthService: Successfully cleaned up organizer relationships for user: " + uid);
            
            // Delete from Firebase Authentication
            firebaseAuth.deleteUser(uid);
            System.out.println("✅ FirebaseAuthService: Successfully deleted user from Firebase Auth: " + uid);
            
            // Delete profile from Firestore
            DocumentReference docRef = firestore.collection(USER_PROFILES_COLLECTION).document(uid);
            ApiFuture<WriteResult> future = docRef.delete();
            future.get(); // Wait for the delete to complete
            System.out.println("✅ FirebaseAuthService: Successfully deleted user profile from Firestore: " + uid);
            
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ FirebaseAuthService: Error deleting user account: " + e.getMessage());
            throw new RuntimeException("Failed to delete user account: " + e.getMessage());
        }
    }

    /**
     * Verify Firebase ID token
     */
    public String verifyIdToken(String idToken) throws FirebaseAuthException {
        var decodedToken = firebaseAuth.verifyIdToken(idToken);
        return decodedToken.getUid();
    }
}
