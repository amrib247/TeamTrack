package com.example.TeamTrack_backend;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@Configuration
@Order(1) // Ensure this runs before other components
public class FirebaseInitializer {
    
    @javax.annotation.PostConstruct
    public void init() {
        try {
            GoogleCredentials credentials = null;
            
            // First try to get credentials from environment variable
            String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
            if (credPath != null && !credPath.isEmpty()) {
                try (FileInputStream serviceAccount = new FileInputStream(credPath)) {
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                    System.out.println("✅ Firebase credentials loaded from environment variable");
                } catch (Exception e) {
                    System.out.println("⚠️ Failed to load credentials from environment variable: " + e.getMessage());
                }
            }
            
            // If no environment credentials, try to load from classpath
            if (credentials == null) {
                try {
                    ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                    if (resource.exists()) {
                        try (InputStream inputStream = resource.getInputStream()) {
                            credentials = GoogleCredentials.fromStream(inputStream);
                            System.out.println("✅ Firebase credentials loaded from classpath");
                        }
                    } else {
                        System.out.println("⚠️ firebase-service-account.json not found in classpath");
                    }
                } catch (Exception e) {
                    System.out.println("⚠️ Failed to load credentials from classpath: " + e.getMessage());
                }
            }
            
            // If still no credentials, try default application credentials
            if (credentials == null) {
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                    System.out.println("✅ Firebase credentials loaded from default application credentials");
                } catch (IOException e) {
                    System.out.println("❌ No Firebase credentials found anywhere!");
                    System.out.println("To enable Firebase persistence, either:");
                    System.out.println("1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable");
                    System.out.println("2. Place firebase-config.json in src/main/resources/");
                    System.out.println("3. Configure default application credentials");
                    throw new RuntimeException("Firebase credentials required for database persistence", e);
                }
            }
            
            // Initialize Firebase with the credentials
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
                    
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("🎉 Firebase initialized successfully!");
                System.out.println("📊 Database will use Firebase Firestore for persistence");
            } else {
                System.out.println("ℹ️ Firebase already initialized");
            }
            
        } catch (Exception e) {
            System.err.println("💥 CRITICAL: Failed to initialize Firebase: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Firebase initialization failed - application cannot start", e);
        }
    }
}
