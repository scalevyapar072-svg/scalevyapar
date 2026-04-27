import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/worker_models.dart';

class WorkerApiService {
  final http.Client _client;

  WorkerApiService({http.Client? client}) : _client = client ?? http.Client();

  Uri _uri(String path) => Uri.parse('${ApiConfig.baseUrl}$path');

  Future<String> requestOtp(String mobile) async {
    final response = await _client.post(
      _uri('/api/labour/worker/auth/request-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'mobile': mobile}),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to request OTP');
    }

    return data['otpCode'] as String? ?? '';
  }

  Future<(String, WorkerDashboardModel)> verifyOtp(String mobile, String otpCode) async {
    final response = await _client.post(
      _uri('/api/labour/worker/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'mobile': mobile, 'otpCode': otpCode}),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to verify OTP');
    }

    return (
      data['token'] as String? ?? '',
      WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>)
    );
  }

  Future<WorkerDashboardModel> getDashboard(String token) async {
    final response = await _client.get(
      _uri('/api/labour/worker/dashboard'),
      headers: {'Authorization': 'Bearer $token'},
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
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

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update profile');
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

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to create recharge request');
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

    final data = jsonDecode(response.body) as Map<String, dynamic>;
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

    final data = jsonDecode(response.body) as Map<String, dynamic>;
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

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Failed to update notifications');
    }

    return WorkerDashboardModel.fromJson(data['dashboard'] as Map<String, dynamic>);
  }
}
