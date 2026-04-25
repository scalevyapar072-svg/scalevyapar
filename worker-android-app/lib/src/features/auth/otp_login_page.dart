import 'package:flutter/material.dart';

import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../home/worker_home_page.dart';

class OtpLoginPage extends StatefulWidget {
  const OtpLoginPage({super.key});

  @override
  State<OtpLoginPage> createState() => _OtpLoginPageState();
}

class _OtpLoginPageState extends State<OtpLoginPage> {
  final _mobileController = TextEditingController();
  final _otpController = TextEditingController();
  final _apiService = WorkerApiService();
  final _sessionStore = SessionStore();

  bool _requestingOtp = false;
  bool _verifyingOtp = false;
  String _error = '';
  String _hintOtp = '';
  bool _otpSent = false;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await _sessionStore.getToken();
    if (!mounted || token == null || token.isEmpty) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => WorkerHomePage(initialToken: token)),
    );
  }

  Future<void> _requestOtp() async {
    setState(() {
      _requestingOtp = true;
      _error = '';
    });

    try {
      final otp = await _apiService.requestOtp(_mobileController.text.trim());
      if (!mounted) return;
      setState(() {
        _otpSent = true;
        _hintOtp = otp;
      });
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _requestingOtp = false);
      }
    }
  }

  Future<void> _verifyOtp() async {
    setState(() {
      _verifyingOtp = true;
      _error = '';
    });

    try {
      final result = await _apiService.verifyOtp(
        _mobileController.text.trim(),
        _otpController.text.trim(),
      );
      final token = result.$1;
      await _sessionStore.saveToken(token);
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => WorkerHomePage(initialToken: token, initialDashboard: result.$2)),
      );
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _verifyingOtp = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF173C77), Color(0xFF2F6FDF)],
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'LX',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text(
                        'Worker App Login',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Login with mobile number and OTP. For this MVP, the backend uses a demo OTP so you can test the app flow quickly.',
                        style: TextStyle(fontSize: 14, color: Color(0xFF64748B), height: 1.6),
                      ),
                      const SizedBox(height: 24),
                      TextField(
                        controller: _mobileController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Mobile Number',
                          hintText: 'Enter 10-digit mobile number',
                        ),
                      ),
                      const SizedBox(height: 14),
                      if (_otpSent) ...[
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'OTP Code',
                            hintText: 'Enter OTP',
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Demo OTP: $_hintOtp',
                          style: const TextStyle(
                            color: Color(0xFF173C77),
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],
                      if (_error.isNotEmpty) ...[
                        Text(
                          _error,
                          style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 14),
                      ],
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _requestingOtp ? null : _requestOtp,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            child: Text(_requestingOtp ? 'Requesting OTP...' : 'Request OTP'),
                          ),
                        ),
                      ),
                      if (_otpSent) ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: _verifyingOtp ? null : _verifyOtp,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              child: Text(_verifyingOtp ? 'Verifying...' : 'Verify OTP'),
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                      const Text(
                        'Demo seeded worker numbers:',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        '9876543210 (active)\n9812345678 (wallet empty)',
                        style: TextStyle(color: Color(0xFF475569), height: 1.6),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
