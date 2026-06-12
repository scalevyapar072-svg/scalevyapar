import 'package:flutter/material.dart';

import '../../app.dart';
import '../../services/session_store.dart';
import 'otp_login_page.dart';

class WorkerLanguageSelectionPage extends StatefulWidget {
  const WorkerLanguageSelectionPage({super.key});

  @override
  State<WorkerLanguageSelectionPage> createState() => _WorkerLanguageSelectionPageState();
}

class _WorkerLanguageSelectionPageState extends State<WorkerLanguageSelectionPage> {
  final _sessionStore = SessionStore();
  String _selectedCode = 'en';

  @override
  void initState() {
    super.initState();
    _loadSavedLanguage();
  }

  Future<void> _loadSavedLanguage() async {
    final saved = await _sessionStore.getLanguageCode();
    if (!mounted || saved == null || saved.isEmpty) return;
    setState(() => _selectedCode = saved);
  }

  Future<void> _continue() async {
    await WorkerLanguageScope.of(context).setLocale(Locale(_selectedCode));
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const OtpLoginPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final options = <_LanguageOption>[
      _LanguageOption(
        code: 'en',
        title: 'English',
        subtitle: 'Continue in English',
        supported: true,
      ),
      _LanguageOption(
        code: 'hi',
        title: '\u0939\u093f\u0928\u094d\u0926\u0940',
        subtitle: '\u0939\u093f\u0928\u094d\u0926\u0940 \u092e\u0947\u0902 \u0906\u0917\u0947 \u092c\u0922\u093c\u0947\u0902',
        supported: true,
      ),
      _LanguageOption(
        code: 'mr',
        title: '\u092e\u0930\u093e\u0920\u0940',
        subtitle: 'Coming soon',
        supported: false,
      ),
      _LanguageOption(
        code: 'kn',
        title: '\u0c95\u0ca8\u0ccd\u0ca8\u0ca1',
        subtitle: 'Coming soon',
        supported: false,
      ),
    ];

    final selected = options.firstWhere(
      (item) => item.code == _selectedCode,
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
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/rozgar_logo.jpg',
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          const Text(
                            'Hello!\n\u0928\u092e\u0938\u094d\u0924\u0947!\n\u0bb5\u0ba3\u0b95\u0bcd\u0b95\u0bae\u0bcd!',
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
                    const Text(
                      'Select Language',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w400,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Job information will be shown in this language.',
                      style: TextStyle(
                        fontSize: 18,
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
                            padding: const EdgeInsets.only(bottom: 12),
                            child: InkWell(
                              onTap: option.supported
                                  ? () => setState(() => _selectedCode = option.code)
                                  : null,
                              borderRadius: BorderRadius.circular(18),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(18),
                                  color: isSelected ? const Color(0xFF2447D5) : Colors.transparent,
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
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          Text(
                                            option.title,
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                              fontSize: 20,
                                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                                              color: isSelected
                                                  ? Colors.white
                                                  : option.supported
                                                      ? const Color(0xFF111827)
                                                      : const Color(0xFF9CA3AF),
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
                                                    : const Color(0xFF9CA3AF),
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
                  onPressed: _continue,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2447D5),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    _selectedCode == 'hi' ? '\u0939\u093f\u0928\u094d\u0926\u0940 \u091a\u0941\u0928\u0947\u0902' : 'SELECT ${selected.title.toUpperCase()}',
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
  final bool supported;

  const _LanguageOption({
    required this.code,
    required this.title,
    required this.subtitle,
    required this.supported,
  });
}
