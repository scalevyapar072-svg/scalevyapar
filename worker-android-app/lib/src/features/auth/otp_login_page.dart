import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

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
  bool _acceptedTerms = true;
  String _error = '';
  String _hintOtp = '';
  bool _otpSent = false;

  Future<void> _openCompanySite() async {
    final uri = Uri.parse('https://www.scalevyapar.in/labour/company');
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open company website.')),
      );
    }
  }

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
    final heading = _otpSent ? 'Verify your OTP' : 'Enter Phone Number';
    final introTitle = _otpSent ? 'Verify Your Phone with OTP' : 'Enter Phone Number';
    final introSubtitle = _otpSent
        ? 'We have sent a code to your mobile number.'
        : 'Enter your mobile number to receive the login OTP.';
    final termsText = l10n.isHindi
        ? 'मैं T&C और Privacy Policy से सहमत हूँ, और कॉल, WhatsApp, SMS और Emails के माध्यम से employers द्वारा संपर्क किए जाने की सहमति देता/देती हूँ।'
        : 'I agree to T&C and Privacy Policy, and provide consent to be contacted by employers via call, WhatsApp, SMS, and Emails.';
    final referralText = l10n.isHindi ? 'क्या आपके पास referral code है?' : 'Have a referral code?';
    final hireStaffText = l10n.isHindi ? 'स्टाफ hire करना है? यहाँ क्लिक करें' : 'Looking to hire staff? Click Here';
    return Scaffold(
      backgroundColor: Colors.white,
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF8FAFD), Color(0xFFF8FAFD), Color(0xFFEFF4FB)],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight - 36),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 440),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Align(
                            alignment: Alignment.topRight,
                            child: OutlinedButton(
                              onPressed: languageScope.toggleLocale,
                              child: Text(l10n.switchLanguage),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: SizedBox(
                              width: 152,
                              height: 152,
                              child: Image.asset(
                                'assets/images/rozgar-logo-square.png',
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Center(
                            child: Text(
                              'Rozgar',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF102A43),
                                fontSize: 30,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Center(
                            child: Text(
                              heading,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Color(0xFF425466),
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                height: 1.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    introTitle,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF102A43),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    introSubtitle,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF64748B),
                                      height: 1.5,
                                    ),
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
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      color: const Color(0xFFF8FAFC),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Checkbox(
                                          value: _acceptedTerms,
                                          onChanged: (value) {
                                            setState(() => _acceptedTerms = value ?? true);
                                          },
                                          visualDensity: VisualDensity.compact,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            termsText,
                                            style: const TextStyle(
                                              color: Color(0xFF475569),
                                              height: 1.55,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Center(
                                    child: TextButton(
                                      onPressed: () {},
                                      child: Text(referralText),
                                    ),
                                  ),
                                  Center(
                                    child: TextButton(
                                      onPressed: _openCompanySite,
                                      child: Text(hireStaffText),
                                    ),
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
              );
            },
          ),
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
