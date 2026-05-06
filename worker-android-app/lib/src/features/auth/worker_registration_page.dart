import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../localization/worker_localizations.dart';
import '../../models/worker_models.dart';
import '../../services/worker_api_service.dart';
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
  late final TextEditingController _fullNameController;
  late final TextEditingController _cityController;
  late final TextEditingController _skillsController;
  late final TextEditingController _experienceController;
  late final TextEditingController _wageController;
  late final TextEditingController _identityProofNumberController;

  late List<String> _selectedCategories;
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
    _cityController = TextEditingController(text: profile.city);
    _skillsController = TextEditingController(text: profile.skills.join(', '));
    _experienceController = TextEditingController(
      text: profile.experienceYears == 0 ? '' : profile.experienceYears.toStringAsFixed(0),
    );
    _wageController = TextEditingController(
      text: profile.expectedDailyWage == 0 ? '' : profile.expectedDailyWage.toStringAsFixed(0),
    );
    _identityProofNumberController = TextEditingController(text: profile.identityProofNumber);
    _selectedCategories = [...profile.categoryIds];
    _availability = profile.availability;
    _identityProofType = profile.identityProofType.isEmpty ? 'aadhaar' : profile.identityProofType;
    _profilePhotoPath = profile.profilePhotoPath;
    _identityProofPath = profile.identityProofPath;
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _cityController.dispose();
    _skillsController.dispose();
    _experienceController.dispose();
    _wageController.dispose();
    _identityProofNumberController.dispose();
    super.dispose();
  }

  bool get _isHindi => WorkerLocalizations.of(context).isHindi;

  String _t(String hindi, String english) => _isHindi ? hindi : english;

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
      setState(() => _error = _t('फ़ाइल पथ नहीं मिला। फिर से चुनें।', 'Selected file path is missing. Please choose again.'));
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
      if (mounted) {
        setState(() {
          _uploadingPhoto = false;
          _uploadingProof = false;
        });
      }
    }
  }

  Future<void> _submit() async {
    if (_fullNameController.text.trim().isEmpty) {
      setState(() => _error = _t('पूरा नाम जरूरी है।', 'Full name is required.'));
      return;
    }
    if (_cityController.text.trim().isEmpty) {
      setState(() => _error = _t('शहर जरूरी है।', 'City is required.'));
      return;
    }
    if (_selectedCategories.isEmpty) {
      setState(() => _error = _t('कम से कम एक कैटेगरी चुनें।', 'Select at least one category.'));
      return;
    }
    if (_profilePhotoPath.isEmpty) {
      setState(() => _error = _t('प्रोफाइल फोटो अपलोड करें।', 'Upload a profile photo.'));
      return;
    }
    if (_identityProofNumberController.text.trim().isEmpty) {
      setState(() => _error = _t('आईडी प्रूफ नंबर जरूरी है।', 'Identity proof number is required.'));
      return;
    }
    if (_identityProofPath.isEmpty) {
      setState(() => _error = _t('आईडी प्रूफ दस्तावेज़ अपलोड करें।', 'Upload the identity proof document.'));
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
        profilePhotoPath: _profilePhotoPath,
        identityProofType: _identityProofType,
        identityProofNumber: _identityProofNumberController.text.trim(),
        identityProofPath: _identityProofPath,
      );

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
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = widget.dashboard.availableCategories;

    return Scaffold(
      appBar: AppBar(
        title: Text(_t('नया वर्कर अकाउंट', 'New worker account')),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _t('रजिस्ट्रेशन पूरा करें', 'Complete your registration'),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _t(
                      'काम शुरू करने से पहले फोटो, पहचान प्रमाण और बेसिक प्रोफाइल डिटेल्स जमा करें।',
                      'Before you start receiving work, submit your photo, identity proof, and basic profile details.',
                    ),
                    style: const TextStyle(color: Color(0xFF64748B), height: 1.5),
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
                  TextField(
                    controller: _cityController,
                    decoration: InputDecoration(
                      labelText: _t('शहर', 'City'),
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
                            labelText: _t('अनुभव (वर्ष)', 'Experience (years)'),
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
                            labelText: _t('दैनिक मजदूरी अपेक्षा', 'Expected daily wage'),
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
                      labelText: _t('स्किल्स', 'Skills'),
                      hintText: _t('जैसे: सिलाई, फिनिशिंग, वायरिंग', 'For example: stitching, finishing, wiring'),
                      prefixIcon: const Icon(Icons.build_circle_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(_t('कैटेगरी चुनें', 'Choose categories'), style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: categories.map((category) {
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
                      DropdownMenuItem(value: 'available_today', child: Text(_t('आज उपलब्ध', 'Available today'))),
                      DropdownMenuItem(value: 'available_this_week', child: Text(_t('इस सप्ताह उपलब्ध', 'Available this week'))),
                      DropdownMenuItem(value: 'not_available', child: Text(_t('अभी उपलब्ध नहीं', 'Not available'))),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _availability = value);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: _t('उपलब्धता', 'Availability'),
                      prefixIcon: const Icon(Icons.event_available_rounded),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _UploadCard(
                    title: _t('प्रोफाइल फोटो', 'Profile photo'),
                    subtitle: _t('स्पष्ट चेहरा वाली फोटो अपलोड करें', 'Upload a clear photo of yourself'),
                    buttonLabel: _uploadingPhoto
                        ? _t('अपलोड हो रहा है...', 'Uploading...')
                        : _t('फोटो चुनें', 'Choose photo'),
                    statusLabel: _profilePhotoPath.isEmpty
                        ? ''
                        : _t('फोटो अपलोड हो गई', 'Photo uploaded'),
                    onTap: _uploadingPhoto || _submitting
                        ? null
                        : () => _pickAndUpload(documentKind: 'profile_photo', imageOnly: true),
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
                      DropdownMenuItem(value: 'aadhaar', child: Text(_t('आधार कार्ड', 'Aadhaar Card'))),
                      DropdownMenuItem(value: 'pan', child: Text(_t('पैन कार्ड', 'PAN Card'))),
                      DropdownMenuItem(value: 'voter_id', child: Text(_t('वोटर आईडी', 'Voter ID'))),
                      DropdownMenuItem(value: 'driving_license', child: Text(_t('ड्राइविंग लाइसेंस', 'Driving License'))),
                      DropdownMenuItem(value: 'other', child: Text(_t('अन्य', 'Other'))),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _identityProofType = value);
                      }
                    },
                    decoration: InputDecoration(
                      labelText: _t('पहचान प्रमाण प्रकार', 'Identity proof type'),
                      prefixIcon: const Icon(Icons.badge_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _identityProofNumberController,
                    decoration: InputDecoration(
                      labelText: _t('पहचान प्रमाण नंबर', 'Identity proof number'),
                      prefixIcon: const Icon(Icons.confirmation_number_outlined),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _UploadCard(
                    title: _t('पहचान प्रमाण दस्तावेज़', 'Identity proof document'),
                    subtitle: _t('PDF या फोटो फॉर्मेट अपलोड करें', 'Upload a PDF or image document'),
                    buttonLabel: _uploadingProof
                        ? _t('अपलोड हो रहा है...', 'Uploading...')
                        : _t('दस्तावेज़ चुनें', 'Choose document'),
                    statusLabel: _identityProofPath.isEmpty
                        ? ''
                        : _t('दस्तावेज़ अपलोड हो गया', 'Document uploaded'),
                    onTap: _uploadingProof || _submitting
                        ? null
                        : () => _pickAndUpload(documentKind: 'identity_proof', imageOnly: false),
                    preview: _identityProofLocalPath.isEmpty
                        ? null
                        : Text(
                            _identityProofLocalPath.split(Platform.pathSeparator).last,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                  ),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
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
                      onPressed: _submitting || _uploadingPhoto || _uploadingProof ? null : _submit,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Text(
                          _submitting
                              ? _t('सबमिट हो रहा है...', 'Submitting...')
                              : _t('रजिस्ट्रेशन पूरा करें', 'Complete registration'),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: Color(0xFF64748B), height: 1.4)),
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
              label: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(buttonLabel),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
