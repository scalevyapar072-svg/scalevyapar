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

class _WorkerHomePageState extends State<WorkerHomePage> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _apiService = WorkerApiService();
  final _sessionStore = SessionStore();

  late String _token;
  WorkerDashboardModel? _dashboard;
  bool _loading = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _token = widget.initialToken;
    _dashboard = widget.initialDashboard;
    _tabController = TabController(length: 3, vsync: this);
    if (_dashboard == null) {
      _loadDashboard();
    }
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
        const SnackBar(content: Text('Profile updated')),
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
      final dashboard = await _apiService.createRechargeRequest(_token);
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Recharge request sent to admin')),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'ScaleVyapar Worker',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            onPressed: _loading ? null : _loadDashboard,
            icon: const Icon(Icons.refresh_rounded),
          ),
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Feed'),
            Tab(text: 'Wallet'),
            Tab(text: 'Profile'),
          ],
        ),
      ),
      body: _dashboard == null
          ? Center(
              child: _loading
                  ? const CircularProgressIndicator()
                  : Text(_error.isEmpty ? 'Loading dashboard...' : _error),
            )
          : Column(
              children: [
                _ActivationBanner(
                  activation: _dashboard!.activation,
                  plan: _dashboard!.workerPlan,
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _FeedTab(
                        dashboard: _dashboard!,
                        accentColor: Theme.of(context).colorScheme.primary,
                      ),
                      _WalletTab(
                        dashboard: _dashboard!,
                        onRequestRecharge: _requestRecharge,
                        loading: _loading,
                      ),
                      _ProfileTab(
                        dashboard: _dashboard!,
                        onSave: _saveProfile,
                        loading: _loading,
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _ActivationBanner extends StatelessWidget {
  final WorkerActivationSummaryModel activation;
  final WorkerPlanModel? plan;

  const _ActivationBanner({
    required this.activation,
    required this.plan,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = activation.isActive;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: isActive ? const Color(0xFFE8F7EF) : const Color(0xFFFFF7E6),
        border: Border.all(
          color: isActive ? const Color(0xFFB7E3C8) : const Color(0xFFF7D8A5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            activation.headline,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            activation.description,
            style: const TextStyle(color: Color(0xFF475569), height: 1.5),
          ),
          if (plan != null) ...[
            const SizedBox(height: 8),
            Text(
              'Current worker plan: ${plan!.name} | Daily deduction Rs ${plan!.dailyCharge.toStringAsFixed(0)}',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ],
        ],
      ),
    );
  }
}

class _FeedTab extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final Color accentColor;

  const _FeedTab({
    required this.dashboard,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    if (dashboard.feed.isEmpty) {
      return const Center(
        child: Text('No matching live jobs yet'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: dashboard.feed.length,
      itemBuilder: (context, index) {
        final item = dashboard.feed[index];
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
                          Text(item.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 6),
                          Text(item.city, style: const TextStyle(color: Color(0xFF64748B))),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Text(
                        'Rs ${item.wageAmount.toStringAsFixed(0)}',
                        style: TextStyle(color: accentColor, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(item.description, style: const TextStyle(color: Color(0xFF475569), height: 1.6)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _chip(item.categoryName),
                    _chip('${item.workersNeeded} workers'),
                    _chip(item.matchReason),
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
                      ? const Text(
                          'Company details are locked. Keep your worker account active to unlock contact details.',
                          style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.w700, height: 1.6),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.companyName, style: const TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 6),
                            Text('Contact: ${item.contactPerson ?? '-'}', style: const TextStyle(color: Color(0xFF475569))),
                            Text('Mobile: ${item.companyMobile ?? '-'}', style: const TextStyle(color: Color(0xFF475569))),
                            Text('City: ${item.companyCity}', style: const TextStyle(color: Color(0xFF475569))),
                          ],
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _chip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
    );
  }
}

class _WalletTab extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final Future<void> Function() onRequestRecharge;
  final bool loading;

  const _WalletTab({
    required this.dashboard,
    required this.onRequestRecharge,
    required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Wallet Balance', style: TextStyle(color: Color(0xFF64748B))),
                const SizedBox(height: 6),
                Text(
                  'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 14),
                Text(dashboard.wallet.visibilityRule, style: const TextStyle(color: Color(0xFF475569), height: 1.6)),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _walletChip('Daily charge Rs ${dashboard.wallet.dailyCharge.toStringAsFixed(0)}'),
                    _walletChip('Days left ${dashboard.wallet.estimatedDaysRemaining}'),
                  ],
                ),
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: loading ? null : onRequestRecharge,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(loading ? 'Sending request...' : 'Request Recharge'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Recharge & deduction history', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        ...dashboard.wallet.transactions.map((transaction) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(transaction.transactionType.replaceAll('_', ' ')),
                subtitle: Text(transaction.note.isEmpty ? transaction.reference : transaction.note),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${transaction.direction == 'debit' ? '-' : '+'} Rs ${transaction.amount.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: transaction.direction == 'debit' ? const Color(0xFFB91C1C) : const Color(0xFF166534),
                      ),
                    ),
                    Text(transaction.status, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
              ),
            )),
      ],
    );
  }

  Widget _walletChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
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
  late final TextEditingController _nameController;
  late final TextEditingController _cityController;
  late final TextEditingController _experienceController;
  late final TextEditingController _wageController;
  late final TextEditingController _skillsController;
  late List<String> _selectedCategories;
  late String _availability;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.dashboard.profile.fullName);
    _cityController = TextEditingController(text: widget.dashboard.profile.city);
    _experienceController = TextEditingController(text: widget.dashboard.profile.experienceYears.toStringAsFixed(0));
    _wageController = TextEditingController(text: widget.dashboard.profile.expectedDailyWage.toStringAsFixed(0));
    _skillsController = TextEditingController(text: widget.dashboard.profile.skills.join(', '));
    _selectedCategories = [...widget.dashboard.profile.categoryIds];
    _availability = widget.dashboard.profile.availability;
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Worker profile', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                const SizedBox(height: 14),
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name')),
                const SizedBox(height: 12),
                TextField(controller: _cityController, decoration: const InputDecoration(labelText: 'City')),
                const SizedBox(height: 12),
                TextField(
                  controller: _experienceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Experience (years)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _wageController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Expected Daily Wage'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _skillsController,
                  decoration: const InputDecoration(labelText: 'Skills (comma separated)'),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                const Text('Categories', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                ...widget.dashboard.availableCategories.map((category) => CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _selectedCategories.contains(category.id),
                      title: Text(category.name),
                      onChanged: (value) {
                        setState(() {
                          if (value == true) {
                            _selectedCategories.add(category.id);
                          } else {
                            _selectedCategories.remove(category.id);
                          }
                        });
                      },
                    )),
                const SizedBox(height: 12),
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
                  decoration: const InputDecoration(labelText: 'Availability'),
                ),
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: widget.loading
                      ? null
                      : () => widget.onSave(
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
                          ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(widget.loading ? 'Saving...' : 'Save Profile'),
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
