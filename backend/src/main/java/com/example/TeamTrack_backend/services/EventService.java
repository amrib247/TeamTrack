package com.example.TeamTrack_backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.models.Event;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;

@Service
public class EventService {
    
    public EventService() {
        System.out.println("🔧 EventService constructor called");
        System.out.println("🔧 EventService constructor completed");
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 EventService: Checking Firebase initialization...");
            System.out.println("🔍 EventService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 EventService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ EventService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as other services
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ EventService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ EventService: Failed to get Firestore instance: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Create a new event for a team
     */
    public CompletableFuture<Event> createEvent(Event event) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 EventService: Creating event: " + event.getName());
                System.out.println("🔍 EventService: Event data: " + event.toString());
                
                // Validate score format if provided
                if (event.getScore() != null && !event.getScore().isEmpty()) {
                    if (!event.getScore().matches("^\\d+-\\d+$")) {
                        throw new IllegalArgumentException("Score must be in format: number-number (e.g., 3-1)");
                    }
                }
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                System.out.println("🔍 EventService: Firestore instance obtained successfully");
                
                DocumentReference docRef = firestore.collection("events").document();
                event.setId(docRef.getId());
                event.setCreatedAt(java.time.LocalDateTime.now().toString());
                event.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                System.out.println("🔍 EventService: Event prepared, saving to Firestore...");
                
                docRef.set(event).get();
                
                System.out.println("✅ EventService: Event created successfully with ID: " + event.getId());
                return event;
                
            } catch (Exception e) {
                System.err.println("❌ EventService: Error creating event: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to create event", e);
            }
        });
    }
    
    /**
     * Get all events for a specific team
     */
    public CompletableFuture<List<Event>> getEventsByTeamId(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 EventService: Getting events for teamId: " + teamId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                System.out.println("🔍 EventService: Firestore instance obtained successfully");
                
                Query query = firestore.collection("events")
                    .whereEqualTo("teamId", teamId);
                
                System.out.println("🔍 EventService: Query built, executing...");
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                QuerySnapshot snapshot = querySnapshot.get();
                
                System.out.println("🔍 EventService: Query executed, found " + snapshot.size() + " documents");
                
                List<Event> events = new ArrayList<>();
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.LocalDateTime oneWeekAgo = now.minusWeeks(1);
                java.time.LocalDateTime oneMonthAgo = now.minusMonths(1);
                List<String> eventsToDelete = new ArrayList<>();
                
                System.out.println("🔍 EventService: Current time: " + now);
                System.out.println("🔍 EventService: One week ago: " + oneWeekAgo);
                System.out.println("🔍 EventService: One month ago: " + oneMonthAgo);
                
                for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                    try {
                        System.out.println("🔍 EventService: Processing document: " + document.getId());
                        Event event = document.toObject(Event.class);
                        if (event != null) {
                            event.setId(document.getId());
                            
                            // Check if event is more than a week old
                            try {
                                System.out.println("🔍 EventService: Raw date: '" + event.getDate() + "', Raw time: '" + event.getStartTime() + "'");
                                
                                // Try different date parsing strategies
                                java.time.LocalDateTime eventDateTime = null;
                                
                                // Strategy 1: Try parsing as "YYYY-MM-DD" + "HH:MM"
                                try {
                                    eventDateTime = java.time.LocalDateTime.parse(event.getDate() + "T" + event.getStartTime());
                                    System.out.println("✅ EventService: Parsed date using strategy 1: " + eventDateTime);
                                } catch (Exception e1) {
                                    System.out.println("⚠️ EventService: Strategy 1 failed: " + e1.getMessage());
                                    
                                    // Strategy 2: Try parsing as "YYYY-MM-DD" + "HH:MM:SS"
                                    try {
                                        eventDateTime = java.time.LocalDateTime.parse(event.getDate() + "T" + event.getStartTime() + ":00");
                                        System.out.println("✅ EventService: Parsed date using strategy 2: " + eventDateTime);
                                    } catch (Exception e2) {
                                        System.out.println("⚠️ EventService: Strategy 2 failed: " + e2.getMessage());
                                        
                                        // Strategy 3: Try parsing just the date
                                        try {
                                            java.time.LocalDate eventDate = java.time.LocalDate.parse(event.getDate());
                                            eventDateTime = eventDate.atStartOfDay();
                                            System.out.println("✅ EventService: Parsed date using strategy 3 (date only): " + eventDateTime);
                                        } catch (Exception e3) {
                                            System.out.println("⚠️ EventService: Strategy 3 failed: " + e3.getMessage());
                                            throw new Exception("All date parsing strategies failed");
                                        }
                                    }
                                }
                                
                                // Now check the age of the event
                                if (eventDateTime.isAfter(oneWeekAgo)) {
                                    events.add(event);
                                    System.out.println("🔍 EventService: Event added (≤1 week old): " + event.getName() + " (Date: " + event.getDate() + " " + event.getStartTime() + ")");
                                } else if (eventDateTime.isAfter(oneMonthAgo)) {
                                    System.out.println("🔍 EventService: Event filtered out (1 week - 1 month old): " + event.getName() + " (Date: " + event.getDate() + " " + event.getStartTime() + ")");
                                } else {
                                    // Event is more than a month old, mark for deletion
                                    eventsToDelete.add(document.getId());
                                    System.out.println("🗑️ EventService: Event marked for deletion (>1 month old): " + event.getName() + " (Date: " + event.getDate() + " " + event.getStartTime() + ")");
                                }
                            } catch (Exception dateParseError) {
                                System.err.println("❌ EventService: All date parsing strategies failed for event " + event.getName() + ": " + dateParseError.getMessage());
                                System.err.println("❌ EventService: Raw date: '" + event.getDate() + "', Raw time: '" + event.getStartTime() + "'");
                                // If we can't parse the date, include the event to be safe
                                events.add(event);
                            }
                        } else {
                            System.err.println("❌ EventService: Document " + document.getId() + " could not be converted to Event object");
                        }
                    } catch (Exception docError) {
                        System.err.println("❌ EventService: Error processing document " + document.getId() + ": " + docError.getMessage());
                        docError.printStackTrace();
                    }
                }
                
                // Delete old events
                if (!eventsToDelete.isEmpty()) {
                    System.out.println("🗑️ EventService: Deleting " + eventsToDelete.size() + " old events...");
                    for (String eventId : eventsToDelete) {
                        try {
                            firestore.collection("events").document(eventId).delete().get();
                            System.out.println("✅ EventService: Deleted old event with ID: " + eventId);
                        } catch (Exception deleteError) {
                            System.err.println("❌ EventService: Failed to delete old event " + eventId + ": " + deleteError.getMessage());
                        }
                    }
                }
                
                // Sort events manually by date and time (most recent first)
                events.sort((e1, e2) -> {
                    try {
                        java.time.LocalDateTime dateTime1 = java.time.LocalDateTime.parse(e1.getDate() + "T" + e1.getStartTime());
                        java.time.LocalDateTime dateTime2 = java.time.LocalDateTime.parse(e2.getDate() + "T" + e2.getStartTime());
                        return dateTime2.compareTo(dateTime1); // Descending order (newest first)
                    } catch (Exception e) {
                        // If parsing fails, keep original order
                        return 0;
                    }
                });
                
                System.out.println("✅ EventService: Successfully processed " + events.size() + " events (filtered from " + snapshot.size() + " total)");
                return events;
                
            } catch (Exception e) {
                System.err.println("❌ EventService: Error getting events for team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get events", e);
            }
        });
    }
    
    /**
     * Get a specific event by ID
     */
    public CompletableFuture<Event> getEventById(String eventId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                DocumentSnapshot document = firestore.collection("events").document(eventId).get().get();
                if (document.exists()) {
                    Event event = document.toObject(Event.class);
                    if (event != null) {
                        event.setId(document.getId());
                        return event;
                    }
                }
                throw new RuntimeException("Event not found");
            } catch (Exception e) {
                System.err.println("Error getting event: " + e.getMessage());
                throw new RuntimeException("Failed to get event", e);
            }
        });
    }
    
    /**
     * Update an existing event
     */
    public CompletableFuture<Event> updateEvent(String eventId, Event eventUpdate) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate score format if provided
                if (eventUpdate.getScore() != null && !eventUpdate.getScore().isEmpty()) {
                    if (!eventUpdate.getScore().matches("^\\d+-\\d+$")) {
                        throw new IllegalArgumentException("Score must be in format: number-number (e.g., 3-1)");
                    }
                }
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                DocumentReference docRef = firestore.collection("events").document(eventId);
                eventUpdate.setId(eventId);
                eventUpdate.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                docRef.set(eventUpdate, SetOptions.merge()).get();
                return eventUpdate;
            } catch (Exception e) {
                System.err.println("Error updating event: " + e.getMessage());
                throw new RuntimeException("Failed to update event", e);
            }
        });
    }
    
    /**
     * Delete an event
     */
    public CompletableFuture<Void> deleteEvent(String eventId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                firestore.collection("events").document(eventId).delete().get();
            } catch (Exception e) {
                System.err.println("Error deleting event: " + e.getMessage());
                throw new RuntimeException("Failed to delete event", e);
            }
        });
    }
    
    /**
     * Clean up old events (more than a month old) for all teams
     */
    public CompletableFuture<Integer> cleanupOldEvents() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🧹 EventService: Starting cleanup of old events...");
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                java.time.LocalDateTime oneMonthAgo = java.time.LocalDateTime.now().minusMonths(1);
                int deletedCount = 0;
                
                // Get all events
                Query query = firestore.collection("events")
                    .orderBy("date", Query.Direction.DESCENDING);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                QuerySnapshot snapshot = querySnapshot.get();
                
                System.out.println("🧹 EventService: Found " + snapshot.size() + " total events to check");
                
                for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                    try {
                        Event event = document.toObject(Event.class);
                        if (event != null) {
                            try {
                                java.time.LocalDateTime eventDateTime = java.time.LocalDateTime.parse(event.getDate() + "T" + event.getStartTime());
                                if (eventDateTime.isBefore(oneMonthAgo)) {
                                    // Event is more than a month old, delete it
                                    firestore.collection("events").document(document.getId()).delete().get();
                                    deletedCount++;
                                    System.out.println("🗑️ EventService: Deleted old event: " + event.getName() + " (Date: " + event.getDate() + " " + event.getStartTime() + ")");
                                }
                            } catch (Exception dateParseError) {
                                System.err.println("❌ EventService: Error parsing date for event " + event.getName() + ": " + dateParseError.getMessage());
                            }
                        }
                    } catch (Exception docError) {
                        System.err.println("❌ EventService: Error processing document " + document.getId() + ": " + docError.getMessage());
                    }
                }
                
                System.out.println("✅ EventService: Cleanup completed. Deleted " + deletedCount + " old events");
                return deletedCount;
                
            } catch (Exception e) {
                System.err.println("❌ EventService: Error during cleanup: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to cleanup old events", e);
            }
        });
    }
    
    /**
     * Get events for a team within a date range
     */
    public CompletableFuture<List<Event>> getEventsByDateRange(String teamId, String startDate, String endDate) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Query query = firestore.collection("events")
                    .whereEqualTo("teamId", teamId)
                    .whereGreaterThanOrEqualTo("date", startDate)
                    .whereLessThanOrEqualTo("date", endDate)
                    .orderBy("date", Query.Direction.DESCENDING)
                    .orderBy("startTime", Query.Direction.DESCENDING);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                List<Event> events = new ArrayList<>();
                
                for (QueryDocumentSnapshot document : querySnapshot.get().getDocuments()) {
                    Event event = document.toObject(Event.class);
                    if (event != null) {
                        event.setId(document.getId());
                        events.add(event);
                    }
                }
                
                return events;
            } catch (Exception e) {
                System.err.println("Error getting events by date range: " + e.getMessage());
                throw new RuntimeException("Failed to get events by date range", e);
            }
        });
    }
}
