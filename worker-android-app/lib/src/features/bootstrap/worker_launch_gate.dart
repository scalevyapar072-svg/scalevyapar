import 'dart:async';

import 'package:flutter/material.dart';

import '../../app.dart';
import '../../localization/worker_localizations.dart';
import '../../services/session_store.dart';

enum _LaunchGateStep { splash, language, done }

const _launchLanguageOptions = <_LaunchLanguageOption>[
  _LaunchLanguageOption(
    code: 'hi-en',
    title: 'Hindi + English',
    effectiveLocaleCode: 'en',
    buttonLabel: 'SELECT HINDI + ENGLISH',
  ),
  _LaunchLanguageOption(
    code: 'en',
    title: 'English',
    effectiveLocaleCode: 'en',
    buttonLabel: 'SELECT ENGLISH',
  ),
  _LaunchLanguageOption(
    code: 'hi',
    title: 'हिन्दी',
    effectiveLocaleCode: 'hi',
    buttonLabel: 'हिन्दी चुनें',
  ),
  _LaunchLanguageOption(
    code: 'mr',
    title: 'मराठी',
    effectiveLocaleCode: 'en',
    buttonLabel: 'SELECT मराठी',
  ),
  _LaunchLanguageOption(
    code: 'kn',
    title: 'ಕನ್ನಡ',
    effectiveLocaleCode: 'en',
    buttonLabel: 'SELECT ಕನ್ನಡ',
  ),
];

class WorkerLaunchGate extends StatefulWidget {
  final Widget child;

  const WorkerLaunchGate({
    super.key,
    required this.child,
  });

  @override
  State<WorkerLaunchGate> createState() => _WorkerLaunchGateState();
}

class _WorkerLaunchGateState extends State<WorkerLaunchGate> {
  static const _splashDuration = Duration(milliseconds: 1800);
  final _sessionStore = SessionStore();

  _LaunchGateStep _step = _LaunchGateStep.splash;
  late String _selectedCode;

  @override
  void initState() {
    super.initState();
    _selectedCode = 'en';
    _startSplashTimer();
  }

  void _startSplashTimer() {
    unawaited(
      Future<void>.delayed(_splashDuration, () async {
        if (!mounted || _step != _LaunchGateStep.splash) {
          return;
        }
        final savedCode = await _sessionStore.getLanguageCode();
        if (!mounted || _step != _LaunchGateStep.splash) {
          return;
        }
        final normalizedCode = savedCode?.trim().toLowerCase();
        if (normalizedCode == 'hi' || normalizedCode == 'en') {
          _selectedCode = normalizedCode!;
          setState(() => _step = _LaunchGateStep.done);
          return;
        }
        setState(() => _step = _LaunchGateStep.language);
      }),
    );
  }

  _LaunchLanguageOption _selectedOption() {
    return _launchLanguageOptions.firstWhere(
      (option) => option.code == _selectedCode,
      orElse: () => _launchLanguageOptions.first,
    );
  }

  Future<void> _completeLanguageChoice() async {
    final selected = _selectedOption();
    final setLocaleFuture = WorkerLanguageScope.of(
      context,
    ).setLocale(Locale(selected.effectiveLocaleCode));
    if (!mounted) {
      return;
    }
    setState(() => _step = _LaunchGateStep.done);
    await setLocaleFuture;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);

    if (_step == _LaunchGateStep.done) {
      return widget.child;
    }

    return Material(
      color: Colors.white,
      child: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 220),
          child: _step == _LaunchGateStep.splash
              ? const _LaunchSplashView()
              : _LaunchLanguageView(
                  selectedCode: _selectedCode,
                  onChanged: (value) => setState(() => _selectedCode = value),
                  onContinue: _completeLanguageChoice,
                  continueLabel: _selectedOption().buttonLabel,
                  loadingLabel: l10n.loadingDashboard,
                ),
        ),
      ),
    );
  }
}

class _LaunchSplashView extends StatelessWidget {
  const _LaunchSplashView();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0E3A69),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              SizedBox(
                width: 196,
                height: 196,
                child: Image(
                  image: AssetImage('assets/images/rozgar-logo-startup.png'),
                  fit: BoxFit.contain,
                ),
              ),
              SizedBox(height: 28),
              Text(
                'Rozgar',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                ),
              ),
              SizedBox(height: 12),
              Text(
                'Loading your worker dashboard...',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFFE2E8F0),
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 28),
              SizedBox(
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
    );
  }
}

class _LaunchLanguageView extends StatefulWidget {
  final String selectedCode;
  final ValueChanged<String> onChanged;
  final Future<void> Function() onContinue;
  final String continueLabel;
  final String loadingLabel;

  const _LaunchLanguageView({
    required this.selectedCode,
    required this.onChanged,
    required this.onContinue,
    required this.continueLabel,
    required this.loadingLabel,
  });

  @override
  State<_LaunchLanguageView> createState() => _LaunchLanguageViewState();
}

class _LaunchLanguageViewState extends State<_LaunchLanguageView> {
  bool _submitting = false;

  Future<void> _handleContinue() async {
    if (_submitting) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await widget.onContinue();
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 214,
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Color(0xFF2447D5),
                                Color(0xFFF7F8FD),
                              ],
                              stops: [0, 0.74],
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: -44,
                        right: -44,
                        bottom: 0,
                        child: Container(
                          height: 84,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.vertical(
                              top: Radius.elliptical(420, 78),
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 18,
                        top: 24,
                        child: Container(
                          width: 108,
                          height: 108,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(32),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x22173C77),
                                blurRadius: 22,
                                offset: Offset(0, 12),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.accessibility_new_rounded,
                            color: Color(0xFF2447D5),
                            size: 60,
                          ),
                        ),
                      ),
                      const Positioned(
                        top: 24,
                        left: 144,
                        right: 6,
                        child: Text(
                          'Hello!\nनमस्ते!\nவணக்கம்!',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w300,
                            height: 1.24,
                            color: Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Select Language',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w400,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Job information will be seen in this language.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFF6B7280),
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(26),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: _launchLanguageOptions.map((option) {
                      final isSelected = option.code == widget.selectedCode;
                      return Padding(
                        padding: EdgeInsets.only(
                          bottom: option == _launchLanguageOptions.last ? 0 : 12,
                        ),
                        child: InkWell(
                          onTap: () => widget.onChanged(option.code),
                          borderRadius: BorderRadius.circular(18),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 18,
                              vertical: 14,
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
                                  child: Text(
                                    option.title,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 19,
                                      fontWeight: isSelected
                                          ? FontWeight.w800
                                          : FontWeight.w500,
                                      color: isSelected
                                          ? Colors.white
                                          : const Color(0xFF111827),
                                    ),
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
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _submitting ? null : _handleContinue,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2447D5),
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                _submitting ? widget.loadingLabel : widget.continueLabel,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _LaunchLanguageOption {
  final String code;
  final String title;
  final String effectiveLocaleCode;
  final String buttonLabel;

  const _LaunchLanguageOption({
    required this.code,
    required this.title,
    required this.effectiveLocaleCode,
    required this.buttonLabel,
  });
}
