package com.example.TeamTrack_backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simple-chat")
public class SimpleChatController {
    
    public SimpleChatController() {
        System.out.println("💬 SimpleChatController constructor called!");
    }
    
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        System.out.println("✅ SimpleChatController.test called!");
        return ResponseEntity.ok("Simple chat controller is working!");
    }
}
