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

    private static final String COLLECTION_NAME = "userProfiles";
    private Firestore firestore;
    
    private final UserTeamService userTeamService;
    private final OrganizerTournamentService organizerTournamentService;
    
    public UserService(UserTeamService userTeamService, OrganizerTournamentService organizerTournamentService) {
        this.userTeamService = userTeamService;
        this.organizerTournamentService = organizerTournamentService;
    }

    @PostConstruct
    public void initialize() {
        // Service initialization complete
    }

    private Firestore getFirestore() {
        if (firestore == null) {
            try {
                if (FirebaseApp.getApps().isEmpty()) {
                    return null;
                }
                firestore = FirestoreClient.getFirestore();
            } catch (Exception e) {
                return null;
            }
        }
        return firestore;
    }

    private boolean isFirebaseAvailable() {
        return !FirebaseApp.getApps().isEmpty() && getFirestore() != null;
    }

    public List<UserDto> getAllUsers() {
        if (isFirebaseAvailable()) {
            return getAllUsersFromFirestore();
        } else {
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

    public UserDto getUserById(String id) {
        if (isFirebaseAvailable()) {
            return getUserByIdFromFirestore(id);
        } else {
            throw new RuntimeException("Firebase database not available - cannot fetch user");
        }
    }

    public User findUserByEmail(String email) {
        if (isFirebaseAvailable()) {
            return findUserByEmailFromFirestore(email);
        } else {
            throw new RuntimeException("Firebase database not available - cannot search for user");
        }
    }

    public User findUserById(String id) {
        if (isFirebaseAvailable()) {
            return findUserByIdFromFirestore(id);
        } else {
            throw new RuntimeException("Firebase database not available - cannot search for user");
        }
    }

    private User findUserByEmailFromFirestore(String email) {
        try {
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

    private User findUserByIdFromFirestore(String id) {
        try {
            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            if (document.exists()) {
                User user = document.toObject(User.class);
                if (user != null) {
                    user.setId(document.getId());
                    return user;
                }
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error finding user by ID from Firestore", e);
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
            throw new RuntimeException("Error fetching user by ID from Firestore", e);
        }
    }

    public UserDto createUser(User user) {
        try {
            if (isFirebaseAvailable()) {
                return createUserInFirestore(user);
            } else {
                throw new RuntimeException("Firebase database not available - user creation failed");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    private UserDto createUserInFirestore(User user) {
        try {
            String id = UUID.randomUUID().toString();
            user.setId(id);
            user.setCreatedAt(LocalDateTime.now().toString());
            user.setUpdatedAt(LocalDateTime.now().toString());
            user.setActive(true);

            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<WriteResult> future = docRef.set(user);
            future.get();

            return new UserDto(user);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error creating user in Firestore", e);
        }
    }

    public UserDto updateUser(String id, User updatedUser) {
        if (isFirebaseAvailable()) {
            return updateUserInFirestore(id, updatedUser);
        } else {
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
                existingUser.setUpdatedAt(LocalDateTime.now().toString());
                
                ApiFuture<WriteResult> updateFuture = docRef.set(existingUser);
                updateFuture.get();
                
                return new UserDto(existingUser);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error updating user in Firestore", e);
        }
    }

    public boolean deleteUser(String id) {
        if (isFirebaseAvailable()) {
            return deleteUserFromFirestore(id);
        } else {
            throw new RuntimeException("Firebase database not available - cannot delete user");
        }
    }

    private boolean deleteUserFromFirestore(String id) {
        try {
            DocumentReference docRef = getFirestore().collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            
            if (!document.exists()) {
                return false;
            }

            ApiFuture<WriteResult> deleteFuture = docRef.delete();
            deleteFuture.get();
            
            return true;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error deleting user from Firestore", e);
        }
    }

    public List<UserDto> searchUsersByName(String name) {
        if (isFirebaseAvailable()) {
            return searchUsersByNameFromFirestore(name);
        } else {
            throw new RuntimeException("Firebase database not available - cannot search users");
        }
    }

    private List<UserDto> searchUsersByNameFromFirestore(String name) {
        List<UserDto> users = new ArrayList<>();
        try {
            String searchTerm = name.toLowerCase();
            ApiFuture<QuerySnapshot> future = getFirestore().collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            for (QueryDocumentSnapshot document : documents) {
                User user = document.toObject(User.class);
                if (user != null) {
                    String firstName = user.getFirstName() != null ? user.getFirstName().toLowerCase() : "";
                    String lastName = user.getLastName() != null ? user.getLastName().toLowerCase() : "";
                    
                    if (firstName.contains(searchTerm) || lastName.contains(searchTerm)) {
                        user.setId(document.getId());
                        users.add(new UserDto(user));
                    }
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error searching users by name from Firestore", e);
        }
        return users;
    }
}
