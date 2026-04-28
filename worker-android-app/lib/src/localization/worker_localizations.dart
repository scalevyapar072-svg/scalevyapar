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
    final localizations = Localizations.of<WorkerLocalizations>(context, WorkerLocalizations);
    return localizations ?? const WorkerLocalizations(Locale('hi'));
  }

  bool get isHindi => locale.languageCode.toLowerCase().startsWith('hi');

  String get appTitle => isHindi ? 'स्केलव्यापार रोजगार' : 'ScaleVyapar Rozgar';
  String get switchLanguage => isHindi ? 'EN' : 'हिं';
  String get welcomePrefix => isHindi ? 'नमस्ते' : 'Welcome';
  String welcomeUser(String name) => isHindi ? 'नमस्ते, $name' : 'Welcome, $name';

  String get bootstrapSubtitle => isHindi
      ? 'रोजगार के मौके, वॉलेट विजिबिलिटी और एक्टिवेशन स्टेटस अब एक ही ऐप में।'
      : 'Daily work opportunities, wallet visibility, and activation status in one app.';

  String get loginHeroTitle => isHindi ? 'दैनिक काम जल्दी खोजें।' : 'Find daily work faster.';
  String get loginHeroSubtitle => isHindi
      ? 'ओटीपी से लॉगिन करें, अपना प्रोफाइल सक्रिय रखें, और वॉलेट स्टेटस के आधार पर कंपनी डिटेल्स देखें।'
      : 'Login with OTP, keep your profile active, and unlock company details based on your wallet status.';
  String get otpMobileLogin => isHindi ? 'ओटीपी मोबाइल लॉगिन' : 'OTP mobile login';
  String get dailyWalletTracking => isHindi ? 'दैनिक वॉलेट ट्रैकिंग' : 'Daily wallet tracking';
  String get matchingJobFeed => isHindi ? 'मिलती-जुलती जॉब फीड' : 'Matching job feed';
  String get verifyYourOtp => isHindi ? 'ओटीपी सत्यापित करें' : 'Verify your OTP';
  String get workerLogin => isHindi ? 'वर्कर लॉगिन' : 'Worker login';
  String get otpSentDescription => isHindi
      ? 'आपके मोबाइल नंबर पर कोड भेज दिया गया है।'
      : 'We have sent a code to your mobile number.';
  String get enterMobileDescription => isHindi
      ? 'लॉगिन ओटीपी पाने के लिए अपना मोबाइल नंबर दर्ज करें।'
      : 'Enter your mobile number to receive the login OTP.';
  String get mobile => isHindi ? 'मोबाइल' : 'Mobile';
  String get otp => isHindi ? 'ओटीपी' : 'OTP';
  String get mobileNumber => isHindi ? 'मोबाइल नंबर' : 'Mobile Number';
  String get enterTenDigitMobile => isHindi ? '10 अंकों का मोबाइल नंबर दर्ज करें' : 'Enter 10-digit mobile number';
  String get otpCode => isHindi ? 'ओटीपी कोड' : 'OTP Code';
  String get enterOtp => isHindi ? 'ओटीपी दर्ज करें' : 'Enter OTP';
  String demoOtpForTesting(String otp) => isHindi ? 'टेस्टिंग के लिए डेमो ओटीपी: $otp' : 'Demo OTP for testing: $otp';
  String get requestingOtp => isHindi ? 'ओटीपी भेजा जा रहा है...' : 'Requesting OTP...';
  String get requestOtp => isHindi ? 'ओटीपी प्राप्त करें' : 'Request OTP';
  String get verifying => isHindi ? 'सत्यापन हो रहा है...' : 'Verifying...';
  String get verifyOtp => isHindi ? 'ओटीपी सत्यापित करें' : 'Verify OTP';
  String get demoSeededWorkers => isHindi ? 'डेमो वर्कर नंबर' : 'Demo seeded worker numbers';
  String get activeWorkerLine => isHindi ? '9876543210 (सक्रिय वर्कर)' : '9876543210 (active worker)';
  String get walletEmptyWorkerLine => isHindi ? '9812345678 (वॉलेट खाली वर्कर)' : '9812345678 (wallet empty worker)';

  String get invalidMobileNumberError => isHindi
      ? 'सही 10 अंकों का मोबाइल नंबर दर्ज करें।'
      : 'Enter a valid 10-digit mobile number.';
  String get invalidOtpError => isHindi
      ? '6 अंकों का ओटीपी दर्ज करें।'
      : 'Enter the 6-digit OTP code.';
  String get loadingDashboard => isHindi ? 'डैशबोर्ड लोड हो रहा है...' : 'Loading dashboard...';
  String get tryAgain => isHindi ? 'फिर प्रयास करें' : 'Try Again';

  String get wallet => isHindi ? 'वॉलेट' : 'Wallet';
  String get jobs => isHindi ? 'जॉब्स' : 'Jobs';
  String get wage => isHindi ? 'दिहाड़ी' : 'Wage';
  String get dailyDeduction => isHindi ? 'दैनिक कटौती' : 'Daily deduction';
  String get estimatedDaysLeft => isHindi ? 'अनुमानित बचे दिन' : 'Estimated days left';
  String unlockedJobsCount(int count) => isHindi ? '$count अनलॉक्ड' : '$count unlocked';

  String get matchingJobFeedTitle => isHindi ? 'मिलती-जुलती जॉब फीड' : 'Matching job feed';
  String get matchingJobFeedSubtitle => isHindi
      ? 'जॉब्स आपके शहर, कैटेगरी और सक्रिय वर्कर स्टेटस के आधार पर दिखाई जाती हैं।'
      : 'Jobs are matched using your city, categories, and active worker status.';
  String get searchJobs => isHindi ? 'जॉब खोजें' : 'Search jobs';
  String get searchJobsHint => isHindi ? 'टाइटल, शहर या कैटेगरी से खोजें' : 'Search by title, city, or category';
  String get showUnlockedCompanyDetails => isHindi ? 'सिर्फ अनलॉक कंपनी डिटेल्स दिखाएं' : 'Show only unlocked company details';
  String get unlockedCompanyDetailsSubtitle => isHindi
      ? 'जब आपका अकाउंट सक्रिय हो और आपको सीधे संपर्क चाहिए तब उपयोगी।'
      : 'Useful when your account is active and you want direct contacts.';
  String get noJobsMatchMessage => isHindi
      ? 'मौजूदा फिल्टर से कोई जॉब नहीं मिली। खोज साफ़ करें या अपना प्रोफाइल सक्रिय रखें।'
      : 'No jobs match the current filters. Try clearing your search or keeping your worker profile active.';
  String workersNeeded(int count) => isHindi ? '$count वर्कर चाहिए' : '$count workers needed';
  String get saved => isHindi ? 'सेव्ड' : 'Saved';
  String appliedStatusLabel(String status) => isHindi ? 'अप्लाई किया • ${prettyValue(status)}' : 'Applied • ${prettyValue(status)}';
  String get appliedWithoutStatus => isHindi ? 'अप्लाई किया' : 'Applied';
  String get working => isHindi ? 'प्रक्रिया जारी है...' : 'Working...';
  String get applicationSent => isHindi ? 'आवेदन भेज दिया गया' : 'Application sent';
  String get applyToJob => isHindi ? 'जॉब के लिए आवेदन करें' : 'Apply to job';
  String get removeFromShortlist => isHindi ? 'शॉर्टलिस्ट से हटाएं' : 'Remove from shortlist';
  String get saveJob => isHindi ? 'जॉब सेव करें' : 'Save job';
  String get companyLockedMessage => isHindi
      ? 'कंपनी डिटेल्स लॉक हैं। सीधे संपर्क खोलने के लिए रिचार्ज करें और वर्कर अकाउंट सक्रिय रखें।'
      : 'Company details are locked. Recharge and keep the worker account active to unlock direct company contact.';
  String contactPerson(String name) => isHindi ? 'संपर्क व्यक्ति: $name' : 'Contact person: $name';
  String companyMobile(String mobile) => isHindi ? 'मोबाइल: $mobile' : 'Mobile: $mobile';
  String companyCity(String city) => isHindi ? 'कंपनी शहर: $city' : 'Company city: $city';

  String get walletActivation => isHindi ? 'वॉलेट और एक्टिवेशन' : 'Wallet & activation';
  String get walletActivationSubtitle => isHindi
      ? 'आपका वॉलेट बैलेंस तय करता है कि आप कंपनी डिटेल्स देख पाएंगे या नहीं और क्या आप नियोक्ताओं को दिखेंगे।'
      : 'Your wallet balance decides whether you can keep viewing company details and stay visible to employers.';
  String get currentBalance => isHindi ? 'मौजूदा बैलेंस' : 'Current balance';
  String get estimatedActiveDays => isHindi ? 'अनुमानित सक्रिय दिन' : 'Estimated active days';
  String get rechargeNoteForAdmin => isHindi ? 'एडमिन के लिए रिचार्ज नोट' : 'Recharge note for admin';
  String get rechargeNoteHint => isHindi ? 'उदाहरण: 20 और दिनों के लिए Rs 100 रिचार्ज चाहिए' : 'Example: Need Rs 100 recharge for 20 more days';
  String get sendingRequest => isHindi ? 'अनुरोध भेजा जा रहा है...' : 'Sending request...';
  String get requestRecharge => isHindi ? 'रिचार्ज अनुरोध भेजें' : 'Request Recharge';
  String get rechargeHistory => isHindi ? 'रिचार्ज और कटौती हिस्ट्री' : 'Recharge & deduction history';

  String get workerProfile => isHindi ? 'वर्कर प्रोफाइल' : 'Worker profile';
  String get workerProfileSubtitle => isHindi
      ? 'इन डिटेल्स को अपडेट रखें ताकि ऐप आपको सही कंपनी जरूरतों से जोड़ सके।'
      : 'Keep these details updated so the app matches you with the right company requirements.';
  String get fullName => isHindi ? 'पूरा नाम' : 'Full Name';
  String get city => isHindi ? 'शहर' : 'City';
  String get experienceYears => isHindi ? 'अनुभव (वर्ष)' : 'Experience (years)';
  String get expectedDailyWage => isHindi ? 'अपेक्षित दैनिक दिहाड़ी' : 'Expected daily wage';
  String get skills => isHindi ? 'स्किल्स' : 'Skills';
  String get skillsHint => isHindi ? 'उदाहरण: ओवरलॉक, कटिंग, जरी, फिनिशिंग' : 'Example: overlock, cutting, zari, finishing';
  String get categories => isHindi ? 'कैटेगरी' : 'Categories';
  String get availability => isHindi ? 'उपलब्धता' : 'Availability';
  String get availableToday => isHindi ? 'आज उपलब्ध' : 'Available today';
  String get availableThisWeek => isHindi ? 'इस सप्ताह उपलब्ध' : 'Available this week';
  String get notAvailable => isHindi ? 'उपलब्ध नहीं' : 'Not available';
  String get saveProfile => isHindi ? 'प्रोफाइल सेव करें' : 'Save Profile';
  String get saving => isHindi ? 'सेव हो रहा है...' : 'Saving...';
  String get fullNameRequired => isHindi ? 'पूरा नाम जरूरी है।' : 'Full name is required.';
  String get cityRequired => isHindi ? 'शहर जरूरी है।' : 'City is required.';
  String get categoryRequired => isHindi ? 'कम से कम एक कैटेगरी चुनें।' : 'Select at least one category.';
  String get profileUpdatedSuccessfully => isHindi ? 'प्रोफाइल सफलतापूर्वक अपडेट हो गई।' : 'Profile updated successfully.';
  String get rechargeRequestSent => isHindi ? 'रिचार्ज अनुरोध एडमिन को भेज दिया गया।' : 'Recharge request sent to admin.';

  String get feed => isHindi ? 'फीड' : 'Feed';
  String get profile => isHindi ? 'प्रोफाइल' : 'Profile';
  String get alerts => isHindi ? 'अलर्ट्स' : 'Alerts';
  String get notificationsTitle => isHindi ? 'वर्कर नोटिफिकेशन' : 'Worker notifications';
  String unreadNotifications(int count) => isHindi
      ? '$count अनरीड अपडेट आपकी प्रतीक्षा में हैं।'
      : '$count unread updates waiting for you.';
  String get allCaughtUpMessage => isHindi
      ? 'आपने सभी अपडेट देख लिए हैं। नई जॉब गतिविधियां और अकाउंट अपडेट यहीं दिखेंगे।'
      : 'You are fully caught up. New job actions and account updates will appear here.';
  String get markAllAsRead => isHindi ? 'सभी को पढ़ा हुआ चिन्हित करें' : 'Mark all as read';
  String get updating => isHindi ? 'अपडेट हो रहा है...' : 'Updating...';
  String get notificationsEmpty => isHindi
      ? 'अभी कोई नोटिफिकेशन नहीं है। जैसे ही आप जॉब सेव या अप्लाई करेंगे, अपडेट यहां दिखेंगे।'
      : 'No notifications yet. Once you save jobs or apply, updates will start showing here.';
  String get markRead => isHindi ? 'पढ़ा हुआ' : 'Mark read';

  String get applicationSentSuccess => isHindi ? 'आवेदन सफलतापूर्वक भेज दिया गया।' : 'Application sent successfully.';

  String localizeMatchReason(String value) {
    final normalized = value.trim().toLowerCase();
    if (!isHindi) return value;

    switch (normalized) {
      case 'strong match in your city and category':
        return 'आपके शहर और कैटेगरी में मजबूत मैच';
      case 'category match for your worker profile':
        return 'आपकी वर्कर प्रोफ़ाइल के लिए कैटेगरी मैच';
      default:
        return value;
    }
  }

  String localizeNotificationTitle(String type, String title) {
    if (!isHindi) return title;

    switch (type.trim().toLowerCase()) {
      case 'application_submitted':
        return 'आवेदन भेजा गया';
      case 'job_saved':
        return 'जॉब सेव हुई';
      case 'application_status':
        return 'आवेदन स्थिति अपडेट';
      case 'wallet_reminder':
        return 'वॉलेट रिमाइंडर';
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
          final companyPart = companyName != null && companyName.isNotEmpty ? ' ${companyName} में' : '';
          return 'आपने ${jobTitle}${companyPart} आवेदन भेज दिया है।';
        }
        return 'आपका आवेदन सफलतापूर्वक भेज दिया गया है।';
      case 'job_saved':
        if (jobTitle != null && jobTitle.isNotEmpty) {
          return '${jobTitle} आपकी शॉर्टलिस्ट में सेव हो गई है।';
        }
        return 'जॉब आपकी शॉर्टलिस्ट में सेव हो गई है।';
      case 'application_status':
        return 'आपके आवेदन की स्थिति अपडेट हुई है।';
      case 'wallet_reminder':
        return 'वॉलेट और एक्सेस से जुड़ा नया अपडेट उपलब्ध है।';
      default:
        return message;
    }
  }

  String prettyValue(String value) {
    const english = {
      'active': 'Active',
      'pending': 'Pending',
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
      'active': 'सक्रिय',
      'pending': 'लंबित',
      'inactive_wallet_empty': 'वॉलेट खाली',
      'inactive_subscription_expired': 'सदस्यता समाप्त',
      'blocked': 'ब्लॉक',
      'rejected': 'अस्वीकृत',
      'registration_fee': 'रजिस्ट्रेशन शुल्क',
      'wallet_deduction': 'वॉलेट कटौती',
      'plan_purchase': 'प्लान खरीद',
      'wallet_recharge': 'वॉलेट रिचार्ज',
      'manual_adjustment': 'मैनुअल समायोजन',
      'completed': 'पूर्ण',
      'attention': 'ध्यान दें',
      'failed': 'असफल',
      'submitted': 'भेजा गया',
      'reviewed': 'समीक्षित',
      'shortlisted': 'शॉर्टलिस्टेड',
      'hired': 'नियुक्त',
      'high': 'उच्च',
      'medium': 'मध्यम',
      'low': 'कम',
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

class _WorkerLocalizationsDelegate extends LocalizationsDelegate<WorkerLocalizations> {
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
  bool shouldReload(covariant LocalizationsDelegate<WorkerLocalizations> old) => false;
}
