package com.example.TeamTrack_backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.FirebaseApp;

@RestController
public class TestFirebaseController {

    @GetMapping("/test-firebase")
    public String testFirebase() {
        try {
            return FirebaseApp.getInstance() != null ? "Firebase connected!" : "Firebase not initialized";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error accessing Firebase: " + e.getMessage();
        }
    }
}