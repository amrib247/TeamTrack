package com.example.TeamTrack_backend;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;

@Configuration
@Order(1)
public class FirebaseInitializer {
    
    private FirebaseApp firebaseApp;
    
    @javax.annotation.PostConstruct
    public void init() {
        try {
            GoogleCredentials credentials = null;
            
            // First try to get credentials from environment variable
            String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
            if (credPath != null && !credPath.isEmpty()) {
                try (FileInputStream serviceAccount = new FileInputStream(credPath)) {
                    credentials = GoogleCredentials.fromStream(serviceAccount);
                } catch (Exception e) {
                    // Continue to next credential source
                }
            }
            
            // If no environment credentials, try to load from classpath
            if (credentials == null) {
                try {
                    ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                    if (resource.exists()) {
                        try (InputStream inputStream = resource.getInputStream()) {
                            credentials = GoogleCredentials.fromStream(inputStream);
                        }
                    }
                } catch (Exception e) {
                    // Continue to next credential source
                }
            }
            
            // If still no credentials, try default application credentials
            if (credentials == null) {
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                } catch (IOException e) {
                    System.err.println("❌ No Firebase credentials found anywhere!");
                    System.err.println("To enable Firebase persistence, either:");
                    System.err.println("1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable");
                    System.err.println("2. Place firebase-config.json in src/main/resources/");
                    System.err.println("3. Configure default application credentials");
                    throw new RuntimeException("Firebase credentials required for database persistence", e);
                }
            }
            
            // Initialize Firebase with the credentials
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
                    
            if (FirebaseApp.getApps().isEmpty()) {
                this.firebaseApp = FirebaseApp.initializeApp(options);
                System.out.println("🎉 Firebase initialized successfully!");
            } else {
                this.firebaseApp = FirebaseApp.getInstance();
            }
            
        } catch (Exception e) {
            System.err.println("❌ Failed to initialize Firebase: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Firebase initialization failed", e);
        }
    }
    
    @Bean
    public FirebaseAuth firebaseAuth() {
        if (firebaseApp == null) {
            throw new RuntimeException("Firebase not initialized yet");
        }
        return FirebaseAuth.getInstance(firebaseApp);
    }
    
    @Bean
    public Firestore firestore() {
        if (firebaseApp == null) {
            throw new RuntimeException("Firebase not initialized yet");
        }
        return FirestoreClient.getFirestore(firebaseApp);
    }
}
