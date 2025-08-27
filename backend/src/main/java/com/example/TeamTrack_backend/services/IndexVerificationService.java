package com.example.TeamTrack_backend.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class IndexVerificationService {

    private final Firestore firestore;

    public IndexVerificationService() {
        this.firestore = FirestoreClient.getFirestore();
    }

    /**
     * Verify that all expected indices are working properly
     */
    public CompletableFuture<Map<String, Object>> verifyAllIndices() {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> results = new HashMap<>();
            LocalDateTime startTime = LocalDateTime.now();
            
            try {
                // Test UserTeams indices
                results.put("userTeams_userId_teamId", testUserTeamsUserIdTeamIdIndex());
                results.put("userTeams_teamId_role", testUserTeamsTeamIdRoleIndex());
                results.put("userTeams_userId_isActive", testUserTeamsUserIdIsActiveIndex());
                
                // Test TournamentInvites indices
                results.put("tournamentInvites_teamId_isActive", testTournamentInvitesTeamIdIsActiveIndex());
                results.put("tournamentInvites_tournamentId_isActive", testTournamentInvitesTournamentIdIsActiveIndex());
                
                // Test Tasks indices
                results.put("tasks_teamId_date", testTasksTeamIdDateIndex());
                results.put("tasks_teamId_assignedUserId", testTasksTeamIdAssignedUserIdIndex());
                
                // Test Events indices
                results.put("events_teamId_date", testEventsTeamIdDateIndex());
                results.put("events_teamId_eventType", testEventsTeamIdEventTypeIndex());
                
                // Test Teams indices
                results.put("teams_createdByUserId_isActive", testTeamsCreatedByUserIdIsActiveIndex());
                results.put("teams_sport_ageGroup", testTeamsSportAgeGroupIndex());
                
                // Test Chat indices
                results.put("chatMessages_chatRoomId_timestamp", testChatMessagesChatRoomIdTimestampIndex());
                
                LocalDateTime endTime = LocalDateTime.now();
                long totalDuration = java.time.Duration.between(startTime, endTime).toMillis();
                
                results.put("totalExecutionTime", totalDuration + "ms");
                results.put("verificationTimestamp", endTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                results.put("status", "completed");
                
            } catch (Exception e) {
                results.put("status", "error");
                results.put("error", e.getMessage());
                results.put("verificationTimestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            
            return results;
        });
    }

    /**
     * Test UserTeams index: userId + teamId
     */
    private Map<String, Object> testUserTeamsUserIdTeamIdIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("userTeams")
                .whereEqualTo("userId", "test_user_id")
                .whereEqualTo("teamId", "test_team_id");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            // Performance indicator: should be under 100ms for indexed queries
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test UserTeams index: teamId + role
     */
    private Map<String, Object> testUserTeamsTeamIdRoleIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("userTeams")
                .whereEqualTo("teamId", "test_team_id")
                .whereEqualTo("role", "coach");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test UserTeams index: userId + isActive
     */
    private Map<String, Object> testUserTeamsUserIdIsActiveIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("userTeams")
                .whereEqualTo("userId", "test_user_id")
                .whereEqualTo("isActive", true);
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test TournamentInvites index: teamId + isActive
     */
    private Map<String, Object> testTournamentInvitesTeamIdIsActiveIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("tournamentInvites")
                .whereEqualTo("teamId", "test_team_id")
                .whereEqualTo("isActive", false);
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test TournamentInvites index: tournamentId + isActive
     */
    private Map<String, Object> testTournamentInvitesTournamentIdIsActiveIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("tournamentInvites")
                .whereEqualTo("tournamentId", "test_tournament_id")
                .whereEqualTo("isActive", false);
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test Tasks index: teamId + date
     */
    private Map<String, Object> testTasksTeamIdDateIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("tasks")
                .whereEqualTo("teamId", "test_team_id")
                .whereGreaterThan("date", "2024-01-01");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test Tasks index: teamId + assignedUserId
     */
    private Map<String, Object> testTasksTeamIdAssignedUserIdIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("tasks")
                .whereEqualTo("teamId", "test_team_id")
                .whereEqualTo("assignedUserId", "test_user_id");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test Events index: teamId + date
     */
    private Map<String, Object> testEventsTeamIdDateIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("events")
                .whereEqualTo("teamId", "test_team_id")
                .whereGreaterThan("date", "2024-01-01");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test Events index: teamId + eventType
     */
    private Map<String, Object> testEventsTeamIdEventTypeIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("events")
                .whereEqualTo("teamId", "test_team_id")
                .whereEqualTo("eventType", "practice");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test Teams index: createdByUserId + isActive
     */
    private Map<String, Object> testTeamsCreatedByUserIdIsActiveIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("teams")
                .whereEqualTo("createdByUserId", "test_user_id")
                .whereEqualTo("isActive", true);
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test Teams index: sport + ageGroup
     */
    private Map<String, Object> testTeamsSportAgeGroupIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("teams")
                .whereEqualTo("sport", "soccer")
                .whereEqualTo("ageGroup", "U16");
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }

    /**
     * Test ChatMessages index: chatRoomId + timestamp
     */
    private Map<String, Object> testChatMessagesChatRoomIdTimestampIndex() {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        try {
            Query query = firestore.collection("chatMessages")
                .whereEqualTo("chatRoomId", "test_chat_room_id")
                .orderBy("timestamp", com.google.cloud.firestore.Query.Direction.DESCENDING)
                .limit(50);
            
            ApiFuture<QuerySnapshot> future = query.get();
            QuerySnapshot snapshot = future.get();
            
            long duration = System.currentTimeMillis() - startTime;
            result.put("duration", duration + "ms");
            result.put("documentCount", snapshot.size());
            result.put("status", "success");
            
            if (duration < 100) {
                result.put("performance", "excellent");
            } else if (duration < 300) {
                result.put("performance", "good");
            } else {
                result.put("performance", "needs_optimization");
            }
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
            result.put("duration", "N/A");
        }
        
        return result;
    }
}
