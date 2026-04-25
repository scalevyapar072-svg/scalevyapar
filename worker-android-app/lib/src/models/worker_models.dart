class WorkerCategoryOption {
  final String id;
  final String name;

  WorkerCategoryOption({
    required this.id,
    required this.name,
  });

  factory WorkerCategoryOption.fromJson(Map<String, dynamic> json) {
    return WorkerCategoryOption(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
    );
  }
}

class WorkerProfileModel {
  final String id;
  final String fullName;
  final String mobile;
  final String city;
  final List<String> categoryIds;
  final List<String> categoryLabels;
  final List<String> skills;
  final double experienceYears;
  final double expectedDailyWage;
  final String availability;
  final double walletBalance;
  final String status;
  final bool isVisible;

  WorkerProfileModel({
    required this.id,
    required this.fullName,
    required this.mobile,
    required this.city,
    required this.categoryIds,
    required this.categoryLabels,
    required this.skills,
    required this.experienceYears,
    required this.expectedDailyWage,
    required this.availability,
    required this.walletBalance,
    required this.status,
    required this.isVisible,
  });

  factory WorkerProfileModel.fromJson(Map<String, dynamic> json) {
    return WorkerProfileModel(
      id: json['id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      mobile: json['mobile'] as String? ?? '',
      city: json['city'] as String? ?? '',
      categoryIds: ((json['categoryIds'] as List?) ?? []).map((item) => item.toString()).toList(),
      categoryLabels: ((json['categoryLabels'] as List?) ?? []).map((item) => item.toString()).toList(),
      skills: ((json['skills'] as List?) ?? []).map((item) => item.toString()).toList(),
      experienceYears: (json['experienceYears'] as num?)?.toDouble() ?? 0,
      expectedDailyWage: (json['expectedDailyWage'] as num?)?.toDouble() ?? 0,
      availability: json['availability'] as String? ?? 'available_today',
      walletBalance: (json['walletBalance'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? 'pending',
      isVisible: json['isVisible'] as bool? ?? false,
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
  final int estimatedDaysRemaining;
  final String visibilityRule;
  final String? lastDeductionAt;
  final List<WorkerWalletTransactionModel> transactions;

  WorkerWalletSummaryModel({
    required this.balance,
    required this.dailyCharge,
    required this.estimatedDaysRemaining,
    required this.visibilityRule,
    required this.lastDeductionAt,
    required this.transactions,
  });

  factory WorkerWalletSummaryModel.fromJson(Map<String, dynamic> json) {
    return WorkerWalletSummaryModel(
      balance: (json['balance'] as num?)?.toDouble() ?? 0,
      dailyCharge: (json['dailyCharge'] as num?)?.toDouble() ?? 0,
      estimatedDaysRemaining: json['estimatedDaysRemaining'] as int? ?? 0,
      visibilityRule: json['visibilityRule'] as String? ?? '',
      lastDeductionAt: json['lastDeductionAt'] as String?,
      transactions: ((json['transactions'] as List?) ?? [])
          .map((item) => WorkerWalletTransactionModel.fromJson(item as Map<String, dynamic>))
          .toList(),
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
  final double wageAmount;
  final int workersNeeded;
  final String categoryName;
  final bool companyLocked;
  final String companyName;
  final String companyCity;
  final String? contactPerson;
  final String? companyMobile;
  final String publishedAt;
  final String expiresAt;
  final String matchReason;

  WorkerFeedItemModel({
    required this.id,
    required this.title,
    required this.description,
    required this.city,
    required this.wageAmount,
    required this.workersNeeded,
    required this.categoryName,
    required this.companyLocked,
    required this.companyName,
    required this.companyCity,
    required this.contactPerson,
    required this.companyMobile,
    required this.publishedAt,
    required this.expiresAt,
    required this.matchReason,
  });

  factory WorkerFeedItemModel.fromJson(Map<String, dynamic> json) {
    return WorkerFeedItemModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      city: json['city'] as String? ?? '',
      wageAmount: (json['wageAmount'] as num?)?.toDouble() ?? 0,
      workersNeeded: json['workersNeeded'] as int? ?? 0,
      categoryName: json['categoryName'] as String? ?? '',
      companyLocked: json['companyLocked'] as bool? ?? true,
      companyName: json['companyName'] as String? ?? '',
      companyCity: json['companyCity'] as String? ?? '',
      contactPerson: json['contactPerson'] as String?,
      companyMobile: json['companyMobile'] as String?,
      publishedAt: json['publishedAt'] as String? ?? '',
      expiresAt: json['expiresAt'] as String? ?? '',
      matchReason: json['matchReason'] as String? ?? '',
    );
  }
}

class WorkerPlanModel {
  final String id;
  final String name;
  final int validityDays;
  final double dailyCharge;
  final double registrationFee;
  final double walletCredit;

  WorkerPlanModel({
    required this.id,
    required this.name,
    required this.validityDays,
    required this.dailyCharge,
    required this.registrationFee,
    required this.walletCredit,
  });

  factory WorkerPlanModel.fromJson(Map<String, dynamic> json) {
    return WorkerPlanModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      validityDays: json['validityDays'] as int? ?? 0,
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
  final List<WorkerFeedItemModel> feed;
  final List<WorkerCategoryOption> availableCategories;
  final WorkerPlanModel? workerPlan;

  WorkerDashboardModel({
    required this.profile,
    required this.wallet,
    required this.activation,
    required this.feed,
    required this.availableCategories,
    required this.workerPlan,
  });

  factory WorkerDashboardModel.fromJson(Map<String, dynamic> json) {
    return WorkerDashboardModel(
      profile: WorkerProfileModel.fromJson(json['profile'] as Map<String, dynamic>),
      wallet: WorkerWalletSummaryModel.fromJson(json['wallet'] as Map<String, dynamic>),
      activation: WorkerActivationSummaryModel.fromJson(json['activation'] as Map<String, dynamic>),
      feed: ((json['feed'] as List?) ?? [])
          .map((item) => WorkerFeedItemModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      availableCategories: ((json['availableCategories'] as List?) ?? [])
          .map((item) => WorkerCategoryOption.fromJson(item as Map<String, dynamic>))
          .toList(),
      workerPlan: json['workerPlan'] == null
          ? null
          : WorkerPlanModel.fromJson(json['workerPlan'] as Map<String, dynamic>),
    );
  }
}
