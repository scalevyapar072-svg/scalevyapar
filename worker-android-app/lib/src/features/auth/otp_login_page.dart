import 'package:flutter/material.dart';

import '../../app.dart';
import '../../localization/worker_localizations.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../../services/worker_push_service.dart';
import 'worker_registration_page.dart';
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

  Future<void> _requestOtp() async {
    final mobile = _mobileController.text.trim();
    if (mobile.length != 10) {
      if (!mounted) return;
      setState(() => _error = WorkerLocalizations.of(context).invalidMobileNumberError);
      return;
    }

    setState(() {
      _requestingOtp = true;
      _error = '';
    });

    try {
      final otp = await _apiService.requestOtp(mobile);
      if (!mounted) return;
      setState(() {
        _otpSent = true;
        _hintOtp = otp;
        _otpController.clear();
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
    if (_otpController.text.trim().length != 6) {
      if (!mounted) return;
      setState(() => _error = WorkerLocalizations.of(context).invalidOtpError);
      return;
    }

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
      await WorkerPushService.instance.attachWorkerSession(token);
      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => result.$2.profile.isRegistrationComplete
              ? WorkerHomePage(initialToken: token, initialDashboard: result.$2)
              : WorkerRegistrationPage(token: token, dashboard: result.$2),
        ),
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
  void dispose() {
    _mobileController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final languageScope = WorkerLanguageScope.of(context);
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0E254A), Color(0xFF173C77), Color(0xFFF4F7FB)],
            stops: [0, 0.34, 0.34],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            l10n.loginHeroTitle,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              height: 1.1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton(
                          onPressed: languageScope.toggleLocale,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Color(0x66D7E4FF)),
                            backgroundColor: const Color(0x14000000),
                          ),
                          child: Text(l10n.switchLanguage),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      l10n.loginHeroSubtitle,
                      style: TextStyle(
                        color: Color(0xFFD7E4FF),
                        fontSize: 15,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _HeroChip(label: l10n.otpMobileLogin),
                        _HeroChip(label: l10n.dailyWalletTracking),
                        _HeroChip(label: l10n.matchingJobFeed),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
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
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _otpSent ? l10n.verifyYourOtp : l10n.workerLogin,
                                        style: const TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _otpSent
                                            ? l10n.otpSentDescription
                                            : l10n.enterMobileDescription,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: Color(0xFF64748B),
                                          height: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            _StepIndicator(activeStep: _otpSent ? 2 : 1),
                            const SizedBox(height: 20),
                            TextField(
                              controller: _mobileController,
                              keyboardType: TextInputType.phone,
                              decoration: InputDecoration(
                                labelText: l10n.mobileNumber,
                                hintText: l10n.enterTenDigitMobile,
                                prefixIcon: const Icon(Icons.phone_android_rounded),
                              ),
                            ),
                            const SizedBox(height: 14),
                            if (_otpSent) ...[
                              TextField(
                                controller: _otpController,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  labelText: l10n.otpCode,
                                  hintText: l10n.enterOtp,
                                  prefixIcon: const Icon(Icons.password_rounded),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  color: const Color(0xFFF0F6FF),
                                  border: Border.all(color: const Color(0xFFD3E4FF)),
                                ),
                                child: Text(
                                  l10n.demoOtpForTesting(_hintOtp),
                                  style: const TextStyle(
                                    color: Color(0xFF173C77),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],
                            if (_error.isNotEmpty) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(14),
                                  color: const Color(0xFFFEF2F2),
                                  border: Border.all(color: const Color(0xFFFECACA)),
                                ),
                                child: Text(
                                  _error,
                                  style: const TextStyle(
                                    color: Color(0xFFB91C1C),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: _requestingOtp ? null : _requestOtp,
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  child: Text(_requestingOtp ? l10n.requestingOtp : l10n.requestOtp),
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
                                    child: Text(_verifyingOtp ? l10n.verifying : l10n.verifyOtp),
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 18),
                            const Divider(height: 1),
                            const SizedBox(height: 18),
                            Text(
                              l10n.demoSeededWorkers,
                              style: TextStyle(fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${l10n.activeWorkerLine}\n${l10n.walletEmptyWorkerLine}',
                              style: TextStyle(color: Color(0xFF475569), height: 1.7),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  final String label;

  const _HeroChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: const Color(0x1FD7E4FF),
        border: Border.all(color: const Color(0x33D7E4FF)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int activeStep;

  const _StepIndicator({required this.activeStep});

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    return Row(
      children: [
        _StepBubble(number: 1, active: activeStep >= 1, label: l10n.mobile),
        Expanded(
          child: Container(
            height: 2,
            color: activeStep >= 2 ? const Color(0xFF2F6FDF) : const Color(0xFFE2E8F0),
          ),
        ),
        _StepBubble(number: 2, active: activeStep >= 2, label: l10n.otp),
      ],
    );
  }
}

class _StepBubble extends StatelessWidget {
  final int number;
  final bool active;
  final String label;

  const _StepBubble({
    required this.number,
    required this.active,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? const Color(0xFF173C77) : const Color(0xFFF8FAFC),
            border: Border.all(
              color: active ? const Color(0xFF173C77) : const Color(0xFFD9E2EC),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            '$number',
            style: TextStyle(
              color: active ? Colors.white : const Color(0xFF64748B),
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            color: active ? const Color(0xFF173C77) : const Color(0xFF64748B),
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
