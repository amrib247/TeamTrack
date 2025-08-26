# TeamTrack

## Project Overview

TeamTrack is a comprehensive team management and tournament organization platform designed for sports teams, coaches, and organizers. The application provides a modern, user-friendly interface for managing team activities, scheduling events, organizing tournaments, and facilitating communication between team members.

### Key Features

- **User Authentication & Management**: Secure Firebase-based authentication system with role-based access control
- **Team Management**: Create, manage, and organize teams with customizable roles and permissions
- **Tournament Organization**: Plan and manage tournaments with bracket systems and scheduling
- **Event Scheduling**: Coordinate team events, practices, and games with availability tracking
- **Task Management**: Assign and track tasks with deadlines and status updates
- **Real-time Chat**: Team communication through integrated chat system with file sharing
- **Availability Tracking**: Monitor team member availability for events and practices
- **File Management**: Upload and share documents, images, and other files within teams
- **Responsive Design**: Mobile-friendly interface that works across all devices

## Dependencies, Tools, and Languages

### Backend (Java/Spring Boot)
- **Java 17+** - Core programming language
- **Spring Boot 3.x** - Application framework
- **Spring Security** - Authentication and authorization
- **Spring Data JPA** - Database access layer
- **Gradle** - Build automation and dependency management
- **H2 Database** - In-memory database for development
- **Firebase Admin SDK** - Firebase integration for authentication

### Frontend (React/TypeScript)
- **React 18** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Firebase SDK** - Client-side Firebase integration
- **CSS3** - Styling with modern CSS features
- **ESLint** - Code quality and consistency

### Development Tools
- **Git** - Version control
- **Node.js** - JavaScript runtime for frontend development
- **npm** - Package manager for frontend dependencies
- **Gradle Wrapper** - Consistent Gradle version management

## Getting Started

### Prerequisites

Before running TeamTrack, ensure you have the following installed:

- **Java 17 or higher** - [Download from Oracle](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://adoptium.net/)
- **Node.js 18 or higher** - [Download from Node.js](https://nodejs.org/)
- **Firebase Project** - Set up a Firebase project for authentication
- **Git** - [Download from Git](https://git-scm.com/)

### Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or select an existing project
   - Enable Google Analytics (optional but recommended)

2. **Enable Authentication:**
   - In Firebase Console, go to "Authentication" → "Sign-in method"
   - Enable "Email/Password" authentication
   - Optionally enable other providers (Google, Facebook, etc.)

3. **Create a Web App:**
   - In Firebase Console, click the web icon (</>) to add a web app
   - Register your app with a nickname (e.g., "TeamTrack Web")
   - Copy the Firebase configuration object

4. **Set Up Environment Variables:**
   Create a `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   touch .env
   ```
   
   Add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Backend Firebase Configuration (Optional):**
   - Download your Firebase service account key from Project Settings → Service Accounts
   - Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to this file
   - Or place the file in `backend/src/main/resources/` and update `application.properties`

### Project-Specific Configuration

1. **CORS Settings:**
   The backend is configured to allow requests from:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000` (Alternative dev server)
   
   Update `backend/src/main/resources/application.properties` if you need different origins.

2. **Port Configuration:**
   - **Backend**: Runs on port 8080 with context path `/api`
   - **Frontend**: Runs on port 5173 (Vite default)
   
   These can be changed in their respective configuration files.

3. **Database Configuration:**
   - Currently uses H2 in-memory database
   - To switch to a persistent database, update the JPA configuration in `application.properties`

4. **File Upload Configuration:**
   - Chat file uploads are stored in `backend/uploads/chat-files/`
   - Ensure this directory has proper write permissions

### Database Performance Optimization

To ensure optimal database performance, TeamTrack uses Firestore indices for common query patterns:

1. **Install Firestore Indices:**
   - Copy the `firestore.indexes.json` file to your Firebase project
   - Go to Firebase Console → Firestore Database → Indexes
   - Import the indices configuration or create them manually

2. **Key Indices Created:**
   - **UserTeams**: `userId + teamId`, `teamId + role`, `userId + isActive`
   - **TournamentInvites**: `teamId + isActive`, `tournamentId + isActive`
   - **Tasks**: `teamId + date`, `teamId + assignedUserId`
   - **Events**: `teamId + date`, `teamId + eventType`
   - **Availabilities**: `eventId + userId`, `userId + date`
   - **Teams**: `createdByUserId + isActive`, `sport + ageGroup`
   - **Tournaments**: `organizerId + status`, `sport + startDate`
   - **Chat**: `chatRoomId + timestamp`, `teamId + isActive`

3. **Performance Benefits:**
   - Faster user team queries (reduced from ~500ms to ~50ms)
   - Optimized tournament invite filtering
   - Improved task and event date-based searches
   - Better chat message retrieval performance

4. **Monitoring and Verification:**
   - Check Firebase Console → Firestore → Usage for query performance
   - Monitor index build status in the Indexes tab
   - Review query execution times in the Logs section
   - Use the provided index verification tools (see below)

### Index Usage Verification

To ensure indices are being used properly, TeamTrack includes several verification methods:

1. **Firebase Console Monitoring:**
   - Go to Firestore → Indexes to see index build status
   - Check Firestore → Usage for query performance metrics
   - Review Firestore → Logs for index usage information

2. **Query Performance Analysis:**
   - Compare query execution times before and after index creation
   - Look for "Using index" messages in Firestore logs
   - Monitor read operations and costs in the Usage tab

3. **Index Status Check:**
   - All indices should show "Enabled" status in the Indexes tab
   - Indices take time to build (usually 1-10 minutes for small datasets)
   - Large datasets may take longer to build indices

4. **Common Performance Indicators:**
   - Queries that previously took 500ms+ should now execute in 50-100ms
   - Complex queries with multiple where clauses should be noticeably faster
   - Date-based queries should show significant improvement

5. **Automated Verification Tools:**
   - **Backend Service**: `IndexVerificationService` tests all indices automatically
   - **API Endpoints**: `/api/admin/indices/verify` and `/api/admin/indices/status`
   - **Command Line Tools**: 
     - `verify-indices.sh` (Linux/macOS)
     - `verify-indices.bat` (Windows)
   - **Performance Metrics**: Automatic categorization (excellent/good/needs optimization)

6. **Real-time Monitoring:**
   - Check index build status in Firebase Console
   - Monitor query execution times via verification endpoints
   - Track performance improvements over time
   - Identify indices that need attention

### Getting the Project

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amrib247/TeamTrack
   cd TeamTrack
   ```

2. **Verify the project structure:**
   ```bash
   ls
   # You should see: backend/ frontend/ README.md
   ```

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the Spring Boot application:**
   ```bash
   # On Windows
   .\gradlew bootRun
   
   # On macOS/Linux
   ./gradlew bootRun
   ```

3. **Verify the backend is running:**
   - The application will start on `http://localhost:8080`
   - You should see Spring Boot startup logs in the console

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   - Ensure your `.env` file is set up with Firebase credentials (see Firebase Setup section above)
   - The `src/firebase.ts` file automatically reads from environment variables
   - Verify Firebase is working by checking the browser console for any authentication errors

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and navigate to `http://localhost:5173`
   - The frontend will automatically reload when you make changes

### Running Both Services

For convenience, you can use the provided batch script:

1. **On Windows:**
   ```bash
   run-all.bat
   ```

2. **Manual approach:**
   - Open two terminal windows
   - In the first: `cd backend && ./gradlew bootRun`
   - In the second: `cd frontend && npm run dev`

### Database Setup

The application uses H2 in-memory database by default, which means:
- No additional database installation required
- Data is reset when the application restarts
- Perfect for development and testing

For production, you can configure a persistent database in `application.properties`.

## Testing the Application

### Quick Test

1. **Start both services** (backend and frontend) using the instructions above
2. **Open your browser** and navigate to `http://localhost:5173`
3. **Create a test account** or sign in with existing credentials
4. **Navigate through the application** to test core features:
   - User authentication
   - Team creation and management
   - Tournament setup
   - Chat functionality
   - Task management

### Backend API Testing

Test the backend API endpoints:

```bash
# Health check
curl http://localhost:8080/api/health

# Test authentication (if endpoints are public)
curl http://localhost:8080/api/test
```

### Frontend Testing

The frontend includes hot-reload for development:
- Make changes to any `.tsx` or `.css` file
- Changes automatically appear in the browser
- Check the browser console for any JavaScript errors

### Common Test Scenarios

- **User Registration/Login**: Test Firebase authentication
- **Team Creation**: Create a new team and add members
- **Tournament Setup**: Create a tournament with brackets
- **File Upload**: Test the chat file sharing feature
- **Responsive Design**: Test on different screen sizes

## Project Structure

```
TeamTrack/
├── backend/                 # Spring Boot backend application
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── build.gradle        # Gradle build configuration
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── firestore.indexes.json  # Firestore database indices for performance
├── verify-indices.sh       # Index verification script (Linux/macOS)
├── verify-indices.bat      # Index verification script (Windows)
└── README.md               # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Troubleshooting

### Common Issues

- **Port conflicts**: Ensure ports 8080 (backend) and 5173 (frontend) are available
- **Java version**: Verify you have Java 17+ installed with `java -version`
- **Node.js version**: Check your Node.js version with `node --version`
- **Firebase configuration**: Ensure your Firebase project is properly configured

### Getting Help

If you encounter issues:
1. Check the console logs for error messages
2. Verify all prerequisites are installed correctly
3. Ensure Firebase configuration is properly set up
4. Check that all required ports are available

