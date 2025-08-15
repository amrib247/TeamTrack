package com.example.TeamTrack_backend.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.UserDto;
import com.example.TeamTrack_backend.models.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class UserService {

    private static final String COLLECTION_NAME = "users";
    private Firestore firestore;
    private List<User> inMemoryUsers = new ArrayList<>(); // Fallback storage
    private boolean useFirebase = true;

    public UserService() {
        // Initialize Firestore when needed, not in constructor
    }

    @PostConstruct
    public void initialize() {
        System.out.println("🚀 UserService starting up...");
        System.out.println("🚀 UserService startup complete. Will check Firebase status dynamically.");
    }

    private Firestore getFirestore() {
        if (firestore == null) {
            try {
                System.out.println("🔍 Checking Firebase initialization...");
                System.out.println("🔍 FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
                System.out.println("🔍 FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
                
                // Check if Firebase is initialized
                if (FirebaseApp.getApps().isEmpty()) {
                    useFirebase = false;
                    System.out.println("🔥 Firebase not initialized - using IN-MEMORY storage");
                    return null;
                }
                firestore = FirestoreClient.getFirestore();
                useFirebase = true;
                System.out.println("🔥 Firebase initialized - using FIRESTORE storage");
            } catch (Exception e) {
                useFirebase = false;
                System.out.println("🔥 Firebase error - using IN-MEMORY storage: " + e.getMessage());
                e.printStackTrace();
                return null;
            }
        }
        return firestore;
    }

    private boolean isFirebaseAvailable() {
        return !FirebaseApp.getApps().isEmpty() && getFirestore() != null;
    }

    public List<UserDto> getAllUsers() {
        System.out.println("📋 Getting all users...");
        if (isFirebaseAvailable()) {
            System.out.println("📋 Fetching from FIRESTORE");
            return getAllUsersFromFirestore();
        } else {
            System.err.println("💥 ERROR: Firebase not available - cannot fetch users!");
            throw new RuntimeException("Firebase database not available - cannot fetch users");
        }
    }

    private List<UserDto> getAllUsersFromFirestore() {
        List<UserDto> users = new ArrayList<>();
        try {
            ApiFuture<QuerySnapshot> future = getFirestore().collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            for (QueryDocumentSnapshot document : documents) {
                User user = document.toObject(User.class);
                if (user != null) {
                    user.setId(document.getId());
                    users.add(new UserDto(user));
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching users from Firestore", e);
        }
        return users;
    }

    private List<UserDto> getAllUsersFromMemory() {
        return inMemoryUsers.stream()
                .map(UserDto::new)
                .toList();
    }

    public UserDto getUserById(String id) {
        if (isFirebaseAvailable()) {
            return getUserByIdFromFirestore(id);
        } else {
            return getUserByIdFromMemory(id);
        }
    }

    public User findUserByEmail(String email) {
        System.out.println("🔍 Finding user by email: " + email);
        if (isFirebaseAvailable()) {
            System.out.println("🔍 Searching in FIRESTORE");
            return findUserByEmailFromFirestore(email);
        } else {
            System.err.println("💥 ERROR: Firebase not available - cannot search for user!");
            throw new RuntimeException("Firebase database not available - cannot search for user");
        }
    }

    private UserDto getUserByIdFromFirestore(String id) {
        try {
            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            if (document.exists()) {
                User user = document.toObject(User.class);
                if (user != null) {
                    user.setId(document.getId());
                    return new UserDto(user);
                }
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching user from Firestore", e);
        }
    }

    private User findUserByEmailFromFirestore(String email) {
        try {
            // Query Firestore for user with matching email
            ApiFuture<QuerySnapshot> future = getFirestore().collection(COLLECTION_NAME)
                .whereEqualTo("email", email)
                .limit(1)
                .get();
            
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            if (!documents.isEmpty()) {
                User user = documents.get(0).toObject(User.class);
                if (user != null) {
                    user.setId(documents.get(0).getId());
                    return user;
                }
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error finding user by email from Firestore", e);
        }
    }

    private UserDto getUserByIdFromMemory(String id) {
        User user = inMemoryUsers.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        return user != null ? new UserDto(user) : null;
    }

    private User findUserByEmailFromMemory(String email) {
        return inMemoryUsers.stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElse(null);
    }

    public UserDto createUser(User user) {
        System.out.println("🔥 Creating user: " + user.getEmail());
        System.out.println("🔥 Current Firebase status - useFirebase: " + useFirebase + ", firestore: " + (firestore != null));
        System.out.println("🔥 FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
        
        try {
            if (isFirebaseAvailable()) {
                System.out.println("🔥 Creating user in FIRESTORE: " + user.getEmail());
                return createUserInFirestore(user);
            } else {
                System.err.println("💥 ERROR: Firebase not available - cannot create user!");
                System.err.println("💥 Users must be saved to persistent database, not in-memory storage");
                throw new RuntimeException("Firebase database not available - user creation failed");
            }
        } catch (Exception e) {
            System.err.println("🔥 ERROR creating user: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    private UserDto createUserInFirestore(User user) {
        try {
            String id = UUID.randomUUID().toString();
            user.setId(id);
            user.setCreatedAt(LocalDateTime.now().toString()); // Set string directly
            user.setUpdatedAt(LocalDateTime.now().toString()); // Set string directly
            user.setActive(true);

            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<WriteResult> future = docRef.set(user);
            future.get(); // Wait for the write to complete

            return new UserDto(user);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error creating user in Firestore", e);
        }
    }

    private UserDto createUserInMemory(User user) {
        String id = UUID.randomUUID().toString();
        user.setId(id);
        user.setCreatedAt(LocalDateTime.now().toString()); // Set string directly
        user.setUpdatedAt(LocalDateTime.now().toString()); // Set string directly
        user.setActive(true);
        
        inMemoryUsers.add(user);
        return new UserDto(user);
    }

    public UserDto updateUser(String id, User updatedUser) {
        if (isFirebaseAvailable()) {
            return updateUserInFirestore(id, updatedUser);
        } else {
            System.err.println("💥 ERROR: Firebase not available - cannot update user!");
            throw new RuntimeException("Firebase database not available - cannot update user");
        }
    }

    private UserDto updateUserInFirestore(String id, User updatedUser) {
        try {
            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            if (!document.exists()) {
                return null;
            }

            User existingUser = document.toObject(User.class);
            if (existingUser != null) {
                existingUser.setFirstName(updatedUser.getFirstName());
                existingUser.setLastName(updatedUser.getLastName());
                existingUser.setEmail(updatedUser.getEmail());
                existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
                existingUser.setUpdatedAt(LocalDateTime.now().toString()); // Set string directly

                ApiFuture<WriteResult> writeFuture = docRef.set(existingUser);
                writeFuture.get(); // Wait for the write to complete

                return new UserDto(existingUser);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error updating user in Firestore", e);
        }
    }

    private UserDto updateUserInMemory(String id, User updatedUser) {
        User existingUser = inMemoryUsers.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElse(null);
        
        if (existingUser != null) {
            existingUser.setFirstName(updatedUser.getFirstName());
            existingUser.setLastName(updatedUser.getLastName());
            existingUser.setEmail(updatedUser.getEmail());
            existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
            existingUser.setUpdatedAt(LocalDateTime.now().toString()); // Set string directly
            
            return new UserDto(existingUser);
        }
        return null;
    }

    public boolean deleteUser(String id) {
        if (isFirebaseAvailable()) {
            return deleteUserFromFirestore(id);
        } else {
            System.err.println("💥 ERROR: Firebase not available - cannot delete user!");
            throw new RuntimeException("Firebase database not available - cannot delete user");
        }
    }

    private boolean deleteUserFromFirestore(String id) {
        try {
            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<WriteResult> future = docRef.delete();
            future.get(); // Wait for the delete to complete
            return true;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error deleting user from Firestore", e);
        }
    }

    private boolean deleteUserFromMemory(String id) {
        return inMemoryUsers.removeIf(user -> user.getId().equals(id));
    }
}
