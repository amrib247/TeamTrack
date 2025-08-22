package com.example.TeamTrack_backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;

import com.example.TeamTrack_backend.dto.TaskUserDto;
import com.example.TeamTrack_backend.models.Task;
import com.example.TeamTrack_backend.models.UserProfile;
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
public class TaskService {
    
    public TaskService() {
        System.out.println("🔧 TaskService constructor called");
        System.out.println("🔧 TaskService constructor completed");
    }
    
    private Firestore getFirestore() {
        try {
            System.out.println("🔍 TaskService: Checking Firebase initialization...");
            System.out.println("🔍 TaskService: FirebaseApp.getApps().isEmpty(): " + FirebaseApp.getApps().isEmpty());
            System.out.println("🔍 TaskService: FirebaseApp.getApps().size(): " + FirebaseApp.getApps().size());
            
            // Check if Firebase is initialized
            if (FirebaseApp.getApps().isEmpty()) {
                System.err.println("❌ TaskService: Firebase not initialized");
                return null;
            }
            
            // Use the same approach as other services
            Firestore firestore = FirestoreClient.getFirestore();
            System.out.println("✅ TaskService: Got Firestore from FirestoreClient: " + firestore);
            return firestore;
            
        } catch (Exception e) {
            System.err.println("❌ TaskService: Failed to get Firestore instance: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Create a new task for a team
     */
    public CompletableFuture<Task> createTask(Task task) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 TaskService: Creating task: " + task.getName());
                System.out.println("🔍 TaskService: Task data: " + task.toString());
                
                // Validate signup limits
                if (task.getMinSignups() > task.getMaxSignups()) {
                    throw new IllegalArgumentException("Minimum signups cannot exceed maximum signups");
                }
                
                if (task.getMinSignups() < 0 || task.getMaxSignups() < 1) {
                    throw new IllegalArgumentException("Invalid signup limits");
                }
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                System.out.println("🔍 TaskService: Firestore instance obtained successfully");
                
                DocumentReference docRef = firestore.collection("tasks").document();
                task.setId(docRef.getId());
                task.setCreatedAt(java.time.LocalDateTime.now().toString());
                task.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                System.out.println("🔍 TaskService: Task prepared, saving to Firestore...");
                
                docRef.set(task).get();
                
                System.out.println("✅ TaskService: Task created successfully with ID: " + task.getId());
                return task;
                
            } catch (Exception e) {
                System.err.println("❌ TaskService: Error creating task: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to create task", e);
            }
        });
    }
    
    /**
     * Get all tasks for a specific team
     */
    public CompletableFuture<List<Task>> getTasksByTeamId(String teamId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🔍 TaskService: Getting tasks for teamId: " + teamId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                System.out.println("🔍 TaskService: Firestore instance obtained successfully");
                
                Query query = firestore.collection("tasks")
                    .whereEqualTo("teamId", teamId);
                
                System.out.println("🔍 TaskService: Query built, executing...");
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                QuerySnapshot snapshot = querySnapshot.get();
                
                System.out.println("🔍 TaskService: Query executed, found " + snapshot.size() + " documents");
                
                List<Task> tasks = new ArrayList<>();
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.LocalDateTime oneWeekAgo = now.minusWeeks(1);
                java.time.LocalDateTime oneMonthAgo = now.minusMonths(1);
                List<String> tasksToDelete = new ArrayList<>();
                
                System.out.println("🔍 TaskService: Current time: " + now);
                System.out.println("🔍 TaskService: One week ago: " + oneWeekAgo);
                System.out.println("🔍 TaskService: One month ago: " + oneMonthAgo);
                
                for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                    try {
                        System.out.println("🔍 TaskService: Processing document: " + document.getId());
                        Task task = document.toObject(Task.class);
                        if (task != null) {
                            task.setId(document.getId());
                            
                            // Check if task is more than a week old
                            try {
                                System.out.println("🔍 TaskService: Raw date: '" + task.getDate() + "', Raw time: '" + task.getStartTime() + "'");
                                
                                // Try different date parsing strategies
                                java.time.LocalDateTime taskDateTime = null;
                                
                                // Strategy 1: Try parsing as "YYYY-MM-DD" + "HH:MM"
                                try {
                                    taskDateTime = java.time.LocalDateTime.parse(task.getDate() + "T" + task.getStartTime());
                                    System.out.println("✅ TaskService: Parsed date using strategy 1: " + taskDateTime);
                                } catch (Exception e1) {
                                    System.out.println("⚠️ TaskService: Strategy 1 failed: " + e1.getMessage());
                                    
                                    // Strategy 2: Try parsing as "YYYY-MM-DD" + "HH:MM:SS"
                                    try {
                                        taskDateTime = java.time.LocalDateTime.parse(task.getDate() + "T" + task.getStartTime() + ":00");
                                        System.out.println("✅ TaskService: Parsed date using strategy 2: " + taskDateTime);
                                    } catch (Exception e2) {
                                        System.out.println("⚠️ TaskService: Strategy 2 failed: " + e2.getMessage());
                                        
                                        // Strategy 3: Try parsing just the date
                                        try {
                                            java.time.LocalDate taskDate = java.time.LocalDate.parse(task.getDate());
                                            taskDateTime = taskDate.atStartOfDay();
                                            System.out.println("✅ TaskService: Parsed date using strategy 3 (date only): " + taskDateTime);
                                        } catch (Exception e3) {
                                            System.out.println("⚠️ TaskService: Strategy 3 failed: " + e3.getMessage());
                                            throw new Exception("All date parsing strategies failed");
                                        }
                                    }
                                }
                                
                                // Now check the age of the task
                                if (taskDateTime.isAfter(oneWeekAgo)) {
                                    tasks.add(task);
                                    System.out.println("🔍 TaskService: Task added (≤1 week old): " + task.getName() + " (Date: " + task.getDate() + " " + task.getStartTime() + ")");
                                } else if (taskDateTime.isAfter(oneMonthAgo)) {
                                    System.out.println("🔍 TaskService: Task filtered out (1 week - 1 month old): " + task.getName() + " (Date: " + task.getDate() + " " + task.getStartTime() + ")");
                                } else {
                                    // Task is more than a month old, mark for deletion
                                    tasksToDelete.add(document.getId());
                                    System.out.println("🗑️ TaskService: Task marked for deletion (>1 month old): " + task.getName() + " (Date: " + task.getDate() + " " + task.getStartTime() + ")");
                                }
                            } catch (Exception dateParseError) {
                                System.err.println("❌ TaskService: All date parsing strategies failed for task " + task.getName() + ": " + dateParseError.getMessage());
                                System.err.println("❌ TaskService: Raw date: '" + task.getDate() + "', Raw time: '" + task.getStartTime() + "'");
                                // If we can't parse the date, include the task to be safe
                                tasks.add(task);
                            }
                        } else {
                            System.err.println("❌ TaskService: Document " + document.getId() + " could not be converted to Task object");
                        }
                    } catch (Exception docError) {
                        System.err.println("❌ TaskService: Error processing document " + document.getId() + ": " + docError.getMessage());
                        docError.printStackTrace();
                    }
                }
                
                // Delete old tasks
                if (!tasksToDelete.isEmpty()) {
                    System.out.println("🗑️ TaskService: Deleting " + tasksToDelete.size() + " old tasks...");
                    for (String taskId : tasksToDelete) {
                        try {
                            firestore.collection("tasks").document(taskId).delete().get();
                            System.out.println("✅ TaskService: Deleted old task with ID: " + taskId);
                        } catch (Exception deleteError) {
                            System.err.println("❌ TaskService: Failed to delete old task " + taskId + ": " + deleteError.getMessage());
                        }
                    }
                }
                
                // Sort tasks manually by date and time (most recent first)
                tasks.sort((t1, t2) -> {
                    try {
                        java.time.LocalDateTime dateTime1 = java.time.LocalDateTime.parse(t1.getDate() + "T" + t1.getStartTime());
                        java.time.LocalDateTime dateTime2 = java.time.LocalDateTime.parse(t2.getDate() + "T" + t2.getStartTime());
                        return dateTime2.compareTo(dateTime1); // Descending order (newest first)
                    } catch (Exception e) {
                        // If parsing fails, keep original order
                        return 0;
                    }
                });
                
                System.out.println("✅ TaskService: Successfully processed " + tasks.size() + " tasks (filtered from " + snapshot.size() + " total)");
                return tasks;
                
            } catch (Exception e) {
                System.err.println("❌ TaskService: Error getting tasks for team: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get tasks", e);
            }
        });
    }
    
    /**
     * Get a specific task by ID
     */
    public CompletableFuture<Task> getTaskById(String taskId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                DocumentSnapshot document = firestore.collection("tasks").document(taskId).get().get();
                if (document.exists()) {
                    Task task = document.toObject(Task.class);
                    if (task != null) {
                        task.setId(document.getId());
                        return task;
                    }
                }
                throw new RuntimeException("Task not found");
            } catch (Exception e) {
                System.err.println("Error getting task: " + e.getMessage());
                throw new RuntimeException("Failed to get task", e);
            }
        });
    }
    
    /**
     * Update an existing task
     */
    public CompletableFuture<Task> updateTask(String taskId, Task taskUpdate) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate signup limits
                if (taskUpdate.getMinSignups() > taskUpdate.getMaxSignups()) {
                    throw new IllegalArgumentException("Minimum signups cannot exceed maximum signups");
                }
                
                if (taskUpdate.getMinSignups() < 0 || taskUpdate.getMaxSignups() < 1) {
                    throw new IllegalArgumentException("Invalid signup limits");
                }
                
                // Ensure max signups is not less than current signups
                Task currentTask = getTaskById(taskId).get();
                if (taskUpdate.getMaxSignups() < currentTask.getCurrentSignups()) {
                    throw new IllegalArgumentException("Maximum signups cannot be less than current signups");
                }
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                DocumentReference docRef = firestore.collection("tasks").document(taskId);
                taskUpdate.setId(taskId);
                taskUpdate.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                docRef.set(taskUpdate, SetOptions.merge()).get();
                return taskUpdate;
            } catch (Exception e) {
                System.err.println("Error updating task: " + e.getMessage());
                throw new RuntimeException("Failed to update task", e);
            }
        });
    }
    
    /**
     * Delete a task
     */
    public CompletableFuture<Void> deleteTask(String taskId) {
        return CompletableFuture.runAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                firestore.collection("tasks").document(taskId).delete().get();
            } catch (Exception e) {
                System.err.println("Error deleting task: " + e.getMessage());
                throw new RuntimeException("Failed to delete task", e);
            }
        });
    }
    
    /**
     * Sign up a user for a task
     */
    public CompletableFuture<Task> signUpForTask(String taskId, String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Task task = getTaskById(taskId).get();
                if (task == null) {
                    throw new RuntimeException("Task not found");
                }
                
                if (task.isFull()) {
                    throw new RuntimeException("Task is already full");
                }
                
                if (task.isUserSignedUp(userId)) {
                    throw new RuntimeException("User is already signed up for this task");
                }
                
                // Add user to signups
                task.getSignedUpUserIds().add(userId);
                task.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                // Update the task in Firestore
                DocumentReference docRef = firestore.collection("tasks").document(taskId);
                docRef.set(task, SetOptions.merge()).get();
                
                return task;
            } catch (Exception e) {
                System.err.println("Error signing up for task: " + e.getMessage());
                throw new RuntimeException("Failed to sign up for task", e);
            }
        });
    }
    
    /**
     * Remove a user from a task
     */
    public CompletableFuture<Task> removeFromTask(String taskId, String userId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                Task task = getTaskById(taskId).get();
                if (task == null) {
                    throw new RuntimeException("Task not found");
                }
                
                if (!task.isUserSignedUp(userId)) {
                    throw new RuntimeException("User is not signed up for this task");
                }
                
                // Remove user from signups
                task.getSignedUpUserIds().remove(userId);
                task.setUpdatedAt(java.time.LocalDateTime.now().toString());
                
                // Update the task in Firestore
                DocumentReference docRef = firestore.collection("tasks").document(taskId);
                docRef.set(task, SetOptions.merge()).get();
                
                return task;
            } catch (Exception e) {
                System.err.println("Error removing user from task: " + e.getMessage());
                throw new RuntimeException("Failed to remove user from task", e);
            }
        });
    }
    
    /**
     * Clean up old tasks (more than a month old) for all teams
     */
    public CompletableFuture<Integer> cleanupOldTasks() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("🧹 TaskService: Starting cleanup of old tasks...");
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                java.time.LocalDateTime oneMonthAgo = java.time.LocalDateTime.now().minusMonths(1);
                int deletedCount = 0;
                
                // Get all tasks
                Query query = firestore.collection("tasks")
                    .orderBy("date", Query.Direction.DESCENDING);
                
                ApiFuture<QuerySnapshot> querySnapshot = query.get();
                QuerySnapshot snapshot = querySnapshot.get();
                
                System.out.println("🧹 TaskService: Found " + snapshot.size() + " total tasks to check");
                
                for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                    try {
                        Task task = document.toObject(Task.class);
                        if (task != null) {
                            try {
                                java.time.LocalDateTime taskDateTime = java.time.LocalDateTime.parse(task.getDate() + "T" + task.getStartTime());
                                if (taskDateTime.isBefore(oneMonthAgo)) {
                                    // Task is more than a month old, delete it
                                    firestore.collection("tasks").document(document.getId()).delete().get();
                                    deletedCount++;
                                    System.out.println("🗑️ TaskService: Deleted old task: " + task.getName() + " (Date: " + task.getDate() + " " + task.getStartTime() + ")");
                                }
                            } catch (Exception dateParseError) {
                                System.err.println("❌ TaskService: Error parsing date for task " + task.getName() + ": " + dateParseError.getMessage());
                            }
                        }
                    } catch (Exception docError) {
                        System.err.println("❌ TaskService: Error processing document " + document.getId() + ": " + docError.getMessage());
                    }
                }
                
                System.out.println("✅ TaskService: Cleanup completed. Deleted " + deletedCount + " old tasks");
                return deletedCount;
                
            } catch (Exception e) {
                System.err.println("❌ TaskService: Error during cleanup: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to cleanup old tasks", e);
            }
        });
    }
    
    /**
     * Get all users who have signed up for a specific task with their roles
     */
    public CompletableFuture<List<TaskUserDto>> getTaskUsers(String taskId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("👥 TaskService: Getting users for task: " + taskId);
                
                Firestore firestore = getFirestore();
                if (firestore == null) {
                    throw new RuntimeException("Firebase Firestore not available");
                }
                
                // First get the task to get the signed up user IDs
                Task task = getTaskById(taskId).get();
                if (task == null) {
                    throw new RuntimeException("Task not found");
                }
                
                List<TaskUserDto> taskUsers = new ArrayList<>();
                
                if (task.getSignedUpUserIds() == null || task.getSignedUpUserIds().isEmpty()) {
                    System.out.println("👥 TaskService: No users signed up for this task");
                    return taskUsers;
                }
                
                System.out.println("👥 TaskService: Found " + task.getSignedUpUserIds().size() + " signed up users");
                
                // Get each user's details and their role in the team
                for (String userId : task.getSignedUpUserIds()) {
                    try {
                        // Get user profile
                        DocumentSnapshot userDoc = firestore.collection("userProfiles").document(userId).get().get();
                        if (userDoc.exists()) {
                            UserProfile userProfile = userDoc.toObject(UserProfile.class);
                            if (userProfile != null) {
                                // Get user's role in the team
                                Query userTeamQuery = firestore.collection("userTeams")
                                    .whereEqualTo("userId", userId)
                                    .whereEqualTo("teamId", task.getTeamId());
                                
                                QuerySnapshot userTeamSnapshot = userTeamQuery.get().get();
                                String role = "UNKNOWN";
                                
                                if (!userTeamSnapshot.isEmpty()) {
                                    // Get the first (should be only) user-team relationship
                                    var userTeamDoc = userTeamSnapshot.getDocuments().get(0);
                                    role = (String) userTeamDoc.get("role");
                                }
                                
                                TaskUserDto taskUser = new TaskUserDto(
                                    userId,
                                    userProfile.getFirstName(),
                                    userProfile.getLastName(),
                                    userProfile.getEmail(),
                                    role
                                );
                                
                                taskUsers.add(taskUser);
                                System.out.println("👥 TaskService: Added user: " + taskUser.getFullName() + " (" + role + ")");
                            }
                        } else {
                            System.err.println("❌ TaskService: User profile not found for userId: " + userId);
                        }
                    } catch (Exception e) {
                        System.err.println("❌ TaskService: Error getting user details for userId " + userId + ": " + e.getMessage());
                    }
                }
                
                // Sort users by role (coaches first) then by name
                taskUsers.sort((u1, u2) -> {
                    // Coaches first
                    if (u1.getRole().equals("COACH") && !u2.getRole().equals("COACH")) {
                        return -1;
                    }
                    if (!u1.getRole().equals("COACH") && u2.getRole().equals("COACH")) {
                        return 1;
                    }
                    // Then sort by full name
                    return u1.getFullName().compareToIgnoreCase(u2.getFullName());
                });
                
                System.out.println("✅ TaskService: Successfully retrieved " + taskUsers.size() + " users for task");
                return taskUsers;
                
            } catch (Exception e) {
                System.err.println("❌ TaskService: Error getting task users: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Failed to get task users", e);
            }
        });
    }
}
