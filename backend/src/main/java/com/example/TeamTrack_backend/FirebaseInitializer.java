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
            
            // Check for Firebase environment variables first
            String projectId = System.getenv("FIREBASE_PROJECT_ID");
            String privateKey = System.getenv("FIREBASE_PRIVATE_KEY");
            String clientEmail = System.getenv("FIREBASE_CLIENT_EMAIL");
            
            System.out.println("🔍 Checking Firebase environment variables:");
            System.out.println("FIREBASE_PROJECT_ID: " + (projectId != null ? "✅ Found" : "❌ Missing"));
            System.out.println("FIREBASE_PRIVATE_KEY: " + (privateKey != null ? "✅ Found" : "❌ Missing"));
            System.out.println("FIREBASE_CLIENT_EMAIL: " + (clientEmail != null ? "✅ Found" : "❌ Missing"));
            
            if (projectId != null && privateKey != null && clientEmail != null) {
                try {
                    System.out.println("✅ Creating Firebase credentials from environment variables...");
                    
                    // Create credentials from environment variables
                    String privateKeyId = System.getenv("FIREBASE_PRIVATE_KEY_ID");
                    String clientId = System.getenv("FIREBASE_CLIENT_ID");
                    String authUri = System.getenv("FIREBASE_AUTH_URI");
                    String tokenUri = System.getenv("FIREBASE_TOKEN_URI");
                    String authProviderX509CertUrl = System.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL");
                    String clientX509CertUrl = System.getenv("FIREBASE_CLIENT_X509_CERT_URL");
                    String universeDomain = System.getenv("FIREBASE_UNIVERSE_DOMAIN");
                    
                    // Build JSON credentials string
                    String credentialsJson = String.format("""
                        {
                            "type": "service_account",
                            "project_id": "%s",
                            "private_key_id": "%s",
                            "private_key": "%s",
                            "client_email": "%s",
                            "client_id": "%s",
                            "auth_uri": "%s",
                            "token_uri": "%s",
                            "auth_provider_x509_cert_url": "%s",
                            "client_x509_cert_url": "%s",
                            "universe_domain": "%s"
                        }
                        """, projectId, privateKeyId, privateKey, clientEmail, clientId, 
                             authUri, tokenUri, authProviderX509CertUrl, clientX509CertUrl, universeDomain);
                    
                    credentials = GoogleCredentials.fromStream(
                        new java.io.ByteArrayInputStream(credentialsJson.getBytes())
                    );
                    System.out.println("✅ Successfully created credentials from environment variables!");
                } catch (Exception e) {
                    System.err.println("❌ Failed to create credentials from environment variables: " + e.getMessage());
                }
            }
            
            // If no environment credentials, try to get credentials from environment variable
            if (credentials == null) {
                String credPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
                if (credPath != null && !credPath.isEmpty()) {
                    try (FileInputStream serviceAccount = new FileInputStream(credPath)) {
                        credentials = GoogleCredentials.fromStream(serviceAccount);
                        System.out.println("✅ Loaded credentials from GOOGLE_APPLICATION_CREDENTIALS");
                    } catch (Exception e) {
                        System.err.println("❌ Failed to load credentials from GOOGLE_APPLICATION_CREDENTIALS: " + e.getMessage());
                    }
                }
            }
            
            // If no environment credentials, try to load from classpath
            if (credentials == null) {
                try {
                    ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                    if (resource.exists()) {
                        try (InputStream inputStream = resource.getInputStream()) {
                            credentials = GoogleCredentials.fromStream(inputStream);
                            System.out.println("✅ Loaded credentials from classpath");
                        }
                    }
                } catch (Exception e) {
                    System.err.println("❌ Failed to load credentials from classpath: " + e.getMessage());
                }
            }
            
            // If still no credentials, try default application credentials
            if (credentials == null) {
                try {
                    credentials = GoogleCredentials.getApplicationDefault();
                    System.out.println("✅ Loaded default application credentials");
                } catch (IOException e) {
                    System.err.println("❌ No Firebase credentials found anywhere!");
                    System.err.println("To enable Firebase persistence, either:");
                    System.err.println("1. Set Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.)");
                    System.err.println("2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable");
                    System.err.println("3. Place firebase-service-account.json in src/main/resources/");
                    System.err.println("4. Configure default application credentials");
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
