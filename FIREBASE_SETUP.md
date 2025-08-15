# Firebase Database Setup Guide

## Overview
TeamTrack requires Firebase Firestore for persistent database storage. Users will NOT be saved to the database without proper Firebase configuration.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Firestore Database in your project
4. Set Firestore rules to allow read/write (for development)

## Step 2: Get Service Account Credentials

1. In Firebase Console, go to Project Settings (gear icon)
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file (this is your service account key)

## Step 3: Configure Backend

### Option A: Environment Variable (Recommended)
1. Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS`
2. Value: Full path to your service account JSON file
   ```
   GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\serviceAccountKey.json
   ```

### Option B: Classpath Configuration
1. Rename your downloaded JSON to `firebase-config.json`
2. Place it in `backend/src/main/resources/`
3. Update the JSON with your actual project values

### Option C: Default Application Credentials
1. Use `gcloud auth application-default login`
2. Or configure in Google Cloud Console

## Step 4: Update Frontend Environment Variables

Create `.env` file in `frontend/` directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Step 5: Test Configuration

1. Restart the backend server
2. Check console for: `🎉 Firebase initialized successfully!`
3. Try registering a user - it should now save to Firestore
4. Check Firebase Console to see the saved user

## Troubleshooting

### "Firebase credentials required for database persistence"
- Service account JSON not found or invalid
- Check file path and permissions
- Verify JSON content is correct

### "Firebase initialization failed"
- Check internet connection
- Verify project ID matches
- Ensure Firestore is enabled in Firebase Console

### "Permission denied"
- Check Firestore security rules
- Ensure service account has proper permissions

## Security Notes

- **NEVER commit service account keys to version control**
- Use environment variables in production
- Set up proper Firestore security rules
- Consider using Firebase Auth for additional security

## Verification

After setup, you should see:
```
✅ Firebase credentials loaded from [source]
🎉 Firebase initialized successfully!
📊 Database will use Firebase Firestore for persistence
```

Users will now be permanently saved to your Firebase database! 🎯
