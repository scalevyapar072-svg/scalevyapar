import 'package:flutter/material.dart';

import '../../models/worker_models.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
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
    if (_dashboard == null) {
      _loadDashboard();
    }
  }

  @override
  void dispose() {
    _rechargeNoteController.dispose();
    super.dispose();
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
        const SnackBar(content: Text('Profile updated successfully.')),
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
        const SnackBar(content: Text('Recharge request sent to admin.')),
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
    setState(() => _jobActionId = jobPostId);
    try {
      final dashboard = await _apiService.applyToJob(
        _token,
        jobPostId: jobPostId,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Application sent successfully.')),
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

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 76,
        title: dashboard == null
            ? const Text('ScaleVyapar Worker')
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ScaleVyapar Worker',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Welcome, ${dashboard.profile.fullName}',
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
        actions: [
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
                            _error.isEmpty ? 'Loading dashboard...' : _error,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          if (!_loading)
                            FilledButton(
                              onPressed: _loadDashboard,
                              child: const Text('Try Again'),
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
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.work_outline_rounded),
            selectedIcon: Icon(Icons.work_rounded),
            label: 'Feed',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet_rounded),
            label: 'Wallet',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: 'Alerts',
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
                            profile.city.isEmpty ? 'Set your city' : profile.city,
                            style: const TextStyle(
                              color: Color(0xFFD7E4FF),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            activation.headline,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            activation.description,
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
                      label: 'Wallet',
                      value: 'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}',
                    ),
                    _SummaryChip(
                      label: 'Jobs',
                      value: '$visibleJobsCount unlocked',
                    ),
                    _SummaryChip(
                      label: 'Wage',
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
                  label: 'Daily deduction',
                  value: 'Rs ${dashboard.wallet.dailyCharge.toStringAsFixed(0)}',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MiniStatCard(
                  label: 'Estimated days left',
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
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Matching job feed',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Jobs are matched using your city, categories, and active worker status.',
                  style: TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 14),
                TextField(
                  onChanged: onQueryChanged,
                  decoration: const InputDecoration(
                    labelText: 'Search jobs',
                    hintText: 'Search by title, city, or category',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                ),
                const SizedBox(height: 12),
                SwitchListTile.adaptive(
                  value: showUnlockedOnly,
                  contentPadding: EdgeInsets.zero,
                  onChanged: onToggleUnlockedOnly,
                  title: const Text('Show only unlocked company details'),
                  subtitle: const Text('Useful when your account is active and you want direct contacts.'),
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
          const Card(
            child: Padding(
              padding: EdgeInsets.all(22),
              child: Text(
                'No jobs match the current filters. Try clearing your search or keeping your worker profile active.',
                style: TextStyle(color: Color(0xFF475569), height: 1.6),
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
                                  '${item.city} | Expires ${_shortDate(item.expiresAt)}',
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
                                tooltip: item.isSaved ? 'Remove from shortlist' : 'Save job',
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
                          _chip('${item.workersNeeded} workers needed'),
                          _chip(item.matchReason),
                          if (item.isSaved) _chip('Saved', fill: const Color(0xFFF0FDF4)),
                          if (item.hasApplied)
                            _chip(
                              'Applied${item.applicationStatus == null ? '' : ' • ${_prettyText(item.applicationStatus!)}'}',
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
                                  ? 'Working...'
                                  : item.hasApplied
                                      ? 'Application sent'
                                      : 'Apply to job',
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
                            ? const Text(
                                'Company details are locked. Recharge and keep the worker account active to unlock direct company contact.',
                                style: TextStyle(
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
                                    'Contact person: ${item.contactPerson ?? '-'}',
                                    style: const TextStyle(color: Color(0xFF475569)),
                                  ),
                                  Text(
                                    'Mobile: ${item.companyMobile ?? '-'}',
                                    style: const TextStyle(color: Color(0xFF475569)),
                                  ),
                                  Text(
                                    'Company city: ${item.companyCity}',
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

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Worker notifications',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  unreadCount == 0
                      ? 'You are fully caught up. New job actions and account updates will appear here.'
                      : '$unreadCount unread update${unreadCount == 1 ? '' : 's'} waiting for you.',
                  style: const TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: loading || unreadCount == 0 ? null : onMarkAllRead,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(loading ? 'Updating...' : 'Mark all as read'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (notifications.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(22),
              child: Text(
                'No notifications yet. Once you save jobs or apply, updates will start showing here.',
                style: TextStyle(color: Color(0xFF475569), height: 1.6),
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
                  notification.title,
                  style: TextStyle(
                    fontWeight: notification.isRead ? FontWeight.w700 : FontWeight.w900,
                  ),
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    '${notification.message}\n${_shortDate(notification.createdAt)} • ${_prettyText(notification.priority)} priority',
                    style: const TextStyle(height: 1.5),
                  ),
                ),
                trailing: notification.isRead
                    ? null
                    : TextButton(
                        onPressed: loading ? null : () => onMarkRead(notification.id),
                        child: const Text('Mark read'),
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
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Wallet & activation',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your wallet balance decides whether you can keep viewing company details and stay visible to employers.',
                  style: TextStyle(color: Color(0xFF64748B), height: 1.5),
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
                      const Text(
                        'Current balance',
                        style: TextStyle(color: Color(0xFFD7E4FF)),
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
                        dashboard.wallet.visibilityRule,
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
                        label: 'Daily deduction',
                        value: 'Rs ${dashboard.wallet.dailyCharge.toStringAsFixed(0)}',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MiniStatCard(
                        label: 'Estimated active days',
                        value: '${dashboard.wallet.estimatedDaysRemaining}',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: rechargeNoteController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Recharge note for admin',
                    hintText: 'Example: Need Rs 100 recharge for 20 more days',
                    prefixIcon: Icon(Icons.note_alt_outlined),
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: loading ? null : onRequestRecharge,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(loading ? 'Sending request...' : 'Request Recharge'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Recharge & deduction history',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        ...dashboard.wallet.transactions.map(
          (transaction) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              title: Text(_prettyText(transaction.transactionType)),
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
                    '${_prettyText(transaction.status)} | ${_shortDate(transaction.createdAt)}',
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
    if (_nameController.text.trim().isEmpty) {
      _showMessage('Full name is required.');
      return;
    }
    if (_cityController.text.trim().isEmpty) {
      _showMessage('City is required.');
      return;
    }
    if (_selectedCategories.isEmpty) {
      _showMessage('Select at least one category.');
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

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Worker profile',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Keep these details updated so the app matches you with the right company requirements.',
                  style: TextStyle(color: Color(0xFF64748B), height: 1.5),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: _ProfileInfoTile(
                        label: 'Mobile',
                        value: profile.mobile,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ProfileInfoTile(
                        label: 'Status',
                        value: _prettyText(profile.status),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(Icons.person_outline_rounded),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _cityController,
                  decoration: const InputDecoration(
                    labelText: 'City',
                    prefixIcon: Icon(Icons.location_city_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _experienceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Experience (years)',
                          prefixIcon: Icon(Icons.workspace_premium_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _wageController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Expected daily wage',
                          prefixIcon: Icon(Icons.currency_rupee_rounded),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _skillsController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Skills',
                    hintText: 'Example: overlock, cutting, zari, finishing',
                    prefixIcon: Icon(Icons.build_circle_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Categories', style: TextStyle(fontWeight: FontWeight.w800)),
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
                  items: const [
                    DropdownMenuItem(value: 'available_today', child: Text('Available today')),
                    DropdownMenuItem(value: 'available_this_week', child: Text('Available this week')),
                    DropdownMenuItem(value: 'not_available', child: Text('Not available')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _availability = value);
                    }
                  },
                  decoration: const InputDecoration(
                    labelText: 'Availability',
                    prefixIcon: Icon(Icons.event_available_rounded),
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: widget.loading ? null : _submit,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(widget.loading ? 'Saving...' : 'Save Profile'),
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
        _prettyText(status),
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

String _prettyText(String value) {
  return value
      .replaceAll('_', ' ')
      .split(' ')
      .where((part) => part.isNotEmpty)
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _shortDate(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
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
