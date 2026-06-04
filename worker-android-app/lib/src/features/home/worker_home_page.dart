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
    final categoryCompare = (rightCategoryMatch ? 1 : 0) -
        (leftCategoryMatch ? 1 : 0);
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

    final leftIndustryBusinessScore =
        (_jobRankSetsIntersect(
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
    final rightIndustryBusinessScore =
        (_jobRankSetsIntersect(
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
  final Map<String, _DerivedJobCoordinates?> _geocodedJobCoordinateCache = {};
  final Set<String> _geocodingJobCoordinateKeys = <String>{};
  late final Razorpay _razorpay;

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
  Position? _livePosition;
  String _liveCity = '';
  String _liveArea = '';
  bool _locationPermissionDenied = false;
  bool _locationUnavailable = false;
  List<String> _favouriteCities = const [];
  bool _popularCategoriesExpanded = false;
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
    _razorpay.clear();
    _rechargeAmountController.dispose();
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
    for (final item in feed) {
      if (item.latitude != null && item.longitude != null) {
        continue;
      }
      unawaited(_ensureDerivedJobCoordinates(item));
    }
  }

  String? _derivedCoordinateCacheKey(WorkerFeedItemModel item) {
    final pincode = _normalizeGeocodePart(item.companyPincode);
    if (pincode.isEmpty) {
      return null;
    }
    final parts = [
      item.locationLabel,
      item.companyArea,
      item.companyCity,
      item.city,
      pincode,
    ]
        .map(_normalizeGeocodePart)
        .where((value) => value.isNotEmpty)
        .toList();
    if (parts.length < 2) {
      return null;
    }
    return parts.join('|');
  }

  List<String> _geocodeQueriesForItem(WorkerFeedItemModel item) {
    final pincode = item.companyPincode.trim();
    if (pincode.isEmpty) {
      return const [];
    }
    final areaCandidates = <String>[
      item.locationLabel.trim(),
      item.companyArea.trim(),
    ].where((value) => value.isNotEmpty).toSet().toList();
    final cityCandidates = <String>[
      item.companyCity.trim(),
      item.city.trim(),
    ].where((value) => value.isNotEmpty).toSet().toList();
    final queries = <String>[];
    for (final area in areaCandidates) {
      for (final city in cityCandidates) {
        queries.add('$area, $city, $pincode, India');
      }
    }
    return queries.toSet().toList();
  }

  Future<void> _ensureDerivedJobCoordinates(WorkerFeedItemModel item) async {
    final cacheKey = _derivedCoordinateCacheKey(item);
    if (cacheKey == null ||
        _geocodedJobCoordinateCache.containsKey(cacheKey) ||
        _geocodingJobCoordinateKeys.contains(cacheKey)) {
      return;
    }

    _geocodingJobCoordinateKeys.add(cacheKey);
    _DerivedJobCoordinates? derivedCoordinates;

    try {
      for (final query in _geocodeQueriesForItem(item)) {
        try {
          final results = await locationFromAddress(query);
          if (results.isEmpty) {
            continue;
          }
          derivedCoordinates = _DerivedJobCoordinates(
            latitude: results.first.latitude,
            longitude: results.first.longitude,
            source: query,
          );
          break;
        } catch (_) {
          continue;
        }
      }
      if (kDebugMode || kProfileMode) {
        debugPrint(
          derivedCoordinates == null
              ? 'Geo miss: ${item.title} key=$cacheKey'
              : 'Geo hit: ${item.title} key=$cacheKey source=${derivedCoordinates.source}',
        );
      }
    } finally {
      _geocodingJobCoordinateKeys.remove(cacheKey);
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _geocodedJobCoordinateCache[cacheKey] = derivedCoordinates;
    });
  }

  _DerivedJobCoordinates? _resolveJobCoordinatesForItem(WorkerFeedItemModel item) {
    if (item.latitude != null && item.longitude != null) {
      return _DerivedJobCoordinates(
        latitude: item.latitude!,
        longitude: item.longitude!,
        source: item.coordinateSource.isEmpty ? 'feed' : item.coordinateSource,
      );
    }
    final cacheKey = _derivedCoordinateCacheKey(item);
    if (cacheKey == null) {
      return null;
    }
    return _geocodedJobCoordinateCache[cacheKey];
  }

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
      MaterialPageRoute(builder: (_) => const OtpLoginPage()),
      (route) => false,
    );
  }

  Future<bool> _handleSessionExpiryIfNeeded(String message) async {
    if (!_isSessionError(message)) {
      return false;
    }
    await _resetSessionAndGoToLogin('Session expired. Please login again.');
    return true;
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
                ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤µà¤¿à¤•à¤²à¥à¤ª à¤…à¤­à¥€ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¤‚à¥¤'
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
            : (l10n.isHindi ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ' : 'Support');
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
                    title: Text(
                        l10n.isHindi ? 'à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ' : 'WhatsApp support'),
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
                    title: Text(l10n.isHindi ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤²à¤¿à¤‚à¤•' : 'Support link'),
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
                ? 'à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤'
                : 'WhatsApp support is not available.',
          ),
        ),
      );
      return;
    }

    final message = support.prefilledMessage.trim().isNotEmpty
        ? support.prefilledMessage.trim()
        : (l10n.isHindi
            ? 'à¤¨à¤®à¤¸à¥à¤¤à¥‡ à¤Ÿà¥€à¤®, à¤®à¥à¤à¥‡ Rozgar worker app à¤®à¥‡à¤‚ à¤®à¤¦à¤¦ à¤šà¤¾à¤¹à¤¿à¤à¥¤'
            : 'Hello Team, I need help with the Rozgar worker app.');

    final uri =
        Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª à¤–à¥‹à¤²à¤¾ à¤¨à¤¹à¥€à¤‚ à¤œà¤¾ à¤¸à¤•à¤¾à¥¤'
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
                ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤²à¤¿à¤‚à¤• à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤'
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
                ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤²à¤¿à¤‚à¤• à¤…à¤®à¤¾à¤¨à¥à¤¯ à¤¹à¥ˆà¥¤'
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
                ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ à¤²à¤¿à¤‚à¤• à¤–à¥‹à¤²à¤¾ à¤¨à¤¹à¥€à¤‚ à¤œà¤¾ à¤¸à¤•à¤¾à¥¤'
                : 'Could not open the support link.',
          ),
        ),
      );
    }
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

  Future<void> _startWalletRecharge() async {
    final amount = double.tryParse(_rechargeAmountController.text.trim());
    if (amount == null || amount < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum recharge amount is Rs 10.')),
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
    final dashboard = _dashboard;
    if (dashboard == null) {
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _JobDetailsPage(
          item: item,
          profile: dashboard.profile,
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
          profile: dashboard.profile,
          items: dashboard.feed.where((item) => item.isSaved).toList(),
          onApply: _applyToJob,
          onToggleSaved: _toggleSavedJob,
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
        final fallback = filteredDependencyCategories
            .map((dependency) {
              final match = categoriesByKey[
                      _normalizeFilterKey(dependency.categoryId)] ??
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
            })
            .toList();
        options = fallback;
      }
    }

    final deduped = <String, WorkerCategoryOption>{};
    for (final option in options) {
      final key = _normalizeFilterKey(option.id.isNotEmpty ? option.id : option.name);
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
              initialSelectedCityFilter:
                  overrideCityFilter ?? _selectedCityFilter,
              initialSelectedWageBand: _selectedWageBand,
              resolveJobCoordinatesForItem: _resolveJobCoordinatesForItem,
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
      final city = (item.city.trim().isNotEmpty ? item.city : item.companyCity)
          .trim();
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
      final countCompare =
          (counts[_normalizeCityKey(right)] ?? 0).compareTo(
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

  List<WorkerCategoryOption> _popularCategories(WorkerDashboardModel dashboard) {
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
        title: 'Jobs in your favourite cities',
        changeLabel: 'Change',
        addMoreLabel: 'Add more',
        clearLabel: 'Clear',
        visibleCities: suggestedCities,
        cityJobCounts: _jobCountByCity(dashboard),
        onChange: _openFavouriteCitiesPicker,
        onClear: _favouriteCities.isEmpty ? null : _clearFavouriteCities,
        onCityTap: _openCityJobs,
      ),
      const SizedBox(height: 16),
      _PopularCategoriesSection(
        title: 'Popular Job Categories',
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
    if (workerLat != null && workerLng != null && jobLat != null && jobLng != null) {
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
        _FeedViewTab.otherCities => _itemMatchesOtherCities(item, dashboard.profile),
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
        centerTitle: false,
        toolbarHeight: 76,
        titleSpacing: 0,
        title: Align(
          alignment: Alignment.centerLeft,
          child: InkWell(
            onTap: () {
              if (_selectedIndex != 0) {
                setState(() => _selectedIndex = 0);
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
              tooltip: l10n.isHindi ? 'à¤¸à¥‡à¤µà¥à¤¡ à¤œà¥‰à¤¬à¥à¤¸' : 'Saved jobs',
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
              tooltip: l10n.isHindi ? 'à¤¸à¤ªà¥‹à¤°à¥à¤Ÿ' : 'Support',
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
                          visibleJobsCount: _filteredFeed.length,
                          liveLocation:
                              _liveLocationSnapshot(dashboard.profile),
                          resolveJobCoordinatesForItem:
                              _resolveJobCoordinatesForItem,
                          feed: _filteredFeed.take(8).toList(growable: false),
                          emptyStateMessage: _feedEmptyMessage(dashboard),
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
                          industryOptions: dashboard.availableIndustryCategories
                            ..sort((a, b) => a.label
                                .toLowerCase()
                                .compareTo(b.label.toLowerCase())),
                          businessTypeOptions:
                              _availableBusinessTypeOptions(dashboard),
                          categoryOptions: _availableCategoryOptions(dashboard),
                          cityOptions: _availableCityOptions(dashboard),
                          activeJobActionId: _jobActionId,
                          onRefresh: _loadDashboard,
                          onFeedTabChanged: (value) =>
                              setState(() => _selectedFeedTab = value),
                          onQueryChanged: (value) =>
                              setState(() => _feedQuery = value),
                          onToggleUnlockedOnly: (value) =>
                              setState(() => _showUnlockedOnly = value),
                          onToggleSavedOnly: (value) =>
                              setState(() => _showSavedOnly = value),
                          onToggleAppliedOnly: (value) =>
                              setState(() => _showAppliedOnly = value),
                          onIndustryFilterChanged: (value) => setState(() {
                            _selectedIndustryFilter = value;
                            _selectedBusinessTypeFilter = 'all';
                            final availableCategories = _availableCategoryOptions(
                              dashboard,
                            );
                            final allowedKeys = availableCategories
                                .expand((item) => [item.id, item.name])
                                .map(_normalizeFilterKey)
                                .where((item) => item.isNotEmpty)
                                .toSet();
                            _selectedCategoryFilters = _selectedCategoryFilters
                                .where((item) =>
                                    allowedKeys.contains(_normalizeFilterKey(item)))
                                .toList(growable: false);
                          }),
                          onBusinessTypeFilterChanged: (value) => setState(() {
                            _selectedBusinessTypeFilter = value;
                            final availableCategories = _availableCategoryOptions(
                              dashboard,
                            );
                            final allowedKeys = availableCategories
                                .expand((item) => [item.id, item.name])
                                .map(_normalizeFilterKey)
                                .where((item) => item.isNotEmpty)
                                .toSet();
                            _selectedCategoryFilters = _selectedCategoryFilters
                                .where((item) =>
                                    allowedKeys.contains(_normalizeFilterKey(item)))
                                .toList(growable: false);
                          }),
                          onCategoryFiltersChanged: (value) => setState(() =>
                              _selectedCategoryFilters =
                                  List.unmodifiable(value)),
                          onCityFilterChanged: (value) =>
                              setState(() => _selectedCityFilter = value),
                          onWageBandChanged: (value) =>
                              setState(() => _selectedWageBand = value),
                          onClearFilters: () => setState(() {
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
                          showViewMoreButton: _filteredFeed.length > 8,
                          onViewMoreJobs: _openViewMoreJobs,
                          sectionsAfterJobs: _buildHomeSections(dashboard),
                        ),
                        _WalletTab(
                          dashboard: dashboard,
                          rechargeAmountController: _rechargeAmountController,
                          onStartWalletRecharge: _startWalletRecharge,
                          onRefresh: _loadDashboard,
                          loading: _walletPaymentLoading || _loading,
                        ),
                        _ProfileTab(
                          dashboard: dashboard,
                          onSave: _saveProfile,
                          onLogout: _logout,
                          onRefresh: _loadDashboard,
                          loading: _loading,
                        ),
                        _NotificationsTab(
                          notifications: dashboard.notifications,
                          loading: _notificationsLoading,
                          onRefresh: _loadDashboard,
                          onMarkAllRead: () => _markNotificationsRead(),
                          onMarkRead: (notificationId) =>
                              _markNotificationsRead(
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
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.work_outline_rounded),
            selectedIcon: Icon(Icons.work_rounded),
            label: l10n.isHindi ? 'à¤¹à¥‹à¤®' : 'Home',
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
    final isActive = dashboard.activation.isActive ||
        profile.status.trim().toLowerCase() == 'active';
    final walletValue = 'Rs ${dashboard.wallet.balance.toStringAsFixed(0)}';
    final jobsValue = '$visibleJobsCount';
    final wageValue = profile.expectedDailyWage > 0
        ? 'Rs ${profile.expectedDailyWage.toStringAsFixed(profile.expectedDailyWage % 1 == 0 ? 0 : 1)}'
        : 'â€”';

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
                    label: l10n.wage,
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
  });

  @override
  Widget build(BuildContext context) {
    final l10n = WorkerLocalizations.of(context);
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
              .map((item) => categoryNameByKey[item] ?? item)
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
            .map((item) => categoryNameByKey[item] ?? item)
            .join(', ');
    final selectedCategoryDropdownValue =
        selectedCategoryFilters.length == 1 &&
                categoryOptions
                    .any((option) => option.id == selectedCategoryFilters.first)
            ? selectedCategoryFilters.first
            : 'all';

    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: ListView(
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
                          onTap: () => onFeedTabChanged(_FeedViewTab.otherCities),
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
                              label: Text(categoryNameByKey[category] ?? category),
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
                              (option) => _compactDropdownText(option.name),
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
                                  option.name,
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
                final canContactCompany =
                    !item.companyLocked && categoryMatch && hasCompanyMobile;
                final locationText = _locationLine(item, distanceLabel);
                final companyPerson = (item.contactPerson ?? '').trim().isNotEmpty
                    ? item.contactPerson!.trim()
                    : (showLockedState || item.companyLocked
                        ? (l10n.isHindi ? 'लॉक्ड' : 'Locked')
                        : '-');
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
                                    final shake = math.sin(value * math.pi * 4) *
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
                                      item.categoryName,
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
                                        item.title.trim() != item.categoryName.trim()) ...[
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
                                    _wageLabel(item),
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
                            '${l10n.isHindi ? 'Worker Required' : 'Worker Required'}: ${item.workersNeeded}',
                            style: const TextStyle(
                              color: Color(0xFF334155),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Text(
                                  '${l10n.isHindi ? 'Contact Person' : 'Contact Person'}: $companyPerson',
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
                                      backgroundColor: const Color(0xFFEFFAF3),
                                      side: const BorderSide(
                                        color: Color(0xFFB7E8C6),
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
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
                                    onPressed: () => _callJobCompany(context, item),
                                    style: OutlinedButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      backgroundColor: const Color(0xFFF8FAFC),
                                      side: const BorderSide(
                                        color: Color(0xFFD7E2EE),
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
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
                                        : 'View Details',
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
                  l10n.isHindi ? 'View More Jobs' : 'View More Jobs',
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

  static String _salaryTypeLabel(WorkerFeedItemModel item) {
    final normalized = (item.shiftType ?? '').trim().toLowerCase();
    if (normalized.contains('month')) {
      return 'Monthly Salary';
    }
    if (normalized.contains('week')) {
      return 'Weekly Payment';
    }
    if (normalized.contains('contract')) {
      return 'Contract Payment';
    }
    if (normalized.contains('piece')) {
      return 'Piece Rate';
    }
    if (normalized.contains('daily')) {
      return 'Daily Wage';
    }
    return '';
  }

  static String _wageLabel(WorkerFeedItemModel item) {
    final amount = item.wageAmount % 1 == 0
        ? item.wageAmount.toStringAsFixed(0)
        : item.wageAmount.toStringAsFixed(1);
    final salaryType = _salaryTypeLabel(item);
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
    final background = locked
        ? const Color(0xFFFFF4E5)
        : const Color(0xFFE8F7EF);
    final border = locked
        ? const Color(0xFFF5C98B)
        : const Color(0xFF9DD7B6);
    final textColor = locked
        ? const Color(0xFF9A5B13)
        : const Color(0xFF166534);
    final label = locked
        ? (isHindi ? 'कैटेगरी लॉक्ड' : 'Category Locked')
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

  const _AllJobsPage({
    required this.token,
    required this.initialDashboard,
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
  });

  @override
  State<_AllJobsPage> createState() => _AllJobsPageState();
}

class _AllJobsPageState extends State<_AllJobsPage> {
  final _apiService = WorkerApiService();

  late WorkerDashboardModel _dashboard;
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
  String _jobActionId = '';

  @override
  void initState() {
    super.initState();
    _dashboard = widget.initialDashboard;
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

  String _cleanError(Object error) {
    return error.toString().replaceFirst('Exception: ', '').trim();
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
      final filteredDependencyCategories = _dashboard.categoryDependencies.where(
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
                  categoriesByKey[
                      _normalizeFilterKey(dependency.categoryName)];
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

  Future<void> _loadDashboard() async {
    setState(() => _loading = true);
    try {
      final dashboard = await _apiService.getDashboard(widget.token);
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
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
    final l10n = WorkerLocalizations.of(context);
    setState(() => _jobActionId = jobPostId);
    try {
      final dashboard = await _apiService.applyToJob(
        widget.token,
        jobPostId: jobPostId,
      );
      if (!mounted) return;
      setState(() => _dashboard = dashboard);
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
          onApply: _handleApply,
          onToggleSaved: _handleToggleSaved,
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

    return Scaffold(
      appBar: AppBar(
        title: Text(
          WorkerLocalizations.of(context).isHindi
              ? 'View More Jobs'
              : 'View More Jobs',
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
                visibleJobsCount: _filteredFeed.length,
                liveLocation: widget.initialLiveLocation,
                resolveJobCoordinatesForItem:
                    widget.resolveJobCoordinatesForItem,
                feed: _filteredFeed,
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
                industryOptions:
                    List<WorkerMasterOption>.from(
                      dashboard.availableIndustryCategories,
                    )..sort(
                      (a, b) =>
                          a.label.toLowerCase().compareTo(b.label.toLowerCase()),
                    ),
                businessTypeOptions: _availableBusinessTypeOptions(),
                categoryOptions: _availableCategoryOptions(),
                cityOptions: _availableCityOptions(),
                activeJobActionId: _jobActionId,
                onRefresh: _loadDashboard,
                onFeedTabChanged: (value) =>
                    setState(() => _selectedFeedTab = value),
                onQueryChanged: (value) => setState(() => _feedQuery = value),
                onToggleUnlockedOnly: (value) =>
                    setState(() => _showUnlockedOnly = value),
                onToggleSavedOnly: (value) =>
                    setState(() => _showSavedOnly = value),
                onToggleAppliedOnly: (value) =>
                    setState(() => _showAppliedOnly = value),
                onIndustryFilterChanged: (value) => setState(() {
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
                onBusinessTypeFilterChanged: (value) => setState(() {
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
                onCategoryFiltersChanged: (value) => setState(
                  () => _selectedCategoryFilters = List.unmodifiable(value),
                ),
                onCityFilterChanged: (value) =>
                    setState(() => _selectedCityFilter = value),
                onWageBandChanged: (value) =>
                    setState(() => _selectedWageBand = value),
                onClearFilters: _clearFilters,
                onApply: _handleApply,
                onToggleSaved: _handleToggleSaved,
                onOpenDetails: _openJobDetails,
                showTopSummarySection: false,
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
            final maxCardsInViewport = visibleCardCount >= 4 ? 4 : visibleCardCount;
            final totalSpacing = 8.0 * (maxCardsInViewport - 1);
            final cardWidth = ((constraints.maxWidth - totalSpacing) / maxCardsInViewport)
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
                label: Text(expanded ? 'Show less' : 'Show more'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final cardWidth = ((constraints.maxWidth - 24) / 4).clamp(78.0, 92.0);
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
                                option.name,
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
                      onPressed: () => Navigator.of(context).pop(const <String>[]),
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
                      onPressed: () => Navigator.of(context).pop(_selectedCities),
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
                                            option.name,
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
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;

  const _JobDetailsPage({
    required this.item,
    required this.profile,
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

  Future<void> _openWhatsApp() async {
    final l10n = WorkerLocalizations.of(context);
    final companyMobile = widget.item.companyMobile?.trim() ?? '';
    final normalizedPhone = _normalizeWhatsappPhone(companyMobile);
    if (normalizedPhone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            l10n.isHindi
                ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤•à¤¾ à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª à¤¨à¤‚à¤¬à¤° à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤'
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
                ? 'à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª à¤–à¥‹à¤²à¤¾ à¤¨à¤¹à¥€à¤‚ à¤œà¤¾ à¤¸à¤•à¤¾à¥¤'
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

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.isHindi ? 'à¤œà¥‰à¤¬ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸' : 'Job details'),
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
                      ? 'à¤¯à¤¹ à¤œà¥‰à¤¬ ${_shortDate(context, item.expiresAt)} à¤¤à¤• à¤–à¥à¤²à¥€ à¤¹à¥ˆ à¤”à¤° ${item.workersNeeded} à¤µà¤°à¥à¤•à¤° à¤šà¤¾à¤¹à¤¿à¤à¥¤'
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
                      label: l10n.isHindi ? 'à¤®à¥ˆà¤š' : 'Match',
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
                    l10n.isHindi ? 'à¤œà¥‰à¤¬ à¤“à¤µà¤°à¤µà¥à¤¯à¥‚' : 'Job overview',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _FeedTab._chip(item.categoryName),
                      _FeedTab._chip(l10n.workersNeeded(item.workersNeeded)),
                      _FeedTab._chip(
                          l10n.localizeMatchReason(item.matchReason)),
                      if (_isSaved)
                        _FeedTab._chip(l10n.saved,
                            fill: const Color(0xFFF0FDF4)),
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
                    style:
                        const TextStyle(color: Color(0xFF475569), height: 1.7),
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
                    l10n.isHindi ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸' : 'Company details',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w800),
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
                          label: l10n.isHindi ? 'à¤•à¤‚à¤ªà¤¨à¥€' : 'Company',
                          value: item.companyName,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _ProfileInfoTile(
                                label: l10n.isHindi
                                    ? 'à¤¸à¤‚à¤ªà¤°à¥à¤• à¤µà¥à¤¯à¤•à¥à¤¤à¤¿'
                                    : 'Contact person',
                                value: item.contactPerson ?? '-',
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _ProfileInfoTile(
                                label: l10n.isHindi ? 'à¤®à¥‹à¤¬à¤¾à¤‡à¤²' : 'Mobile',
                                value: item.companyMobile ?? '-',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _ProfileInfoTile(
                          label: l10n.isHindi ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤¶à¤¹à¤°' : 'Company city',
                          value: item.companyCity,
                        ),
                        if ((item.companyMobile ?? '').trim().isNotEmpty) ...[
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: _openWhatsApp,
                              icon: const Icon(Icons.chat_rounded),
                              label: Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                child: Text(
                                  l10n.isHindi
                                      ? 'à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª à¤ªà¤° à¤¬à¤¾à¤¤ à¤•à¤°à¥‡à¤‚'
                                      : 'Chat on WhatsApp',
                                ),
                              ),
                            ),
                          ),
                        ],
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
                    l10n.isHindi ? 'à¤œà¥‰à¤¬ à¤à¤•à¥à¤Ÿà¤¿à¤µà¤¿à¤Ÿà¥€' : 'Job activity',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _ProfileInfoTile(
                          label: l10n.isHindi ? 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤•à¥€ à¤—à¤ˆ' : 'Published',
                          value: _shortDate(context, item.publishedAt),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ProfileInfoTile(
                          label: l10n.isHindi ? 'à¤¸à¤®à¤¾à¤ªà¥à¤¤à¤¿' : 'Expires',
                          value: _shortDate(context, item.expiresAt),
                        ),
                      ),
                    ],
                  ),
                  if (item.appliedAt != null) ...[
                    const SizedBox(height: 12),
                    _ProfileInfoTile(
                      label: l10n.isHindi ? 'à¤…à¤ªà¥à¤²à¤¾à¤ˆ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾' : 'Applied on',
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
                    _isSaved
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_outline_rounded,
                  ),
                  label: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Text(
                        _isSaved ? l10n.removeFromShortlist : l10n.saveJob),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed:
                      _hasApplied || _actionLoading ? null : _handleApply,
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
  final WorkerProfileModel profile;
  final List<WorkerFeedItemModel> items;
  final Future<void> Function(String jobPostId) onApply;
  final Future<void> Function(String jobPostId) onToggleSaved;

  const _SavedJobsPage({
    required this.profile,
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
        title: Text(l10n.isHindi ? 'à¤¸à¥‡à¤µà¥à¤¡ à¤œà¥‰à¤¬à¥à¤¸' : 'Saved jobs'),
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
                  l10n.isHindi ? 'à¤†à¤ªà¤•à¥€ à¤¶à¥‰à¤°à¥à¤Ÿà¤²à¤¿à¤¸à¥à¤Ÿ' : 'Your shortlist',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.isHindi
                      ? 'à¤¸à¥‡à¤µ à¤•à¥€ à¤—à¤ˆ à¤œà¥‰à¤¬à¥à¤¸ à¤•à¥‹ à¤à¤• à¤œà¤—à¤¹ à¤¸à¥‡ à¤¦à¥‡à¤–à¥‡à¤‚, à¤¤à¥à¤²à¤¨à¤¾ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤¸à¤¹à¥€ à¤¸à¤®à¤¯ à¤ªà¤° à¤…à¤ªà¥à¤²à¤¾à¤ˆ à¤•à¤°à¥‡à¤‚à¥¤'
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
                      label: l10n.isHindi ? 'à¤…à¤¨à¤²à¥‰à¤•' : 'Unlocked',
                      value: '$unlockedCount',
                    ),
                    _SummaryChip(
                      label: l10n.isHindi ? 'à¤…à¤ªà¥à¤²à¤¾à¤‡à¤¡' : 'Applied',
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
                      ? 'à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤¸à¥‡à¤µà¥à¤¡ à¤œà¥‰à¤¬ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤ à¤«à¥€à¤¡ à¤¸à¥‡ à¤œà¥‰à¤¬ à¤¸à¥‡à¤µ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤µà¤¹ à¤¯à¤¹à¤¾à¤ à¤¦à¤¿à¤–à¤¾à¤ˆ à¤¦à¥‡à¤—à¥€à¥¤'
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
                                    style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${item.city} | ${item.categoryName}',
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
                                      ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤²à¥‰à¤•'
                                      : 'Company locked')
                                  : (l10n.isHindi
                                      ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤–à¥à¤²à¥€'
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
                                      ? 'à¤ªà¥‚à¤°à¤¾ à¤µà¤¿à¤µà¤°à¤£'
                                      : 'View details'),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton(
                                onPressed: item.hasApplied || actionLoading
                                    ? null
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
                      '${l10n.localizeNotificationMessage(type: notification.type, message: notification.message)}\n${_shortDate(context, notification.createdAt)} - ${_prettyText(context, notification.priority)} ${l10n.isHindi ? 'à¤ªà¥à¤°à¤¾à¤¥à¤®à¤¿à¤•à¤¤à¤¾' : 'priority'}',
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
  final Future<void> Function() onStartWalletRecharge;
  final Future<void> Function() onRefresh;
  final bool loading;

  const _WalletTab({
    required this.dashboard,
    required this.rechargeAmountController,
    required this.onStartWalletRecharge,
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
                    style:
                        const TextStyle(color: Color(0xFF64748B), height: 1.5),
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
                          style: const TextStyle(
                              color: Color(0xFFE6EEFF), height: 1.6),
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
                          value:
                              'Rs ${dashboard.wallet.dailyCharge.toStringAsFixed(0)}',
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
                          label: l10n.isHindi
                              ? 'à¤°à¤œà¤¿à¤¸à¥à¤Ÿà¥à¤°à¥‡à¤¶à¤¨ à¤«à¥€à¤¸ (à¤à¤• à¤¬à¤¾à¤°)'
                              : 'Registration fee (one time)',
                          value:
                              'Rs ${dashboard.wallet.registrationFee.toStringAsFixed(0)}',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _MiniStatCard(
                          label: l10n.isHindi ? 'à¤«à¥€à¤¸ à¤¸à¥à¤Ÿà¥‡à¤Ÿà¤¸' : 'Fee status',
                          value: dashboard.wallet.registrationFeePaid
                              ? (l10n.isHindi ? 'Paid' : 'Paid')
                              : (l10n.isHindi ? 'Pending' : 'Pending'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: rechargeAmountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Recharge amount',
                      hintText: 'Enter amount',
                      prefixIcon: Icon(Icons.currency_rupee_rounded),
                    ),
                  ),
                  const SizedBox(height: 4),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: loading ? null : onStartWalletRecharge,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Text(
                            loading ? 'Opening payment...' : 'Recharge Wallet'),
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
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                title: Text(_prettyText(context, transaction.transactionType)),
                subtitle: Text(
                  transaction.note.isEmpty
                      ? transaction.reference
                      : transaction.note,
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
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF64748B)),
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
                    style:
                        const TextStyle(color: Color(0xFF64748B), height: 1.5),
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
                          label: l10n.isHindi ? 'à¤¸à¥à¤¥à¤¿à¤¤à¤¿' : 'Status',
                          value: _prettyText(context, profile.status),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: l10n.fullName,
                      prefixIcon: const Icon(Icons.person_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 4),
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
                            labelText: l10n.expectedDailyWage,
                            prefixIcon:
                                const Icon(Icons.currency_rupee_rounded),
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
                  Text(l10n.categories,
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children:
                        widget.dashboard.availableCategories.map((category) {
                      final selected =
                          _selectedCategories.contains(category.id);
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
                  const SizedBox(height: 8),
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
                          value: 'not_available',
                          child: Text(l10n.notAvailable)),
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
                        child: Text(
                            widget.loading ? l10n.saving : l10n.saveProfile),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Card(
                    color: const Color(0xFFFFFBEB),
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.isHindi ? 'à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ' : 'Account',
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            l10n.isHindi
                                ? 'à¤¯à¤¦à¤¿ à¤†à¤ª à¤‡à¤¸ à¤¡à¤¿à¤µà¤¾à¤‡à¤¸ à¤¸à¥‡ à¤¬à¤¾à¤¹à¤° à¤¨à¤¿à¤•à¤²à¤¨à¤¾ à¤šà¤¾à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚, à¤¤à¥‹ à¤¨à¥€à¤šà¥‡ à¤²à¥‰à¤—à¤†à¤‰à¤Ÿ à¤•à¤°à¥‡à¤‚à¥¤'
                                : 'Use logout below if you want to sign out from this device.',
                            style: const TextStyle(
                                color: Color(0xFF64748B), height: 1.5),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: widget.onLogout,
                              icon: const Icon(Icons.logout_rounded),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFFB42318),
                                side:
                                    const BorderSide(color: Color(0xFFFDA29B)),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                              ),
                              label: Text(l10n.isHindi ? 'à¤²à¥‰à¤—à¤†à¤‰à¤Ÿ' : 'Logout'),
                            ),
                          ),
                        ],
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
            ? (l10n.isHindi ? 'à¤¸à¤•à¥à¤°à¤¿à¤¯' : 'Active')
            : (l10n.isHindi ? 'à¤¨à¤¿à¤·à¥à¤•à¥à¤°à¤¿à¤¯' : 'Inactive'),
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

  if (isHindi) {
    return 'à¤¨à¤®à¤¸à¥à¤¤à¥‡ $contactName,\n\n'
        'à¤®à¥‡à¤°à¤¾ à¤¨à¤¾à¤® ${profile.fullName} à¤¹à¥ˆà¥¤ à¤®à¥à¤à¥‡ à¤†à¤ªà¤•à¥€ à¤œà¥‰à¤¬ "${item.title}" à¤®à¥‡à¤‚ à¤°à¥à¤šà¤¿ à¤¹à¥ˆà¥¤\n\n'
        'à¤®à¥‡à¤°à¥€ à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤²:\n'
        'à¤¨à¤¾à¤®: ${profile.fullName}\n'
        'à¤®à¥‹à¤¬à¤¾à¤‡à¤²: ${profile.mobile}\n'
        'à¤¶à¤¹à¤°: ${profile.city}\n'
        'à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€: ${categories.isEmpty ? '-' : categories}\n'
        'à¤¸à¥à¤•à¤¿à¤²à¥à¤¸: ${skills.isEmpty ? '-' : skills}\n'
        'à¤…à¤¨à¥à¤­à¤µ: $experience à¤µà¤°à¥à¤·\n'
        'à¤…à¤ªà¥‡à¤•à¥à¤·à¤¿à¤¤ à¤¦à¤¿à¤¹à¤¾à¤¡à¤¼à¥€: Rs $wage\n\n'
        'à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¬à¤¤à¤¾à¤‡à¤ à¤…à¤—à¤° à¤¯à¤¹ à¤œà¥‰à¤¬ à¤…à¤­à¥€ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¹à¥ˆà¥¤';
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
      'Expected daily wage: Rs $wage\n\n'
      'Please let me know if this job is still available.';
}

Future<void> _openJobWhatsApp(
  BuildContext context,
  WorkerFeedItemModel item,
  WorkerProfileModel profile,
) async {
  final phone = _normalizeWhatsappPhone(item.companyMobile?.trim() ?? '');
  if (phone.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text('Company WhatsApp number is not available.')),
    );
    return;
  }
  final message = _buildWhatsAppMessage(
    item: item,
    profile: profile,
    isHindi: WorkerLocalizations.of(context).isHindi,
  );
  final uri =
      Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open WhatsApp.')),
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

String _distanceLabel(
  BuildContext context,
  _LiveLocationSnapshot liveLocation,
  WorkerFeedItemModel item,
  {_DerivedJobCoordinates? resolvedCoordinates}
) {
  final l10n = WorkerLocalizations.of(context);
  final workerLat = liveLocation.latitude;
  final workerLng = liveLocation.longitude;
  final jobLat = resolvedCoordinates?.latitude ?? item.latitude;
  final jobLng = resolvedCoordinates?.longitude ?? item.longitude;
  final coordinateSource =
      resolvedCoordinates?.source.isNotEmpty == true
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
  return l10n.isHindi ? 'à¤…à¤ªà¤¨à¤¾ à¤¶à¤¹à¤° à¤œà¥‹à¤¡à¤¼à¥‡à¤‚' : 'Set your city';
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
    'active' => 'à¤µà¤°à¥à¤•à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¹à¥ˆ',
    'inactive_wallet_empty' => 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤•à¥€ à¤œà¤°à¥‚à¤°à¤¤ à¤¹à¥ˆ',
    'inactive_subscription_expired' => 'à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¦à¥‹à¤¬à¤¾à¤°à¤¾ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚',
    'blocked' => 'à¤µà¤°à¥à¤•à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¬à¥à¤²à¥‰à¤• à¤¹à¥ˆ',
    'rejected' => 'à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤…à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¹à¥ˆ',
    _ => 'à¤µà¤°à¥à¤•à¤° à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤•à¤°à¥‡à¤‚',
  };
}

String _activationDescription(
    WorkerLocalizations l10n, WorkerActivationSummaryModel activation) {
  if (!l10n.isHindi) {
    return activation.description;
  }

  return switch (activation.status) {
    'active' =>
      'à¤†à¤ªà¤•à¤¾ à¤µà¥‰à¤²à¥‡à¤Ÿ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¹à¥ˆà¥¤ à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤Ÿà¥Œà¤¤à¥€ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤­à¥€ à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤–à¥à¤²à¥€ à¤°à¤¹à¥‡à¤‚à¤—à¥€à¥¤',
    'inactive_wallet_empty' =>
      'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸ à¤•à¤® à¤¹à¥ˆà¥¤ à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤•à¤°à¤•à¥‡ à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤”à¤° à¤µà¤¿à¤œà¤¿à¤¬à¤¿à¤²à¤¿à¤Ÿà¥€ à¤«à¤¿à¤° à¤¸à¥‡ à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‡à¤‚à¥¤',
    'inactive_subscription_expired' =>
      'à¤à¤•à¥à¤¸à¥‡à¤¸ à¤…à¤µà¤§à¤¿ à¤–à¤¤à¥à¤® à¤¹à¥‹ à¤—à¤ˆ à¤¹à¥ˆà¥¤ à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤•à¤°à¤•à¥‡ à¤¦à¥‹à¤¬à¤¾à¤°à¤¾ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚à¥¤',
    'blocked' =>
      'à¤à¤¡à¤®à¤¿à¤¨ à¤¨à¥‡ à¤‡à¤¸ à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤•à¥‹ à¤°à¥‹à¤•à¤¾ à¤¹à¥ˆà¥¤ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤à¤¡à¤®à¤¿à¤¨ à¤¸à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚à¥¤',
    'rejected' =>
      'à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤•à¥‹ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤¸à¥à¤µà¥€à¤•à¤¾à¤° à¤¨à¤¹à¥€à¤‚ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤•à¤°à¥‡à¤‚à¥¤',
    _ => 'à¤¬à¥‡à¤¹à¤¤à¤° à¤®à¥ˆà¤š à¤ªà¤¾à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤…à¤ªà¤¨à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤”à¤° à¤µà¥‰à¤²à¥‡à¤Ÿ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤°à¤–à¥‡à¤‚à¥¤',
  };
}

String _walletVisibilityRule(
    WorkerLocalizations l10n, WorkerDashboardModel dashboard) {
  if (!l10n.isHindi) {
    return dashboard.wallet.visibilityRule;
  }

  if (dashboard.activation.isActive) {
    return 'à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤°à¤¹à¤¨à¥‡ à¤¤à¤• à¤†à¤ªà¤•à¥€ à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤¦à¤¿à¤–à¤¾à¤ˆ à¤¦à¥‡à¤—à¥€ à¤”à¤° à¤•à¤‚à¤ªà¤¨à¥€ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤°à¤¹à¥‡à¤‚à¤—à¥‡à¥¤';
  }

  return 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸ à¤”à¤° à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤•à¥‡ à¤†à¤§à¤¾à¤° à¤ªà¤° à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤”à¤° à¤µà¤¿à¤œà¤¿à¤¬à¤¿à¤²à¤¿à¤Ÿà¥€ à¤¨à¤¿à¤¯à¤‚à¤¤à¥à¤°à¤¿à¤¤ à¤¹à¥‹à¤¤à¥€ à¤¹à¥ˆà¥¤';
}
