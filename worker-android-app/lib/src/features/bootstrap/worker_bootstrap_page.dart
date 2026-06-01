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
        child: Stack(
          children: [
            Positioned(
              top: -88,
              right: -64,
              child: Container(
                width: 220,
                height: 220,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0x14173C77), Color(0x0D2F6FDF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            Positioned(
              left: -34,
              bottom: -58,
              child: Container(
                width: 170,
                height: 170,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0x12FF8A00),
                ),
              ),
            ),
            Center(
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
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x14173C77),
                            blurRadius: 28,
                            offset: Offset(0, 16),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Image.asset(
                        'assets/images/rozgar-logo-round.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      'Rozgar by ScaleVyapar',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF102A43),
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Loading your worker dashboard...',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF52606D),
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      width: 72,
                      height: 4,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF173C77), Color(0xFFFF8A00)],
                        ),
                      ),
                    ),
                    const SizedBox(height: 34),
                    const SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF173C77)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
