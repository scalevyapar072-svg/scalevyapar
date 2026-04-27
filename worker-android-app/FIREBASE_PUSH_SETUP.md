# ScaleVyapar Rozgar Push Setup

Use this file after the code changes are in place to turn on real Firebase push notifications.

## 1. Create or open your Firebase project

- Open [Firebase Console](https://console.firebase.google.com/)
- Create a project or use an existing one
- Add an Android app

For the current worker app, the Android package name is:

`com.example.labour_worker_app`

If you later change the package name in Android, register that same package name in Firebase too.

## 2. Fill the app Firebase config

Open:

`lib/src/config/firebase_app_options.dart`

Replace these placeholder values with the Android app values from Firebase Project Settings:

- `PASTE_ANDROID_FIREBASE_API_KEY`
- `PASTE_ANDROID_FIREBASE_APP_ID`
- `PASTE_FIREBASE_SENDER_ID`
- `PASTE_FIREBASE_PROJECT_ID`
- `PASTE_FIREBASE_STORAGE_BUCKET`

## 3. Add Vercel backend environment variables

In Vercel Project Settings -> Environment Variables, add:

- `FCM_PROJECT_ID`
- `FCM_CLIENT_EMAIL`
- `FCM_PRIVATE_KEY`

Use a Firebase service account JSON from:

- Firebase Console
- Project settings
- Service accounts
- Generate new private key

Map these JSON fields like this:

- `project_id` -> `FCM_PROJECT_ID`
- `client_email` -> `FCM_CLIENT_EMAIL`
- `private_key` -> `FCM_PRIVATE_KEY`

For `FCM_PRIVATE_KEY`, keep newline characters as `\n` if you paste it into Vercel.

## 4. Run the latest SQL

The backend now expects the table:

- `labour_worker_device_tokens`

Run the latest contents of:

`supabase/labour-marketplace.sql`

## 5. Rebuild the app

```powershell
cd "C:\Users\neelu\Documents\New project\scalevyapar\worker-android-app"
C:\flutter\bin\flutter.bat pub get
C:\flutter\bin\flutter.bat run -d emulator-5554
```

## 6. What to expect

- when the worker logs in, the app registers the FCM device token with your backend
- when a worker notification record is created, the backend sends a real Firebase push
- when the app is open in the foreground, the Alerts tab refreshes automatically
- when the app is in background or closed, Android should show the system notification
