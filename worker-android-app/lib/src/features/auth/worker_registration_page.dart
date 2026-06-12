import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../localization/worker_localizations.dart';
import '../../models/worker_models.dart';
import '../../services/session_store.dart';
import '../../services/worker_api_service.dart';
import 'otp_login_page.dart';
import '../home/worker_home_page.dart';

class WorkerRegistrationPage extends StatefulWidget {
  final String token;
  final WorkerDashboardModel dashboard;

  const WorkerRegistrationPage({
    super.key,
    required this.token,
    required this.dashboard,
  });

  @override
  State<WorkerRegistrationPage> createState() => _WorkerRegistrationPageState();
}

class _WorkerRegistrationPageState extends State<WorkerRegistrationPage> {
  final _apiService = WorkerApiService();
  final _sessionStore = SessionStore();

  late final TextEditingController _fullNameController;
  late final TextEditingController _addressController;
  late final TextEditingController _skillsController;
  late final TextEditingController _experienceController;
  late final TextEditingController _wageController;
  late final TextEditingController _identityProofNumberController;

  late String _jobSearchCity;
  late String _homeCity;
  late String _salaryType;
  late String _selectedIndustryId;
  late String _selectedBusinessTypeId;
  late String _selectedCategoryId;
  late String _availability;
  late String _identityProofType;

  String _profilePhotoPath = '';
  String _identityProofPath = '';
  String _profilePhotoLocalPath = '';
  String _identityProofLocalPath = '';
  bool _uploadingPhoto = false;
  bool _uploadingProof = false;
  bool _submitting = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    final profile = widget.dashboard.profile;
    _fullNameController = TextEditingController(text: profile.fullName);
    _addressController = TextEditingController(text: profile.address);
    _skillsController = TextEditingController(text: profile.skills.join(', '));
    _experienceController = TextEditingController(
      text: profile.experienceYears == 0
          ? ''
          : profile.experienceYears.toStringAsFixed(0),
    );
    _wageController = TextEditingController(
      text: profile.expectedDailyWage == 0
          ? ''
          : profile.expectedDailyWage.toStringAsFixed(0),
    );
    _identityProofNumberController =
        TextEditingController(text: profile.identityProofNumber);
    _availability = profile.availability;
    _identityProofType =
        profile.identityProofType.isEmpty ? 'aadhaar' : profile.identityProofType;
    _profilePhotoPath = profile.profilePhotoPath;
    _identityProofPath = profile.identityProofPath;
    _jobSearchCity = _resolveInitialCity(profile.city);
    _homeCity = _resolveInitialCity(
      profile.homeCity.isEmpty ? profile.city : profile.homeCity,
    );
    _salaryType = profile.salaryType.trim().isEmpty
        ? 'Daily Wage'
        : profile.salaryType.trim();
    _hydrateCategorySelection(profile.categoryIds);
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _addressController.dispose();
    _skillsController.dispose();
    _experienceController.dispose();
    _wageController.dispose();
    _identityProofNumberController.dispose();
    super.dispose();
  }

  bool get _isHindi => WorkerLocalizations.of(context).isHindi;

  String _t(String hindi, String english) => _isHindi ? hindi : english;

  List<String> get _availableCities {
    final items = <String>{
      if (widget.dashboard.profile.city.trim().isNotEmpty)
        widget.dashboard.profile.city.trim(),
      if (widget.dashboard.profile.homeCity.trim().isNotEmpty)
        widget.dashboard.profile.homeCity.trim(),
      ...widget.dashboard.availableCities
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty),
    };
    final list = items.toList()..sort();
    return list;
  }

  String _resolveInitialCity(String rawValue) {
    final current = rawValue.trim();
    if (current.isNotEmpty) return current;
    if (_availableCities.isNotEmpty) return _availableCities.first;
    return '';
  }

  String _optionLabel(WorkerMasterOption option) {
    if (option.label.trim().isNotEmpty) return option.label.trim();
    if (option.value.trim().isNotEmpty) return option.value.trim();
    return option.slug.trim();
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

  List<WorkerMasterOption> get _industryOptions {
    final byId = <String, WorkerMasterOption>{};
    for (final dependency in widget.dashboard.industryBusinessDependencies) {
      byId[dependency.industryCategory.id] = dependency.industryCategory;
    }
    for (final dependency in widget.dashboard.categoryDependencies) {
      byId[dependency.industryCategory.id] = dependency.industryCategory;
    }
    final items = byId.values.toList()
      ..sort((a, b) => _optionLabel(a).compareTo(_optionLabel(b)));
    return items;
  }

  List<WorkerMasterOption> _businessOptionsFor(String industryId) {
    final byId = <String, WorkerMasterOption>{};
    for (final dependency in widget.dashboard.industryBusinessDependencies) {
      if (dependency.industryCategory.id == industryId) {
        byId[dependency.businessType.id] = dependency.businessType;
      }
    }
    for (final dependency in widget.dashboard.categoryDependencies) {
      if (dependency.industryCategory.id == industryId &&
          dependency.businessType != null) {
        byId[dependency.businessType!.id] = dependency.businessType!;
      }
    }
    final items = byId.values.toList()
      ..sort((a, b) => _optionLabel(a).compareTo(_optionLabel(b)));
    return items;
  }

  List<WorkerCategoryDependency> _categoryOptionsFor(
    String industryId,
    String businessTypeId,
  ) {
    final byId = <String, WorkerCategoryDependency>{};
    final exactMatches = widget.dashboard.categoryDependencies.where(
      (dependency) =>
          dependency.industryCategory.id == industryId &&
          (businessTypeId.isEmpty ||
              dependency.businessType?.id == businessTypeId),
    );
    final fallbackMatches = widget.dashboard.categoryDependencies.where(
      (dependency) => dependency.industryCategory.id == industryId,
    );

    final source = exactMatches.isNotEmpty ? exactMatches : fallbackMatches;
    for (final dependency in source) {
      byId[dependency.categoryId] = dependency;
    }

    final items = byId.values.toList()
      ..sort((a, b) => a.categoryName.compareTo(b.categoryName));
    return items;
  }

  void _hydrateCategorySelection(List<String> categoryIds) {
    final selectedCategoryId = categoryIds
        .map((item) => item.trim())
        .firstWhere((item) => item.isNotEmpty, orElse: () => '');

    WorkerCategoryDependency? matchedDependency;
    for (final dependency in widget.dashboard.categoryDependencies) {
      if (dependency.categoryId == selectedCategoryId) {
        matchedDependency = dependency;
        break;
      }
    }
    matchedDependency ??= widget.dashboard.categoryDependencies.isNotEmpty
        ? widget.dashboard.categoryDependencies.first
        : null;

    _selectedIndustryId = matchedDependency?.industryCategory.id ??
        (_industryOptions.isNotEmpty ? _industryOptions.first.id : '');
    _selectedBusinessTypeId = matchedDependency?.businessType?.id ??
        (_businessOptionsFor(_selectedIndustryId).isNotEmpty
            ? _businessOptionsFor(_selectedIndustryId).first.id
            : '');
    _selectedCategoryId = matchedDependency?.categoryId ??
        (_categoryOptionsFor(_selectedIndustryId, _selectedBusinessTypeId)
                .isNotEmpty
            ? _categoryOptionsFor(
                    _selectedIndustryId, _selectedBusinessTypeId)
                .first
                .categoryId
            : '');
    _syncCategorySelection();
  }

  void _syncCategorySelection() {
    final businesses = _businessOptionsFor(_selectedIndustryId);
    if (businesses.isEmpty) {
      _selectedBusinessTypeId = '';
    } else if (!businesses.any((item) => item.id == _selectedBusinessTypeId)) {
      _selectedBusinessTypeId = businesses.first.id;
    }

    final categories =
        _categoryOptionsFor(_selectedIndustryId, _selectedBusinessTypeId);
    if (categories.isEmpty) {
      _selectedCategoryId = '';
    } else if (!categories.any((item) => item.categoryId == _selectedCategoryId)) {
      _selectedCategoryId = categories.first.categoryId;
    }
  }

  Future<void> _resetToLogin() async {
    await _sessionStore.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const OtpLoginPage()),
      (route) => false,
    );
  }

  Future<void> _pickAndUpload({
    required String documentKind,
    required bool imageOnly,
  }) async {
    setState(() => _error = '');

    final result = await FilePicker.platform.pickFiles(
      type: imageOnly ? FileType.image : FileType.custom,
      allowMultiple: false,
      withData: false,
      allowedExtensions: imageOnly ? null : ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    );

    if (result == null || result.files.isEmpty) {
      return;
    }

    final picked = result.files.single;
    if (picked.path == null || picked.path!.isEmpty) {
      setState(() {
        _error = _t(
          'फ़ाइल पाथ नहीं मिला। फिर से चुनें।',
          'Selected file path is missing. Please choose again.',
        );
      });
      return;
    }

    setState(() {
      if (documentKind == 'profile_photo') {
        _uploadingPhoto = true;
      } else {
        _uploadingProof = true;
      }
    });

    try {
      final storagePath = await _apiService.uploadWorkerDocument(
        widget.token,
        documentKind: documentKind,
        filePath: picked.path!,
        fileName: picked.name,
      );

      if (!mounted) return;
      setState(() {
        if (documentKind == 'profile_photo') {
          _profilePhotoPath = storagePath;
          _profilePhotoLocalPath = picked.path!;
        } else {
          _identityProofPath = storagePath;
          _identityProofLocalPath = picked.path!;
        }
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (!mounted) return;
      setState(() {
        _uploadingPhoto = false;
        _uploadingProof = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_fullNameController.text.trim().isEmpty) {
      setState(() => _error = _t('पूरा नाम जरूरी है।', 'Full name is required.'));
      return;
    }
    if (_jobSearchCity.trim().isEmpty) {
      setState(() => _error = _t('जॉब सर्च सिटी जरूरी है।', 'Job search city is required.'));
      return;
    }
    if (_homeCity.trim().isEmpty) {
      setState(() => _error = _t('होम सिटी जरूरी है।', 'Home city is required.'));
      return;
    }
    if (_addressController.text.trim().isEmpty) {
      setState(() => _error = _t('पता जरूरी है।', 'Address is required.'));
      return;
    }
    if (_selectedCategoryId.isEmpty) {
      setState(() => _error = _t('जॉब कैटेगरी चुनें।', 'Select a job category.'));
      return;
    }
    if (_profilePhotoPath.isEmpty) {
      setState(() => _error = _t('प्रोफाइल फोटो अपलोड करें।', 'Upload a profile photo.'));
      return;
    }
    if (_identityProofNumberController.text.trim().isEmpty) {
      setState(() {
        _error = _t(
          'आईडी प्रूफ नंबर जरूरी है।',
          'Identity proof number is required.',
        );
      });
      return;
    }
    if (_identityProofPath.isEmpty) {
      setState(() {
        _error = _t(
          'आईडी प्रूफ दस्तावेज़ अपलोड करें।',
          'Upload the identity proof document.',
        );
      });
      return;
    }

    setState(() {
      _submitting = true;
      _error = '';
    });

    try {
      final dashboard = await _apiService.completeRegistration(
        widget.token,
        fullName: _fullNameController.text.trim(),
        city: _jobSearchCity.trim(),
        homeCity: _homeCity.trim(),
        address: _addressController.text.trim(),
        salaryType: _salaryType.trim().isEmpty ? 'Daily Wage' : _salaryType.trim(),
        categoryIds: [_selectedCategoryId],
        skills: _skillsController.text
            .split(',')
            .map((item) => item.trim())
            .where((item) => item.isNotEmpty)
            .toList(),
        experienceYears: double.tryParse(_experienceController.text.trim()) ?? 0,
        expectedDailyWage: double.tryParse(_wageController.text.trim()) ?? 0,
        availability: _availability,
        profilePhotoPath: _profilePhotoPath,
        identityProofType: _identityProofType,
        identityProofNumber: _identityProofNumberController.text.trim(),
        identityProofPath: _identityProofPath,
      );

      await _sessionStore.clearPendingToken();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => WorkerHomePage(
            initialToken: widget.token,
            initialDashboard: dashboard,
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (!mounted) return;
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final industries = _industryOptions;
    final businesses = _businessOptionsFor(_selectedIndustryId);
    final categories =
        _categoryOptionsFor(_selectedIndustryId, _selectedBusinessTypeId);
    final salaryTypeOptions = _workerSalaryTypeOptions;

    final selectedIndustryValue = industries.any(
      (item) => item.id == _selectedIndustryId,
    )
        ? _selectedIndustryId
        : null;
    final selectedBusinessValue = businesses.any(
      (item) => item.id == _selectedBusinessTypeId,
    )
        ? _selectedBusinessTypeId
        : null;
    final selectedCategoryValue = categories.any(
      (item) => item.categoryId == _selectedCategoryId,
    )
        ? _selectedCategoryId
        : null;
    final selectedSalaryTypeValue = salaryTypeOptions.any(
      (item) => item.value == _salaryType,
    )
        ? _salaryType
        : null;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        title: Text(_t('नया वर्कर अकाउंट', 'New worker account')),
        actions: [
          PopupMenuButton<_RegistrationExitAction>(
            onSelected: (_) => _resetToLogin(),
            itemBuilder: (context) => [
              PopupMenuItem(
                value: _RegistrationExitAction.changeNumber,
                child: Text(_t('नंबर बदलें', 'Change number')),
              ),
              PopupMenuItem(
                value: _RegistrationExitAction.logout,
                child: Text(_t('लॉग आउट', 'Log out')),
              ),
            ],
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.logout_rounded, color: Color(0xFF0F172A)),
                  const SizedBox(width: 6),
                  Text(
                    _t('लॉग आउट', 'Log out'),
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0F0F172A),
                  blurRadius: 20,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _t('रजिस्ट्रेशन पूरा करें', 'Complete your registration'),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _t(
                      'काम शुरू करने से पहले फोटो, पहचान प्रमाण और बेसिक प्रोफाइल डिटेल्स जमा करें।',
                      'Before you start receiving work, submit your photo, identity proof, and basic profile details.',
                    ),
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 18),
                  TextField(
                    controller: _fullNameController,
                    decoration: InputDecoration(
                      labelText: _t('पूरा नाम', 'Full Name'),
                      prefixIcon: const Icon(Icons.person_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _jobSearchCity.isEmpty ? null : _jobSearchCity,
                    items: _availableCities
                        .map(
                          (city) => DropdownMenuItem(
                            value: city,
                            child: Text(city),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _jobSearchCity = value);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: _t('जॉब सर्च सिटी', 'Job Search City'),
                      prefixIcon: const Icon(Icons.location_city_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _homeCity.isEmpty ? null : _homeCity,
                    items: _availableCities
                        .map(
                          (city) => DropdownMenuItem(
                            value: city,
                            child: Text(city),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _homeCity = value);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: _t('होम सिटी', 'Home City'),
                      prefixIcon: const Icon(Icons.home_work_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _addressController,
                    minLines: 2,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: _t('पता', 'Address'),
                      prefixIcon: const Icon(Icons.home_outlined),
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
                            labelText: _t('अनुभव (वर्ष)', 'Experience (years)'),
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
                            labelText: WorkerLocalizations.of(context)
                                .expectedSalaryWage,
                            prefixIcon:
                                const Icon(Icons.currency_rupee_rounded),
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
                              WorkerLocalizations.of(context)
                                  .workerSalaryTypeLabel(_optionLabel(item)),
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
                      labelText: WorkerLocalizations.of(context).salaryType,
                      prefixIcon: const Icon(Icons.payments_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _skillsController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: _t('स्किल्स', 'Skills'),
                      hintText: _t(
                        'जैसे: सिलाई, फिनिशिंग, वायरिंग',
                        'For example: stitching, finishing, wiring',
                      ),
                      prefixIcon: const Icon(Icons.build_circle_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedIndustryValue,
                    items: industries
                        .map(
                          (item) => DropdownMenuItem(
                            value: item.id,
                            child: Text(_optionLabel(item)),
                          ),
                        )
                        .toList(),
                    onChanged: industries.isEmpty
                        ? null
                        : (value) {
                            if (value != null) {
                              setState(() {
                                _selectedIndustryId = value;
                                _syncCategorySelection();
                              });
                            }
                          },
                    decoration: InputDecoration(
                      labelText: _t('इंडस्ट्री कैटेगरी', 'Industry Category'),
                      prefixIcon: const Icon(Icons.apartment_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedBusinessValue,
                    items: businesses
                        .map(
                          (item) => DropdownMenuItem(
                            value: item.id,
                            child: Text(_optionLabel(item)),
                          ),
                        )
                        .toList(),
                    onChanged: businesses.isEmpty
                        ? null
                        : (value) {
                            if (value != null) {
                              setState(() {
                                _selectedBusinessTypeId = value;
                                _syncCategorySelection();
                              });
                            }
                          },
                    decoration: InputDecoration(
                      labelText: _t('बिज़नेस टाइप', 'Business Type'),
                      prefixIcon:
                          const Icon(Icons.business_center_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedCategoryValue,
                    items: categories
                        .map(
                          (item) => DropdownMenuItem(
                            value: item.categoryId,
                            child: Text(item.categoryName),
                          ),
                        )
                        .toList(),
                    onChanged: categories.isEmpty
                        ? null
                        : (value) {
                            if (value != null) {
                              setState(() => _selectedCategoryId = value);
                            }
                          },
                    decoration: InputDecoration(
                      labelText: _t('जॉब कैटेगरी', 'Job Category'),
                      prefixIcon: const Icon(Icons.category_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _availability,
                    items: [
                      DropdownMenuItem(
                        value: 'available_today',
                        child: Text(_t('आज उपलब्ध', 'Available today')),
                      ),
                      DropdownMenuItem(
                        value: 'available_this_week',
                        child: Text(_t('इस सप्ताह उपलब्ध', 'Available this week')),
                      ),
                      DropdownMenuItem(
                        value: 'not_available',
                        child: Text(_t('अभी उपलब्ध नहीं', 'Not available')),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _availability = value);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: _t('उपलब्धता', 'Availability'),
                      prefixIcon:
                          const Icon(Icons.event_available_rounded),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _UploadCard(
                    title: _t('प्रोफाइल फोटो', 'Profile photo'),
                    subtitle: _t(
                      'स्पष्ट चेहरा वाली फोटो अपलोड करें',
                      'Upload a clear photo of yourself',
                    ),
                    buttonLabel: _uploadingPhoto
                        ? _t('अपलोड हो रहा है...', 'Uploading...')
                        : _t('फोटो चुनें', 'Choose photo'),
                    statusLabel: _profilePhotoPath.isEmpty
                        ? ''
                        : _t('फोटो अपलोड हो गई', 'Photo uploaded'),
                    onTap: _uploadingPhoto || _submitting
                        ? null
                        : () => _pickAndUpload(
                              documentKind: 'profile_photo',
                              imageOnly: true,
                            ),
                    preview: _profilePhotoLocalPath.isEmpty
                        ? null
                        : ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.file(
                              File(_profilePhotoLocalPath),
                              height: 132,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                          ),
                  ),
                  const SizedBox(height: 18),
                  DropdownButtonFormField<String>(
                    value: _identityProofType,
                    items: [
                      DropdownMenuItem(
                        value: 'aadhaar',
                        child: Text(_t('आधार कार्ड', 'Aadhaar Card')),
                      ),
                      DropdownMenuItem(
                        value: 'pan',
                        child: Text(_t('पैन कार्ड', 'PAN Card')),
                      ),
                      DropdownMenuItem(
                        value: 'voter_id',
                        child: Text(_t('वोटर आईडी', 'Voter ID')),
                      ),
                      DropdownMenuItem(
                        value: 'driving_license',
                        child: Text(_t('ड्राइविंग लाइसेंस', 'Driving License')),
                      ),
                      DropdownMenuItem(
                        value: 'other',
                        child: Text(_t('अन्य', 'Other')),
                      ),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _identityProofType = value);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: _t(
                        'पहचान प्रमाण प्रकार',
                        'Identity proof type',
                      ),
                      prefixIcon: const Icon(Icons.badge_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _identityProofNumberController,
                    decoration: InputDecoration(
                      labelText:
                          _t('पहचान प्रमाण नंबर', 'Identity proof number'),
                      prefixIcon:
                          const Icon(Icons.confirmation_number_outlined),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _UploadCard(
                    title: _t(
                      'पहचान प्रमाण दस्तावेज़',
                      'Identity proof document',
                    ),
                    subtitle: _t(
                      'PDF या फोटो फॉर्मेट अपलोड करें',
                      'Upload a PDF or image document',
                    ),
                    buttonLabel: _uploadingProof
                        ? _t('अपलोड हो रहा है...', 'Uploading...')
                        : _t('दस्तावेज़ चुनें', 'Choose document'),
                    statusLabel: _identityProofPath.isEmpty
                        ? ''
                        : _t('दस्तावेज़ अपलोड हो गया', 'Document uploaded'),
                    onTap: _uploadingProof || _submitting
                        ? null
                        : () => _pickAndUpload(
                              documentKind: 'identity_proof',
                              imageOnly: false,
                            ),
                    preview: _identityProofLocalPath.isEmpty
                        ? null
                        : Text(
                            _identityProofLocalPath
                                .split(Platform.pathSeparator)
                                .last,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                  ),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: const Color(0xFFFEF2F2),
                        border: Border.all(color: const Color(0xFFFECACA)),
                      ),
                      child: Text(
                        _error,
                        style: const TextStyle(
                          color: Color(0xFFB91C1C),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _submitting || _uploadingPhoto || _uploadingProof
                          ? null
                          : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF173C77),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: Text(
                        _submitting
                            ? _t('सबमिट हो रहा है...', 'Submitting...')
                            : _t(
                                'रजिस्ट्रेशन पूरा करें',
                                'Complete registration',
                              ),
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
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

class _UploadCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String buttonLabel;
  final String statusLabel;
  final VoidCallback? onTap;
  final Widget? preview;

  const _UploadCard({
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.statusLabel,
    required this.onTap,
    required this.preview,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: const TextStyle(color: Color(0xFF64748B), height: 1.45),
          ),
          if (preview != null) ...[
            const SizedBox(height: 12),
            preview!,
          ],
          if (statusLabel.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              statusLabel,
              style: const TextStyle(
                color: Color(0xFF166534),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onTap,
              icon: const Icon(Icons.upload_file_rounded),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF0F172A),
                side: const BorderSide(color: Color(0xFFD7E2EE)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              label: Text(
                buttonLabel,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum _RegistrationExitAction {
  changeNumber,
  logout,
}
