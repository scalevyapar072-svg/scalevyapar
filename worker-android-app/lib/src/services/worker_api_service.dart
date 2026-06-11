import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/worker_models.dart';

class _WorkerApiTransportException implements Exception {
  final String message;

  const _WorkerApiTransportException(this.message);

  @override
  String toString() => message;
}

class WorkerApiService {
  final http.Client _client;
  static const _networkErrorMessage =
      'Could not connect to Rozgar servers. Please check your internet connection and try again.';
  String? _pendingOtpSessionToken;

  WorkerApiService({http.Client? client}) : _client = client ?? http.Client();

  Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');
  String _workerPath(String path) => ApiConfig.resolveWorkerPath(path);

  Future<http.Response> _postJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      return await _client
          .post(
            _uri(path),
            headers: {
              'Content-Type': 'application/json',
              ...?headers,
            },
            body: body,
          )
          .timeout(const Duration(seconds: 25));
    } on TimeoutException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on SocketException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on http.ClientException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    }
  }

  Future<http.Response> _get(
    String path, {
    Map<String, String>? headers,
  }) async {
    try {
      return await _client
          .get(
            _uri(path),
            headers: headers,
          )
          .timeout(const Duration(seconds: 25));
    } on TimeoutException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on SocketException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on http.ClientException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    }
  }

  Future<http.Response> _putJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      return await _client
          .put(
            _uri(path),
            headers: {
              'Content-Type': 'application/json',
              ...?headers,
            },
            body: body,
          )
          .timeout(const Duration(seconds: 25));
    } on TimeoutException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on SocketException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on http.ClientException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    }
  }

  Future<http.Response> _deleteJson(
    String path, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      return await _client
          .delete(
            _uri(path),
            headers: {
              'Content-Type': 'application/json',
              ...?headers,
            },
            body: body,
          )
          .timeout(const Duration(seconds: 25));
    } on TimeoutException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on SocketException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on http.ClientException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    }
  }

  bool _isJsonResponse(http.Response response) {
    final contentType = response.headers['content-type'] ?? '';
    final body = response.body.trim();

    return contentType.contains('application/json') || body.startsWith('{');
  }

  bool _shouldFallbackAuthResponse(http.Response response) {
    if (response.statusCode == 404) {
      return true;
    }

    return !_isJsonResponse(response);
  }

  bool _shouldFallbackDashboardResponse(http.Response response) {
    if (response.statusCode == 404) {
      return true;
    }

    return !_isJsonResponse(response);
  }

  bool _shouldFallbackWorkerResponse(http.Response response) {
    if (response.statusCode == 404) {
      return true;
    }

    return !_isJsonResponse(response);
  }

  Future<http.Response> _postAuthJsonWithFallback(
    String primaryPath,
    String fallbackPath, {
    Object? body,
  }) async {
    try {
      final primaryResponse = await _postJson(primaryPath, body: body);
      if (_shouldFallbackAuthResponse(primaryResponse)) {
        return _postJson(fallbackPath, body: body);
      }
      return primaryResponse;
    } on _WorkerApiTransportException {
      return _postJson(fallbackPath, body: body);
    }
  }

  Future<http.Response> _getDashboardWithFallback(
    String primaryPath,
    String fallbackPath, {
    Map<String, String>? headers,
  }) async {
    try {
      final primaryResponse = await _get(primaryPath, headers: headers);
      if (_shouldFallbackDashboardResponse(primaryResponse)) {
        return _get(fallbackPath, headers: headers);
      }
      return primaryResponse;
    } on _WorkerApiTransportException {
      return _get(fallbackPath, headers: headers);
    }
  }

  Future<http.Response> _putWorkerJsonWithFallback(
    String primaryPath,
    String fallbackPath, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      final primaryResponse =
          await _putJson(primaryPath, headers: headers, body: body);
      if (_shouldFallbackWorkerResponse(primaryResponse)) {
        return _putJson(fallbackPath, headers: headers, body: body);
      }
      return primaryResponse;
    } on _WorkerApiTransportException {
      return _putJson(fallbackPath, headers: headers, body: body);
    }
  }

  Future<http.Response> _postWorkerJsonWithFallback(
    String primaryPath,
    String fallbackPath, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      final primaryResponse =
          await _postJson(primaryPath, headers: headers, body: body);
      if (_shouldFallbackWorkerResponse(primaryResponse)) {
        return _postJson(fallbackPath, headers: headers, body: body);
      }
      return primaryResponse;
    } on _WorkerApiTransportException {
      return _postJson(fallbackPath, headers: headers, body: body);
    }
  }

  Future<http.Response> _deleteWorkerJsonWithFallback(
    String primaryPath,
    String fallbackPath, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    try {
      final primaryResponse =
          await _deleteJson(primaryPath, headers: headers, body: body);
      if (_shouldFallbackWorkerResponse(primaryResponse)) {
        return _deleteJson(fallbackPath, headers: headers, body: body);
      }
      return primaryResponse;
    } on _WorkerApiTransportException {
      return _deleteJson(fallbackPath, headers: headers, body: body);
    }
  }

  Future<http.Response> _sendMultipartUpload(
    String path, {
    required String token,
    required String documentKind,
    required String filePath,
    required String fileName,
  }) async {
    try {
      final request = http.MultipartRequest('POST', _uri(path));
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['documentKind'] = documentKind;
      request.files.add(
        await http.MultipartFile.fromPath('file', filePath, filename: fileName),
      );

      final streamed =
          await request.send().timeout(const Duration(seconds: 25));
      return http.Response.fromStream(streamed);
    } on TimeoutException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on SocketException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    } on http.ClientException {
      throw const _WorkerApiTransportException(_networkErrorMessage);
    }
  }

  Future<http.Response> _uploadWorkerDocumentWithFallback({
    required String primaryPath,
    required String fallbackPath,
    required String token,
    required String documentKind,
    required String filePath,
    required String fileName,
  }) async {
    try {
      final primaryResponse = await _sendMultipartUpload(
        primaryPath,
        token: token,
        documentKind: documentKind,
        filePath: filePath,
        fileName: fileName,
      );
      if (_shouldFallbackWorkerResponse(primaryResponse)) {
        return _sendMultipartUpload(
          fallbackPath,
          token: token,
          documentKind: documentKind,
          filePath: filePath,
          fileName: fileName,
        );
      }
      return primaryResponse;
    } on _WorkerApiTransportException {
      return _sendMultipartUpload(
        fallbackPath,
        token: token,
        documentKind: documentKind,
        filePath: filePath,
        fileName: fileName,
      );
    }
  }

  Map<String, dynamic> _decodeResponse(http.Response response,
      {required String fallbackError}) {
    final contentType = response.headers['content-type'] ?? '';
    final body = response.body.trim();

    if (contentType.contains('application/json')) {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    }

    if (body.startsWith('{')) {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    }

    if (body.startsWith('<!DOCTYPE html') || body.startsWith('<html')) {
      throw Exception(
        'The live backend does not have this API yet. Push the latest Next.js worker routes to Vercel, then try again.',
      );
    }

    throw Exception(fallbackError);
  }

  Future<void> requestOtp(String mobile) async {
    final response = await _postAuthJsonWithFallback(
      ApiConfig.resolveWorkerPath('/auth/request-otp', preferRozgarV1: true),
      _workerPath('/auth/request-otp'),
      body: jsonEncode({'mobile': mobile}),
    );

    final data =
        _decodeResponse(response, fallbackError: 'Failed to request OTP');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to request OTP');
    }

    final sessionToken = data['otpSessionToken'];
    _pendingOtpSessionToken =
        sessionToken is String && sessionToken.trim().isNotEmpty
            ? sessionToken.trim()
            : null;
  }

  Future<(String, WorkerDashboardModel)> verifyOtp(
      String mobile, String otpCode) async {
    final requestBody = <String, dynamic>{
      'mobile': mobile,
      'otpCode': otpCode,
    };
    if (_pendingOtpSessionToken != null &&
        _pendingOtpSessionToken!.trim().isNotEmpty) {
      requestBody['otpSessionToken'] = _pendingOtpSessionToken!.trim();
    }

    final response = await _postAuthJsonWithFallback(
      ApiConfig.resolveWorkerPath('/auth/verify-otp', preferRozgarV1: true),
      _workerPath('/auth/verify-otp'),
      body: jsonEncode(requestBody),
    );

    final data =
        _decodeResponse(response, fallbackError: 'Failed to verify OTP');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to verify OTP');
    }

    _pendingOtpSessionToken = null;

    return (
      data['token'] as String? ?? '',
      WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>)
    );
  }

  Future<WorkerDashboardModel> getDashboard(String token) async {
    final response = await _getDashboardWithFallback(
      ApiConfig.resolveWorkerPath('/dashboard', preferRozgarV1: true),
      _workerPath('/dashboard'),
      headers: {'Authorization': 'Bearer $token'},
    );

    final data =
        _decodeResponse(response, fallbackError: 'Failed to load dashboard');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to load dashboard');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> updateProfile(
    String token, {
    required String fullName,
    required String city,
    required String homeCity,
    required String address,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required String salaryType,
    required double expectedDailyWage,
    required String availability,
  }) async {
    final response = await _putWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/profile', preferRozgarV1: true),
      _workerPath('/profile'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fullName': fullName,
        'city': city,
        'homeCity': homeCity,
        'address': address,
        'categoryIds': categoryIds,
        'skills': skills,
        'experienceYears': experienceYears,
        'salaryType': salaryType,
        'expectedDailyWage': expectedDailyWage,
        'availability': availability,
      }),
    );

    final data =
        _decodeResponse(response, fallbackError: 'Failed to update profile');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update profile');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<String> uploadWorkerDocument(
    String token, {
    required String documentKind,
    required String filePath,
    required String fileName,
  }) async {
    final response = await _uploadWorkerDocumentWithFallback(
      primaryPath: ApiConfig.resolveWorkerPath('/upload', preferRozgarV1: true),
      fallbackPath: _workerPath('/upload'),
      token: token,
      documentKind: documentKind,
      filePath: filePath,
      fileName: fileName,
    );
    final data =
        _decodeResponse(response, fallbackError: 'Failed to upload document');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to upload document');
    }

    return data['storagePath'] as String? ?? '';
  }

  Future<WorkerDashboardModel> completeRegistration(
    String token, {
    required String fullName,
    required String city,
    required String homeCity,
    required String address,
    required String salaryType,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required double expectedDailyWage,
    required String availability,
    required String profilePhotoPath,
    required String identityProofType,
    required String identityProofNumber,
    required String identityProofPath,
  }) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/register', preferRozgarV1: true),
      _workerPath('/register'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fullName': fullName,
        'city': city,
        'homeCity': homeCity,
        'address': address,
        'salaryType': salaryType,
        'categoryIds': categoryIds,
        'skills': skills,
        'experienceYears': experienceYears,
        'expectedDailyWage': expectedDailyWage,
        'availability': availability,
        'profilePhotoPath': profilePhotoPath,
        'identityProofType': identityProofType,
        'identityProofNumber': identityProofNumber,
        'identityProofPath': identityProofPath,
      }),
    );

    final data = _decodeResponse(response,
        fallbackError: 'Failed to complete registration');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to complete registration');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> createRechargeRequest(String token,
      {String? note}) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/recharge-request', preferRozgarV1: true),
      _workerPath('/recharge-request'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'note': note}),
    );

    final data = _decodeResponse(response,
        fallbackError: 'Failed to create recharge request');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to create recharge request');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerRazorpayOrderModel> createWalletRechargeOrder(
    String token, {
    required double amount,
  }) async {
    final response = await _postJson(
      '/api/labour/worker/payments/razorpay/order',
      headers: {'Authorization': 'Bearer $token'},
      body: jsonEncode({'amount': amount}),
    );

    final data = _decodeResponse(response,
        fallbackError: 'Failed to create payment order');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to create payment order');
    }

    return WorkerRazorpayOrderModel.fromJson(data);
  }

  Future<WorkerDashboardModel> verifyWalletRechargePayment(
    String token, {
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
  }) async {
    final response = await _postJson(
      '/api/labour/worker/payments/razorpay/verify',
      headers: {'Authorization': 'Bearer $token'},
      body: jsonEncode({
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
      }),
    );

    final data =
        _decodeResponse(response, fallbackError: 'Payment verification failed');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Payment verification failed');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> applyToJob(
    String token, {
    required String jobPostId,
    String? note,
  }) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/applications', preferRozgarV1: true),
      _workerPath('/applications'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'jobPostId': jobPostId,
        'note': note,
      }),
    );

    final data =
        _decodeResponse(response, fallbackError: 'Failed to apply to job');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to apply to job');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> toggleSavedJob(
    String token, {
    required String jobPostId,
  }) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/saved-jobs', preferRozgarV1: true),
      _workerPath('/saved-jobs'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'jobPostId': jobPostId}),
    );

    final data =
        _decodeResponse(response, fallbackError: 'Failed to update saved jobs');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update saved jobs');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> markNotificationsRead(
    String token, {
    List<String>? notificationIds,
  }) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/notifications', preferRozgarV1: true),
      _workerPath('/notifications'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'notificationIds': notificationIds}),
    );

    final data = _decodeResponse(response,
        fallbackError: 'Failed to update notifications');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update notifications');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> updateWalletStatus(
    String token, {
    required bool active,
  }) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/wallet/status', preferRozgarV1: true),
      _workerPath('/wallet/status'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'active': active}),
    );

    final data = _decodeResponse(response,
        fallbackError: 'Failed to update wallet status');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update wallet status');
    }

    return WorkerDashboardModel.fromJson(
        data['dashboard'] as Map<String, dynamic>);
  }

  Future<void> registerPushToken(
    String token, {
    required String fcmToken,
    required String locale,
    required String platform,
    String? deviceLabel,
  }) async {
    final response = await _postWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/push-token', preferRozgarV1: true),
      _workerPath('/push-token'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fcmToken': fcmToken,
        'locale': locale,
        'platform': platform,
        'deviceLabel': deviceLabel,
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to register push token');
    }
  }

  Future<void> unregisterPushToken(
    String token, {
    String? fcmToken,
  }) async {
    final response = await _deleteWorkerJsonWithFallback(
      ApiConfig.resolveWorkerPath('/push-token', preferRozgarV1: true),
      _workerPath('/push-token'),
      headers: {
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'fcmToken': fcmToken}),
    );

    if (response.statusCode == 204) {
      return;
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to unregister push token');
    }
  }
}
