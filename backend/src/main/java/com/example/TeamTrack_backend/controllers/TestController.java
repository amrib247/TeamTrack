package com.example.TeamTrack_backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    public TestController() {
        System.out.println("🎯 TestController constructor called - controller is being instantiated!");
    }
    
    @GetMapping
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Test controller is working!");
    }
    
    @GetMapping("/chat")
    public ResponseEntity<String> chatTest() {
        System.out.println("✅ TestController.chatTest called - testing chat endpoint!");
        return ResponseEntity.ok("Chat test endpoint is working!");
    }
}
