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
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                SizedBox(
                  width: 144,
                  height: 144,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Color(0x14173C77),
                          blurRadius: 24,
                          offset: Offset(0, 14),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(14),
                      child: Image(
                        image: AssetImage('assets/images/rozgar-logo-round.png'),
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 26),
                Text(
                  'Rozgar by ScaleVyapar',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF102A43),
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 16),
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(Color(0xFF173C77)),
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
