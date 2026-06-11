import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

class WorkerLocalizations {
  final Locale locale;

  const WorkerLocalizations(this.locale);

  static const supportedLocales = [
    Locale('hi'),
    Locale('en'),
  ];

  static const delegate = _WorkerLocalizationsDelegate();

  static WorkerLocalizations of(BuildContext context) {
    final localizations =
        Localizations.of<WorkerLocalizations>(context, WorkerLocalizations);
    return localizations ?? const WorkerLocalizations(Locale('hi'));
  }

  bool get isHindi => locale.languageCode.toLowerCase().startsWith('hi');

  String get appTitle => isHindi ? 'à¤¸à¥à¤•à¥‡à¤²à¤µà¥à¤¯à¤¾à¤ªà¤¾à¤° à¤°à¥‹à¤œà¤—à¤¾à¤°' : 'ScaleVyapar Rozgar';
  String get switchLanguage => isHindi ? 'EN' : 'à¤¹à¤¿à¤‚';
  String get welcomePrefix => isHindi ? 'à¤¨à¤®à¤¸à¥à¤¤à¥‡' : 'Welcome';
  String welcomeUser(String name) =>
      isHindi ? 'à¤¨à¤®à¤¸à¥à¤¤à¥‡, $name' : 'Welcome, $name';

  String get bootstrapSubtitle => isHindi
      ? 'à¤°à¥‹à¤œà¤—à¤¾à¤° à¤•à¥‡ à¤®à¥Œà¤•à¥‡, à¤µà¥‰à¤²à¥‡à¤Ÿ à¤µà¤¿à¤œà¤¿à¤¬à¤¿à¤²à¤¿à¤Ÿà¥€ à¤”à¤° à¤à¤•à¥à¤Ÿà¤¿à¤µà¥‡à¤¶à¤¨ à¤¸à¥à¤Ÿà¥‡à¤Ÿà¤¸ à¤…à¤¬ à¤à¤• à¤¹à¥€ à¤à¤ª à¤®à¥‡à¤‚à¥¤'
      : 'Daily work opportunities, wallet visibility, and activation status in one app.';

  String get loginHeroTitle =>
      isHindi ? 'à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤¾à¤® à¤œà¤²à¥à¤¦à¥€ à¤–à¥‹à¤œà¥‡à¤‚à¥¤' : 'Find daily work faster.';
  String get loginHeroSubtitle => isHindi
      ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤¸à¥‡ à¤²à¥‰à¤—à¤¿à¤¨ à¤•à¤°à¥‡à¤‚, à¤…à¤ªà¤¨à¤¾ à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤² à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤°à¤–à¥‡à¤‚, à¤”à¤° à¤µà¥‰à¤²à¥‡à¤Ÿ à¤¸à¥à¤Ÿà¥‡à¤Ÿà¤¸ à¤•à¥‡ à¤†à¤§à¤¾à¤° à¤ªà¤° à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤'
      : 'Login with OTP, keep your profile active, and unlock company details based on your wallet status.';
  String get otpMobileLogin =>
      isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤²à¥‰à¤—à¤¿à¤¨' : 'OTP mobile login';
  String get dailyWalletTracking =>
      isHindi ? 'à¤¦à¥ˆà¤¨à¤¿à¤• à¤µà¥‰à¤²à¥‡à¤Ÿ à¤Ÿà¥à¤°à¥ˆà¤•à¤¿à¤‚à¤—' : 'Daily wallet tracking';
  String get matchingJobFeed =>
      isHindi ? 'à¤®à¤¿à¤²à¤¤à¥€-à¤œà¥à¤²à¤¤à¥€ à¤œà¥‰à¤¬ à¤«à¥€à¤¡' : 'Matching job feed';
  String get verifyYourOtp =>
      isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤•à¤°à¥‡à¤‚' : 'Verify your OTP';
  String get workerLogin => isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤²à¥‰à¤—à¤¿à¤¨' : 'Worker login';
  String get otpSentDescription => isHindi
      ? 'à¤†à¤ªà¤•à¥‡ à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤° à¤ªà¤° à¤•à¥‹à¤¡ à¤­à¥‡à¤œ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤'
      : 'We have sent a code to your mobile number.';
  String get enterMobileDescription => isHindi
      ? 'à¤²à¥‰à¤—à¤¿à¤¨ à¤“à¤Ÿà¥€à¤ªà¥€ à¤ªà¤¾à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤…à¤ªà¤¨à¤¾ à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤° à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚à¥¤'
      : 'Enter your mobile number to receive the login OTP.';
  String get mobile => isHindi ? 'à¤®à¥‹à¤¬à¤¾à¤‡à¤²' : 'Mobile';
  String get otp => isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€' : 'OTP';
  String get mobileNumber => isHindi ? 'à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤°' : 'Mobile Number';
  String get enterTenDigitMobile => isHindi
      ? '10 à¤…à¤‚à¤•à¥‹à¤‚ à¤•à¤¾ à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤° à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚'
      : 'Enter 10-digit mobile number';
  String get otpCode => isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤•à¥‹à¤¡' : 'OTP Code';
  String get enterOtp => isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚' : 'Enter OTP';
  String demoOtpForTesting(String otp) => isHindi
      ? 'à¤Ÿà¥‡à¤¸à¥à¤Ÿà¤¿à¤‚à¤— à¤•à¥‡ à¤²à¤¿à¤ à¤¡à¥‡à¤®à¥‹ à¤“à¤Ÿà¥€à¤ªà¥€: $otp'
      : 'Demo OTP for testing: $otp';
  String get requestingOtp =>
      isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤­à¥‡à¤œà¤¾ à¤œà¤¾ à¤°à¤¹à¤¾ à¤¹à¥ˆ...' : 'Requesting OTP...';
  String get requestOtp => isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤•à¤°à¥‡à¤‚' : 'Request OTP';
  String get verifying => isHindi ? 'à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆ...' : 'Verifying...';
  String get verifyOtp => isHindi ? 'à¤“à¤Ÿà¥€à¤ªà¥€ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤•à¤°à¥‡à¤‚' : 'Verify OTP';
  String get demoSeededWorkers =>
      isHindi ? 'à¤¡à¥‡à¤®à¥‹ à¤µà¤°à¥à¤•à¤° à¤¨à¤‚à¤¬à¤°' : 'Demo seeded worker numbers';
  String get activeWorkerLine =>
      isHindi ? '9876543210 (à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤µà¤°à¥à¤•à¤°)' : '9876543210 (active worker)';
  String get walletEmptyWorkerLine => isHindi
      ? '9812345678 (à¤µà¥‰à¤²à¥‡à¤Ÿ à¤–à¤¾à¤²à¥€ à¤µà¤°à¥à¤•à¤°)'
      : '9812345678 (wallet empty worker)';

  String get invalidMobileNumberError => isHindi
      ? 'à¤¸à¤¹à¥€ 10 à¤…à¤‚à¤•à¥‹à¤‚ à¤•à¤¾ à¤®à¥‹à¤¬à¤¾à¤‡à¤² à¤¨à¤‚à¤¬à¤° à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚à¥¤'
      : 'Enter a valid 10-digit mobile number.';
  String get invalidOtpError =>
      isHindi ? '6 à¤…à¤‚à¤•à¥‹à¤‚ à¤•à¤¾ à¤“à¤Ÿà¥€à¤ªà¥€ à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚à¥¤' : 'Enter the 6-digit OTP code.';
  String get loadingDashboard =>
      isHindi ? 'à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤²à¥‹à¤¡ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆ...' : 'Loading dashboard...';
  String get tryAgain => isHindi ? 'à¤«à¤¿à¤° à¤ªà¥à¤°à¤¯à¤¾à¤¸ à¤•à¤°à¥‡à¤‚' : 'Try Again';

  String get wallet => isHindi ? 'à¤µà¥‰à¤²à¥‡à¤Ÿ' : 'Wallet';
  String get jobs => isHindi ? 'à¤œà¥‰à¤¬à¥à¤¸' : 'Jobs';
  String get wage => isHindi ? 'à¤¦à¤¿à¤¹à¤¾à¤¡à¤¼à¥€' : 'Wage';
  String get dailyDeduction => isHindi ? 'à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤Ÿà¥Œà¤¤à¥€' : 'Daily deduction';
  String get estimatedDaysLeft =>
      isHindi ? 'à¤…à¤¨à¥à¤®à¤¾à¤¨à¤¿à¤¤ à¤¬à¤šà¥‡ à¤¦à¤¿à¤¨' : 'Estimated days left';
  String unlockedJobsCount(int count) =>
      isHindi ? '$count à¤…à¤¨à¤²à¥‰à¤•à¥à¤¡' : '$count unlocked';

  String get matchingJobFeedTitle =>
      isHindi ? 'à¤®à¤¿à¤²à¤¤à¥€-à¤œà¥à¤²à¤¤à¥€ à¤œà¥‰à¤¬ à¤«à¥€à¤¡' : 'Matching job feed';
  String get matchingJobFeedSubtitle => isHindi
      ? 'à¤œà¥‰à¤¬à¥à¤¸ à¤†à¤ªà¤•à¥‡ à¤¶à¤¹à¤°, à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€ à¤”à¤° à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤µà¤°à¥à¤•à¤° à¤¸à¥à¤Ÿà¥‡à¤Ÿà¤¸ à¤•à¥‡ à¤†à¤§à¤¾à¤° à¤ªà¤° à¤¦à¤¿à¤–à¤¾à¤ˆ à¤œà¤¾à¤¤à¥€ à¤¹à¥ˆà¤‚à¥¤'
      : 'Jobs are matched using your city, categories, and active worker status.';
  String get searchJobs => isHindi ? 'à¤œà¥‰à¤¬ à¤–à¥‹à¤œà¥‡à¤‚' : 'Search jobs';
  String get searchJobsHint => isHindi
      ? 'à¤Ÿà¤¾à¤‡à¤Ÿà¤², à¤¶à¤¹à¤° à¤¯à¤¾ à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€ à¤¸à¥‡ à¤–à¥‹à¤œà¥‡à¤‚'
      : 'Search by title, city, or category';
  String get searchForSkills => isHindi ? 'à¤¸à¥à¤•à¤¿à¤²à¥à¤¸ à¤–à¥‹à¤œà¥‡à¤‚' : 'Search for Skills';
  String get searchJobType => isHindi ? 'à¤œà¥‰à¤¬ à¤Ÿà¤¾à¤‡à¤ª à¤–à¥‹à¤œà¥‡à¤‚' : 'Search Job Type';
  String get selectJobTypeYouWant => isHindi
      ? 'à¤†à¤ª à¤œà¥‹ à¤œà¥‰à¤¬ à¤Ÿà¤¾à¤‡à¤ª à¤šà¤¾à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚ à¤‰à¤¸à¥‡ à¤šà¥à¤¨à¥‡à¤‚'
      : 'Select the Job Type you want';
  String get selectedJobTypes =>
      isHindi ? 'à¤šà¥à¤¨à¥‡ à¤¹à¥à¤ à¤œà¥‰à¤¬ à¤Ÿà¤¾à¤‡à¤ª' : 'Selected job types';
  String get applyFilters => isHindi ? 'à¤²à¤¾à¤—à¥‚ à¤•à¤°à¥‡à¤‚' : 'Apply';
  String get backAction => isHindi ? 'à¤µà¤¾à¤ªà¤¸' : 'Back';
  String get noJobTypesFound =>
      isHindi ? 'à¤•à¥‹à¤ˆ à¤œà¥‰à¤¬ à¤Ÿà¤¾à¤‡à¤ª à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¤¾à¥¤' : 'No job types found.';
  String get showUnlockedCompanyDetails => isHindi
      ? 'à¤¸à¤¿à¤°à¥à¤« à¤…à¤¨à¤²à¥‰à¤• à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤¦à¤¿à¤–à¤¾à¤à¤‚'
      : 'Show only unlocked company details';
  String get unlockedCompanyDetailsSubtitle => isHindi
      ? 'à¤œà¤¬ à¤†à¤ªà¤•à¤¾ à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¹à¥‹ à¤”à¤° à¤†à¤ªà¤•à¥‹ à¤¸à¥€à¤§à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤šà¤¾à¤¹à¤¿à¤ à¤¤à¤¬ à¤‰à¤ªà¤¯à¥‹à¤—à¥€à¥¤'
      : 'Useful when your account is active and you want direct contacts.';
  String get noJobsMatchMessage => isHindi
      ? 'à¤®à¥Œà¤œà¥‚à¤¦à¤¾ à¤«à¤¿à¤²à¥à¤Ÿà¤° à¤¸à¥‡ à¤•à¥‹à¤ˆ à¤œà¥‰à¤¬ à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¥€à¥¤ à¤–à¥‹à¤œ à¤¸à¤¾à¤«à¤¼ à¤•à¤°à¥‡à¤‚ à¤¯à¤¾ à¤…à¤ªà¤¨à¤¾ à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤² à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤°à¤–à¥‡à¤‚à¥¤'
      : 'No jobs match the current filters. Try clearing your search or keeping your worker profile active.';
  String workersNeeded(int count) =>
      isHindi ? '$count à¤µà¤°à¥à¤•à¤° à¤šà¤¾à¤¹à¤¿à¤' : '$count workers needed';
  String get saved => isHindi ? 'à¤¸à¥‡à¤µà¥à¤¡' : 'Saved';
  String appliedStatusLabel(String status) => isHindi
      ? 'à¤…à¤ªà¥à¤²à¤¾à¤ˆ à¤•à¤¿à¤¯à¤¾ â€¢ ${prettyValue(status)}'
      : 'Applied â€¢ ${prettyValue(status)}';
  String get appliedWithoutStatus => isHindi ? 'à¤…à¤ªà¥à¤²à¤¾à¤ˆ à¤•à¤¿à¤¯à¤¾' : 'Applied';
  String get working => isHindi ? 'à¤ªà¥à¤°à¤•à¥à¤°à¤¿à¤¯à¤¾ à¤œà¤¾à¤°à¥€ à¤¹à¥ˆ...' : 'Working...';
  String get applicationSent =>
      isHindi ? 'à¤†à¤µà¥‡à¤¦à¤¨ à¤­à¥‡à¤œ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾' : 'Application sent';
  String get applyToJob => isHindi ? 'à¤œà¥‰à¤¬ à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¥‡à¤¦à¤¨ à¤•à¤°à¥‡à¤‚' : 'Apply to job';
  String get favouriteCitiesJobsHeading => isHindi
      ? 'à¤†à¤ªà¤•à¥‡ à¤ªà¤¸à¤‚à¤¦à¥€à¤¦à¤¾ à¤¶à¤¹à¤°à¥‹à¤‚ à¤®à¥‡à¤‚ à¤¨à¥Œà¤•à¤°à¤¿à¤¯à¤¾à¤‚'
      : 'Jobs in your favourite cities';
  String get popularJobCategoriesHeading =>
      isHindi ? 'à¤²à¥‹à¤•à¤ªà¥à¤°à¤¿à¤¯ à¤¨à¥Œà¤•à¤°à¥€ à¤¶à¥à¤°à¥‡à¤£à¤¿à¤¯à¤¾à¤‚' : 'Popular job categories';
  String get viewMoreJobs =>
      isHindi ? 'à¤”à¤° à¤¨à¥Œà¤•à¤°à¤¿à¤¯à¤¾à¤‚ à¤¦à¥‡à¤–à¥‡à¤‚' : 'View More Jobs';
  String get showMore => isHindi ? 'à¤”à¤° à¤¦à¥‡à¤–à¥‡à¤‚' : 'Show more';
  String get showLess => isHindi ? 'à¤•à¤® à¤¦à¤¿à¤–à¤¾à¤à¤‚' : 'Show less';
  String get removeFromShortlist =>
      isHindi ? 'à¤¶à¥‰à¤°à¥à¤Ÿà¤²à¤¿à¤¸à¥à¤Ÿ à¤¸à¥‡ à¤¹à¤Ÿà¤¾à¤à¤‚' : 'Remove from shortlist';
  String get saveJob => isHindi ? 'à¤œà¥‰à¤¬ à¤¸à¥‡à¤µ à¤•à¤°à¥‡à¤‚' : 'Save job';
  String get companyLockedMessage => isHindi
      ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤²à¥‰à¤• à¤¹à¥ˆà¤‚à¥¤ à¤¸à¥€à¤§à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤–à¥‹à¤²à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤µà¤°à¥à¤•à¤° à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤°à¤–à¥‡à¤‚à¥¤'
      : 'Company details are locked. Recharge and keep the worker account active to unlock direct company contact.';
  String contactPerson(String name) =>
      isHindi ? 'à¤¸à¤‚à¤ªà¤°à¥à¤• à¤µà¥à¤¯à¤•à¥à¤¤à¤¿: $name' : 'Contact person: $name';
  String companyMobile(String mobile) =>
      isHindi ? 'à¤®à¥‹à¤¬à¤¾à¤‡à¤²: $mobile' : 'Mobile: $mobile';
  String companyCity(String city) =>
      isHindi ? 'à¤•à¤‚à¤ªà¤¨à¥€ à¤¶à¤¹à¤°: $city' : 'Company city: $city';

  String get allJobs => isHindi ? 'à¤¸à¤­à¥€ à¤¨à¥Œà¤•à¤°à¤¿à¤¯à¤¾à¤‚' : 'All Jobs';
  String get jobsNearYou => isHindi ? 'à¤¨à¤œà¤¦à¥€à¤•à¥€ à¤¨à¥Œà¤•à¤°à¤¿à¤¯à¤¾à¤‚' : 'Jobs Near You';
  String get otherCities => isHindi ? 'à¤…à¤¨à¥à¤¯ à¤¶à¤¹à¤°' : 'Other Cities';
  String get advancedFilters => isHindi ? 'à¤à¤¡à¤µà¤¾à¤‚à¤¸ à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤°' : 'Advanced filters';
  String get clearAction => isHindi ? 'à¤¸à¤¾à¤«à¤¼ à¤•à¤°à¥‡à¤‚' : 'Clear';
  String get clearAll => isHindi ? 'à¤¸à¤­à¥€ à¤¸à¤¾à¤«à¤¼ à¤•à¤°à¥‡à¤‚' : 'Clear all';
  String get activeFiltersTitle => isHindi ? 'à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤°' : 'Active filters';
  String jobsAvailableForSelectedFilters(int count) => isHindi
      ? 'à¤šà¥à¤¨à¥‡ à¤¹à¥à¤ à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤° à¤•à¥‡ à¤²à¤¿à¤ $count à¤œà¥‰à¤¬ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¹à¥ˆà¤‚'
      : '$count jobs available for selected filters';
  String get industryCategory => isHindi ? 'à¤‡à¤‚à¤¡à¤¸à¥à¤Ÿà¥à¤°à¥€ à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€' : 'Industry Category';
  String get allIndustryCategories =>
      isHindi ? 'à¤¸à¤­à¥€ à¤‰à¤¦à¥à¤¯à¥‹à¤—' : 'All Industry';
  String get businessType => isHindi ? 'à¤¬à¤¿à¤œà¤¼à¤¨à¥‡à¤¸ à¤Ÿà¤¾à¤‡à¤ª' : 'Business Type';
  String get allBusinessTypes =>
      isHindi ? 'à¤¸à¤­à¥€ à¤¬à¤¿à¤œà¤¨à¥‡à¤¸ à¤ªà¥à¤°à¤•à¤¾à¤° à¤šà¥à¤¨à¥‡à¤‚' : 'Select all business type';
  String get selectIndustryFirst =>
      isHindi ? 'à¤¸à¤­à¥€ à¤¬à¤¿à¤œà¤¨à¥‡à¤¸ à¤ªà¥à¤°à¤•à¤¾à¤° à¤šà¥à¤¨à¥‡à¤‚' : 'Select all business type';
  String get category => isHindi ? 'à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€' : 'Category';
  String get allCategories => isHindi ? 'à¤¸à¤­à¥€ à¤¶à¥à¤°à¥‡à¤£à¤¿à¤¯à¤¾à¤‚' : 'All Category';
  String get cityFilter => isHindi ? 'à¤¶à¤¹à¤° à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤°' : 'City Filter';
  String get allCities => isHindi ? 'à¤¸à¤­à¥€ à¤¶à¤¹à¤°' : 'All Cities';
  String get wageFilter => isHindi ? 'à¤µà¥‡à¤¤à¤¨ à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤°' : 'Wage filter';
  String get allWages => isHindi ? 'à¤¸à¤­à¥€ à¤®à¤œà¤¦à¥‚à¤°à¥€' : 'All Wages';
  String get savedOnly => isHindi ? 'à¤¸à¤¿à¤°à¥à¤«à¤¼ à¤¸à¥‡à¤µà¥à¤¡' : 'Saved only';
  String get appliedOnly => isHindi ? 'à¤¸à¤¿à¤°à¥à¤«à¤¼ à¤…à¤ªà¥à¤²à¤¾à¤‡à¤¡' : 'Applied only';
  String get unlockedOnly => isHindi ? 'à¤¸à¤¿à¤°à¥à¤«à¤¼ à¤…à¤¨à¤²à¥‰à¤•' : 'Unlocked only';
  String filterLabel(String label, String value) =>
      isHindi ? '$label: $value' : '$label: $value';
  String get noJobsMatchCurrentFilters => isHindi
      ? 'à¤®à¥Œà¤œà¥‚à¤¦à¤¾ à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤° à¤¸à¥‡ à¤•à¥‹à¤ˆ à¤œà¥‰à¤¬ à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¥€à¥¤ à¤«à¤¼à¤¿à¤²à¥à¤Ÿà¤° à¤¸à¤¾à¤«à¤¼ à¤•à¤°à¥‡à¤‚, à¤¦à¥‚à¤¸à¤°à¤¾ à¤¶à¤¹à¤° à¤šà¥à¤¨à¥‡à¤‚, à¤¯à¤¾ à¤¦à¥‚à¤°à¥€ à¤¬à¤¢à¤¼à¤¾à¤à¤à¥¤'
      : 'No jobs match the current filters. Try clearing filters, selecting another city, or increasing distance.';
  String get noActiveJobsAvailable => isHindi
      ? 'à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤œà¥‰à¤¬ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤'
      : 'No active jobs are available right now.';
  String get enableLocationOrSelectCity => isHindi
      ? 'à¤ªà¤¾à¤¸ à¤•à¥€ à¤œà¥‰à¤¬à¥à¤¸ à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤²à¥‹à¤•à¥‡à¤¶à¤¨ à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‡à¤‚ à¤¯à¤¾ à¤¶à¤¹à¤° à¤šà¥à¤¨à¥‡à¤‚à¥¤'
      : 'Enable location or select a city to see nearby jobs.';
  String get walletActivation =>
      isHindi ? 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤”à¤° à¤à¤•à¥à¤Ÿà¤¿à¤µà¥‡à¤¶à¤¨' : 'Wallet & activation';
  String get walletActivationSubtitle => isHindi
      ? 'à¤†à¤ªà¤•à¤¾ à¤µà¥‰à¤²à¥‡à¤Ÿ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸ à¤¤à¤¯ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤†à¤ª à¤•à¤‚à¤ªà¤¨à¥€ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤¦à¥‡à¤– à¤ªà¤¾à¤à¤‚à¤—à¥‡ à¤¯à¤¾ à¤¨à¤¹à¥€à¤‚ à¤”à¤° à¤•à¥à¤¯à¤¾ à¤†à¤ª à¤¨à¤¿à¤¯à¥‹à¤•à¥à¤¤à¤¾à¤“à¤‚ à¤•à¥‹ à¤¦à¤¿à¤–à¥‡à¤‚à¤—à¥‡à¥¤'
      : 'Your wallet balance decides whether you can keep viewing company details and stay visible to employers.';
  String get currentBalance => isHindi ? 'à¤®à¥Œà¤œà¥‚à¤¦à¤¾ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸' : 'Current balance';
  String get estimatedActiveDays =>
      isHindi ? 'à¤…à¤¨à¥à¤®à¤¾à¤¨à¤¿à¤¤ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¦à¤¿à¤¨' : 'Estimated active days';
  String get dailyDeductionAmountLabel =>
      isHindi ? 'à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤Ÿà¥Œà¤¤à¥€ à¤°à¤¾à¤¶à¤¿' : 'Daily Deduction Amount';
  String get nextDailyDeduction =>
      isHindi ? 'à¤…à¤—à¤²à¥€ à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤Ÿà¥Œà¤¤à¥€' : 'Next daily deduction';
  String get activateWorkerAccess =>
      isHindi ? 'à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚' : 'Activate';
  String get deactivateWorkerAccess =>
      isHindi ? 'à¤¨à¤¿à¤·à¥à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚' : 'Deactivate';
  String get activateWorkerAccessSuccess =>
      isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤«à¤¿à¤° à¤¸à¥‡ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¹à¥‹ à¤—à¤¯à¤¾à¥¤' : 'Worker access is active again.';
  String get deactivateWorkerAccessSuccess =>
      isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¨à¤¿à¤·à¥à¤•à¥à¤°à¤¿à¤¯ à¤•à¤° à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤' : 'Worker access has been deactivated.';
  String get deactivateWorkerAccessTitle =>
      isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¨à¤¿à¤·à¥à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¥‡à¤‚?' : 'Deactivate worker access?';
  String get deactivateWorkerAccessMessage => isHindi
      ? 'à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤Ÿà¥Œà¤¤à¥€ à¤…à¤—à¤²à¥‡ 24 à¤˜à¤‚à¤Ÿà¥‡ à¤•à¥‡ à¤šà¤•à¥à¤° à¤¸à¥‡ à¤°à¥à¤• à¤œà¤¾à¤à¤—à¥€à¥¤ à¤†à¤ªà¤•à¥€ à¤µà¥‰à¤²à¥‡à¤Ÿ à¤°à¤¾à¤¶à¤¿ à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤°à¤¹à¥‡à¤—à¥€à¥¤'
      : 'Daily deduction will stop from the next 24-hour cycle. Your wallet balance will remain safe.';
  String get workerPlanPaused =>
      isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤°à¥‹à¤•à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ' : 'Worker access is paused';
  String get workerPlanPausedSubtitle => isHindi
      ? 'à¤†à¤ªà¤•à¥‡ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤•à¤°à¤¨à¥‡ à¤¤à¤• à¤¦à¥ˆà¤¨à¤¿à¤• à¤•à¤Ÿà¥Œà¤¤à¥€ à¤°à¥à¤•à¥€ à¤°à¤¹à¥‡à¤—à¥€à¥¤'
      : 'Daily deduction will stay paused until you activate worker access again.';
  String get walletStatusControlUnavailable => isHindi
      ? 'à¤¯à¤¹ à¤¨à¤¿à¤¯à¤‚à¤¤à¥à¤°à¤£ à¤•à¥‡à¤µà¤² à¤ªà¥‡à¤¡ à¤µà¤°à¥à¤•à¤° à¤ªà¥à¤²à¤¾à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¹à¥ˆà¥¤'
      : 'This control is available only for paid worker plans.';
  String get ok => isHindi ? 'à¤ à¥€à¤• à¤¹à¥ˆ' : 'OK';
  String get cancel => isHindi ? 'à¤°à¤¦à¥à¤¦ à¤•à¤°à¥‡à¤‚' : 'Cancel';
  String get rechargeNoteForAdmin =>
      isHindi ? 'à¤à¤¡à¤®à¤¿à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤¨à¥‹à¤Ÿ' : 'Recharge note for admin';
  String get rechargeNoteHint => isHindi
      ? 'à¤‰à¤¦à¤¾à¤¹à¤°à¤£: 20 à¤”à¤° à¤¦à¤¿à¤¨à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ Rs 100 à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤šà¤¾à¤¹à¤¿à¤'
      : 'Example: Need Rs 100 recharge for 20 more days';
  String get sendingRequest =>
      isHindi ? 'à¤…à¤¨à¥à¤°à¥‹à¤§ à¤­à¥‡à¤œà¤¾ à¤œà¤¾ à¤°à¤¹à¤¾ à¤¹à¥ˆ...' : 'Sending request...';
  String get requestRecharge =>
      isHindi ? 'à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤…à¤¨à¥à¤°à¥‹à¤§ à¤­à¥‡à¤œà¥‡à¤‚' : 'Request Recharge';
  String get rechargeHistory =>
      isHindi ? 'à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤”à¤° à¤•à¤Ÿà¥Œà¤¤à¥€ à¤¹à¤¿à¤¸à¥à¤Ÿà¥à¤°à¥€' : 'Recharge & deduction history';

  String get workerProfile => isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤²' : 'Worker profile';
  String get workerProfileSubtitle => isHindi
      ? 'à¤‡à¤¨ à¤¡à¤¿à¤Ÿà¥‡à¤²à¥à¤¸ à¤•à¥‹ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤°à¤–à¥‡à¤‚ à¤¤à¤¾à¤•à¤¿ à¤à¤ª à¤†à¤ªà¤•à¥‹ à¤¸à¤¹à¥€ à¤•à¤‚à¤ªà¤¨à¥€ à¤œà¤°à¥‚à¤°à¤¤à¥‹à¤‚ à¤¸à¥‡ à¤œà¥‹à¤¡à¤¼ à¤¸à¤•à¥‡à¥¤'
      : 'Keep these details updated so the app matches you with the right company requirements.';
  String get fullName => isHindi ? 'à¤ªà¥‚à¤°à¤¾ à¤¨à¤¾à¤®' : 'Full Name';
  String get city => isHindi ? 'à¤¶à¤¹à¤°' : 'City';
  String get lookingJobCity =>
      isHindi ? 'जॉब देखने का शहर' : 'Looking Job City';
  String get belongsToCity =>
      isHindi ? 'अपने शहर का नाम' : 'Belongs To City';
  String get addressLabel => isHindi ? 'पता' : 'Address';
  String get salaryType => isHindi ? 'वेतन प्रकार' : 'Salary Type';
  String get experienceYears => isHindi ? 'à¤…à¤¨à¥à¤­à¤µ (à¤µà¤°à¥à¤·)' : 'Experience (years)';
  String get expectedSalaryWage =>
      isHindi ? 'अपेक्षित वेतन / मजदूरी' : 'Expected Salary/Wage';
  String get expectedDailyWage =>
      isHindi ? 'à¤…à¤ªà¥‡à¤•à¥à¤·à¤¿à¤¤ à¤¦à¥ˆà¤¨à¤¿à¤• à¤¦à¤¿à¤¹à¤¾à¤¡à¤¼à¥€' : 'Expected daily wage';
  String get skills => isHindi ? 'à¤¸à¥à¤•à¤¿à¤²à¥à¤¸' : 'Skills';
  String get skillsHint => isHindi
      ? 'à¤‰à¤¦à¤¾à¤¹à¤°à¤£: à¤“à¤µà¤°à¤²à¥‰à¤•, à¤•à¤Ÿà¤¿à¤‚à¤—, à¤œà¤°à¥€, à¤«à¤¿à¤¨à¤¿à¤¶à¤¿à¤‚à¤—'
      : 'Example: overlock, cutting, zari, finishing';
  String get categories => isHindi ? 'à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€' : 'Categories';
  String get availability => isHindi ? 'à¤‰à¤ªà¤²à¤¬à¥à¤§à¤¤à¤¾' : 'Availability';
  String get availableToday => isHindi ? 'à¤†à¤œ à¤‰à¤ªà¤²à¤¬à¥à¤§' : 'Available today';
  String get availableThisWeek =>
      isHindi ? 'à¤‡à¤¸ à¤¸à¤ªà¥à¤¤à¤¾à¤¹ à¤‰à¤ªà¤²à¤¬à¥à¤§' : 'Available this week';
  String get notAvailable => isHindi ? 'à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚' : 'Not available';
  String get saveProfile => isHindi ? 'à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤² à¤¸à¥‡à¤µ à¤•à¤°à¥‡à¤‚' : 'Save Profile';
  String get saving => isHindi ? 'à¤¸à¥‡à¤µ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆ...' : 'Saving...';
  String get fullNameRequired =>
      isHindi ? 'à¤ªà¥‚à¤°à¤¾ à¤¨à¤¾à¤® à¤œà¤°à¥‚à¤°à¥€ à¤¹à¥ˆà¥¤' : 'Full name is required.';
  String get cityRequired => isHindi ? 'à¤¶à¤¹à¤° à¤œà¤°à¥‚à¤°à¥€ à¤¹à¥ˆà¥¤' : 'City is required.';
  String get categoryRequired =>
      isHindi ? 'à¤•à¤® à¤¸à¥‡ à¤•à¤® à¤à¤• à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€ à¤šà¥à¤¨à¥‡à¤‚à¥¤' : 'Select at least one category.';
  String get profileUpdatedSuccessfully => isHindi
      ? 'à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤² à¤¸à¤«à¤²à¤¤à¤¾à¤ªà¥‚à¤°à¥à¤µà¤• à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥‹ à¤—à¤ˆà¥¤'
      : 'Profile updated successfully.';
  String get rechargeRequestSent => isHindi
      ? 'à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ à¤…à¤¨à¥à¤°à¥‹à¤§ à¤à¤¡à¤®à¤¿à¤¨ à¤•à¥‹ à¤­à¥‡à¤œ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤'
      : 'Recharge request sent to admin.';

  String get feed => isHindi ? 'à¤«à¥€à¤¡' : 'Feed';
  String get profile => isHindi ? 'à¤ªà¥à¤°à¥‹à¤«à¤¾à¤‡à¤²' : 'Profile';
  String workerSalaryTypeLabel(String value) {
    switch (value.trim().toLowerCase()) {
      case 'daily wage':
        return isHindi ? 'दैनिक मजदूरी' : 'Daily Wage';
      case 'monthly salary':
        return isHindi ? 'मासिक वेतन' : 'Monthly Salary';
      case 'weekly':
      case 'weekly payment':
        return isHindi ? 'साप्ताहिक' : 'Weekly';
      case 'per piece':
      case 'piece rate':
        return isHindi ? 'प्रति पीस' : 'Per Piece';
      case 'contract':
      case 'contract payment':
        return isHindi ? 'कॉन्ट्रैक्ट' : 'Contract';
      case 'hourly':
        return isHindi ? 'घंटे के हिसाब से' : 'Hourly';
      default:
        return value;
    }
  }

  String get alerts => isHindi ? 'à¤…à¤²à¤°à¥à¤Ÿà¥à¤¸' : 'Alerts';
  String kmAway(String distance) =>
      isHindi ? '$distance à¤•à¤¿à¤®à¥€ à¤¦à¥‚à¤°' : '$distance km away';
  String mAway(String distance) =>
      isHindi ? '$distance à¤®à¥€à¤Ÿà¤° à¤¦à¥‚à¤°' : '$distance m away';
  String get distanceUnavailable =>
      isHindi ? 'à¤¦à¥‚à¤°à¥€ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ' : 'Distance unavailable';
  String get enableLocationToSeeDistance => isHindi
      ? 'à¤¦à¥‚à¤°à¥€ à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤²à¥‹à¤•à¥‡à¤¶à¤¨ à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‡à¤‚'
      : 'Enable location to see distance';
  String get notificationsTitle =>
      isHindi ? 'à¤µà¤°à¥à¤•à¤° à¤¨à¥‹à¤Ÿà¤¿à¤«à¤¿à¤•à¥‡à¤¶à¤¨' : 'Worker notifications';
  String unreadNotifications(int count) => isHindi
      ? '$count à¤…à¤¨à¤°à¥€à¤¡ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤†à¤ªà¤•à¥€ à¤ªà¥à¤°à¤¤à¥€à¤•à¥à¤·à¤¾ à¤®à¥‡à¤‚ à¤¹à¥ˆà¤‚à¥¤'
      : '$count unread updates waiting for you.';
  String get allCaughtUpMessage => isHindi
      ? 'à¤†à¤ªà¤¨à¥‡ à¤¸à¤­à¥€ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¦à¥‡à¤– à¤²à¤¿à¤ à¤¹à¥ˆà¤‚à¥¤ à¤¨à¤ˆ à¤œà¥‰à¤¬ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿à¤¯à¤¾à¤‚ à¤”à¤° à¤…à¤•à¤¾à¤‰à¤‚à¤Ÿ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¯à¤¹à¥€à¤‚ à¤¦à¤¿à¤–à¥‡à¤‚à¤—à¥‡à¥¤'
      : 'You are fully caught up. New job actions and account updates will appear here.';
  String get markAllAsRead =>
      isHindi ? 'à¤¸à¤­à¥€ à¤•à¥‹ à¤ªà¤¢à¤¼à¤¾ à¤¹à¥à¤† à¤šà¤¿à¤¨à¥à¤¹à¤¿à¤¤ à¤•à¤°à¥‡à¤‚' : 'Mark all as read';
  String get updating => isHindi ? 'à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆ...' : 'Updating...';
  String get notificationsEmpty => isHindi
      ? 'à¤…à¤­à¥€ à¤•à¥‹à¤ˆ à¤¨à¥‹à¤Ÿà¤¿à¤«à¤¿à¤•à¥‡à¤¶à¤¨ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤ à¤œà¥ˆà¤¸à¥‡ à¤¹à¥€ à¤†à¤ª à¤œà¥‰à¤¬ à¤¸à¥‡à¤µ à¤¯à¤¾ à¤…à¤ªà¥à¤²à¤¾à¤ˆ à¤•à¤°à¥‡à¤‚à¤—à¥‡, à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¯à¤¹à¤¾à¤‚ à¤¦à¤¿à¤–à¥‡à¤‚à¤—à¥‡à¥¤'
      : 'No notifications yet. Once you save jobs or apply, updates will start showing here.';
  String get markRead => isHindi ? 'à¤ªà¤¢à¤¼à¤¾ à¤¹à¥à¤†' : 'Mark read';

  String get applicationSentSuccess => isHindi
      ? 'à¤†à¤µà¥‡à¤¦à¤¨ à¤¸à¤«à¤²à¤¤à¤¾à¤ªà¥‚à¤°à¥à¤µà¤• à¤­à¥‡à¤œ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤'
      : 'Application sent successfully.';

  String localizeMatchReason(String value) {
    final normalized = value.trim().toLowerCase();
    if (!isHindi) return value;

    switch (normalized) {
      case 'strong match in your city and category':
        return 'à¤†à¤ªà¤•à¥‡ à¤¶à¤¹à¤° à¤”à¤° à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€ à¤®à¥‡à¤‚ à¤®à¤œà¤¬à¥‚à¤¤ à¤®à¥ˆà¤š';
      case 'category match for your worker profile':
        return 'à¤†à¤ªà¤•à¥€ à¤µà¤°à¥à¤•à¤° à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤•à¥‡ à¤²à¤¿à¤ à¤•à¥ˆà¤Ÿà¥‡à¤—à¤°à¥€ à¤®à¥ˆà¤š';
      default:
        return value;
    }
  }

  String localizeNotificationTitle(String type, String title) {
    if (!isHindi) return title;

    switch (type.trim().toLowerCase()) {
      case 'application_submitted':
        return 'à¤†à¤µà¥‡à¤¦à¤¨ à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾';
      case 'job_saved':
        return 'à¤œà¥‰à¤¬ à¤¸à¥‡à¤µ à¤¹à¥à¤ˆ';
      case 'application_status':
        return 'à¤†à¤µà¥‡à¤¦à¤¨ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤…à¤ªà¤¡à¥‡à¤Ÿ';
      case 'wallet_reminder':
        return 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤°à¤¿à¤®à¤¾à¤‡à¤‚à¤¡à¤°';
      default:
        return title;
    }
  }

  String localizeNotificationMessage({
    required String type,
    required String message,
    String? jobTitle,
    String? companyName,
  }) {
    if (!isHindi) return message;

    switch (type.trim().toLowerCase()) {
      case 'application_submitted':
        if (jobTitle != null && jobTitle.isNotEmpty) {
          final companyPart = companyName != null && companyName.isNotEmpty
              ? ' ${companyName} à¤®à¥‡à¤‚'
              : '';
          return 'à¤†à¤ªà¤¨à¥‡ ${jobTitle}${companyPart} à¤†à¤µà¥‡à¤¦à¤¨ à¤­à¥‡à¤œ à¤¦à¤¿à¤¯à¤¾ à¤¹à¥ˆà¥¤';
        }
        return 'à¤†à¤ªà¤•à¤¾ à¤†à¤µà¥‡à¤¦à¤¨ à¤¸à¤«à¤²à¤¤à¤¾à¤ªà¥‚à¤°à¥à¤µà¤• à¤­à¥‡à¤œ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤';
      case 'job_saved':
        if (jobTitle != null && jobTitle.isNotEmpty) {
          return '${jobTitle} à¤†à¤ªà¤•à¥€ à¤¶à¥‰à¤°à¥à¤Ÿà¤²à¤¿à¤¸à¥à¤Ÿ à¤®à¥‡à¤‚ à¤¸à¥‡à¤µ à¤¹à¥‹ à¤—à¤ˆ à¤¹à¥ˆà¥¤';
        }
        return 'à¤œà¥‰à¤¬ à¤†à¤ªà¤•à¥€ à¤¶à¥‰à¤°à¥à¤Ÿà¤²à¤¿à¤¸à¥à¤Ÿ à¤®à¥‡à¤‚ à¤¸à¥‡à¤µ à¤¹à¥‹ à¤—à¤ˆ à¤¹à¥ˆà¥¤';
      case 'application_status':
        return 'à¤†à¤ªà¤•à¥‡ à¤†à¤µà¥‡à¤¦à¤¨ à¤•à¥€ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤¹à¥à¤ˆ à¤¹à¥ˆà¥¤';
      case 'wallet_reminder':
        return 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤”à¤° à¤à¤•à¥à¤¸à¥‡à¤¸ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¤¾ à¤¨à¤¯à¤¾ à¤…à¤ªà¤¡à¥‡à¤Ÿ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¹à¥ˆà¥¤';
      default:
        return message;
    }
  }

  String prettyValue(String value) {
    const english = {
      'active': 'Active',
      'pending': 'Pending',
      'inactive_paused_by_worker': 'Paused by worker',
      'inactive_wallet_empty': 'Wallet empty',
      'inactive_subscription_expired': 'Subscription expired',
      'blocked': 'Blocked',
      'rejected': 'Rejected',
      'registration_fee': 'Registration fee',
      'wallet_deduction': 'Wallet deduction',
      'plan_purchase': 'Plan purchase',
      'wallet_recharge': 'Wallet recharge',
      'manual_adjustment': 'Manual adjustment',
      'completed': 'Completed',
      'attention': 'Attention',
      'failed': 'Failed',
      'submitted': 'Submitted',
      'reviewed': 'Reviewed',
      'shortlisted': 'Shortlisted',
      'hired': 'Hired',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
    };

    const hindi = {
      'active': 'à¤¸à¤•à¥à¤°à¤¿à¤¯',
      'pending': 'à¤²à¤‚à¤¬à¤¿à¤¤',
      'inactive_paused_by_worker': 'à¤µà¤°à¥à¤•à¤° à¤¨à¥‡ à¤°à¥‹à¤•à¤¾',
      'inactive_wallet_empty': 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤–à¤¾à¤²à¥€',
      'inactive_subscription_expired': 'à¤¸à¤¦à¤¸à¥à¤¯à¤¤à¤¾ à¤¸à¤®à¤¾à¤ªà¥à¤¤',
      'blocked': 'à¤¬à¥à¤²à¥‰à¤•',
      'rejected': 'à¤…à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤',
      'registration_fee': 'à¤°à¤œà¤¿à¤¸à¥à¤Ÿà¥à¤°à¥‡à¤¶à¤¨ à¤¶à¥à¤²à¥à¤•',
      'wallet_deduction': 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤•à¤Ÿà¥Œà¤¤à¥€',
      'plan_purchase': 'à¤ªà¥à¤²à¤¾à¤¨ à¤–à¤°à¥€à¤¦',
      'wallet_recharge': 'à¤µà¥‰à¤²à¥‡à¤Ÿ à¤°à¤¿à¤šà¤¾à¤°à¥à¤œ',
      'manual_adjustment': 'à¤®à¥ˆà¤¨à¥à¤…à¤² à¤¸à¤®à¤¾à¤¯à¥‹à¤œà¤¨',
      'completed': 'à¤ªà¥‚à¤°à¥à¤£',
      'attention': 'à¤§à¥à¤¯à¤¾à¤¨ à¤¦à¥‡à¤‚',
      'failed': 'à¤…à¤¸à¤«à¤²',
      'submitted': 'à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾',
      'reviewed': 'à¤¸à¤®à¥€à¤•à¥à¤·à¤¿à¤¤',
      'shortlisted': 'à¤¶à¥‰à¤°à¥à¤Ÿà¤²à¤¿à¤¸à¥à¤Ÿà¥‡à¤¡',
      'hired': 'à¤¨à¤¿à¤¯à¥à¤•à¥à¤¤',
      'high': 'à¤‰à¤šà¥à¤š',
      'medium': 'à¤®à¤§à¥à¤¯à¤®',
      'low': 'à¤•à¤®',
    };

    final normalized = value.trim().toLowerCase();
    if (isHindi && hindi.containsKey(normalized)) {
      return hindi[normalized]!;
    }
    if (english.containsKey(normalized)) {
      return english[normalized]!;
    }

    return value
        .replaceAll('_', ' ')
        .split(' ')
        .where((part) => part.isNotEmpty)
        .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
        .join(' ');
  }
}

class _WorkerLocalizationsDelegate
    extends LocalizationsDelegate<WorkerLocalizations> {
  const _WorkerLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => WorkerLocalizations.supportedLocales
      .map((item) => item.languageCode)
      .contains(locale.languageCode);

  @override
  Future<WorkerLocalizations> load(Locale locale) {
    return SynchronousFuture(WorkerLocalizations(locale));
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<WorkerLocalizations> old) =>
      false;
}
