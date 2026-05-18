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

## Email reminders (games & tasks)

Team members can enable per-team email reminders on **Team → Settings** (games marked **Going**, tasks they signed up for). Reminders are sent by a **GitHub Actions** workflow on a schedule—users do not need to be online. This works on the Firebase **Spark** plan (no Blaze / credit card required).

### Requirements

1. **GitHub repository** with Actions enabled (free for public repos).
2. **Firebase service account** JSON for Admin SDK access to Firestore.
3. **SMTP** — Gmail with an [App Password](https://support.google.com/accounts/answer/185833) or any SMTP provider.

See [Set up email reminders](#set-up-email-reminders) below for step-by-step configuration.

### Run locally (optional test)

```bash
cd reminders
npm install
npm run build

# Set env vars, then:
# FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
# SMTP_HOST=smtp.gmail.com SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... MAIL_FROM=...
npm start
```

### Manual run on GitHub

Repo → **Actions** → **Email reminders** → **Run workflow**.

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
├── reminders/             # Email reminder job (run via GitHub Actions)
├── .github/workflows/     # deploy.yml, reminders.yml
├── firebase.json          # Firebase CLI config
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore composite indexes
└── README.md
```

## Set up email reminders

### 1. Firebase service account

1. [Firebase Console](https://console.firebase.google.com/) → your project → **Project settings** → **Service accounts**.
2. Click **Generate new private key** and save the JSON file.
3. In GitHub: repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Name: `FIREBASE_SERVICE_ACCOUNT_JSON`  
   Value: paste the **entire** JSON file contents (one line is fine).

### 2. SMTP secrets (Gmail example)

Create these repository secrets:

| Secret | Example value |
|--------|----------------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | [Gmail App Password](https://support.google.com/accounts/answer/185833) (16 characters) |
| `MAIL_FROM` | same as `SMTP_USER` |
| `APP_URL` (optional) | `https://amrib247.github.io/TeamTrack/` |

### 3. Enable the workflow

1. Push `.github/workflows/reminders.yml` to your default branch (`main`).
2. **Actions** tab → enable workflows if prompted.
3. The job runs every **15 minutes** (UTC). Use **Run workflow** to test immediately.

### 4. Firestore rules and indexes

Deploy rules (includes `reminderDeliveries` and notification prefs on `userTeams`):

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Troubleshooting

- **Workflow not running on schedule:** Scheduled workflows need recent activity on the repo; use **Run workflow** to verify secrets first.
- **SMTP errors:** Confirm App Password (not your normal Gmail password) and that 2-Step Verification is on.
- **Permission denied on Firestore:** Service account must be from the same Firebase project as `VITE_FIREBASE_PROJECT_ID`.

## Security note

With the Java backend removed, **Firestore and Storage security rules** are your authorization layer. Review and tighten rules before production use.

**Service account:** The GitHub secret grants full Admin access to your Firebase project. Never commit the JSON file or log it in Actions output.
