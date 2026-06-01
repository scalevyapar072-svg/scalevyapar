import 'dart:async';

import 'package:flutter/material.dart';

import '../../app.dart';
import '../../localization/worker_localizations.dart';
import '../../services/session_store.dart';

enum _LaunchGateStep { splash, language, done }

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
    _selectedCode = WidgetsBinding.instance.platformDispatcher.locale
        .languageCode
        .toLowerCase()
        .startsWith('hi')
        ? 'hi'
        : 'en';
    _startSplashTimer();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final localeCode = WorkerLanguageScope.of(context).locale.languageCode;
    if (_step != _LaunchGateStep.done) {
      _selectedCode = localeCode.toLowerCase().startsWith('hi') ? 'hi' : 'en';
    }
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

  Future<void> _completeLanguageChoice() async {
    final setLocaleFuture =
        WorkerLanguageScope.of(context).setLocale(Locale(_selectedCode));
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
          color: _step == _LaunchGateStep.splash
              ? const Color(0xFF1F314C)
              : Colors.white,
          child: SafeArea(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              child: _step == _LaunchGateStep.splash
                  ? const _LaunchSplashView()
                  : _LaunchLanguageView(
                      selectedCode: _selectedCode,
                      onChanged: (value) =>
                          setState(() => _selectedCode = value),
                      onContinue: _completeLanguageChoice,
                      continueLabel: _selectedCode == 'hi'
                          ? 'हिंदी चुनें'
                          : 'SELECT ${_selectedCode.toUpperCase()}',
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
    return Center(
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
                    blurRadius: 30,
                    offset: const Offset(0, 18),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(14),
              child: Image.asset(
                'assets/images/rozgar-logo-round.png',
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'ScaleVyapar',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Rozgar',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 38,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Find work. Trusted hiring.',
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
    const options = <({String code, String title, String subtitle})>[
      (
        code: 'en',
        title: 'English',
        subtitle: 'Continue in English',
      ),
      (
        code: 'hi',
        title: 'हिंदी',
        subtitle: 'हिंदी में आगे बढ़ें',
      ),
    ];

    return Column(
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
                  widget.selectedCode == 'hi' ? 'भाषा चुनें' : 'Select Language',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w400,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.selectedCode == 'hi'
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
                      final isSelected = option.code == widget.selectedCode;
                      return Padding(
                        padding: EdgeInsets.only(
                          bottom: option == options.last ? 0 : 12,
                        ),
                        child: InkWell(
                          onTap: () => widget.onChanged(option.code),
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
              onPressed: _submitting ? null : _handleContinue,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2447D5),
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                _submitting ? widget.loadingLabel : widget.continueLabel,
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
    );
  }
}
