package com.example.TeamTrack_backend;

import java.io.FileInputStream;
import java.io.IOException;

import javax.annotation.PostConstruct;

import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@Configuration
public class FirebaseInitializer {

    @PostConstruct
    public void init() throws IOException {
        GoogleCredentials credentials;
        
        // Try to get credentials from environment variable first
        String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        
        if (credPath != null && !credPath.isEmpty()) {
            // Use the environment variable path
            try (FileInputStream serviceAccount = new FileInputStream(credPath)) {
                credentials = GoogleCredentials.fromStream(serviceAccount);
            }
        } else {
            // Fallback to application default credentials
            credentials = GoogleCredentials.getApplicationDefault();
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
    }
}
