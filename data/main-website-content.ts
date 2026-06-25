export const defaultMainWebsiteContent = {
  theme: {
    brandName: 'ScaleVyapar',
    accentColor: '#374655',
    accentSoft: '#f8fafc',
    highlightColor: '#94a3b8',
    supportEmail: 'scalevyapar072@gmail.com',
    whatsappNumber: '+919314023719'
  },
  header: {
    logoSrc: '/logo.png',
    logoAlt: 'ScaleVyapar',
    navItems: [
      { label: 'Home', href: '/' },
      { label: 'Tools', href: '/tools' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' }
    ],
    loginButtonLabel: 'Log In →',
    loginButtonHref: '/login',
    mobileLoginLabel: '🔐 Log In'
  },
  footer: {
    logoSrc: '/logo.png',
    description: 'All-in-one business automation platform for Indian businesses. Scale faster with our powerful tools.',
    toolLinks: [
      { label: '🎯 LeadRadar', href: '/tools' },
      { label: '📸 Vizora', href: '/tools' },
      { label: '👥 Callyzer', href: '/tools' },
      { label: '💬 BotBee', href: '/tools' },
      { label: '📦 Inventory', href: '/tools' }
    ],
    quickLinks: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'User Data Deletion', href: '/user-data-deletion' },
      { label: 'Log In', href: '/login' }
    ],
    contactItems: [
      { icon: '📍', label: 'Jaipur, Rajasthan', href: '' },
      { icon: '📞', label: '+91 9314023719', href: 'tel:+919314023719' },
      { icon: '📧', label: 'scalevyapar072@gmail.com', href: 'mailto:scalevyapar072@gmail.com' },
      { icon: '💬', label: 'WhatsApp Us', href: 'https://wa.me/919314023719' }
    ],
    socialLinks: [
      { icon: '💬', href: 'https://wa.me/919314023719', label: 'WhatsApp' },
      { icon: '📧', href: 'mailto:scalevyapar072@gmail.com', label: 'Email' }
    ],
    copyrightText: '© 2026 ScaleVyapar. All rights reserved. Made with ❤️ in Jaipur, India 🇮🇳',
    secondaryText: 'Business Automation Platform'
  },
  home: {
    hero: {
      badge: '★',
      titlePrefix: 'Scale Your Business',
      titleWords: [
        'Lead Generation',
        'WhatsApp Automation',
        'AI Photo Generation',
        'CRM Management',
        'Inventory Tracking',
        'Website Building'
      ],
      subtitle: 'All-in-one platform for lead generation, CRM, WhatsApp automation, AI photos and inventory management. Built for Indian businesses.',
      mobileSubtitle: 'All-in-one platform for lead generation, CRM, WhatsApp automation and more. Built for Indian businesses.',
      primaryCtaLabel: 'Get Started Today →',
      primaryCtaHref: '/pricing',
      mobilePrimaryCtaLabel: 'Get Started →',
      secondaryCtaLabel: 'Explore Tools',
      secondaryCtaHref: '/tools',
      stats: [
        { value: '500+', label: 'Businesses Served', mobileLabel: 'Businesses' },
        { value: '10x', label: 'Faster Leads', mobileLabel: 'Faster Leads' },
        { value: '24/7', label: 'Support', mobileLabel: 'Support' }
      ],
      scrollHint: '★'
    },
    counterBanner: {
      items: [
        { icon: '🎯', value: 10000, suffix: '+', label: 'Leads Generated' },
        { icon: '🏢', value: 500, suffix: '+', label: 'Businesses Served' },
        { icon: '💰', value: 50, suffix: 'L+', label: 'Revenue Generated for Clients' },
        { icon: '⭐', value: 98, suffix: '%', label: 'Client Satisfaction Rate' }
      ]
    },
    toolsSection: {
      eyebrow: '★',
      title: 'Everything Your Business Needs',
      subtitle: 'From lead generation to inventory management—we have all the tools to automate and scale your business.',
      tools: [
        {
          icon: '🎯',
          name: 'LeadRadar',
          tag: 'Built by Us',
          tagText: '★',
          description: 'Extract thousands of B2B leads from Google Maps in minutes. Filter by location, business type, and keywords.',
          features: ['Google Maps extraction', 'Filter by location', 'Export to Excel/CRM', 'Bulk lead import']
        },
        {
          icon: '📸',
          name: 'Vizora AI',
          tag: 'Built by Us',
          tagText: '★',
          description: 'Generate professional AI product photos and video ads instantly. No photographer needed.',
          features: ['AI photo generation', 'Video ad creation', '12 pose types', 'Instant download']
        },
        {
          icon: '🌐',
          name: 'Website Builder',
          tag: 'Built by Us',
          tagText: '★',
          description: 'Get a professional website built for your business. A one-time setup includes ongoing modifications.',
          features: ['Custom design', 'Mobile responsive', 'SEO optimized', 'WhatsApp integration']
        },
        {
          icon: '📞',
          name: 'CRM & Calls',
          tag: 'Premium Tool',
          tagText: '★',
          description: 'Track every call, manage follow-ups, and close more deals with our powerful CRM system.',
          features: ['Call tracking', 'Lead management', 'Follow-up reminders', 'Team performance']
        },
        {
          icon: '💬',
          name: 'WhatsApp Automation',
          tag: 'Premium Tool',
          tagText: '★',
          description: 'Automate your WhatsApp marketing with bulk messaging, chatbots, and lead-nurturing campaigns.',
          features: ['Bulk messaging', 'Chatbot automation', 'Lead nurturing', 'Broadcast campaigns']
        },
        {
          icon: '📦',
          name: 'Inventory Management',
          tag: 'Premium Tool',
          tagText: '★',
          description: 'Track your stock levels, manage raw materials, production orders, and dispatch in real time.',
          features: ['Stock tracking', 'Raw material management', 'Production orders', 'Dispatch tracking']
        }
      ]
    },
    previewSection: {
      eyebrow: 'See It In Action',
      title: 'How Our Tools Work',
      subtitle: 'See exactly what you get with each tool before you sign up.',
      items: [
        {
          icon: '🎯',
          name: 'LeadRadar',
          tagline: 'Extract B2B Leads Instantly',
          description: 'Search any city, get thousands of business leads with phone numbers and emails in seconds.',
          ctaLabel: 'Add to My Plan →',
          ctaHref: '/pricing',
          mockupTitle: 'LeadRadar — Live Data',
          mockupRows: [
            { label: 'Business Name', value: 'Sharma Textiles Pvt Ltd' },
            { label: 'Phone', value: '+91 98765 43210' },
            { label: 'Location', value: 'Jaipur, Rajasthan' },
            { label: 'Category', value: 'Textile Manufacturer' },
            { label: 'Rating', value: '⭐ 4.5 (120 reviews)' }
          ]
        },
        {
          icon: '📸',
          name: 'Vizora AI',
          tagline: 'AI Product Photos in Seconds',
          description: 'Upload your product photo and get professional model photos instantly with AI.',
          ctaLabel: 'Add to My Plan →',
          ctaHref: '/pricing',
          isPhoto: true,
          beforeLabel: 'Your Product',
          afterLabel: 'AI Photo',
          posesLabel: 'Available Poses',
          poses: ['Front Standing', 'Side View', 'Close Up', 'Sitting', 'Walking', 'Editorial']
        },
        {
          icon: '💰',
          name: 'Pricing Builder',
          tagline: 'Build Your Custom Plan',
          description: 'Choose exactly the tools you need and see your price instantly. No hidden fees.',
          ctaLabel: 'Add to My Plan →',
          ctaHref: '/pricing',
          mockupTitle: 'Pricing Builder — Live Data',
          mockupRows: [
            { label: 'LeadRadar', value: '₹999/mo ✓' },
            { label: 'Vizora AI', value: '₹799/mo ✓' },
            { label: 'WhatsApp', value: '₹899/mo ✓' },
            { label: 'Monthly Credits', value: '1500 credits' },
            { label: 'Total', value: '₹2,697/mo' }
          ]
        }
      ]
    },
    stepsSection: {
      eyebrow: '★',
      title: 'Get Started in 3 Simple Steps',
      subtitle: 'Start automating your business in minutes—no technical knowledge required.',
      steps: [
        { icon: '1', title: 'Choose Your Tools', description: 'Select the automation tools your business needs from our powerful toolkit.' },
        { icon: '2', title: 'Get Instant Access', description: 'Log in to your dashboard and start using all your tools immediately.' },
        { icon: '3', title: 'Scale Your Business', description: 'Watch your business grow with automated lead generation, sales and marketing.' }
      ]
    },
    whySection: {
      eyebrow: '★',
      title: 'Built for Indian Businesses',
      subtitle: 'We understand the challenges of growing a business in India.',
      cards: [
        { icon: '🇮🇳', title: 'Made for India', description: 'Built specifically for Indian businesses with local language support, Indian pricing and India-first features.' },
        { icon: '⚡', title: 'All-in-One Platform', description: 'No need to juggle multiple tools. Everything you need to run and grow your business is in one place.' },
        { icon: '💰', title: 'Affordable Pricing', description: 'Enterprise-level automation at startup-friendly prices. Pay only for the tools you actually need.' },
        { icon: '🔧', title: 'Easy to Use', description: 'No technical knowledge required. If you can use WhatsApp, you can use ScaleVyapar.' },
        { icon: '📞', title: '24/7 Support', description: 'Our team is always available on WhatsApp to help you get the most out of our platform.' },
        { icon: '🚀', title: 'Grow Faster', description: 'Businesses using ScaleVyapar generate 10x more leads and close deals 3x faster than before.' }
      ]
    },
    testimonialsSection: {
      eyebrow: 'Testimonials',
      title: 'What Our Clients Say',
      subtitle: "Real businesses, real results. Here's what our clients have to say about ScaleVyapar.",
      items: [
        { name: 'Rajesh Sharma', business: 'Sharma Textiles, Jaipur', review: 'ScaleVyapar has completely transformed how we generate leads. In just 2 weeks we got 500 plus business contacts from Google Maps. Our sales team is now 3x more productive!', rating: 5, avatar: 'R' },
        { name: 'Priya Agarwal', business: 'Agarwal Exports, Jaipur', review: 'Vizora AI photos are incredible! We stopped spending ₹15,000 per month on photographers. Now we generate stunning product photos in seconds. Our Instagram sales doubled!', rating: 5, avatar: 'P' },
        { name: 'Mohit Gupta', business: 'Gupta Electronics, Jaipur', review: 'The WhatsApp automation tool is a game changer. We send 5000 messages a day and our follow-up rate went from 20 percent to 80 percent. Best investment we made this year!', rating: 5, avatar: 'M' },
        { name: 'Sunita Verma', business: 'Verma Jewellers, Jaipur', review: 'The CRM system helped us track every customer call. We no longer miss follow-ups and our conversion rate improved by 40 percent. ScaleVyapar support team is amazing!', rating: 5, avatar: 'S' },
        { name: 'Amit Joshi', business: 'Joshi Manufacturing, Jaipur', review: 'Inventory management was our biggest headache. Now everything is tracked in real time. We reduced stock wastage by 60 percent and our production is much more organized.', rating: 5, avatar: 'A' },
        { name: 'Kavita Mehta', business: 'Mehta Fashion, Jaipur', review: 'We got a beautiful website and 200 leads in the first month using LeadRadar. The team at ScaleVyapar held our hand through everything. Highly recommended!', rating: 5, avatar: 'K' }
      ]
    },
    comparisonSection: {
      eyebrow: 'Why Choose Us',
      title: 'ScaleVyapar vs Others',
      subtitle: 'See why hundreds of Indian businesses choose ScaleVyapar over other platforms.',
      primaryLabel: '⚡ ScaleVyapar',
      secondaryLabel: 'Others',
      features: [
        { feature: 'All Tools in One Platform', us: true, others: false },
        { feature: 'Indian Pricing', us: true, others: false },
        { feature: 'WhatsApp Support 24/7', us: true, others: false },
        { feature: 'Credit Based System', us: true, others: false },
        { feature: 'AI Photo Generation', us: true, others: false },
        { feature: 'Google Maps Lead Extraction', us: true, others: false },
        { feature: 'WhatsApp Automation', us: true, others: true },
        { feature: 'CRM & Call Management', us: true, others: true },
        { feature: 'Inventory Management', us: true, others: true },
        { feature: 'Free Onboarding Training', us: true, others: false },
        { feature: 'No Long Term Contracts', us: true, others: false },
        { feature: 'Custom Website Builder', us: true, others: false }
      ],
      ctaText: 'Still not convinced? Talk to us on WhatsApp and we will show you exactly how ScaleVyapar can help your business.',
      ctaButtonLabel: '💬 Talk to Us on WhatsApp',
      ctaButtonHref: 'https://wa.me/919314023719'
    },
    finalCta: {
      title: 'Ready to Scale Your Business?',
      subtitle: 'Join hundreds of Indian businesses already using ScaleVyapar to automate their growth.',
      primaryCtaLabel: 'View Pricing →',
      primaryCtaHref: '/pricing',
      secondaryCtaLabel: '💬 Talk to Us on WhatsApp',
      secondaryCtaHref: 'https://wa.me/919314023719'
    }
  },
  pricingPage: {
    heroTitle: 'Build Your Own Plan 🎯',
    heroSubtitle: 'Choose only the tools your business needs. Pay for what you use — no hidden fees, no long term contracts.',
    builder: {
      eyebrow: 'Custom Plan Builder',
      title: 'Choose Your Tools',
      subtitle: 'Select the tools you need and get a monthly credit subscription. Buy extra credits anytime you run out.'
    },
    calculator: {
      planTabLabel: '🎯 Build Your Plan',
      creditsTabLabel: '⚡ Buy Extra Credits',
      planIntro: 'Click on any tool to select it. Each tool comes with 500 monthly credits.',
      creditsIntro: 'Running low on credits? Top up anytime and never miss a beat.',
      summaryTitle: '📋 Your Custom Plan',
      emptyStateText: '☝️ Select tools above to build your plan',
      monthlyTotalLabel: 'Monthly Total',
      monthlyCreditsLabel: 'Monthly Credits Included',
      websiteSetupLabel: '🌐 Website Setup (one time)',
      whatsappCtaLabel: '💬 Get Started on WhatsApp →',
      customPackageTitle: '💡 Need a custom credit package?',
      customPackageText: 'Contact us on WhatsApp for bulk credit discounts and custom packages.',
      customPackageButtonLabel: '💬 Contact for Custom Package',
      tools: [
        { icon: '🎯', name: 'LeadRadar', description: 'Extract B2B leads from Google Maps', detail: 'Search businesses by location and category. Every search costs 100 credits.', credits: 100, unit: 'per search', monthly: 999 },
        { icon: '📸', name: 'Vizora AI Photos', description: 'Generate professional AI product photos', detail: 'Create stunning product photos instantly with AI. Every photo costs 100 credits.', credits: 100, unit: 'per photo', monthly: 799 },
        { icon: '🌐', name: 'Website Builder', description: 'Professional website for your business', detail: 'One-time setup fee to build your website. Modifications use your monthly credits.', credits: 100, unit: 'per modification', monthly: 1999, oneTime: 4999 },
        { icon: '📞', name: 'CRM & Call Management', description: 'Track calls and manage your leads', detail: 'Manage all your customer calls and follow-ups. Every session costs 100 credits.', credits: 100, unit: 'per session', monthly: 699 },
        { icon: '💬', name: 'WhatsApp Automation', description: 'Automate your WhatsApp marketing', detail: 'Send bulk messages and set up chatbots. Every session costs 100 credits.', credits: 100, unit: 'per session', monthly: 899 },
        { icon: '📦', name: 'Inventory Management', description: 'Track stock and manage production', detail: 'Monitor your inventory in real time. Every session costs 100 credits.', credits: 100, unit: 'per session', monthly: 599 }
      ],
      creditPacks: [
        { credits: 100, price: 99, label: 'Starter Pack' },
        { credits: 500, price: 399, label: 'Growth Pack', popular: true },
        { credits: 1000, price: 699, label: 'Pro Pack' },
        { credits: 5000, price: 2999, label: 'Enterprise Pack' }
      ]
    },
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      { question: 'What are credits?', answer: 'Credits are the currency used inside ScaleVyapar. Every time you use a tool — extract leads, generate photos, or use any service — credits are deducted. Each action costs 100 credits.' },
      { question: 'What happens when my credits run out?', answer: 'When your monthly credits run out you can buy extra credit packs instantly. Your subscription continues and resets next month.' },
      { question: 'Can I change my plan anytime?', answer: 'Yes! You can add or remove tools anytime. Changes take effect from the next billing cycle.' },
      { question: 'Is there a free trial?', answer: 'Yes we offer a 7 day free trial for all new clients with 200 free credits. No credit card required.' },
      { question: 'How does the Website Builder work?', answer: 'Website Builder is a one time payment to build your website. After that modifications are included in your monthly subscription credits.' },
      { question: 'Do you provide training?', answer: 'Yes! We provide free onboarding training for all clients via WhatsApp and video call.' },
      { question: 'What payment methods do you accept?', answer: 'We accept UPI, bank transfer, and all major credit and debit cards.' }
    ],
    finalCta: {
      title: 'Not sure which tools you need?',
      subtitle: 'Talk to our team on WhatsApp and we will help you choose the right plan for your business.',
      buttonLabel: '💬 Chat on WhatsApp',
      buttonHref: 'https://wa.me/919314023719'
    }
  },
  toolsPage: {
    heroTitle: 'Our Tools & Services 🛠️',
    heroSubtitle: 'Everything your business needs to generate leads, manage customers, automate marketing and scale faster.',
    tools: [
      {
        icon: '🎯',
        name: 'LeadRadar',
        tagline: 'Extract B2B Leads from Google Maps',
        description: 'LeadRadar is our powerful lead generation tool that extracts thousands of business leads from Google Maps in minutes. Target the exact businesses you want by location, category and keywords.',
        features: ['Extract leads from any city or area in India', 'Filter by business type and category', 'Get phone numbers, emails and addresses', 'Export to Excel or import directly to CRM', 'Search multiple locations at once', 'Real-time data — always up to date'],
        credits: '100 credits per search',
        badge: 'Built by ScaleVyapar',
        badgeColor: '#0369a1',
        badgeBg: '#e0f2fe',
        useCases: ['Real estate agencies finding property buyers', 'Manufacturers finding distributors', 'Service businesses finding local clients', 'B2B sales teams building prospect lists']
      },
      {
        icon: '📸',
        name: 'Vizora AI',
        tagline: 'Professional AI Product Photos in Seconds',
        description: 'Vizora uses cutting-edge AI to generate professional product photos and video ads instantly. No photographer, no studio, no expensive shoots — just upload your product and get stunning visuals.',
        features: ['AI generated product photos on real models', '12 professional pose types', 'Video ad generation for social media', 'Photo upscaling 4x quality', 'UGC style content creation', 'Magic eraser for background removal'],
        credits: '100 credits per photo',
        badge: 'Built by ScaleVyapar',
        badgeColor: '#0369a1',
        badgeBg: '#e0f2fe',
        useCases: ['Fashion and clothing brands', 'Ecommerce product listings', 'Social media advertisements', 'Instagram and Facebook marketing']
      },
      {
        icon: '🌐',
        name: 'Website Builder',
        tagline: 'Professional Website for Your Business',
        description: 'Get a fully custom professional website built for your business. The one-time setup fee covers everything — design, development, and launch. Modifications are covered by your monthly credits.',
        features: ['Fully custom designed website', 'Mobile responsive on all devices', 'Fast loading and SEO optimized', 'Contact forms and WhatsApp integration', 'Product catalog and pricing pages', 'Ongoing modifications with credits'],
        credits: '100 credits per modification',
        badge: 'Built by ScaleVyapar',
        badgeColor: '#0369a1',
        badgeBg: '#e0f2fe',
        oneTime: '₹4,999 one-time setup',
        useCases: ['Small businesses needing online presence', 'Manufacturers wanting product showcase', 'Service businesses needing lead generation', 'Retailers wanting online store']
      },
      {
        icon: '📞',
        name: 'CRM & Call Management',
        tagline: 'Track Every Call and Close More Deals',
        description: 'Our CRM and call management system helps your sales team track every call, manage follow-ups and close more deals. Never miss a follow-up or lose a potential customer again.',
        features: ['Automatic call tracking and logging', 'Lead status — Hot, Warm, Cold', 'Follow-up reminders and alerts', 'Team performance reports', 'Call recording and notes', 'Pipeline management dashboard'],
        credits: '100 credits per session',
        badge: 'Premium Tool',
        badgeColor: '#15803d',
        badgeBg: '#f0fdf4',
        useCases: ['Sales teams managing large lead volumes', 'Telecalling centers tracking performance', 'Real estate agents managing prospects', 'Insurance agents following up clients']
      },
      {
        icon: '💬',
        name: 'WhatsApp Automation',
        tagline: 'Automate Your WhatsApp Marketing',
        description: 'Send bulk WhatsApp messages, set up automated chatbots, and run complete lead-nurturing campaigns — all from one powerful dashboard. Reach thousands of customers instantly.',
        features: ['Bulk WhatsApp messaging', 'Automated chatbot responses', 'Lead nurturing campaigns', 'Broadcast to unlimited contacts', 'Message templates and scheduling', 'Analytics and delivery reports'],
        credits: '100 credits per session',
        badge: 'Premium Tool',
        badgeColor: '#15803d',
        badgeBg: '#f0fdf4',
        useCases: ['Businesses running WhatsApp marketing', 'Ecommerce order notifications', 'Educational institutes sending updates', 'Real estate sending property alerts']
      },
      {
        icon: '📦',
        name: 'Inventory Management',
        tagline: 'Track Stock and Manage Production',
        description: 'Keep your inventory under control with real time stock tracking, production order management and dispatch monitoring. Never run out of stock or lose track of orders again.',
        features: ['Real time stock level tracking', 'Raw material management', 'Production order tracking', 'Dispatch and delivery monitoring', 'Low stock alerts and notifications', 'Supplier and vendor management'],
        credits: '100 credits per session',
        badge: 'Premium Tool',
        badgeColor: '#15803d',
        badgeBg: '#f0fdf4',
        useCases: ['Manufacturers tracking production', 'Wholesalers managing large inventory', 'Retailers monitoring stock levels', 'Distributors tracking shipments']
      }
    ],
    finalCta: {
      title: 'Ready to Get Started?',
      subtitle: 'Choose the tools your business needs and start scaling today.',
      primaryCtaLabel: 'Build Your Plan →',
      primaryCtaHref: '/pricing',
      secondaryCtaLabel: '💬 Talk to Us',
      secondaryCtaHref: 'https://wa.me/919314023719'
    }
  },
  aboutPage: {
    heroTitle: 'About ScaleVyapar 🏢',
    heroSubtitle: 'We are on a mission to help Indian businesses grow faster with powerful automation tools that actually work.',
    storyTitle: 'Built for Indian Businesses by Indians',
    storyParagraphs: [
      'ScaleVyapar was born out of a simple frustration — Indian businesses were using expensive foreign tools that did not understand local needs, local languages or local market dynamics.',
      'We decided to build something different. A platform that understands the Indian business landscape, works with Indian payment systems, and is priced for Indian businesses.',
      'Today ScaleVyapar helps hundreds of businesses across India generate more leads, close more deals and automate their operations — all from one powerful platform.'
    ],
    locationLine: '📍 Proudly based in Jaipur, Rajasthan 🇮🇳',
    stats: [
      { icon: '🎯', value: 500, suffix: '+', label: 'Businesses Served' },
      { icon: '⚡', text: '6', label: 'Powerful Tools' },
      { icon: '📍', text: 'Jaipur', label: 'Headquartered In' },
      { icon: '💬', text: '24/7', label: 'WhatsApp Support' }
    ],
    mission: {
      eyebrow: 'Our Mission',
      title: 'Why We Built ScaleVyapar',
      subtitle: 'Every decision we make is guided by one goal — helping Indian businesses scale faster and smarter.',
      cards: [
        { icon: '🎯', title: 'Our Mission', description: 'To make enterprise-level business automation accessible and affordable for every Indian business — from small shops to large manufacturers.' },
        { icon: '👁️', title: 'Our Vision', description: 'To become the go-to business automation platform for 1 million Indian businesses by 2030.' },
        { icon: '💎', title: 'Our Promise', description: 'Simple tools, honest pricing, and real results. We only succeed when our clients succeed.' }
      ]
    },
    values: {
      eyebrow: 'Our Values',
      title: 'What We Stand For',
      subtitle: 'These values guide everything we do at ScaleVyapar.',
      cards: [
        { icon: '🤝', title: 'Client First', description: 'Every feature we build, every decision we make is guided by what is best for our clients. Your success is our success.' },
        { icon: '💡', title: 'Innovation', description: 'We constantly push the boundaries of what is possible to bring you the most powerful and easy to use tools.' },
        { icon: '🔒', title: 'Trust & Transparency', description: 'Honest pricing, no hidden fees, no long term contracts. We earn your trust every single month.' },
        { icon: '🇮🇳', title: 'Made for India', description: 'Everything we build is designed specifically for the Indian market, Indian businesses and Indian customers.' }
      ]
    },
    finalCta: {
      title: 'Ready to Grow Your Business?',
      subtitle: 'Join hundreds of Indian businesses already using ScaleVyapar to automate their growth and scale faster.',
      primaryCtaLabel: 'View Pricing →',
      primaryCtaHref: '/pricing',
      secondaryCtaLabel: '💬 Talk to Us',
      secondaryCtaHref: 'https://wa.me/919314023719'
    }
  },
  contactPage: {
    heroTitle: 'Get in Touch 📞',
    heroSubtitle: 'Have questions about ScaleVyapar? We are here to help. Reach out on WhatsApp for the fastest response.',
    infoTitle: 'Contact Information',
    cards: {
      whatsapp: { icon: '💬', title: 'WhatsApp — Fastest Response', value: '+91 9314023719', helper: 'Usually replies within minutes', href: 'https://wa.me/919314023719' },
      phone: { icon: '📞', title: 'Phone', value: '+91 9314023719', helper: 'Mon–Sat, 9AM–7PM IST', href: 'tel:+919314023719' },
      email: { icon: '📧', title: 'Email', value: 'scalevyapar072@gmail.com', helper: 'Response within 24 hours', href: 'mailto:scalevyapar072@gmail.com' },
      location: { icon: '📍', title: 'Location', value: 'Jaipur, Rajasthan', helper: 'India 🇮🇳' }
    },
    hoursTitle: '🕐 Business Hours',
    hours: [
      { day: 'Monday — Friday', time: '9:00 AM — 7:00 PM' },
      { day: 'Saturday', time: '10:00 AM — 5:00 PM' },
      { day: 'Sunday', time: 'WhatsApp Support Only' }
    ],
    form: {
      title: 'Send Us a Message',
      submitLabel: '💬 Send Message on WhatsApp →',
      resetLabel: 'Send Another Message',
      fields: {
        nameLabel: 'Full Name *',
        namePlaceholder: 'Your name',
        phoneLabel: 'Phone Number *',
        phonePlaceholder: '+91 XXXXX XXXXX',
        emailLabel: 'Email Address',
        emailPlaceholder: 'your@email.com',
        businessLabel: 'Business Name',
        businessPlaceholder: 'Your business',
        toolLabel: 'Tool Interested In',
        toolPlaceholder: 'Select a tool...',
        messageLabel: 'Message *',
        messagePlaceholder: 'Tell us about your business and what you need help with...'
      },
      toolOptions: [
        'LeadRadar — Lead Generation',
        'Vizora — AI Photos',
        'Website Builder',
        'CRM & Call Management',
        'WhatsApp Automation',
        'Inventory Management',
        'Full Platform — All Tools'
      ]
    },
    success: {
      icon: '🎉',
      title: 'Message Sent Successfully!',
      message: 'Thank you for reaching out! Your message has been sent to our WhatsApp. Our team will get back to you within minutes.'
    },
    faqTitle: 'Common Questions',
    faqs: [
      { question: 'How quickly can I get started?', answer: 'Once you contact us on WhatsApp and confirm your plan, we set up your account within 24 hours. You can start using all your tools immediately after setup.' },
      { question: 'Do you offer a free trial?', answer: 'Yes! We offer a 7 day free trial with 200 credits so you can test the platform before committing. No credit card required.' },
      { question: 'What kind of support do you provide?', answer: 'We provide 24/7 WhatsApp support, free onboarding training via video call, and ongoing help whenever you need it.' },
      { question: 'Can you help set up the tools for me?', answer: 'Absolutely! Our team will help you get set up, configure your tools and train your team so you get the best results from day one.' },
      { question: 'Is my data safe and secure?', answer: 'Yes. We take data security very seriously. All your data is encrypted and stored securely. We never share your data with third parties.' }
    ],
    finalCta: {
      title: 'Ready to Scale Your Business?',
      subtitle: 'Message us on WhatsApp right now and get started within 24 hours!',
      buttonLabel: '💬 Message Us on WhatsApp',
      buttonHref: 'https://wa.me/919314023719?text=Hi! I want to know more about ScaleVyapar.'
    }
  },
  loginPage: {
    left: {
      title: 'Scale Your Business with Automation',
      subtitle: 'The all-in-one platform for lead generation, CRM, WhatsApp automation, inventory management.',
      features: [
        { icon: 'T', text: 'Google B2B Lead Extraction' },
        { icon: 'C', text: 'WhatsApp Automation' },
        { icon: 'U', text: 'CRM and Call Management' },
        { icon: 'B', text: 'Inventory Management' }
      ],
      trustedLine: 'Trusted by businesses across India'
    },
    right: {
      title: 'Welcome back',
      subtitle: 'Sign in to your ScaleVyapar account',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      submitLabel: 'Sign In →',
      submittingLabel: 'Signing in...',
      footerText: 'ScaleVyapar © 2026 · Business Automation Platform'
    },
    forgotPassword: {
      triggerLabel: 'Forgot Password?',
      title: 'Forgot password?',
      subtitle: 'Enter your email address and we will create a reset link for your account.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      cancelLabel: 'Cancel',
      submitLabel: 'Send reset link',
      submittingLabel: 'Generating reset link...'
    }
  },
  legalPages: {
    privacyPolicy: {
      eyebrow: 'ScaleVyapar',
      title: 'Privacy Policy',
      subtitle: 'This policy explains how ScaleVyapar collects, uses, and protects business and contact data across its website, lead generation tools, CRM workflows, and support operations.',
      sections: [
        { title: 'Information we collect', body: 'We may collect your name, business name, email address, phone number, city, lead enquiry details, billing details, messages submitted through forms, and usage information needed to operate our services and respond to requests.' },
        { title: 'How we use data', body: 'We use collected data to provide demos, process enquiries, manage accounts, deliver automation services, send operational notifications, improve product performance, and support customer communication.' },
        { title: 'How data is shared', body: 'ScaleVyapar does not sell your personal data. Information may be processed by infrastructure and service providers that help us run the platform, including hosting, database, analytics, and messaging vendors, only to the extent needed to provide the service.' },
        { title: 'Retention and security', body: 'We retain information only as long as needed for active service operations, support history, compliance, and fraud prevention. We use managed infrastructure, authenticated admin access, and operational safeguards to protect the data we store.' },
        { title: 'Contact', body: 'If you have privacy questions or data requests, contact us at scalevyapar072@gmail.com.' }
      ]
    },
    termsOfService: {
      eyebrow: 'ScaleVyapar',
      title: 'Terms of Service',
      subtitle: 'By using the ScaleVyapar website, tools, and services, you agree to use them only for lawful business activity and genuine operational needs.',
      sections: [
        { title: 'Permitted use', body: 'You may use ScaleVyapar to enquire about services, generate leads, manage customer workflows, publish content, or run supported business automations in accordance with applicable laws and platform policies.' },
        { title: 'Account and information accuracy', body: 'You agree to provide accurate account, billing, and contact information. False, abusive, deceptive, or unlawful use may lead to account suspension, service restriction, or permanent removal from the platform.' },
        { title: 'Service availability', body: 'ScaleVyapar may modify, improve, suspend, or discontinue features to maintain reliability, compliance, and service quality. We do not guarantee uninterrupted availability of all services at all times.' },
        { title: 'Payments and support', body: 'Paid services, if any, are governed by the agreed plan terms. For billing, service questions, or disputes, contact scalevyapar072@gmail.com. Continued use after policy updates means you accept the revised terms.' }
      ]
    },
    userDataDeletion: {
      eyebrow: 'ScaleVyapar',
      title: 'User Data Deletion',
      subtitle: 'If you want ScaleVyapar to delete personal or business data associated with your use of our website or services, follow the process below.',
      sections: [
        { title: 'How to request deletion', body: 'Email scalevyapar072@gmail.com with the subject line User Data Deletion Request. Include your name, phone number, business name if applicable, and the email address used with ScaleVyapar.' },
        { title: 'Verification', body: 'We may contact you to confirm account ownership before taking action so we can prevent accidental or fraudulent deletion requests.' },
        { title: 'What gets removed', body: 'After verification, we will delete or anonymise eligible records associated with your account or enquiry unless retention is required for billing, fraud prevention, legal compliance, or security investigations.' },
        { title: 'Response time', body: 'We aim to review deletion requests promptly and respond through the contact details you provide in your request.' }
      ]
    }
  }
}

export type MainWebsiteContent = typeof defaultMainWebsiteContent
