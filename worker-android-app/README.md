# ScaleVyapar Worker Android App

This is the Flutter MVP for the worker-side Android app.

Current MVP flow:

- mobile number login with OTP
- session bootstrap and auto-login when a worker token already exists
- worker dashboard with activation banner and quick stats
- matching job feed with search and unlocked-only filter
- wallet balance, daily deduction visibility, and recharge request note
- profile edit with name, city, categories, skills, experience, wage, availability
- company details locked unless worker access is active

## Important

Flutter is not installed in this workspace, so the native Android project wrapper was not generated automatically here.

To turn this into a runnable Android app on your machine:

1. Install Flutter
2. Open terminal in this folder
3. Run:

```bash
flutter create .
flutter pub get
flutter run
```

If you want to run against production backend, the app already points to:

```text
https://scalevyapar.vercel.app
```

That base URL is set in:

`lib/src/config/api_config.dart`

## Demo login for current seeded backend

- Mobile: `9876543210`
- OTP: `123456`

Or request OTP for any new worker mobile number. The backend currently uses a demo OTP for MVP development.
