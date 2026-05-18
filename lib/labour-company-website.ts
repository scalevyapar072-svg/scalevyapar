import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'

export type LabourCompanyWebsiteSection =
  | 'hero'
  | 'trust'
  | 'features'
  | 'process'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'intake'

export interface LabourCompanyLegalPageSection {
  title: string
  body: string
}

export interface LabourCompanyLegalPageContent {
  eyebrow: string
  title: string
  subtitle: string
  sections: LabourCompanyLegalPageSection[]
}

export interface LabourCompanyWebsiteContent {
  theme: {
    brandName: string
    brandTagline: string
    accentColor: string
    accentSoft: string
    highlightColor: string
  }
  header: {
    announcement: string
    logoSrc: string
    logoWidth: string
    primaryCtaLabel: string
    primaryCtaHref: string
    navItems: Array<{
      label: string
      href: string
    }>
  }
  footer: {
    description: string
    supportEmail: string
    phone: string
    address: string
    copyrightText: string
    legalLinks: Array<{
      label: string
      href: string
    }>
    linkGroups: Array<{
      title: string
      links: Array<{
        label: string
        href: string
      }>
    }>
  }
  home: {
    sectionOrder: LabourCompanyWebsiteSection[]
    hero: {
      eyebrow: string
      title: string
      highlightedText: string
      subtitle: string
      primaryCtaLabel: string
      primaryCtaHref: string
      secondaryCtaLabel: string
      secondaryCtaHref: string
      primaryImageSrc: string
      secondaryImageSrc: string
      imageBadgeTitle: string
      imageBadgeSubtitle: string
      slides: Array<{
        primaryImageSrc: string
        secondaryImageSrc: string
        imageBadgeTitle: string
        imageBadgeSubtitle: string
        ratingText: string
      }>
    }
    searchBar: {
      title: string
      placeholder: string
      categoryLabel: string
      cityLabel: string
      buttonLabel: string
    }
    stats: {
      items: Array<{
        value: string
        label: string
        icon: string
      }>
    }
    trustStrip: {
      title: string
      items: string[]
    }
    features: {
      eyebrow: string
      title: string
      subtitle: string
      cards: Array<{
        icon: string
        title: string
        description: string
        bullets: string[]
      }>
    }
    process: {
      eyebrow: string
      title: string
      steps: Array<{
        icon: string
        title: string
        description: string
      }>
    }
    pricing: {
      title: string
      subtitle: string
      footnote: string
    }
    testimonials: {
      eyebrow: string
      title: string
      items: Array<{
        quote: string
        name: string
        role: string
        company: string
        rating: string
      }>
    }
    categories: {
      eyebrow: string
      title: string
      buttonLabel: string
      buttonHref: string
      cards: Array<{
        icon: string
        title: string
        subtitle: string
        href: string
      }>
    }
    faq: {
      title: string
      items: Array<{
        question: string
        answer: string
      }>
    }
    finalCta: {
      eyebrow: string
      title: string
      subtitle: string
      buttonLabel: string
      buttonHref: string
    }
    intake: {
      title: string
      description: string
      submitLabel: string
    }
    workerCta: {
      title: string
      description: string
      buttonLabel: string
      buttonHref: string
    }
  }
  aboutPage: {
    hero: {
      eyebrow: string
      title: string
      highlightedText: string
      subtitle: string
      bulletPoints: string[]
      imageSrc: string
      floatingCardTitle: string
      floatingCardItems: string[]
    }
    missionCards: Array<{
      icon: string
      title: string
      description: string
    }>
    stats: {
      items: Array<{
        value: string
        label: string
        icon: string
      }>
    }
    whyChoose: {
      eyebrow: string
      title: string
      cards: Array<{
        icon: string
        title: string
        description: string
      }>
    }
    process: {
      eyebrow: string
      title: string
      steps: Array<{
        icon: string
        title: string
        description: string
      }>
    }
    testimonials: {
      eyebrow: string
      title: string
      items: Array<{
        quote: string
        name: string
        role: string
        company: string
        rating: string
      }>
    }
    finalCta: {
      title: string
      subtitle: string
      primaryCtaLabel: string
      primaryCtaHref: string
      secondaryCtaLabel: string
      secondaryCtaHref: string
    }
  }
  pricingPage: {
    eyebrow: string
    title: string
    subtitle: string
    benefits: Array<{
      icon: string
      title: string
      description: string
    }>
    billing: {
      monthlyLabel: string
      yearlyLabel: string
      savingsLabel: string
      currencyNote: string
    }
    plans: Array<{
      name: string
      subtitle: string
      badge: string
      monthlyPrice: string
      yearlyPrice: string
      monthlySuffix: string
      yearlySuffix: string
      buttonLabel: string
      buttonHref: string
      features: string[]
    }>
    compareTitle: string
    compareRows: Array<{
      icon: string
      feature: string
      starter: string
      professional: string
      enterprise: string
    }>
    faqTitle: string
    faqs: Array<{
      question: string
      answer: string
    }>
    finalCta: {
      title: string
      subtitle: string
      primaryCtaLabel: string
      primaryCtaHref: string
      secondaryCtaLabel: string
      secondaryCtaHref: string
    }
  }
  signinPage: {
    eyebrow: string
    title: string
    subtitle: string
    infoTitle: string
    infoDescription: string
    benefits: string[]
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    loginCard: {
      title: string
      subtitle: string
      emailLabel: string
      emailPlaceholder: string
      passwordLabel: string
      passwordPlaceholder: string
      rememberMeLabel: string
      forgotPasswordLabel: string
      signInButtonLabel: string
      registerCompanyButtonLabel: string
      registerPromptText: string
      redirectNoteText: string
    }
    rightPanel: {
      title: string
      items: Array<{
        title: string
        description: string
      }>
    }
    banner: {
      imageSrc: string
      title: string
      description: string
    }
    featureStrip: Array<{
      title: string
      description: string
    }>
  }
  contactPage: {
    eyebrow: string
    title: string
    highlightedText: string
    subtitle: string
    imageSrc: string
    featurePoints: Array<{
      title: string
      description: string
    }>
    floatingCardTitle: string
    floatingCardDescription: string
    floatingCardAvailabilityValue: string
    floatingCardAvailabilityLabel: string
    formTitle: string
    formSubtitle: string
    formButtonLabel: string
    subjectOptions: string[]
    infoTitle: string
    infoSubtitle: string
    supportEmail: string
    escalationEmail: string
    phone: string
    officeHours: string
    address: string
    phoneLabel: string
    emailLabel: string
    addressLabel: string
    socialLabel: string
    emailResponseText: string
    locationTitle: string
    locationDescription: string
    directionsLabel: string
    directionsHref: string
    faqTitle: string
    faqs: Array<{
      question: string
      answer: string
    }>
    socialLinks: {
      facebook: string
      twitter: string
      linkedin: string
      instagram: string
    }
    finalCta: {
      title: string
      subtitle: string
      primaryCtaLabel: string
      primaryCtaHref: string
      secondaryCtaLabel: string
      secondaryCtaHref: string
    }
    cards: Array<{
      title: string
      description: string
      ctaLabel: string
      ctaHref: string
    }>
  }
  searchPage: {
    eyebrow: string
    title: string
    highlightedText: string
    subtitle: string
    helperText: string
    trustPoints: string[]
    imageSrc: string
    floatingCardTitle: string
    floatingCardDescription: string
    emptyTitle: string
    emptyDescription: string
  }
  companyPanel: {
    header: {
      panelTitle: string
      panelSubtitle: string
      sidebarBrandLabel: string
      sidebarSubtitle: string
    }
    hero: {
      eyebrow: string
      title: string
      highlightedText: string
      description: string
      imageSrc: string
      trustCardTitle: string
      trustCardSubtitle: string
      trustRatingText: string
      featureChip1Title: string
      featureChip1Description: string
      featureChip2Title: string
      featureChip2Description: string
    }
    sidebar: {
      dashboardLabel: string
      jobRequirementsLabel: string
      applicationsLabel: string
      shortlistedLabel: string
      hiredWorkersLabel: string
      searchWorkersLabel: string
      companyProfileLabel: string
      billingPlanLabel: string
      messagesLabel: string
      settingsLabel: string
    }
    actions: {
      postNewRequirementLabel: string
      browseWorkersLabel: string
    }
    stats: {
      totalJobPostsLabel: string
      totalJobPostsDescription: string
      activeJobPostsLabel: string
      activeJobPostsDescription: string
      totalApplicationsLabel: string
      totalApplicationsDescription: string
      shortlistedLabel: string
      shortlistedDescription: string
    }
    recentJobs: {
      title: string
      viewAllLabel: string
      emptyTitle: string
      emptyDescription: string
      viewDetailsLabel: string
    }
    recentApplications: {
      title: string
      viewAllLabel: string
      emptyTitle: string
      emptyDescription: string
      viewProfileLabel: string
    }
    quickActions: {
      title: string
      items: Array<{
        title: string
        description: string
      }>
    }
    support: {
      title: string
      description: string
      buttonLabel: string
      imageSrc: string
    }
    planSummary: {
      currentPlanLabel: string
      validTillLabel: string
      jobPostsLabel: string
      applicationsLabel: string
      upgradeButtonLabel: string
    }
    upgradeCard: {
      title: string
      description: string
      buttonLabel: string
    }
  }
  legalPages: {
    privacyPolicy: LabourCompanyLegalPageContent
    termsOfService: LabourCompanyLegalPageContent
    userDataDeletion: LabourCompanyLegalPageContent
  }
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-company-website.json')
const TABLE_NAME = 'labour_website_content'
const RECORD_ID = 'company-website'

const defaultContent: LabourCompanyWebsiteContent = {
  theme: {
    brandName: 'ScaleVyapar Rozgar',
    brandTagline: 'Find skilled workers and hire faster across India',
    accentColor: '#0f172a',
    accentSoft: '#e0ecff',
    highlightColor: '#2563eb'
  },
  header: {
    announcement: 'Daily worker hiring for factories, workshops, contractors and growing businesses',
    logoSrc: '/rozgar-logo-source.png',
    logoWidth: '260',
    primaryCtaLabel: 'Post Requirement',
    primaryCtaHref: '/labour/company/job-post',
    navItems: [
      { label: 'Home', href: '/labour/company' },
      { label: 'About Us', href: '/labour/company/about' },
      { label: 'Pricing', href: '/labour/company/pricing' },
      { label: 'Search Worker', href: '/labour/company/search' },
      { label: 'Contact', href: '/labour/company/contact' }
    ]
  },
  footer: {
    description: 'A company hiring website for stitching karighar, embroidery workers, electricians, printer workers, machine setup staff, contractor workers and other daily-basis workforce needs.',
    supportEmail: 'support@scalevyapar.com',
    phone: '+91 98765 43210',
    address: 'Surat, Gujarat, India',
    copyrightText: '© 2026 ScaleVyapar Worker Exchange. All rights reserved.',
    legalLinks: [
      { label: 'Privacy Policy', href: '/labour/company/privacy-policy' },
      { label: 'Terms of Service', href: '/labour/company/terms-of-service' },
      { label: 'User Data Deletion', href: '/labour/company/user-data-deletion' }
    ],
    linkGroups: [
      {
        title: 'Company',
        links: [
          { label: 'Home', href: '/labour/company' },
          { label: 'About Us', href: '/labour/company/about' },
          { label: 'Pricing', href: '/labour/company/pricing' },
          { label: 'Search Worker', href: '/labour/company/search' }
        ]
      },
      {
        title: 'Support',
        links: [
          { label: 'Contact Us', href: '/labour/company/contact' }
        ]
      }
    ]
  },
  home: {
    sectionOrder: ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake'],
    hero: {
      eyebrow: 'India\'s Trusted Worker Hiring Platform',
      title: 'Find Skilled Workers. Hire Faster. Grow Your Business.',
      highlightedText: 'Grow Your Business.',
      subtitle: 'ScaleVyapar helps businesses across India find the right blue and grey-collar workers quickly and reliably. Post your requirements, reach verified workers, and build a stronger workforce.',
      primaryCtaLabel: 'Post Your Requirement',
      primaryCtaHref: '/labour/company/job-post',
      secondaryCtaLabel: 'Find Workers',
      secondaryCtaHref: '/labour/company/search',
      primaryImageSrc: '/worker-hero-reference.png',
      secondaryImageSrc: '/worker-hero-reference.png',
      imageBadgeTitle: 'Trusted by 1000+ Companies Across India',
      imageBadgeSubtitle: 'Verified workers, faster hiring and better workforce visibility.',
      slides: [
        {
          primaryImageSrc: '/worker-hero-reference.png',
          secondaryImageSrc: '/worker-hero-reference.png',
          imageBadgeTitle: 'Trusted by 1000+ Companies Across India',
          imageBadgeSubtitle: 'Verified workers, faster hiring and better workforce visibility.',
          ratingText: '4.8/5'
        },
        {
          primaryImageSrc: '/worker-hero-reference.png',
          secondaryImageSrc: '/worker-hero-reference.png',
          imageBadgeTitle: 'Skilled workers for regular hiring',
          imageBadgeSubtitle: 'Category-focused discovery for factories, workshops and growing teams.',
          ratingText: '4.9/5'
        },
        {
          primaryImageSrc: '/worker-hero-reference.png',
          secondaryImageSrc: '/worker-hero-reference.png',
          imageBadgeTitle: 'Faster matching for active companies',
          imageBadgeSubtitle: 'Post requirements, review applications and build stronger teams.',
          ratingText: '4.8/5'
        }
      ]
    },
    searchBar: {
      title: 'Find the Right Worker for Your Requirement',
      placeholder: 'Search job title, skills or worker type',
      categoryLabel: 'All Categories',
      cityLabel: 'All Cities',
      buttonLabel: 'Search Workers'
    },
    stats: {
      items: [
        { value: '500+', label: 'Verified Workers', icon: 'users' },
        { value: '120+', label: 'Registered Companies', icon: 'building' },
        { value: '300+', label: 'Job Requirements Posted', icon: 'clipboard' },
        { value: '12+', label: 'Industries Covered', icon: 'sparkles' }
      ]
    },
    trustStrip: {
      title: 'Built for fast, local and category-specific worker hiring',
      items: [
        'Verified Workers',
        'Quick Matching',
        'Secure & Reliable'
      ]
    },
    features: {
      eyebrow: 'Why Choose ScaleVyapar',
      title: 'The Smarter Way to Hire Workers',
      subtitle: 'A cleaner company hiring flow built for regular workforce requirements and active worker discovery.',
      cards: [
        {
          icon: 'users',
          title: 'For All Worker Types',
          description: 'Find skilled, semi-skilled and general workers for regular hiring needs.',
          bullets: [
            'Multiple categories',
            'Regular workforce demand',
            'City-wise visibility'
          ]
        },
        {
          icon: 'clipboard',
          title: 'Post Job Instantly',
          description: 'Post requirements in minutes and start receiving suitable worker responses faster.',
          bullets: [
            'Quick posting flow',
            'Guided requirement form',
            'Connected to company panel'
          ]
        },
        {
          icon: 'badge',
          title: 'Only Verified Profiles',
          description: 'Connect with worker profiles that are easier to review and shortlist with confidence.',
          bullets: [
            'Cleaner data visibility',
            'Useful shortlist flow',
            'Reduced stale records'
          ]
        },
        {
          icon: 'search',
          title: 'Fast Worker Matching',
          description: 'Reach the right workers faster through category and city-based discovery.',
          bullets: [
            'Faster discovery',
            'Category-focused search',
            'Better matching signal'
          ]
        },
        {
          icon: 'shield',
          title: 'Secure & Trusted Platform',
          description: 'A structured workflow helps keep hiring more reliable for companies and workers.',
          bullets: [
            'Admin moderation',
            'Better platform trust',
            'Controlled visibility'
          ]
        },
        {
          icon: 'headset',
          title: 'Help, Anytime',
          description: 'Use the company panel and support team when you need help moving a requirement forward.',
          bullets: [
            'Support access',
            'Company-side guidance',
            'Hiring follow-up'
          ]
        }
      ]
    },
    process: {
      eyebrow: 'How It Works',
      title: 'Simple Steps to Hire',
      steps: [
        {
          icon: 'building',
          title: 'Register / Login',
          description: 'Create your company account and complete your profile to begin hiring.'
        },
        {
          icon: 'clipboard',
          title: 'Post Requirement',
          description: 'Add job details, location, skills and number of workers needed.'
        },
        {
          icon: 'users',
          title: 'Get Applications',
          description: 'Receive responses from relevant workers more quickly.'
        },
        {
          icon: 'search',
          title: 'Review & Shortlist',
          description: 'Compare profiles and shortlist the best matches for your business.'
        },
        {
          icon: 'badge',
          title: 'Hire the Best',
          description: 'Connect, interview and hire the right workers with confidence.'
        }
      ]
    },
    pricing: {
      title: 'Company pricing',
      subtitle: 'Keep plans clear, short-validity and easy to understand for market hiring.',
      footnote: 'Displayed plans below are connected to live active company plans from the worker database.'
    },
    testimonials: {
      eyebrow: 'What Companies Say',
      title: 'Trusted by Companies Across India',
      items: [
        {
          quote: 'ScaleVyapar has made hiring easier for our business. We get good quality workers every time.',
          name: 'Rohit Sharma',
          role: 'Operations Head',
          company: 'Textile Unit',
          rating: '5'
        },
        {
          quote: 'We posted a job and received verified and fit profiles within hours. Highly efficient.',
          name: 'Vijay Agarwal',
          role: 'HR Manager',
          company: 'Manufacturing Company',
          rating: '5'
        },
        {
          quote: 'The best platform to quickly find reliable manpower for our projects and seasonal needs.',
          name: 'Neena Khan',
          role: 'CEO',
          company: 'BuildTech',
          rating: '5'
        }
      ]
    },
    categories: {
      eyebrow: 'Worker Categories',
      title: 'Find Workers By Categories',
      buttonLabel: 'View All Categories',
      buttonHref: '/labour/company/search',
      cards: [
        { icon: 'hammer', title: 'Construction & Infrastructure', subtitle: 'On-site workforce and project support', href: '/labour/company/search' },
        { icon: 'factory', title: 'Manufacturing & Factory', subtitle: 'Machine, production and floor teams', href: '/labour/company/search' },
        { icon: 'package', title: 'Packaging & Warehouse', subtitle: 'Packing, loading and dispatch workers', href: '/labour/company/search' },
        { icon: 'truck', title: 'Logistics & Transportation', subtitle: 'Movement, transport and route support', href: '/labour/company/search' },
        { icon: 'wrench', title: 'Maintenance & Electrical', subtitle: 'Repair, servicing and technical help', href: '/labour/company/search' },
        { icon: 'sparkles', title: 'All Categories', subtitle: 'Browse all active worker categories', href: '/labour/company/search' }
      ]
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          question: 'Can I post requirements for more than one worker category?',
          answer: 'Yes. A company can select multiple categories and create multiple worker requirements from the same flow.'
        },
        {
          question: 'Can pricing and plan validity be changed later?',
          answer: 'Yes. Company plans are controlled from the worker admin panel and can be updated there.'
        },
        {
          question: 'Will my requirement go live immediately?',
          answer: 'The current flow creates a pending company with a draft job post so your admin team can review and activate it.'
        }
      ]
    },
    finalCta: {
      eyebrow: 'For Companies',
      title: 'Post Your Requirement & Hire Trusted Workers',
      subtitle: 'Join hundreds of companies across India building better teams every day.',
      buttonLabel: 'Post Requirement Now',
      buttonHref: '/labour/company/job-post'
    },
    intake: {
      title: 'Post company requirement',
      description: 'Submit your company and first job requirement in one go. The worker admin team can review, approve and publish it from the admin panel.',
      submitLabel: 'Create company enquiry'
    },
    workerCta: {
      title: 'Looking for Work?',
      description: 'Create your profile and get hired by top companies looking for skilled workers.',
      buttonLabel: 'Join as Worker',
      buttonHref: '/login'
    }
  },
  aboutPage: {
    hero: {
      eyebrow: 'About ScaleVyapar',
      title: 'India’s Trusted Platform Connecting Companies with Verified Workers',
      highlightedText: 'Verified Workers',
      subtitle: 'ScaleVyapar is built to make worker hiring simple, fast, and reliable for businesses across industries. We connect companies with skilled and verified workers who are actively looking for opportunities.',
      bulletPoints: [
        '100% Verified Workers',
        'Time-Based Active Postings',
        'No Useless Data — Only Active & Relevant Profiles'
      ],
      imageSrc: '/worker-hero-reference.png',
      floatingCardTitle: 'Building a Better Hiring Experience for Everyone',
      floatingCardItems: ['Companies', 'For Workers', 'For Industries']
    },
    missionCards: [
      {
        icon: 'target',
        title: 'Our Mission',
        description: 'To empower businesses by providing access to a pool of verified, skilled, and active workers quickly and efficiently.'
      },
      {
        icon: 'eye',
        title: 'Our Vision',
        description: 'To become India’s most trusted and efficient worker hiring marketplace, creating growth opportunities for both companies and workers.'
      },
      {
        icon: 'shield',
        title: 'Our Promise',
        description: 'We are committed to transparency, data accuracy, and delivering only active and relevant worker profiles.'
      }
    ],
    stats: {
      items: [
        { value: '50,000+', label: 'Verified Workers Across India', icon: 'users' },
        { value: '5,000+', label: 'Registered Companies Trusting ScaleVyapar', icon: 'building' },
        { value: '15,000+', label: 'Jobs Completed Successfully', icon: 'briefcase' },
        { value: '25+', label: 'Industries Covered', icon: 'factory' }
      ]
    },
    whyChoose: {
      eyebrow: 'Why Choose ScaleVyapar',
      title: 'The Smarter Way to Hire Workers',
      cards: [
        {
          icon: 'users',
          title: 'Verified Workers',
          description: 'Every worker is verified for identity, skills, and experience.'
        },
        {
          icon: 'send',
          title: 'Post in Minutes',
          description: 'Post your requirement quickly and start receiving applications.'
        },
        {
          icon: 'clipboard',
          title: 'Quality Matches',
          description: 'Connect with qualified workers who match your exact needs.'
        },
        {
          icon: 'badge',
          title: 'Interview & Hire',
          description: 'Review profiles, interview and hire the right worker with confidence.'
        },
        {
          icon: 'clock',
          title: 'Time Based Posting',
          description: 'Jobs and worker profiles expire automatically after the selected time.'
        },
        {
          icon: 'shield',
          title: 'No Useless Data',
          description: 'We keep our platform clean, active and 100% relevant for you.'
        }
      ]
    },
    process: {
      eyebrow: 'How It Works',
      title: 'Simple Steps to Hire the Right Worker',
      steps: [
        {
          icon: 'building',
          title: 'Register / Login',
          description: 'Create your company account in just a few minutes.'
        },
        {
          icon: 'clipboard',
          title: 'Post Requirement',
          description: 'Tell us what kind of worker you need, skills, location and other details.'
        },
        {
          icon: 'users',
          title: 'Receive Applications',
          description: 'Get applications from verified and interested workers.'
        },
        {
          icon: 'search',
          title: 'Review & Interview',
          description: 'Shortlist workers, check profiles and conduct interviews.'
        },
        {
          icon: 'badge',
          title: 'Hire the Best',
          description: 'Hire the right worker and manage your workforce easily.'
        }
      ]
    },
    testimonials: {
      eyebrow: 'What Our Clients Say',
      title: 'Trusted by Companies Across India',
      items: [
        {
          quote: 'ScaleVyapar has made hiring workers so easy for our factory operations. We get genuine workers quickly.',
          name: 'Rajesh Mehta',
          role: 'Mehta Textiles',
          company: 'Surat',
          rating: '5'
        },
        {
          quote: 'The time-based posting feature is amazing. We only see active and relevant profiles.',
          name: 'Pooja Sharma',
          role: 'Sharma Handicrafts',
          company: 'Jaipur',
          rating: '5'
        },
        {
          quote: 'We have reduced hiring time by 70%. Great platform for finding skilled workers.',
          name: 'Imran Khan',
          role: 'Khan Exports',
          company: 'Delhi',
          rating: '5'
        }
      ]
    },
    finalCta: {
      title: 'Ready to Hire the Right Workers?',
      subtitle: 'Join thousands of companies already using ScaleVyapar to hire verified workers faster and smarter.',
      primaryCtaLabel: 'Post Your Requirement',
      primaryCtaHref: '/labour/company/job-post',
      secondaryCtaLabel: 'Register Company',
      secondaryCtaHref: '/labour/company/company-registration'
    }
  },
  pricingPage: {
    eyebrow: 'Pricing Plans',
    title: 'Simple, Transparent & Affordable Pricing',
    subtitle: 'Choose the right plan for your hiring needs. Post jobs, connect with verified workers and grow your business with ease.',
    benefits: [
      {
        icon: 'shield',
        title: 'Verified & Quality Workers',
        description: '100% verified worker profiles'
      },
      {
        icon: 'clock',
        title: 'Time Based Postings',
        description: 'Only active and relevant jobs'
      },
      {
        icon: 'badge',
        title: 'Secure & Trusted Platform',
        description: 'Safe, reliable & transparent'
      }
    ],
    billing: {
      monthlyLabel: 'Monthly',
      yearlyLabel: 'Yearly',
      savingsLabel: 'Save 20%',
      currencyNote: 'All prices are in ₹ INR'
    },
    plans: [
      {
        name: 'Starter',
        subtitle: 'Perfect for small hiring needs',
        badge: '',
        monthlyPrice: '₹499',
        yearlyPrice: '₹399',
        monthlySuffix: '/month',
        yearlySuffix: '/month billed yearly',
        buttonLabel: 'Get Started',
        buttonHref: '/labour/company/company-registration',
        features: [
          'Post 3 Job Requirements',
          'Valid for 30 Days',
          'Access Basic Worker Profiles',
          'Up to 20 Applications per Job',
          'Email & Phone Support'
        ]
      },
      {
        name: 'Professional',
        subtitle: 'Best for growing businesses',
        badge: 'Most Popular',
        monthlyPrice: '₹999',
        yearlyPrice: '₹799',
        monthlySuffix: '/month',
        yearlySuffix: '/month billed yearly',
        buttonLabel: 'Get Started',
        buttonHref: '/labour/company/company-registration',
        features: [
          'Post 10 Job Requirements',
          'Valid for 30 Days',
          'Access Full Worker Profiles',
          'Up to 100 Applications per Job',
          'Priority Listing of Jobs',
          'Email, Phone & WhatsApp Support'
        ]
      },
      {
        name: 'Enterprise',
        subtitle: 'For large scale hiring needs',
        badge: '',
        monthlyPrice: '₹1,999',
        yearlyPrice: '₹1,599',
        monthlySuffix: '/month',
        yearlySuffix: '/month billed yearly',
        buttonLabel: 'Get Started',
        buttonHref: '/labour/company/company-registration',
        features: [
          'Unlimited Job Requirements',
          'Valid for 30 Days',
          'Access Full Worker Profiles',
          'Unlimited Applications',
          'Featured Job Listing',
          'Dedicated Account Manager',
          'Premium Support'
        ]
      }
    ],
    compareTitle: 'Compare Plans',
    compareRows: [
      {
        icon: 'clipboard',
        feature: 'Job Postings',
        starter: '3 Jobs',
        professional: '10 Jobs',
        enterprise: 'Unlimited'
      },
      {
        icon: 'clock',
        feature: 'Validity',
        starter: '30 Days',
        professional: '30 Days',
        enterprise: '30 Days'
      },
      {
        icon: 'users',
        feature: 'Access to Worker Profiles',
        starter: 'Basic Profiles',
        professional: 'Full Profiles',
        enterprise: 'Full Profiles'
      },
      {
        icon: 'briefcase',
        feature: 'Applications per Job',
        starter: 'Up to 20',
        professional: 'Up to 100',
        enterprise: 'Unlimited'
      },
      {
        icon: 'badge',
        feature: 'Priority Job Listing',
        starter: 'No',
        professional: 'Yes',
        enterprise: 'Yes'
      },
      {
        icon: 'sparkles',
        feature: 'Featured Job Listing',
        starter: 'No',
        professional: 'No',
        enterprise: 'Yes'
      },
      {
        icon: 'shield',
        feature: 'Support',
        starter: 'Email & Phone',
        professional: 'Email, Phone & WhatsApp',
        enterprise: 'Dedicated Support'
      }
    ],
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      {
        question: 'How long is a job post active?',
        answer: 'Each job post remains active for the validity period included in your plan. Time-based postings help keep the platform fresh and relevant.'
      },
      {
        question: 'Can I edit my job post after publishing?',
        answer: 'Yes, you can edit your job post from the company panel if your plan and post status allow editing.'
      },
      {
        question: 'Will my job post be visible to all workers?',
        answer: 'Your job post is shown to relevant workers based on category, city, availability, and matching details.'
      },
      {
        question: 'Are the workers verified?',
        answer: 'ScaleVyapar focuses on active and relevant worker profiles. Verification details depend on the worker profile and admin review process.'
      },
      {
        question: 'Can I upgrade or downgrade my plan?',
        answer: 'Yes, you can upgrade your plan based on your hiring requirement.'
      },
      {
        question: 'Do you offer refunds?',
        answer: 'Refund handling follows the platform refund policy shown on the website.'
      }
    ],
    finalCta: {
      title: 'Ready to Hire the Right Workers?',
      subtitle: 'Join thousands of companies already using ScaleVyapar to hire verified workers faster and smarter.',
      primaryCtaLabel: 'Post Your Requirement',
      primaryCtaHref: '/labour/company/job-post',
      secondaryCtaLabel: 'Register Company',
      secondaryCtaHref: '/labour/company/company-registration'
    }
  },
  signinPage: {
    eyebrow: 'Welcome Back!',
    title: 'Sign In to Your Company Account',
    subtitle: 'Customers can log in using their registered email and password. After successful login, you’ll be redirected to your company dashboard.',
    infoTitle: 'With your company account, you can:',
    infoDescription: 'Secure access to your account dashboard anytime.',
    benefits: [
      'Access your Company Panel and manage your profile',
      'Browse and connect with verified workers',
      'Post job requirements and hire the right talent',
      'Track applications and manage enquiries'
    ],
    primaryCtaLabel: 'Sign In',
    primaryCtaHref: '/labour/company/signin',
    secondaryCtaLabel: 'Register Company',
    secondaryCtaHref: '/labour/company/company-registration',
    loginCard: {
      title: 'Company Sign In',
      subtitle: 'Use your registered email and password',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMeLabel: 'Remember me',
      forgotPasswordLabel: 'Forgot Password?',
      signInButtonLabel: 'Sign In',
      registerCompanyButtonLabel: 'Register Company',
      registerPromptText: 'Don’t have a company account?',
      redirectNoteText: 'After login, you’ll be redirected to your company dashboard.'
    },
    rightPanel: {
      title: 'With your company account, you can:',
      items: [
        {
          title: 'Access Company Panel',
          description: 'Manage your company profile, team and settings.'
        },
        {
          title: 'Post Job Requirements',
          description: 'Create and publish job vacancies in minutes.'
        },
        {
          title: 'Browse Verified Workers',
          description: 'Search and connect with skilled and verified workers.'
        },
        {
          title: 'Track Applications',
          description: 'View and manage applications in one place.'
        },
        {
          title: 'Logged-in Account Access',
          description: 'Secure access to your account dashboard anytime.'
        }
      ]
    },
    banner: {
      imageSrc: '/worker-hero-reference.png',
      title: 'Hiring Made Simple. Workforce Made Strong.',
      description: 'ScaleVyapar Rozgar helps businesses find skilled workers and build a reliable workforce with ease.'
    },
    featureStrip: [
      {
        title: 'Secure Login',
        description: 'Your data and account are protected with industry-standard security.'
      },
      {
        title: 'Verified Access',
        description: 'Only authorized companies can access the company panel and features.'
      },
      {
        title: 'Fast Dashboard Entry',
        description: 'Quick and seamless access to your company dashboard.'
      },
      {
        title: 'Post Jobs Quickly',
        description: 'Create job posts in minutes and reach the right workers instantly.'
      }
    ]
  },
  contactPage: {
    eyebrow: 'Get In Touch',
    title: "We're Here to Help You Hire Better.",
    highlightedText: 'Hire Better.',
    subtitle: 'Have questions or need assistance? Our team is here to help you with everything you need.',
    imageSrc: '/contact-support-photo.png',
    featurePoints: [
      {
        title: 'Quick Support',
        description: 'We respond within 24 hours'
      },
      {
        title: 'Trusted Platform',
        description: '100% safe and reliable'
      },
      {
        title: 'Expert Team',
        description: 'Dedicated support for your business'
      }
    ],
    floatingCardTitle: 'Need Help?',
    floatingCardDescription: 'Our support team is ready to assist you.',
    floatingCardAvailabilityValue: '24h',
    floatingCardAvailabilityLabel: 'Support Available',
    formTitle: 'Send Us a Message',
    formSubtitle: "Fill out the form and we'll get back to you as soon as possible.",
    formButtonLabel: 'Send Message',
    subjectOptions: ['General Enquiry', 'Job Requirement', 'Pricing Support', 'Technical Assistance'],
    infoTitle: 'Contact Information',
    infoSubtitle: 'Reach out to us through any of these channels.',
    supportEmail: 'support@scalevyapar.in',
    escalationEmail: 'hello@scalevyapar.in',
    phone: '+91 63588 36897',
    officeHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
    address: 'ScaleVyapar Private Limited, Surat, Gujarat, India - 395002',
    phoneLabel: 'Phone Number',
    emailLabel: 'Email Address',
    addressLabel: 'Office Address',
    socialLabel: 'Follow Us',
    emailResponseText: 'We reply within 24 hours',
    locationTitle: 'Our Office Location',
    locationDescription: 'Visit us at our office for any in-person support or meeting.',
    directionsLabel: 'Get Directions',
    directionsHref: 'https://www.google.com/maps/search/?api=1&query=ScaleVyapar+Surat+Gujarat',
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      {
        question: 'How can I post a job requirement?',
        answer: 'Use the Post Requirement button to create your requirement, add the needed worker details and publish it for the admin team to review.'
      },
      {
        question: 'How long does it take to get applications?',
        answer: 'Most companies start receiving relevant worker interest shortly after approval, depending on category, city and urgency.'
      },
      {
        question: 'Are the worker profiles verified?',
        answer: 'Yes. ScaleVyapar focuses on verified worker profiles so companies can hire faster with more confidence.'
      },
      {
        question: 'Can I edit my job post after publishing?',
        answer: 'Yes. You can update your requirement details from the company panel whenever changes are needed.'
      },
      {
        question: 'How do I shortlist a worker?',
        answer: 'Open the worker profile or application card and use the shortlist action to save the profile for follow-up.'
      },
      {
        question: 'Do you offer customer support?',
        answer: 'Yes. Our support team is available to help with onboarding, hiring flow questions and account assistance.'
      }
    ],
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    },
    finalCta: {
      title: 'Ready to Hire the Right Workers?',
      subtitle: 'Join thousands of companies already using ScaleVyapar to hire verified workers faster and smarter.',
      primaryCtaLabel: 'Post Your Requirement',
      primaryCtaHref: '/labour/company/job-post',
      secondaryCtaLabel: 'Register Company',
      secondaryCtaHref: '/labour/company/company-registration'
    },
    cards: [
      {
        title: 'Talk to sales',
        description: 'Discuss company pricing, category setup and custom hiring plans.',
        ctaLabel: 'Open pricing page',
        ctaHref: '/labour/company/pricing'
      },
      {
        title: 'Need support',
        description: 'Use the contact team for account activation, plan follow-up and company profile changes.',
        ctaLabel: 'Send company enquiry',
        ctaHref: '/labour/company/company-registration'
      }
    ]
  },
  searchPage: {
    eyebrow: 'Find the Right Worker',
    title: 'Search Verified Workers for Your Requirements',
    highlightedText: 'Your Requirements',
    subtitle: 'Connect with skilled and verified workers across multiple industries. Use filters to find the perfect match for your job.',
    helperText: 'Use the search filters below to find workers who match your hiring needs.',
    trustPoints: [
      '100% Verified Workers',
      'Time Based Active Profiles',
      'No Useless Data Only Relevant Results'
    ],
    imageSrc: '/worker-hero-reference.png',
    floatingCardTitle: 'Find the Best Workers for Your Business',
    floatingCardDescription: 'Verified profiles • Active & relevant • Faster hiring',
    emptyTitle: 'No workers found for the selected filters.',
    emptyDescription: 'Try another combination or clear filters to see more workers.'
  },
  companyPanel: {
    header: {
      panelTitle: 'Company Panel',
      panelSubtitle: 'Manage your hiring workflow, job posts, applications, shortlisted workers and workforce from one place.',
      sidebarBrandLabel: 'ScaleVyapar Company Panel',
      sidebarSubtitle: 'Hire verified workers faster'
    },
    hero: {
      eyebrow: 'Company hiring dashboard',
      title: 'Find the Right Workers. Grow Your Business.',
      highlightedText: 'Grow Your Business.',
      description: 'Post your requirements and connect with verified workers quickly and efficiently.',
      imageSrc: '/worker-hero-reference.png',
      trustCardTitle: 'Trusted by 1000+ Companies Across India',
      trustCardSubtitle: 'Verified profiles • Active & relevant • Faster hiring',
      trustRatingText: '4.8/5',
      featureChip1Title: 'Time Based Posting',
      featureChip1Description: 'Only active and relevant profiles',
      featureChip2Title: 'Verified Workers',
      featureChip2Description: '100% verified and trusted'
    },
    sidebar: {
      dashboardLabel: 'Dashboard',
      jobRequirementsLabel: 'Job Requirements',
      applicationsLabel: 'Applications',
      shortlistedLabel: 'Shortlisted',
      hiredWorkersLabel: 'Hired Workers',
      searchWorkersLabel: 'Search Workers',
      companyProfileLabel: 'Company Profile',
      billingPlanLabel: 'Billing & Plan',
      messagesLabel: 'Messages',
      settingsLabel: 'Settings'
    },
    actions: {
      postNewRequirementLabel: 'Post New Requirement',
      browseWorkersLabel: 'Browse Workers'
    },
    stats: {
      totalJobPostsLabel: 'Total Job Posts',
      totalJobPostsDescription: 'Active & Closed',
      activeJobPostsLabel: 'Active Job Posts',
      activeJobPostsDescription: 'Currently Live',
      totalApplicationsLabel: 'Total Applications',
      totalApplicationsDescription: 'Across All Jobs',
      shortlistedLabel: 'Shortlisted',
      shortlistedDescription: 'Potential Matches'
    },
    recentJobs: {
      title: 'Recent Job Posts',
      viewAllLabel: 'View All Job Posts',
      emptyTitle: 'No recent job posts yet.',
      emptyDescription: 'Post your first requirement to start hiring.',
      viewDetailsLabel: 'View Details'
    },
    recentApplications: {
      title: 'Recent Applications',
      viewAllLabel: 'View All Applications',
      emptyTitle: 'No applications yet.',
      emptyDescription: 'Applications will appear here after workers apply.',
      viewProfileLabel: 'View Profile'
    },
    quickActions: {
      title: 'Quick Actions',
      items: [
        {
          title: 'Post New Requirement',
          description: 'Post a new job and find the right worker'
        },
        {
          title: 'Browse Workers',
          description: 'Search and filter workers as per your need'
        },
        {
          title: 'View All Applications',
          description: 'Review applications for your job posts'
        },
        {
          title: 'Shortlisted Workers',
          description: 'Manage shortlisted worker profiles'
        },
        {
          title: 'Hired Workers',
          description: 'View and manage your hired workforce'
        }
      ]
    },
    support: {
      title: 'Need Help?',
      description: 'Our support team is here to help you with any queries.',
      buttonLabel: 'Contact Support',
      imageSrc: ''
    },
    planSummary: {
      currentPlanLabel: 'Your Current Plan',
      validTillLabel: 'Valid Till',
      jobPostsLabel: 'Job Posts',
      applicationsLabel: 'Applications',
      upgradeButtonLabel: 'Upgrade Plan'
    },
    upgradeCard: {
      title: 'Upgrade Your Plan',
      description: 'Get more visibility, unlimited job posts and premium support.',
      buttonLabel: 'Upgrade Now'
    }
  },
  legalPages: {
    privacyPolicy: {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      subtitle: 'ScaleVyapar Rozgar collects only the business and contact information needed to help companies discover workers, manage enquiries, and communicate about hiring activity.',
      sections: [
        {
          title: 'Information we collect',
          body: 'We may collect company name, contact person name, phone numbers, email addresses, city, hiring preferences, and communication history submitted through the company website or worker administration tools.'
        },
        {
          title: 'How we use information',
          body: 'We use submitted information to respond to enquiries, match companies with available workers, manage job post activity, send service updates, and improve marketplace operations and support quality.'
        },
        {
          title: 'Sharing and retention',
          body: 'Information is shared only with authorised ScaleVyapar systems, support workflows, and service providers needed to operate the platform. We retain data only as long as necessary for hiring support, legal compliance, and operational recordkeeping.'
        },
        {
          title: 'Contact',
          body: 'For privacy questions, contact support@scalevyapar.com or use the support number +91 98765 43210.'
        }
      ]
    },
    termsOfService: {
      eyebrow: 'Legal',
      title: 'Terms of Service',
      subtitle: 'By using the ScaleVyapar Rozgar company site, you agree to use the service only for genuine hiring, worker search, and related business communication.',
      sections: [
        {
          title: 'Permitted use',
          body: 'You may use this site to enquire about workers, create hiring requests, review plans, and communicate with ScaleVyapar support regarding company-side recruitment activity.'
        },
        {
          title: 'Accurate information',
          body: 'You agree to provide accurate company, contact, and hiring information. False, misleading, abusive, or unlawful usage may lead to account restriction or removal from the platform.'
        },
        {
          title: 'Service availability',
          body: 'ScaleVyapar may update, improve, suspend, or limit parts of the service to maintain quality, compliance, and operational stability. We do not guarantee uninterrupted availability at all times.'
        },
        {
          title: 'Support and disputes',
          body: 'For support, billing, or service questions, contact support@scalevyapar.com. Continued use of the service after updates to these terms constitutes acceptance of the revised terms.'
        }
      ]
    },
    userDataDeletion: {
      eyebrow: 'Legal',
      title: 'User Data Deletion',
      subtitle: 'If you want ScaleVyapar Rozgar to delete company-side enquiry or contact data associated with your business, please send a request using the steps below.',
      sections: [
        {
          title: 'How to request deletion',
          body: 'Email support@scalevyapar.com with the subject line User Data Deletion Request and include your company name, contact number, and the email address used on the platform.'
        },
        {
          title: 'Verification',
          body: 'We may contact you to verify ownership of the company record before deleting any data, so we can protect against accidental or fraudulent deletion requests.'
        },
        {
          title: 'What gets removed',
          body: 'After verification, we will delete or anonymise eligible company enquiry data, support messages, and related records unless retention is required for billing, security, fraud prevention, or legal compliance.'
        },
        {
          title: 'Response time',
          body: 'We aim to review deletion requests promptly and respond through support@scalevyapar.com or +91 98765 43210.'
        }
      ]
    }
  }
}

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const ensureDataFile = async () => {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true })

  try {
    await fs.access(DATA_FILE_PATH)
  } catch {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultContent, null, 2), 'utf8')
  }
}

const readJsonContent = async (): Promise<LabourCompanyWebsiteContent> => {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf8')
  return JSON.parse(raw) as LabourCompanyWebsiteContent
}

const writeJsonContent = async (content: LabourCompanyWebsiteContent) => {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(content, null, 2), 'utf8')
}

const uniqueSections = (sections: LabourCompanyWebsiteSection[]) => {
  const allowed: LabourCompanyWebsiteSection[] = ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake']
  const seen = new Set<LabourCompanyWebsiteSection>()
  const ordered = sections.filter(section => allowed.includes(section) && !seen.has(section) && seen.add(section))
  return ordered.length ? ordered : defaultContent.home.sectionOrder
}

const mergeLinkGroups = (input: unknown, fallback: LabourCompanyWebsiteContent['footer']['linkGroups']) => {
  if (!Array.isArray(input)) return fallback
  return input.map((group, groupIndex) => {
    const nextGroup = typeof group === 'object' && group ? group as Record<string, unknown> : {}
    const fallbackGroup = fallback[groupIndex] || fallback[0]
    return {
      title: typeof nextGroup.title === 'string' && nextGroup.title.trim() ? nextGroup.title : fallbackGroup.title,
      links: Array.isArray(nextGroup.links)
        ? nextGroup.links.map((link, linkIndex) => {
          const nextLink = typeof link === 'object' && link ? link as Record<string, unknown> : {}
          const fallbackLink = fallbackGroup.links[linkIndex] || fallbackGroup.links[0]
          return {
            label: typeof nextLink.label === 'string' && nextLink.label.trim() ? nextLink.label : fallbackLink.label,
            href: typeof nextLink.href === 'string' && nextLink.href.trim() ? nextLink.href : fallbackLink.href
          }
        })
        : fallbackGroup.links
    }
  })
}

const sanitizePublicFooterLinkGroups = (groups: LabourCompanyWebsiteContent['footer']['linkGroups']) =>
  groups
    .map(group => ({
      ...group,
      links: group.links.filter(link => !link.href.startsWith('/admin/') && !/website editor/i.test(link.label))
    }))
    .filter(group => group.links.length > 0)

const normalizeCompanyRegistrationHref = (value: string | undefined, fallback: string) => {
  const href = typeof value === 'string' && value.trim() ? value.trim() : fallback
  const normalized = href.replace(/\\/g, '/')
  if (
    normalized === '#company-intake' ||
    normalized === '/labour/company#company-intake' ||
    normalized === 'labour/company#company-intake' ||
    normalized === '/labour/company/post-requirement' ||
    normalized === 'labour/company/post-requirement'
  ) {
    return '/labour/company/company-registration'
  }

  return normalized
}

const normalizeJobPostHref = (value: string | undefined, fallback: string) => {
  const href = typeof value === 'string' && value.trim() ? value.trim() : fallback
  const normalized = href.replace(/\\/g, '/')

  if (
    normalized === '#company-intake' ||
    normalized === '/labour/company#company-intake' ||
    normalized === 'labour/company#company-intake' ||
    normalized === '/labour/company/post-requirement' ||
    normalized === 'labour/company/post-requirement' ||
    normalized === '/labour/company/company-registration' ||
    normalized === 'labour/company/company-registration'
  ) {
    return '/labour/company/job-post'
  }

  return normalized
}

const mergeFooterLinks = (input: unknown, fallback: LabourCompanyWebsiteContent['footer']['legalLinks']) => {
  if (!Array.isArray(input) || !input.length) return fallback
  return input.map((link, index) => {
    const nextLink = typeof link === 'object' && link ? link as Record<string, unknown> : {}
    const fallbackLink = fallback[index] || fallback[0]
    return {
      label: typeof nextLink.label === 'string' && nextLink.label.trim() ? nextLink.label : fallbackLink.label,
      href: typeof nextLink.href === 'string' && nextLink.href.trim() ? nextLink.href : fallbackLink.href
    }
  })
}

const mergeLegalSections = (input: unknown, fallback: LabourCompanyLegalPageSection[]) => {
  if (!Array.isArray(input) || !input.length) return fallback
  return input.map((section, index) => {
    const nextSection = typeof section === 'object' && section ? section as Record<string, unknown> : {}
    const fallbackSection = fallback[index] || fallback[Math.max(fallback.length - 1, 0)]
    return {
      title: typeof nextSection.title === 'string' && nextSection.title.trim() ? nextSection.title : fallbackSection.title,
      body: typeof nextSection.body === 'string' && nextSection.body.trim() ? nextSection.body : fallbackSection.body
    }
  })
}

const mergeLegalPage = (input: unknown, fallback: LabourCompanyLegalPageContent): LabourCompanyLegalPageContent => {
  const nextPage = typeof input === 'object' && input ? input as Record<string, unknown> : {}
  return {
    eyebrow: typeof nextPage.eyebrow === 'string' && nextPage.eyebrow.trim() ? nextPage.eyebrow : fallback.eyebrow,
    title: typeof nextPage.title === 'string' && nextPage.title.trim() ? nextPage.title : fallback.title,
    subtitle: typeof nextPage.subtitle === 'string' && nextPage.subtitle.trim() ? nextPage.subtitle : fallback.subtitle,
    sections: mergeLegalSections(nextPage.sections, fallback.sections)
  }
}

const mapLegacyContent = (legacy: Record<string, unknown>): Partial<LabourCompanyWebsiteContent> => ({
  theme: {
    brandName: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).brandName === 'string'
      ? (legacy.theme as Record<string, string>).brandName
      : defaultContent.theme.brandName,
    brandTagline: defaultContent.theme.brandTagline,
    accentColor: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).accentColor === 'string'
      ? (legacy.theme as Record<string, string>).accentColor
      : defaultContent.theme.accentColor,
    accentSoft: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).accentSoft === 'string'
      ? (legacy.theme as Record<string, string>).accentSoft
      : defaultContent.theme.accentSoft,
    highlightColor: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).highlightColor === 'string'
      ? (legacy.theme as Record<string, string>).highlightColor
      : defaultContent.theme.highlightColor
  },
  home: {
    ...defaultContent.home,
    sectionOrder: uniqueSections(Array.isArray(legacy.sectionOrder) ? legacy.sectionOrder as LabourCompanyWebsiteSection[] : defaultContent.home.sectionOrder),
    hero: typeof legacy.hero === 'object' && legacy.hero ? { ...defaultContent.home.hero, ...(legacy.hero as Record<string, string>) } : defaultContent.home.hero,
    searchBar: typeof legacy.searchBar === 'object' && legacy.searchBar
      ? { ...defaultContent.home.searchBar, ...(legacy.searchBar as Record<string, string>) }
      : defaultContent.home.searchBar,
    stats: typeof legacy.stats === 'object' && legacy.stats
      ? {
          items: Array.isArray((legacy.stats as Record<string, unknown>).items)
            ? (legacy.stats as Record<string, never>).items as LabourCompanyWebsiteContent['home']['stats']['items']
            : defaultContent.home.stats.items
        }
      : defaultContent.home.stats,
    trustStrip: typeof legacy.trustStrip === 'object' && legacy.trustStrip
      ? {
          title: typeof (legacy.trustStrip as Record<string, unknown>).title === 'string' ? (legacy.trustStrip as Record<string, string>).title : defaultContent.home.trustStrip.title,
          items: Array.isArray((legacy.trustStrip as Record<string, unknown>).items) ? (legacy.trustStrip as Record<string, string[]>).items : defaultContent.home.trustStrip.items
        }
      : defaultContent.home.trustStrip,
    features: typeof legacy.features === 'object' && legacy.features
      ? {
          eyebrow: typeof (legacy.features as Record<string, unknown>).eyebrow === 'string' ? (legacy.features as Record<string, string>).eyebrow : defaultContent.home.features.eyebrow,
          title: typeof (legacy.features as Record<string, unknown>).title === 'string' ? (legacy.features as Record<string, string>).title : defaultContent.home.features.title,
          subtitle: typeof (legacy.features as Record<string, unknown>).subtitle === 'string' ? (legacy.features as Record<string, string>).subtitle : defaultContent.home.features.subtitle,
          cards: Array.isArray((legacy.features as Record<string, unknown>).cards) ? (legacy.features as Record<string, never>).cards as LabourCompanyWebsiteContent['home']['features']['cards'] : defaultContent.home.features.cards
        }
      : defaultContent.home.features,
    process: typeof legacy.process === 'object' && legacy.process
      ? {
          eyebrow: typeof (legacy.process as Record<string, unknown>).eyebrow === 'string' ? (legacy.process as Record<string, string>).eyebrow : defaultContent.home.process.eyebrow,
          title: typeof (legacy.process as Record<string, unknown>).title === 'string' ? (legacy.process as Record<string, string>).title : defaultContent.home.process.title,
          steps: Array.isArray((legacy.process as Record<string, unknown>).steps) ? (legacy.process as Record<string, never>).steps as LabourCompanyWebsiteContent['home']['process']['steps'] : defaultContent.home.process.steps
        }
      : defaultContent.home.process,
    pricing: typeof legacy.pricing === 'object' && legacy.pricing ? { ...defaultContent.home.pricing, ...(legacy.pricing as Record<string, string>) } : defaultContent.home.pricing,
    testimonials: typeof legacy.testimonials === 'object' && legacy.testimonials
      ? {
          eyebrow: typeof (legacy.testimonials as Record<string, unknown>).eyebrow === 'string' ? (legacy.testimonials as Record<string, string>).eyebrow : defaultContent.home.testimonials.eyebrow,
          title: typeof (legacy.testimonials as Record<string, unknown>).title === 'string' ? (legacy.testimonials as Record<string, string>).title : defaultContent.home.testimonials.title,
          items: Array.isArray((legacy.testimonials as Record<string, unknown>).items) ? (legacy.testimonials as Record<string, never>).items as LabourCompanyWebsiteContent['home']['testimonials']['items'] : defaultContent.home.testimonials.items
        }
      : defaultContent.home.testimonials,
    categories: typeof legacy.categories === 'object' && legacy.categories
      ? {
          eyebrow: typeof (legacy.categories as Record<string, unknown>).eyebrow === 'string' ? (legacy.categories as Record<string, string>).eyebrow : defaultContent.home.categories.eyebrow,
          title: typeof (legacy.categories as Record<string, unknown>).title === 'string' ? (legacy.categories as Record<string, string>).title : defaultContent.home.categories.title,
          buttonLabel: typeof (legacy.categories as Record<string, unknown>).buttonLabel === 'string' ? (legacy.categories as Record<string, string>).buttonLabel : defaultContent.home.categories.buttonLabel,
          buttonHref: typeof (legacy.categories as Record<string, unknown>).buttonHref === 'string' ? (legacy.categories as Record<string, string>).buttonHref : defaultContent.home.categories.buttonHref,
          cards: Array.isArray((legacy.categories as Record<string, unknown>).cards) ? (legacy.categories as Record<string, never>).cards as LabourCompanyWebsiteContent['home']['categories']['cards'] : defaultContent.home.categories.cards
        }
      : defaultContent.home.categories,
    faq: typeof legacy.faq === 'object' && legacy.faq
      ? {
          title: typeof (legacy.faq as Record<string, unknown>).title === 'string' ? (legacy.faq as Record<string, string>).title : defaultContent.home.faq.title,
          items: Array.isArray((legacy.faq as Record<string, unknown>).items) ? (legacy.faq as Record<string, never>).items as LabourCompanyWebsiteContent['home']['faq']['items'] : defaultContent.home.faq.items
        }
      : defaultContent.home.faq,
    finalCta: typeof legacy.finalCta === 'object' && legacy.finalCta ? { ...defaultContent.home.finalCta, ...(legacy.finalCta as Record<string, string>) } : defaultContent.home.finalCta,
    workerCta: typeof legacy.workerCta === 'object' && legacy.workerCta ? { ...defaultContent.home.workerCta, ...(legacy.workerCta as Record<string, string>) } : defaultContent.home.workerCta
  }
})

const COMPANY_COPY_SKIP_KEYS = new Set([
  'href',
  'ctaHref',
  'primaryCtaHref',
  'secondaryCtaHref',
  'buttonHref',
  'logoSrc',
  'supportEmail',
  'escalationEmail',
  'phone'
])

const rewriteCompanyFacingLabourCopy = (value: string) =>
  value
    .replace(/\bLabours\b/g, 'Workers')
    .replace(/\blabours\b/g, 'workers')
    .replace(/\bLabour\b/g, 'Worker')
    .replace(/\blabour\b/g, 'worker')

const applyCompanyFacingCopy = (input: unknown, parentKey?: string): unknown => {
  if (typeof input === 'string') {
    return COMPANY_COPY_SKIP_KEYS.has(parentKey || '') ? input : rewriteCompanyFacingLabourCopy(input)
  }

  if (Array.isArray(input)) {
    return input.map(item => applyCompanyFacingCopy(item, parentKey))
  }

  if (!input || typeof input !== 'object') {
    return input
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, applyCompanyFacingCopy(value, key)])
  )
}

const LEGACY_REFERENCE_HOMEPAGE = {
  heroEyebrow: 'Hiring for factories, workshops and contractors',
  heroTitle: 'Hire daily-basis workers faster across stitching, embroidery, machine setup, printer work, electrician jobs and more.',
  heroSubtitle: 'A dedicated company hiring website for worker demand. Post your requirement, choose a low-cost plan, and connect with relevant workers in your city.',
  featureTitle: 'What companies get',
  processTitle: 'How the company flow works',
  testimonialTitle: 'Why this model works',
  finalCtaTitle: 'Start hiring your next worker team'
} as const

const LEGACY_REFERENCE_CONTACT = {
  title: 'Contact the ScaleVyapar worker hiring team',
  subtitle: 'Use this page for support, sales follow-up, activation help and pricing discussions.',
  supportEmail: 'support@scalevyapar.com',
  phone: '+91 98765 43210'
} as const

const refreshReferenceHomepageTheme = (content: LabourCompanyWebsiteContent): LabourCompanyWebsiteContent => {
  const next = structuredClone(content)

  if (
    /^Hire daily-basis workers? faster across industries/i.test(next.theme.brandTagline) ||
    /^Hire daily-basis worker faster across industries/i.test(next.theme.brandTagline)
  ) {
    next.theme.brandTagline = defaultContent.theme.brandTagline
  }

  if (
    next.home.hero.eyebrow === LEGACY_REFERENCE_HOMEPAGE.heroEyebrow ||
    /factories,\s*workshops and contractors/i.test(next.home.hero.eyebrow)
  ) {
    next.home.hero.eyebrow = defaultContent.home.hero.eyebrow
  }

  if (
    next.home.hero.title === LEGACY_REFERENCE_HOMEPAGE.heroTitle ||
    /^Hire daily-basis/i.test(next.home.hero.title)
  ) {
    next.home.hero.title = defaultContent.home.hero.title
  }

  if (
    next.home.hero.highlightedText === defaultContent.home.hero.highlightedText &&
    !next.home.hero.title.includes(next.home.hero.highlightedText)
  ) {
    next.home.hero.highlightedText = defaultContent.home.hero.highlightedText
  }

  if (
    next.home.hero.subtitle === LEGACY_REFERENCE_HOMEPAGE.heroSubtitle ||
    /^A dedicated company hiring website/i.test(next.home.hero.subtitle)
  ) {
    next.home.hero.subtitle = defaultContent.home.hero.subtitle
  }

  if (next.home.hero.secondaryCtaLabel === 'See Pricing') {
    next.home.hero.secondaryCtaLabel = defaultContent.home.hero.secondaryCtaLabel
    next.home.hero.secondaryCtaHref = defaultContent.home.hero.secondaryCtaHref
  }

  if (
    next.home.trustStrip.items.some(item =>
      /daily-basis|company plan control|city-wise demand|short-validity urgent/i.test(item)
    )
  ) {
    next.home.trustStrip = defaultContent.home.trustStrip
  }

  if (next.home.features.title === LEGACY_REFERENCE_HOMEPAGE.featureTitle) {
    next.home.features = defaultContent.home.features
  }

  if (next.home.process.title === LEGACY_REFERENCE_HOMEPAGE.processTitle) {
    next.home.process = defaultContent.home.process
  }

  if (next.home.testimonials.title === LEGACY_REFERENCE_HOMEPAGE.testimonialTitle) {
    next.home.testimonials = defaultContent.home.testimonials
  }

  if (
    !next.home.categories.cards.length ||
    next.home.categories.cards.every(card => card.href === '/labour/company/search')
  ) {
    next.home.categories = defaultContent.home.categories
  }

  if (
    next.home.finalCta.title === LEGACY_REFERENCE_HOMEPAGE.finalCtaTitle ||
    /^Start hiring your next/i.test(next.home.finalCta.title)
  ) {
    next.home.finalCta = defaultContent.home.finalCta
  }

  if (next.home.workerCta.buttonHref === '/login') {
    next.home.workerCta = defaultContent.home.workerCta
  }

  const hasLegacyContactCopy =
    next.contactPage.title === LEGACY_REFERENCE_CONTACT.title ||
    next.contactPage.subtitle === LEGACY_REFERENCE_CONTACT.subtitle ||
    next.contactPage.supportEmail === LEGACY_REFERENCE_CONTACT.supportEmail ||
    next.contactPage.phone === LEGACY_REFERENCE_CONTACT.phone ||
    /^Talk to sales$/i.test(next.contactPage.cards[0]?.title || '') ||
    /^Need support$/i.test(next.contactPage.cards[1]?.title || '')

  if (hasLegacyContactCopy) {
    next.contactPage = {
      ...defaultContent.contactPage,
      socialLinks: {
        ...defaultContent.contactPage.socialLinks,
        ...next.contactPage.socialLinks
      },
      directionsHref: next.contactPage.directionsHref?.trim() || defaultContent.contactPage.directionsHref
    }
  }

  return next
}

const normalizeContent = (raw: unknown): LabourCompanyWebsiteContent => {
  if (!raw || typeof raw !== 'object') {
    return defaultContent
  }

  const source = raw as Record<string, unknown>
  const legacyPatch = !source.header || !source.footer || !source.home ? mapLegacyContent(source) : {}
  const merged = {
    ...defaultContent,
    ...legacyPatch,
    ...source
  } as LabourCompanyWebsiteContent

  const sanitizedLogoSrc = (() => {
    if (typeof merged.header?.logoSrc !== 'string' || !merged.header.logoSrc.trim()) {
      return defaultContent.header.logoSrc
    }

    const normalized = merged.header.logoSrc.trim().replace(/\.pwg$/i, '.png')
    return normalized.startsWith('/') ? normalized : `/${normalized}`
  })()

  const sanitizedLogoWidth = (() => {
    const parsed = Number(
      typeof merged.header?.logoWidth === 'string' || typeof merged.header?.logoWidth === 'number'
        ? `${merged.header.logoWidth}`.trim()
        : defaultContent.header.logoWidth
    )

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return defaultContent.header.logoWidth
    }

    return String(Math.round(parsed))
  })()

  const normalizedContent = {
    theme: {
      brandName: merged.theme?.brandName || defaultContent.theme.brandName,
      brandTagline: merged.theme?.brandTagline || defaultContent.theme.brandTagline,
      accentColor: merged.theme?.accentColor || defaultContent.theme.accentColor,
      accentSoft: merged.theme?.accentSoft || defaultContent.theme.accentSoft,
      highlightColor: merged.theme?.highlightColor || defaultContent.theme.highlightColor
    },
    header: {
      announcement: merged.header?.announcement || defaultContent.header.announcement,
      logoSrc: sanitizedLogoSrc,
      logoWidth: sanitizedLogoWidth,
      primaryCtaLabel: merged.header?.primaryCtaLabel || defaultContent.header.primaryCtaLabel,
      primaryCtaHref: normalizeJobPostHref(
        merged.header?.primaryCtaHref,
        defaultContent.header.primaryCtaHref
      ),
      navItems: Array.isArray(merged.header?.navItems) && merged.header.navItems.length
        ? merged.header.navItems.map(item => ({
            label: item.label || 'Link',
            href: item.href || '/labour/company'
          }))
        : defaultContent.header.navItems
    },
    footer: {
      description: merged.footer?.description || defaultContent.footer.description,
      supportEmail: merged.footer?.supportEmail || defaultContent.footer.supportEmail,
      phone: merged.footer?.phone || defaultContent.footer.phone,
      address: merged.footer?.address || defaultContent.footer.address,
      copyrightText: merged.footer?.copyrightText || defaultContent.footer.copyrightText,
      legalLinks: mergeFooterLinks(merged.footer?.legalLinks, defaultContent.footer.legalLinks),
      linkGroups: sanitizePublicFooterLinkGroups(mergeLinkGroups(merged.footer?.linkGroups, defaultContent.footer.linkGroups))
    },
    home: {
      sectionOrder: uniqueSections(merged.home?.sectionOrder || defaultContent.home.sectionOrder),
      hero: {
        ...defaultContent.home.hero,
        ...merged.home?.hero,
        primaryCtaHref: normalizeJobPostHref(
          merged.home?.hero?.primaryCtaHref,
          defaultContent.home.hero.primaryCtaHref
        ),
        secondaryCtaHref: merged.home?.hero?.secondaryCtaHref || defaultContent.home.hero.secondaryCtaHref,
        slides: Array.isArray(merged.home?.hero?.slides) && merged.home.hero.slides.length
          ? merged.home.hero.slides.slice(0, 5).map((slide, index) => {
              const fallback = defaultContent.home.hero.slides[index] || defaultContent.home.hero.slides[0]
              return {
                primaryImageSrc: slide?.primaryImageSrc || fallback.primaryImageSrc,
                secondaryImageSrc: slide?.secondaryImageSrc || slide?.primaryImageSrc || fallback.secondaryImageSrc,
                imageBadgeTitle: slide?.imageBadgeTitle || fallback.imageBadgeTitle,
                imageBadgeSubtitle: slide?.imageBadgeSubtitle || fallback.imageBadgeSubtitle,
                ratingText: slide?.ratingText || fallback.ratingText
              }
            })
          : defaultContent.home.hero.slides
      },
      searchBar: {
        ...defaultContent.home.searchBar,
        ...merged.home?.searchBar
      },
      stats: {
        items: Array.isArray(merged.home?.stats?.items) && merged.home.stats.items.length
          ? merged.home.stats.items.map((item, index) => {
              const fallback = defaultContent.home.stats.items[index] || defaultContent.home.stats.items[0]
              return {
                value: item?.value || fallback.value,
                label: item?.label || fallback.label,
                icon: item?.icon || fallback.icon
              }
            })
          : defaultContent.home.stats.items
      },
      trustStrip: {
        title: merged.home?.trustStrip?.title || defaultContent.home.trustStrip.title,
        items: Array.isArray(merged.home?.trustStrip?.items) ? merged.home.trustStrip.items : defaultContent.home.trustStrip.items
      },
      features: {
        eyebrow: merged.home?.features?.eyebrow || defaultContent.home.features.eyebrow,
        title: merged.home?.features?.title || defaultContent.home.features.title,
        subtitle: merged.home?.features?.subtitle || defaultContent.home.features.subtitle,
        cards: Array.isArray(merged.home?.features?.cards) && merged.home.features.cards.length
          ? merged.home.features.cards.map((card, index) => {
              const fallback = defaultContent.home.features.cards[index] || defaultContent.home.features.cards[0]
              return {
                icon: card?.icon || fallback.icon,
                title: card?.title || fallback.title,
                description: card?.description || fallback.description,
                bullets: Array.isArray(card?.bullets) && card.bullets.length ? card.bullets : fallback.bullets
              }
            })
          : defaultContent.home.features.cards
      },
      process: {
        eyebrow: merged.home?.process?.eyebrow || defaultContent.home.process.eyebrow,
        title: merged.home?.process?.title || defaultContent.home.process.title,
        steps: Array.isArray(merged.home?.process?.steps) && merged.home.process.steps.length
          ? merged.home.process.steps.map((step, index) => {
              const fallback = defaultContent.home.process.steps[index] || defaultContent.home.process.steps[0]
              return {
                icon: step?.icon || fallback.icon,
                title: step?.title || fallback.title,
                description: step?.description || fallback.description
              }
            })
          : defaultContent.home.process.steps
      },
      pricing: { ...defaultContent.home.pricing, ...merged.home?.pricing },
      testimonials: {
        eyebrow: merged.home?.testimonials?.eyebrow || defaultContent.home.testimonials.eyebrow,
        title: merged.home?.testimonials?.title || defaultContent.home.testimonials.title,
        items: Array.isArray(merged.home?.testimonials?.items) && merged.home.testimonials.items.length
          ? merged.home.testimonials.items.map((item, index) => {
              const fallback = defaultContent.home.testimonials.items[index] || defaultContent.home.testimonials.items[0]
              return {
                quote: item?.quote || fallback.quote,
                name: item?.name || fallback.name,
                role: item?.role || fallback.role,
                company: item?.company || fallback.company,
                rating: item?.rating || fallback.rating
              }
            })
          : defaultContent.home.testimonials.items
      },
      categories: {
        eyebrow: merged.home?.categories?.eyebrow || defaultContent.home.categories.eyebrow,
        title: merged.home?.categories?.title || defaultContent.home.categories.title,
        buttonLabel: merged.home?.categories?.buttonLabel || defaultContent.home.categories.buttonLabel,
        buttonHref: merged.home?.categories?.buttonHref || defaultContent.home.categories.buttonHref,
        cards: Array.isArray(merged.home?.categories?.cards) && merged.home.categories.cards.length
          ? merged.home.categories.cards.map((card, index) => {
              const fallback = defaultContent.home.categories.cards[index] || defaultContent.home.categories.cards[0]
              return {
                icon: card?.icon || fallback.icon,
                title: card?.title || fallback.title,
                subtitle: card?.subtitle || fallback.subtitle,
                href: card?.href || fallback.href
              }
            })
          : defaultContent.home.categories.cards
      },
      faq: {
        title: merged.home?.faq?.title || defaultContent.home.faq.title,
        items: Array.isArray(merged.home?.faq?.items) && merged.home.faq.items.length ? merged.home.faq.items : defaultContent.home.faq.items
      },
      finalCta: {
        ...defaultContent.home.finalCta,
        ...merged.home?.finalCta,
        buttonHref: normalizeJobPostHref(
          merged.home?.finalCta?.buttonHref,
          defaultContent.home.finalCta.buttonHref
        )
      },
      intake: { ...defaultContent.home.intake, ...merged.home?.intake },
      workerCta: {
        ...defaultContent.home.workerCta,
        ...merged.home?.workerCta
      }
    },
    aboutPage: {
      hero: {
        ...defaultContent.aboutPage.hero,
        ...merged.aboutPage?.hero,
        bulletPoints: Array.isArray(merged.aboutPage?.hero?.bulletPoints) && merged.aboutPage.hero.bulletPoints.length
          ? merged.aboutPage.hero.bulletPoints
          : defaultContent.aboutPage.hero.bulletPoints,
        floatingCardItems: Array.isArray(merged.aboutPage?.hero?.floatingCardItems) && merged.aboutPage.hero.floatingCardItems.length
          ? merged.aboutPage.hero.floatingCardItems
          : defaultContent.aboutPage.hero.floatingCardItems
      },
      missionCards: Array.isArray(merged.aboutPage?.missionCards) && merged.aboutPage.missionCards.length
        ? merged.aboutPage.missionCards.map((card, index) => {
            const fallback = defaultContent.aboutPage.missionCards[index] || defaultContent.aboutPage.missionCards[0]
            return {
              icon: card?.icon || fallback.icon,
              title: card?.title || fallback.title,
              description: card?.description || fallback.description
            }
          })
        : defaultContent.aboutPage.missionCards,
      stats: {
        items: Array.isArray(merged.aboutPage?.stats?.items) && merged.aboutPage.stats.items.length
          ? merged.aboutPage.stats.items.map((item, index) => {
              const fallback = defaultContent.aboutPage.stats.items[index] || defaultContent.aboutPage.stats.items[0]
              return {
                value: item?.value || fallback.value,
                label: item?.label || fallback.label,
                icon: item?.icon || fallback.icon
              }
            })
          : defaultContent.aboutPage.stats.items
      },
      whyChoose: {
        eyebrow: merged.aboutPage?.whyChoose?.eyebrow || defaultContent.aboutPage.whyChoose.eyebrow,
        title: merged.aboutPage?.whyChoose?.title || defaultContent.aboutPage.whyChoose.title,
        cards: Array.isArray(merged.aboutPage?.whyChoose?.cards) && merged.aboutPage.whyChoose.cards.length
          ? merged.aboutPage.whyChoose.cards.map((card, index) => {
              const fallback = defaultContent.aboutPage.whyChoose.cards[index] || defaultContent.aboutPage.whyChoose.cards[0]
              return {
                icon: card?.icon || fallback.icon,
                title: card?.title || fallback.title,
                description: card?.description || fallback.description
              }
            })
          : defaultContent.aboutPage.whyChoose.cards
      },
      process: {
        eyebrow: merged.aboutPage?.process?.eyebrow || defaultContent.aboutPage.process.eyebrow,
        title: merged.aboutPage?.process?.title || defaultContent.aboutPage.process.title,
        steps: Array.isArray(merged.aboutPage?.process?.steps) && merged.aboutPage.process.steps.length
          ? merged.aboutPage.process.steps.map((step, index) => {
              const fallback = defaultContent.aboutPage.process.steps[index] || defaultContent.aboutPage.process.steps[0]
              return {
                icon: step?.icon || fallback.icon,
                title: step?.title || fallback.title,
                description: step?.description || fallback.description
              }
            })
          : defaultContent.aboutPage.process.steps
      },
      testimonials: {
        eyebrow: merged.aboutPage?.testimonials?.eyebrow || defaultContent.aboutPage.testimonials.eyebrow,
        title: merged.aboutPage?.testimonials?.title || defaultContent.aboutPage.testimonials.title,
        items: Array.isArray(merged.aboutPage?.testimonials?.items) && merged.aboutPage.testimonials.items.length
          ? merged.aboutPage.testimonials.items.map((item, index) => {
              const fallback = defaultContent.aboutPage.testimonials.items[index] || defaultContent.aboutPage.testimonials.items[0]
              return {
                quote: item?.quote || fallback.quote,
                name: item?.name || fallback.name,
                role: item?.role || fallback.role,
                company: item?.company || fallback.company,
                rating: item?.rating || fallback.rating
              }
            })
          : defaultContent.aboutPage.testimonials.items
      },
      finalCta: {
        ...defaultContent.aboutPage.finalCta,
        ...merged.aboutPage?.finalCta,
        primaryCtaHref: normalizeJobPostHref(
          merged.aboutPage?.finalCta?.primaryCtaHref,
          defaultContent.aboutPage.finalCta.primaryCtaHref
        ),
        secondaryCtaHref: normalizeCompanyRegistrationHref(
          merged.aboutPage?.finalCta?.secondaryCtaHref,
          defaultContent.aboutPage.finalCta.secondaryCtaHref
        )
      }
    },
    pricingPage: {
      eyebrow: merged.pricingPage?.eyebrow || defaultContent.pricingPage.eyebrow,
      title: merged.pricingPage?.title || defaultContent.pricingPage.title,
      subtitle: merged.pricingPage?.subtitle || defaultContent.pricingPage.subtitle,
      benefits: Array.isArray(merged.pricingPage?.benefits) && merged.pricingPage.benefits.length
        ? merged.pricingPage.benefits.map((benefit, index) => {
            const fallback = defaultContent.pricingPage.benefits[index] || defaultContent.pricingPage.benefits[0]
            return {
              icon: benefit?.icon || fallback.icon,
              title: benefit?.title || fallback.title,
              description: benefit?.description || fallback.description
            }
          })
        : defaultContent.pricingPage.benefits,
      billing: {
        ...defaultContent.pricingPage.billing,
        ...merged.pricingPage?.billing
      },
      plans: Array.isArray(merged.pricingPage?.plans) && merged.pricingPage.plans.length
        ? merged.pricingPage.plans.map((plan, index) => {
            const fallback = defaultContent.pricingPage.plans[index] || defaultContent.pricingPage.plans[0]
            return {
              name: plan?.name || fallback.name,
              subtitle: plan?.subtitle || fallback.subtitle,
              badge: typeof plan?.badge === 'string' ? plan.badge : fallback.badge,
              monthlyPrice: plan?.monthlyPrice || fallback.monthlyPrice,
              yearlyPrice: plan?.yearlyPrice || fallback.yearlyPrice,
              monthlySuffix: plan?.monthlySuffix || fallback.monthlySuffix,
              yearlySuffix: plan?.yearlySuffix || fallback.yearlySuffix,
              buttonLabel: plan?.buttonLabel || fallback.buttonLabel,
              buttonHref: normalizeCompanyRegistrationHref(plan?.buttonHref, fallback.buttonHref),
              features: Array.isArray(plan?.features) && plan.features.length ? plan.features : fallback.features
            }
          })
        : defaultContent.pricingPage.plans,
      compareTitle: merged.pricingPage?.compareTitle || defaultContent.pricingPage.compareTitle,
      compareRows: Array.isArray(merged.pricingPage?.compareRows) && merged.pricingPage.compareRows.length
        ? merged.pricingPage.compareRows.map((row, index) => {
            const fallback = defaultContent.pricingPage.compareRows[index] || defaultContent.pricingPage.compareRows[0]
            return {
              icon: row?.icon || fallback.icon,
              feature: row?.feature || fallback.feature,
              starter: row?.starter || fallback.starter,
              professional: row?.professional || fallback.professional,
              enterprise: row?.enterprise || fallback.enterprise
            }
          })
        : defaultContent.pricingPage.compareRows,
      faqTitle: merged.pricingPage?.faqTitle || defaultContent.pricingPage.faqTitle,
      faqs: Array.isArray(merged.pricingPage?.faqs) && merged.pricingPage.faqs.length
        ? merged.pricingPage.faqs.map((item, index) => {
            const fallback = defaultContent.pricingPage.faqs[index] || defaultContent.pricingPage.faqs[0]
            return {
              question: item?.question || fallback.question,
              answer: item?.answer || fallback.answer
            }
          })
        : defaultContent.pricingPage.faqs,
      finalCta: {
        ...defaultContent.pricingPage.finalCta,
        ...merged.pricingPage?.finalCta,
        primaryCtaHref: normalizeJobPostHref(
          merged.pricingPage?.finalCta?.primaryCtaHref,
          defaultContent.pricingPage.finalCta.primaryCtaHref
        ),
        secondaryCtaHref: normalizeCompanyRegistrationHref(
          merged.pricingPage?.finalCta?.secondaryCtaHref,
          defaultContent.pricingPage.finalCta.secondaryCtaHref
        )
      }
    },
    signinPage: {
      ...defaultContent.signinPage,
      ...merged.signinPage,
      primaryCtaHref: merged.signinPage?.primaryCtaHref || defaultContent.signinPage.primaryCtaHref,
      secondaryCtaHref: normalizeCompanyRegistrationHref(
        merged.signinPage?.secondaryCtaHref,
        defaultContent.signinPage.secondaryCtaHref
      ),
      benefits: Array.isArray(merged.signinPage?.benefits) && merged.signinPage.benefits.length
        ? defaultContent.signinPage.benefits.map((fallback, index) => merged.signinPage?.benefits?.[index] || fallback)
        : defaultContent.signinPage.benefits,
      loginCard: {
        ...defaultContent.signinPage.loginCard,
        ...merged.signinPage?.loginCard,
        signInButtonLabel:
          merged.signinPage?.loginCard?.signInButtonLabel ||
          merged.signinPage?.primaryCtaLabel ||
          defaultContent.signinPage.loginCard.signInButtonLabel,
        registerCompanyButtonLabel:
          merged.signinPage?.loginCard?.registerCompanyButtonLabel ||
          merged.signinPage?.secondaryCtaLabel ||
          defaultContent.signinPage.loginCard.registerCompanyButtonLabel
      },
      rightPanel: {
        ...defaultContent.signinPage.rightPanel,
        ...merged.signinPage?.rightPanel,
        title:
          merged.signinPage?.rightPanel?.title ||
          merged.signinPage?.infoTitle ||
          defaultContent.signinPage.rightPanel.title,
        items: Array.isArray(merged.signinPage?.rightPanel?.items) && merged.signinPage.rightPanel.items.length
          ? defaultContent.signinPage.rightPanel.items.map((fallback, index) => ({
              title: merged.signinPage?.rightPanel?.items?.[index]?.title || fallback.title,
              description: merged.signinPage?.rightPanel?.items?.[index]?.description || fallback.description
            }))
          : defaultContent.signinPage.rightPanel.items
      },
      banner: {
        ...defaultContent.signinPage.banner,
        ...merged.signinPage?.banner
      },
      featureStrip: Array.isArray(merged.signinPage?.featureStrip) && merged.signinPage.featureStrip.length
        ? defaultContent.signinPage.featureStrip.map((fallback, index) => ({
            title: merged.signinPage?.featureStrip?.[index]?.title || fallback.title,
            description: merged.signinPage?.featureStrip?.[index]?.description || fallback.description
          }))
        : defaultContent.signinPage.featureStrip
    },
    contactPage: {
      ...defaultContent.contactPage,
      ...merged.contactPage,
      featurePoints: Array.isArray(merged.contactPage?.featurePoints) && merged.contactPage.featurePoints.length
        ? merged.contactPage.featurePoints.map((item, index) => {
            const fallback = defaultContent.contactPage.featurePoints[index] || defaultContent.contactPage.featurePoints[0]
            return {
              title: item?.title || fallback.title,
              description: item?.description || fallback.description
            }
          })
        : defaultContent.contactPage.featurePoints,
      subjectOptions: Array.isArray(merged.contactPage?.subjectOptions) && merged.contactPage.subjectOptions.length
        ? merged.contactPage.subjectOptions
        : defaultContent.contactPage.subjectOptions,
      faqs: Array.isArray(merged.contactPage?.faqs) && merged.contactPage.faqs.length
        ? merged.contactPage.faqs.map((item, index) => {
            const fallback = defaultContent.contactPage.faqs[index] || defaultContent.contactPage.faqs[0]
            return {
              question: item?.question || fallback.question,
              answer: item?.answer || fallback.answer
            }
          })
        : defaultContent.contactPage.faqs,
      socialLinks: {
        ...defaultContent.contactPage.socialLinks,
        ...merged.contactPage?.socialLinks
      },
      finalCta: {
        ...defaultContent.contactPage.finalCta,
        ...merged.contactPage?.finalCta,
        primaryCtaHref: normalizeJobPostHref(
          merged.contactPage?.finalCta?.primaryCtaHref,
          defaultContent.contactPage.finalCta.primaryCtaHref
        ),
        secondaryCtaHref: normalizeCompanyRegistrationHref(
          merged.contactPage?.finalCta?.secondaryCtaHref,
          defaultContent.contactPage.finalCta.secondaryCtaHref
        )
      },
      cards: Array.isArray(merged.contactPage?.cards) && merged.contactPage.cards.length
        ? merged.contactPage.cards.map((card, index) => ({
            ...card,
            ctaHref: normalizeCompanyRegistrationHref(
              card.ctaHref,
              defaultContent.contactPage.cards[index]?.ctaHref || defaultContent.contactPage.cards[0].ctaHref
            )
          }))
        : defaultContent.contactPage.cards
    },
    searchPage: {
      ...defaultContent.searchPage,
      ...merged.searchPage,
      trustPoints: Array.isArray(merged.searchPage?.trustPoints) && merged.searchPage.trustPoints.length
        ? merged.searchPage.trustPoints
        : defaultContent.searchPage.trustPoints
    },
    companyPanel: {
      header: {
        ...defaultContent.companyPanel.header,
        ...merged.companyPanel?.header
      },
      hero: {
        ...defaultContent.companyPanel.hero,
        ...merged.companyPanel?.hero
      },
      sidebar: {
        ...defaultContent.companyPanel.sidebar,
        ...merged.companyPanel?.sidebar
      },
      actions: {
        ...defaultContent.companyPanel.actions,
        ...merged.companyPanel?.actions
      },
      stats: {
        ...defaultContent.companyPanel.stats,
        ...merged.companyPanel?.stats
      },
      recentJobs: {
        ...defaultContent.companyPanel.recentJobs,
        ...merged.companyPanel?.recentJobs
      },
      recentApplications: {
        ...defaultContent.companyPanel.recentApplications,
        ...merged.companyPanel?.recentApplications
      },
      quickActions: {
        title: merged.companyPanel?.quickActions?.title || defaultContent.companyPanel.quickActions.title,
        items: Array.isArray(merged.companyPanel?.quickActions?.items) && merged.companyPanel.quickActions.items.length
          ? merged.companyPanel.quickActions.items.map((item, index) => {
              const fallback = defaultContent.companyPanel.quickActions.items[index] || defaultContent.companyPanel.quickActions.items[0]
              return {
                title: item?.title || fallback.title,
                description: item?.description || fallback.description
              }
            })
          : defaultContent.companyPanel.quickActions.items
      },
      support: {
        ...defaultContent.companyPanel.support,
        ...merged.companyPanel?.support
      },
      planSummary: {
        ...defaultContent.companyPanel.planSummary,
        ...merged.companyPanel?.planSummary
      },
      upgradeCard: {
        ...defaultContent.companyPanel.upgradeCard,
        ...merged.companyPanel?.upgradeCard
      }
    },
    legalPages: {
      privacyPolicy: mergeLegalPage(merged.legalPages?.privacyPolicy, defaultContent.legalPages.privacyPolicy),
      termsOfService: mergeLegalPage(merged.legalPages?.termsOfService, defaultContent.legalPages.termsOfService),
      userDataDeletion: mergeLegalPage(merged.legalPages?.userDataDeletion, defaultContent.legalPages.userDataDeletion)
    }
  }

  const refreshedContent = refreshReferenceHomepageTheme(normalizedContent)
  return applyCompanyFacingCopy(refreshedContent) as LabourCompanyWebsiteContent
}

export const getLabourCompanyWebsiteContent = async (): Promise<{ content: LabourCompanyWebsiteContent; storage: 'supabase' | 'json' }> => {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('content_json')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error && isMissingSupabaseTableError(error.message)) {
    return { content: normalizeContent(await readJsonContent()), storage: 'json' }
  }

  if (error) {
    throw new Error(`Failed to fetch labour website content: ${error.message}`)
  }

  if (!data?.content_json) {
    return { content: normalizeContent(await readJsonContent()), storage: 'json' }
  }

  return {
    content: normalizeContent(data.content_json),
    storage: 'supabase'
  }
}

export const updateLabourCompanyWebsiteContent = async (content: LabourCompanyWebsiteContent) => {
  const normalized = normalizeContent(content)
  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert({
      id: RECORD_ID,
      page_key: 'company',
      title: normalized.theme.brandName,
      content_json: normalized,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error && isMissingSupabaseTableError(error.message)) {
    await writeJsonContent(normalized)
    return { content: normalized, storage: 'json' as const }
  }

  if (error) {
    throw new Error(`Failed to update labour company website content: ${error.message}`)
  }

  return { content: normalized, storage: 'supabase' as const }
}
