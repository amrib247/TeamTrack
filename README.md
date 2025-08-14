# TeamTrack - Sports Team Management System

A comprehensive sports team management application built with Spring Boot (Java) and React (TypeScript).

## Features

- **User Management**: Admin, Coach, Player, and Parent roles
- **Team Management**: Create and manage sports teams
- **Player Profiles**: Detailed player information and statistics
- **Firebase Integration**: Authentication and real-time database
- **Modern UI**: Responsive React frontend with TypeScript

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.5.4
- Firebase Admin SDK
- Gradle

### Frontend
- React 19
- TypeScript
- Vite
- Firebase Web SDK

## Prerequisites

- Java 21 or higher
- Node.js 18 or higher
- Firebase project with Authentication and Firestore enabled

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd TeamTrack
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore Database
3. Create a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

### 3. Backend Setup

1. **Set Firebase Credentials**:
   ```bash
   # Windows PowerShell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\firebase-service-account.json"
   
   # Or add to system environment variables
   ```

2. **Build and Run**:
   ```bash
   cd backend
   ./gradlew bootRun
   ```
   
   The backend will start on `http://localhost:8080`

### 4. Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**:
   ```bash
   # Create .env file with your Firebase configuration
   # Get these values from Firebase Console → Project Settings → General → Your Apps
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   
   The frontend will start on `http://localhost:5173`

### 5. Quick Start (Windows)

Use the provided batch script to start both servers:
```bash
run-all.bat
```

## Project Structure

```
TeamTrack/
├── backend/
│   ├── src/main/java/com/example/TeamTrack_backend/
│   │   ├── controllers/     # REST API endpoints
│   │   ├── models/          # Data models
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── config/         # Configuration classes
│   │   └── services/       # Business logic
│   └── src/main/resources/
│       └── application.properties
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
└── run-all.bat            # Development startup script
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## Data Models

### User
- Basic user information (name, email, phone)
- Role-based access (Admin, Coach, Player, Parent)
- Team association

### Team
- Team information (name, sport, age group)
- Coach assignment
- Player roster

### Player
- Player-specific data (jersey number, position)
- Physical attributes (height, weight)
- Emergency contact information

## Development

### Adding New Features

1. **Backend**: Create models, DTOs, controllers, and services
2. **Frontend**: Add TypeScript types, API services, and React components
3. **Testing**: Test API endpoints and UI functionality

### Code Style

- Backend: Follow Java conventions and Spring Boot best practices
- Frontend: Use TypeScript strict mode and React hooks
- Use meaningful variable and function names
- Add comments for complex logic

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**:
   - Verify service account JSON path in environment variable
   - Check Firebase project configuration

2. **CORS Errors**:
   - Ensure backend is running on port 8080
   - Check CORS configuration in `CorsConfig.java`

3. **Frontend Build Errors**:
   - Run `npm install` to install dependencies
   - Check TypeScript compilation errors

### Environment Variables

**Backend**:
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Firebase service account JSON

**Frontend**:
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:8080/api)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
