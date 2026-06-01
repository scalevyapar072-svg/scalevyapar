import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/worker_models.dart';

class WorkerApiService {
  final http.Client _client;
  static const _networkErrorMessage =
      'Could not connect to Rozgar servers. Please check your internet connection and try again.';

  WorkerApiService({http.Client? client}) : _client = client ?? http.Client();

  Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

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
      throw Exception(_networkErrorMessage);
    } on SocketException {
      throw Exception(_networkErrorMessage);
    } on http.ClientException {
      throw Exception(_networkErrorMessage);
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
      throw Exception(_networkErrorMessage);
    } on SocketException {
      throw Exception(_networkErrorMessage);
    } on http.ClientException {
      throw Exception(_networkErrorMessage);
    }
  }

  Map<String, dynamic> _decodeResponse(http.Response response, {required String fallbackError}) {
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

  Future<String> requestOtp(String mobile) async {
    final response = await _postJson(
      '/api/labour/worker/auth/request-otp',
      body: jsonEncode({'mobile': mobile}),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to request OTP');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to request OTP');
    }

    return data['otpCode'] as String? ?? '';
  }

  Future<(String, WorkerDashboardModel)> verifyOtp(String mobile, String otpCode) async {
    final response = await _postJson(
      '/api/labour/worker/auth/verify-otp',
      body: jsonEncode({'mobile': mobile, 'otpCode': otpCode}),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to verify OTP');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to verify OTP');
    }

    return (
      data['token'] as String? ?? '',
      WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>)
    );
  }

  Future<WorkerDashboardModel> getDashboard(String token) async {
    final response = await _get(
      '/api/labour/worker/dashboard',
      headers: {'Authorization': 'Bearer $token'},
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to load dashboard');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to load dashboard');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> updateProfile(
    String token, {
    required String fullName,
    required String city,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required double expectedDailyWage,
    required String availability,
  }) async {
    final response = await _client.put(
      _uri('/api/labour/worker/profile'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fullName': fullName,
        'city': city,
        'categoryIds': categoryIds,
        'skills': skills,
        'experienceYears': experienceYears,
        'expectedDailyWage': expectedDailyWage,
        'availability': availability,
      }),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to update profile');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update profile');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<String> uploadWorkerDocument(
    String token, {
    required String documentKind,
    required String filePath,
    required String fileName,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      _uri('/api/labour/worker/upload'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.fields['documentKind'] = documentKind;
    request.files.add(await http.MultipartFile.fromPath('file', filePath, filename: fileName));

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    final data = _decodeResponse(response, fallbackError: 'Failed to upload document');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to upload document');
    }

    return data['storagePath'] as String? ?? '';
  }

  Future<WorkerDashboardModel> completeRegistration(
    String token, {
    required String fullName,
    required String city,
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
    final response = await _client.post(
      _uri('/api/labour/worker/register'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'fullName': fullName,
        'city': city,
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

    final data = _decodeResponse(response, fallbackError: 'Failed to complete registration');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to complete registration');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> createRechargeRequest(String token, {String? note}) async {
    final response = await _client.post(
      _uri('/api/labour/worker/recharge-request'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'note': note}),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to create recharge request');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to create recharge request');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
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

    final data = _decodeResponse(response, fallbackError: 'Failed to create payment order');
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

    final data = _decodeResponse(response, fallbackError: 'Payment verification failed');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Payment verification failed');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> applyToJob(
    String token, {
    required String jobPostId,
    String? note,
  }) async {
    final response = await _client.post(
      _uri('/api/labour/worker/applications'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'jobPostId': jobPostId,
        'note': note,
      }),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to apply to job');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to apply to job');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> toggleSavedJob(
    String token, {
    required String jobPostId,
  }) async {
    final response = await _client.post(
      _uri('/api/labour/worker/saved-jobs'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'jobPostId': jobPostId}),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to update saved jobs');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update saved jobs');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<WorkerDashboardModel> markNotificationsRead(
    String token, {
    List<String>? notificationIds,
  }) async {
    final response = await _client.post(
      _uri('/api/labour/worker/notifications'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'notificationIds': notificationIds}),
    );

    final data = _decodeResponse(response, fallbackError: 'Failed to update notifications');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update notifications');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }

  Future<void> registerPushToken(
    String token, {
    required String fcmToken,
    required String locale,
    required String platform,
    String? deviceLabel,
  }) async {
    final response = await _client.post(
      _uri('/api/labour/worker/push-token'),
      headers: {
        'Content-Type': 'application/json',
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
    final response = await _client.delete(
      _uri('/api/labour/worker/push-token'),
      headers: {
        'Content-Type': 'application/json',
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
