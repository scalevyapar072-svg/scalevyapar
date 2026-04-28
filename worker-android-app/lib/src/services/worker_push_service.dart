import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../config/firebase_app_options.dart';
import 'session_store.dart';
import 'worker_api_service.dart';

@pragma('vm:entry-point')
Future<void> workerFirebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (!FirebaseAppOptions.isConfigured) {
    return;
  }

  if (Firebase.apps.isEmpty) {
    await Firebase.initializeApp(options: FirebaseAppOptions.currentPlatform);
  }
}

class WorkerPushService {
  WorkerPushService._();

  static final WorkerPushService instance = WorkerPushService._();

  final WorkerApiService _apiService = WorkerApiService();
  final SessionStore _sessionStore = SessionStore();
  final StreamController<RemoteMessage> _messageStreamController =
      StreamController<RemoteMessage>.broadcast();

  Stream<RemoteMessage> get messages => _messageStreamController.stream;
  bool get _isAndroidSupported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
  bool get isConfigured => _isAndroidSupported && FirebaseAppOptions.isConfigured;

  bool _bootstrapped = false;
  String? _sessionToken;
  String? _lastFcmToken;
  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;
  StreamSubscription<RemoteMessage>? _messageOpenedSubscription;

  Future<void> bootstrap() async {
    if (_bootstrapped || !isConfigured) {
      return;
    }

    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(options: FirebaseAppOptions.currentPlatform);
    }

    FirebaseMessaging.onBackgroundMessage(workerFirebaseMessagingBackgroundHandler);

    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    _lastFcmToken = await FirebaseMessaging.instance.getToken();

    _foregroundMessageSubscription = FirebaseMessaging.onMessage.listen((message) {
      _messageStreamController.add(message);
    });
    _messageOpenedSubscription = FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _messageStreamController.add(message);
    });
    _tokenRefreshSubscription = FirebaseMessaging.instance.onTokenRefresh.listen((fcmToken) {
      _lastFcmToken = fcmToken;
      final sessionToken = _sessionToken;
      if (sessionToken != null && sessionToken.isNotEmpty) {
        unawaited(_registerToken(sessionToken, fcmToken));
      }
    });

    _bootstrapped = true;
  }

  Future<void> attachWorkerSession(String sessionToken) async {
    _sessionToken = sessionToken;
    if (!isConfigured) {
      return;
    }

    await bootstrap();

    final fcmToken = _lastFcmToken ?? await FirebaseMessaging.instance.getToken();
    _lastFcmToken = fcmToken;
    if (fcmToken == null || fcmToken.isEmpty) {
      return;
    }

    await _registerToken(sessionToken, fcmToken);
  }

  Future<void> detachWorkerSession(String sessionToken) async {
    if (isConfigured) {
      final fcmToken = _lastFcmToken ?? await FirebaseMessaging.instance.getToken();
      if (fcmToken != null && fcmToken.isNotEmpty) {
        try {
          await _apiService.unregisterPushToken(
            sessionToken,
            fcmToken: fcmToken,
          );
        } catch (_) {
          // Keep logout reliable even if push deregistration fails.
        }
      }
    }

    if (_sessionToken == sessionToken) {
      _sessionToken = null;
    }
  }

  Future<void> _registerToken(String sessionToken, String fcmToken) async {
    final languageCode = await _sessionStore.getLanguageCode() ?? 'hi';
    try {
      await _apiService.registerPushToken(
        sessionToken,
        fcmToken: fcmToken,
        locale: languageCode,
        platform: defaultTargetPlatform.name,
        deviceLabel: 'ScaleVyapar Rozgar Android',
      );
    } catch (_) {
      // Push setup should never block login or dashboard usage.
    }
  }

  Future<void> dispose() async {
    await _tokenRefreshSubscription?.cancel();
    await _foregroundMessageSubscription?.cancel();
    await _messageOpenedSubscription?.cancel();
    await _messageStreamController.close();
  }
}
