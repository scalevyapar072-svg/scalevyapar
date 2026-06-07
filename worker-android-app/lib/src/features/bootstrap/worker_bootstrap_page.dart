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
    final savedToken = await _sessionStore.getToken();
    final pendingToken = await _sessionStore.getPendingToken();
    final token = (savedToken != null && savedToken.isNotEmpty)
        ? savedToken
        : (pendingToken ?? '');
    if (!mounted) return;

    if (token.isEmpty) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const OtpLoginPage()),
      );
      return;
    }

    if (savedToken == null || savedToken.isEmpty) {
      await _sessionStore.saveToken(token);
    }

    try {
      final dashboard = await _apiService.getDashboard(token);
      if (!mounted) return;
      if (dashboard.profile.isRegistrationComplete) {
        await _sessionStore.clearPendingToken();
      }
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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                SizedBox(
                  width: 220,
                  height: 220,
                  child: Image(
                    image: AssetImage('assets/images/rozgar-logo-startup.png'),
                    fit: BoxFit.contain,
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
