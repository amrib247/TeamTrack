@echo off
echo Building frontend for GitHub Pages...

cd frontend

echo Installing dependencies...
npm install

echo Building with production settings...
echo WARNING: Make sure to set your environment variables before running this script!
echo Required environment variables:
echo - VITE_FIREBASE_API_KEY
echo - VITE_FIREBASE_AUTH_DOMAIN
echo - VITE_FIREBASE_PROJECT_ID
echo - VITE_FIREBASE_STORAGE_BUCKET
echo - VITE_FIREBASE_MESSAGING_SENDER_ID
echo - VITE_FIREBASE_APP_ID
echo - VITE_API_BASE_URL

npm run build

echo Build completed! Files are in frontend/dist/
echo You can now upload the contents of frontend/dist/ to GitHub Pages manually.
pause
