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
        FileInputStream serviceAccount = null;
        try {
            serviceAccount =
                    new FileInputStream("firebase-service-account.json"); // make sure path matches
        } catch (IOException e) {
            e.printStackTrace();
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
    }
}
