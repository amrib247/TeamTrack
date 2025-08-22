package com.example.TeamTrack_backend.controllers;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.dto.CreateTaskRequest;
import com.example.TeamTrack_backend.dto.SignupRequest;
import com.example.TeamTrack_backend.dto.TaskUserDto;
import com.example.TeamTrack_backend.models.Task;
import com.example.TeamTrack_backend.services.TaskService;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;

@RestController
@RequestMapping("/tasks")
public class TaskController {
    
    @Autowired
    private TaskService taskService;
    
    /**
     * Create a new task
     */
    @PostMapping
    public CompletableFuture<ResponseEntity<Task>> createTask(@RequestBody CreateTaskRequest request) {
        Task task = new Task(
            request.getTeamId(),
            request.getName(),
            request.getLocation(),
            request.getDescription(),
            request.getDate(),
            request.getStartTime(),
            request.getMaxSignups(),
            request.getMinSignups(),
            request.getCreatedBy()
        );
        return taskService.createTask(task)
            .thenApply(createdTask -> ResponseEntity.ok(createdTask))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Get all tasks for a specific team
     */
    @GetMapping("/team/{teamId}")
    public CompletableFuture<ResponseEntity<List<Task>>> getTasksByTeamId(@PathVariable String teamId) {
        return taskService.getTasksByTeamId(teamId)
            .thenApply(tasks -> ResponseEntity.ok(tasks))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Get a specific task by ID
     */
    @GetMapping("/{taskId}")
    public CompletableFuture<ResponseEntity<Task>> getTaskById(@PathVariable String taskId) {
        return taskService.getTaskById(taskId)
            .thenApply(task -> ResponseEntity.ok(task))
            .exceptionally(throwable -> ResponseEntity.notFound().build());
    }
    
    /**
     * Get all users who have signed up for a specific task with their roles
     */
    @GetMapping("/{taskId}/users")
    public CompletableFuture<ResponseEntity<List<TaskUserDto>>> getTaskUsers(@PathVariable String taskId) {
        return taskService.getTaskUsers(taskId)
            .thenApply(users -> ResponseEntity.ok(users))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Update an existing task
     */
    @PutMapping("/{taskId}")
    public CompletableFuture<ResponseEntity<Task>> updateTask(@PathVariable String taskId, @RequestBody Task taskUpdate) {
        return taskService.updateTask(taskId, taskUpdate)
            .thenApply(updatedTask -> ResponseEntity.ok(updatedTask))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Delete a task
     */
    @DeleteMapping("/{taskId}")
    public CompletableFuture<ResponseEntity<Void>> deleteTask(@PathVariable String taskId) {
        return taskService.deleteTask(taskId)
            .thenApply(v -> ResponseEntity.ok().<Void>build())
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Sign up a user for a task
     */
    @PostMapping("/{taskId}/signup")
    public CompletableFuture<ResponseEntity<Task>> signUpForTask(@PathVariable String taskId, @RequestBody SignupRequest request) {
        return taskService.signUpForTask(taskId, request.getUserId())
            .thenApply(task -> ResponseEntity.ok(task))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Remove a user from a task
     */
    @PostMapping("/{taskId}/remove")
    public CompletableFuture<ResponseEntity<Task>> removeFromTask(@PathVariable String taskId, @RequestBody SignupRequest request) {
        return taskService.removeFromTask(taskId, request.getUserId())
            .thenApply(task -> ResponseEntity.ok(task))
            .exceptionally(throwable -> ResponseEntity.badRequest().build());
    }
    
    /**
     * Clean up old tasks (more than a month old)
     * This endpoint can be called manually or scheduled
     */
    @PostMapping("/cleanup")
    public CompletableFuture<ResponseEntity<String>> cleanupOldTasks() {
        return taskService.cleanupOldTasks()
            .thenApply(deletedCount -> ResponseEntity.ok("Cleanup completed. Deleted " + deletedCount + " old tasks"));
    }
    
    /**
     * Test endpoint to see all tasks for debugging
     */
    @GetMapping("/debug/all")
    public CompletableFuture<ResponseEntity<String>> debugAllTasks() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Firestore firestore = FirestoreClient.getFirestore();
                QuerySnapshot snapshot = firestore.collection("tasks").get().get();
                
                StringBuilder result = new StringBuilder();
                result.append("Total tasks in database: ").append(snapshot.size()).append("\n\n");
                
                for (QueryDocumentSnapshot document : snapshot.getDocuments()) {
                    Task task = document.toObject(Task.class);
                    if (task != null) {
                        result.append("Task ID: ").append(document.getId()).append("\n");
                        result.append("Name: ").append(task.getName()).append("\n");
                        result.append("Team ID: ").append(task.getTeamId()).append("\n");
                        result.append("Date: '").append(task.getDate()).append("'\n");
                        result.append("Time: '").append(task.getStartTime()).append("'\n");
                        result.append("Signups: ").append(task.getCurrentSignups()).append("/").append(task.getMaxSignups()).append("\n");
                        result.append("---\n");
                    }
                }
                
                return ResponseEntity.ok(result.toString());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Error: " + e.getMessage());
            }
        });
    }
}
