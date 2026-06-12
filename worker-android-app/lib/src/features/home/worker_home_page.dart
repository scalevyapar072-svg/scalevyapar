import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app.dart';
import '../../localization/worker_localizations.dart';
import '../../models/worker_models.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import '../../services/worker_push_service.dart';
import '../bootstrap/worker_bootstrap_page.dart';
import '../bootstrap/worker_launch_gate.dart';

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

class _LiveLocationSnapshot {
  final double? latitude;
  final double? longitude;
  final String city;
  final String area;
  final bool permissionDenied;
  final bool unavailable;

  const _LiveLocationSnapshot({
    required this.latitude,
    required this.longitude,
    required this.city,
    required this.area,
    required this.permissionDenied,
    required this.unavailable,
  });
}

class _DerivedJobCoordinates {
  final double latitude;
  final double longitude;
  final String source;

  const _DerivedJobCoordinates({
    required this.latitude,
    required this.longitude,
    required this.source,
  });
}

enum _FeedViewTab {
  all,
  nearby,
  otherCities,
  saved,
  applied,
}

const double _minimumWalletRechargeAmount = 50;
const String _categoryLockedApplyMessage =
    'This job is not available for your selected job category.';
const Map<String, String> _commonHindiCategoryLabels = {
  'adda work karighar': 'अड्डा वर्क कारीगर',
  'carpenter': 'कारपेंटर',
  'stitching karighar': 'सिलाई कारीगर',
  'delivery boy': 'डिलीवरी बॉय',
  'dispatch worker': 'डिस्पैच वर्कर',
  'driver': 'ड्राइवर',
  'electrician': 'इलेक्ट्रीशियन',
  'embroidery worker': 'कढ़ाई कारीगर',
  'furniture installer': 'फर्नीचर इंस्टॉलर',
  'production manager': 'प्रोडक्शन मैनेजर',
  'printer labour': 'प्रिंटिंग मजदूर',
  'housekeeping staff': 'हाउसकीपिंग स्टाफ',
  'helper': 'हेल्पर',
  'interior carpenter': 'इंटीरियर कारपेंटर',
  'loader': 'लोडर',
  'mason': 'मिस्त्री',
  'cutting master': 'कटिंग मास्टर',
  'picker / packer': 'पिकर / पैकर',
  'picker/packer': 'पिकर / पैकर',
  'picker packer': 'पिकर / पैकर',
  'painter': 'पेंटर',
  'plumber': 'प्लंबर',
  'quality checker': 'क्वालिटी चेकर',
  'sampling master': 'सैंपलिंग मास्टर',
  'salesman': 'सेल्समैन',
  'security guard': 'सिक्योरिटी गार्ड',
  'supervisor': 'सुपरवाइजर',
  'tailor': 'टेलर',
  'machine operator': 'मशीन ऑपरेटर',
  'packing worker': 'पैकिंग वर्कर',
  'welder': 'वेल्डर',
  'zari work karighar': 'जरी वर्क कारीगर',
};

String _replaceIgnoreCase(String input, String pattern, String replacement) {
  return input.replaceAll(
    RegExp(RegExp.escape(pattern), caseSensitive: false),
    replacement,
  );
}

String _localizeCommonJobText(WorkerLocalizations l10n, String value) {
  if (!l10n.isHindi) {
    return value;
  }

  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return value;
  }

  final normalized = trimmed.toLowerCase();
  const directLabels = {
    'category locked': 'कैटेगरी लॉक्ड',
    'distance unavailable': 'दूरी उपलब्ध नहीं है',
    'daily wage': 'दैनिक मजदूरी',
    'monthly salary': 'मासिक वेतन',
    'weekly payment': 'साप्ताहिक भुगतान',
    'contract payment': 'कॉन्ट्रैक्ट भुगतान',
    'piece rate': 'पीस रेट',
    'permanent': 'स्थायी',
    'day shift': 'दिन की शिफ्ट',
    'night shift': 'रात की शिफ्ट',
    'evening shift': 'शाम की शिफ्ट',
    'afternoon shift': 'दोपहर की शिफ्ट',
    'as per roster': 'रोस्टर के अनुसार',
    'any': 'कोई भी',
    'pending': 'लंबित',
    'live': 'लाइव',
    'expired': 'समाप्त',
    'available': 'उपलब्ध',
    'yes': 'हाँ',
    'no': 'नहीं',
    'sunday': 'रविवार',
  };
  final directLabel = directLabels[normalized];
  if (directLabel != null) {
    return directLabel;
  }

  var localized = trimmed;
  localized = _replaceIgnoreCase(localized, 'Daily Wage', 'दैनिक मजदूरी');
  localized = _replaceIgnoreCase(localized, 'Monthly Salary', 'मासिक वेतन');
  localized = _replaceIgnoreCase(localized, 'Weekly Payment', 'साप्ताहिक भुगतान');
  localized = _replaceIgnoreCase(
    localized,
    'Contract Payment',
    'कॉन्ट्रैक्ट भुगतान',
  );
  localized = _replaceIgnoreCase(localized, 'Piece Rate', 'पीस रेट');
  localized = _replaceIgnoreCase(localized, 'Day Shift', 'दिन की शिफ्ट');
  localized = _replaceIgnoreCase(localized, 'Night Shift', 'रात की शिफ्ट');
  localized = _replaceIgnoreCase(localized, 'Evening Shift', 'शाम की शिफ्ट');
  localized = _replaceIgnoreCase(localized, 'Afternoon Shift', 'दोपहर की शिफ्ट');
  localized = _replaceIgnoreCase(localized, 'As Per Roster', 'रोस्टर के अनुसार');
  localized = _replaceIgnoreCase(localized, 'Permanent', 'स्थायी');
  localized = _replaceIgnoreCase(localized, 'Pending', 'लंबित');
  localized = _replaceIgnoreCase(localized, 'Live', 'लाइव');
  localized = _replaceIgnoreCase(localized, 'Distance unavailable', 'दूरी उपलब्ध नहीं है');
  localized = _replaceIgnoreCase(localized, 'Any', 'कोई भी');
  localized = _replaceIgnoreCase(localized, 'Available', 'उपलब्ध');
  localized = _replaceIgnoreCase(localized, 'Sunday', 'रविवार');
  localized = localized.replaceAll(
    RegExp(r'\bYears?\b', caseSensitive: false),
    'वर्ष',
  );
  return localized;
}

String _localizedCategoryLabel(WorkerLocalizations l10n, String value) {
  if (!l10n.isHindi) {
    return value;
  }

  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    return value;
  }

  return _commonHindiCategoryLabels[trimmed.toLowerCase()] ??
      _localizeCommonJobText(l10n, trimmed);
}

String _lockedCategoryBadgeLabel(bool isHindi) {
  return isHindi ? 'कैटेगरी लॉक्ड' : 'Category Locked';
}

String _categoryLockedDialogTitle(WorkerLocalizations l10n) {
  return l10n.isHindi ? 'श्रेणी लॉक है' : 'Category Locked';
}

String _categoryLockedDialogMessage(WorkerLocalizations l10n) {
  return l10n.isHindi
      ? 'यह नौकरी आपकी चुनी हुई नौकरी श्रेणी के लिए उपलब्ध नहीं है।'
      : _categoryLockedApplyMessage;
}

Future<void> _showCategoryLockedMessageDialog(BuildContext context) async {
  final l10n = WorkerLocalizations.of(context);
  await showDialog<void>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(_categoryLockedDialogTitle(l10n)),
        content: Text(_categoryLockedDialogMessage(l10n)),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(l10n.isHindi ? 'ठीक है' : 'OK'),
          ),
        ],
      );
    },
  );
}

Future<void> _showWorkerInactiveRechargeDialog(
  BuildContext context, {
  required VoidCallback onRecharge,
}) async {
  final l10n = WorkerLocalizations.of(context);
  await showDialog<void>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(l10n.isHindi ? 'वॉलेट रिचार्ज करें' : 'Recharge your Wallet'),
        content: Text(
          l10n.isHindi
              ? 'आपका वर्कर एक्सेस निष्क्रिय है। जॉब्स के लिए अप्लाई जारी रखने के लिए रिचार्ज करें।'
              : 'Your worker access is inactive. Recharge to continue applying for jobs.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(l10n.isHindi ? 'अभी नहीं' : 'Not now'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              onRecharge();
            },
            child: Text(l10n.isHindi ? 'रिचार्ज करें' : 'Recharge'),
          ),
        ],
      );
    },
  );
}

String _daysRemainingLabel(WorkerLocalizations l10n, int daysRemaining) {
  if (l10n.isHindi) {
    return daysRemaining == 1 ? '1 दिन बाकी' : '$daysRemaining दिन बाकी';
  }
  return daysRemaining == 1 ? '1 day left' : '$daysRemaining days left';
}

String _validTillText(WorkerLocalizations l10n, String value) {
  return l10n.isHindi ? 'वैधता $value तक' : 'Valid till $value';
}

String _formatCurrencyValue(double amount) {
  return amount % 1 == 0 ? amount.toStringAsFixed(0) : amount.toStringAsFixed(2);
}

String _dailyDeductionAmountText(WorkerLocalizations l10n, double amount) {
  final suffix = l10n.isHindi ? 'दिन' : 'day';
  return 'Rs ${_formatCurrencyValue(amount)} / $suffix';
}

DateTime _todayDateOnly() {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day);
}

DateTime? _parseDateOnly(String? value) {
  final normalized = value?.trim() ?? '';
  if (normalized.isEmpty) {
    return null;
  }

  try {
    final parsed = DateTime.parse(normalized);
    return DateTime(parsed.year, parsed.month, parsed.day);
  } catch (_) {
    return null;
  }
}

bool _isPastDate(String? value) {
  final parsed = _parseDateOnly(value);
  if (parsed == null) {
    return false;
  }

  return parsed.isBefore(_todayDateOnly());
}

String? _formatShortDate(String? value) {
  final parsed = _parseDateOnly(value);
  if (parsed == null) {
    return null;
  }

  return '${parsed.month}/${parsed.day}/${parsed.year}';
}

int? _calendarDaysRemaining(String? value) {
  final parsed = _parseDateOnly(value);
  if (parsed == null) {
    return null;
  }

  final today = _todayDateOnly();
  if (parsed.isBefore(today)) {
    return 0;
  }

  return parsed.difference(today).inDays + 1;
}

bool _hasZeroChargePlan(WorkerDashboardModel dashboard) {
  final planCharge = dashboard.workerPlan?.dailyCharge;
  if (planCharge != null) {
    return planCharge <= 0;
  }

  return dashboard.wallet.dailyCharge <= 0;
}

bool _hasActiveFreePlan(WorkerDashboardModel dashboard) {
  if (!dashboard.activation.isActive || !_hasZeroChargePlan(dashboard)) {
    return false;
  }

  return !_isPastDate(dashboard.workerPlan?.planEndDate);
}

int _resolvedDaysRemaining(WorkerDashboardModel dashboard) {
  final freePlanDays =
      _calendarDaysRemaining(dashboard.workerPlan?.planEndDate);
  if (_hasActiveFreePlan(dashboard) && freePlanDays != null) {
    return freePlanDays;
  }

  return math.max(dashboard.wallet.estimatedDaysRemaining, 0);
}

bool _isDashboardPausedByWorker(WorkerDashboardModel dashboard) {
  return dashboard.activation.isPausedByWorker ||
      dashboard.wallet.isPausedByWorker ||
      dashboard.profile.isPausedByWorker;
}

bool _supportsWalletStatusToggle(WorkerDashboardModel dashboard) {
  if (_hasActiveFreePlan(dashboard)) {
    return false;
  }

  final dailyCharge = dashboard.workerPlan?.dailyCharge ?? dashboard.wallet.dailyCharge;
  return dailyCharge > 0 &&
      (_dashboardWorkerActive(dashboard) || _isDashboardPausedByWorker(dashboard));
}

String? _formatShortDateTime(String? value) {
  if (value == null || value.trim().isEmpty) {
    return null;
  }

  final parsed = DateTime.tryParse(value);
  if (parsed == null) {
    return null;
  }

  final local = parsed.toLocal();
  final dateLabel =
      '${local.day}/${local.month}/${local.year.toString().padLeft(4, '0')}';
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final meridiem = local.hour >= 12 ? 'PM' : 'AM';
  return '$dateLabel, $hour:$minute $meridiem';
}

String _normalizeJobRankKey(String value) {
  return value
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[-_/|]+'), ' ')
      .replaceAll(RegExp(r'[.,:;()[\]{}]+'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ');
}

Set<String> _normalizedJobRankSet(Iterable<String?> values) {
  return values
      .map((value) => _normalizeJobRankKey(value ?? ''))
      .where((value) => value.isNotEmpty)
      .toSet();
}

bool _jobRankSetsIntersect(Set<String> left, Set<String> right) {
  return left.any(right.contains);
}

bool _isJobCategoryLockedForWorker(
  WorkerProfileModel profile,
  WorkerFeedItemModel item,
) {
  return !_jobRankSetsIntersect(
    _workerCategoryKeys(profile),
    _jobCategoryKeys(item),
  );
}

String _resolveWorkerCurrentCity(
  _LiveLocationSnapshot liveLocation,
  WorkerProfileModel profile,
) {
  final liveCity = liveLocation.city.trim();
  if (liveCity.isNotEmpty) {
    return liveCity;
  }
  final profileCity = profile.city.trim();
  if (profileCity.isNotEmpty) {
    return profileCity;
  }
  return profile.homeCity.trim();
}

Set<String> _workerCategoryKeys(WorkerProfileModel profile) {
  return _normalizedJobRankSet([
    ...profile.categoryIds,
    ...profile.categoryLabels,
  ]);
}

Set<String> _workerIndustryKeys(
  WorkerDashboardModel dashboard,
  WorkerProfileModel profile,
) {
  final workerCategoryKeys = _workerCategoryKeys(profile);
  final result = <String>{};
  for (final dependency in dashboard.categoryDependencies) {
    final categoryKeys = _normalizedJobRankSet([
      dependency.categoryId,
      dependency.categorySlug,
      dependency.categoryName,
    ]);
    if (!_jobRankSetsIntersect(workerCategoryKeys, categoryKeys)) {
      continue;
    }
    result.addAll(_normalizedJobRankSet([
      dependency.industryCategory.id,
      dependency.industryCategory.slug,
      dependency.industryCategory.value,
      dependency.industryCategory.label,
    ]));
  }
  return result;
}

Set<String> _workerBusinessTypeKeys(
  WorkerDashboardModel dashboard,
  WorkerProfileModel profile,
) {
  final workerCategoryKeys = _workerCategoryKeys(profile);
  final result = <String>{};
  for (final dependency in dashboard.categoryDependencies) {
    final businessType = dependency.businessType;
    if (businessType == null) {
      continue;
    }
    final categoryKeys = _normalizedJobRankSet([
      dependency.categoryId,
      dependency.categorySlug,
      dependency.categoryName,
    ]);
    if (!_jobRankSetsIntersect(workerCategoryKeys, categoryKeys)) {
      continue;
    }
    result.addAll(_normalizedJobRankSet([
      businessType.id,
      businessType.slug,
      businessType.value,
      businessType.label,
    ]));
  }
  return result;
}

Set<String> _jobCategoryKeys(WorkerFeedItemModel item) {
  return _normalizedJobRankSet([
    item.categoryId,
    item.categorySlug,
    item.categoryName,
  ]);
}

Set<String> _jobIndustryKeys(
  WorkerDashboardModel dashboard,
  WorkerFeedItemModel item,
) {
  final keys = _normalizedJobRankSet([
    item.industryCategoryId,
    item.industryCategorySlug,
    item.industryCategoryValue,
    item.industryCategoryLabel,
  ]);
  if (keys.isNotEmpty) {
    return keys;
  }
  final result = <String>{};
  final itemCategoryKeys = _jobCategoryKeys(item);
  for (final dependency in dashboard.categoryDependencies) {
    final dependencyCategoryKeys = _normalizedJobRankSet([
      dependency.categoryId,
      dependency.categorySlug,
      dependency.categoryName,
    ]);
    if (!_jobRankSetsIntersect(itemCategoryKeys, dependencyCategoryKeys)) {
      continue;
    }
    result.addAll(_normalizedJobRankSet([
      dependency.industryCategory.id,
      dependency.industryCategory.slug,
      dependency.industryCategory.value,
      dependency.industryCategory.label,
    ]));
  }
  return result;
}

Set<String> _jobBusinessTypeKeys(
  WorkerDashboardModel dashboard,
  WorkerFeedItemModel item,
) {
  final keys = _normalizedJobRankSet([
    item.businessTypeId,
    item.businessTypeSlug,
    item.businessTypeValue,
    item.businessTypeLabel,
  ]);
  if (keys.isNotEmpty) {
    return keys;
  }
  final result = <String>{};
  final itemCategoryKeys = _jobCategoryKeys(item);
  for (final dependency in dashboard.categoryDependencies) {
    final businessType = dependency.businessType;
    if (businessType == null) {
      continue;
    }
    final dependencyCategoryKeys = _normalizedJobRankSet([
      dependency.categoryId,
      dependency.categorySlug,
      dependency.categoryName,
    ]);
    if (!_jobRankSetsIntersect(itemCategoryKeys, dependencyCategoryKeys)) {
      continue;
    }
    result.addAll(_normalizedJobRankSet([
      businessType.id,
      businessType.slug,
      businessType.value,
      businessType.label,
    ]));
  }
  return result;
}

DateTime _safeJobPublishedAt(String value) {
  return DateTime.tryParse(value) ?? DateTime.fromMillisecondsSinceEpoch(0);
}

List<WorkerFeedItemModel> _rankWorkerFeedItems({
  required List<WorkerFeedItemModel> items,
  required WorkerDashboardModel dashboard,
  required WorkerProfileModel profile,
  required _LiveLocationSnapshot liveLocation,
}) {
  final workerCategoryKeys = _workerCategoryKeys(profile);
  final workerIndustryKeys = _workerIndustryKeys(dashboard, profile);
  final workerBusinessKeys = _workerBusinessTypeKeys(dashboard, profile);
  final currentCity = _normalizeJobRankKey(
    _resolveWorkerCurrentCity(liveLocation, profile),
  );

  final indexed = items.indexed.toList();
  indexed.sort((left, right) {
    final leftItem = left.$2;
    final rightItem = right.$2;

    final leftCategoryMatch = _jobRankSetsIntersect(
      workerCategoryKeys,
      _jobCategoryKeys(leftItem),
    );
    final rightCategoryMatch = _jobRankSetsIntersect(
      workerCategoryKeys,
      _jobCategoryKeys(rightItem),
    );
    final categoryCompare =
        (rightCategoryMatch ? 1 : 0) - (leftCategoryMatch ? 1 : 0);
    if (categoryCompare != 0) {
      return categoryCompare;
    }

    final leftCityMatch = currentCity.isNotEmpty &&
        _jobRankSetsIntersect(
          {currentCity},
          _normalizedJobRankSet([leftItem.city, leftItem.companyCity]),
        );
    final rightCityMatch = currentCity.isNotEmpty &&
        _jobRankSetsIntersect(
          {currentCity},
          _normalizedJobRankSet([rightItem.city, rightItem.companyCity]),
        );
    final cityCompare = (rightCityMatch ? 1 : 0) - (leftCityMatch ? 1 : 0);
    if (cityCompare != 0) {
      return cityCompare;
    }

    final leftIndustryBusinessScore = (_jobRankSetsIntersect(
          workerIndustryKeys,
          _jobIndustryKeys(dashboard, leftItem),
        )
            ? 1
            : 0) +
        (_jobRankSetsIntersect(
          workerBusinessKeys,
          _jobBusinessTypeKeys(dashboard, leftItem),
        )
            ? 1
            : 0);
    final rightIndustryBusinessScore = (_jobRankSetsIntersect(
          workerIndustryKeys,
          _jobIndustryKeys(dashboard, rightItem),
        )
            ? 1
            : 0) +
        (_jobRankSetsIntersect(
          workerBusinessKeys,
          _jobBusinessTypeKeys(dashboard, rightItem),
        )
            ? 1
            : 0);
    final industryBusinessCompare =
        rightIndustryBusinessScore.compareTo(leftIndustryBusinessScore);
    if (industryBusinessCompare != 0) {
      return industryBusinessCompare;
    }

    final publishedCompare = _safeJobPublishedAt(rightItem.publishedAt)
        .compareTo(_safeJobPublishedAt(leftItem.publishedAt));
    if (publishedCompare != 0) {
      return publishedCompare;
    }

    return left.$1.compareTo(right.$1);
  });

  return indexed.map((entry) => entry.$2).toList(growable: false);
}

class _WorkerHomePageState extends State<WorkerHomePage> {
  final _apiService = WorkerApiService();
  final _sessionStore = SessionStore();
  final _rechargeAmountController = TextEditingController(text: '50');
  final _rechargeNoteController = TextEditingController();
  late final Razorpay _razorpay;
  Timer? _filterUpdateDebounce;

  late String _token;
  StreamSubscription<RemoteMessage>? _pushMessagesSubscription;
  WorkerDashboardModel? _dashboard;
  bool _loading = false;
  String _error = '';
  int _selectedIndex = 0;
  String _feedQuery = '';
  _FeedViewTab _selectedFeedTab = _FeedViewTab.all;
  bool _showUnlockedOnly = false;
  bool _showSavedOnly = false;
  bool _showAppliedOnly = false;
  List<String> _selectedCategoryFilters = const [];
  String _selectedIndustryFilter = 'all';
  String _selectedBusinessTypeFilter = 'all';
  String _selectedCityFilter = 'all';
  String _selectedWageBand = 'all';
  String _jobActionId = '';
  bool _notificationsLoading = false;
  bool _redirectingToLogin = false;
  bool _walletPaymentLoading = false;
  bool _walletStatusLoading = false;
  Position? _livePosition;
  String _liveCity = '';
  String _liveArea = '';
  bool _locationPermissionDenied = false;
  bool _locationUnavailable = false;
  List<String> _favouriteCities = const [];
  bool _popularCategoriesExpanded = false;
  bool _filtersUpdating = false;
  bool _tabSwitching = false;
  String _filteredFeedCacheKey = '';
  List<WorkerFeedItemModel> _filteredFeedCache = const [];
  String _sortedIndustryOptionsCacheKey = '';
  List<WorkerMasterOption> _sortedIndustryOptionsCache = const [];
  static const int _collapsedPopularCategoryCount = 8;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleWalletPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleWalletPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _token = widget.initialToken;
    _dashboard = widget.initialDashboard;
    _attachPushNotifications();
    _refreshLiveLocation();
    unawaited(_loadFavouriteCities());
    if (_dashboard != null) {
      _prefetchFeedCoordinateLookups(_dashboard!.feed);
    }
    if (_dashboard == null) {
      _loadDashboard();
    }
  }

  @override
  void dispose() {
    _pushMessagesSubscription?.cancel();
    _filterUpdateDebounce?.cancel();
    _razorpay.clear();
    _rechargeAmountController.dispose();
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

  Future<void> _refreshLiveLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!mounted) return;
        setState(() {
          _locationUnavailable = true;
          _locationPermissionDenied = false;
          _livePosition = null;
          _liveCity = '';
          _liveArea = '';
        });
        return;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      final denied = permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever;
      if (denied) {
        if (!mounted) return;
        setState(() {
          _locationPermissionDenied = true;
          _locationUnavailable = false;
          _livePosition = null;
          _liveCity = '';
          _liveArea = '';
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      var liveCity = '';
      var liveArea = '';
      try {
        final placemarks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );
        if (placemarks.isNotEmpty) {
          final placemark = placemarks.first;
          liveCity = [
            placemark.locality,
            placemark.administrativeArea,
            placemark.subAdministrativeArea,
          ]
              .map((value) => value?.trim() ?? '')
              .firstWhere((value) => value.isNotEmpty, orElse: () => '');
          final areaCandidates = [
            placemark.subLocality,
            placemark.subAdministrativeArea,
            placemark.name,
            placemark.street,
            placemark.locality,
          ].map((value) => value?.trim() ?? '');
          liveArea = areaCandidates.firstWhere(
            (value) =>
                value.isNotEmpty &&
                value.toLowerCase() != liveCity.toLowerCase(),
            orElse: () => '',
          );
        }
      } catch (_) {
        // Keep the live coordinates even if reverse geocoding fails.
      }

      if (!mounted) return;
      setState(() {
        _livePosition = position;
        _liveCity = liveCity;
        _liveArea = liveArea;
        _locationPermissionDenied = false;
        _locationUnavailable = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _locationUnavailable = true;
        _locationPermissionDenied = false;
        _livePosition = null;
        _liveCity = '';
        _liveArea = '';
      });
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
      _prefetchFeedCoordinateLookups(dashboard.feed);
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

  Future<void> _loadFavouriteCities() async {
    final savedCities = await _sessionStore.getFavouriteCities();
    if (!mounted) {
      return;
    }
    setState(() {
      _favouriteCities = _dedupeCities(savedCities);
    });
  }

  String _cleanError(Object error) =>
      error.toString().replaceFirst('Exception: ', '');

  void _scheduleFilterUpdate(
    VoidCallback update, {
    Duration delay = const Duration(milliseconds: 140),
  }) {
    _filterUpdateDebounce?.cancel();
    if (!_filtersUpdating && mounted) {
      setState(() => _filtersUpdating = true);
    }
    _filterUpdateDebounce = Timer(delay, () {
      if (!mounted) return;
      setState(() {
        update();
        _filtersUpdating = false;
      });
    });
  }

  Future<void> _selectTab(int index) async {
    if (index == _selectedIndex) {
      return;
    }
    setState(() => _tabSwitching = true);
    await Future<void>.delayed(Duration.zero);
    if (!mounted) {
      return;
    }
    setState(() => _selectedIndex = index);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      setState(() => _tabSwitching = false);
    });
  }

  String _filteredFeedSignature(WorkerDashboardModel dashboard) {
    final liveLocation = _liveLocationSnapshot(dashboard.profile);
    return [
      identityHashCode(dashboard),
      _feedQuery.trim().toLowerCase(),
      _selectedFeedTab.name,
      _showUnlockedOnly,
      _showSavedOnly,
      _showAppliedOnly,
      _normalizeFilterKey(_selectedIndustryFilter),
      _normalizeFilterKey(_selectedBusinessTypeFilter),
      _selectedCategoryFilters.map(_normalizeFilterKey).join(','),
      _normalizeFilterKey(_selectedCityFilter),
      _selectedWageBand,
      _normalizeFilterKey(liveLocation.city),
      _normalizeFilterKey(liveLocation.area),
      liveLocation.latitude?.toStringAsFixed(5) ?? '',
      liveLocation.longitude?.toStringAsFixed(5) ?? '',
    ].join('|');
  }

  // TODO: Move large-feed filtering and pagination to the backend before job volume grows significantly.
  List<WorkerFeedItemModel> _computeFilteredFeed(
    WorkerDashboardModel dashboard,
  ) {
    final filtered = dashboard.feed.where((item) {
      final matchesQuery = _feedQuery.isEmpty ||
          item.title.toLowerCase().contains(_feedQuery.toLowerCase()) ||
          item.city.toLowerCase().contains(_feedQuery.toLowerCase()) ||
          item.categoryName.toLowerCase().contains(_feedQuery.toLowerCase());
      final matchesLock = !_showUnlockedOnly || !item.companyLocked;
      final matchesSaved =
          (_selectedFeedTab != _FeedViewTab.saved && !_showSavedOnly) ||
              item.isSaved;
      final matchesApplied =
          (_selectedFeedTab != _FeedViewTab.applied && !_showAppliedOnly) ||
              item.hasApplied;
      final matchesIndustry = _itemMatchesIndustry(item, dashboard);
      final matchesBusinessType = _itemMatchesBusinessType(item, dashboard);
      final matchesCategory = _itemMatchesSelectedCategories(item);
      final matchesCity = _itemMatchesCity(item);
      final matchesWage = _matchesWageBand(item.wageAmount, _selectedWageBand);
      final matchesTab = switch (_selectedFeedTab) {
        _FeedViewTab.all => true,
        _FeedViewTab.saved => item.isSaved,
        _FeedViewTab.applied => item.hasApplied,
        _FeedViewTab.otherCities =>
          _itemMatchesOtherCities(item, dashboard.profile),
        _FeedViewTab.nearby => _itemMatchesNearby(item),
      };
      return matchesQuery &&
          matchesLock &&
          matchesSaved &&
          matchesApplied &&
          matchesIndustry &&
          matchesBusinessType &&
          matchesCategory &&
          matchesCity &&
          matchesWage &&
          matchesTab;
    }).toList(growable: false);

    return _rankWorkerFeedItems(
      items: filtered,
      dashboard: dashboard,
      profile: dashboard.profile,
      liveLocation: _liveLocationSnapshot(dashboard.profile),
    );
  }

  List<WorkerFeedItemModel> _resolvedFilteredFeed(
    WorkerDashboardModel dashboard,
  ) {
    final signature = _filteredFeedSignature(dashboard);
    if (_filteredFeedCacheKey == signature) {
      return _filteredFeedCache;
    }
    final filteredFeed = _computeFilteredFeed(dashboard);
    _filteredFeedCacheKey = signature;
    _filteredFeedCache = filteredFeed;
    return filteredFeed;
  }

  List<WorkerMasterOption> _sortedIndustryOptions(
    WorkerDashboardModel dashboard,
  ) {
    final signature = '${identityHashCode(dashboard)}|industry-options';
    if (_sortedIndustryOptionsCacheKey == signature) {
      return _sortedIndustryOptionsCache;
    }
    final options = List<WorkerMasterOption>.from(
      dashboard.availableIndustryCategories,
    )..sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
    _sortedIndustryOptionsCacheKey = signature;
    _sortedIndustryOptionsCache = options;
    return options;
  }

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

  bool get _showSyncIssueBanner =>
      _dashboard != null && _error.trim().isNotEmpty;

  _LiveLocationSnapshot _liveLocationSnapshot(WorkerProfileModel profile) {
    return _LiveLocationSnapshot(
      latitude: _livePosition?.latitude,
      longitude: _livePosition?.longitude,
      city: _liveCity,
      area: _liveArea,
      permissionDenied: _locationPermissionDenied,
      unavailable: _locationUnavailable,
    );
  }

  void _prefetchFeedCoordinateLookups(List<WorkerFeedItemModel> feed) {
    // Job/company coordinates should come directly from the feed.
  }

  _DerivedJobCoordinates? _resolveJobCoordinatesForItem(
      WorkerFeedItemModel item) {
    if (item.latitude != null && item.longitude != null) {
      return _DerivedJobCoordinates(
        latitude: item.latitude!,
        longitude: item.longitude!,
        source: item.coordinateSource.isEmpty ? 'feed' : item.coordinateSource,
      );
    }
    if (item.companyLatitude != null && item.companyLongitude != null) {
      return _DerivedJobCoordinates(
        latitude: item.companyLatitude!,
        longitude: item.companyLongitude!,
        source: 'company',
      );
    }
    return null;
  }

  bool _isSessionError(String message) {
    final normalized = message.toLowerCase();
    return normalized.contains('unauthorized') ||
        normalized.contains('invalid token') ||
        normalized.contains('token expired') ||
        normalized.contains('session expired') ||
        normalized.contains('forbidden');
  }

  bool _isMissingWorkerError(String message) {
    final normalized = message.toLowerCase();
    return normalized.contains('worker account not found') ||
        normalized.contains('worker not found') ||
        (normalized.contains('404') && normalized.contains('worker'));
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
      MaterialPageRoute(
        builder: (_) => const WorkerLaunchGate(
          child: WorkerBootstrapPage(),
        ),
      ),
      (route) => false,
    );
  }

  Future<bool> _handleSessionExpiryIfNeeded(String message) async {
    if (_isSessionError(message)) {
      await _resetSessionAndGoToLogin('Session expired. Please login again.');
      return true;
    }

    if (_isMissingWorkerError(message)) {
      await _resetSessionAndGoToLogin(
        'Your worker account was not found. Please register or login again.',
      );
      return true;
    }

    return false;
  }

  Future<void> _logout() async {
    final shouldLogout = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Logout?'),
            content: const Text('Are you sure you want to logout?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Logout'),
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

  Future<void> _openSupport() async {
    final dashboard = _dashboard;
    if (dashboard == null || !mounted) return;

    final l10n = WorkerLocalizations.of(context);
    final support = dashboard.support;
    final whatsappNumber = _normalizeWhatsappPhone(support.whatsappNumber);
    final chatbotUrl = support.chatbotUrl.trim();
    final extraLabel = support.extraLabel.trim();
    final extraUrl = support.extraUrl.trim();
    final hasWhatsapp = whatsappNumber.isNotEmpty;
    final hasChatbot = chatbotUrl.isNotEmpty;
    final hasExtra = extraLabel.isNotEmpty && extraUrl.isNotEmpty;

    if (!hasWhatsapp && !hasChatbot && !hasExtra) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'सपोर्ट विकल्प अभी उपलब्ध नहीं हैं।'
                : 'Support options are not available right now.',
          ),
        ),
      );
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        final title = support.title.trim().isNotEmpty
            ? support.title.trim()
            : (l10n.isHindi ? 'सपोर्ट' : 'Support');
        final subtitle = support.subtitle.trim();

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w900),
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style:
                        const TextStyle(color: Color(0xFF64748B), height: 1.5),
                  ),
                ],
                const SizedBox(height: 16),
                if (hasWhatsapp)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.chat_rounded,
                        color: Color(0xFF16A34A)),
                    title: Text(l10n.isHindi
                        ? 'व्हाट्सएप सपोर्ट'
                        : 'WhatsApp support'),
                    subtitle: Text(support.whatsappNumber.trim()),
                    onTap: () async {
                      Navigator.of(sheetContext).pop();
                      await _openSupportWhatsApp(support);
                    },
                  ),
                if (hasChatbot)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.support_agent_rounded,
                        color: Color(0xFF173C77)),
                    title: Text(l10n.isHindi
                        ? 'सपोर्ट लिंक'
                        : 'Support link'),
                    subtitle: Text(chatbotUrl),
                    onTap: () async {
                      Navigator.of(sheetContext).pop();
                      await _openSupportUrl(chatbotUrl);
                    },
                  ),
                if (hasExtra)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.open_in_new_rounded,
                        color: Color(0xFF173C77)),
                    title: Text(extraLabel),
                    subtitle: Text(extraUrl),
                    onTap: () async {
                      Navigator.of(sheetContext).pop();
                      await _openSupportUrl(extraUrl);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _openSupportWhatsApp(WorkerSupportModel support) async {
    final l10n = WorkerLocalizations.of(context);
    final phone = _normalizeWhatsappPhone(support.whatsappNumber);
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'व्हाट्सएप सपोर्ट उपलब्ध नहीं है।'
                : 'WhatsApp support is not available.',
          ),
        ),
      );
      return;
    }

    final message = support.prefilledMessage.trim().isNotEmpty
        ? support.prefilledMessage.trim()
        : (l10n.isHindi
            ? 'नमस्ते टीम, मुझे Rozgar worker app में मदद चाहिए।'
            : 'Hello Team, I need help with the Rozgar worker app.');

    final uri =
        Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'व्हाट्सएप खोला नहीं जा सका।'
                : 'Could not open WhatsApp.',
          ),
        ),
      );
    }
  }

  Future<void> _openSupportUrl(String rawUrl) async {
    final l10n = WorkerLocalizations.of(context);
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'सपोर्ट लिंक उपलब्ध नहीं है।'
                : 'Support link is not available.',
          ),
        ),
      );
      return;
    }

    final candidate =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
            ? trimmed
            : 'https://$trimmed';
    final uri = Uri.tryParse(candidate);
    if (uri == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'सपोर्ट लिंक अमान्य है।'
                : 'Support link is invalid.',
          ),
        ),
      );
      return;
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'सपोर्ट लिंक खोला नहीं जा सका।'
                : 'Could not open the support link.',
          ),
        ),
      );
    }
  }

  Future<void> _saveProfile({
    required String fullName,
    required String city,
    required String homeCity,
    required String address,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required String salaryType,
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
        homeCity: homeCity,
        address: address,
        categoryIds: categoryIds,
        skills: skills,
        experienceYears: experienceYears,
        salaryType: salaryType,
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

  Future<void> _startWalletRecharge() async {
    final amount = double.tryParse(_rechargeAmountController.text.trim());
    if (amount == null || amount < _minimumWalletRechargeAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Minimum recharge amount is Rs ${_minimumWalletRechargeAmount.toStringAsFixed(0)}.',
          ),
        ),
      );
      return;
    }
    setState(() => _walletPaymentLoading = true);
    try {
      final order = await _apiService.createWalletRechargeOrder(
        _token,
        amount: amount,
      );
      if (!mounted) return;
      _razorpay.open({
        'key': order.keyId,
        'amount': order.amount,
        'currency': order.currency,
        'name': 'ScaleVyapar Rozgar',
        'description': 'Worker wallet recharge',
        'order_id': order.orderId,
        'prefill': {
          'name': order.workerName,
          'contact': order.mobile,
        },
        'theme': {'color': '#173C77'},
      });
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
        setState(() => _walletPaymentLoading = false);
      }
    }
  }

  Future<void> _handleWalletPaymentSuccess(
      PaymentSuccessResponse response) async {
    if (!mounted) return;
    final orderId = response.orderId ?? '';
    final paymentId = response.paymentId ?? '';
    final signature = response.signature ?? '';
    if (orderId.isEmpty || paymentId.isEmpty || signature.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Payment details are incomplete. Please contact support.')),
      );
      return;
    }

    setState(() => _walletPaymentLoading = true);
    try {
      final dashboard = await _apiService.verifyWalletRechargePayment(
        _token,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Wallet recharged successfully.')),
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
        setState(() => _walletPaymentLoading = false);
      }
    }
  }

  void _handleWalletPaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    final message = response.message?.trim().isNotEmpty == true
        ? response.message!.trim()
        : 'Payment was cancelled or failed. Wallet was not credited.';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content:
              Text('External wallet selected. Complete payment to recharge.')),
    );
  }

  Future<void> _updateWalletStatus(bool active) async {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }

    final l10n = WorkerLocalizations.of(context);
    if (!_supportsWalletStatusToggle(dashboard)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.walletStatusControlUnavailable)),
      );
      return;
    }

    setState(() => _walletStatusLoading = true);
    try {
      final nextDashboard = await _apiService.updateWalletStatus(
        _token,
        active: active,
      );
      if (!mounted) return;
      setState(() => _dashboard = nextDashboard);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(active
              ? l10n.activateWorkerAccessSuccess
              : l10n.deactivateWorkerAccessSuccess),
        ),
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
        setState(() => _walletStatusLoading = false);
      }
    }
  }

  Future<void> _handleWalletStatusTap() async {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }

    final pausedByWorker = _isDashboardPausedByWorker(dashboard);
    if (pausedByWorker) {
      await _updateWalletStatus(true);
      return;
    }

    final l10n = WorkerLocalizations.of(context);
    final shouldDeactivate = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(l10n.deactivateWorkerAccessTitle),
            content: Text(l10n.deactivateWorkerAccessMessage),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(l10n.cancel),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: Text(l10n.deactivateWorkerAccess),
              ),
            ],
          ),
        ) ??
        false;

    if (!shouldDeactivate) {
      return;
    }

    await _updateWalletStatus(false);
  }

  Future<void> _applyToJob(String jobPostId) async {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }
    final selectedItem = dashboard.feed.cast<WorkerFeedItemModel?>().firstWhere(
          (item) => item?.id == jobPostId,
          orElse: () => null,
        );
    if (selectedItem != null &&
        _isJobCategoryLockedForWorker(dashboard.profile, selectedItem)) {
      await _showCategoryLockedMessageDialog(context);
      return;
    }
    if (!_isWorkerActive()) {
      await _showWorkerInactiveRechargeDialog(
        context,
        onRecharge: () {
          if (mounted) {
            setState(() => _selectedIndex = 1);
          }
        },
      );
      return;
    }
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

  bool _isWorkerActive() {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return false;
    }
    return _dashboardWorkerActive(dashboard);
  }

  Future<void> _showRechargeWalletDialog() async {
    await _showWorkerInactiveRechargeDialog(
      context,
      onRecharge: () {
        if (mounted) {
          setState(() => _selectedIndex = 1);
        }
      },
    );
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
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _JobDetailsPage(
          item: item,
          profile: dashboard.profile,
          isWorkerActive: _isWorkerActive(),
          liveLocation: _liveLocationSnapshot(dashboard.profile),
          resolvedCoordinates: _resolveJobCoordinatesForItem(item),
          onApply: _applyToJob,
          onToggleSaved: _toggleSavedJob,
          onOpenWallet: () => setState(() => _selectedIndex = 1),
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
          profile: dashboard.profile,
          items: dashboard.feed.where((item) => item.isSaved).toList(),
          isWorkerActive: _isWorkerActive(),
          onApply: _applyToJob,
          onToggleSaved: _toggleSavedJob,
          onOpenWallet: () => setState(() => _selectedIndex = 1),
        ),
      ),
    );
  }

  String _normalizeFilterKey(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[-_/|]+'), ' ')
        .replaceAll(RegExp(r'[.,:;()[\]{}]+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ');
  }

  Set<String> _normalizedValueSet(Iterable<String?> values) {
    return values
        .map((value) => _normalizeFilterKey(value ?? ''))
        .where((value) => value.isNotEmpty)
        .toSet();
  }

  bool _setsIntersect(Set<String> left, Set<String> right) {
    return left.any(right.contains);
  }

  bool _matchesNormalizedValue(String selected, Iterable<String?> values) {
    final normalizedSelected = _normalizeFilterKey(selected);
    if (normalizedSelected.isEmpty) {
      return false;
    }
    for (final value in values) {
      if (_normalizeFilterKey(value ?? '') == normalizedSelected) {
        return true;
      }
    }
    return false;
  }

  Set<String> _selectedCategoryIdentityKeys(
    String selected,
    WorkerDashboardModel dashboard,
  ) {
    final keys = <String>{_normalizeFilterKey(selected)}
      ..removeWhere((value) => value.isEmpty);
    if (keys.isEmpty) {
      return keys;
    }

    var changed = true;
    while (changed) {
      changed = false;

      for (final option in dashboard.availableCategories) {
        final optionKeys = _normalizedValueSet([option.id, option.name]);
        if (!_setsIntersect(keys, optionKeys)) {
          continue;
        }
        final lengthBefore = keys.length;
        keys.addAll(optionKeys);
        if (keys.length != lengthBefore) {
          changed = true;
        }
      }

      for (final dependency in dashboard.categoryDependencies) {
        final dependencyKeys = _normalizedValueSet([
          dependency.categoryId,
          dependency.categorySlug,
          dependency.categoryName,
        ]);
        if (!_setsIntersect(keys, dependencyKeys)) {
          continue;
        }
        final lengthBefore = keys.length;
        keys.addAll(dependencyKeys);
        if (keys.length != lengthBefore) {
          changed = true;
        }
      }
    }

    return keys;
  }

  String _resolveCurrentCity(WorkerProfileModel profile) {
    final liveCity = _liveCity.trim();
    if (liveCity.isNotEmpty) {
      return liveCity;
    }
    final profileCity = profile.city.trim();
    if (profileCity.isNotEmpty) {
      return profileCity;
    }
    return profile.homeCity.trim();
  }

  List<WorkerMasterOption> _availableBusinessTypeOptions(
    WorkerDashboardModel dashboard,
  ) {
    final selectedIndustry = _selectedIndustryFilter;
    if (selectedIndustry == 'all') {
      return const [];
    }
    final allowedIds = dashboard.industryBusinessDependencies
        .where((dependency) => _matchesNormalizedValue(selectedIndustry, [
              dependency.industryCategory.id,
              dependency.industryCategory.slug,
              dependency.industryCategory.value,
              dependency.industryCategory.label,
            ]))
        .map((dependency) => dependency.businessType.id)
        .toSet();
    return dashboard.availableBusinessTypes
        .where((option) => allowedIds.contains(option.id))
        .toList()
      ..sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
  }

  List<WorkerCategoryOption> _availableCategoryOptions(
    WorkerDashboardModel dashboard,
  ) {
    final categoriesByKey = <String, WorkerCategoryOption>{
      for (final option in dashboard.availableCategories)
        _normalizeFilterKey(option.id): option,
      for (final option in dashboard.availableCategories)
        _normalizeFilterKey(option.name): option,
    };

    Iterable<WorkerCategoryOption> options = dashboard.availableCategories;
    if (_selectedIndustryFilter != 'all') {
      final filteredDependencyCategories = dashboard.categoryDependencies.where(
        (dependency) {
          final matchesIndustry = _matchesNormalizedValue(
            _selectedIndustryFilter,
            [
              dependency.industryCategory.id,
              dependency.industryCategory.slug,
              dependency.industryCategory.value,
              dependency.industryCategory.label,
            ],
          );
          if (!matchesIndustry) {
            return false;
          }
          if (_selectedBusinessTypeFilter == 'all') {
            return true;
          }
          final businessType = dependency.businessType;
          return businessType != null &&
              _matchesNormalizedValue(_selectedBusinessTypeFilter, [
                businessType.id,
                businessType.slug,
                businessType.value,
                businessType.label,
              ]);
        },
      );
      final allowedKeys = filteredDependencyCategories
          .expand((dependency) => [
                _normalizeFilterKey(dependency.categoryId),
                _normalizeFilterKey(dependency.categorySlug),
                _normalizeFilterKey(dependency.categoryName),
              ])
          .where((value) => value.isNotEmpty)
          .toSet();
      options = dashboard.availableCategories.where((option) {
        return allowedKeys.contains(_normalizeFilterKey(option.id)) ||
            allowedKeys.contains(_normalizeFilterKey(option.name));
      });
      if (options.isEmpty) {
        final fallback = filteredDependencyCategories.map((dependency) {
          final match =
              categoriesByKey[_normalizeFilterKey(dependency.categoryId)] ??
                  categoriesByKey[_normalizeFilterKey(dependency.categoryName)];
          return match ??
              WorkerCategoryOption(
                id: dependency.categoryId,
                name: dependency.categoryName,
                description: '',
                imageUrl: '',
                showOnHome: false,
                homeOrder: 0,
                isActive: true,
              );
        }).toList();
        options = fallback;
      }
    }

    final deduped = <String, WorkerCategoryOption>{};
    for (final option in options) {
      final key =
          _normalizeFilterKey(option.id.isNotEmpty ? option.id : option.name);
      if (key.isNotEmpty) {
        deduped[key] = option;
      }
    }
    return deduped.values.toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  }

  bool _itemMatchesIndustry(
    WorkerFeedItemModel item,
    WorkerDashboardModel dashboard,
  ) {
    if (_selectedIndustryFilter == 'all') {
      return true;
    }
    final directValues = [
      item.industryCategoryId,
      item.industryCategorySlug,
      item.industryCategoryValue,
      item.industryCategoryLabel,
    ];
    if (_matchesNormalizedValue(_selectedIndustryFilter, directValues)) {
      return true;
    }
    for (final dependency in dashboard.categoryDependencies) {
      final matchesCategory = _matchesNormalizedValue(item.categoryId, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categorySlug, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categoryName, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]);
      if (!matchesCategory) {
        continue;
      }
      if (_matchesNormalizedValue(_selectedIndustryFilter, [
        dependency.industryCategory.id,
        dependency.industryCategory.slug,
        dependency.industryCategory.value,
        dependency.industryCategory.label,
      ])) {
        return true;
      }
    }
    return false;
  }

  bool _itemMatchesBusinessType(
    WorkerFeedItemModel item,
    WorkerDashboardModel dashboard,
  ) {
    if (_selectedBusinessTypeFilter == 'all') {
      return true;
    }
    final directValues = [
      item.businessTypeId,
      item.businessTypeSlug,
      item.businessTypeValue,
      item.businessTypeLabel,
    ];
    if (_matchesNormalizedValue(_selectedBusinessTypeFilter, directValues)) {
      return true;
    }
    for (final dependency in dashboard.categoryDependencies) {
      final businessType = dependency.businessType;
      if (businessType == null) {
        continue;
      }
      final matchesCategory = _matchesNormalizedValue(item.categoryId, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categorySlug, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categoryName, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]);
      if (!matchesCategory) {
        continue;
      }
      final matchesIndustry = _selectedIndustryFilter == 'all' ||
          _matchesNormalizedValue(_selectedIndustryFilter, [
            dependency.industryCategory.id,
            dependency.industryCategory.slug,
            dependency.industryCategory.value,
            dependency.industryCategory.label,
          ]);
      if (!matchesIndustry) {
        continue;
      }
      if (_matchesNormalizedValue(_selectedBusinessTypeFilter, [
        businessType.id,
        businessType.slug,
        businessType.value,
        businessType.label,
      ])) {
        return true;
      }
    }
    return false;
  }

  bool _itemMatchesSelectedCategories(WorkerFeedItemModel item) {
    if (_selectedCategoryFilters.isEmpty) {
      return true;
    }
    final dashboard = _dashboard;
    if (dashboard == null) {
      return true;
    }
    final itemCategoryKeys = _normalizedValueSet([
      item.categoryId,
      item.categorySlug,
      item.categoryName,
    ]);
    if (itemCategoryKeys.isEmpty) {
      return false;
    }
    return _selectedCategoryFilters.any(
      (selected) => _setsIntersect(
        _selectedCategoryIdentityKeys(selected, dashboard),
        itemCategoryKeys,
      ),
    );
  }

  void _openViewMoreJobs({
    String? overrideCityFilter,
    List<String>? overrideCategoryFilters,
    String? overrideIndustryFilter,
    String? overrideBusinessTypeFilter,
    _FeedViewTab? overrideFeedTab,
  }) {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }
    Navigator.of(context)
        .push(
      MaterialPageRoute(
        builder: (_) => _AllJobsPage(
          token: _token,
          initialDashboard: dashboard,
          initialIsWorkerActive: _isWorkerActive(),
          initialLiveLocation: _liveLocationSnapshot(dashboard.profile),
          initialQuery: _feedQuery,
          initialFeedTab: overrideFeedTab ?? _selectedFeedTab,
          initialShowUnlockedOnly: _showUnlockedOnly,
          initialShowSavedOnly: _showSavedOnly,
          initialShowAppliedOnly: _showAppliedOnly,
          initialSelectedIndustryFilter:
              overrideIndustryFilter ?? _selectedIndustryFilter,
          initialSelectedBusinessTypeFilter:
              overrideBusinessTypeFilter ?? _selectedBusinessTypeFilter,
          initialSelectedCategoryFilters:
              overrideCategoryFilters ?? _selectedCategoryFilters,
          initialSelectedCityFilter: overrideCityFilter ?? _selectedCityFilter,
          initialSelectedWageBand: _selectedWageBand,
          resolveJobCoordinatesForItem: _resolveJobCoordinatesForItem,
          onOpenWallet: () => setState(() => _selectedIndex = 1),
        ),
      ),
    )
        .then((_) {
      if (mounted) {
        _loadDashboard();
      }
    });
  }

  Future<void> _openFavouriteCitiesPicker() async {
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }
    final selected = await Navigator.of(context).push<List<String>>(
      MaterialPageRoute(
        builder: (_) => _FavouriteCitiesPage(
          initialSelectedCities: _favouriteCities,
          availableCities: _popularCities(dashboard),
          cityJobCounts: _jobCountByCity(dashboard),
        ),
        fullscreenDialog: true,
      ),
    );
    if (selected == null || !mounted) {
      return;
    }
    final deduped = _dedupeCities(selected);
    await _sessionStore.saveFavouriteCities(deduped);
    if (!mounted) {
      return;
    }
    setState(() {
      _favouriteCities = deduped;
    });
  }

  Future<void> _clearFavouriteCities() async {
    await _sessionStore.saveFavouriteCities(const []);
    if (!mounted) {
      return;
    }
    setState(() {
      _favouriteCities = const [];
    });
  }

  void _openCityJobs(String city) {
    _openViewMoreJobs(
      overrideFeedTab: _FeedViewTab.all,
      overrideCityFilter: city,
    );
  }

  void _openCategoryJobs(WorkerCategoryOption option) {
    _openViewMoreJobs(
      overrideFeedTab: _FeedViewTab.all,
      overrideIndustryFilter: 'all',
      overrideBusinessTypeFilter: 'all',
      overrideCategoryFilters: [option.id],
    );
  }

  String _normalizeCityKey(String value) => _normalizeFilterKey(value);

  List<String> _dedupeCities(Iterable<String> cities) {
    final byKey = <String, String>{};
    for (final city in cities) {
      final trimmed = city.trim();
      final key = _normalizeCityKey(trimmed);
      if (trimmed.isEmpty || key.isEmpty) {
        continue;
      }
      byKey.putIfAbsent(key, () => trimmed);
    }
    return byKey.values.toList(growable: false);
  }

  Map<String, int> _jobCountByCity(WorkerDashboardModel dashboard) {
    final counts = <String, int>{};
    for (final item in dashboard.feed) {
      final city =
          (item.city.trim().isNotEmpty ? item.city : item.companyCity).trim();
      final key = _normalizeCityKey(city);
      if (key.isEmpty) {
        continue;
      }
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }

  List<String> _popularCities(WorkerDashboardModel dashboard) {
    final counts = _jobCountByCity(dashboard);
    final baseCities = dashboard.availableCities
        .where((item) => item.trim().isNotEmpty)
        .toList(growable: false);
    final options = _dedupeCities(
      baseCities.isNotEmpty ? baseCities : _availableCityOptions(dashboard),
    );
    options.sort((left, right) {
      final countCompare = (counts[_normalizeCityKey(right)] ?? 0).compareTo(
        counts[_normalizeCityKey(left)] ?? 0,
      );
      if (countCompare != 0) {
        return countCompare;
      }
      return left.toLowerCase().compareTo(right.toLowerCase());
    });
    return options;
  }

  List<String> _homeCitySuggestions(WorkerDashboardModel dashboard) {
    final suggestions = <String>[];
    final rankedCities = _popularCities(dashboard);

    void addCity(String city) {
      final trimmed = city.trim();
      if (trimmed.isEmpty) {
        return;
      }
      final key = _normalizeCityKey(trimmed);
      if (key.isEmpty ||
          suggestions.any((item) => _normalizeCityKey(item) == key)) {
        return;
      }
      suggestions.add(trimmed);
    }

    for (final city in _favouriteCities) {
      addCity(city);
    }

    addCity(_liveCity);

    for (final city in rankedCities) {
      if (suggestions.length >= 3) {
        break;
      }
      addCity(city);
    }

    if (suggestions.length < 2) {
      for (final city in _availableCityOptions(dashboard)) {
        if (suggestions.length >= 3) {
          break;
        }
        addCity(city);
      }
    }

    return suggestions.take(3).toList(growable: false);
  }

  List<WorkerCategoryOption> _popularCategories(
      WorkerDashboardModel dashboard) {
    final categories = List<WorkerCategoryOption>.from(
      dashboard.availableCategories.where((item) => item.isActive),
    );
    categories.sort((left, right) {
      if (left.showOnHome != right.showOnHome) {
        return left.showOnHome ? -1 : 1;
      }
      final orderCompare = left.homeOrder.compareTo(right.homeOrder);
      if (orderCompare != 0) {
        return orderCompare;
      }
      return left.name.toLowerCase().compareTo(right.name.toLowerCase());
    });
    final highlighted = categories.where((item) => item.showOnHome).toList();
    if (highlighted.isEmpty) {
      return categories;
    }
    final highlightedKeys = highlighted.map((item) => item.id).toSet();
    final remaining = categories
        .where((item) => !highlightedKeys.contains(item.id))
        .toList(growable: false);
    return [...highlighted, ...remaining];
  }

  List<Widget> _buildHomeSections(WorkerDashboardModel dashboard) {
    final popularCategories = _popularCategories(dashboard);
    final suggestedCities = _homeCitySuggestions(dashboard);
    final visibleCategories = _popularCategoriesExpanded
        ? popularCategories
        : popularCategories
            .take(_collapsedPopularCategoryCount)
            .toList(growable: false);
    return [
      _FavouriteCitiesSection(
        title: WorkerLocalizations.of(context).favouriteCitiesJobsHeading,
        changeLabel: WorkerLocalizations.of(context).isHindi ? 'बदलें' : 'Change',
        addMoreLabel: WorkerLocalizations.of(context).isHindi
            ? 'और जोड़ें'
            : 'Add more',
        clearLabel: WorkerLocalizations.of(context).clearAction,
        visibleCities: suggestedCities,
        cityJobCounts: _jobCountByCity(dashboard),
        onChange: _openFavouriteCitiesPicker,
        onClear: _favouriteCities.isEmpty ? null : _clearFavouriteCities,
        onCityTap: _openCityJobs,
      ),
      const SizedBox(height: 16),
      _PopularCategoriesSection(
        title: WorkerLocalizations.of(context).popularJobCategoriesHeading,
        options: visibleCategories,
        onCategoryTap: _openCategoryJobs,
        canExpand: popularCategories.length > _collapsedPopularCategoryCount,
        expanded: _popularCategoriesExpanded,
        onToggleExpand: () {
          setState(() {
            _popularCategoriesExpanded = !_popularCategoriesExpanded;
          });
        },
      ),
    ];
  }

  bool _itemMatchesCity(WorkerFeedItemModel item) {
    return _selectedCityFilter == 'all' ||
        _matchesNormalizedValue(_selectedCityFilter, [
          item.city,
          item.companyCity,
        ]);
  }

  bool _itemMatchesNearby(WorkerFeedItemModel item) {
    final workerLat = _livePosition?.latitude;
    final workerLng = _livePosition?.longitude;
    final resolvedCoordinates = _resolveJobCoordinatesForItem(item);
    final jobLat = resolvedCoordinates?.latitude ?? item.latitude;
    final jobLng = resolvedCoordinates?.longitude ?? item.longitude;
    if (workerLat != null &&
        workerLng != null &&
        jobLat != null &&
        jobLng != null) {
      return _haversineKm(workerLat, workerLng, jobLat, jobLng) <= 10;
    }
    final currentCity = _resolveCurrentCity(_dashboard!.profile);
    if (currentCity.trim().isEmpty) {
      return false;
    }
    return _matchesNormalizedValue(currentCity, [item.city, item.companyCity]);
  }

  bool _itemMatchesOtherCities(
    WorkerFeedItemModel item,
    WorkerProfileModel profile,
  ) {
    final currentCity = _resolveCurrentCity(profile);
    if (currentCity.trim().isEmpty) {
      return item.city.trim().isNotEmpty;
    }
    return !_matchesNormalizedValue(currentCity, [item.city]);
  }

  List<String> _availableCityOptions(WorkerDashboardModel dashboard) {
    final values = <String>{
      ...dashboard.availableCities.where((item) => item.trim().isNotEmpty),
      ...dashboard.feed
          .map((item) => item.city)
          .where((item) => item.trim().isNotEmpty),
      ...dashboard.feed
          .map((item) => item.companyCity)
          .where((item) => item.trim().isNotEmpty),
    };
    final options = values.toList()
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return options;
  }

  String _feedEmptyMessage(WorkerDashboardModel dashboard) {
    final l10n = WorkerLocalizations.of(context);
    if (_selectedFeedTab == _FeedViewTab.nearby &&
        _resolveCurrentCity(dashboard.profile).trim().isEmpty) {
      return l10n.enableLocationOrSelectCity;
    }
    final hasAnyFilter = _selectedFeedTab != _FeedViewTab.all ||
        _selectedIndustryFilter != 'all' ||
        _selectedBusinessTypeFilter != 'all' ||
        _selectedCategoryFilters.isNotEmpty ||
        _selectedCityFilter != 'all' ||
        _selectedWageBand != 'all' ||
        _showUnlockedOnly ||
        _showSavedOnly ||
        _showAppliedOnly ||
        _feedQuery.trim().isNotEmpty;
    if (hasAnyFilter) {
      return l10n.noJobsMatchCurrentFilters;
    }
    return l10n.noActiveJobsAvailable;
  }

  List<WorkerFeedItemModel> get _filteredFeed {
    final dashboard = _dashboard;
    if (dashboard == null) return const [];
    return _resolvedFilteredFeed(dashboard);
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
    final filteredFeed =
        dashboard == null ? const <WorkerFeedItemModel>[] : _filteredFeed;
    final visibleHomeFeed = filteredFeed.take(8).toList(growable: false);
    final sortedIndustryOptions = dashboard == null
        ? const <WorkerMasterOption>[]
        : _sortedIndustryOptions(dashboard);
    final businessTypeOptions = dashboard == null
        ? const <WorkerMasterOption>[]
        : _availableBusinessTypeOptions(dashboard);
    final categoryOptions = dashboard == null
        ? const <WorkerCategoryOption>[]
        : _availableCategoryOptions(dashboard);
    final cityOptions =
        dashboard == null ? const <String>[] : _availableCityOptions(dashboard);

    return Scaffold(
      appBar: AppBar(
        centerTitle: false,
        toolbarHeight: 76,
        titleSpacing: 0,
        title: Align(
          alignment: Alignment.centerLeft,
          child: InkWell(
            onTap: () {
              if (_selectedIndex != 0) {
                unawaited(_selectTab(0));
              }
            },
            borderRadius: BorderRadius.circular(8),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 190),
              child: SizedBox(
                height: 36,
                child: Image.asset(
                  'assets/images/rozgar-logo-horizontal.png',
                  fit: BoxFit.contain,
                  alignment: Alignment.centerLeft,
                ),
              ),
            ),
          ),
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
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 1),
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
              tooltip: l10n.isHindi
                  ? 'सेव्ड जॉब्स'
                  : 'Saved jobs',
            ),
          if (dashboard != null)
            IconButton(
              onPressed: () => unawaited(_selectTab(3)),
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_none_rounded),
                  if (dashboard.unreadNotificationCount > 0)
                    Positioned(
                      right: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 1),
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
          if (dashboard != null)
            IconButton(
              onPressed: _openSupport,
              icon: const Icon(Icons.support_agent_rounded),
              tooltip: l10n.isHindi ? 'सपोर्ट' : 'Support',
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
                  if (_loading || _tabSwitching)
                    const LinearProgressIndicator(minHeight: 2),
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
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 180),
                      child: KeyedSubtree(
                        key: ValueKey<int>(_selectedIndex),
                        child: switch (_selectedIndex) {
                          0 => _FeedTab(
                              dashboard: dashboard,
                              visibleJobsCount: filteredFeed.length,
                              liveLocation:
                                  _liveLocationSnapshot(dashboard.profile),
                              resolveJobCoordinatesForItem:
                                  _resolveJobCoordinatesForItem,
                              feed: visibleHomeFeed,
                              emptyStateMessage: _feedEmptyMessage(dashboard),
                              query: _feedQuery,
                              selectedFeedTab: _selectedFeedTab,
                              showUnlockedOnly: _showUnlockedOnly,
                              showSavedOnly: _showSavedOnly,
                              showAppliedOnly: _showAppliedOnly,
                              selectedIndustryFilter: _selectedIndustryFilter,
                              selectedBusinessTypeFilter:
                                  _selectedBusinessTypeFilter,
                              selectedCategoryFilters: _selectedCategoryFilters,
                              selectedCityFilter: _selectedCityFilter,
                              selectedWageBand: _selectedWageBand,
                              industryOptions: sortedIndustryOptions,
                              businessTypeOptions: businessTypeOptions,
                              categoryOptions: categoryOptions,
                              cityOptions: cityOptions,
                              activeJobActionId: _jobActionId,
                              onRefresh: _loadDashboard,
                              onFeedTabChanged: (value) => _scheduleFilterUpdate(
                                () => _selectedFeedTab = value,
                              ),
                              onQueryChanged: (value) => _scheduleFilterUpdate(
                                () => _feedQuery = value,
                                delay: const Duration(milliseconds: 220),
                              ),
                              onToggleUnlockedOnly: (value) =>
                                  _scheduleFilterUpdate(
                                () => _showUnlockedOnly = value,
                              ),
                              onToggleSavedOnly: (value) => _scheduleFilterUpdate(
                                () => _showSavedOnly = value,
                              ),
                              onToggleAppliedOnly: (value) =>
                                  _scheduleFilterUpdate(
                                () => _showAppliedOnly = value,
                              ),
                              onIndustryFilterChanged: (value) =>
                                  _scheduleFilterUpdate(() {
                                _selectedIndustryFilter = value;
                                _selectedBusinessTypeFilter = 'all';
                                final availableCategories =
                                    _availableCategoryOptions(dashboard);
                                final allowedKeys = availableCategories
                                    .expand((item) => [item.id, item.name])
                                    .map(_normalizeFilterKey)
                                    .where((item) => item.isNotEmpty)
                                    .toSet();
                                _selectedCategoryFilters =
                                    _selectedCategoryFilters
                                        .where((item) => allowedKeys.contains(
                                            _normalizeFilterKey(item)))
                                        .toList(growable: false);
                              }),
                              onBusinessTypeFilterChanged: (value) =>
                                  _scheduleFilterUpdate(() {
                                _selectedBusinessTypeFilter = value;
                                final availableCategories =
                                    _availableCategoryOptions(dashboard);
                                final allowedKeys = availableCategories
                                    .expand((item) => [item.id, item.name])
                                    .map(_normalizeFilterKey)
                                    .where((item) => item.isNotEmpty)
                                    .toSet();
                                _selectedCategoryFilters =
                                    _selectedCategoryFilters
                                        .where((item) => allowedKeys.contains(
                                            _normalizeFilterKey(item)))
                                        .toList(growable: false);
                              }),
                              onCategoryFiltersChanged: (value) =>
                                  _scheduleFilterUpdate(
                                () => _selectedCategoryFilters =
                                    List.unmodifiable(value),
                              ),
                              onCityFilterChanged: (value) =>
                                  _scheduleFilterUpdate(
                                () => _selectedCityFilter = value,
                              ),
                              onWageBandChanged: (value) =>
                                  _scheduleFilterUpdate(
                                () => _selectedWageBand = value,
                              ),
                              onClearFilters: () => _scheduleFilterUpdate(() {
                                _feedQuery = '';
                                _selectedFeedTab = _FeedViewTab.all;
                                _showUnlockedOnly = false;
                                _showSavedOnly = false;
                                _showAppliedOnly = false;
                                _selectedIndustryFilter = 'all';
                                _selectedBusinessTypeFilter = 'all';
                                _selectedCategoryFilters = const [];
                                _selectedCityFilter = 'all';
                                _selectedWageBand = 'all';
                              }),
                              onApply: _applyToJob,
                              onToggleSaved: _toggleSavedJob,
                              onOpenDetails: _openJobDetails,
                              showViewMoreButton: filteredFeed.length > 8,
                              onViewMoreJobs: _openViewMoreJobs,
                              sectionsAfterJobs: _buildHomeSections(dashboard),
                              isFilteringJobs: _filtersUpdating,
                              scrollStorageKey:
                                  const PageStorageKey<String>('worker-home-feed'),
                            ),
                          1 => _WalletTab(
                              dashboard: dashboard,
                              rechargeAmountController:
                                  _rechargeAmountController,
                              rechargeNoteController: _rechargeNoteController,
                              onStartWalletRecharge: _startWalletRecharge,
                              onToggleWalletStatus: _handleWalletStatusTap,
                              onRefresh: _loadDashboard,
                              loading: _walletPaymentLoading || _walletStatusLoading || _loading,
                              statusLoading: _walletStatusLoading,
                            ),
                          2 => _ProfileTab(
                              dashboard: dashboard,
                              onSave: _saveProfile,
                              onLogout: _logout,
                              onRefresh: _loadDashboard,
                              loading: _loading,
                            ),
                          _ => _NotificationsTab(
                              notifications: dashboard.notifications,
                              loading: _notificationsLoading,
                              onRefresh: _loadDashboard,
                              onMarkAllRead: () => _markNotificationsRead(),
                              onMarkRead: (notificationId) =>
                                  _markNotificationsRead(
                                notificationIds: [notificationId],
                              ),
                            ),
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            unawaited(_selectTab(index)),
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.work_outline_rounded),
            selectedIcon: Icon(Icons.work_rounded),
            label: l10n.isHindi ? 'होम' : 'Home',
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
  final _LiveLocationSnapshot liveLocation;

  const _TopSummarySection({
    required this.dashboard,
    required this.visibleJobsCount,
    required this.liveLocation,
  });

  @override
  Widget build(BuildContext context) {
    final profile = dashboard.profile;
    final l10n = WorkerLocalizations.of(context);
    final primaryLocation =
        _resolvePrimaryLiveLocation(liveLocation, profile, l10n);
    final secondaryLocation =
        _resolveSecondaryLiveLocation(liveLocation, profile);
    final isActive = _dashboardWorkerActive(dashboard);
    final walletValue = 'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}';
    final jobsValue = '$visibleJobsCount';
    final salaryTypeLabel = l10n.workerSalaryTypeLabel(
      profile.salaryType.trim().isEmpty ? 'Daily Wage' : profile.salaryType.trim(),
    );
    final wageValue = profile.expectedDailyWage > 0
        ? 'Rs ${profile.expectedDailyWage.toStringAsFixed(profile.expectedDailyWage % 1 == 0 ? 0 : 1)}'
        : '—';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF173C77), Color(0xFF214A9A), Color(0xFF2F6FDF)],
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
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.navigation_rounded,
                            size: 18,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              primaryLocation,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (secondaryLocation.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Padding(
                          padding: const EdgeInsets.only(left: 26),
                          child: Text(
                            secondaryLocation,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFFD7E4FF),
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _CompactStatusPill(isActive: isActive),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: _SummaryChip(
                    label: l10n.wallet,
                    value: walletValue,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryChip(
                    label: l10n.jobs,
                    value: jobsValue,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SummaryChip(
                    label: salaryTypeLabel,
                    value: wageValue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedFilterTabChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FeedFilterTabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF173C77) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? const Color(0xFF173C77) : const Color(0xFFD6E0F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : const Color(0xFF173C77),
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _FeedTab extends StatelessWidget {
  final WorkerDashboardModel dashboard;
  final int visibleJobsCount;
  final _LiveLocationSnapshot liveLocation;
  final _DerivedJobCoordinates? Function(WorkerFeedItemModel item)
      resolveJobCoordinatesForItem;
  final List<WorkerFeedItemModel> feed;
  final String emptyStateMessage;
  final String query;
  final _FeedViewTab selectedFeedTab;
  final bool showUnlockedOnly;
  final bool showSavedOnly;
  final bool showAppliedOnly;
  final String selectedIndustryFilter;
  final String selectedBusinessTypeFilter;
  final List<String> selectedCategoryFilters;
  final String selectedCityFilter;
  final String selectedWageBand;
  final List<WorkerMasterOption> industryOptions;
  final List<WorkerMasterOption> businessTypeOptions;
  final List<WorkerCategoryOption> categoryOptions;
  final List<String> cityOptions;
  final String activeJobActionId;
  final Future<void> Function() onRefresh;
  final ValueChanged<_FeedViewTab> onFeedTabChanged;
  final ValueChanged<String> onQueryChanged;
  final ValueChanged<bool> onToggleUnlockedOnly;
  final ValueChanged<bool> onToggleSavedOnly;
  final ValueChanged<bool> onToggleAppliedOnly;
  final ValueChanged<String> onIndustryFilterChanged;
  final ValueChanged<String> onBusinessTypeFilterChanged;
  final ValueChanged<List<String>> onCategoryFiltersChanged;
  final ValueChanged<String> onCityFilterChanged;
  final ValueChanged<String> onWageBandChanged;
  final VoidCallback onClearFilters;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;
  final ValueChanged<WorkerFeedItemModel> onOpenDetails;
  final bool showTopSummarySection;
  final List<Widget> sectionsBeforeJobs;
  final List<Widget> sectionsAfterJobs;
  final bool showViewMoreButton;
  final VoidCallback? onViewMoreJobs;
  final bool isFilteringJobs;
  final Key? scrollStorageKey;

  const _FeedTab({
    required this.dashboard,
    required this.visibleJobsCount,
    required this.liveLocation,
    required this.resolveJobCoordinatesForItem,
    required this.feed,
    required this.emptyStateMessage,
    required this.query,
    required this.selectedFeedTab,
    required this.showUnlockedOnly,
    required this.showSavedOnly,
    required this.showAppliedOnly,
    required this.selectedIndustryFilter,
    required this.selectedBusinessTypeFilter,
    required this.selectedCategoryFilters,
    required this.selectedCityFilter,
    required this.selectedWageBand,
    required this.industryOptions,
    required this.businessTypeOptions,
    required this.categoryOptions,
    required this.cityOptions,
    required this.activeJobActionId,
    required this.onRefresh,
    required this.onFeedTabChanged,
    required this.onQueryChanged,
    required this.onToggleUnlockedOnly,
    required this.onToggleSavedOnly,
    required this.onToggleAppliedOnly,
    required this.onIndustryFilterChanged,
    required this.onBusinessTypeFilterChanged,
    required this.onCategoryFiltersChanged,
    required this.onCityFilterChanged,
    required this.onWageBandChanged,
    required this.onClearFilters,
    required this.onApply,
    required this.onToggleSaved,
    required this.onOpenDetails,
    this.showTopSummarySection = true,
    this.sectionsBeforeJobs = const [],
    this.sectionsAfterJobs = const [],
    this.showViewMoreButton = false,
    this.onViewMoreJobs,
    this.isFilteringJobs = false,
    this.scrollStorageKey,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final isWorkerActive = _dashboardWorkerActive(dashboard);
    Text _compactDropdownText(String text) {
      return Text(
        text,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 12.5,
          height: 1.15,
          fontWeight: FontWeight.w600,
        ),
      );
    }

    InputDecoration _compactDropdownDecoration(
      String label,
      IconData icon,
    ) {
      return InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        isDense: true,
        floatingLabelBehavior: FloatingLabelBehavior.always,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        floatingLabelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
        contentPadding: const EdgeInsets.fromLTRB(12, 18, 12, 10),
      );
    }

    final categoryNameByKey = <String, String>{
      for (final option in categoryOptions) option.id: option.name,
      for (final option in categoryOptions) option.name: option.name,
      for (final dependency in dashboard.categoryDependencies)
        dependency.categoryId: dependency.categoryName,
      for (final dependency in dashboard.categoryDependencies)
        dependency.categorySlug: dependency.categoryName,
      for (final dependency in dashboard.categoryDependencies)
        dependency.categoryName: dependency.categoryName,
    };
    final activeFilters = <String>[
      if (selectedFeedTab == _FeedViewTab.nearby)
        l10n.filterLabel(l10n.jobsNearYou, '10 km'),
      if (selectedFeedTab == _FeedViewTab.otherCities) l10n.otherCities,
      if (selectedFeedTab == _FeedViewTab.saved) l10n.saved,
      if (selectedFeedTab == _FeedViewTab.applied) l10n.appliedWithoutStatus,
      if (selectedIndustryFilter != 'all')
        l10n.filterLabel(
          l10n.industryCategory,
          _findMasterOptionLabel(industryOptions, selectedIndustryFilter),
        ),
      if (selectedBusinessTypeFilter != 'all')
        l10n.filterLabel(
          l10n.businessType,
          _findMasterOptionLabel(
            businessTypeOptions,
            selectedBusinessTypeFilter,
          ),
        ),
      if (selectedCategoryFilters.isNotEmpty)
        l10n.filterLabel(
          l10n.category,
          selectedCategoryFilters
              .map(
                (item) => _localizedCategoryLabel(
                  l10n,
                  categoryNameByKey[item] ?? item,
                ),
              )
              .join(', '),
        ),
      if (selectedCityFilter != 'all')
        l10n.filterLabel(l10n.city, selectedCityFilter),
      if (selectedWageBand == 'lt700')
        l10n.filterLabel(l10n.wage, 'Below Rs 700'),
      if (selectedWageBand == '700to999')
        l10n.filterLabel(l10n.wage, 'Rs 700 - 999'),
      if (selectedWageBand == '1000plus')
        l10n.filterLabel(l10n.wage, 'Rs 1000+'),
    ];
    final selectedCategorySummary = selectedCategoryFilters.isEmpty
        ? l10n.searchForSkills
        : selectedCategoryFilters
            .map(
              (item) => _localizedCategoryLabel(
                l10n,
                categoryNameByKey[item] ?? item,
              ),
            )
            .join(', ');
    final selectedCategoryDropdownValue = selectedCategoryFilters.length == 1 &&
            categoryOptions
                .any((option) => option.id == selectedCategoryFilters.first)
        ? selectedCategoryFilters.first
        : 'all';

    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: ListView(
        key: scrollStorageKey,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        children: [
          if (showTopSummarySection)
            _TopSummarySection(
              dashboard: dashboard,
              visibleJobsCount: visibleJobsCount,
              liveLocation: liveLocation,
            ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () async {
                      final selected = await showModalBottomSheet<List<String>>(
                        context: context,
                        isScrollControlled: true,
                        showDragHandle: true,
                        backgroundColor: Colors.white,
                        builder: (sheetContext) => _CategorySelectorSheet(
                          options: categoryOptions,
                          initiallySelected: selectedCategoryFilters,
                        ),
                      );
                      if (selected != null) {
                        onCategoryFiltersChanged(selected);
                      }
                    },
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: l10n.searchForSkills,
                        hintText: l10n.searchForSkills,
                        prefixIcon: const Icon(Icons.search_rounded),
                        suffixIcon:
                            const Icon(Icons.keyboard_arrow_down_rounded),
                      ),
                      child: Text(
                        selectedCategorySummary,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: selectedCategoryFilters.isEmpty
                              ? const Color(0xFF94A3B8)
                              : const Color(0xFF0F172A),
                          fontWeight: selectedCategoryFilters.isEmpty
                              ? FontWeight.w500
                              : FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _FeedFilterTabChip(
                          label: l10n.allJobs,
                          selected: selectedFeedTab == _FeedViewTab.all,
                          onTap: () => onFeedTabChanged(_FeedViewTab.all),
                        ),
                        const SizedBox(width: 10),
                        _FeedFilterTabChip(
                          label: l10n.jobsNearYou,
                          selected: selectedFeedTab == _FeedViewTab.nearby,
                          onTap: () => onFeedTabChanged(_FeedViewTab.nearby),
                        ),
                        const SizedBox(width: 10),
                        _FeedFilterTabChip(
                          label: l10n.otherCities,
                          selected: selectedFeedTab == _FeedViewTab.otherCities,
                          onTap: () =>
                              onFeedTabChanged(_FeedViewTab.otherCities),
                        ),
                        const SizedBox(width: 10),
                        _FeedFilterTabChip(
                          label: l10n.saved,
                          selected: selectedFeedTab == _FeedViewTab.saved,
                          onTap: () => onFeedTabChanged(_FeedViewTab.saved),
                        ),
                        const SizedBox(width: 10),
                        _FeedFilterTabChip(
                          label: l10n.appliedWithoutStatus,
                          selected: selectedFeedTab == _FeedViewTab.applied,
                          onTap: () => onFeedTabChanged(_FeedViewTab.applied),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    l10n.jobsAvailableForSelectedFilters(visibleJobsCount),
                    style: const TextStyle(
                      color: Color(0xFF173C77),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          l10n.advancedFilters,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                      ),
                      TextButton(
                        onPressed: onClearFilters,
                        child: Text(l10n.clearAction),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (selectedCategoryFilters.isNotEmpty) ...[
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.selectedJobTypes,
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: selectedCategoryFilters
                          .map(
                            (category) => Chip(
                              avatar: const Icon(Icons.check_circle_rounded,
                                  size: 18),
                              label: Text(
                                _localizedCategoryLabel(
                                  l10n,
                                  categoryNameByKey[category] ?? category,
                                ),
                              ),
                              onDeleted: () {
                                onCategoryFiltersChanged(
                                  selectedCategoryFilters
                                      .where((item) => item != category)
                                      .toList(),
                                );
                              },
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: selectedIndustryFilter,
                          selectedItemBuilder: (context) => [
                            _compactDropdownText(l10n.allIndustryCategories),
                            ...industryOptions.map(
                              (option) => _compactDropdownText(option.label),
                            ),
                          ],
                          items: [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text(
                                l10n.allIndustryCategories,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            ...industryOptions.map(
                              (option) => DropdownMenuItem(
                                value: option.id,
                                child: Text(
                                  option.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (value) {
                            if (value != null) {
                              onIndustryFilterChanged(value);
                            }
                          },
                          decoration: _compactDropdownDecoration(
                            l10n.industryCategory,
                            Icons.apartment_rounded,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: selectedBusinessTypeFilter,
                          selectedItemBuilder: (context) => [
                            _compactDropdownText(
                              selectedIndustryFilter == 'all'
                                  ? l10n.selectIndustryFirst
                                  : l10n.allBusinessTypes,
                            ),
                            ...businessTypeOptions.map(
                              (option) => _compactDropdownText(option.label),
                            ),
                          ],
                          items: [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text(
                                selectedIndustryFilter == 'all'
                                    ? l10n.selectIndustryFirst
                                    : l10n.allBusinessTypes,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            ...businessTypeOptions.map(
                              (option) => DropdownMenuItem(
                                value: option.id,
                                child: Text(
                                  option.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: selectedIndustryFilter == 'all'
                              ? null
                              : (value) {
                                  if (value != null) {
                                    onBusinessTypeFilterChanged(value);
                                  }
                                },
                          decoration: _compactDropdownDecoration(
                            l10n.businessType,
                            Icons.business_center_outlined,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: selectedCategoryDropdownValue,
                            selectedItemBuilder: (context) => [
                              _compactDropdownText(l10n.allCategories),
                              ...categoryOptions.map(
                                (option) => _compactDropdownText(
                                  _localizedCategoryLabel(l10n, option.name),
                                ),
                              ),
                            ],
                          items: [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text(
                                l10n.allCategories,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            ...categoryOptions.map(
                              (option) => DropdownMenuItem(
                                value: option.id,
                                child: Text(
                                  _localizedCategoryLabel(l10n, option.name),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (value) {
                            if (value == null) {
                              return;
                            }
                            onCategoryFiltersChanged(
                              value == 'all' ? const [] : [value],
                            );
                          },
                          decoration: _compactDropdownDecoration(
                            l10n.category,
                            Icons.category_rounded,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: selectedCityFilter,
                          selectedItemBuilder: (context) => [
                            _compactDropdownText(l10n.allCities),
                            ...cityOptions.map(
                              (city) => _compactDropdownText(city),
                            ),
                          ],
                          items: [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text(
                                l10n.allCities,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            ...cityOptions.map(
                              (city) => DropdownMenuItem(
                                value: city,
                                child: Text(
                                  city,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (value) {
                            if (value != null) {
                              onCityFilterChanged(value);
                            }
                          },
                          decoration: _compactDropdownDecoration(
                            l10n.cityFilter,
                            Icons.location_on_outlined,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    isExpanded: true,
                    value: selectedWageBand,
                    selectedItemBuilder: (context) => [
                      _compactDropdownText(l10n.allWages),
                      _compactDropdownText(
                        l10n.isHindi ? 'Rs 700 से कम' : 'Below Rs 700',
                      ),
                      _compactDropdownText('Rs 700 - 999'),
                      _compactDropdownText('Rs 1000+'),
                    ],
                    items: [
                      DropdownMenuItem(
                        value: 'all',
                        child: Text(
                          l10n.allWages,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'lt700',
                        child: Text(
                          l10n.isHindi ? 'Rs 700 से कम' : 'Below Rs 700',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      DropdownMenuItem(
                        value: '700to999',
                        child: Text(
                          l10n.isHindi ? 'Rs 700 - 999' : 'Rs 700 - 999',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      DropdownMenuItem(
                        value: '1000plus',
                        child: Text(
                          l10n.isHindi ? 'Rs 1000+' : 'Rs 1000+',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        onWageBandChanged(value);
                      }
                    },
                    decoration: _compactDropdownDecoration(
                      l10n.wageFilter,
                      Icons.currency_rupee_rounded,
                    ),
                  ),
                  if (activeFilters.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(8),
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
                                  l10n.activeFiltersTitle,
                                  style: const TextStyle(
                                    color: Color(0xFF173C77),
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: onClearFilters,
                                child: Text(l10n.clearAll),
                              ),
                            ],
                          ),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: activeFilters
                                .map(
                                  (filter) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 7),
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
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (sectionsBeforeJobs.isNotEmpty) ...[
            ...sectionsBeforeJobs,
            const SizedBox(height: 8),
          ],
          if (isFilteringJobs)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    l10n.isHindi
                        ? 'नौकरियां लोड हो रही हैं...'
                        : 'Loading jobs...',
                    style: const TextStyle(
                      color: Color(0xFF475569),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          if (feed.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Text(
                  emptyStateMessage,
                  style: const TextStyle(color: Color(0xFF475569), height: 1.6),
                ),
              ),
            )
          else
            ...feed.map(
              (item) {
                final actionLoading = activeJobActionId == item.id;
                final distanceLabel = _distanceLabel(
                  context,
                  liveLocation,
                  item,
                  resolvedCoordinates: resolveJobCoordinatesForItem(item),
                );
                final hasCompanyMobile =
                    (item.companyMobile ?? '').trim().isNotEmpty;
                final categoryMatch = _jobRankSetsIntersect(
                  _workerCategoryKeys(dashboard.profile),
                  _jobCategoryKeys(item),
                );
                final showLockedState = !categoryMatch;
                final canRevealCompanyContact =
                    isWorkerActive && !item.companyLocked && categoryMatch;
                final canContactCompany =
                    canRevealCompanyContact && hasCompanyMobile;
                final locationText = _locationLine(item, distanceLabel);
                final companyPerson = canRevealCompanyContact &&
                        (item.contactPerson ?? '').trim().isNotEmpty
                    ? item.contactPerson!.trim()
                    : '';
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: showLockedState
                          ? const Color(0xFFF2D7A6)
                          : const Color(0xFFDDE7F3),
                    ),
                  ),
                  child: InkWell(
                    onTap: () => onOpenDetails(item),
                    borderRadius: BorderRadius.circular(20),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: TweenAnimationBuilder<double>(
                                  tween: Tween(begin: 0, end: 1),
                                  duration: const Duration(milliseconds: 850),
                                  curve: Curves.easeOutCubic,
                                  builder: (context, value, child) {
                                    final shake =
                                        math.sin(value * math.pi * 4) *
                                            1.8 *
                                            (1 - value);
                                    final scale = 0.98 + (0.02 * value);
                                    return Transform.scale(
                                      scale: scale,
                                      child: Transform.translate(
                                        offset: Offset(shake, 0),
                                        child: child,
                                      ),
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: showLockedState
                                          ? const Color(0xFFFFF8EE)
                                          : const Color(0xFFE8F7EF),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: showLockedState
                                            ? const Color(0xFFF2D7A6)
                                            : const Color(0xFFB8E0C7),
                                      ),
                                    ),
                                    child: Text(
                                      _localizedCategoryLabel(
                                        l10n,
                                        item.categoryName,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: showLockedState
                                            ? const Color(0xFF9A5B13)
                                            : const Color(0xFF0F766E),
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900,
                                        height: 1.1,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              _statusBadge(
                                locked: showLockedState,
                                isHindi: l10n.isHindi,
                              ),
                              const SizedBox(width: 6),
                              SizedBox(
                                width: 34,
                                height: 34,
                                child: IconButton(
                                  onPressed: actionLoading
                                      ? null
                                      : () => onToggleSaved(item.id),
                                  padding: EdgeInsets.zero,
                                  style: IconButton.styleFrom(
                                    backgroundColor: item.isSaved
                                        ? const Color(0xFFE8F0FF)
                                        : const Color(0xFFF8FAFC),
                                    side: const BorderSide(
                                      color: Color(0xFFD7E2EE),
                                    ),
                                  ),
                                  icon: Icon(
                                    item.isSaved
                                        ? Icons.bookmark_rounded
                                        : Icons.bookmark_outline_rounded,
                                    size: 18,
                                    color: const Color(0xFF173C77),
                                  ),
                                  tooltip: item.isSaved
                                      ? l10n.removeFromShortlist
                                      : l10n.saveJob,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.companyName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Color(0xFF0F172A),
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    if (item.title.trim().isNotEmpty &&
                                        item.title.trim() !=
                                            item.categoryName.trim()) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        item.title.trim(),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Color(0xFF64748B),
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF4F8FD),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: const Color(0xFFD6E4F0),
                                    ),
                                  ),
                                  child: Text(
                                    _wageLabel(l10n, item),
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(
                                      color: Color(0xFF173C77),
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w800,
                                      height: 1.15,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${l10n.isHindi ? 'आवश्यक वर्कर' : 'Workers Needed'}: ${item.workersNeeded}',
                            style: const TextStyle(
                              color: Color(0xFF334155),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (canRevealCompanyContact) ...[
                            const SizedBox(height: 8),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Text(
                                    '${l10n.isHindi ? 'संपर्क व्यक्ति' : 'Contact Person'}: $companyPerson',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFF334155),
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                if (canContactCompany) ...[
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 42,
                                    height: 42,
                                    child: OutlinedButton(
                                      onPressed: () => _openJobWhatsApp(
                                        context,
                                        item,
                                        dashboard.profile,
                                      ),
                                      style: OutlinedButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                        backgroundColor:
                                            const Color(0xFFEFFAF3),
                                        side: const BorderSide(
                                          color: Color(0xFFB7E8C6),
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                      ),
                                      child: Image.asset(
                                        'assets/images/whatsapp_icon.jpeg',
                                        width: 22,
                                        height: 22,
                                        fit: BoxFit.contain,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 42,
                                    height: 42,
                                    child: OutlinedButton(
                                      onPressed: () =>
                                          _callJobCompany(context, item),
                                      style: OutlinedButton.styleFrom(
                                        padding: EdgeInsets.zero,
                                        backgroundColor:
                                            const Color(0xFFF8FAFC),
                                        side: const BorderSide(
                                          color: Color(0xFFD7E2EE),
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.call_rounded,
                                        size: 19,
                                        color: Color(0xFF173C77),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                size: 16,
                                color: Color(0xFF64748B),
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  locationText,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (item.hasApplied || item.isSaved) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                if (item.hasApplied)
                                  _chip(
                                    item.applicationStatus == null
                                        ? l10n.appliedWithoutStatus
                                        : l10n.appliedStatusLabel(
                                            item.applicationStatus!,
                                          ),
                                    fill: const Color(0xFFEFF6FF),
                                  ),
                                if (item.isSaved)
                                  _chip(
                                    l10n.saved,
                                    fill: const Color(0xFFF0FDF4),
                                  ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => onOpenDetails(item),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                    side: const BorderSide(
                                      color: Color(0xFFD7E2EE),
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: Text(
                                    l10n.isHindi
                                        ? 'विवरण देखें'
                                        : 'View details',
                                    style: const TextStyle(
                                      color: Color(0xFF173C77),
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: FilledButton(
                                  onPressed: item.hasApplied || actionLoading
                                      ? null
                                      : showLockedState
                                          ? () => _showCategoryLockedMessageDialog(
                                                context,
                                              )
                                          : () => onApply(item.id),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: const Color(0xFF173C77),
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: Text(
                                    actionLoading
                                        ? l10n.working
                                        : item.hasApplied
                                            ? l10n.applicationSent
                                            : l10n.applyToJob,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          if (showViewMoreButton &&
              onViewMoreJobs != null &&
              visibleJobsCount > feed.length) ...[
            const SizedBox(height: 6),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onViewMoreJobs,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: Text(
                  l10n.viewMoreJobs,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ],
          if (sectionsAfterJobs.isNotEmpty) ...[
            const SizedBox(height: 16),
            ...sectionsAfterJobs,
          ],
        ],
      ),
    );
  }

  static String _salaryTypeLabel(
    WorkerLocalizations l10n,
    WorkerFeedItemModel item,
  ) {
    final normalized = (item.shiftType ?? '').trim().toLowerCase();
    if (normalized.contains('month')) {
      return _localizeCommonJobText(l10n, 'Monthly Salary');
    }
    if (normalized.contains('week')) {
      return _localizeCommonJobText(l10n, 'Weekly Payment');
    }
    if (normalized.contains('contract')) {
      return _localizeCommonJobText(l10n, 'Contract Payment');
    }
    if (normalized.contains('piece')) {
      return _localizeCommonJobText(l10n, 'Piece Rate');
    }
    if (normalized.contains('daily')) {
      return _localizeCommonJobText(l10n, 'Daily Wage');
    }
    return '';
  }

  static String _wageLabel(
    WorkerLocalizations l10n,
    WorkerFeedItemModel item,
  ) {
    final amount = item.wageAmount % 1 == 0
        ? item.wageAmount.toStringAsFixed(0)
        : item.wageAmount.toStringAsFixed(1);
    final salaryType = _salaryTypeLabel(l10n, item);
    return salaryType.isEmpty ? 'Rs $amount' : 'Rs $amount $salaryType';
  }

  static String _locationLine(
    WorkerFeedItemModel item,
    String distanceLabel,
  ) {
    final locationParts = <String>[
      if (item.companyArea.trim().isNotEmpty) item.companyArea.trim(),
      if (item.companyCity.trim().isNotEmpty)
        item.companyCity.trim()
      else if (item.city.trim().isNotEmpty)
        item.city.trim(),
    ];
    if (locationParts.isEmpty && item.locationLabel.trim().isNotEmpty) {
      locationParts.add(item.locationLabel.trim());
    }
    if (distanceLabel.trim().isEmpty) {
      return locationParts.join(', ');
    }
    if (locationParts.isEmpty) {
      return distanceLabel;
    }
    return '${locationParts.join(', ')} • $distanceLabel';
  }

  static Widget _statusBadge({
    required bool locked,
    required bool isHindi,
  }) {
    final background =
        locked ? const Color(0xFFFFF4E5) : const Color(0xFFE8F7EF);
    final border = locked ? const Color(0xFFF5C98B) : const Color(0xFF9DD7B6);
    final textColor =
        locked ? const Color(0xFF9A5B13) : const Color(0xFF166534);
    final label = locked
        ? _lockedCategoryBadgeLabel(isHindi)
        : (isHindi ? 'मैचिंग' : 'Matching');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 11.5,
          fontWeight: FontWeight.w800,
        ),
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

class _AllJobsPage extends StatefulWidget {
  final String token;
  final WorkerDashboardModel initialDashboard;
  final bool initialIsWorkerActive;
  final _LiveLocationSnapshot initialLiveLocation;
  final _DerivedJobCoordinates? Function(WorkerFeedItemModel item)
      resolveJobCoordinatesForItem;
  final String initialQuery;
  final _FeedViewTab initialFeedTab;
  final bool initialShowUnlockedOnly;
  final bool initialShowSavedOnly;
  final bool initialShowAppliedOnly;
  final String initialSelectedIndustryFilter;
  final String initialSelectedBusinessTypeFilter;
  final List<String> initialSelectedCategoryFilters;
  final String initialSelectedCityFilter;
  final String initialSelectedWageBand;
  final VoidCallback onOpenWallet;

  const _AllJobsPage({
    required this.token,
    required this.initialDashboard,
    required this.initialIsWorkerActive,
    required this.initialLiveLocation,
    required this.resolveJobCoordinatesForItem,
    required this.initialQuery,
    required this.initialFeedTab,
    required this.initialShowUnlockedOnly,
    required this.initialShowSavedOnly,
    required this.initialShowAppliedOnly,
    required this.initialSelectedIndustryFilter,
    required this.initialSelectedBusinessTypeFilter,
    required this.initialSelectedCategoryFilters,
    required this.initialSelectedCityFilter,
    required this.initialSelectedWageBand,
    required this.onOpenWallet,
  });

  @override
  State<_AllJobsPage> createState() => _AllJobsPageState();
}

class _AllJobsPageState extends State<_AllJobsPage> {
  final _apiService = WorkerApiService();
  Timer? _filterUpdateDebounce;

  late WorkerDashboardModel _dashboard;
  late bool _isWorkerActive;
  late String _feedQuery;
  late _FeedViewTab _selectedFeedTab;
  late bool _showUnlockedOnly;
  late bool _showSavedOnly;
  late bool _showAppliedOnly;
  late String _selectedIndustryFilter;
  late String _selectedBusinessTypeFilter;
  late List<String> _selectedCategoryFilters;
  late String _selectedCityFilter;
  late String _selectedWageBand;

  bool _loading = false;
  bool _filtersUpdating = false;
  String _jobActionId = '';
  String _filteredFeedCacheKey = '';
  List<WorkerFeedItemModel> _filteredFeedCache = const [];
  String _sortedIndustryOptionsCacheKey = '';
  List<WorkerMasterOption> _sortedIndustryOptionsCache = const [];

  @override
  void initState() {
    super.initState();
    _dashboard = widget.initialDashboard;
    _isWorkerActive = widget.initialIsWorkerActive;
    _feedQuery = widget.initialQuery;
    _selectedFeedTab = widget.initialFeedTab;
    _showUnlockedOnly = widget.initialShowUnlockedOnly;
    _showSavedOnly = widget.initialShowSavedOnly;
    _showAppliedOnly = widget.initialShowAppliedOnly;
    _selectedIndustryFilter = widget.initialSelectedIndustryFilter;
    _selectedBusinessTypeFilter = widget.initialSelectedBusinessTypeFilter;
    _selectedCategoryFilters = List<String>.from(
      widget.initialSelectedCategoryFilters,
    );
    _selectedCityFilter = widget.initialSelectedCityFilter;
    _selectedWageBand = widget.initialSelectedWageBand;
  }

  @override
  void dispose() {
    _filterUpdateDebounce?.cancel();
    super.dispose();
  }

  String _cleanError(Object error) {
    return error.toString().replaceFirst('Exception: ', '').trim();
  }

  void _scheduleFilterUpdate(
    VoidCallback update, {
    Duration delay = const Duration(milliseconds: 140),
  }) {
    _filterUpdateDebounce?.cancel();
    if (!_filtersUpdating && mounted) {
      setState(() => _filtersUpdating = true);
    }
    _filterUpdateDebounce = Timer(delay, () {
      if (!mounted) return;
      setState(() {
        update();
        _filtersUpdating = false;
      });
    });
  }

  String _filteredFeedSignature() {
    return [
      identityHashCode(_dashboard),
      _feedQuery.trim().toLowerCase(),
      _selectedFeedTab.name,
      _showUnlockedOnly,
      _showSavedOnly,
      _showAppliedOnly,
      _normalizeFilterKey(_selectedIndustryFilter),
      _normalizeFilterKey(_selectedBusinessTypeFilter),
      _selectedCategoryFilters.map(_normalizeFilterKey).join(','),
      _normalizeFilterKey(_selectedCityFilter),
      _selectedWageBand,
      _normalizeFilterKey(widget.initialLiveLocation.city),
      _normalizeFilterKey(widget.initialLiveLocation.area),
      widget.initialLiveLocation.latitude?.toStringAsFixed(5) ?? '',
      widget.initialLiveLocation.longitude?.toStringAsFixed(5) ?? '',
    ].join('|');
  }

  List<WorkerFeedItemModel> _computeFilteredFeed() {
    final filtered = _dashboard.feed.where((item) {
      final matchesQuery = _feedQuery.isEmpty ||
          item.title.toLowerCase().contains(_feedQuery.toLowerCase()) ||
          item.city.toLowerCase().contains(_feedQuery.toLowerCase()) ||
          item.categoryName.toLowerCase().contains(_feedQuery.toLowerCase());
      final matchesLock = !_showUnlockedOnly || !item.companyLocked;
      final matchesSaved =
          (_selectedFeedTab != _FeedViewTab.saved && !_showSavedOnly) ||
              item.isSaved;
      final matchesApplied =
          (_selectedFeedTab != _FeedViewTab.applied && !_showAppliedOnly) ||
              item.hasApplied;
      final matchesIndustry = _itemMatchesIndustry(item);
      final matchesBusinessType = _itemMatchesBusinessType(item);
      final matchesCategory = _itemMatchesSelectedCategories(item);
      final matchesCity = _itemMatchesCity(item);
      final matchesWage = _matchesWageBand(item.wageAmount, _selectedWageBand);
      final matchesTab = switch (_selectedFeedTab) {
        _FeedViewTab.all => true,
        _FeedViewTab.saved => item.isSaved,
        _FeedViewTab.applied => item.hasApplied,
        _FeedViewTab.otherCities => _itemMatchesOtherCities(item),
        _FeedViewTab.nearby => _itemMatchesNearby(item),
      };
      return matchesQuery &&
          matchesLock &&
          matchesSaved &&
          matchesApplied &&
          matchesIndustry &&
          matchesBusinessType &&
          matchesCategory &&
          matchesCity &&
          matchesWage &&
          matchesTab;
    }).toList(growable: false);

    return _rankWorkerFeedItems(
      items: filtered,
      dashboard: _dashboard,
      profile: _dashboard.profile,
      liveLocation: widget.initialLiveLocation,
    );
  }

  List<WorkerFeedItemModel> _resolvedFilteredFeed() {
    final signature = _filteredFeedSignature();
    if (_filteredFeedCacheKey == signature) {
      return _filteredFeedCache;
    }
    final filteredFeed = _computeFilteredFeed();
    _filteredFeedCacheKey = signature;
    _filteredFeedCache = filteredFeed;
    return filteredFeed;
  }

  List<WorkerMasterOption> _sortedIndustryOptions() {
    final signature = '${identityHashCode(_dashboard)}|industry-options';
    if (_sortedIndustryOptionsCacheKey == signature) {
      return _sortedIndustryOptionsCache;
    }
    final options = List<WorkerMasterOption>.from(
      _dashboard.availableIndustryCategories,
    )..sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
    _sortedIndustryOptionsCacheKey = signature;
    _sortedIndustryOptionsCache = options;
    return options;
  }

  String _normalizeFilterKey(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[-_/|]+'), ' ')
        .replaceAll(RegExp(r'[.,:;()[\]{}]+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ');
  }

  Set<String> _normalizedValueSet(Iterable<String?> values) {
    return values
        .map((value) => _normalizeFilterKey(value ?? ''))
        .where((value) => value.isNotEmpty)
        .toSet();
  }

  bool _setsIntersect(Set<String> left, Set<String> right) {
    return left.any(right.contains);
  }

  bool _matchesNormalizedValue(String selected, Iterable<String?> values) {
    final normalizedSelected = _normalizeFilterKey(selected);
    if (normalizedSelected.isEmpty) {
      return false;
    }
    for (final value in values) {
      if (_normalizeFilterKey(value ?? '') == normalizedSelected) {
        return true;
      }
    }
    return false;
  }

  Set<String> _selectedCategoryIdentityKeys(String selected) {
    final keys = <String>{_normalizeFilterKey(selected)}
      ..removeWhere((value) => value.isEmpty);
    if (keys.isEmpty) {
      return keys;
    }

    var changed = true;
    while (changed) {
      changed = false;

      for (final option in _dashboard.availableCategories) {
        final optionKeys = _normalizedValueSet([option.id, option.name]);
        if (!_setsIntersect(keys, optionKeys)) {
          continue;
        }
        final lengthBefore = keys.length;
        keys.addAll(optionKeys);
        if (keys.length != lengthBefore) {
          changed = true;
        }
      }

      for (final dependency in _dashboard.categoryDependencies) {
        final dependencyKeys = _normalizedValueSet([
          dependency.categoryId,
          dependency.categorySlug,
          dependency.categoryName,
        ]);
        if (!_setsIntersect(keys, dependencyKeys)) {
          continue;
        }
        final lengthBefore = keys.length;
        keys.addAll(dependencyKeys);
        if (keys.length != lengthBefore) {
          changed = true;
        }
      }
    }

    return keys;
  }

  String _resolveCurrentCity(WorkerProfileModel profile) {
    final liveCity = widget.initialLiveLocation.city.trim();
    if (liveCity.isNotEmpty) {
      return liveCity;
    }
    final profileCity = profile.city.trim();
    if (profileCity.isNotEmpty) {
      return profileCity;
    }
    return profile.homeCity.trim();
  }

  List<WorkerMasterOption> _availableBusinessTypeOptions() {
    final selectedIndustry = _selectedIndustryFilter;
    if (selectedIndustry == 'all') {
      return const [];
    }
    final allowedIds = _dashboard.industryBusinessDependencies
        .where(
          (dependency) => _matchesNormalizedValue(selectedIndustry, [
            dependency.industryCategory.id,
            dependency.industryCategory.slug,
            dependency.industryCategory.value,
            dependency.industryCategory.label,
          ]),
        )
        .map((dependency) => dependency.businessType.id)
        .toSet();
    return _dashboard.availableBusinessTypes
        .where((option) => allowedIds.contains(option.id))
        .toList()
      ..sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
  }

  List<WorkerCategoryOption> _availableCategoryOptions() {
    final categoriesByKey = <String, WorkerCategoryOption>{
      for (final option in _dashboard.availableCategories)
        _normalizeFilterKey(option.id): option,
      for (final option in _dashboard.availableCategories)
        _normalizeFilterKey(option.name): option,
    };

    Iterable<WorkerCategoryOption> options = _dashboard.availableCategories;
    if (_selectedIndustryFilter != 'all') {
      final filteredDependencyCategories =
          _dashboard.categoryDependencies.where(
        (dependency) {
          final matchesIndustry = _matchesNormalizedValue(
            _selectedIndustryFilter,
            [
              dependency.industryCategory.id,
              dependency.industryCategory.slug,
              dependency.industryCategory.value,
              dependency.industryCategory.label,
            ],
          );
          if (!matchesIndustry) {
            return false;
          }
          if (_selectedBusinessTypeFilter == 'all') {
            return true;
          }
          final businessType = dependency.businessType;
          return businessType != null &&
              _matchesNormalizedValue(_selectedBusinessTypeFilter, [
                businessType.id,
                businessType.slug,
                businessType.value,
                businessType.label,
              ]);
        },
      );
      final allowedKeys = filteredDependencyCategories
          .expand(
            (dependency) => [
              _normalizeFilterKey(dependency.categoryId),
              _normalizeFilterKey(dependency.categorySlug),
              _normalizeFilterKey(dependency.categoryName),
            ],
          )
          .where((value) => value.isNotEmpty)
          .toSet();
      options = _dashboard.availableCategories.where((option) {
        return allowedKeys.contains(_normalizeFilterKey(option.id)) ||
            allowedKeys.contains(_normalizeFilterKey(option.name));
      });
      if (options.isEmpty) {
        options = filteredDependencyCategories.map((dependency) {
          final match =
              categoriesByKey[_normalizeFilterKey(dependency.categoryId)] ??
                  categoriesByKey[_normalizeFilterKey(dependency.categoryName)];
          return match ??
              WorkerCategoryOption(
                id: dependency.categoryId,
                name: dependency.categoryName,
                description: '',
                imageUrl: '',
                showOnHome: false,
                homeOrder: 0,
                isActive: true,
              );
        });
      }
    }

    final deduped = <String, WorkerCategoryOption>{};
    for (final option in options) {
      final key = _normalizeFilterKey(
        option.id.isNotEmpty ? option.id : option.name,
      );
      if (key.isNotEmpty) {
        deduped[key] = option;
      }
    }
    return deduped.values.toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  }

  bool _itemMatchesIndustry(WorkerFeedItemModel item) {
    if (_selectedIndustryFilter == 'all') {
      return true;
    }
    final directValues = [
      item.industryCategoryId,
      item.industryCategorySlug,
      item.industryCategoryValue,
      item.industryCategoryLabel,
    ];
    if (_matchesNormalizedValue(_selectedIndustryFilter, directValues)) {
      return true;
    }
    for (final dependency in _dashboard.categoryDependencies) {
      final matchesCategory = _matchesNormalizedValue(item.categoryId, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categorySlug, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categoryName, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]);
      if (!matchesCategory) {
        continue;
      }
      if (_matchesNormalizedValue(_selectedIndustryFilter, [
        dependency.industryCategory.id,
        dependency.industryCategory.slug,
        dependency.industryCategory.value,
        dependency.industryCategory.label,
      ])) {
        return true;
      }
    }
    return false;
  }

  bool _itemMatchesBusinessType(WorkerFeedItemModel item) {
    if (_selectedBusinessTypeFilter == 'all') {
      return true;
    }
    final directValues = [
      item.businessTypeId,
      item.businessTypeSlug,
      item.businessTypeValue,
      item.businessTypeLabel,
    ];
    if (_matchesNormalizedValue(_selectedBusinessTypeFilter, directValues)) {
      return true;
    }
    for (final dependency in _dashboard.categoryDependencies) {
      final businessType = dependency.businessType;
      if (businessType == null) {
        continue;
      }
      final matchesCategory = _matchesNormalizedValue(item.categoryId, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categorySlug, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]) ||
          _matchesNormalizedValue(item.categoryName, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ]);
      if (!matchesCategory) {
        continue;
      }
      final matchesIndustry = _selectedIndustryFilter == 'all' ||
          _matchesNormalizedValue(_selectedIndustryFilter, [
            dependency.industryCategory.id,
            dependency.industryCategory.slug,
            dependency.industryCategory.value,
            dependency.industryCategory.label,
          ]);
      if (!matchesIndustry) {
        continue;
      }
      if (_matchesNormalizedValue(_selectedBusinessTypeFilter, [
        businessType.id,
        businessType.slug,
        businessType.value,
        businessType.label,
      ])) {
        return true;
      }
    }
    return false;
  }

  bool _itemMatchesSelectedCategories(WorkerFeedItemModel item) {
    if (_selectedCategoryFilters.isEmpty) {
      return true;
    }
    final itemCategoryKeys = _normalizedValueSet([
      item.categoryId,
      item.categorySlug,
      item.categoryName,
    ]);
    if (itemCategoryKeys.isEmpty) {
      return false;
    }
    return _selectedCategoryFilters.any(
      (selected) => _setsIntersect(
        _selectedCategoryIdentityKeys(selected),
        itemCategoryKeys,
      ),
    );
  }

  bool _itemMatchesCity(WorkerFeedItemModel item) {
    return _selectedCityFilter == 'all' ||
        _matchesNormalizedValue(_selectedCityFilter, [
          item.city,
          item.companyCity,
        ]);
  }

  bool _itemMatchesNearby(WorkerFeedItemModel item) {
    final workerLat = widget.initialLiveLocation.latitude;
    final workerLng = widget.initialLiveLocation.longitude;
    final resolvedCoordinates = widget.resolveJobCoordinatesForItem(item);
    final jobLat = resolvedCoordinates?.latitude ?? item.latitude;
    final jobLng = resolvedCoordinates?.longitude ?? item.longitude;
    if (workerLat != null &&
        workerLng != null &&
        jobLat != null &&
        jobLng != null) {
      return _haversineKm(workerLat, workerLng, jobLat, jobLng) <= 10;
    }
    final currentCity = _resolveCurrentCity(_dashboard.profile);
    if (currentCity.trim().isEmpty) {
      return false;
    }
    return _matchesNormalizedValue(currentCity, [item.city, item.companyCity]);
  }

  bool _itemMatchesOtherCities(WorkerFeedItemModel item) {
    final currentCity = _resolveCurrentCity(_dashboard.profile);
    if (currentCity.trim().isEmpty) {
      return item.city.trim().isNotEmpty;
    }
    return !_matchesNormalizedValue(currentCity, [item.city]);
  }

  List<String> _availableCityOptions() {
    final values = <String>{
      ..._dashboard.availableCities.where((item) => item.trim().isNotEmpty),
      ..._dashboard.feed
          .map((item) => item.city)
          .where((item) => item.trim().isNotEmpty),
      ..._dashboard.feed
          .map((item) => item.companyCity)
          .where((item) => item.trim().isNotEmpty),
    };
    final options = values.toList()
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return options;
  }

  String _feedEmptyMessage() {
    final l10n = WorkerLocalizations.of(context);
    if (_selectedFeedTab == _FeedViewTab.nearby &&
        _resolveCurrentCity(_dashboard.profile).trim().isEmpty) {
      return l10n.enableLocationOrSelectCity;
    }
    final hasAnyFilter = _selectedFeedTab != _FeedViewTab.all ||
        _selectedIndustryFilter != 'all' ||
        _selectedBusinessTypeFilter != 'all' ||
        _selectedCategoryFilters.isNotEmpty ||
        _selectedCityFilter != 'all' ||
        _selectedWageBand != 'all' ||
        _showUnlockedOnly ||
        _showSavedOnly ||
        _showAppliedOnly ||
        _feedQuery.trim().isNotEmpty;
    if (hasAnyFilter) {
      return l10n.noJobsMatchCurrentFilters;
    }
    return l10n.noActiveJobsAvailable;
  }

  List<WorkerFeedItemModel> get _filteredFeed {
    return _resolvedFilteredFeed();
  }

  Future<void> _loadDashboard() async {
    setState(() => _loading = true);
    try {
      final dashboard = await _apiService.getDashboard(widget.token);
      if (!mounted) return;
      setState(() {
        _dashboard = dashboard;
        _isWorkerActive = _dashboardWorkerActive(dashboard);
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_cleanError(error))));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _handleApply(String jobPostId) async {
    final selectedItem =
        _dashboard.feed.cast<WorkerFeedItemModel?>().firstWhere(
              (item) => item?.id == jobPostId,
              orElse: () => null,
            );
    if (selectedItem != null &&
        _isJobCategoryLockedForWorker(_dashboard.profile, selectedItem)) {
      await _showCategoryLockedMessageDialog(context);
      return;
    }
    if (!_isWorkerActive) {
      await _showWorkerInactiveRechargeDialog(
        context,
        onRecharge: () {
          widget.onOpenWallet();
          Navigator.of(context).pop();
        },
      );
      return;
    }
    final l10n = WorkerLocalizations.of(context);
    setState(() => _jobActionId = jobPostId);
    try {
      final dashboard = await _apiService.applyToJob(
        widget.token,
        jobPostId: jobPostId,
      );
      if (!mounted) return;
      setState(() {
        _dashboard = dashboard;
        _isWorkerActive = _dashboardWorkerActive(dashboard);
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.applicationSentSuccess)));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_cleanError(error))));
    } finally {
      if (mounted) {
        setState(() => _jobActionId = '');
      }
    }
  }

  Future<void> _handleToggleSaved(String jobPostId) async {
    setState(() => _jobActionId = jobPostId);
    try {
      final dashboard = await _apiService.toggleSavedJob(
        widget.token,
        jobPostId: jobPostId,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_cleanError(error))));
    } finally {
      if (mounted) {
        setState(() => _jobActionId = '');
      }
    }
  }

  void _openJobDetails(WorkerFeedItemModel item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _JobDetailsPage(
          item: item,
          profile: _dashboard.profile,
          isWorkerActive: _isWorkerActive,
          liveLocation: widget.initialLiveLocation,
          resolvedCoordinates: widget.resolveJobCoordinatesForItem(item),
          onApply: _handleApply,
          onToggleSaved: _handleToggleSaved,
          onOpenWallet: widget.onOpenWallet,
        ),
      ),
    );
  }

  void _clearFilters() {
    setState(() {
      _feedQuery = '';
      _selectedFeedTab = _FeedViewTab.all;
      _showUnlockedOnly = false;
      _showSavedOnly = false;
      _showAppliedOnly = false;
      _selectedIndustryFilter = 'all';
      _selectedBusinessTypeFilter = 'all';
      _selectedCategoryFilters = const [];
      _selectedCityFilter = 'all';
      _selectedWageBand = 'all';
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = _dashboard;
    final filteredFeed = _filteredFeed;
    final sortedIndustryOptions = _sortedIndustryOptions();
    final businessTypeOptions = _availableBusinessTypeOptions();
    final categoryOptions = _availableCategoryOptions();
    final cityOptions = _availableCityOptions();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          WorkerLocalizations.of(context).viewMoreJobs,
        ),
      ),
      body: SafeArea(
        top: false,
        bottom: false,
        child: Column(
          children: [
            if (_loading) const LinearProgressIndicator(minHeight: 2),
            Expanded(
              child: _FeedTab(
                dashboard: dashboard,
                visibleJobsCount: filteredFeed.length,
                liveLocation: widget.initialLiveLocation,
                resolveJobCoordinatesForItem:
                    widget.resolveJobCoordinatesForItem,
                feed: filteredFeed,
                emptyStateMessage: _feedEmptyMessage(),
                query: _feedQuery,
                selectedFeedTab: _selectedFeedTab,
                showUnlockedOnly: _showUnlockedOnly,
                showSavedOnly: _showSavedOnly,
                showAppliedOnly: _showAppliedOnly,
                selectedIndustryFilter: _selectedIndustryFilter,
                selectedBusinessTypeFilter: _selectedBusinessTypeFilter,
                selectedCategoryFilters: _selectedCategoryFilters,
                selectedCityFilter: _selectedCityFilter,
                selectedWageBand: _selectedWageBand,
                industryOptions: sortedIndustryOptions,
                businessTypeOptions: businessTypeOptions,
                categoryOptions: categoryOptions,
                cityOptions: cityOptions,
                activeJobActionId: _jobActionId,
                onRefresh: _loadDashboard,
                onFeedTabChanged: (value) =>
                    _scheduleFilterUpdate(() => _selectedFeedTab = value),
                onQueryChanged: (value) => _scheduleFilterUpdate(
                  () => _feedQuery = value,
                  delay: const Duration(milliseconds: 220),
                ),
                onToggleUnlockedOnly: (value) =>
                    _scheduleFilterUpdate(() => _showUnlockedOnly = value),
                onToggleSavedOnly: (value) =>
                    _scheduleFilterUpdate(() => _showSavedOnly = value),
                onToggleAppliedOnly: (value) =>
                    _scheduleFilterUpdate(() => _showAppliedOnly = value),
                onIndustryFilterChanged: (value) => _scheduleFilterUpdate(() {
                  _selectedIndustryFilter = value;
                  _selectedBusinessTypeFilter = 'all';
                  final availableCategories = _availableCategoryOptions();
                  final allowedKeys = availableCategories
                      .expand((item) => [item.id, item.name])
                      .map(_normalizeFilterKey)
                      .where((item) => item.isNotEmpty)
                      .toSet();
                  _selectedCategoryFilters = _selectedCategoryFilters
                      .where(
                        (item) =>
                            allowedKeys.contains(_normalizeFilterKey(item)),
                      )
                      .toList(growable: false);
                }),
                onBusinessTypeFilterChanged: (value) =>
                    _scheduleFilterUpdate(() {
                  _selectedBusinessTypeFilter = value;
                  final availableCategories = _availableCategoryOptions();
                  final allowedKeys = availableCategories
                      .expand((item) => [item.id, item.name])
                      .map(_normalizeFilterKey)
                      .where((item) => item.isNotEmpty)
                      .toSet();
                  _selectedCategoryFilters = _selectedCategoryFilters
                      .where(
                        (item) =>
                            allowedKeys.contains(_normalizeFilterKey(item)),
                      )
                      .toList(growable: false);
                }),
                onCategoryFiltersChanged: (value) => _scheduleFilterUpdate(
                  () => _selectedCategoryFilters = List.unmodifiable(value),
                ),
                onCityFilterChanged: (value) =>
                    _scheduleFilterUpdate(() => _selectedCityFilter = value),
                onWageBandChanged: (value) =>
                    _scheduleFilterUpdate(() => _selectedWageBand = value),
                onClearFilters: _clearFilters,
                onApply: _handleApply,
                onToggleSaved: _handleToggleSaved,
                onOpenDetails: _openJobDetails,
                showTopSummarySection: false,
                isFilteringJobs: _filtersUpdating,
                scrollStorageKey:
                    const PageStorageKey<String>('worker-all-jobs-feed'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FavouriteCitiesSection extends StatelessWidget {
  final String title;
  final String changeLabel;
  final String addMoreLabel;
  final String clearLabel;
  final List<String> visibleCities;
  final Map<String, int> cityJobCounts;
  final VoidCallback onChange;
  final VoidCallback? onClear;
  final ValueChanged<String> onCityTap;

  const _FavouriteCitiesSection({
    required this.title,
    required this.changeLabel,
    required this.addMoreLabel,
    required this.clearLabel,
    required this.visibleCities,
    required this.cityJobCounts,
    required this.onChange,
    required this.onClear,
    required this.onCityTap,
  });

  String _normalizeCityKey(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[-_/|]+'), ' ')
        .replaceAll(RegExp(r'[.,:;()[\]{}]+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final visibleCardCount = visibleCities.length + 1;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            OutlinedButton(
              onPressed: onChange,
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                changeLabel,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: onClear,
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                clearLabel,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final maxCardsInViewport =
                visibleCardCount >= 4 ? 4 : visibleCardCount;
            final totalSpacing = 8.0 * (maxCardsInViewport - 1);
            final cardWidth =
                ((constraints.maxWidth - totalSpacing) / maxCardsInViewport)
                    .clamp(84.0, 104.0);
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ...visibleCities.map((city) {
                    final count = cityJobCounts[_normalizeCityKey(city)] ?? 0;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: _FavouriteCityCard(
                        width: cardWidth,
                        city: city,
                        count: count,
                        onTap: () => onCityTap(city),
                      ),
                    );
                  }),
                  _AddMoreCityCard(
                    width: cardWidth,
                    label: addMoreLabel,
                    onTap: onChange,
                    accentColor: theme.colorScheme.primary,
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _FavouriteCityCard extends StatelessWidget {
  final double width;
  final String city;
  final int count;
  final VoidCallback onTap;

  const _FavouriteCityCard({
    required this.width,
    required this.city,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        width: width,
        height: 92,
        padding: const EdgeInsets.fromLTRB(9, 9, 9, 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7ED),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.45)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              city,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF9A3412),
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.bolt_rounded,
                    color: Color(0xFFF59E0B),
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      '$count Jobs',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF7C2D12),
                        fontSize: 10.2,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AddMoreCityCard extends StatelessWidget {
  final double width;
  final String label;
  final VoidCallback onTap;
  final Color accentColor;

  const _AddMoreCityCard({
    required this.width,
    required this.label,
    required this.onTap,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        width: width,
        height: 92,
        padding: const EdgeInsets.fromLTRB(9, 9, 9, 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: accentColor.withOpacity(0.35),
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: accentColor,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.add_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PopularCategoriesSection extends StatelessWidget {
  final String title;
  final List<WorkerCategoryOption> options;
  final ValueChanged<WorkerCategoryOption> onCategoryTap;
  final bool canExpand;
  final bool expanded;
  final VoidCallback? onToggleExpand;

  const _PopularCategoriesSection({
    required this.title,
    required this.options,
    required this.onCategoryTap,
    this.canExpand = false,
    this.expanded = false,
    this.onToggleExpand,
  });

  @override
  Widget build(BuildContext context) {
    if (options.isEmpty) {
      return const SizedBox.shrink();
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                ),
              ),
            ),
            if (canExpand && onToggleExpand != null)
              TextButton.icon(
                onPressed: onToggleExpand,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  foregroundColor: const Color(0xFF1D4ED8),
                  textStyle: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                iconAlignment: IconAlignment.end,
                icon: Icon(
                  expanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  size: 20,
                ),
                label: Text(
                  expanded
                      ? WorkerLocalizations.of(context).showLess
                      : WorkerLocalizations.of(context).showMore,
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final cardWidth =
                ((constraints.maxWidth - 24) / 4).clamp(78.0, 92.0);
            return Wrap(
              spacing: 8,
              runSpacing: 8,
              children: options.map((option) {
                return SizedBox(
                  width: cardWidth,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () => onCategoryTap(option),
                    child: Container(
                      height: 124,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          _CategoryImage(option: option),
                          const SizedBox(height: 6),
                          Expanded(
                            child: Align(
                              alignment: Alignment.topCenter,
                              child: Text(
                                _localizedCategoryLabel(
                                  WorkerLocalizations.of(context),
                                  option.name,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.fade,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 10,
                                  height: 1.15,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF334155),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(growable: false),
            );
          },
        ),
      ],
    );
  }
}

class _FavouriteCitiesPage extends StatefulWidget {
  final List<String> initialSelectedCities;
  final List<String> availableCities;
  final Map<String, int> cityJobCounts;

  const _FavouriteCitiesPage({
    required this.initialSelectedCities,
    required this.availableCities,
    required this.cityJobCounts,
  });

  @override
  State<_FavouriteCitiesPage> createState() => _FavouriteCitiesPageState();
}

class _FavouriteCitiesPageState extends State<_FavouriteCitiesPage> {
  final _searchController = TextEditingController();
  late List<String> _selectedCities;

  String _normalizeCityKey(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[-_/|]+'), ' ')
        .replaceAll(RegExp(r'[.,:;()[\]{}]+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ');
  }

  @override
  void initState() {
    super.initState();
    _selectedCities = List<String>.from(widget.initialSelectedCities);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _toggleCity(String city) {
    setState(() {
      if (_selectedCities.any(
        (item) => _normalizeCityKey(item) == _normalizeCityKey(city),
      )) {
        _selectedCities = _selectedCities
            .where((item) => _normalizeCityKey(item) != _normalizeCityKey(city))
            .toList(growable: false);
      } else {
        _selectedCities = [..._selectedCities, city];
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final filteredCities = widget.availableCities.where((city) {
      if (query.isEmpty) {
        return true;
      }
      return city.toLowerCase().contains(query);
    }).toList(growable: false);

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Set your preferred cities to view more jobs!',
                style: TextStyle(
                  fontSize: 30,
                  height: 1.12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'You will see jobs from selected locations.',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 16,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Search & add locations you like',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _searchController,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: 'Example: Mumbai',
                  prefixIcon: const Icon(Icons.search_rounded),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Selected Locations',
                style: TextStyle(
                  color: Color(0xFF475569),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _selectedCities
                    .map(
                      (city) => Chip(
                        label: Text(city),
                        onDeleted: () => _toggleCity(city),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 14),
              const Text(
                'Or select from the popular cities',
                style: TextStyle(
                  color: Color(0xFF475569),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: SingleChildScrollView(
                  child: Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: filteredCities.map((city) {
                      final selected = _selectedCities.any(
                        (item) =>
                            _normalizeCityKey(item) == _normalizeCityKey(city),
                      );
                      final count =
                          widget.cityJobCounts[_normalizeCityKey(city)] ?? 0;
                      return InkWell(
                        borderRadius: BorderRadius.circular(14),
                        onTap: () => _toggleCity(city),
                        child: Container(
                          width: 108,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFFE0E7FF)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF1D4ED8)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                city,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: selected
                                      ? const Color(0xFF1D4ED8)
                                      : const Color(0xFF1E293B),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$count Jobs',
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          Navigator.of(context).pop(const <String>[]),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'Skip',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () =>
                          Navigator.of(context).pop(_selectedCities),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        'Submit',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategorySelectorSheet extends StatefulWidget {
  final List<WorkerCategoryOption> options;
  final List<String> initiallySelected;

  const _CategorySelectorSheet({
    required this.options,
    required this.initiallySelected,
  });

  @override
  State<_CategorySelectorSheet> createState() => _CategorySelectorSheetState();
}

class _CategorySelectorSheetState extends State<_CategorySelectorSheet> {
  final _searchController = TextEditingController();
  late final Set<String> _selectedIds;

  @override
  void initState() {
    super.initState();
    _selectedIds = {...widget.initiallySelected};
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final query = _searchController.text.trim().toLowerCase();
    final filteredOptions = widget.options.where((option) {
      final name = option.name.trim().toLowerCase();
      final description = option.description.trim().toLowerCase();
      return query.isEmpty ||
          name.contains(query) ||
          description.contains(query);
    }).toList();

    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 180),
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: FractionallySizedBox(
          heightFactor: 0.9,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 8, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.selectJobTypeYouWant,
                  style: const TextStyle(
                      fontSize: 24, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: l10n.searchJobType,
                    prefixIcon: const Icon(Icons.search_rounded),
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: filteredOptions.isEmpty
                      ? Center(
                          child: Text(
                            l10n.noJobTypesFound,
                            style: const TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w700,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        )
                      : ListView.separated(
                          itemCount: filteredOptions.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final option = filteredOptions[index];
                            final selected = _selectedIds.contains(option.id);
                            return InkWell(
                              borderRadius: BorderRadius.circular(18),
                              onTap: () {
                                setState(() {
                                  if (selected) {
                                    _selectedIds.remove(option.id);
                                  } else {
                                    _selectedIds.add(option.id);
                                  }
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: selected
                                        ? const Color(0xFF173C77)
                                        : const Color(0xFFE2E8F0),
                                    width: selected ? 1.4 : 1,
                                  ),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x0F0F172A),
                                      blurRadius: 16,
                                      offset: Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    _CategoryImage(option: option),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _localizedCategoryLabel(
                                              WorkerLocalizations.of(context),
                                              option.name,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          if (option.description
                                              .trim()
                                              .isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              option.description.trim(),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                color: Color(0xFF64748B),
                                                fontSize: 12.5,
                                                height: 1.35,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Checkbox(
                                      value: selected,
                                      activeColor: const Color(0xFF173C77),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      onChanged: (value) {
                                        setState(() {
                                          if (value ?? false) {
                                            _selectedIds.add(option.id);
                                          } else {
                                            _selectedIds.remove(option.id);
                                          }
                                        });
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(l10n.backAction),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => Navigator.of(context)
                            .pop(_selectedIds.toList()..sort()),
                        child: Text(l10n.applyFilters),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryImage extends StatelessWidget {
  final WorkerCategoryOption option;

  const _CategoryImage({required this.option});

  @override
  Widget build(BuildContext context) {
    final imageUrl = option.imageUrl.trim();
    final fallback = Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: const Color(0xFFF0F6FF),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Icon(Icons.category_rounded, color: Color(0xFF173C77)),
    );

    if (imageUrl.isEmpty) {
      return fallback;
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Image.network(
        imageUrl,
        width: 52,
        height: 52,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => fallback,
      ),
    );
  }
}

class _JobDetailsPage extends StatefulWidget {
  final WorkerFeedItemModel item;
  final WorkerProfileModel profile;
  final bool isWorkerActive;
  final _LiveLocationSnapshot liveLocation;
  final _DerivedJobCoordinates? resolvedCoordinates;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;
  final VoidCallback onOpenWallet;

  const _JobDetailsPage({
    required this.item,
    required this.profile,
    required this.isWorkerActive,
    required this.liveLocation,
    required this.resolvedCoordinates,
    required this.onApply,
    required this.onToggleSaved,
    required this.onOpenWallet,
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
    final categoryMatch = _jobRankSetsIntersect(
      _workerCategoryKeys(widget.profile),
      _jobCategoryKeys(widget.item),
    );
    final showLockedState = widget.item.companyLocked || !categoryMatch;
    if (showLockedState) {
      await _showCategoryLockedDialog();
      return;
    }
    if (!widget.isWorkerActive) {
      await _showRechargeWalletDialog();
      return;
    }
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

  Future<void> _showCategoryLockedDialog() async {
    await _showCategoryLockedMessageDialog(context);
  }

  Future<void> _showRechargeWalletDialog() async {
    await _showWorkerInactiveRechargeDialog(
      context,
      onRecharge: () {
        widget.onOpenWallet();
        Navigator.of(context).popUntil((route) => route.isFirst);
      },
    );
  }

  Future<void> _openWhatsApp() async {
    final l10n = WorkerLocalizations.of(context);
    final companyMobile = widget.item.companyMobile?.trim() ?? '';
    final normalizedPhone = _normalizeWhatsappPhone(companyMobile);
    if (normalizedPhone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'कंपनी का व्हाट्सएप नंबर उपलब्ध नहीं है।'
                : 'Company WhatsApp number is not available.',
          ),
        ),
      );
      return;
    }

    final message = _buildWhatsAppMessage(
      item: widget.item,
      profile: widget.profile,
      isHindi: l10n.isHindi,
    );
    final uri = Uri.parse(
      'https://wa.me/$normalizedPhone?text=${Uri.encodeComponent(message)}',
    );

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'व्हाट्सएप खोला नहीं जा सका।'
                : 'Could not open WhatsApp.',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final item = widget.item;
    final distanceLabel = _distanceLabel(
      context,
      widget.liveLocation,
      item,
      resolvedCoordinates: widget.resolvedCoordinates,
    );
    final locationLine = _FeedTab._locationLine(item, distanceLabel);
    final companyLocationLine = _joinJobDetailParts([
      item.companyArea,
      item.companyCity,
    ]);
    final wageLabel = _FeedTab._wageLabel(l10n, item);
    final parsedDetails = _extractJobDescriptionDetails(item.description);
    final descriptionNotes = _descriptionNotes(
      item.description,
      parsedDetails,
    );
    final categoryMatch = _jobRankSetsIntersect(
      _workerCategoryKeys(widget.profile),
      _jobCategoryKeys(item),
    );
    final showLockedState = item.companyLocked || !categoryMatch;
    final hasCompanyMobile = item.companyMobile?.trim().isNotEmpty ?? false;
    final canRevealCompanyContact = widget.isWorkerActive && !showLockedState;
    final requirementFields = <_JobDetailFieldData>[
      _JobDetailFieldData(
        label: l10n.isHindi ? 'आवश्यक वर्कर' : 'Workers Needed',
        value: item.workersNeeded.toString(),
      ),
      if ((parsedDetails['experience required'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'अनुभव आवश्यक' : 'Experience Required',
          value: _localizeCommonJobText(
            l10n,
            parsedDetails['experience required']!,
          ),
        ),
      if ((parsedDetails['worker category'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'वर्कर कैटेगरी' : 'Worker Category',
          value: _localizedCategoryLabel(
            l10n,
            parsedDetails['worker category']!,
          ),
        ),
      if ((parsedDetails['gender preference'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'लिंग प्राथमिकता' : 'Gender Preference',
          value: _localizeCommonJobText(
            l10n,
            parsedDetails['gender preference']!,
          ),
        ),
      if ((parsedDetails['required skills'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'आवश्यक कौशल' : 'Required Skills',
          value: parsedDetails['required skills']!,
        ),
    ];
    final workDetailFields = <_JobDetailFieldData>[
      if ((parsedDetails['shift type'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'शिफ्ट प्रकार' : 'Shift Type',
          value: _localizeCommonJobText(l10n, parsedDetails['shift type']!),
        ),
      if ((parsedDetails['duty hours'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'ड्यूटी घंटे' : 'Duty Hours',
          value: parsedDetails['duty hours']!,
        ),
      if ((parsedDetails['weekly off'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'साप्ताहिक छुट्टी' : 'Weekly Off',
          value: _localizeCommonJobText(l10n, parsedDetails['weekly off']!),
        ),
      if ((parsedDetails['job duration'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'जॉब अवधि' : 'Job Duration',
          value: _localizeCommonJobText(l10n, parsedDetails['job duration']!),
        ),
      if ((parsedDetails['job location'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'जॉब लोकेशन' : 'Job Location',
          value: parsedDetails['job location']!,
        ),
      if (companyLocationLine.isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'शहर / क्षेत्र' : 'City / Area',
          value: companyLocationLine,
        ),
      _JobDetailFieldData(
        label: l10n.isHindi ? 'दूरी' : 'Distance',
        value: distanceLabel,
      ),
    ];
    final salaryFacilitiesFields = <_JobDetailFieldData>[
      _JobDetailFieldData(
        label: l10n.isHindi ? 'वेतन' : 'Salary',
        value: wageLabel,
      ),
      if ((parsedDetails['overtime available'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'ओवरटाइम उपलब्ध' : 'Overtime Available',
          value: _localizeCommonJobText(
            l10n,
            parsedDetails['overtime available']!,
          ),
        ),
      if ((parsedDetails['food facility'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'भोजन सुविधा' : 'Food Facility',
          value: _localizeCommonJobText(l10n, parsedDetails['food facility']!),
        ),
      if ((parsedDetails['accommodation'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'रहने की सुविधा' : 'Accommodation',
          value: _localizeCommonJobText(l10n, parsedDetails['accommodation']!),
        ),
      if ((parsedDetails['transport facility'] ?? '').isNotEmpty)
        _JobDetailFieldData(
          label: l10n.isHindi ? 'यातायात सुविधा' : 'Transport Facility',
          value: _localizeCommonJobText(
            l10n,
            parsedDetails['transport facility']!,
          ),
        ),
    ];
    final jobActivityFields = <_JobDetailFieldData>[
      _JobDetailFieldData(
        label: l10n.isHindi ? 'पोस्ट की तारीख' : 'Posted Date',
        value: _shortDate(context, item.publishedAt),
      ),
      _JobDetailFieldData(
        label: l10n.isHindi ? 'अंतिम तारीख' : 'Expiry Date',
        value: _shortDate(context, item.expiresAt),
      ),
      _JobDetailFieldData(
        label: l10n.isHindi ? 'स्थिति' : 'Status',
        value: _jobStatusLabel(l10n, item),
      ),
      _JobDetailFieldData(
        label: l10n.isHindi ? 'आवेदन स्थिति' : 'Applied Status',
        value: _hasApplied
            ? (_applicationStatus == null
                ? l10n.appliedWithoutStatus
                : l10n.appliedStatusLabel(_applicationStatus!))
            : (l10n.isHindi ? 'अप्लाई नहीं किया' : 'Not applied'),
      ),
      _JobDetailFieldData(
        label: l10n.isHindi ? 'सेव्ड स्थिति' : 'Saved Status',
        value: _isSaved ? l10n.saved : (l10n.isHindi ? 'सेव नहीं किया' : 'Not saved'),
      ),
      _JobDetailFieldData(
        label: l10n.isHindi ? 'कैटेगरी स्थिति' : 'Category Status',
        value: showLockedState
            ? _lockedCategoryBadgeLabel(l10n.isHindi)
            : (l10n.isHindi ? 'मैचिंग' : 'Matching'),
      ),
    ];
    final specialInstructions = parsedDetails['special instructions'] ?? '';
    final languagesPreferred = parsedDetails['languages preferred'] ?? '';
    final canContactCompany = canRevealCompanyContact && hasCompanyMobile;
    final statusFill =
        showLockedState ? const Color(0xFFFFF7ED) : const Color(0xFFF0FDF4);
    final statusBorder =
        showLockedState ? const Color(0xFFF5C98B) : const Color(0xFFB7E8C6);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        surfaceTintColor: Colors.white,
        backgroundColor: Colors.white,
        title: Text(l10n.isHindi ? 'जॉब विवरण' : 'Job details'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 132),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: showLockedState
                    ? const Color(0xFFF5D0A4)
                    : const Color(0xFFBFE5CC),
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x140F172A),
                  blurRadius: 18,
                  offset: Offset(0, 10),
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
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: showLockedState
                                  ? const Color(0xFFFFF4E5)
                                  : const Color(0xFFE8F7EF),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: showLockedState
                                    ? const Color(0xFFF5C98B)
                                    : const Color(0xFF9DD7B6),
                              ),
                            ),
                            child: Text(
                              _localizedCategoryLabel(l10n, item.categoryName),
                              style: TextStyle(
                                color: showLockedState
                                    ? const Color(0xFF9A5B13)
                                    : const Color(0xFF166534),
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          _FeedTab._statusBadge(
                            locked: showLockedState,
                            isHindi: l10n.isHindi,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: OutlinedButton(
                        onPressed: _actionLoading ? null : _handleSaveToggle,
                        style: OutlinedButton.styleFrom(
                          padding: EdgeInsets.zero,
                          backgroundColor:
                              _isSaved ? const Color(0xFFF0FDF4) : Colors.white,
                          side: const BorderSide(color: Color(0xFFD7E2EE)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Icon(
                          _isSaved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_outline_rounded,
                          color: const Color(0xFF173C77),
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  item.title,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    height: 1.22,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  item.companyName,
                  style: const TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _JobDetailHighlightChip(
                      icon: Icons.currency_rupee_rounded,
                      label: wageLabel,
                      fill: const Color(0xFFF8FAFF),
                      border: const Color(0xFFD7E2EE),
                      textColor: const Color(0xFF173C77),
                    ),
                    _JobDetailHighlightChip(
                      icon: Icons.groups_rounded,
                      label:
                          '${l10n.isHindi ? 'आवश्यक वर्कर' : 'Workers Needed'}: ${item.workersNeeded}',
                      fill: statusFill,
                      border: statusBorder,
                      textColor: const Color(0xFF166534),
                    ),
                    if (_hasApplied)
                      _JobDetailHighlightChip(
                        icon: Icons.verified_rounded,
                        label: _applicationStatus == null
                            ? l10n.appliedWithoutStatus
                            : l10n.appliedStatusLabel(_applicationStatus!),
                        fill: const Color(0xFFEFF6FF),
                        border: const Color(0xFFBFDBFE),
                        textColor: const Color(0xFF1D4ED8),
                      ),
                    if (_isSaved)
                      _JobDetailHighlightChip(
                        icon: Icons.bookmark_rounded,
                        label: l10n.saved,
                        fill: const Color(0xFFF0FDF4),
                        border: const Color(0xFFBBF7D0),
                        textColor: const Color(0xFF166534),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.location_on_rounded,
                      size: 18,
                      color: Color(0xFF64748B),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        locationLine,
                        style: const TextStyle(
                          color: Color(0xFF475569),
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _JobDetailSectionCard(
            title: l10n.isHindi ? 'कंपनी विवरण' : 'Company Details',
            child: Column(
              children: [
                if (showLockedState)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: const Color(0xFFFFF7E6),
                      border: Border.all(color: const Color(0xFFF7D8A5)),
                    ),
                    child: Text(
                      l10n.isHindi
                          ? 'कंपनी विवरण लॉक है।'
                          : 'Company details are locked.',
                      style: const TextStyle(
                        color: Color(0xFF92400E),
                        fontWeight: FontWeight.w700,
                        height: 1.55,
                      ),
                    ),
                  ),
                if (showLockedState) const SizedBox(height: 12),
                if (!showLockedState && !widget.isWorkerActive) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: const Color(0xFFEEF4FF),
                      border: Border.all(color: const Color(0xFFD6E4FF)),
                    ),
                    child: Text(
                      l10n.isHindi
                          ? 'कंपनी संपर्क डिटेल्स खोलने के लिए अपना वॉलेट रिचार्ज करें।'
                          : 'Recharge your wallet to unlock company contact details.',
                      style: TextStyle(
                        color: Color(0xFF173C77),
                        fontWeight: FontWeight.w700,
                        height: 1.55,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _JobDetailInfoRow(
                  label: l10n.isHindi ? 'कंपनी का नाम' : 'Company Name',
                  value: item.companyName,
                ),
                if (canRevealCompanyContact &&
                    (item.contactPerson?.trim().isNotEmpty ?? false)) ...[
                  const SizedBox(height: 10),
                  _JobDetailInfoRow(
                    label: l10n.isHindi ? 'संपर्क व्यक्ति' : 'Contact Person',
                    value: item.contactPerson!.trim(),
                  ),
                ],
                const SizedBox(height: 10),
                _JobDetailInfoRow(
                  label: l10n.isHindi ? 'शहर / क्षेत्र' : 'City / Area',
                  value: companyLocationLine.isEmpty
                      ? (item.city.trim().isEmpty ? '-' : item.city.trim())
                      : companyLocationLine,
                ),
                if (canContactCompany) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _JobDetailActionButton(
                          label: l10n.isHindi ? 'व्हाट्सऐप' : 'WhatsApp',
                          backgroundColor: const Color(0xFFEFFAF3),
                          borderColor: const Color(0xFFB7E8C6),
                          onPressed: _openWhatsApp,
                          child: Image.asset(
                            'assets/images/whatsapp_icon.jpeg',
                            width: 22,
                            height: 22,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _JobDetailActionButton(
                          label: l10n.isHindi ? 'कॉल' : 'Call',
                          backgroundColor: const Color(0xFFF8FAFC),
                          borderColor: const Color(0xFFD7E2EE),
                          onPressed: () => _callJobCompany(context, item),
                          child: const Icon(
                            Icons.call_rounded,
                            size: 19,
                            color: Color(0xFF173C77),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          _JobDetailCardGrid(
            cards: [
              _JobDetailSectionCard(
                title:
                    l10n.isHindi ? 'जॉब आवश्यकता विवरण' : 'Job Requirement Details',
                compact: true,
                child: _JobDetailFieldList(
                  fields: requirementFields,
                  emptyLabel: l10n.isHindi
                      ? 'जॉब आवश्यकता विवरण अभी उपलब्ध नहीं है।'
                      : 'Requirement details are not available yet.',
                ),
              ),
              _JobDetailSectionCard(
                title: l10n.isHindi ? 'काम का विवरण' : 'Work Details',
                compact: true,
                child: _JobDetailFieldList(
                  fields: workDetailFields,
                  emptyLabel: l10n.isHindi
                      ? 'काम का विवरण अभी उपलब्ध नहीं है।'
                      : 'Work timing and location details are not available yet.',
                ),
              ),
              _JobDetailSectionCard(
                title: l10n.isHindi
                    ? 'वेतन और सुविधाएं'
                    : 'Salary & Facilities',
                compact: true,
                child: _JobDetailFieldList(
                  fields: salaryFacilitiesFields,
                  emptyLabel: l10n.isHindi
                      ? 'वेतन और सुविधा विवरण अभी उपलब्ध नहीं है।'
                      : 'Salary and facility details are not available yet.',
                ),
              ),
              _JobDetailSectionCard(
                title: l10n.isHindi ? 'स्थिति' : 'Job Activity',
                compact: true,
                child: _JobDetailFieldList(
                  fields: jobActivityFields,
                  emptyLabel: l10n.isHindi
                      ? 'जॉब गतिविधि अभी उपलब्ध नहीं है।'
                      : 'Job activity is not available yet.',
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _JobDetailSectionCard(
            title: l10n.isHindi ? 'जॉब विवरण' : 'Job Description',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (descriptionNotes.isNotEmpty)
                  ...descriptionNotes.map(
                    (note) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            margin: const EdgeInsets.only(top: 8),
                            decoration: const BoxDecoration(
                              color: Color(0xFF173C77),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              note,
                              style: const TextStyle(
                                color: Color(0xFF334155),
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                height: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  Text(
                    l10n.isHindi
                        ? 'कोई अतिरिक्त निर्देश उपलब्ध नहीं हैं।'
                        : 'No additional instructions provided.',
                    style: const TextStyle(
                      color: Color(0xFF334155),
                      fontSize: 13.5,
                      height: 1.6,
                    ),
                  ),
                if (specialInstructions.trim().isNotEmpty &&
                    !descriptionNotes.contains(specialInstructions.trim())) ...[
                  const SizedBox(height: 12),
                  _JobDetailInfoRow(
                    label: l10n.isHindi
                        ? 'विशेष निर्देश'
                        : 'Special Instructions',
                    value: specialInstructions,
                  ),
                ],
                if (languagesPreferred.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    l10n.isHindi ? 'पसंदीदा भाषाएं' : 'Languages Preferred',
                    style: const TextStyle(
                      color: Color(0xFF475569),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: languagesPreferred
                        .split(RegExp(r'[,/]+'))
                        .map((value) => value.trim())
                        .where((value) => value.isNotEmpty)
                        .map(
                          (value) => _FeedTab._chip(
                            value,
                            fill: const Color(0xFFF8FAFC),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(
              top: BorderSide(color: Color(0xFFE2E8F0)),
            ),
            boxShadow: [
              BoxShadow(
                color: Color(0x120F172A),
                blurRadius: 16,
                offset: Offset(0, -4),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _actionLoading ? null : _handleSaveToggle,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: const BorderSide(color: Color(0xFFD7E2EE)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: Icon(
                    _isSaved
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_outline_rounded,
                  ),
                  label: Text(
                    _isSaved ? l10n.removeFromShortlist : l10n.saveJob,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed:
                      _hasApplied || _actionLoading ? null : _handleApply,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF173C77),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    _actionLoading
                        ? l10n.working
                        : _hasApplied
                            ? l10n.applicationSent
                            : l10n.applyToJob,
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

class _JobDetailFieldData {
  final String label;
  final String value;

  const _JobDetailFieldData({
    required this.label,
    required this.value,
  });
}

class _JobDetailSectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final bool compact;

  const _JobDetailSectionCard({
    required this.title,
    required this.child,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(compact ? 12 : 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: const Color(0xFF0F172A),
              fontSize: compact ? 15 : 16.5,
              fontWeight: FontWeight.w900,
              height: 1.2,
            ),
          ),
          SizedBox(height: compact ? 8 : 12),
          child,
        ],
      ),
    );
  }
}

class _JobDetailCardGrid extends StatelessWidget {
  final List<Widget> cards;

  const _JobDetailCardGrid({
    required this.cards,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 700) {
          return Column(
            children: [
              for (var index = 0; index < cards.length; index++) ...[
                cards[index],
                if (index != cards.length - 1) const SizedBox(height: 10),
              ],
            ],
          );
        }

        final rows = <Widget>[];
        for (var i = 0; i < cards.length; i += 2) {
          rows.add(
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: cards[i]),
                const SizedBox(width: 10),
                Expanded(
                  child: i + 1 < cards.length
                      ? cards[i + 1]
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          );
          if (i + 2 < cards.length) {
            rows.add(const SizedBox(height: 10));
          }
        }
        return Column(children: rows);
      },
    );
  }
}

class _JobDetailFieldList extends StatelessWidget {
  final List<_JobDetailFieldData> fields;
  final String emptyLabel;

  const _JobDetailFieldList({
    required this.fields,
    required this.emptyLabel,
  });

  @override
  Widget build(BuildContext context) {
    if (fields.isEmpty) {
      return Text(
        emptyLabel,
        style: const TextStyle(
          color: Color(0xFF64748B),
          fontSize: 12.5,
          fontWeight: FontWeight.w600,
          height: 1.5,
        ),
      );
    }

    return Column(
      children: [
        for (var index = 0; index < fields.length; index++) ...[
          _JobDetailCompactRow(field: fields[index]),
          if (index != fields.length - 1) const SizedBox(height: 6),
        ],
      ],
    );
  }
}

class _JobDetailCompactRow extends StatelessWidget {
  final _JobDetailFieldData field;

  const _JobDetailCompactRow({
    required this.field,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 68),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            field.label,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            field.value,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 12.75,
              fontWeight: FontWeight.w800,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _JobDetailInfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _JobDetailInfoRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _JobDetailActionButton extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color borderColor;
  final Widget child;
  final VoidCallback onPressed;

  const _JobDetailActionButton({
    required this.label,
    required this.backgroundColor,
    required this.borderColor,
    required this.child,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        backgroundColor: backgroundColor,
        side: BorderSide(color: borderColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          child,
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF173C77),
              fontSize: 14.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _JobDetailHighlightChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color fill;
  final Color border;
  final Color textColor;

  const _JobDetailHighlightChip({
    required this.icon,
    required this.label,
    required this.fill,
    required this.border,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: textColor),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: textColor,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

const List<String> _jobDescriptionFieldLabels = [
  'connected plan',
  'worker category',
  'gender preference',
  'experience required',
  'job location',
  'shift type',
  'duty hours',
  'weekly off',
  'job duration',
  'salary type',
  'overtime available',
  'food facility',
  'accommodation',
  'transport facility',
  'required skills',
  'special instructions',
  'languages preferred',
  'submission mode',
];

const List<String> _jobDescriptionExcludedPrefixes = [
  'worker required',
  'workers needed',
  'salary amount',
  'company name',
  'contact person',
  'company city',
  'city',
  'area',
  'distance',
  'posted date',
  'expiry date',
  'job status',
  'applied status',
  'saved status',
  'category status',
  'category match',
];

Map<String, String> _extractJobDescriptionDetails(String description) {
  final normalized =
      description.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  final details = <String, String>{};
  final allLabelsPattern =
      _jobDescriptionFieldLabels.map(RegExp.escape).join('|');

  for (final line in normalized.split('\n')) {
    final trimmed = line.trim();
    if (trimmed.isEmpty) continue;
    final match = RegExp(r'^([^:]+):\s*(.+)$').firstMatch(trimmed);
    if (match == null) continue;
    final label = match.group(1)!.trim().toLowerCase();
    final value = match.group(2)!.trim();
    if (_jobDescriptionFieldLabels.contains(label) && value.isNotEmpty) {
      details[label] = value;
    }
  }

  for (final label in _jobDescriptionFieldLabels) {
    if (details.containsKey(label)) continue;
    final match = RegExp(
      '(?:^|\\n|\\b)${RegExp.escape(label)}\\s*:\\s*([\\s\\S]*?)(?=(?:\\n|\\b(?:$allLabelsPattern)\\s*:)|\$)',
      caseSensitive: false,
    ).firstMatch(normalized);
    final value = match?.group(1)?.trim() ?? '';
    if (value.isNotEmpty) {
      details[label] = value.replaceAll(RegExp(r'\s+'), ' ').trim();
    }
  }

  return details;
}

List<String> _descriptionNotes(
  String description,
  Map<String, String> parsedDetails,
) {
  final notes = <String>[];
  for (final line in description.replaceAll('\r\n', '\n').split('\n')) {
    final trimmed = line.trim();
    if (trimmed.isEmpty) continue;
    if (trimmed.toLowerCase() == 'job requirement details') continue;
    final lower = trimmed.toLowerCase();
    final isStructured = _jobDescriptionFieldLabels.any(
          (label) => lower.startsWith('$label:'),
        ) ||
        _jobDescriptionExcludedPrefixes.any(
          (label) => lower.startsWith('$label:'),
        );
    if (!isStructured) {
      notes.add(trimmed);
    }
  }
  return notes;
}

String _joinJobDetailParts(List<String?> values) {
  return values
      .map((value) => (value ?? '').trim())
      .where((value) => value.isNotEmpty)
      .join(', ');
}

String _jobStatusLabel(WorkerLocalizations l10n, WorkerFeedItemModel item) {
  final expiresAt = DateTime.tryParse(item.expiresAt);
  if (expiresAt != null && expiresAt.isBefore(DateTime.now())) {
    return _localizeCommonJobText(l10n, 'Expired');
  }
  return _localizeCommonJobText(l10n, 'Live');
}

class _SavedJobsPage extends StatefulWidget {
  final WorkerProfileModel profile;
  final List<WorkerFeedItemModel> items;
  final bool isWorkerActive;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;
  final VoidCallback onOpenWallet;

  const _SavedJobsPage({
    required this.profile,
    required this.items,
    required this.isWorkerActive,
    required this.onApply,
    required this.onToggleSaved,
    required this.onOpenWallet,
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
    final selectedItem = _items.cast<WorkerFeedItemModel?>().firstWhere(
          (item) => item?.id == jobPostId,
          orElse: () => null,
        );
    if (selectedItem != null &&
        _isJobCategoryLockedForWorker(widget.profile, selectedItem)) {
      await _showCategoryLockedMessageDialog(context);
      return;
    }
    if (!widget.isWorkerActive) {
      await _showWorkerInactiveRechargeDialog(
        context,
        onRecharge: () {
          widget.onOpenWallet();
          Navigator.of(context).pop();
        },
      );
      return;
    }
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
                      categoryId: item.categoryId,
                      categorySlug: item.categorySlug,
                      industryCategoryId: item.industryCategoryId,
                      industryCategoryLabel: item.industryCategoryLabel,
                      industryCategoryValue: item.industryCategoryValue,
                      industryCategorySlug: item.industryCategorySlug,
                      businessTypeId: item.businessTypeId,
                      businessTypeLabel: item.businessTypeLabel,
                      businessTypeValue: item.businessTypeValue,
                      businessTypeSlug: item.businessTypeSlug,
                      locationLabel: item.locationLabel,
                      wageAmount: item.wageAmount,
                      workersNeeded: item.workersNeeded,
                      categoryName: item.categoryName,
                      companyLocked: item.companyLocked,
                      companyName: item.companyName,
                      companyArea: item.companyArea,
                      companyCity: item.companyCity,
                      companyPincode: item.companyPincode,
                      companyLatitude: item.companyLatitude,
                      companyLongitude: item.companyLongitude,
                      contactPerson: item.contactPerson,
                      companyMobile: item.companyMobile,
                      publishedAt: item.publishedAt,
                      expiresAt: item.expiresAt,
                      matchReason: item.matchReason,
                      hasApplied: true,
                      applicationStatus: item.applicationStatus ?? 'submitted',
                      isSaved: item.isSaved,
                      appliedAt: item.appliedAt,
                      coordinateSource: item.coordinateSource,
                      latitude: item.latitude,
                      longitude: item.longitude,
                      shiftType: item.shiftType,
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
          profile: widget.profile,
          isWorkerActive: widget.isWorkerActive,
          liveLocation: _LiveLocationSnapshot(
            latitude: widget.profile.latitude,
            longitude: widget.profile.longitude,
            city: widget.profile.city,
            area: '',
            permissionDenied: false,
            unavailable: false,
          ),
          resolvedCoordinates: item.latitude != null && item.longitude != null
              ? _DerivedJobCoordinates(
                  latitude: item.latitude!,
                  longitude: item.longitude!,
                  source: item.coordinateSource.isEmpty
                      ? 'feed'
                      : item.coordinateSource,
                )
              : (item.companyLatitude != null && item.companyLongitude != null
                  ? _DerivedJobCoordinates(
                      latitude: item.companyLatitude!,
                      longitude: item.companyLongitude!,
                      source: 'company',
                    )
                  : null),
          onApply: _handleApply,
          onToggleSaved: _handleToggleSaved,
          onOpenWallet: widget.onOpenWallet,
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
        title: Text(
            l10n.isHindi ? 'सेव्ड जॉब्स' : 'Saved jobs'),
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
                colors: [
                  Color(0xFF173C77),
                  Color(0xFF2859B3),
                  Color(0xFF2F6FDF)
                ],
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
                  l10n.isHindi
                      ? 'आपकी शॉर्टलिस्ट'
                      : 'Your shortlist',
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
                      value:
                          '${_items.where((item) => item.hasApplied).length}',
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
                final categoryLocked = _isJobCategoryLockedForWorker(
                  widget.profile,
                  item,
                );
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
                                    style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${item.city} | ${_localizedCategoryLabel(l10n, item.categoryName)}',
                                    style: const TextStyle(
                                        color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0F6FF),
                                borderRadius: BorderRadius.circular(14),
                                border:
                                    Border.all(color: const Color(0xFFD3E4FF)),
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
                          style: const TextStyle(
                              color: Color(0xFF475569), height: 1.6),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _FeedTab._chip(
                                l10n.localizeMatchReason(item.matchReason)),
                            _FeedTab._chip(
                              item.companyLocked
                                  ? (l10n.isHindi
                                      ? 'कंपनी लॉक'
                                      : 'Company locked')
                                  : (l10n.isHindi
                                      ? 'कंपनी खुली'
                                      : 'Company unlocked'),
                            ),
                            if (item.hasApplied)
                              _FeedTab._chip(
                                item.applicationStatus == null
                                    ? l10n.appliedWithoutStatus
                                    : l10n.appliedStatusLabel(
                                        item.applicationStatus!),
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
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
                                  child: Text(l10n.isHindi
                                      ? 'विवरण देखें'
                                      : 'View details'),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton(
                                onPressed: item.hasApplied || actionLoading
                                    ? null
                                    : categoryLocked
                                        ? () => _showCategoryLockedMessageDialog(
                                              context,
                                            )
                                        : () => _handleApply(item.id),
                                child: Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 12),
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
                            onPressed: actionLoading
                                ? null
                                : () => _handleToggleSaved(item.id),
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
                    style:
                        const TextStyle(color: Color(0xFF64748B), height: 1.5),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed:
                          loading || unreadCount == 0 ? null : onMarkAllRead,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child:
                            Text(loading ? l10n.updating : l10n.markAllAsRead),
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
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: CircleAvatar(
                    backgroundColor: notification.isRead
                        ? const Color(0xFFF1F5F9)
                        : const Color(0xFFE0EBFF),
                    child: Icon(
                      switch (notification.type) {
                        'application_submitted' => Icons.send_rounded,
                        'job_saved' => Icons.bookmark_rounded,
                        'application_status' => Icons.fact_check_rounded,
                        _ => Icons.notifications_active_rounded,
                      },
                      color: notification.isRead
                          ? const Color(0xFF64748B)
                          : const Color(0xFF173C77),
                    ),
                  ),
                  title: Text(
                    l10n.localizeNotificationTitle(
                        notification.type, notification.title),
                    style: TextStyle(
                      fontWeight: notification.isRead
                          ? FontWeight.w700
                          : FontWeight.w900,
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
                          onPressed: loading
                              ? null
                              : () => onMarkRead(notification.id),
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
  final TextEditingController rechargeAmountController;
  final TextEditingController rechargeNoteController;
  final Future<void> Function() onStartWalletRecharge;
  final Future<void> Function() onToggleWalletStatus;
  final Future<void> Function() onRefresh;
  final bool loading;
  final bool statusLoading;

  const _WalletTab({
    required this.dashboard,
    required this.rechargeAmountController,
    required this.rechargeNoteController,
    required this.onStartWalletRecharge,
    required this.onToggleWalletStatus,
    required this.onRefresh,
    required this.loading,
    required this.statusLoading,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final isActive = _dashboardWorkerActive(dashboard);
    final hasActiveFreePlan = _hasActiveFreePlan(dashboard);
    final pausedByWorker = _isDashboardPausedByWorker(dashboard);
    final supportsWalletStatusToggle = _supportsWalletStatusToggle(dashboard);
    final daysRemaining = _resolvedDaysRemaining(dashboard);
    final daysLabel = _daysRemainingLabel(l10n, daysRemaining);
    final validTillLabel = _formatShortDate(dashboard.workerPlan?.planEndDate);
    final validTillText =
        validTillLabel == null ? null : _validTillText(l10n, validTillLabel);
    final nextDeductionLabel = _formatShortDateTime(dashboard.wallet.nextDeductionAt);
    final rawPlanName = (dashboard.workerPlan?.name.trim().isNotEmpty ?? false)
        ? dashboard.workerPlan!.name.trim()
        : 'Starter Plan';
    final planName = _localizeCommonJobText(l10n, rawPlanName);
    final planHeadline = pausedByWorker
        ? l10n.workerPlanPaused
        : isActive
            ? (hasActiveFreePlan
                ? planName
                : (l10n.isHindi ? '$planName सक्रिय' : '$planName Active'))
            : (l10n.isHindi ? 'प्लान समाप्त' : 'Plan Expired');
    final planSubtitle = pausedByWorker
        ? l10n.workerPlanPausedSubtitle
        : isActive
            ? (hasActiveFreePlan && validTillText != null
                ? validTillText
                : daysLabel)
            : (l10n.isHindi ? 'रिचार्ज जरूरी' : 'Recharge Required');
    final activationLabel =
        isActive ? (l10n.isHindi ? 'सक्रिय' : 'Active') : (l10n.isHindi ? 'निष्क्रिय' : 'Inactive');
    final dailyDeductionAmount =
        dashboard.workerPlan?.dailyCharge ?? dashboard.wallet.dailyCharge;
    final historyItems = dashboard.wallet.transactions;

    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
        children: [
          _WalletSurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.walletActivation,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _walletVisibilityRule(l10n, dashboard),
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    height: 1.55,
                  ),
                ),
                const SizedBox(height: 18),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0E254A), Color(0xFF173C77)],
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x22173C77),
                        blurRadius: 22,
                        offset: Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.currentBalance,
                        style: TextStyle(
                          color: Color(0xFFD7E4FF),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          _WalletAccentPill(
                            label:
                                '${l10n.isHindi ? 'प्लान स्थिति' : 'Plan Status'}: $activationLabel',
                          ),
                          _WalletAccentPill(
                            label: pausedByWorker
                                ? l10n.prettyValue('inactive_paused_by_worker')
                                : hasActiveFreePlan
                                    ? (l10n.isHindi ? 'फ्री प्लान सक्रिय' : 'Free plan active')
                                    : (l10n.isHindi
                                        ? 'बाकी दिन: $daysRemaining'
                                        : 'Days Remaining: $daysRemaining'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _WalletDetailCard(
                  title: l10n.isHindi ? 'प्लान स्थिति' : 'Plan Status',
                  value: planHeadline,
                  subtitle: planSubtitle,
                  highlight: !isActive,
                ),
                const SizedBox(height: 12),
                _WalletDetailCard(
                  title: l10n.estimatedActiveDays,
                  value: daysLabel,
                  subtitle: validTillText,
                ),
                const SizedBox(height: 12),
                _WalletDetailCard(
                  title: l10n.dailyDeductionAmountLabel,
                  value: _dailyDeductionAmountText(l10n, dailyDeductionAmount),
                  subtitle: hasActiveFreePlan
                      ? (l10n.isHindi
                          ? 'फ्री प्लान में कोई दैनिक कटौती नहीं है।'
                          : 'No daily deduction applies during the free plan.')
                      : null,
                ),
                if (nextDeductionLabel != null && !hasActiveFreePlan) ...[
                  const SizedBox(height: 12),
                  _WalletDetailCard(
                    title: l10n.nextDailyDeduction,
                    value: nextDeductionLabel,
                    subtitle: pausedByWorker
                        ? l10n.workerPlanPausedSubtitle
                        : null,
                  ),
                ],
                const SizedBox(height: 12),
                _WalletDetailCard(
                  title: l10n.isHindi ? 'न्यूनतम रिचार्ज' : 'Minimum Recharge',
                  value:
                      'Rs ${_minimumWalletRechargeAmount.toStringAsFixed(0)}',
                ),
                if (supportsWalletStatusToggle) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.walletActivation,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          pausedByWorker
                              ? l10n.workerPlanPausedSubtitle
                              : (l10n.isHindi
                                  ? 'आप चाहें तो वर्कर एक्सेस रोक सकते हैं। दैनिक कटौती अगले चक्र से रुक जाएगी।'
                                  : 'You can pause worker access anytime. Daily deduction will stop from the next cycle.'),
                          style: const TextStyle(
                            color: Color(0xFF475569),
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: loading ? null : onToggleWalletStatus,
                            style: FilledButton.styleFrom(
                              backgroundColor: pausedByWorker
                                  ? const Color(0xFF166534)
                                  : const Color(0xFF173C77),
                              padding: const EdgeInsets.symmetric(vertical: 15),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: Text(
                              statusLoading
                                  ? l10n.updating
                                  : (pausedByWorker
                                      ? l10n.activateWorkerAccess
                                      : l10n.deactivateWorkerAccess),
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.isHindi ? 'रिचार्ज सेक्शन' : 'Recharge Section',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: rechargeAmountController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText:
                              l10n.isHindi ? 'रिचार्ज राशि' : 'Recharge Amount',
                          hintText: l10n.isHindi
                              ? 'रिचार्ज राशि दर्ज करें'
                              : 'Enter recharge amount',
                          prefixIcon: Icon(Icons.currency_rupee_rounded),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: rechargeNoteController,
                        decoration: InputDecoration(
                          labelText: l10n.isHindi
                              ? 'रिचार्ज नोट'
                              : 'Recharge Note',
                          hintText: l10n.isHindi
                              ? 'रिचार्ज नोट (वैकल्पिक)'
                              : 'Recharge note (optional)',
                          prefixIcon: Icon(Icons.edit_note_rounded),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: loading ? null : onStartWalletRecharge,
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF173C77),
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          child: Text(
                            loading
                                ? (l10n.isHindi
                                    ? 'पेमेंट खुल रहा है...'
                                    : 'Opening payment...')
                                : (l10n.isHindi
                                    ? 'अभी रिचार्ज करें'
                                    : 'Recharge Now'),
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.rechargeHistory,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          if (historyItems.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Text(
                'No records available.',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else
            ...historyItems.map(
              (transaction) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            _prettyText(context, transaction.transactionType),
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${transaction.direction == 'debit' ? '-' : '+'} Rs ${transaction.amount.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: transaction.direction == 'debit'
                                ? const Color(0xFFB91C1C)
                                : const Color(0xFF166534),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _WalletHistoryPill(
                          label:
                              'Date: ${_shortDate(context, transaction.createdAt)}',
                        ),
                        _WalletHistoryPill(
                          label:
                              'Type: ${_prettyText(context, transaction.status)}',
                        ),
                      ],
                    ),
                    if (transaction.note.trim().isNotEmpty ||
                        transaction.reference.trim().isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        transaction.note.trim().isNotEmpty
                            ? transaction.note.trim()
                            : transaction.reference.trim(),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ],
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
    required String homeCity,
    required String address,
    required List<String> categoryIds,
    required List<String> skills,
    required double experienceYears,
    required String salaryType,
    required double expectedDailyWage,
    required String availability,
  }) onSave;
  final Future<void> Function() onLogout;
  final Future<void> Function() onRefresh;
  final bool loading;

  const _ProfileTab({
    required this.dashboard,
    required this.onSave,
    required this.onLogout,
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
  late String _salaryType;

  @override
  void initState() {
    super.initState();
    _hydrateFromDashboard();
  }

  @override
  void didUpdateWidget(covariant _ProfileTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.dashboard.profile.fullName !=
            widget.dashboard.profile.fullName ||
        oldWidget.dashboard.profile.city != widget.dashboard.profile.city ||
        oldWidget.dashboard.profile.status != widget.dashboard.profile.status ||
        oldWidget.dashboard.profile.walletBalance !=
            widget.dashboard.profile.walletBalance ||
        oldWidget.dashboard.profile.skills.join(',') !=
            widget.dashboard.profile.skills.join(',') ||
        oldWidget.dashboard.profile.categoryIds.join(',') !=
            widget.dashboard.profile.categoryIds.join(',') ||
        oldWidget.dashboard.profile.availability !=
            widget.dashboard.profile.availability ||
        oldWidget.dashboard.profile.salaryType !=
            widget.dashboard.profile.salaryType ||
        oldWidget.dashboard.profile.expectedDailyWage !=
            widget.dashboard.profile.expectedDailyWage ||
        oldWidget.dashboard.profile.experienceYears !=
            widget.dashboard.profile.experienceYears) {
      _syncControllersFromDashboard();
    }
  }

  void _hydrateFromDashboard() {
    _nameController =
        TextEditingController(text: widget.dashboard.profile.fullName);
    _cityController =
        TextEditingController(text: widget.dashboard.profile.city);
    _experienceController = TextEditingController(
      text: widget.dashboard.profile.experienceYears.toStringAsFixed(0),
    );
    _wageController = TextEditingController(
      text: widget.dashboard.profile.expectedDailyWage.toStringAsFixed(0),
    );
    _skillsController =
        TextEditingController(text: widget.dashboard.profile.skills.join(', '));
    _selectedCategories = [...widget.dashboard.profile.categoryIds];
    _availability = widget.dashboard.profile.availability;
    _salaryType = widget.dashboard.profile.salaryType.trim().isEmpty
        ? 'Daily Wage'
        : widget.dashboard.profile.salaryType.trim();
  }

  void _syncControllersFromDashboard() {
    _nameController.text = widget.dashboard.profile.fullName;
    _cityController.text = widget.dashboard.profile.city;
    _experienceController.text =
        widget.dashboard.profile.experienceYears.toStringAsFixed(0);
    _wageController.text =
        widget.dashboard.profile.expectedDailyWage.toStringAsFixed(0);
    _skillsController.text = widget.dashboard.profile.skills.join(', ');
    _selectedCategories = [...widget.dashboard.profile.categoryIds];
    _availability = widget.dashboard.profile.availability;
    _salaryType = widget.dashboard.profile.salaryType.trim().isEmpty
        ? 'Daily Wage'
        : widget.dashboard.profile.salaryType.trim();
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
      homeCity: widget.dashboard.profile.homeCity,
      address: widget.dashboard.profile.address,
      categoryIds: _selectedCategories,
      skills: _skillsController.text
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList(),
      experienceYears: double.tryParse(_experienceController.text.trim()) ?? 0,
      salaryType: _salaryType.trim().isEmpty ? 'Daily Wage' : _salaryType.trim(),
      expectedDailyWage: double.tryParse(_wageController.text.trim()) ?? 0,
      availability: _availability,
    );
  }

  void _showMessage(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  List<WorkerMasterOption> get _workerSalaryTypeOptions {
    final List<WorkerMasterOption> items =
        widget.dashboard.availableWorkerSalaryTypes.isNotEmpty
        ? widget.dashboard.availableWorkerSalaryTypes
        : [
            WorkerMasterOption(
              id: 'worker-salary-daily-wage',
              label: 'Daily Wage',
              value: 'Daily Wage',
              slug: 'daily-wage',
            ),
            WorkerMasterOption(
              id: 'worker-salary-monthly-salary',
              label: 'Monthly Salary',
              value: 'Monthly Salary',
              slug: 'monthly-salary',
            ),
            WorkerMasterOption(
              id: 'worker-salary-weekly',
              label: 'Weekly',
              value: 'Weekly',
              slug: 'weekly',
            ),
            WorkerMasterOption(
              id: 'worker-salary-per-piece',
              label: 'Per Piece',
              value: 'Per Piece',
              slug: 'per-piece',
            ),
            WorkerMasterOption(
              id: 'worker-salary-contract',
              label: 'Contract',
              value: 'Contract',
              slug: 'contract',
            ),
            WorkerMasterOption(
              id: 'worker-salary-hourly',
              label: 'Hourly',
              value: 'Hourly',
              slug: 'hourly',
            ),
          ];

    return items
        .where(
          (item) =>
              item.value.trim().isNotEmpty || item.label.trim().isNotEmpty,
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.dashboard.profile;
    final l10n = WorkerLocalizations.of(context);
    final categoryContext = _resolveProfileCategoryContext(
      widget.dashboard,
      _selectedCategories,
      profile.categoryLabels,
    );
    final isActive = _dashboardWorkerActive(widget.dashboard);
    final salaryTypeOptions = _workerSalaryTypeOptions;
    final selectedSalaryTypeValue = salaryTypeOptions.any(
      (item) => item.value == _salaryType,
    )
        ? _salaryType
        : null;

    return RefreshIndicator.adaptive(
      onRefresh: widget.onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        children: [
          _WalletSurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.workerProfile,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.workerProfileSubtitle,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    height: 1.5,
                  ),
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
                        value:
                            isActive ? (l10n.isHindi ? 'सक्रिय' : 'Active') : (l10n.isHindi ? 'निष्क्रिय' : 'Inactive'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
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
                    labelText: l10n.lookingJobCity,
                    prefixIcon: const Icon(Icons.home_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                _ProfileReadOnlyField(
                  label: l10n.belongsToCity,
                  icon: Icons.location_city_outlined,
                  value: profile.homeCity.trim().isEmpty ? '-' : profile.homeCity.trim(),
                ),
                const SizedBox(height: 12),
                _ProfileReadOnlyField(
                  label: l10n.addressLabel,
                  icon: Icons.home_work_outlined,
                  value: profile.address.trim().isEmpty
                      ? '-'
                      : profile.address.trim(),
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
                          prefixIcon:
                              const Icon(Icons.workspace_premium_outlined),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _wageController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: l10n.expectedSalaryWage,
                          prefixIcon: const Icon(Icons.currency_rupee_rounded),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedSalaryTypeValue,
                  items: salaryTypeOptions
                      .map(
                        (item) => DropdownMenuItem(
                          value: item.value,
                          child: Text(
                            l10n.workerSalaryTypeLabel(
                              item.label.trim().isNotEmpty
                                  ? item.label.trim()
                                  : item.value,
                            ),
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _salaryType = value);
                    }
                  },
                  decoration: InputDecoration(
                    labelText: l10n.salaryType,
                    prefixIcon: const Icon(Icons.payments_outlined),
                  ),
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
                _ProfileReadOnlyField(
                  label: l10n.isHindi ? 'इंडस्ट्री कैटेगरी' : 'Industry Category',
                  icon: Icons.apartment_rounded,
                  value: categoryContext.industryLabel,
                ),
                const SizedBox(height: 12),
                _ProfileReadOnlyField(
                  label: l10n.isHindi ? 'बिजनेस टाइप' : 'Business Type',
                  icon: Icons.business_center_rounded,
                  value: categoryContext.businessTypeLabel,
                ),
                const SizedBox(height: 12),
                _ProfileReadOnlyField(
                  label: l10n.isHindi ? 'जॉब कैटेगरी' : 'Job Category',
                  icon: Icons.category_outlined,
                  value: _localizedCategoryLabel(
                    l10n,
                    categoryContext.jobCategoryLabel,
                  ),
                  helperText: l10n.isHindi
                      ? 'जॉब कैटेगरी रजिस्ट्रेशन से तय है।'
                      : 'Job category is fixed from registration.',
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _availability,
                  items: [
                    DropdownMenuItem(
                        value: 'available_today',
                        child: Text(l10n.availableToday)),
                    DropdownMenuItem(
                        value: 'available_this_week',
                        child: Text(l10n.availableThisWeek)),
                    DropdownMenuItem(
                        value: 'not_available', child: Text(l10n.notAvailable)),
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
                Row(
                  children: [
                    Expanded(
                      child: FilledButton(
                        onPressed: widget.loading ? null : _submit,
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF173C77),
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        child: Text(
                          widget.loading ? l10n.saving : l10n.saveProfile,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: widget.onLogout,
                        icon: const Icon(Icons.logout_rounded),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0F172A),
                          side: const BorderSide(color: Color(0xFFD7E2EE)),
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        label: Text(
                          l10n.isHindi ? 'लॉग आउट' : 'Log out',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
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

class _WalletSurfaceCard extends StatelessWidget {
  final Widget child;

  const _WalletSurfaceCard({
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _WalletDetailCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final bool highlight;

  const _WalletDetailCard({
    required this.title,
    required this.value,
    this.subtitle,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: highlight ? const Color(0xFFFFF7E6) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: highlight ? const Color(0xFFF7D8A5) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color:
                  highlight ? const Color(0xFF92400E) : const Color(0xFF0F172A),
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (subtitle != null && subtitle!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              subtitle!,
              style: TextStyle(
                color: highlight
                    ? const Color(0xFF92400E)
                    : const Color(0xFF475569),
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _WalletAccentPill extends StatelessWidget {
  final String label;

  const _WalletAccentPill({
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0x1AD7E4FF),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0x33D7E4FF)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _WalletHistoryPill extends StatelessWidget {
  final String label;

  const _WalletHistoryPill({
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFF475569),
          fontSize: 12.5,
          fontWeight: FontWeight.w700,
        ),
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
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
            style: const TextStyle(color: Color(0xFFD7E4FF), fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _CompactStatusPill extends StatelessWidget {
  final bool isActive;

  const _CompactStatusPill({required this.isActive});

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
    final background =
        isActive ? const Color(0xFFE8F7EF) : const Color(0xFFF1F5F9);
    final foreground =
        isActive ? const Color(0xFF166534) : const Color(0xFF475569);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isActive
            ? (l10n.isHindi ? 'सक्रिय' : 'Active')
            : (l10n.isHindi ? 'निष्क्रिय' : 'Inactive'),
        style: TextStyle(
          color: foreground,
          fontWeight: FontWeight.w800,
          fontSize: 13,
        ),
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
      'inactive_paused_by_worker' => (
          const Color(0xFFE0EBFF),
          const Color(0xFF173C77)
        ),
      'inactive_wallet_empty' => (
          const Color(0xFFFFF7E6),
          const Color(0xFF92400E)
        ),
      'blocked' || 'rejected' => (
          const Color(0xFFFEF2F2),
          const Color(0xFFB91C1C)
        ),
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

class _ProfileReadOnlyField extends StatelessWidget {
  final String label;
  final IconData icon;
  final String value;
  final String? helperText;

  const _ProfileReadOnlyField({
    required this.label,
    required this.icon,
    required this.value,
    this.helperText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon),
            suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded,
                color: Color(0xFF475569)),
          ),
          child: Text(
            value.trim().isEmpty ? '-' : value.trim(),
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        if (helperText != null && helperText!.trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              helperText!,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _ResolvedProfileCategoryContext {
  final String industryLabel;
  final String businessTypeLabel;
  final String jobCategoryLabel;

  const _ResolvedProfileCategoryContext({
    required this.industryLabel,
    required this.businessTypeLabel,
    required this.jobCategoryLabel,
  });
}

bool _dashboardWorkerActive(WorkerDashboardModel dashboard) {
  if (!dashboard.activation.isActive) {
    return false;
  }

  if (_hasActiveFreePlan(dashboard)) {
    return true;
  }

  if (_isPastDate(dashboard.workerPlan?.planEndDate)) {
    return false;
  }

  return dashboard.wallet.estimatedDaysRemaining > 0;
}

_ResolvedProfileCategoryContext _resolveProfileCategoryContext(
  WorkerDashboardModel dashboard,
  List<String> selectedCategoryIds,
  List<String> categoryLabels,
) {
  final workerKeys = _normalizedJobRankSet([
    ...selectedCategoryIds,
    ...categoryLabels,
  ]);

  String jobCategoryLabel = categoryLabels
      .map((item) => item.trim())
      .firstWhere((item) => item.isNotEmpty, orElse: () => '');
  if (jobCategoryLabel.isEmpty) {
    final matchedCategory = dashboard.availableCategories.firstWhere(
      (category) =>
          workerKeys.contains(_normalizeJobRankKey(category.id)) ||
          workerKeys.contains(_normalizeJobRankKey(category.name)),
      orElse: () => WorkerCategoryOption(
        id: '',
        name: '',
        description: '',
        imageUrl: '',
        isActive: false,
        showOnHome: false,
        homeOrder: 0,
      ),
    );
    jobCategoryLabel = matchedCategory.name.trim();
  }

  for (final dependency in dashboard.categoryDependencies) {
    final dependencyCategoryKeys = _normalizedJobRankSet([
      dependency.categoryId,
      dependency.categorySlug,
      dependency.categoryName,
    ]);
    if (!_jobRankSetsIntersect(workerKeys, dependencyCategoryKeys)) {
      continue;
    }
    return _ResolvedProfileCategoryContext(
      industryLabel: dependency.industryCategory.label.trim().isNotEmpty
          ? dependency.industryCategory.label.trim()
          : dependency.industryCategory.value.trim(),
      businessTypeLabel: dependency.businessType == null
          ? '-'
          : (dependency.businessType!.label.trim().isNotEmpty
              ? dependency.businessType!.label.trim()
              : dependency.businessType!.value.trim()),
      jobCategoryLabel:
          jobCategoryLabel.isEmpty ? dependency.categoryName : jobCategoryLabel,
    );
  }

  return _ResolvedProfileCategoryContext(
    industryLabel: '-',
    businessTypeLabel: '-',
    jobCategoryLabel: jobCategoryLabel.isEmpty ? '-' : jobCategoryLabel,
  );
}

String _normalizeWhatsappPhone(String value) {
  final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.isEmpty) {
    return '';
  }
  if (digits.length == 10) {
    return '91$digits';
  }
  if (digits.length == 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

String _buildWhatsAppMessage({
  required WorkerFeedItemModel item,
  required WorkerProfileModel profile,
  required bool isHindi,
}) {
  final contactName = (item.contactPerson ?? '').trim().isNotEmpty
      ? item.contactPerson!.trim()
      : item.companyName;
  final categories = profile.categoryLabels
      .where((value) => value.trim().isNotEmpty)
      .join(', ');
  final skills =
      profile.skills.where((value) => value.trim().isNotEmpty).join(', ');
  final experience = profile.experienceYears % 1 == 0
      ? profile.experienceYears.toStringAsFixed(0)
      : profile.experienceYears.toStringAsFixed(1);
  final wage = profile.expectedDailyWage % 1 == 0
      ? profile.expectedDailyWage.toStringAsFixed(0)
      : profile.expectedDailyWage.toStringAsFixed(1);
  final salaryType = profile.salaryType.trim().isEmpty
      ? 'Daily Wage'
      : profile.salaryType.trim();

  if (isHindi) {
    return 'नमस्ते $contactName,\n\n'
        'मेरा नाम ${profile.fullName} है। मुझे आपकी जॉब "${item.title}" में रुचि है।\n\n'
        'मेरी प्रोफाइल:\n'
        'नाम: ${profile.fullName}\n'
        'मोबाइल: ${profile.mobile}\n'
        'शहर: ${profile.city}\n'
        'कैटेगरी: ${categories.isEmpty ? '-' : categories}\n'
        'स्किल्स: ${skills.isEmpty ? '-' : skills}\n'
        'अनुभव: $experience वर्ष\n'
        'वेतन प्रकार: $salaryType\n'
        'अपेक्षित वेतन / मजदूरी: Rs $wage\n\n'
        'कृपया बताइए अगर यह जॉब अभी उपलब्ध है।';
  }

  return 'Hello $contactName,\n\n'
      'My name is ${profile.fullName}. I am interested in your job "${item.title}".\n\n'
      'My profile:\n'
      'Name: ${profile.fullName}\n'
      'Mobile: ${profile.mobile}\n'
      'City: ${profile.city}\n'
      'Categories: ${categories.isEmpty ? '-' : categories}\n'
      'Skills: ${skills.isEmpty ? '-' : skills}\n'
      'Experience: $experience years\n'
      'Salary type: $salaryType\n'
      'Expected salary/wage: Rs $wage\n\n'
      'Please let me know if this job is still available.';
}

Future<void> _openJobWhatsApp(
  BuildContext context,
  WorkerFeedItemModel item,
  WorkerProfileModel profile,
) async {
  final l10n = WorkerLocalizations.of(context);
  final phone = _normalizeWhatsappPhone(item.companyMobile?.trim() ?? '');
  if (phone.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          l10n.isHindi
              ? 'कंपनी का व्हाट्सऐप नंबर उपलब्ध नहीं है।'
              : 'Company WhatsApp number is not available.',
        ),
      ),
    );
    return;
  }
  final message = _buildWhatsAppMessage(
    item: item,
    profile: profile,
    isHindi: l10n.isHindi,
  );
  final uri =
      Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          l10n.isHindi
              ? 'व्हाट्सऐप खोला नहीं जा सका।'
              : 'Could not open WhatsApp.',
        ),
      ),
    );
  }
}

Future<void> _callJobCompany(
    BuildContext context, WorkerFeedItemModel item) async {
  final phone = (item.companyMobile ?? '').replaceAll(RegExp(r'[^0-9+]'), '');
  if (phone.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Company phone number is not available.')),
    );
    return;
  }
  final launched = await launchUrl(Uri.parse('tel:$phone'),
      mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open phone dialer.')),
    );
  }
}

String _distanceLabel(BuildContext context, _LiveLocationSnapshot liveLocation,
    WorkerFeedItemModel item,
    {_DerivedJobCoordinates? resolvedCoordinates}) {
  final l10n = WorkerLocalizations.of(context);
  final workerLat = liveLocation.latitude;
  final workerLng = liveLocation.longitude;
  final jobLat = resolvedCoordinates?.latitude ?? item.latitude;
  final jobLng = resolvedCoordinates?.longitude ?? item.longitude;
  final coordinateSource = resolvedCoordinates?.source.isNotEmpty == true
      ? resolvedCoordinates!.source
      : item.coordinateSource;
  if (workerLat == null || workerLng == null) {
    if (kDebugMode || kProfileMode) {
      debugPrint(
        'KM hidden: ${item.title} source=$coordinateSource '
        'jobLat=$jobLat jobLng=$jobLng workerLat=$workerLat workerLng=$workerLng',
      );
    }
    return l10n.enableLocationToSeeDistance;
  }
  if (jobLat == null || jobLng == null) {
    if (kDebugMode || kProfileMode) {
      debugPrint(
        'KM unavailable: ${item.title} source=$coordinateSource '
        'jobLat=$jobLat jobLng=$jobLng workerLat=$workerLat workerLng=$workerLng',
      );
    }
    return l10n.distanceUnavailable;
  }
  final km = _haversineKm(workerLat, workerLng, jobLat, jobLng);
  final wholeKm = km.roundToDouble() == km;
  final kmText = wholeKm ? km.toStringAsFixed(0) : km.toStringAsFixed(1);
  final label =
      km < 1 ? l10n.mAway((km * 1000).round().toString()) : l10n.kmAway(kmText);
  if (kDebugMode || kProfileMode) {
    debugPrint(
      'KM shown: ${item.title} source=$coordinateSource '
      'jobLat=$jobLat jobLng=$jobLng workerLat=$workerLat workerLng=$workerLng distance=$label',
    );
  }
  return label;
}

double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
  const earthRadiusKm = 6371.0;
  final dLat = _degreesToRadians(lat2 - lat1);
  final dLon = _degreesToRadians(lon2 - lon1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_degreesToRadians(lat1)) *
          math.cos(_degreesToRadians(lat2)) *
          math.sin(dLon / 2) *
          math.sin(dLon / 2);
  return earthRadiusKm * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

double _degreesToRadians(double value) => value * math.pi / 180;

String _normalizeGeocodePart(String value) {
  return value
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'\s+'), ' ')
      .replaceAll(RegExp(r'[^a-z0-9,\- ]'), '');
}

String _findMasterOptionLabel(List<WorkerMasterOption> options, String id) {
  for (final option in options) {
    if (option.id == id) {
      return option.label;
    }
  }
  return id;
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

String _resolvePrimaryLiveLocation(
  _LiveLocationSnapshot liveLocation,
  WorkerProfileModel profile,
  WorkerLocalizations l10n,
) {
  if (liveLocation.city.trim().isNotEmpty) {
    return liveLocation.city.trim();
  }
  final city = profile.city.trim();
  final homeCity = profile.homeCity.trim();

  if (city.isNotEmpty) {
    return city;
  }
  if (homeCity.isNotEmpty) {
    return homeCity;
  }
  return l10n.isHindi
      ? 'अपना शहर जोड़ें'
      : 'Set your city';
}

String _resolveSecondaryLiveLocation(
  _LiveLocationSnapshot liveLocation,
  WorkerProfileModel profile,
) {
  if (liveLocation.area.trim().isNotEmpty) {
    return liveLocation.area.trim();
  }
  final city = profile.city.trim().toLowerCase();
  final address = profile.address.trim();
  if (address.isNotEmpty) {
    final firstPart = address
        .split(',')
        .map((part) => part.trim())
        .firstWhere((part) => part.isNotEmpty, orElse: () => '');
    if (firstPart.isNotEmpty) {
      final normalized = firstPart.toLowerCase();
      if (normalized != city) {
        return firstPart;
      }
    }
  }

  final homeCity = profile.homeCity.trim();
  if (homeCity.isNotEmpty && homeCity.toLowerCase() != city) {
    return homeCity;
  }

  return '';
}

String _activationHeadline(
    WorkerLocalizations l10n, WorkerActivationSummaryModel activation) {
  if (!l10n.isHindi) {
    return activation.headline;
  }

  return switch (activation.status) {
    'active' => 'वर्कर एक्सेस सक्रिय है',
    'inactive_paused_by_worker' => 'वर्कर एक्सेस रोका गया है',
    'inactive_wallet_empty' =>
      'वॉलेट रिचार्ज की जरूरत है',
    'inactive_subscription_expired' =>
      'एक्सेस दोबारा सक्रिय करें',
    'blocked' => 'वर्कर एक्सेस ब्लॉक है',
    'rejected' => 'प्रोफ़ाइल अस्वीकृत है',
    _ =>
      'वर्कर प्रोफ़ाइल अपडेट करें',
  };
}

String _activationDescription(
    WorkerLocalizations l10n, WorkerActivationSummaryModel activation) {
  if (!l10n.isHindi) {
    return activation.description;
  }

  return switch (activation.status) {
    'active' =>
      'आपका वॉलेट सक्रिय है। दैनिक कटौती के बाद भी कंपनी डिटेल्स खुली रहेंगी।',
    'inactive_paused_by_worker' =>
      'वर्कर एक्सेस आपके द्वारा रोका गया है। दोबारा सक्रिय करने तक दैनिक कटौती नहीं होगी।',
    'inactive_wallet_empty' =>
      'वॉलेट बैलेंस कम है। रिचार्ज करके कंपनी डिटेल्स और विजिबिलिटी फिर से चालू करें।',
    'inactive_subscription_expired' =>
      'एक्सेस अवधि खत्म हो गई है। रिचार्ज करके दोबारा सक्रिय करें।',
    'blocked' =>
      'एडमिन ने इस प्रोफ़ाइल को रोका है। सहायता के लिए एडमिन से संपर्क करें।',
    'rejected' =>
      'प्रोफ़ाइल को समीक्षा के बाद स्वीकार नहीं किया गया। जानकारी अपडेट करें।',
    _ =>
      'बेहतर मैच पाने के लिए अपनी जानकारी और वॉलेट स्थिति अपडेट रखें।',
  };
}

String _walletVisibilityRule(
    WorkerLocalizations l10n, WorkerDashboardModel dashboard) {
  if (_hasActiveFreePlan(dashboard)) {
    final validTillLabel = _formatShortDate(dashboard.workerPlan?.planEndDate);
    if (!l10n.isHindi) {
      return validTillLabel == null
          ? 'Your free worker plan is active. No daily deduction is required during this plan.'
          : 'Your free worker plan is active. Valid till $validTillLabel. No daily deduction is required during this plan.';
    }

    return validTillLabel == null
        ? 'आपका फ्री वर्कर प्लान अभी सक्रिय है। इस प्लान के दौरान कोई दैनिक कटौती नहीं होगी।'
        : 'आपका फ्री वर्कर प्लान अभी सक्रिय है। वैधता $validTillLabel तक है और इस प्लान के दौरान कोई दैनिक कटौती नहीं होगी।';
  }

  if (_isDashboardPausedByWorker(dashboard)) {
    if (!l10n.isHindi) {
      return 'Your paid worker plan is paused. Daily deduction will stay stopped until you activate worker access again.';
    }

    return 'आपका पेड वर्कर प्लान रोका गया है। दोबारा सक्रिय करने तक दैनिक कटौती रुकी रहेगी।';
  }

  if (!dashboard.activation.isActive ||
      dashboard.wallet.estimatedDaysRemaining <= 0) {
    if (!l10n.isHindi) {
      return 'Plan expired. Recharge to restore worker access and company details.';
    }

    return 'योजना समाप्त हो चुकी है। कंपनी डिटेल्स और वर्कर एक्सेस फिर से चालू करने के लिए रीचार्ज करें।';
  }

  if (!l10n.isHindi) {
    return dashboard.wallet.visibilityRule;
  }

  if (_dashboardWorkerActive(dashboard)) {
    return 'एक्सेस सक्रिय रहने तक आपकी प्रोफ़ाइल दिखाई देगी और कंपनी संपर्क उपलब्ध रहेंगे।';
  }

  return 'वॉलेट बैलेंस और सक्रिय स्थिति के आधार पर कंपनी डिटेल्स और विजिबिलिटी नियंत्रित होती है।';
}
