import 'package:flutter/material.dart';

import '../../app.dart';
import '../../localization/worker_localizations.dart';
import '../../models/worker_models.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../home/worker_home_page.dart';
import 'otp_login_page.dart';
import 'worker_registration_page.dart';

class WorkerLaunchLanguagePage extends StatefulWidget {
  const WorkerLaunchLanguagePage({super.key});

  @override
  State<WorkerLaunchLanguagePage> createState() =>
      _WorkerLaunchLanguagePageState();
}

class _WorkerLaunchLanguagePageState extends State<WorkerLaunchLanguagePage> {
  final _sessionStore = SessionStore();
  final _apiService = WorkerApiService();

  String _selectedCode = 'hi';
  bool _continuing = false;

  @override
  void initState() {
    super.initState();
    _loadSavedLanguage();
  }

  Future<void> _loadSavedLanguage() async {
    final saved = await _sessionStore.getLanguageCode();
    if (!mounted || saved == null || saved.isEmpty) {
      return;
    }
    setState(() => _selectedCode = saved);
  }

  Future<void> _continue() async {
    if (_continuing) {
      return;
    }

    setState(() => _continuing = true);
    await WorkerLanguageScope.of(context).setLocale(Locale(_selectedCode));
    if (!mounted) {
      return;
    }

    final token = await _sessionStore.getToken();
    if (!mounted) {
      return;
    }

    if (token == null || token.trim().isEmpty) {
      _openOtpLogin();
      return;
    }

    try {
      final dashboard = await _apiService.getDashboard(token);
      if (!mounted) {
        return;
      }
      _openResolvedRoute(token, dashboard);
    } catch (_) {
      if (!mounted) {
        return;
      }
      _openOtpLogin();
    }
  }

  void _openOtpLogin() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const OtpLoginPage()),
    );
  }

  void _openResolvedRoute(String token, WorkerDashboardModel dashboard) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => dashboard.profile.isRegistrationComplete
            ? WorkerHomePage(
                initialToken: token,
                initialDashboard: dashboard,
              )
            : WorkerRegistrationPage(
                token: token,
                dashboard: dashboard,
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final options = const <_LanguageOption>[
      _LanguageOption(
        code: 'en',
        title: 'English',
        subtitle: 'Continue in English',
      ),
      _LanguageOption(
        code: 'hi',
        title: 'हिंदी',
        subtitle: 'हिंदी में आगे बढ़ें',
      ),
    ];

    final selected = options.firstWhere(
      (option) => option.code == _selectedCode,
      orElse: () => options.first,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 22, 24, 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 132,
                            height: 132,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFF3F6FB),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x14000000),
                                  blurRadius: 20,
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
                          const SizedBox(height: 18),
                          const Text(
                            'Hello!\nनमस्ते!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 38,
                              fontWeight: FontWeight.w300,
                              height: 1.25,
                              color: Color(0xFF4B5563),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      _selectedCode == 'hi'
                          ? 'भाषा चुनें'
                          : 'Select Language',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w400,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _selectedCode == 'hi'
                          ? 'Rozgar ऐप में उपयोग करने के लिए अपनी भाषा चुनें।'
                          : 'Choose the language you want to use in Rozgar.',
                      style: const TextStyle(
                        fontSize: 17,
                        color: Color(0xFF6B7280),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 22),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(26),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Column(
                        children: options.map((option) {
                          final isSelected = option.code == _selectedCode;
                          return Padding(
                            padding: EdgeInsets.only(
                              bottom: option == options.last ? 0 : 12,
                            ),
                            child: InkWell(
                              onTap: () =>
                                  setState(() => _selectedCode = option.code),
                              borderRadius: BorderRadius.circular(18),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 18,
                                ),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(18),
                                  color: isSelected
                                      ? const Color(0xFF2447D5)
                                      : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF2447D5)
                                        : const Color(0xFFE5E7EB),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.center,
                                        children: [
                                          Text(
                                            option.title,
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                              fontSize: 20,
                                              fontWeight: isSelected
                                                  ? FontWeight.w800
                                                  : FontWeight.w500,
                                              color: isSelected
                                                  ? Colors.white
                                                  : const Color(0xFF111827),
                                            ),
                                          ),
                                          if (option.subtitle.isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            Text(
                                              option.subtitle,
                                              textAlign: TextAlign.center,
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: isSelected
                                                    ? const Color(0xFFDDE6FF)
                                                    : const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (isSelected)
                                      const Icon(
                                        Icons.check_rounded,
                                        color: Colors.white,
                                        size: 26,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _continuing ? null : _continue,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2447D5),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    _continuing
                        ? l10n.loadingDashboard
                        : (_selectedCode == 'hi'
                            ? 'हिंदी चुनें'
                            : 'SELECT ${selected.title.toUpperCase()}'),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguageOption {
  final String code;
  final String title;
  final String subtitle;

  const _LanguageOption({
    required this.code,
    required this.title,
    required this.subtitle,
  });
}
