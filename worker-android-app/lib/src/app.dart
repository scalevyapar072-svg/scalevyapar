import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'features/bootstrap/worker_bootstrap_page.dart';
import 'localization/worker_localizations.dart';
import 'services/session_store.dart';

class WorkerApp extends StatefulWidget {
  const WorkerApp({super.key});

  @override
  State<WorkerApp> createState() => _WorkerAppState();
}

class _WorkerAppState extends State<WorkerApp> {
  final _sessionStore = SessionStore();
  Locale _locale = const Locale('hi');

  @override
  void initState() {
    super.initState();
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final savedCode = await _sessionStore.getLanguageCode();
    if (!mounted || savedCode == null || savedCode.isEmpty) {
      return;
    }

    setState(() {
      _locale = Locale(savedCode);
    });
  }

  Future<void> _setLocale(Locale locale) async {
    await _sessionStore.saveLanguageCode(locale.languageCode);
    if (!mounted) return;
    setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF173C77),
      primary: const Color(0xFF173C77),
      secondary: const Color(0xFF2F6FDF),
      surface: Colors.white,
    );

    return MaterialApp(
      title: WorkerLocalizations(_locale).appTitle,
      debugShowCheckedModeBanner: false,
      locale: _locale,
      supportedLocales: WorkerLocalizations.supportedLocales,
      localizationsDelegates: const [
        WorkerLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        colorScheme: colorScheme,
        scaffoldBackgroundColor: const Color(0xFFF4F7FB),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: false,
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          surfaceTintColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Color(0xFFD9E2EC)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Color(0xFFD9E2EC)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Color(0xFF173C77), width: 1.4),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          indicatorColor: const Color(0x1A2F6FDF),
          labelTextStyle: WidgetStateProperty.all(
            const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF173C77),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF173C77),
            side: const BorderSide(color: Color(0xFFD9E2EC)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
      builder: (context, child) => WorkerLanguageScope(
        locale: _locale,
        setLocale: _setLocale,
        child: child ?? const SizedBox.shrink(),
      ),
      home: const WorkerBootstrapPage(),
    );
  }
}

class WorkerLanguageScope extends InheritedWidget {
  final Locale locale;
  final Future<void> Function(Locale locale) setLocale;

  const WorkerLanguageScope({
    super.key,
    required this.locale,
    required this.setLocale,
    required super.child,
  });

  static WorkerLanguageScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<WorkerLanguageScope>();
    assert(scope != null, 'WorkerLanguageScope not found in widget tree.');
    return scope!;
  }

  Future<void> toggleLocale() {
    return setLocale(locale.languageCode == 'hi' ? const Locale('en') : const Locale('hi'));
  }

  @override
  bool updateShouldNotify(covariant WorkerLanguageScope oldWidget) {
    return oldWidget.locale != locale;
  }
}
