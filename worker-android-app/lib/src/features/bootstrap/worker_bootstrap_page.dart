import 'package:flutter/material.dart';

import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../auth/otp_login_page.dart';
import '../auth/worker_registration_page.dart';
import '../home/worker_home_page.dart';

class WorkerBootstrapPage extends StatefulWidget {
  const WorkerBootstrapPage({super.key});

  @override
  State<WorkerBootstrapPage> createState() => _WorkerBootstrapPageState();
}

class _WorkerBootstrapPageState extends State<WorkerBootstrapPage> {
  final _sessionStore = SessionStore();
  final _apiService = WorkerApiService();

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final token = await _sessionStore.getToken();
    if (!mounted) return;

    if (token == null || token.isEmpty) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const OtpLoginPage()),
      );
      return;
    }

    try {
      final dashboard = await _apiService.getDashboard(token);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => dashboard.profile.isRegistrationComplete
              ? WorkerHomePage(initialToken: token, initialDashboard: dashboard)
              : WorkerRegistrationPage(token: token, dashboard: dashboard),
        ),
      );
    } catch (_) {
      await _sessionStore.clear();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const OtpLoginPage()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1F314C),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 26,
                        offset: const Offset(0, 14),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(14),
                  child: Image.asset(
                    'assets/images/rozgar-logo-round.png',
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 34),
                const Text(
                  'Rozgar',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 38,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Loading your worker dashboard...',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFFD9E5FF),
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 34),
                const SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
