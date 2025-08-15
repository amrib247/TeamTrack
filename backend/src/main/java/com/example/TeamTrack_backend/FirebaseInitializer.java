package com.example.TeamTrack_backend;

import java.io.FileInputStream;
import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@Configuration
@Order(1) // Ensure this runs before other components
public class FirebaseInitializer {
    
    @javax.annotation.PostConstruct
    public void init() {
        try {
            GoogleCredentials credentials;
            String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
            
            if (credPath != null && !credPath.isEmpty()) {
                try (FileInputStream serviceAccount = new FileInputStream(credPath)) {
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                }
            } else {
                // Try to get default credentials, but don't fail if they're not available
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                } catch (IOException e) {
                    System.out.println("Firebase credentials not found. Application will run with in-memory storage.");
                    System.out.println("To enable Firebase persistence, set GOOGLE_APPLICATION_CREDENTIALS environment variable.");
                    return; // Exit gracefully without initializing Firebase
                }
            }
            
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
                    
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase initialized successfully!");
            }
        } catch (Exception e) {
            System.out.println("Failed to initialize Firebase: " + e.getMessage());
            System.out.println("Application will run with in-memory storage.");
            // Don't throw the exception - let the application continue with in-memory storage
        }
    }
}
