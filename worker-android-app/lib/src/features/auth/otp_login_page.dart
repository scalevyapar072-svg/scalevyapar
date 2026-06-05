import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../localization/worker_localizations.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../../services/worker_push_service.dart';
import '../home/worker_home_page.dart';
import 'worker_registration_page.dart';

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
  bool _otpSent = false;
  String _error = '';

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
      await _apiService.requestOtp(mobile);
      if (!mounted) return;
      setState(() {
        _otpSent = true;
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

  InputDecoration _lineFieldDecoration({
    required String hintText,
    required IconData icon,
  }) {
    return InputDecoration(
      isDense: true,
      filled: false,
      hintText: hintText,
      hintStyle: const TextStyle(
        color: Color(0xFF94A3B8),
        fontSize: 16,
      ),
      prefixIcon: Icon(icon, color: const Color(0xFF173C77), size: 22),
      prefixIconConstraints: const BoxConstraints(minWidth: 36),
      contentPadding: const EdgeInsets.only(bottom: 12, top: 12),
      enabledBorder: const UnderlineInputBorder(
        borderSide: BorderSide(color: Color(0xFFCBD5E1), width: 1.3),
      ),
      focusedBorder: const UnderlineInputBorder(
        borderSide: BorderSide(color: Color(0xFF2447D5), width: 2),
      ),
    );
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
    final helperText = l10n.isHindi
        ? 'मैं T&C और Privacy Policy से सहमत हूँ, और कॉल, WhatsApp, SMS और Emails के माध्यम से employers द्वारा संपर्क किए जाने की सहमति देता/देती हूँ।'
        : 'I agree to T&C and Privacy Policy, and provide consent to be contacted by employers via call, WhatsApp, SMS, and Emails.';
    final referralText = l10n.isHindi ? 'क्या आपके पास referral code है?' : 'Have a referral code?';
    final hireStaffText = l10n.isHindi ? 'स्टाफ hire करना है? यहाँ क्लिक करें' : 'Looking to hire staff? Click Here';
    final subtitle = _otpSent ? 'Verify your OTP' : 'Enter Phone Number';
    final heading = _otpSent ? 'Verify Your Phone with OTP' : 'Enter Phone Number';
    final description = _otpSent
        ? 'We have sent a code to your mobile number.'
        : 'Enter your mobile number to receive the login OTP.';
    final busy = _requestingOtp || _verifyingOtp;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 44),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 430),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        Center(
                          child: Container(
                            width: 146,
                            height: 146,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x14000000),
                                  blurRadius: 22,
                                  offset: Offset(0, 10),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(14),
                            child: Image.asset(
                              'assets/images/rozgar-logo-round.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
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
                        const SizedBox(height: 8),
                        Center(
                          child: Text(
                            subtitle,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFF475569),
                              fontSize: 18,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(height: 34),
                        Text(
                          heading,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          description,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 16,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 28),
                        TextField(
                          controller: _mobileController,
                          readOnly: _otpSent,
                          keyboardType: TextInputType.phone,
                          decoration: _lineFieldDecoration(
                            hintText: _otpSent ? _mobileController.text.trim() : 'Phone Number',
                            icon: Icons.phone_android_rounded,
                          ),
                        ),
                        if (_otpSent) ...[
                          const SizedBox(height: 20),
                          TextField(
                            controller: _otpController,
                            keyboardType: TextInputType.number,
                            decoration: _lineFieldDecoration(
                              hintText: 'OTP Code',
                              icon: Icons.password_rounded,
                            ),
                          ),
                        ],
                        if (_error.isNotEmpty) ...[
                          const SizedBox(height: 18),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
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
                        ],
                        const SizedBox(height: 28),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: busy ? null : (_otpSent ? _verifyOtp : _requestOtp),
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFF1E32D0),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Text(
                              _otpSent
                                  ? (_verifyingOtp ? l10n.verifying : 'Verify OTP')
                                  : (_requestingOtp ? l10n.requestingOtp : 'Request OTP'),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Checkbox(
                              value: _acceptedTerms,
                              onChanged: (value) {
                                setState(() => _acceptedTerms = value ?? true);
                              },
                              activeColor: const Color(0xFF1E32D0),
                              visualDensity: VisualDensity.compact,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Text(
                                  helperText,
                                  style: const TextStyle(
                                    color: Color(0xFF475569),
                                    fontSize: 14,
                                    height: 1.55,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
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
              ),
            );
          },
        ),
      ),
    );
  }
}
