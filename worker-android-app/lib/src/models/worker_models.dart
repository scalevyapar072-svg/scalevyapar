class WorkerCategoryOption {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final bool isActive;
  final bool showOnHome;
  final int homeOrder;

  WorkerCategoryOption({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.isActive,
    required this.showOnHome,
    required this.homeOrder,
  });

  factory WorkerCategoryOption.fromJson(Map<String, dynamic> json) {
    return WorkerCategoryOption(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      showOnHome: json['showOnHome'] as bool? ?? false,
      homeOrder: (json['homeOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class WorkerMasterOption {
  final String id;
  final String label;
  final String value;
  final String slug;

  WorkerMasterOption({
    required this.id,
    required this.label,
    required this.value,
    required this.slug,
  });

  factory WorkerMasterOption.fromJson(Map<String, dynamic> json) {
    return WorkerMasterOption(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      value: json['value'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
    );
  }
}

class WorkerIndustryBusinessDependency {
  final String id;
  final WorkerMasterOption industryCategory;
  final WorkerMasterOption businessType;

  WorkerIndustryBusinessDependency({
    required this.id,
    required this.industryCategory,
    required this.businessType,
  });

  factory WorkerIndustryBusinessDependency.fromJson(Map<String, dynamic> json) {
    return WorkerIndustryBusinessDependency(
      id: json['id'] as String? ?? '',
      industryCategory: WorkerMasterOption.fromJson(
          json['industryCategory'] as Map<String, dynamic>? ?? const {}),
      businessType: WorkerMasterOption.fromJson(
          json['businessType'] as Map<String, dynamic>? ?? const {}),
    );
  }
}

class WorkerCategoryDependency {
  final String id;
  final WorkerMasterOption industryCategory;
  final WorkerMasterOption? businessType;
  final String categoryId;
  final String categoryName;
  final String categorySlug;

  WorkerCategoryDependency({
    required this.id,
    required this.industryCategory,
    required this.businessType,
    required this.categoryId,
    required this.categoryName,
    required this.categorySlug,
  });

  factory WorkerCategoryDependency.fromJson(Map<String, dynamic> json) {
    return WorkerCategoryDependency(
      id: json['id'] as String? ?? '',
      industryCategory: WorkerMasterOption.fromJson(
          json['industryCategory'] as Map<String, dynamic>? ?? const {}),
      businessType: json['businessType'] == null
          ? null
          : WorkerMasterOption.fromJson(
              json['businessType'] as Map<String, dynamic>),
      categoryId: json['categoryId'] as String? ?? '',
      categoryName: json['categoryName'] as String? ?? '',
      categorySlug: json['categorySlug'] as String? ?? '',
    );
  }
}

class WorkerProfileModel {
  final String id;
  final String fullName;
  final String mobile;
  final String city;
  final String homeCity;
  final String address;
  final String profilePhotoPath;
  final List<String> categoryIds;
  final List<String> categoryLabels;
  final List<String> skills;
  final double experienceYears;
  final double expectedDailyWage;
  final String availability;
  final double walletBalance;
  final String status;
  final bool isVisible;
  final String identityProofType;
  final String identityProofNumber;
  final String identityProofPath;
  final bool isRegistrationComplete;
  final String registrationCompletedAt;
  final double? latitude;
  final double? longitude;

  WorkerProfileModel({
    required this.id,
    required this.fullName,
    required this.mobile,
    required this.city,
    required this.homeCity,
    required this.address,
    required this.profilePhotoPath,
    required this.categoryIds,
    required this.categoryLabels,
    required this.skills,
    required this.experienceYears,
    required this.expectedDailyWage,
    required this.availability,
    required this.walletBalance,
    required this.status,
    required this.isVisible,
    required this.identityProofType,
    required this.identityProofNumber,
    required this.identityProofPath,
    required this.isRegistrationComplete,
    required this.registrationCompletedAt,
    required this.latitude,
    required this.longitude,
  });

  factory WorkerProfileModel.fromJson(Map<String, dynamic> json) {
    return WorkerProfileModel(
      id: json['id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      mobile: json['mobile'] as String? ?? '',
      city: json['city'] as String? ?? '',
      homeCity: json['homeCity'] as String? ?? '',
      address: json['address'] as String? ?? '',
      profilePhotoPath: json['profilePhotoPath'] as String? ?? '',
      categoryIds: ((json['categoryIds'] as List?) ?? [])
          .map((item) => item.toString())
          .toList(),
      categoryLabels: ((json['categoryLabels'] as List?) ?? [])
          .map((item) => item.toString())
          .toList(),
      skills: ((json['skills'] as List?) ?? [])
          .map((item) => item.toString())
          .toList(),
      experienceYears: (json['experienceYears'] as num?)?.toDouble() ?? 0,
      expectedDailyWage: (json['expectedDailyWage'] as num?)?.toDouble() ?? 0,
      availability: json['availability'] as String? ?? 'available_today',
      walletBalance: (json['walletBalance'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? 'pending',
      isVisible: json['isVisible'] as bool? ?? false,
      identityProofType: json['identityProofType'] as String? ?? '',
      identityProofNumber: json['identityProofNumber'] as String? ?? '',
      identityProofPath: json['identityProofPath'] as String? ?? '',
      isRegistrationComplete: json['isRegistrationComplete'] as bool? ?? false,
      registrationCompletedAt: json['registrationCompletedAt'] as String? ?? '',
      latitude: _readCoordinate(json, const [
        'latitude',
        'lat',
        'workerLatitude',
        'currentLatitude',
        'locationLatitude',
      ]),
      longitude: _readCoordinate(json, const [
        'longitude',
        'lng',
        'workerLongitude',
        'currentLongitude',
        'locationLongitude',
      ]),
    );
  }
}

class WorkerWalletTransactionModel {
  final String id;
  final String transactionType;
  final String direction;
  final double amount;
  final String status;
  final String reference;
  final String note;
  final String createdAt;

  WorkerWalletTransactionModel({
    required this.id,
    required this.transactionType,
    required this.direction,
    required this.amount,
    required this.status,
    required this.reference,
    required this.note,
    required this.createdAt,
  });

  factory WorkerWalletTransactionModel.fromJson(Map<String, dynamic> json) {
    return WorkerWalletTransactionModel(
      id: json['id'] as String? ?? '',
      transactionType: json['transactionType'] as String? ?? '',
      direction: json['direction'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? '',
      reference: json['reference'] as String? ?? '',
      note: json['note'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class WorkerWalletSummaryModel {
  final double balance;
  final double dailyCharge;
  final double registrationFee;
  final bool registrationFeePaid;
  final int estimatedDaysRemaining;
  final String visibilityRule;
  final String? lastDeductionAt;
  final List<WorkerWalletTransactionModel> transactions;

  WorkerWalletSummaryModel({
    required this.balance,
    required this.dailyCharge,
    required this.registrationFee,
    required this.registrationFeePaid,
    required this.estimatedDaysRemaining,
    required this.visibilityRule,
    required this.lastDeductionAt,
    required this.transactions,
  });

  factory WorkerWalletSummaryModel.fromJson(Map<String, dynamic> json) {
    return WorkerWalletSummaryModel(
      balance: (json['balance'] as num?)?.toDouble() ?? 0,
      dailyCharge: (json['dailyCharge'] as num?)?.toDouble() ?? 0,
      registrationFee: (json['registrationFee'] as num?)?.toDouble() ?? 0,
      registrationFeePaid: json['registrationFeePaid'] as bool? ?? false,
      estimatedDaysRemaining: json['estimatedDaysRemaining'] as int? ?? 0,
      visibilityRule: json['visibilityRule'] as String? ?? '',
      lastDeductionAt: json['lastDeductionAt'] as String?,
      transactions: ((json['transactions'] as List?) ?? [])
          .map((item) => WorkerWalletTransactionModel.fromJson(
              item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class WorkerRazorpayOrderModel {
  final String keyId;
  final String orderId;
  final int amount;
  final String currency;
  final double rechargeAmount;
  final String workerName;
  final String mobile;

  WorkerRazorpayOrderModel({
    required this.keyId,
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.rechargeAmount,
    required this.workerName,
    required this.mobile,
  });

  factory WorkerRazorpayOrderModel.fromJson(Map<String, dynamic> json) {
    return WorkerRazorpayOrderModel(
      keyId: json['keyId'] as String? ?? '',
      orderId: json['orderId'] as String? ?? '',
      amount: (json['amount'] as num?)?.toInt() ?? 0,
      currency: json['currency'] as String? ?? 'INR',
      rechargeAmount: (json['rechargeAmount'] as num?)?.toDouble() ?? 0,
      workerName: json['workerName'] as String? ?? '',
      mobile: json['mobile'] as String? ?? '',
    );
  }
}

class WorkerActivationSummaryModel {
  final bool isActive;
  final bool canViewCompanyDetails;
  final String status;
  final String headline;
  final String description;
  final String recommendedAction;

  WorkerActivationSummaryModel({
    required this.isActive,
    required this.canViewCompanyDetails,
    required this.status,
    required this.headline,
    required this.description,
    required this.recommendedAction,
  });

  factory WorkerActivationSummaryModel.fromJson(Map<String, dynamic> json) {
    return WorkerActivationSummaryModel(
      isActive: json['isActive'] as bool? ?? false,
      canViewCompanyDetails: json['canViewCompanyDetails'] as bool? ?? false,
      status: json['status'] as String? ?? '',
      headline: json['headline'] as String? ?? '',
      description: json['description'] as String? ?? '',
      recommendedAction: json['recommendedAction'] as String? ?? '',
    );
  }
}

class WorkerFeedItemModel {
  final String id;
  final String title;
  final String description;
  final String city;
  final String categoryId;
  final String categorySlug;
  final String industryCategoryId;
  final String industryCategoryLabel;
  final String industryCategoryValue;
  final String industryCategorySlug;
  final String businessTypeId;
  final String businessTypeLabel;
  final String businessTypeValue;
  final String businessTypeSlug;
  final String locationLabel;
  final double wageAmount;
  final int workersNeeded;
  final String categoryName;
  final bool companyLocked;
  final String companyName;
  final String companyArea;
  final String companyCity;
  final String companyPincode;
  final double? companyLatitude;
  final double? companyLongitude;
  final String? contactPerson;
  final String? companyMobile;
  final String publishedAt;
  final String expiresAt;
  final String matchReason;
  final bool hasApplied;
  final String? applicationStatus;
  final bool isSaved;
  final String? appliedAt;
  final String coordinateSource;
  final double? latitude;
  final double? longitude;
  final String? shiftType;

  WorkerFeedItemModel({
    required this.id,
    required this.title,
    required this.description,
    required this.city,
    required this.categoryId,
    required this.categorySlug,
    required this.industryCategoryId,
    required this.industryCategoryLabel,
    required this.industryCategoryValue,
    required this.industryCategorySlug,
    required this.businessTypeId,
    required this.businessTypeLabel,
    required this.businessTypeValue,
    required this.businessTypeSlug,
    required this.locationLabel,
    required this.wageAmount,
    required this.workersNeeded,
    required this.categoryName,
    required this.companyLocked,
    required this.companyName,
    required this.companyArea,
    required this.companyCity,
    required this.companyPincode,
    required this.companyLatitude,
    required this.companyLongitude,
    required this.contactPerson,
    required this.companyMobile,
    required this.publishedAt,
    required this.expiresAt,
    required this.matchReason,
    required this.hasApplied,
    required this.applicationStatus,
    required this.isSaved,
    required this.appliedAt,
    required this.coordinateSource,
    required this.latitude,
    required this.longitude,
    required this.shiftType,
  });

  factory WorkerFeedItemModel.fromJson(Map<String, dynamic> json) {
    return WorkerFeedItemModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      city: json['city'] as String? ?? '',
      categoryId: json['categoryId'] as String? ?? '',
      categorySlug: json['categorySlug'] as String? ?? '',
      industryCategoryId: json['industryCategoryId'] as String? ?? '',
      industryCategoryLabel: json['industryCategoryLabel'] as String? ?? '',
      industryCategoryValue: json['industryCategoryValue'] as String? ?? '',
      industryCategorySlug: json['industryCategorySlug'] as String? ?? '',
      businessTypeId: json['businessTypeId'] as String? ?? '',
      businessTypeLabel: json['businessTypeLabel'] as String? ?? '',
      businessTypeValue: json['businessTypeValue'] as String? ?? '',
      businessTypeSlug: json['businessTypeSlug'] as String? ?? '',
      locationLabel: json['locationLabel'] as String? ?? '',
      wageAmount: (json['wageAmount'] as num?)?.toDouble() ?? 0,
      workersNeeded: json['workersNeeded'] as int? ?? 0,
      categoryName: json['categoryName'] as String? ?? '',
      companyLocked: json['companyLocked'] as bool? ?? true,
      companyName: json['companyName'] as String? ?? '',
      companyArea: json['companyArea'] as String? ?? '',
      companyCity: json['companyCity'] as String? ?? '',
      companyPincode: (json['companyPincode'] ??
              json['pincode'] ??
              json['postalCode'] ??
              json['zip']) as String? ??
          '',
      companyLatitude: _readCoordinate(json, const [
        'companyLatitude',
        'companyLat',
      ]),
      companyLongitude: _readCoordinate(json, const [
        'companyLongitude',
        'companyLng',
      ]),
      contactPerson: json['contactPerson'] as String?,
      companyMobile: json['companyMobile'] as String?,
      publishedAt: json['publishedAt'] as String? ?? '',
      expiresAt: json['expiresAt'] as String? ?? '',
      matchReason: json['matchReason'] as String? ?? '',
      hasApplied: json['hasApplied'] as bool? ?? false,
      applicationStatus: json['applicationStatus'] as String?,
      isSaved: json['isSaved'] as bool? ?? false,
      appliedAt: json['appliedAt'] as String?,
      coordinateSource: json['coordinateSource'] as String? ?? '',
      latitude: _readCoordinate(json, const [
        'latitude',
        'lat',
        'workLocationLatitude',
        'locationLatitude',
      ]),
      longitude: _readCoordinate(json, const [
        'longitude',
        'lng',
        'workLocationLongitude',
        'locationLongitude',
      ]),
      shiftType: _readSalaryType(json),
    );
  }
}

String? _readSalaryType(Map<String, dynamic> json) {
  final directValue = (json['salaryType'] ??
          json['shiftType'] ??
          json['shift'] ??
          json['workShift'])
      ?.toString()
      .trim();
  if (directValue != null && directValue.isNotEmpty) {
    return directValue;
  }

  final description = (json['description'] as String? ?? '').trim();
  if (description.isEmpty) {
    return null;
  }

  try {
    final matches = RegExp(
      r'salary\s*type\s*:\s*([a-z ]+)',
      caseSensitive: false,
    ).allMatches(description);
    if (matches.isEmpty) {
      return null;
    }
    final extracted = matches.last.group(1)?.trim().toLowerCase() ?? '';
    if (extracted.contains('daily')) {
      return 'Daily Wage';
    }
    if (extracted.contains('week')) {
      return 'Weekly Payment';
    }
    if (extracted.contains('month')) {
      return 'Monthly Salary';
    }
    if (extracted.contains('contract')) {
      return 'Contract Payment';
    }
    if (extracted.contains('piece')) {
      return 'Piece Rate';
    }
  } catch (_) {
    return null;
  }

  return null;
}

double? _readCoordinate(Map<String, dynamic> json, List<String> keys) {
  for (final key in keys) {
    final value = json[key];
    if (value is num) {
      final coordinate = value.toDouble();
      if (coordinate != 0) return coordinate;
    }
    if (value is String) {
      final coordinate = double.tryParse(value.trim());
      if (coordinate != null && coordinate != 0) return coordinate;
    }
  }
  return null;
}

class WorkerNotificationModel {
  final String id;
  final String type;
  final String title;
  final String message;
  final String? relatedJobPostId;
  final String? relatedCompanyId;
  final bool isRead;
  final String priority;
  final String createdAt;

  WorkerNotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.relatedJobPostId,
    required this.relatedCompanyId,
    required this.isRead,
    required this.priority,
    required this.createdAt,
  });

  factory WorkerNotificationModel.fromJson(Map<String, dynamic> json) {
    return WorkerNotificationModel(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      relatedJobPostId: json['relatedJobPostId'] as String?,
      relatedCompanyId: json['relatedCompanyId'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      priority: json['priority'] as String? ?? 'medium',
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class WorkerPlanModel {
  final String id;
  final String name;
  final int validityDays;
  final String? planStartDate;
  final String? planEndDate;
  final double dailyCharge;
  final double registrationFee;
  final double walletCredit;

  WorkerPlanModel({
    required this.id,
    required this.name,
    required this.validityDays,
    required this.planStartDate,
    required this.planEndDate,
    required this.dailyCharge,
    required this.registrationFee,
    required this.walletCredit,
  });

  factory WorkerPlanModel.fromJson(Map<String, dynamic> json) {
    return WorkerPlanModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      validityDays: json['validityDays'] as int? ?? 0,
      planStartDate: json['planStartDate'] as String?,
      planEndDate: json['planEndDate'] as String?,
      dailyCharge: (json['dailyCharge'] as num?)?.toDouble() ?? 0,
      registrationFee: (json['registrationFee'] as num?)?.toDouble() ?? 0,
      walletCredit: (json['walletCredit'] as num?)?.toDouble() ?? 0,
    );
  }
}

class WorkerDashboardModel {
  final WorkerProfileModel profile;
  final WorkerWalletSummaryModel wallet;
  final WorkerActivationSummaryModel activation;
  final WorkerSupportModel support;
  final List<WorkerFeedItemModel> feed;
  final List<WorkerNotificationModel> notifications;
  final int unreadNotificationCount;
  final List<WorkerCategoryOption> availableCategories;
  final List<WorkerMasterOption> availableIndustryCategories;
  final List<WorkerMasterOption> availableBusinessTypes;
  final List<WorkerIndustryBusinessDependency> industryBusinessDependencies;
  final List<WorkerCategoryDependency> categoryDependencies;
  final List<String> availableCities;
  final WorkerPlanModel? workerPlan;

  WorkerDashboardModel({
    required this.profile,
    required this.wallet,
    required this.activation,
    required this.support,
    required this.feed,
    required this.notifications,
    required this.unreadNotificationCount,
    required this.availableCategories,
    required this.availableIndustryCategories,
    required this.availableBusinessTypes,
    required this.industryBusinessDependencies,
    required this.categoryDependencies,
    required this.availableCities,
    required this.workerPlan,
  });

  factory WorkerDashboardModel.fromJson(Map<String, dynamic> json) {
    return WorkerDashboardModel(
      profile:
          WorkerProfileModel.fromJson(json['profile'] as Map<String, dynamic>),
      wallet: WorkerWalletSummaryModel.fromJson(
          json['wallet'] as Map<String, dynamic>),
      activation: WorkerActivationSummaryModel.fromJson(
          json['activation'] as Map<String, dynamic>),
      support: WorkerSupportModel.fromJson(
          (json['support'] as Map<String, dynamic>?) ?? const {}),
      feed: ((json['feed'] as List?) ?? [])
          .map((item) =>
              WorkerFeedItemModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      notifications: ((json['notifications'] as List?) ?? [])
          .map((item) =>
              WorkerNotificationModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      unreadNotificationCount: json['unreadNotificationCount'] as int? ?? 0,
      availableCategories: ((json['availableCategories'] as List?) ?? [])
          .map((item) =>
              WorkerCategoryOption.fromJson(item as Map<String, dynamic>))
          .toList(),
      availableIndustryCategories:
          ((json['availableIndustryCategories'] as List?) ?? [])
              .map((item) =>
                  WorkerMasterOption.fromJson(item as Map<String, dynamic>))
              .toList(),
      availableBusinessTypes: ((json['availableBusinessTypes'] as List?) ?? [])
          .map((item) =>
              WorkerMasterOption.fromJson(item as Map<String, dynamic>))
          .toList(),
      industryBusinessDependencies:
          ((json['industryBusinessDependencies'] as List?) ?? [])
              .map((item) => WorkerIndustryBusinessDependency.fromJson(
                  item as Map<String, dynamic>))
              .toList(),
      categoryDependencies: ((json['categoryDependencies'] as List?) ?? [])
          .map((item) =>
              WorkerCategoryDependency.fromJson(item as Map<String, dynamic>))
          .toList(),
      availableCities: ((json['availableCities'] as List?) ?? [])
          .map((item) => item.toString())
          .toList(),
      workerPlan: json['workerPlan'] == null
          ? null
          : WorkerPlanModel.fromJson(
              json['workerPlan'] as Map<String, dynamic>),
    );
  }
}

class WorkerSupportModel {
  final bool showHeaderHelpButton;
  final String title;
  final String subtitle;
  final String whatsappNumber;
  final String chatbotUrl;
  final String extraLabel;
  final String extraUrl;
  final String prefilledMessage;

  WorkerSupportModel({
    required this.showHeaderHelpButton,
    required this.title,
    required this.subtitle,
    required this.whatsappNumber,
    required this.chatbotUrl,
    required this.extraLabel,
    required this.extraUrl,
    required this.prefilledMessage,
  });

  factory WorkerSupportModel.fromJson(Map<String, dynamic> json) {
    return WorkerSupportModel(
      showHeaderHelpButton: json['showHeaderHelpButton'] as bool? ?? false,
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      whatsappNumber: json['whatsappNumber'] as String? ?? '',
      chatbotUrl: json['chatbotUrl'] as String? ?? '',
      extraLabel: json['extraLabel'] as String? ?? '',
      extraUrl: json['extraUrl'] as String? ?? '',
      prefilledMessage: json['prefilledMessage'] as String? ?? '',
    );
  }
}
