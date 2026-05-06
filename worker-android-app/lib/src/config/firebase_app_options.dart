import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class FirebaseAppOptions {
  static const _androidApiKey = 'PASTE_ANDROID_FIREBASE_API_KEY';
  static const _androidAppId = 'PASTE_ANDROID_FIREBASE_APP_ID';
  static const _androidMessagingSenderId = 'PASTE_FIREBASE_SENDER_ID';
  static const _androidProjectId = 'PASTE_FIREBASE_PROJECT_ID';
  static const _androidStorageBucket = 'PASTE_FIREBASE_STORAGE_BUCKET';

  static bool get isConfigured =>
      !_androidApiKey.startsWith('PASTE_') &&
      !_androidAppId.startsWith('PASTE_') &&
      !_androidMessagingSenderId.startsWith('PASTE_') &&
      !_androidProjectId.startsWith('PASTE_');

  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'Push notifications are only configured for Android in this worker app.',
        );
    }
  }

  static FirebaseOptions get android => const FirebaseOptions(
        apiKey: _androidApiKey,
        appId: _androidAppId,
        messagingSenderId: _androidMessagingSenderId,
        projectId: _androidProjectId,
        storageBucket:
            _androidStorageBucket == 'PASTE_FIREBASE_STORAGE_BUCKET'
                ? null
                : _androidStorageBucket,
      );
}
