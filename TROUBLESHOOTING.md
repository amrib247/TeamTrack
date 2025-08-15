# TeamTrack Troubleshooting Guide

## Users Not Saving to Database

**IMPORTANT**: TeamTrack now requires Firebase Firestore for database persistence. Users will NOT be saved without proper Firebase configuration.

### 1. Check if Backend is Running

The backend server must be running for user operations to work.

**Solution**: Run the `run-all.bat` script from the project root directory. This will start both:
- Backend server on http://localhost:8080
- Frontend server on http://localhost:5173

### 2. Firebase Configuration Required

**CRITICAL**: Firebase must be properly configured for database persistence.

**Solution**: Follow the `FIREBASE_SETUP.md` guide to:
1. Create a Firebase project
2. Get service account credentials
3. Configure the backend
4. Set up frontend environment variables

### 3. Test Backend Connection

Once both servers are running, test the connection:

- **Backend Status**: Visit http://localhost:8080/api/auth/status
- **Auth Test**: Visit http://localhost:8080/api/auth/test
- **Firebase Test**: Visit http://localhost:8080/api/test-firebase

### 4. Check Console Logs

Look at the backend console window for Firebase initialization messages. You should see:
```
✅ Firebase credentials loaded from [source]
🎉 Firebase initialized successfully!
📊 Database will use Firebase Firestore for persistence
```

**If you see this instead, Firebase is NOT configured:**
```
❌ No Firebase credentials found anywhere!
💥 CRITICAL: Failed to initialize Firebase
```

### 5. Common Error Messages

- **"Firebase credentials required for database persistence"**: Firebase not configured
- **"Firebase initialization failed"**: Configuration error
- **"Connection refused"**: Backend server not running
- **"Invalid email or password"**: User authentication issue
- **"Email already registered"**: User already exists

### 6. Quick Firebase Setup

**Option A: Environment Variable (Recommended)**
```
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\serviceAccountKey.json
```

**Option B: Classpath Configuration**
1. Download service account JSON from Firebase Console
2. Rename to `firebase-config.json`
3. Place in `backend/src/main/resources/`

### 7. Verify Frontend Connection

Check the browser console for any network errors. The frontend should connect to `http://localhost:8080/api`.

### 8. Restart Everything

If issues persist:
1. Close all terminal windows
2. Ensure Firebase credentials are properly configured
3. Run `run-all.bat` again
4. Wait for both servers to fully start
5. Check for Firebase initialization success message
6. Try registering a user again

## Still Having Issues?

1. **Check `FIREBASE_SETUP.md`** for complete setup instructions
2. **Verify Firebase project** is created and Firestore is enabled
3. **Check service account permissions** in Firebase Console
4. **Review backend console logs** for detailed error messages

## Important Notes

- **In-memory storage is disabled** - Users must be saved to Firebase
- **Service account keys are required** - No fallback to memory storage
- **Firebase project must exist** before starting the application
- **Environment variables must be set** or credentials placed in classpath
