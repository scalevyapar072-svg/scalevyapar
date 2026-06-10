import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'worker_app_config.dart';

class ApiConfig {
  static const String _defaultOrigin = 'https://rozgar.scalevyapar.in';
  static const String _debugOriginOverride =
      String.fromEnvironment('ROZGAR_API_ORIGIN');
  static const String rozgarV1BasePath = '/api/rozgar/v1';
  static const String labourWorkerBasePath = '/api/labour/worker';
  static const String rozgarWorkerBasePath = '$rozgarV1BasePath/worker';
  static const String appConfigPath = '$rozgarV1BasePath/app-config';
  static const bool useRozgarWorkerRoutesByDefault = false;

  static String get fallbackOrigin {
    final override = _debugOriginOverride.trim();
    if (override.isEmpty) {
      return _defaultOrigin;
    }

    try {
      final uri = Uri.parse(override);
      if (uri.hasScheme && uri.host.isNotEmpty) {
        return uri.origin;
      }
    } catch (_) {
      return _defaultOrigin;
    }

    return _defaultOrigin;
  }

  static WorkerAppConfig? _remoteConfig;
  static Future<void>? _bootstrapFuture;

  static String get baseUrl {
    final apiBaseUrl = _remoteConfig?.apiBaseUrl;
    if (apiBaseUrl == null || apiBaseUrl.isEmpty) {
      return fallbackOrigin;
    }

    try {
      final uri = Uri.parse(apiBaseUrl);
      if (uri.hasScheme && uri.host.isNotEmpty) {
        return uri.origin;
      }
    } catch (_) {
      return fallbackOrigin;
    }

    return fallbackOrigin;
  }

  static WorkerAppConfig? get remoteConfig => _remoteConfig;

  static String get workerApiBasePath => useRozgarWorkerRoutesByDefault
      ? rozgarWorkerBasePath
      : labourWorkerBasePath;

  static String get workerApiFallbackBasePath => labourWorkerBasePath;

  static String resolveWorkerPath(String path, {bool preferRozgarV1 = false}) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final selectedBasePath =
        preferRozgarV1 ? rozgarWorkerBasePath : workerApiBasePath;
    return '$selectedBasePath$normalizedPath';
  }

  static Future<void> bootstrap({http.Client? client}) {
    return _bootstrapFuture ??= _loadRemoteConfig(client: client);
  }

  static Future<void> refresh({http.Client? client}) async {
    _bootstrapFuture = null;
    await bootstrap(client: client);
  }

  static Future<void> _loadRemoteConfig({http.Client? client}) async {
    final activeClient = client ?? http.Client();
    final shouldCloseClient = client == null;
    try {
      final response = await activeClient
          .get(Uri.parse('$fallbackOrigin$appConfigPath'))
          .timeout(const Duration(seconds: 8));

      if (response.statusCode >= 400) {
        return;
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        return;
      }

      final config = WorkerAppConfig.fromJson(decoded);
      if (config.appPackage.isEmpty) {
        return;
      }

      _remoteConfig = config;
    } catch (_) {
      // Keep using the built-in fallback origin and legacy worker routes.
    } finally {
      if (shouldCloseClient) {
        activeClient.close();
      }
    }
  }
}
