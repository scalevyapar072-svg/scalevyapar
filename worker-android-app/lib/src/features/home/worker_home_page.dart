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
  WorkerDashboardModel? _dashboard;
  bool _loading = false;
  String _error = '';
  int _selectedIndex = 0;
  String _feedQuery = '';
  bool _showUnlockedOnly = false;
  String _jobActionId = '';
  bool _notificationsLoading = false;

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
    _rechargeNoteController.dispose();
    super.dispose();
  }

  Future<void> _attachPushNotifications() async {
    await WorkerPushService.instance.attachWorkerSession(_token);
    _pushMessagesSubscription = WorkerPushService.instance.messages.listen((_) {
      if (!mounted) {
        return;
      }
      _loadDashboard();
    });
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = '';
    });

    try {
      final dashboard = await _apiService.getDashboard(_token);
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _logout() async {
    await WorkerPushService.instance.detachWorkerSession(_token);
    await _sessionStore.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const OtpLoginPage()),
      (route) => false,
    );
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => _notificationsLoading = false);
      }
    }
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
      return matchesQuery && matchesLock;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = _dashboard;
    final l10n = WorkerLocalizations.of(context);
    final languageScope = WorkerLanguageScope.of(context);

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
              child: _loading
                  ? const CircularProgressIndicator()
                  : Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _error.isEmpty ? l10n.loadingDashboard : _error,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          if (!_loading)
                            FilledButton(
                              onPressed: _loadDashboard,
                              child: Text(l10n.tryAgain),
                            ),
                        ],
                      ),
                    ),
            )
          : Column(
              children: [
                _TopSummarySection(
                  dashboard: dashboard,
                  visibleJobsCount: _filteredFeed.where((item) => !item.companyLocked).length,
                ),
                Expanded(
                  child: IndexedStack(
                    index: _selectedIndex,
                    children: [
                      _FeedTab(
                        dashboard: dashboard,
                        feed: _filteredFeed,
                        query: _feedQuery,
                        showUnlockedOnly: _showUnlockedOnly,
                        activeJobActionId: _jobActionId,
                        onQueryChanged: (value) => setState(() => _feedQuery = value),
                        onToggleUnlockedOnly: (value) => setState(() => _showUnlockedOnly = value),
                        onApply: _applyToJob,
                        onToggleSaved: _toggleSavedJob,
                      ),
                      _WalletTab(
                        dashboard: dashboard,
                        rechargeNoteController: _rechargeNoteController,
                        onRequestRecharge: _requestRecharge,
                        loading: _loading,
                      ),
                      _ProfileTab(
                        dashboard: dashboard,
                        onSave: _saveProfile,
                        loading: _loading,
                      ),
                      _NotificationsTab(
                        notifications: dashboard.notifications,
                        loading: _notificationsLoading,
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
  final List<WorkerFeedItemModel> feed;
  final String query;
  final bool showUnlockedOnly;
  final String activeJobActionId;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<bool> onToggleUnlockedOnly;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;

  const _FeedTab({
    required this.dashboard,
    required this.feed,
    required this.query,
    required this.showUnlockedOnly,
    required this.activeJobActionId,
    required this.onQueryChanged,
    required this.onToggleUnlockedOnly,
    required this.onApply,
    required this.onToggleSaved,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
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
                TextField(
                  onChanged: onQueryChanged,
                  decoration: InputDecoration(
                    labelText: l10n.searchJobs,
                    hintText: l10n.searchJobsHint,
                    prefixIcon: const Icon(Icons.search_rounded),
                  ),
                ),
                const SizedBox(height: 12),
                SwitchListTile.adaptive(
                  value: showUnlockedOnly,
                  contentPadding: EdgeInsets.zero,
                  onChanged: onToggleUnlockedOnly,
                  title: Text(l10n.showUnlockedCompanyDetails),
                  subtitle: Text(l10n.unlockedCompanyDetailsSubtitle),
                ),
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
                      SizedBox(
                        width: double.infinity,
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

class _NotificationsTab extends StatelessWidget {
  final List<WorkerNotificationModel> notifications;
  final bool loading;
  final Future<void> Function() onMarkAllRead;
  final Future<void> Function(String notificationId) onMarkRead;

  const _NotificationsTab({
    required this.notifications,
    required this.loading,
    required this.onMarkAllRead,
    required this.onMarkRead,
  });

  @override
  Widget build(BuildContext context) {
    final unreadCount = notifications.where((item) => !item.isRead).length;
    final l10n = WorkerLocalizations.of(context);

    return ListView(
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
    );
  }
}

class _WalletTab extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final TextEditingController rechargeNoteController;
  final Future<void> Function() onRequestRecharge;
  final bool loading;

  const _WalletTab({
    required this.dashboard,
    required this.rechargeNoteController,
    required this.onRequestRecharge,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    return ListView(
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
  final bool loading;

  const _ProfileTab({
    required this.dashboard,
    required this.onSave,
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

    return ListView(
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
