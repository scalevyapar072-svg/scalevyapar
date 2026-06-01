class WorkerAppConfig {
  final String backendVersion;
  final String latestAppVersion;
  final String minimumAppVersion;
  final String apiBaseUrl;
  final bool razorpayEnabled;
  final String appPackage;

  const WorkerAppConfig({
    required this.backendVersion,
    required this.latestAppVersion,
    required this.minimumAppVersion,
    required this.apiBaseUrl,
    required this.razorpayEnabled,
    required this.appPackage,
  });

  factory WorkerAppConfig.fromJson(Map<String, dynamic> json) {
    return WorkerAppConfig(
      backendVersion: json['backendVersion'] as String? ?? '',
      latestAppVersion: json['latestAppVersion'] as String? ?? '',
      minimumAppVersion: json['minimumAppVersion'] as String? ?? '',
      apiBaseUrl: json['apiBaseUrl'] as String? ?? '',
      razorpayEnabled: json['razorpayEnabled'] as bool? ?? false,
      appPackage: json['appPackage'] as String? ?? '',
    );
  }
}
