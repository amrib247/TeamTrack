# TeamTrack

Team management and tournament organization for sports teams, coaches, and organizers.

## Architecture

TeamTrack is a **single-page React application** that talks directly to **Firebase**:

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| File storage | Firebase Storage (chat attachments) |
| Hosting | GitHub Pages |

There is **no separate backend server**. All data access uses the Firebase Client SDK from the browser.

## Features

- User authentication and profiles
- Team creation, invites, roles, and coach safety checks
- Tournament organization and team enrollment
- Event scheduling with availability tracking
- Task management with sign-ups
- Team chat with file sharing

## Prerequisites

- **Node.js 18+**
- A **Firebase project** with Authentication, Firestore, and Storage enabled

## Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Email/Password** under Authentication → Sign-in method
3. Create a **Firestore** database
4. Enable **Storage** for chat file uploads
5. Register a web app and copy the config values
6. Deploy composite indexes (see [Deploy Firestore indexes](#deploy-firestore-indexes) below)

Create `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Configure **Firestore Security Rules** and **Storage Rules** for your deployment (the app previously relied on server-side Admin SDK access).

### Email verification (one-time Console setup)

1. **Authentication → Sign-in method** — enable **Email/Password**.
2. **Authentication → Templates → Email address verification** — customize the subject/body (optional).
3. **Authentication → Settings → Authorized domains** — add `localhost` and your production host (e.g. `amrib247.github.io`).

Deploy updated Firestore rules after enabling verification in the app:

```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore indexes

From the **project root** (where `firebase.json` and `firestore.indexes.json` live):

```bash
# One-time: install CLI and sign in
npm install -g firebase-tools
firebase login

# Link this folder to your Firebase project (pick the same project as VITE_FIREBASE_PROJECT_ID)
firebase use --add

# Deploy only indexes from firestore.indexes.json
firebase deploy --only firestore:indexes
```

Indexes take a few minutes to build. Check status in Firebase Console → Firestore → **Indexes**.

To update indexes later, edit `firestore.indexes.json` and run `firebase deploy --only firestore:indexes` again.

### Deploy security rules

Rules live in `firestore.rules` and `storage.rules`. They require a signed-in user (same as local dev when logged in) and add production checks (e.g. users can only edit their own profile, chat messages, and availability).

```bash
firebase deploy --only firestore:rules,storage
```

## Local development

```bash
cd frontend
npm install
npm run dev
```

Or from the project root on Windows:

```bash
run-all.bat
```

Open [http://localhost:5173](http://localhost:5173).

## Production build

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`. GitHub Actions deploys this to GitHub Pages on pushes to `main`.

## Project structure

```
TeamTrack/
├── frontend/              # React SPA (all application code)
│   ├── src/
│   │   ├── services/      # Firestore & Firebase SDK services
│   │   ├── pages/         # Route pages
│   │   ├── components/    # UI components
│   │   └── lib/           # Shared Firestore utilities
│   └── package.json
├── firebase.json          # Firebase CLI config (indexes deploy)
├── firestore.indexes.json # Firestore composite indexes
└── README.md
```

## Security note

With the Java backend removed, **Firestore and Storage security rules** are your authorization layer. Review and tighten rules before production use.
