package com.example.TeamTrack_backend.controllers;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.TeamTrack_backend.dto.ChatMessageDto;
import com.example.TeamTrack_backend.dto.ChatMessageRequest;
import com.example.TeamTrack_backend.dto.MarkMessagesReadRequest;
import com.example.TeamTrack_backend.models.ChatRoom;
import com.example.TeamTrack_backend.services.ChatService;
import com.example.TeamTrack_backend.services.UserService;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get team messages with pagination
     */
    @GetMapping("/team/{teamId}/messages")
    public CompletableFuture<ResponseEntity<List<ChatMessageDto>>> getTeamMessages(
            @PathVariable String teamId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        
        return chatService.getTeamMessages(teamId, limit, offset)
                .thenApply(messages -> {
                    return ResponseEntity.ok(messages.stream().map(msg -> new ChatMessageDto(msg, userService)).collect(Collectors.toList()));
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ ChatController: Error retrieving messages: " + throwable.getMessage());
                    return ResponseEntity.<List<ChatMessageDto>>internalServerError().build();
                });
    }
    
    /**
     * Send a new message
     */
    @PostMapping("/team/{teamId}/messages")
    public CompletableFuture<ResponseEntity<ChatMessageDto>> sendMessage(
            @PathVariable String teamId,
            @RequestBody ChatMessageRequest request) {
        
        return chatService.sendMessage(teamId, request)
                .thenApply(message -> {
                    return ResponseEntity.ok(new ChatMessageDto(message, userService));
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ ChatController: Error sending message: " + throwable.getMessage());
                    return ResponseEntity.<ChatMessageDto>internalServerError().build();
                });
    }
    
    /**
     * Mark messages as read
     */
    @PostMapping("/team/{teamId}/messages/read")
    public CompletableFuture<ResponseEntity<Void>> markMessagesAsRead(
            @PathVariable String teamId,
            @RequestBody MarkMessagesReadRequest request) {
        
        return chatService.markMessagesAsRead(teamId, request.getMessageIds(), request.getUserId())
                .thenApply(result -> {
                    return ResponseEntity.ok().<Void>build();
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ ChatController: Error marking messages as read: " + throwable.getMessage());
                    return ResponseEntity.<Void>internalServerError().build();
                });
    }
    
    /**
     * Delete a message
     */
    @DeleteMapping("/messages/{messageId}")
    public CompletableFuture<ResponseEntity<Void>> deleteMessage(
            @PathVariable String messageId,
            @RequestParam String userId) {
        
        return chatService.deleteMessage(messageId, userId)
                .thenApply(result -> ResponseEntity.ok().<Void>build())
                .exceptionally(throwable -> {
                    System.err.println("❌ ChatController: Error deleting message: " + throwable.getMessage());
                    return ResponseEntity.<Void>internalServerError().build();
                });
    }
    
    /**
     * Get chat room information
     */
    @GetMapping("/team/{teamId}/room")
    public CompletableFuture<ResponseEntity<ChatRoom>> getChatRoom(
            @PathVariable String teamId,
            @RequestParam String userId) {
        
        return chatService.getChatRoom(teamId, userId)
                .thenApply(room -> {
                    return ResponseEntity.ok(room);
                })
                .exceptionally(throwable -> {
                    System.err.println("❌ ChatController: Error retrieving chat room: " + throwable.getMessage());
                    return ResponseEntity.<ChatRoom>internalServerError().build();
                });
    }
    
    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Chat controller is working!");
    }
}
