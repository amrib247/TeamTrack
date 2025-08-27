package com.example.TeamTrack_backend.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.TournamentInviteDto;
import com.example.TeamTrack_backend.models.TournamentInvite;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class TournamentInviteService {

    private Firestore getFirestore() {
        try {
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ TournamentInviteService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as other services
            Firestore firestore = FirestoreClient.getFirestore();
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ TournamentInviteService: Failed to get Firestore instance: " + e.getMessage());
            return null;
        }
    }

    public CompletableFuture<TournamentInvite> createTournamentInvite(String teamId, String tournamentId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // Secondary safety check: Verify tournament isn't full before creating invite
                DocumentReference tournamentRef = db.collection("tournaments").document(tournamentId);
                ApiFuture<DocumentSnapshot> tournamentFuture = tournamentRef.get();
                DocumentSnapshot tournamentDoc = tournamentFuture.get();
                
                if (!tournamentDoc.exists()) {
                    throw new RuntimeException("Tournament not found");
                }
                
                Map<String, Object> tournamentData = tournamentDoc.getData();
                Object teamCountObj = tournamentData.get("teamCount");
                Object maxSizeObj = tournamentData.get("maxSize");
                
                Integer currentTeamCount = null;
                Integer maxSize = null;
                
                // Handle different numeric types that Firestore might return
                if (teamCountObj instanceof Long) {
                    currentTeamCount = ((Long) teamCountObj).intValue();
                } else if (teamCountObj instanceof Integer) {
                    currentTeamCount = (Integer) teamCountObj;
                } else if (teamCountObj instanceof Number) {
                    currentTeamCount = ((Number) teamCountObj).intValue();
                }
                
                if (maxSizeObj instanceof Long) {
                    maxSize = ((Long) maxSizeObj).intValue();
                } else if (maxSizeObj instanceof Integer) {
                    maxSize = (Integer) maxSizeObj;
                } else if (maxSizeObj instanceof Number) {
                    maxSize = ((Number) maxSizeObj).intValue();
                }
                
                if (currentTeamCount != null && maxSize != null && currentTeamCount >= maxSize) {
                    throw new RuntimeException("Tournament is already at maximum capacity (" + currentTeamCount + "/" + maxSize + " teams)");
                }
                
                TournamentInvite invite = new TournamentInvite(teamId, tournamentId);
                
                // Create a new document with auto-generated ID
                DocumentReference docRef = db.collection("tournamentInvites").document();
                invite.setId(docRef.getId());
                
                // Convert to Map for Firestore
                Map<String, Object> inviteData = new HashMap<>();
                inviteData.put("id", invite.getId());
                inviteData.put("teamId", invite.getTeamId());
                inviteData.put("tournamentId", invite.getTournamentId());
                inviteData.put("createdAt", invite.getCreatedAt().toString());
                inviteData.put("isActive", invite.isActive());
                
                // Save to Firestore
                ApiFuture<WriteResult> result = docRef.set(inviteData);
                result.get(); // Wait for completion
                
                return invite;
            } catch (Exception e) {
                throw new RuntimeException("Failed to create tournament invite: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<List<TournamentInviteDto>> getTournamentInvitesByTeam(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("isActive", false);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                List<TournamentInviteDto> invites = new ArrayList<>();
                for (QueryDocumentSnapshot document : documents) {
                    Map<String, Object> data = document.getData();
                    TournamentInviteDto invite = new TournamentInviteDto(
                        (String) data.get("id"),
                        (String) data.get("teamId"),
                        (String) data.get("tournamentId"),
                        LocalDateTime.parse((String) data.get("createdAt")),
                        false // All pending invites are inactive
                    );
                    invites.add(invite);
                }
                
                return invites;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get tournament invites for team: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<List<TournamentInviteDto>> getAcceptedTournamentInvitesByTeam(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("isActive", true);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                List<TournamentInviteDto> invites = new ArrayList<>();
                for (QueryDocumentSnapshot document : documents) {
                    Map<String, Object> data = document.getData();
                    TournamentInviteDto invite = new TournamentInviteDto(
                        (String) data.get("id"),
                        (String) data.get("teamId"),
                        (String) data.get("tournamentId"),
                        LocalDateTime.parse((String) data.get("createdAt")),
                        true // All accepted invites are active
                    );
                    invites.add(invite);
                }
                
                return invites;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get accepted tournament invites for team: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<List<TournamentInviteDto>> getTournamentInvitesByTournament(String tournamentId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("tournamentId", tournamentId)
                    .whereEqualTo("isActive", false);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                List<TournamentInviteDto> invites = new ArrayList<>();
                for (QueryDocumentSnapshot document : documents) {
                    Map<String, Object> data = document.getData();
                    TournamentInviteDto invite = new TournamentInviteDto(
                        (String) data.get("id"),
                        (String) data.get("teamId"),
                        (String) data.get("tournamentId"),
                        LocalDateTime.parse((String) data.get("createdAt")),
                        false // All pending invites are inactive
                    );
                    invites.add(invite);
                }
                
                return invites;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get tournament invites for tournament: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<List<TournamentInviteDto>> getAcceptedTournamentInvitesByTournament(String tournamentId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("tournamentId", tournamentId)
                    .whereEqualTo("isActive", true);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                List<TournamentInviteDto> invites = new ArrayList<>();
                for (QueryDocumentSnapshot document : documents) {
                    Map<String, Object> data = document.getData();
                    TournamentInviteDto invite = new TournamentInviteDto(
                        (String) data.get("id"),
                        (String) data.get("teamId"),
                        (String) data.get("tournamentId"),
                        LocalDateTime.parse((String) data.get("createdAt")),
                        true // All accepted invites are active
                    );
                    invites.add(invite);
                }
                
                return invites;
            } catch (Exception e) {
                throw new RuntimeException("Failed to get accepted tournament invites for tournament: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<Void> acceptTournamentInvite(String inviteId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // Get the invite first
                DocumentReference docRef = db.collection("tournamentInvites").document(inviteId);
                ApiFuture<DocumentSnapshot> future = docRef.get();
                DocumentSnapshot document = future.get();
                
                if (!document.exists()) {
                    throw new RuntimeException("Tournament invite not found");
                }
                
                Map<String, Object> data = document.getData();
                String teamId = (String) data.get("teamId");
                String tournamentId = (String) data.get("tournamentId");
                
                // Keep the invite active (mark as accepted) so teams can see their tournaments
                Map<String, Object> updates = new HashMap<>();
                updates.put("isActive", true);
                docRef.update(updates).get();
                
                // Increment the team count in the tournament
                DocumentReference tournamentRef = db.collection("tournaments").document(tournamentId);
                ApiFuture<DocumentSnapshot> tournamentFuture = tournamentRef.get();
                DocumentSnapshot tournamentDoc = tournamentFuture.get();
                
                if (tournamentDoc.exists()) {
                    Map<String, Object> tournamentData = tournamentDoc.getData();
                    Object teamCountObj = tournamentData.get("teamCount");
                    Integer currentTeamCount = null;
                    
                    // Handle different numeric types that Firestore might return
                    if (teamCountObj instanceof Long) {
                        currentTeamCount = ((Long) teamCountObj).intValue();
                    } else if (teamCountObj instanceof Integer) {
                        currentTeamCount = (Integer) teamCountObj;
                    } else if (teamCountObj instanceof Number) {
                        currentTeamCount = ((Number) teamCountObj).intValue();
                    }
                    
                    int newTeamCount = (currentTeamCount != null) ? currentTeamCount + 1 : 1;
                    
                    Map<String, Object> tournamentUpdates = new HashMap<>();
                    tournamentUpdates.put("teamCount", newTeamCount);
                    tournamentRef.update(tournamentUpdates).get();
                }
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to accept tournament invite: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<Void> declineTournamentInvite(String inviteId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                DocumentReference docRef = db.collection("tournamentInvites").document(inviteId);
                // Delete the declined invite from the database
                docRef.delete().get();
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to decline tournament invite: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<Void> deleteTournamentInvite(String inviteId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                db.collection("tournamentInvites").document(inviteId).delete().get();
            } catch (Exception e) {
                throw new RuntimeException("Failed to delete tournament invite: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<Void> cleanupTournamentInvites(String tournamentId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                System.out.println("🗑️ TournamentInviteService: Cleaning up tournament invites for tournament: " + tournamentId);
                
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("tournamentId", tournamentId);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                System.out.println("🔍 TournamentInviteService: Found " + documents.size() + " tournament invites to cleanup");
                
                for (QueryDocumentSnapshot document : documents) {
                    try {
                        document.getReference().delete().get();
                        System.out.println("🗑️ TournamentInviteService: Deleted tournament invite: " + document.getId());
                    } catch (Exception e) {
                        System.err.println("⚠️ TournamentInviteService: Warning - could not delete tournament invite " + document.getId() + ": " + e.getMessage());
                        // Continue with other invites even if one fails
                    }
                }
                
                System.out.println("✅ TournamentInviteService: All tournament invites cleaned up for tournament: " + tournamentId);
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to cleanup tournament invites: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<Boolean> checkExistingInvite(String teamId, String tournamentId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // Check for any existing invite (pending or accepted)
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("tournamentId", tournamentId);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                return !documents.isEmpty();
            } catch (Exception e) {
                throw new RuntimeException("Failed to check existing invite: " + e.getMessage(), e);
            }
        });
    }

    public CompletableFuture<Void> removeTeamFromTournament(String teamId, String tournamentId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore db = getFirestore();
                if (db == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // Find and delete the tournament invite for this team
                Query query = db.collection("tournamentInvites")
                    .whereEqualTo("teamId", teamId)
                    .whereEqualTo("tournamentId", tournamentId);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
                
                if (!documents.isEmpty()) {
                    // Delete the invite
                    documents.get(0).getReference().delete().get();
                    
                    // Decrement the team count in the tournament
                    DocumentReference tournamentRef = db.collection("tournaments").document(tournamentId);
                    ApiFuture<DocumentSnapshot> tournamentFuture = tournamentRef.get();
                    DocumentSnapshot tournamentDoc = tournamentFuture.get();
                    
                    if (tournamentDoc.exists()) {
                        Map<String, Object> tournamentData = tournamentDoc.getData();
                        Object teamCountObj = tournamentData.get("teamCount");
                        Integer currentTeamCount = null;
                        
                        // Handle different numeric types that Firestore might return
                        if (teamCountObj instanceof Long) {
                            currentTeamCount = ((Long) teamCountObj).intValue();
                        } else if (teamCountObj instanceof Integer) {
                            currentTeamCount = (Integer) teamCountObj;
                        } else if (teamCountObj instanceof Number) {
                            currentTeamCount = ((Number) teamCountObj).intValue();
                        }
                        
                        int newTeamCount = Math.max(0, (currentTeamCount != null) ? currentTeamCount - 1 : 0);
                        
                        Map<String, Object> tournamentUpdates = new HashMap<>();
                        tournamentUpdates.put("teamCount", newTeamCount);
                        tournamentRef.update(tournamentUpdates).get();
                    }
                }
                
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove team from tournament: " + e.getMessage(), e);
            }
        });
    }
}
