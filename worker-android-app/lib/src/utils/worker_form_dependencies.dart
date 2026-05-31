import '../models/worker_models.dart';

String normalizeWorkerDependencyKey(Object? value) {
  return value
      .toString()
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'\s+'), ' ')
      .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
      .replaceAll(RegExp(r'^_+|_+$'), '');
}

bool _matchesSelection(String selectedValue, Iterable<Object?> candidates) {
  final normalizedSelected = normalizeWorkerDependencyKey(selectedValue);
  if (normalizedSelected.isEmpty) {
    return false;
  }
  for (final candidate in candidates) {
    if (normalizeWorkerDependencyKey(candidate) == normalizedSelected) {
      return true;
    }
  }
  return false;
}

bool _matchesMasterOption(
    WorkerMasterOptionModel option, String selectedValue) {
  return _matchesSelection(selectedValue, [
    option.id,
    option.label,
    option.value,
    option.slug,
  ]);
}

bool _matchesCategoryOption(WorkerCategoryOption option, String selectedValue) {
  return _matchesSelection(selectedValue, [option.id, option.name]);
}

String _firstNonEmptyText(Iterable<Object?> values) {
  for (final value in values) {
    final trimmed = value?.toString().trim() ?? '';
    if (trimmed.isNotEmpty) {
      return trimmed;
    }
  }
  return '';
}

bool _isActiveMasterOption(WorkerMasterOptionModel option) => option.isActive;

bool _isActiveCategoryOption(WorkerCategoryOption option) => option.isActive;

bool _hasMasterOptionContent(WorkerMasterOptionModel option) {
  return option.id.trim().isNotEmpty ||
      option.label.trim().isNotEmpty ||
      option.value.trim().isNotEmpty ||
      option.slug.trim().isNotEmpty;
}

bool _hasCategoryContent(WorkerCategoryOption option) {
  return option.id.trim().isNotEmpty || option.name.trim().isNotEmpty;
}

bool _isActiveIndustryBusinessDependency(
  WorkerIndustryBusinessDependencyModel dependency,
) {
  return dependency.isActive &&
      dependency.industryCategory.isActive &&
      dependency.businessType.isActive;
}

bool _isActiveCategoryDependency(WorkerCategoryDependencyModel dependency) {
  final businessType = dependency.businessType;
  return dependency.isActive &&
      dependency.industryCategory.isActive &&
      (businessType == null || businessType.isActive);
}

WorkerMasterOptionModel? _masterOptionFromFeed({
  Object? id,
  Object? label,
  Object? value,
  Object? slug,
}) {
  final resolvedLabel = _firstNonEmptyText([label, value, slug, id]);
  final resolvedId = _firstNonEmptyText([id, value, slug, label]);
  final resolvedValue = _firstNonEmptyText([value, label, slug, id]);
  final resolvedSlug = _firstNonEmptyText([slug, value, label, id]);
  final normalizedKey = normalizeWorkerDependencyKey(
    _firstNonEmptyText(
        [resolvedId, resolvedValue, resolvedSlug, resolvedLabel]),
  );

  if (normalizedKey.isEmpty || resolvedLabel.isEmpty) {
    return null;
  }

  return WorkerMasterOptionModel(
    id: resolvedId.isNotEmpty ? resolvedId : normalizedKey,
    label: resolvedLabel,
    value: resolvedValue.isNotEmpty ? resolvedValue : resolvedLabel,
    slug: resolvedSlug.isNotEmpty ? resolvedSlug : normalizedKey,
    isActive: true,
  );
}

void _addMasterOption(
  Map<String, WorkerMasterOptionModel> lookup,
  WorkerMasterOptionModel? option,
) {
  if (option == null || !_hasMasterOptionContent(option)) {
    return;
  }

  final key = normalizeWorkerDependencyKey(
    _firstNonEmptyText([option.id, option.value, option.slug, option.label]),
  );
  if (key.isEmpty || lookup.containsKey(key)) {
    return;
  }
  lookup[key] = option;
}

Map<String, WorkerCategoryOption> _categoryOptionLookup(
  WorkerDashboardModel dashboard,
) {
  final lookup = <String, WorkerCategoryOption>{};
  for (final option in dashboard.availableCategories) {
    if (!_isActiveCategoryOption(option) || !_hasCategoryContent(option)) {
      continue;
    }
    for (final key in {
      normalizeWorkerDependencyKey(option.id),
      normalizeWorkerDependencyKey(option.name),
    }) {
      if (key.isNotEmpty) {
        lookup.putIfAbsent(key, () => option);
      }
    }
  }
  return lookup;
}

List<WorkerMasterOptionModel> activeIndustryOptions(
  WorkerDashboardModel dashboard,
) {
  final lookup = <String, WorkerMasterOptionModel>{};

  for (final option in dashboard.availableIndustryCategories) {
    if (_isActiveMasterOption(option)) {
      _addMasterOption(lookup, option);
    }
  }
  for (final dependency in dashboard.industryBusinessDependencies) {
    if (_isActiveIndustryBusinessDependency(dependency)) {
      _addMasterOption(lookup, dependency.industryCategory);
    }
  }
  for (final dependency in dashboard.categoryDependencies) {
    if (_isActiveCategoryDependency(dependency)) {
      _addMasterOption(lookup, dependency.industryCategory);
    }
  }

  if (lookup.isEmpty) {
    for (final item in dashboard.feed) {
      _addMasterOption(
        lookup,
        _masterOptionFromFeed(
          id: item.industryCategoryId,
          label: item.industryCategoryLabel,
          value: item.industryCategoryValue,
          slug: item.industryCategorySlug,
        ),
      );
    }
  }

  final options = lookup.values.toList()
    ..sort((left, right) => left.label.compareTo(right.label));
  return options;
}

List<WorkerMasterOptionModel> activeBusinessTypeOptions(
  WorkerDashboardModel dashboard, {
  required String selectedIndustryCategory,
}) {
  if (selectedIndustryCategory.trim().isEmpty) {
    return const <WorkerMasterOptionModel>[];
  }

  final lookup = <String, WorkerMasterOptionModel>{};
  for (final dependency in dashboard.industryBusinessDependencies) {
    if (!_isActiveIndustryBusinessDependency(dependency) ||
        !_matchesSelection(selectedIndustryCategory, [
          dependency.industryCategory.id,
          dependency.industryCategory.label,
          dependency.industryCategory.value,
          dependency.industryCategory.slug,
        ])) {
      continue;
    }
    _addMasterOption(lookup, dependency.businessType);
  }

  for (final dependency in dashboard.categoryDependencies) {
    final businessType = dependency.businessType;
    if (!_isActiveCategoryDependency(dependency) ||
        businessType == null ||
        !_matchesSelection(selectedIndustryCategory, [
          dependency.industryCategory.id,
          dependency.industryCategory.label,
          dependency.industryCategory.value,
          dependency.industryCategory.slug,
        ])) {
      continue;
    }
    _addMasterOption(lookup, businessType);
  }

  if (lookup.isEmpty) {
    for (final item in dashboard.feed) {
      if (!_matchesSelection(selectedIndustryCategory, [
        item.industryCategoryId,
        item.industryCategoryLabel,
        item.industryCategoryValue,
        item.industryCategorySlug,
      ])) {
        continue;
      }
      _addMasterOption(
        lookup,
        _masterOptionFromFeed(
          id: item.businessTypeId,
          label: item.businessTypeLabel,
          value: item.businessTypeValue,
          slug: item.businessTypeSlug,
        ),
      );
    }
  }

  final options = lookup.values.toList()
    ..sort((left, right) => left.label.compareTo(right.label));
  return options;
}

List<WorkerCategoryOption> activeJobCategoryOptions(
  WorkerDashboardModel dashboard, {
  required String selectedIndustryCategory,
  required String selectedBusinessType,
}) {
  if (selectedIndustryCategory.trim().isEmpty ||
      selectedBusinessType.trim().isEmpty) {
    return const <WorkerCategoryOption>[];
  }

  final categoryLookup = _categoryOptionLookup(dashboard);
  final byKey = <String, WorkerCategoryOption>{};

  for (final dependency in dashboard.categoryDependencies) {
    if (!_isActiveCategoryDependency(dependency) ||
        dependency.categoryName.trim().isEmpty ||
        !_matchesSelection(selectedIndustryCategory, [
          dependency.industryCategory.id,
          dependency.industryCategory.label,
          dependency.industryCategory.value,
          dependency.industryCategory.slug,
        ])) {
      continue;
    }

    final businessType = dependency.businessType;
    if (businessType != null &&
        !_matchesSelection(selectedBusinessType, [
          businessType.id,
          businessType.label,
          businessType.value,
          businessType.slug,
        ])) {
      continue;
    }

    final lookupKey = normalizeWorkerDependencyKey(
      _firstNonEmptyText([
        dependency.categoryId,
        dependency.categorySlug,
        dependency.categoryName,
      ]),
    );
    if (lookupKey.isEmpty || byKey.containsKey(lookupKey)) {
      continue;
    }

    byKey[lookupKey] = categoryLookup[
            normalizeWorkerDependencyKey(dependency.categoryId)] ??
        categoryLookup[normalizeWorkerDependencyKey(dependency.categorySlug)] ??
        categoryLookup[normalizeWorkerDependencyKey(dependency.categoryName)] ??
        WorkerCategoryOption(
          id: dependency.categoryId,
          name: dependency.categoryName,
          description: '',
          imageUrl: '',
          showOnHome: false,
          homeOrder: 0,
          isActive: true,
        );
  }

  for (final item in dashboard.feed) {
    if (!_matchesSelection(selectedIndustryCategory, [
          item.industryCategoryId,
          item.industryCategoryLabel,
          item.industryCategoryValue,
          item.industryCategorySlug,
        ]) ||
        !_matchesSelection(selectedBusinessType, [
          item.businessTypeId,
          item.businessTypeLabel,
          item.businessTypeValue,
          item.businessTypeSlug,
        ])) {
      continue;
    }
    final lookupKey = normalizeWorkerDependencyKey(
      _firstNonEmptyText(
          [item.categoryId, item.categorySlug, item.categoryName]),
    );
    if (lookupKey.isEmpty || byKey.containsKey(lookupKey)) {
      continue;
    }
    byKey[lookupKey] =
        categoryLookup[normalizeWorkerDependencyKey(item.categoryId)] ??
            categoryLookup[normalizeWorkerDependencyKey(item.categorySlug)] ??
            categoryLookup[normalizeWorkerDependencyKey(item.categoryName)] ??
            WorkerCategoryOption(
              id: item.categoryId,
              name: item.categoryName,
              description: '',
              imageUrl: '',
              showOnHome: false,
              homeOrder: 0,
              isActive: true,
            );
  }

  final options = byKey.values.toList()
    ..sort((left, right) => left.name.compareTo(right.name));
  return options;
}

List<String> activeCityOptions(WorkerDashboardModel dashboard) {
  final labels = <String, String>{};

  void addCity(String value) {
    final trimmed = value.trim();
    final key = normalizeWorkerDependencyKey(trimmed);
    if (trimmed.isEmpty || key.isEmpty || labels.containsKey(key)) {
      return;
    }
    labels[key] = trimmed;
  }

  if (dashboard.availableCities.isNotEmpty) {
    for (final city in dashboard.availableCities) {
      addCity(city);
    }
  } else {
    for (final item in dashboard.feed) {
      addCity(item.city);
      addCity(item.companyCity);
    }
  }

  final options = labels.values.toList()
    ..sort((left, right) => left.compareTo(right));
  return options;
}

String inferSelectedIndustryCategory(
  WorkerDashboardModel dashboard,
  List<String> categoryIds,
) {
  for (final categoryId in categoryIds) {
    final trimmed = categoryId.trim();
    if (trimmed.isEmpty) {
      continue;
    }
    for (final dependency in dashboard.categoryDependencies) {
      if (_isActiveCategoryDependency(dependency) &&
          _matchesSelection(trimmed, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ])) {
        return _firstNonEmptyText([
          dependency.industryCategory.id,
          dependency.industryCategory.value,
          dependency.industryCategory.slug,
          dependency.industryCategory.label,
        ]);
      }
    }
  }
  return '';
}

String inferSelectedBusinessType(
  WorkerDashboardModel dashboard,
  List<String> categoryIds,
) {
  for (final categoryId in categoryIds) {
    final trimmed = categoryId.trim();
    if (trimmed.isEmpty) {
      continue;
    }
    for (final dependency in dashboard.categoryDependencies) {
      final businessType = dependency.businessType;
      if (businessType != null &&
          _isActiveCategoryDependency(dependency) &&
          _matchesSelection(trimmed, [
            dependency.categoryId,
            dependency.categorySlug,
            dependency.categoryName,
          ])) {
        return _firstNonEmptyText([
          businessType.id,
          businessType.value,
          businessType.slug,
          businessType.label,
        ]);
      }
    }
  }
  return '';
}

String inferSelectedJobCategoryId(List<String> categoryIds) {
  for (final categoryId in categoryIds) {
    final trimmed = categoryId.trim();
    if (trimmed.isNotEmpty) {
      return trimmed;
    }
  }
  return '';
}

String normalizeSelectedIndustryCategory(
  String currentValue,
  List<WorkerMasterOptionModel> options,
) {
  for (final option in options) {
    if (_matchesMasterOption(option, currentValue)) {
      return _firstNonEmptyText(
          [option.id, option.value, option.slug, option.label]);
    }
  }
  return '';
}

String normalizeSelectedBusinessType(
  String currentValue,
  List<WorkerMasterOptionModel> options,
) {
  for (final option in options) {
    if (_matchesMasterOption(option, currentValue)) {
      return _firstNonEmptyText(
          [option.id, option.value, option.slug, option.label]);
    }
  }
  return '';
}

String normalizeSelectedJobCategory(
  String currentValue,
  List<WorkerCategoryOption> options,
) {
  for (final option in options) {
    if (_matchesCategoryOption(option, currentValue)) {
      return option.id;
    }
  }
  return '';
}
