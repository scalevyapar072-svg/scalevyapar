import 'dart:async';

import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../../app.dart';
import '../../localization/worker_localizations.dart';
import '../../models/worker_models.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../../services/worker_push_service.dart';
import '../auth/otp_login_page.dart';

class WorkerHomePage extends StatefulWidget {
  final String initialToken;
  final WorkerDashboardModel? initialDashboard;

  const WorkerHomePage({
    super.key,
    required this.initialToken,
    this.initialDashboard,
  });

  @override
  State<WorkerHomePage> createState() => _WorkerHomePageState();
}

class _WorkerHomePageState extends State<WorkerHomePage> {
  final _apiService = WorkerApiService();
  final _sessionStore = SessionStore();
  final _rechargeNoteController = TextEditingController();

  late String _token;
  StreamSubscription<RemoteMessage>? _pushMessagesSubscription;
  StreamSubscription<RemoteMessage>? _pushOpenedSubscription;
  WorkerDashboardModel? _dashboard;
  bool _loading = false;
  String _error = '';
  int _selectedIndex = 0;
  String _feedQuery = '';
  bool _showUnlockedOnly = false;
  bool _showSavedOnly = false;
  bool _showAppliedOnly = false;
  String _selectedCategoryFilter = 'all';
  String _selectedCityFilter = 'all';
  String _selectedWageBand = 'all';
  String _jobActionId = '';
  bool _notificationsLoading = false;
  bool _redirectingToLogin = false;

  @override
  void initState() {
    super.initState();
    _token = widget.initialToken;
    _dashboard = widget.initialDashboard;
    _attachPushNotifications();
    if (_dashboard == null) {
      _loadDashboard();
    }
  }

  @override
  void dispose() {
    _pushMessagesSubscription?.cancel();
    _pushOpenedSubscription?.cancel();
    _rechargeNoteController.dispose();
    super.dispose();
  }

  Future<void> _attachPushNotifications() async {
    await WorkerPushService.instance.attachWorkerSession(_token);
    _pushOpenedSubscription = WorkerPushService.instance.openedMessages.listen(_handleOpenedPushMessage);
    _pushMessagesSubscription = WorkerPushService.instance.messages.listen((_) {
      if (!mounted) {
        return;
      }
      _loadDashboard();
    });
    final initialOpenMessage = await WorkerPushService.instance.consumeInitialOpenMessage();
    if (initialOpenMessage != null && mounted) {
      unawaited(_handleOpenedPushMessage(initialOpenMessage));
    }
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      if (_dashboard == null) {
        _error = '';
      }
    });

    try {
      final dashboard = await _apiService.getDashboard(_token);
      if (!mounted) return;
      setState(() {
        _dashboard = dashboard;
        _error = '';
      });
    } catch (error) {
      if (!mounted) return;
      final message = _cleanError(error);
      if (await _handleSessionExpiryIfNeeded(message)) {
        return;
      }
      setState(() => _error = message);
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String _cleanError(Object error) => error.toString().replaceFirst('Exception: ', '');

  bool _isConnectivityError(String message) {
    final normalized = message.toLowerCase();
    return normalized.contains('failed host lookup') ||
        normalized.contains('socketexception') ||
        normalized.contains('connection refused') ||
        normalized.contains('connection closed') ||
        normalized.contains('network is unreachable') ||
        normalized.contains('timed out') ||
        normalized.contains('connection reset') ||
        normalized.contains('no address associated with hostname') ||
        normalized.contains('network') && normalized.contains('error');
  }

  bool get _showSyncIssueBanner => _dashboard != null && _error.trim().isNotEmpty;

  bool _isSessionError(String message) {
    final normalized = message.toLowerCase();
    return normalized.contains('unauthorized') ||
        normalized.contains('invalid token') ||
        normalized.contains('token expired') ||
        normalized.contains('session expired') ||
        normalized.contains('forbidden');
  }

  Future<void> _resetSessionAndGoToLogin(String message) async {
    if (_redirectingToLogin) {
      return;
    }
    _redirectingToLogin = true;
    await WorkerPushService.instance.detachWorkerSession(_token);
    await _sessionStore.clear();
    if (!mounted) {
      return;
    }
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => OtpLoginPage(initialMessage: message)),
      (route) => false,
    );
  }

  Future<bool> _handleSessionExpiryIfNeeded(String message) async {
    if (!_isSessionError(message)) {
      return false;
    }
    await _resetSessionAndGoToLogin(WorkerLocalizations.of(context).sessionExpiredMessage);
    return true;
  }

  Future<void> _logout() async {
    final l10n = WorkerLocalizations.of(context);
    final shouldLogout = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(l10n.logoutConfirmTitle),
            content: Text(l10n.logoutConfirmMessage),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(l10n.cancelAction),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: Text(l10n.logoutAction),
              ),
            ],
          ),
        ) ??
        false;
    if (!shouldLogout) {
      return;
    }
    await _resetSessionAndGoToLogin('');
  }

  Future<void> _saveProfile({
    required String fullName,
    required String city,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required double expectedDailyWage,
    required String availability,
  }) async {
    final l10n = WorkerLocalizations.of(context);
    setState(() => _loading = true);
    try {
      final dashboard = await _apiService.updateProfile(
        _token,
        fullName: fullName,
        city: city,
        categoryIds: categoryIds,
        skills: skills,
        experienceYears: experienceYears,
        expectedDailyWage: expectedDailyWage,
        availability: availability,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.profileUpdatedSuccessfully)),
      );
    } catch (error) {
      if (!mounted) return;
      final message = _cleanError(error);
      if (await _handleSessionExpiryIfNeeded(message)) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _requestRecharge() async {
    final l10n = WorkerLocalizations.of(context);
    setState(() => _loading = true);
    try {
      final dashboard = await _apiService.createRechargeRequest(
        _token,
        note: _rechargeNoteController.text.trim().isEmpty ? null : _rechargeNoteController.text.trim(),
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
      _rechargeNoteController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.rechargeRequestSent)),
      );
    } catch (error) {
      if (!mounted) return;
      final message = _cleanError(error);
      if (await _handleSessionExpiryIfNeeded(message)) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _applyToJob(String jobPostId) async {
    final l10n = WorkerLocalizations.of(context);
    setState(() => _jobActionId = jobPostId);
    try {
      final dashboard = await _apiService.applyToJob(
        _token,
        jobPostId: jobPostId,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.applicationSentSuccess)),
      );
    } catch (error) {
      if (!mounted) return;
      final message = _cleanError(error);
      if (await _handleSessionExpiryIfNeeded(message)) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _jobActionId = '');
      }
    }
  }

  Future<void> _toggleSavedJob(String jobPostId) async {
    setState(() => _jobActionId = jobPostId);
    try {
      final dashboard = await _apiService.toggleSavedJob(
        _token,
        jobPostId: jobPostId,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
    } catch (error) {
      if (!mounted) return;
      final message = _cleanError(error);
      if (await _handleSessionExpiryIfNeeded(message)) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _jobActionId = '');
      }
    }
  }

  Future<void> _markNotificationsRead({List<String>? notificationIds}) async {
    setState(() => _notificationsLoading = true);
    try {
      final dashboard = await _apiService.markNotificationsRead(
        _token,
        notificationIds: notificationIds,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
    } catch (error) {
      if (!mounted) return;
      final message = _cleanError(error);
      if (await _handleSessionExpiryIfNeeded(message)) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() => _notificationsLoading = false);
      }
    }
  }

  void _openJobDetails(WorkerFeedItemModel item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _JobDetailsPage(
          item: item,
          onApply: _applyToJob,
          onToggleSaved: _toggleSavedJob,
        ),
      ),
    );
  }

  void _openSavedJobs() {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _SavedJobsPage(
          items: dashboard.feed.where((item) => item.isSaved).toList(),
          onApply: _applyToJob,
          onToggleSaved: _toggleSavedJob,
        ),
      ),
    );
  }

  Future<void> _handleOpenedPushMessage(RemoteMessage message) async {
    final relatedJobPostId = message.data['relatedJobPostId']?.trim();

    await _loadDashboard();
    if (!mounted) {
      return;
    }

    if (relatedJobPostId != null && relatedJobPostId.isNotEmpty) {
      final dashboard = _dashboard;
      WorkerFeedItemModel? matchedItem;
      if (dashboard != null) {
        for (final item in dashboard.feed) {
          if (item.id == relatedJobPostId) {
            matchedItem = item;
            break;
          }
        }
      }
      if (matchedItem != null) {
        setState(() => _selectedIndex = 0);
        _openJobDetails(matchedItem);
        return;
      }
    }

    setState(() => _selectedIndex = 3);
  }

  List<WorkerFeedItemModel> get _filteredFeed {
    final dashboard = _dashboard;
    if (dashboard == null) return const [];

    return dashboard.feed.where((item) {
      final matchesQuery = _feedQuery.isEmpty ||
          item.title.toLowerCase().contains(_feedQuery.toLowerCase()) ||
          item.city.toLowerCase().contains(_feedQuery.toLowerCase()) ||
          item.categoryName.toLowerCase().contains(_feedQuery.toLowerCase());
      final matchesLock = !_showUnlockedOnly || !item.companyLocked;
      final matchesSaved = !_showSavedOnly || item.isSaved;
      final matchesApplied = !_showAppliedOnly || item.hasApplied;
      final matchesCategory = _selectedCategoryFilter == 'all' || item.categoryName == _selectedCategoryFilter;
      final matchesCity = _selectedCityFilter == 'all' || item.city == _selectedCityFilter;
      final matchesWage = _matchesWageBand(item.wageAmount, _selectedWageBand);
      return matchesQuery &&
          matchesLock &&
          matchesSaved &&
          matchesApplied &&
          matchesCategory &&
          matchesCity &&
          matchesWage;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = _dashboard;
    final l10n = WorkerLocalizations.of(context);
    final languageScope = WorkerLanguageScope.of(context);
    final loadingDashboardSubtitle = l10n.isHindi
        ? 'Wallet, feed aur alerts sync kiye ja rahe hain.'
        : 'Syncing your wallet, job feed, and alerts.';
    final offlineStateTitle = l10n.isHindi
        ? 'Internet connection abhi nahi mil raha'
        : 'You are offline right now';
    final offlineStateDescription = l10n.isHindi
        ? 'Network check karke phir se try karein.'
        : 'Check your internet connection and try again.';
    final dashboardUnavailableTitle = l10n.isHindi
        ? 'Dashboard abhi load nahi ho paya'
        : 'Dashboard is unavailable';
    final dashboardUnavailableDescription = l10n.isHindi
        ? 'Latest update abhi nahi mili. Thodi der baad phir se try karein.'
        : 'We could not load your latest worker data. Try again in a moment.';
    final offlineBannerTitle = l10n.isHindi
        ? 'Connection weak lag raha hai'
        : 'Connection looks unstable';
    final offlineBannerDescription = l10n.isHindi
        ? 'Abhi purana synced data dikh raha hai. Internet aate hi refresh karein.'
        : 'Showing the last synced data. Refresh again once your internet is back.';
    final syncIssueBannerTitle = l10n.isHindi
        ? 'Latest update sync nahi ho payi'
        : 'Latest update did not sync';
    final syncIssueBannerDescription = l10n.isHindi
        ? 'App abhi saved data dikha rahi hai. Dobara refresh karke latest data layen.'
        : 'The app is still usable with saved data. Refresh once more to fetch the newest updates.';

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 76,
        title: dashboard == null
            ? Text(l10n.appTitle)
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.appTitle,
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.welcomeUser(dashboard.profile.fullName),
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
        actions: [
          TextButton(
            onPressed: languageScope.toggleLocale,
            child: Text(l10n.switchLanguage),
          ),
          if (dashboard != null)
            IconButton(
              onPressed: _openSavedJobs,
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.bookmark_outline_rounded),
                  if (dashboard.feed.any((item) => item.isSaved))
                    Positioned(
                      right: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFF173C77),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${dashboard.feed.where((item) => item.isSaved).length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              tooltip: l10n.isHindi ? 'सेव्ड जॉब्स' : 'Saved jobs',
            ),
          if (dashboard != null)
            IconButton(
              onPressed: () => setState(() => _selectedIndex = 3),
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_none_rounded),
                  if (dashboard.unreadNotificationCount > 0)
                    Positioned(
                      right: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          dashboard.unreadNotificationCount > 9
                              ? '9+'
                              : '${dashboard.unreadNotificationCount}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          IconButton(
            onPressed: _loading ? null : _loadDashboard,
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: dashboard == null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: _DashboardStateCard(
                  loading: _loading,
                  title: _loading
                      ? l10n.loadingDashboard
                      : _isConnectivityError(_error)
                          ? offlineStateTitle
                          : dashboardUnavailableTitle,
                  description: _loading
                      ? loadingDashboardSubtitle
                      : _error.isNotEmpty
                          ? _error
                          : _isConnectivityError(_error)
                              ? offlineStateDescription
                              : dashboardUnavailableDescription,
                  icon: _loading
                      ? Icons.hourglass_top_rounded
                      : _isConnectivityError(_error)
                          ? Icons.wifi_off_rounded
                          : Icons.cloud_off_rounded,
                  actionLabel: _loading ? null : l10n.tryAgain,
                  onAction: _loading ? null : _loadDashboard,
                ),
              ),
            )
          : SafeArea(
              top: false,
              bottom: false,
              child: Column(
                children: [
                  if (_loading) const LinearProgressIndicator(minHeight: 2),
                  if (_showSyncIssueBanner)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      child: _SyncIssueBanner(
                        title: _isConnectivityError(_error)
                            ? offlineBannerTitle
                            : syncIssueBannerTitle,
                        description: _isConnectivityError(_error)
                            ? offlineBannerDescription
                            : syncIssueBannerDescription,
                        detail: _error,
                        icon: _isConnectivityError(_error)
                            ? Icons.wifi_find_rounded
                            : Icons.sync_problem_rounded,
                        actionLabel: l10n.tryAgain,
                        onAction: _loading ? null : _loadDashboard,
                      ),
                    ),
                  Expanded(
                    child: IndexedStack(
                      index: _selectedIndex,
                      children: [
                        _FeedTab(
                          dashboard: dashboard,
                          visibleJobsCount: _filteredFeed.where((item) => !item.companyLocked).length,
                          feed: _filteredFeed,
                          query: _feedQuery,
                          showUnlockedOnly: _showUnlockedOnly,
                          showSavedOnly: _showSavedOnly,
                          showAppliedOnly: _showAppliedOnly,
                          selectedCategoryFilter: _selectedCategoryFilter,
                          selectedCityFilter: _selectedCityFilter,
                          selectedWageBand: _selectedWageBand,
                          activeJobActionId: _jobActionId,
                          onRefresh: _loadDashboard,
                          onQueryChanged: (value) => setState(() => _feedQuery = value),
                          onToggleUnlockedOnly: (value) => setState(() => _showUnlockedOnly = value),
                          onToggleSavedOnly: (value) => setState(() => _showSavedOnly = value),
                          onToggleAppliedOnly: (value) => setState(() => _showAppliedOnly = value),
                          onCategoryFilterChanged: (value) => setState(() => _selectedCategoryFilter = value),
                          onCityFilterChanged: (value) => setState(() => _selectedCityFilter = value),
                          onWageBandChanged: (value) => setState(() => _selectedWageBand = value),
                          onClearFilters: () => setState(() {
                            _feedQuery = '';
                            _showUnlockedOnly = false;
                            _showSavedOnly = false;
                            _showAppliedOnly = false;
                            _selectedCategoryFilter = 'all';
                            _selectedCityFilter = 'all';
                            _selectedWageBand = 'all';
                          }),
                          onApply: _applyToJob,
                          onToggleSaved: _toggleSavedJob,
                          onOpenDetails: _openJobDetails,
                        ),
                        _WalletTab(
                          dashboard: dashboard,
                          rechargeNoteController: _rechargeNoteController,
                          onRequestRecharge: _requestRecharge,
                          onRefresh: _loadDashboard,
                          loading: _loading,
                        ),
                        _ProfileTab(
                          dashboard: dashboard,
                          onSave: _saveProfile,
                          onRefresh: _loadDashboard,
                          loading: _loading,
                        ),
                        _NotificationsTab(
                          notifications: dashboard.notifications,
                          loading: _notificationsLoading,
                          onRefresh: _loadDashboard,
                          onMarkAllRead: () => _markNotificationsRead(),
                          onMarkRead: (notificationId) => _markNotificationsRead(
                            notificationIds: [notificationId],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.work_outline_rounded),
            selectedIcon: Icon(Icons.work_rounded),
            label: l10n.feed,
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet_rounded),
            label: l10n.wallet,
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: l10n.profile,
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: l10n.alerts,
          ),
        ],
      ),
    );
  }
}

class _TopSummarySection extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final int visibleJobsCount;

  const _TopSummarySection({
    required this.dashboard,
    required this.visibleJobsCount,
  });

  @override
  Widget build(BuildContext context) {
    final profile = dashboard.profile;
    final activation = dashboard.activation;
    final l10n = WorkerLocalizations.of(context);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF173C77), Color(0xFF2859B3), Color(0xFF2F6FDF)],
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22173C77),
                  blurRadius: 24,
                  offset: Offset(0, 14),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile.city.isEmpty
                                ? (l10n.isHindi ? 'अपना शहर जोड़ें' : 'Set your city')
                                : profile.city,
                            style: const TextStyle(
                              color: Color(0xFFD7E4FF),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _activationHeadline(l10n, activation),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _activationDescription(l10n, activation),
                            style: const TextStyle(
                              color: Color(0xFFE6EEFF),
                              height: 1.6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _StatusBadge(status: activation.status),
                  ],
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _SummaryChip(
                      label: l10n.wallet,
                      value: 'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}',
                    ),
                    _SummaryChip(
                      label: l10n.jobs,
                      value: l10n.unlockedJobsCount(visibleJobsCount),
                    ),
                    _SummaryChip(
                      label: l10n.wage,
                      value: 'Rs ${profile.expectedDailyWage.toStringAsFixed(0)}',
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _MiniStatCard(
                  label: l10n.dailyDeduction,
                  value: 'Rs ${dashboard.wallet.dailyCharge.toStringAsFixed(0)}',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MiniStatCard(
                  label: l10n.estimatedDaysLeft,
                  value: '${dashboard.wallet.estimatedDaysRemaining}',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeedTab extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final int visibleJobsCount;
  final List<WorkerFeedItemModel> feed;
  final String query;
  final bool showUnlockedOnly;
  final bool showSavedOnly;
  final bool showAppliedOnly;
  final String selectedCategoryFilter;
  final String selectedCityFilter;
  final String selectedWageBand;
  final String activeJobActionId;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<bool> onToggleUnlockedOnly;
  final ValueChanged<bool> onToggleSavedOnly;
  final ValueChanged<bool> onToggleAppliedOnly;
  final ValueChanged<String> onCategoryFilterChanged;
  final ValueChanged<String> onCityFilterChanged;
  final ValueChanged<String> onWageBandChanged;
  final VoidCallback onClearFilters;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;
  final ValueChanged<WorkerFeedItemModel> onOpenDetails;

  const _FeedTab({
    required this.dashboard,
    required this.visibleJobsCount,
    required this.feed,
    required this.query,
    required this.showUnlockedOnly,
    required this.showSavedOnly,
    required this.showAppliedOnly,
    required this.selectedCategoryFilter,
    required this.selectedCityFilter,
    required this.selectedWageBand,
    required this.activeJobActionId,
    required this.onRefresh,
    required this.onQueryChanged,
    required this.onToggleUnlockedOnly,
    required this.onToggleSavedOnly,
    required this.onToggleAppliedOnly,
    required this.onCategoryFilterChanged,
    required this.onCityFilterChanged,
    required this.onWageBandChanged,
    required this.onClearFilters,
    required this.onApply,
    required this.onToggleSaved,
    required this.onOpenDetails,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final categoryOptions = <String>{
      ...dashboard.feed.map((item) => item.categoryName).where((item) => item.trim().isNotEmpty),
    }.toList()
      ..sort();
    final cityOptions = <String>{
      ...dashboard.feed.map((item) => item.city).where((item) => item.trim().isNotEmpty),
    }.toList()
      ..sort();
    final activeFilters = <String>[
      if (query.trim().isNotEmpty) 'Search: $query',
      if (selectedCategoryFilter != 'all') 'Category: $selectedCategoryFilter',
      if (selectedCityFilter != 'all') 'City: $selectedCityFilter',
      if (selectedWageBand == 'lt700') 'Wage: Below Rs 700',
      if (selectedWageBand == '700to999') 'Wage: Rs 700 - 999',
      if (selectedWageBand == '1000plus') 'Wage: Rs 1000+',
      if (showUnlockedOnly) 'Unlocked only',
      if (showSavedOnly) 'Saved only',
      if (showAppliedOnly) 'Applied only',
    ];

    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        children: [
        _TopSummarySection(
          dashboard: dashboard,
          visibleJobsCount: visibleJobsCount,
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.matchingJobFeedTitle,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.matchingJobFeedSubtitle,
                  style: const TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  initialValue: query,
                  onChanged: onQueryChanged,
                  decoration: InputDecoration(
                    labelText: l10n.searchJobs,
                    hintText: l10n.searchJobsHint,
                    prefixIcon: const Icon(Icons.search_rounded),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        l10n.isHindi ? 'एडवांस फ़िल्टर' : 'Advanced filters',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                    TextButton(
                      onPressed: onClearFilters,
                      child: Text(l10n.isHindi ? 'साफ़ करें' : 'Clear'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: selectedCategoryFilter,
                  items: [
                    DropdownMenuItem(
                      value: 'all',
                      child: Text(l10n.isHindi ? 'सभी कैटेगरी' : 'All categories'),
                    ),
                    ...categoryOptions.map(
                      (category) => DropdownMenuItem(
                        value: category,
                        child: Text(category),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      onCategoryFilterChanged(value);
                    }
                  },
                  decoration: InputDecoration(
                    labelText: l10n.isHindi ? 'कैटेगरी फ़िल्टर' : 'Category filter',
                    prefixIcon: const Icon(Icons.category_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedCityFilter,
                  items: [
                    DropdownMenuItem(
                      value: 'all',
                      child: Text(l10n.isHindi ? 'सभी शहर' : 'All cities'),
                    ),
                    ...cityOptions.map(
                      (city) => DropdownMenuItem(
                        value: city,
                        child: Text(city),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      onCityFilterChanged(value);
                    }
                  },
                  decoration: InputDecoration(
                    labelText: l10n.isHindi ? 'शहर फ़िल्टर' : 'City filter',
                    prefixIcon: const Icon(Icons.location_on_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedWageBand,
                  items: [
                    DropdownMenuItem(
                      value: 'all',
                      child: Text(l10n.isHindi ? 'सभी वेतन' : 'All wages'),
                    ),
                    DropdownMenuItem(
                      value: 'lt700',
                      child: Text(l10n.isHindi ? 'Rs 700 से कम' : 'Below Rs 700'),
                    ),
                    DropdownMenuItem(
                      value: '700to999',
                      child: Text(l10n.isHindi ? 'Rs 700 - 999' : 'Rs 700 - 999'),
                    ),
                    DropdownMenuItem(
                      value: '1000plus',
                      child: Text(l10n.isHindi ? 'Rs 1000+' : 'Rs 1000+'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      onWageBandChanged(value);
                    }
                  },
                  decoration: InputDecoration(
                    labelText: l10n.isHindi ? 'वेतन फ़िल्टर' : 'Wage filter',
                    prefixIcon: const Icon(Icons.currency_rupee_rounded),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilterChip(
                      selected: showUnlockedOnly,
                      onSelected: onToggleUnlockedOnly,
                      label: Text(l10n.isHindi ? 'सिर्फ़ अनलॉक' : 'Unlocked only'),
                    ),
                    FilterChip(
                      selected: showSavedOnly,
                      onSelected: onToggleSavedOnly,
                      label: Text(l10n.isHindi ? 'सिर्फ़ सेव्ड' : 'Saved only'),
                    ),
                    FilterChip(
                      selected: showAppliedOnly,
                      onSelected: onToggleAppliedOnly,
                      label: Text(l10n.isHindi ? 'सिर्फ़ अप्लाइड' : 'Applied only'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  l10n.isHindi
                      ? 'फ़िल्टर रिज़ल्ट: ${feed.length} जॉब'
                      : 'Filtered results: ${feed.length} jobs',
                  style: const TextStyle(
                    color: Color(0xFF173C77),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (activeFilters.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Active filters',
                                style: const TextStyle(
                                  color: Color(0xFF173C77),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            TextButton(
                              onPressed: onClearFilters,
                              child: const Text('Clear all'),
                            ),
                          ],
                        ),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: activeFilters
                              .map(
                                (filter) => Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCEAFE),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text(
                                    filter,
                                    style: const TextStyle(
                                      color: Color(0xFF173C77),
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: dashboard.profile.categoryLabels
                      .map((label) => _chip(label, fill: const Color(0xFFF0F6FF)))
                      .toList(),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (feed.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Text(
                l10n.noJobsMatchMessage,
                style: const TextStyle(color: Color(0xFF475569), height: 1.6),
              ),
            ),
          )
        else
          ...feed.map(
            (item) {
              final actionLoading = activeJobActionId == item.id;
              return Card(
                margin: const EdgeInsets.only(bottom: 14),
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.title,
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${item.city} | ${l10n.isHindi ? 'समाप्ति' : 'Expires'} ${_shortDate(context, item.expiresAt)}',
                                  style: const TextStyle(color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              IconButton.outlined(
                                onPressed: actionLoading ? null : () => onToggleSaved(item.id),
                                icon: Icon(
                                  item.isSaved ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                                ),
                                tooltip: item.isSaved ? l10n.removeFromShortlist : l10n.saveJob,
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0F6FF),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: const Color(0xFFD3E4FF)),
                                ),
                                child: Text(
                                  'Rs ${item.wageAmount.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    color: Color(0xFF173C77),
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        item.description,
                        style: const TextStyle(color: Color(0xFF475569), height: 1.6),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _chip(item.categoryName),
                          _chip(l10n.workersNeeded(item.workersNeeded)),
                          _chip(l10n.localizeMatchReason(item.matchReason)),
                          if (item.isSaved) _chip(l10n.saved, fill: const Color(0xFFF0FDF4)),
                          if (item.hasApplied)
                            _chip(
                              item.applicationStatus == null
                                  ? l10n.appliedWithoutStatus
                                  : l10n.appliedStatusLabel(item.applicationStatus!),
                              fill: const Color(0xFFEFF6FF),
                            ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => onOpenDetails(item),
                              icon: const Icon(Icons.open_in_new_rounded),
                              label: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Text(l10n.isHindi ? 'पूरा विवरण' : 'View details'),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton.tonal(
                              onPressed: item.hasApplied || actionLoading ? null : () => onApply(item.id),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                child: Text(
                                  actionLoading
                                      ? l10n.working
                                      : item.hasApplied
                                          ? l10n.applicationSent
                                          : l10n.applyToJob,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          color: item.companyLocked ? const Color(0xFFFFF7E6) : const Color(0xFFF8FAFC),
                          border: Border.all(
                            color: item.companyLocked ? const Color(0xFFF7D8A5) : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: item.companyLocked
                            ? Text(
                                l10n.companyLockedMessage,
                                style: const TextStyle(
                                  color: Color(0xFF92400E),
                                  fontWeight: FontWeight.w700,
                                  height: 1.6,
                                ),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.companyName, style: const TextStyle(fontWeight: FontWeight.w800)),
                                  const SizedBox(height: 6),
                                  Text(
                                    l10n.contactPerson(item.contactPerson ?? '-'),
                                    style: const TextStyle(color: Color(0xFF475569)),
                                  ),
                                  Text(
                                    l10n.companyMobile(item.companyMobile ?? '-'),
                                    style: const TextStyle(color: Color(0xFF475569)),
                                  ),
                                  Text(
                                    l10n.companyCity(item.companyCity),
                                    style: const TextStyle(color: Color(0xFF475569)),
                                  ),
                                ],
                              ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  static Widget _chip(String label, {Color fill = const Color(0xFFF8FAFC)}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _JobDetailsPage extends StatefulWidget {
  final WorkerFeedItemModel item;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;

  const _JobDetailsPage({
    required this.item,
    required this.onApply,
    required this.onToggleSaved,
  });

  @override
  State<_JobDetailsPage> createState() => _JobDetailsPageState();
}

class _JobDetailsPageState extends State<_JobDetailsPage> {
  late bool _isSaved;
  late bool _hasApplied;
  late String? _applicationStatus;
  bool _actionLoading = false;

  @override
  void initState() {
    super.initState();
    _isSaved = widget.item.isSaved;
    _hasApplied = widget.item.hasApplied;
    _applicationStatus = widget.item.applicationStatus;
  }

  Future<void> _handleSaveToggle() async {
    setState(() => _actionLoading = true);
    try {
      await widget.onToggleSaved(widget.item.id);
      if (!mounted) return;
      setState(() => _isSaved = !_isSaved);
    } finally {
      if (mounted) {
        setState(() => _actionLoading = false);
      }
    }
  }

  Future<void> _handleApply() async {
    setState(() => _actionLoading = true);
    try {
      await widget.onApply(widget.item.id);
      if (!mounted) return;
      setState(() {
        _hasApplied = true;
        _applicationStatus ??= 'submitted';
      });
    } finally {
      if (mounted) {
        setState(() => _actionLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final item = widget.item;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.isHindi ? 'जॉब डिटेल्स' : 'Job details'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF173C77), Color(0xFF2859B3), Color(0xFF2F6FDF)],
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22173C77),
                  blurRadius: 24,
                  offset: Offset(0, 14),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.city,
                  style: const TextStyle(
                    color: Color(0xFFD7E4FF),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  item.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.isHindi
                      ? 'यह जॉब ${_shortDate(context, item.expiresAt)} तक खुली है और ${item.workersNeeded} वर्कर चाहिए।'
                      : 'This job is open until ${_shortDate(context, item.expiresAt)} and needs ${item.workersNeeded} workers.',
                  style: const TextStyle(
                    color: Color(0xFFE6EEFF),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _SummaryChip(
                      label: l10n.wage,
                      value: 'Rs ${item.wageAmount.toStringAsFixed(0)}',
                    ),
                    _SummaryChip(
                      label: l10n.jobs,
                      value: l10n.workersNeeded(item.workersNeeded),
                    ),
                    _SummaryChip(
                      label: l10n.isHindi ? 'मैच' : 'Match',
                      value: l10n.localizeMatchReason(item.matchReason),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.isHindi ? 'जॉब ओवरव्यू' : 'Job overview',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _FeedTab._chip(item.categoryName),
                      _FeedTab._chip(l10n.workersNeeded(item.workersNeeded)),
                      _FeedTab._chip(l10n.localizeMatchReason(item.matchReason)),
                      if (_isSaved) _FeedTab._chip(l10n.saved, fill: const Color(0xFFF0FDF4)),
                      if (_hasApplied)
                        _FeedTab._chip(
                          _applicationStatus == null
                              ? l10n.appliedWithoutStatus
                              : l10n.appliedStatusLabel(_applicationStatus!),
                          fill: const Color(0xFFEFF6FF),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    item.description,
                    style: const TextStyle(color: Color(0xFF475569), height: 1.7),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.isHindi ? 'कंपनी डिटेल्स' : 'Company details',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 14),
                  if (item.companyLocked)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: const Color(0xFFFFF7E6),
                        border: Border.all(color: const Color(0xFFF7D8A5)),
                      ),
                      child: Text(
                        l10n.companyLockedMessage,
                        style: const TextStyle(
                          color: Color(0xFF92400E),
                          fontWeight: FontWeight.w700,
                          height: 1.6,
                        ),
                      ),
                    )
                  else
                    Column(
                      children: [
                        _ProfileInfoTile(
                          label: l10n.isHindi ? 'कंपनी' : 'Company',
                          value: item.companyName,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _ProfileInfoTile(
                                label: l10n.isHindi ? 'संपर्क व्यक्ति' : 'Contact person',
                                value: item.contactPerson ?? '-',
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _ProfileInfoTile(
                                label: l10n.isHindi ? 'मोबाइल' : 'Mobile',
                                value: item.companyMobile ?? '-',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _ProfileInfoTile(
                          label: l10n.isHindi ? 'कंपनी शहर' : 'Company city',
                          value: item.companyCity,
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.isHindi ? 'जॉब एक्टिविटी' : 'Job activity',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _ProfileInfoTile(
                          label: l10n.isHindi ? 'पोस्ट की गई' : 'Published',
                          value: _shortDate(context, item.publishedAt),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ProfileInfoTile(
                          label: l10n.isHindi ? 'समाप्ति' : 'Expires',
                          value: _shortDate(context, item.expiresAt),
                        ),
                      ),
                    ],
                  ),
                  if (item.appliedAt != null) ...[
                    const SizedBox(height: 12),
                    _ProfileInfoTile(
                      label: l10n.isHindi ? 'अप्लाई किया गया' : 'Applied on',
                      value: _shortDate(context, item.appliedAt!),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _actionLoading ? null : _handleSaveToggle,
                  icon: Icon(
                    _isSaved ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                  ),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(_isSaved ? l10n.removeFromShortlist : l10n.saveJob),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _hasApplied || _actionLoading ? null : _handleApply,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(
                      _actionLoading
                          ? l10n.working
                          : _hasApplied
                              ? l10n.applicationSent
                              : l10n.applyToJob,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SavedJobsPage extends StatefulWidget {
  final List<WorkerFeedItemModel> items;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;

  const _SavedJobsPage({
    required this.items,
    required this.onApply,
    required this.onToggleSaved,
  });

  @override
  State<_SavedJobsPage> createState() => _SavedJobsPageState();
}

class _SavedJobsPageState extends State<_SavedJobsPage> {
  late List<WorkerFeedItemModel> _items;
  String _actionJobId = '';

  @override
  void initState() {
    super.initState();
    _items = List<WorkerFeedItemModel>.from(widget.items);
  }

  Future<void> _handleApply(String jobPostId) async {
    setState(() => _actionJobId = jobPostId);
    try {
      await widget.onApply(jobPostId);
      if (!mounted) return;
      setState(() {
        _items = _items
            .map(
              (item) => item.id == jobPostId
                  ? WorkerFeedItemModel(
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      city: item.city,
                      wageAmount: item.wageAmount,
                      workersNeeded: item.workersNeeded,
                      categoryName: item.categoryName,
                      companyLocked: item.companyLocked,
                      companyName: item.companyName,
                      companyCity: item.companyCity,
                      contactPerson: item.contactPerson,
                      companyMobile: item.companyMobile,
                      publishedAt: item.publishedAt,
                      expiresAt: item.expiresAt,
                      matchReason: item.matchReason,
                      hasApplied: true,
                      applicationStatus: item.applicationStatus ?? 'submitted',
                      isSaved: item.isSaved,
                      appliedAt: item.appliedAt,
                    )
                  : item,
            )
            .toList();
      });
    } finally {
      if (mounted) {
        setState(() => _actionJobId = '');
      }
    }
  }

  Future<void> _handleToggleSaved(String jobPostId) async {
    setState(() => _actionJobId = jobPostId);
    try {
      await widget.onToggleSaved(jobPostId);
      if (!mounted) return;
      setState(() {
        _items.removeWhere((item) => item.id == jobPostId);
      });
    } finally {
      if (mounted) {
        setState(() => _actionJobId = '');
      }
    }
  }

  void _openDetails(WorkerFeedItemModel item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _JobDetailsPage(
          item: item,
          onApply: _handleApply,
          onToggleSaved: _handleToggleSaved,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final unlockedCount = _items.where((item) => !item.companyLocked).length;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.isHindi ? 'सेव्ड जॉब्स' : 'Saved jobs'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF173C77), Color(0xFF2859B3), Color(0xFF2F6FDF)],
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x22173C77),
                  blurRadius: 24,
                  offset: Offset(0, 14),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.isHindi ? 'आपकी शॉर्टलिस्ट' : 'Your shortlist',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.isHindi
                      ? 'सेव की गई जॉब्स को एक जगह से देखें, तुलना करें और सही समय पर अप्लाई करें।'
                      : 'Review your saved jobs in one place, compare them, and apply when you are ready.',
                  style: const TextStyle(
                    color: Color(0xFFE6EEFF),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _SummaryChip(
                      label: l10n.jobs,
                      value: '${_items.length}',
                    ),
                    _SummaryChip(
                      label: l10n.isHindi ? 'अनलॉक' : 'Unlocked',
                      value: '$unlockedCount',
                    ),
                    _SummaryChip(
                      label: l10n.isHindi ? 'अप्लाइड' : 'Applied',
                      value: '${_items.where((item) => item.hasApplied).length}',
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_items.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Text(
                  l10n.isHindi
                      ? 'अभी कोई सेव्ड जॉब नहीं है। फीड से जॉब सेव करें और वह यहाँ दिखाई देगी।'
                      : 'No saved jobs yet. Save jobs from the feed and they will appear here.',
                  style: const TextStyle(color: Color(0xFF475569), height: 1.6),
                ),
              ),
            )
          else
            ..._items.map(
              (item) {
                final actionLoading = _actionJobId == item.id;
                return Card(
                  margin: const EdgeInsets.only(bottom: 14),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.title,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${item.city} | ${item.categoryName}',
                                    style: const TextStyle(color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0F6FF),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFD3E4FF)),
                              ),
                              child: Text(
                                'Rs ${item.wageAmount.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  color: Color(0xFF173C77),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          item.description,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Color(0xFF475569), height: 1.6),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _FeedTab._chip(l10n.localizeMatchReason(item.matchReason)),
                            _FeedTab._chip(
                              item.companyLocked
                                  ? (l10n.isHindi ? 'कंपनी लॉक' : 'Company locked')
                                  : (l10n.isHindi ? 'कंपनी खुली' : 'Company unlocked'),
                            ),
                            if (item.hasApplied)
                              _FeedTab._chip(
                                item.applicationStatus == null
                                    ? l10n.appliedWithoutStatus
                                    : l10n.appliedStatusLabel(item.applicationStatus!),
                                fill: const Color(0xFFEFF6FF),
                              ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _openDetails(item),
                                icon: const Icon(Icons.open_in_new_rounded),
                                label: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  child: Text(l10n.isHindi ? 'पूरा विवरण' : 'View details'),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton(
                                onPressed: item.hasApplied || actionLoading ? null : () => _handleApply(item.id),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  child: Text(
                                    actionLoading
                                        ? l10n.working
                                        : item.hasApplied
                                            ? l10n.applicationSent
                                            : l10n.applyToJob,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: actionLoading ? null : () => _handleToggleSaved(item.id),
                            icon: const Icon(Icons.bookmark_remove_outlined),
                            label: Text(l10n.removeFromShortlist),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _NotificationsTab extends StatelessWidget {
  final List<WorkerNotificationModel> notifications;
  final bool loading;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onMarkAllRead;
  final Future<void> Function(String notificationId) onMarkRead;

  const _NotificationsTab({
    required this.notifications,
    required this.loading,
    required this.onRefresh,
    required this.onMarkAllRead,
    required this.onMarkRead,
  });

  @override
  Widget build(BuildContext context) {
    final unreadCount = notifications.where((item) => !item.isRead).length;
    final l10n = WorkerLocalizations.of(context);

    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.notificationsTitle,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  unreadCount == 0
                      ? l10n.allCaughtUpMessage
                      : l10n.unreadNotifications(unreadCount),
                  style: const TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: loading || unreadCount == 0 ? null : onMarkAllRead,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(loading ? l10n.updating : l10n.markAllAsRead),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (notifications.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Text(
                l10n.notificationsEmpty,
                style: const TextStyle(color: Color(0xFF475569), height: 1.6),
              ),
            ),
          )
        else
          ...notifications.map(
            (notification) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                leading: CircleAvatar(
                  backgroundColor: notification.isRead ? const Color(0xFFF1F5F9) : const Color(0xFFE0EBFF),
                  child: Icon(
                    switch (notification.type) {
                      'application_submitted' => Icons.send_rounded,
                      'job_saved' => Icons.bookmark_rounded,
                      'application_status' => Icons.fact_check_rounded,
                      _ => Icons.notifications_active_rounded,
                    },
                    color: notification.isRead ? const Color(0xFF64748B) : const Color(0xFF173C77),
                  ),
                ),
                title: Text(
                  l10n.localizeNotificationTitle(notification.type, notification.title),
                  style: TextStyle(
                    fontWeight: notification.isRead ? FontWeight.w700 : FontWeight.w900,
                  ),
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    '${l10n.localizeNotificationMessage(type: notification.type, message: notification.message)}\n${_shortDate(context, notification.createdAt)} - ${_prettyText(context, notification.priority)} ${l10n.isHindi ? 'प्राथमिकता' : 'priority'}',
                    style: const TextStyle(height: 1.5),
                  ),
                ),
                trailing: notification.isRead
                    ? null
                    : TextButton(
                        onPressed: loading ? null : () => onMarkRead(notification.id),
                        child: Text(l10n.markRead),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WalletTab extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final TextEditingController rechargeNoteController;
  final Future<void> Function() onRequestRecharge;
  final Future<void> Function() onRefresh;
  final bool loading;

  const _WalletTab({
    required this.dashboard,
    required this.rechargeNoteController,
    required this.onRequestRecharge,
    required this.onRefresh,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.walletActivation,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.walletActivationSubtitle,
                  style: const TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0E254A), Color(0xFF173C77)],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.currentBalance,
                        style: const TextStyle(color: Color(0xFFD7E4FF)),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _walletVisibilityRule(l10n, dashboard),
                        style: const TextStyle(color: Color(0xFFE6EEFF), height: 1.6),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _MiniStatCard(
                        label: l10n.dailyDeduction,
                        value: 'Rs ${dashboard.wallet.dailyCharge.toStringAsFixed(0)}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MiniStatCard(
                        label: l10n.estimatedActiveDays,
                        value: '${dashboard.wallet.estimatedDaysRemaining}',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _MiniStatCard(
                        label: l10n.isHindi ? 'रजिस्ट्रेशन फीस (एक बार)' : 'Registration fee (one time)',
                        value: 'Rs ${dashboard.wallet.registrationFee.toStringAsFixed(0)}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MiniStatCard(
                        label: l10n.isHindi ? 'फीस स्टेटस' : 'Fee status',
                        value: dashboard.wallet.registrationFeePaid
                            ? (l10n.isHindi ? 'Paid' : 'Paid')
                            : (l10n.isHindi ? 'Pending' : 'Pending'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: rechargeNoteController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: l10n.rechargeNoteForAdmin,
                    hintText: l10n.rechargeNoteHint,
                    prefixIcon: const Icon(Icons.note_alt_outlined),
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: loading ? null : onRequestRecharge,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(loading ? l10n.sendingRequest : l10n.requestRecharge),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          l10n.rechargeHistory,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        ...dashboard.wallet.transactions.map(
          (transaction) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              title: Text(_prettyText(context, transaction.transactionType)),
              subtitle: Text(
                transaction.note.isEmpty ? transaction.reference : transaction.note,
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${transaction.direction == 'debit' ? '-' : '+'} Rs ${transaction.amount.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: transaction.direction == 'debit'
                          ? const Color(0xFFB91C1C)
                          : const Color(0xFF166534),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${_prettyText(context, transaction.status)} | ${_shortDate(context, transaction.createdAt)}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
          ),
        ),
        ],
      ),
    );
  }
}

class _ProfileTab extends StatefulWidget {
  final WorkerDashboardModel dashboard;
  final Future<void> Function({
    required String fullName,
    required String city,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required double expectedDailyWage,
    required String availability,
  }) onSave;
  final Future<void> Function() onRefresh;
  final bool loading;

  const _ProfileTab({
    required this.dashboard,
    required this.onSave,
    required this.onRefresh,
    required this.loading,
  });

  @override
  State<_ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<_ProfileTab> {
  late TextEditingController _nameController;
  late TextEditingController _cityController;
  late TextEditingController _experienceController;
  late TextEditingController _wageController;
  late TextEditingController _skillsController;
  late List<String> _selectedCategories;
  late String _availability;

  @override
  void initState() {
    super.initState();
    _hydrateFromDashboard();
  }

  @override
  void didUpdateWidget(covariant _ProfileTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.dashboard.profile.fullName != widget.dashboard.profile.fullName ||
        oldWidget.dashboard.profile.city != widget.dashboard.profile.city ||
        oldWidget.dashboard.profile.status != widget.dashboard.profile.status ||
        oldWidget.dashboard.profile.walletBalance != widget.dashboard.profile.walletBalance ||
        oldWidget.dashboard.profile.skills.join(',') != widget.dashboard.profile.skills.join(',') ||
        oldWidget.dashboard.profile.categoryIds.join(',') !=
            widget.dashboard.profile.categoryIds.join(',') ||
        oldWidget.dashboard.profile.availability != widget.dashboard.profile.availability ||
        oldWidget.dashboard.profile.expectedDailyWage !=
            widget.dashboard.profile.expectedDailyWage ||
        oldWidget.dashboard.profile.experienceYears !=
            widget.dashboard.profile.experienceYears) {
      _syncControllersFromDashboard();
    }
  }

  void _hydrateFromDashboard() {
    _nameController = TextEditingController(text: widget.dashboard.profile.fullName);
    _cityController = TextEditingController(text: widget.dashboard.profile.city);
    _experienceController = TextEditingController(
      text: widget.dashboard.profile.experienceYears.toStringAsFixed(0),
    );
    _wageController = TextEditingController(
      text: widget.dashboard.profile.expectedDailyWage.toStringAsFixed(0),
    );
    _skillsController = TextEditingController(text: widget.dashboard.profile.skills.join(', '));
    _selectedCategories = [...widget.dashboard.profile.categoryIds];
    _availability = widget.dashboard.profile.availability;
  }

  void _syncControllersFromDashboard() {
    _nameController.text = widget.dashboard.profile.fullName;
    _cityController.text = widget.dashboard.profile.city;
    _experienceController.text = widget.dashboard.profile.experienceYears.toStringAsFixed(0);
    _wageController.text = widget.dashboard.profile.expectedDailyWage.toStringAsFixed(0);
    _skillsController.text = widget.dashboard.profile.skills.join(', ');
    _selectedCategories = [...widget.dashboard.profile.categoryIds];
    _availability = widget.dashboard.profile.availability;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _experienceController.dispose();
    _wageController.dispose();
    _skillsController.dispose();
    super.dispose();
  }

  void _submit() {
    final l10n = WorkerLocalizations.of(context);
    if (_nameController.text.trim().isEmpty) {
      _showMessage(l10n.fullNameRequired);
      return;
    }
    if (_cityController.text.trim().isEmpty) {
      _showMessage(l10n.cityRequired);
      return;
    }
    if (_selectedCategories.isEmpty) {
      _showMessage(l10n.categoryRequired);
      return;
    }
    widget.onSave(
      fullName: _nameController.text.trim(),
      city: _cityController.text.trim(),
      categoryIds: _selectedCategories,
      skills: _skillsController.text
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList(),
      experienceYears: double.tryParse(_experienceController.text.trim()) ?? 0,
      expectedDailyWage: double.tryParse(_wageController.text.trim()) ?? 0,
      availability: _availability,
    );
  }

  void _showMessage(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.dashboard.profile;
    final l10n = WorkerLocalizations.of(context);

    return RefreshIndicator.adaptive(
      onRefresh: widget.onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.workerProfile,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.workerProfileSubtitle,
                  style: const TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: _ProfileInfoTile(
                        label: l10n.mobile,
                        value: profile.mobile,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ProfileInfoTile(
                        label: l10n.isHindi ? 'स्थिति' : 'Status',
                        value: _prettyText(context, profile.status),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: l10n.fullName,
                    prefixIcon: const Icon(Icons.person_outline_rounded),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _cityController,
                  decoration: InputDecoration(
                    labelText: l10n.city,
                    prefixIcon: const Icon(Icons.location_city_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _experienceController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: l10n.experienceYears,
                          prefixIcon: const Icon(Icons.workspace_premium_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _wageController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: l10n.expectedDailyWage,
                          prefixIcon: const Icon(Icons.currency_rupee_rounded),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _skillsController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: l10n.skills,
                    hintText: l10n.skillsHint,
                    prefixIcon: const Icon(Icons.build_circle_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                Text(l10n.categories, style: const TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: widget.dashboard.availableCategories.map((category) {
                    final selected = _selectedCategories.contains(category.id);
                    return FilterChip(
                      selected: selected,
                      label: Text(category.name),
                      onSelected: (value) {
                        setState(() {
                          if (value) {
                            _selectedCategories.add(category.id);
                          } else {
                            _selectedCategories.remove(category.id);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _availability,
                  items: [
                    DropdownMenuItem(value: 'available_today', child: Text(l10n.availableToday)),
                    DropdownMenuItem(value: 'available_this_week', child: Text(l10n.availableThisWeek)),
                    DropdownMenuItem(value: 'not_available', child: Text(l10n.notAvailable)),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _availability = value);
                    }
                  },
                  decoration: InputDecoration(
                    labelText: l10n.availability,
                    prefixIcon: const Icon(Icons.event_available_rounded),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: widget.loading ? null : _submit,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(widget.loading ? l10n.saving : l10n.saveProfile),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        ],
      ),
    );
  }
}

class _DashboardStateCard extends StatelessWidget {
  final bool loading;
  final String title;
  final String description;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _DashboardStateCard({
    required this.loading,
    required this.title,
    required this.description,
    required this.icon,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFEAF1FF),
              ),
              child: loading
                  ? const Padding(
                      padding: EdgeInsets.all(18),
                      child: CircularProgressIndicator(strokeWidth: 3),
                    )
                  : Icon(icon, color: const Color(0xFF173C77), size: 30),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 10),
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B), height: 1.6),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.refresh_rounded),
                label: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SyncIssueBanner extends StatelessWidget {
  final String title;
  final String description;
  final String detail;
  final IconData icon;
  final String actionLabel;
  final VoidCallback? onAction;

  const _SyncIssueBanner({
    required this.title,
    required this.description,
    required this.detail,
    required this.icon,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFCD34D)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: Color(0xFFFFF3C4),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Color(0xFF9A6700)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF7C4A03),
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: const TextStyle(
                    color: Color(0xFF92400E),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  detail,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFFB45309),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          FilledButton.tonal(
            onPressed: onAction,
            child: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  final String label;
  final String value;

  const _MiniStatCard({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryChip({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: const Color(0x1AD7E4FF),
        border: Border.all(color: const Color(0x33D7E4FF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Color(0xFFD7E4FF), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final palette = switch (status) {
      'active' => (const Color(0xFFE8F7EF), const Color(0xFF166534)),
      'inactive_wallet_empty' => (const Color(0xFFFFF7E6), const Color(0xFF92400E)),
      'blocked' || 'rejected' => (const Color(0xFFFEF2F2), const Color(0xFFB91C1C)),
      _ => (const Color(0xFFF1F5F9), const Color(0xFF475569)),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: palette.$1,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        _prettyText(context, status),
        style: TextStyle(
          color: palette.$2,
          fontWeight: FontWeight.w800,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _ProfileInfoTile extends StatelessWidget {
  final String label;
  final String value;

  const _ProfileInfoTile({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

String _prettyText(BuildContext context, String value) {
  return WorkerLocalizations.of(context).prettyValue(value);
}

bool _matchesWageBand(double wageAmount, String band) {
  switch (band) {
    case 'lt700':
      return wageAmount < 700;
    case '700to999':
      return wageAmount >= 700 && wageAmount < 1000;
    case '1000plus':
      return wageAmount >= 1000;
    default:
      return true;
  }
}

String _shortDate(BuildContext context, String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final l10n = WorkerLocalizations.of(context);
  if (l10n.isHindi) {
    return '${parsed.day}/${parsed.month}';
  }
  final month = switch (parsed.month) {
    1 => 'Jan',
    2 => 'Feb',
    3 => 'Mar',
    4 => 'Apr',
    5 => 'May',
    6 => 'Jun',
    7 => 'Jul',
    8 => 'Aug',
    9 => 'Sep',
    10 => 'Oct',
    11 => 'Nov',
    _ => 'Dec',
  };
  return '${parsed.day} $month';
}

String _activationHeadline(WorkerLocalizations l10n, WorkerActivationSummaryModel activation) {
  if (!l10n.isHindi) {
    return activation.headline;
  }

  return switch (activation.status) {
    'active' => 'वर्कर एक्सेस सक्रिय है',
    'inactive_wallet_empty' => 'वॉलेट रिचार्ज की जरूरत है',
    'inactive_subscription_expired' => 'एक्सेस दोबारा सक्रिय करें',
    'blocked' => 'वर्कर एक्सेस ब्लॉक है',
    'rejected' => 'प्रोफ़ाइल अस्वीकृत है',
    _ => 'वर्कर प्रोफ़ाइल अपडेट करें',
  };
}

String _activationDescription(WorkerLocalizations l10n, WorkerActivationSummaryModel activation) {
  if (!l10n.isHindi) {
    return activation.description;
  }

  return switch (activation.status) {
    'active' => 'आपका वॉलेट सक्रिय है। दैनिक कटौती के बाद भी कंपनी डिटेल्स खुली रहेंगी।',
    'inactive_wallet_empty' => 'वॉलेट बैलेंस कम है। रिचार्ज करके कंपनी डिटेल्स और विजिबिलिटी फिर से चालू करें।',
    'inactive_subscription_expired' => 'एक्सेस अवधि खत्म हो गई है। रिचार्ज करके दोबारा सक्रिय करें।',
    'blocked' => 'एडमिन ने इस प्रोफ़ाइल को रोका है। सहायता के लिए एडमिन से संपर्क करें।',
    'rejected' => 'प्रोफ़ाइल को समीक्षा के बाद स्वीकार नहीं किया गया। जानकारी अपडेट करें।',
    _ => 'बेहतर मैच पाने के लिए अपनी जानकारी और वॉलेट स्थिति अपडेट रखें।',
  };
}

String _walletVisibilityRule(WorkerLocalizations l10n, WorkerDashboardModel dashboard) {
  if (!l10n.isHindi) {
    return dashboard.wallet.visibilityRule;
  }

  if (dashboard.activation.isActive) {
    return 'एक्सेस सक्रिय रहने तक आपकी प्रोफ़ाइल दिखाई देगी और कंपनी संपर्क उपलब्ध रहेंगे।';
  }

  return 'वॉलेट बैलेंस और सक्रिय स्थिति के आधार पर कंपनी डिटेल्स और विजिबिलिटी नियंत्रित होती है।';
}
