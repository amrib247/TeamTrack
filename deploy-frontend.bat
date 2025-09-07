@echo off
echo Building frontend for GitHub Pages...

cd frontend

echo Installing dependencies...
npm install

echo Building with production settings...
set VITE_FIREBASE_API_KEY=AIzaSyD-n1Ro87Lk3mm6j_l6Tke11aLgXHkVJvE
set VITE_FIREBASE_AUTH_DOMAIN=teamtrack-93cae.firebaseapp.com
set VITE_FIREBASE_PROJECT_ID=teamtrack-93cae
set VITE_FIREBASE_STORAGE_BUCKET=teamtrack-93cae.firebasestorage.app
set VITE_FIREBASE_MESSAGING_SENDER_ID=860441948458
set VITE_FIREBASE_APP_ID=1:860441948458:web:ca76a7eeb7a4111be4ee53
set VITE_API_BASE_URL=https://teamtrack-backend.onrender.com/api

npm run build

echo Build completed! Files are in frontend/dist/
echo You can now upload the contents of frontend/dist/ to GitHub Pages manually.
pause
