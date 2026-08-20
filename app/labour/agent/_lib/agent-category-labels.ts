import type { AgentLocale } from './agent-types'

const CATEGORY_LABELS_HI: Record<string, string> = {
  'aari work contractor': 'आरी वर्क कॉन्ट्रैक्टर',
  'aari work karigar': 'आरी वर्क कारीगर',
  'aari work karighar': 'आरी वर्क कारीगर',
  accountant: 'अकाउंटेंट',
  'adda work contractor': 'अड्डा वर्क कॉन्ट्रैक्टर',
  'adda work karigar': 'अड्डा वर्क कारीगर',
  'adda work karighar': 'अड्डा वर्क कारीगर',
  'buttoning contractor': 'बटनिंग कॉन्ट्रैक्टर',
  'cleaning staff': 'क्लीनिंग स्टाफ',
  'computer operator': 'कंप्यूटर ऑपरेटर',
  'cutting contractor': 'कटिंग कॉन्ट्रैक्टर',
  'cutting helper': 'कटिंग हेल्पर',
  'cutting master': 'कटिंग मास्टर',
  'dyeing contractor': 'डाइंग कॉन्ट्रैक्टर',
  'dyeing worker': 'डाइंग वर्कर',
  'e-commerce listing staff': 'ई-कॉमर्स लिस्टिंग स्टाफ',
  'embroidery karigar': 'एम्ब्रॉयडरी कारीगर',
  'embroidery machine operator': 'एम्ब्रॉयडरी मशीन ऑपरेटर',
  'embroidery worker': 'एम्ब्रॉयडरी वर्कर',
  'fabric checker': 'फैब्रिक चेकर',
  'fabric dyeing worker': 'फैब्रिक डाइंग वर्कर',
  'fabric loader / unloader': 'फैब्रिक लोडर / अनलोडर',
  'fashion designer': 'फैशन डिजाइनर',
  'finishing worker': 'फिनिशिंग वर्कर',
  'hand work karigar': 'हैंड वर्क कारीगर',
  'heat press operator': 'हीट प्रेस ऑपरेटर',
  'heat press printing contractor': 'हीट प्रेस प्रिंटिंग कॉन्ट्रैक्टर',
  helper: 'हेल्पर',
  'helper / assistant': 'हेल्पर / असिस्टेंट',
  'helper / general worker': 'हेल्पर / सामान्य कामगार',
  'housekeeping staff': 'हाउसकीपिंग स्टाफ',
  'kids stitching contractor': 'किड्स सिलाई कॉन्ट्रैक्टर',
  'machine operator': 'मशीन ऑपरेटर',
  'office boy': 'ऑफिस बॉय',
  'other categories': 'अन्य श्रेणियाँ',
  'overlock machine operator': 'ओवरलॉक मशीन ऑपरेटर',
  'packing worker': 'पैकिंग वर्कर',
  'pattern master': 'पैटर्न मास्टर',
  'press worker': 'प्रेस कामगार',
  'pressman / ironing': 'प्रेसमैन / इस्त्री',
  'pressman / ironing contractor': 'प्रेसमैन / इस्त्री कॉन्ट्रैक्टर',
  'pressman / ironing worker': 'प्रेसमैन / इस्त्री वर्कर',
  'printing contractor': 'प्रिंटिंग कॉन्ट्रैक्टर',
  'production manager': 'प्रोडक्शन मैनेजर',
  'quality checker': 'क्वालिटी चेकर',
  'retail sales executive': 'रिटेल सेल्स एग्जीक्यूटिव',
  'sampling master': 'सैंपलिंग मास्टर',
  'screen printing contractor': 'स्क्रीन प्रिंटिंग कॉन्ट्रैक्टर',
  'security guard': 'सिक्योरिटी गार्ड',
  'stitching contractor': 'सिलाई कॉन्ट्रैक्टर',
  'stitching karigar': 'सिलाई कारीगर',
  'stitching karighar': 'सिलाई कारीगर',
  'stock manager': 'स्टॉक मैनेजर',
  'store manager': 'स्टोर मैनेजर',
  tailor: 'टेलर',
  telesales: 'टेलीसेल्स',
  'textile printing master': 'टेक्सटाइल प्रिंटिंग मास्टर',
  'thread cutter': 'धागा काटने वाला',
  'thread cutting worker': 'धागा काटने वाला',
  'uniform stitching contractor': 'यूनिफॉर्म सिलाई कॉन्ट्रैक्टर',
  'uniform stitching karigar': 'यूनिफॉर्म सिलाई कारीगर',
  'zari work karigar': 'जरी वर्क कारीगर',
  'zari work karighar': 'जरी वर्क कारीगर',
}

function normalizeCategoryLabel(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function getAgentCategoryDisplayName(categoryName: string, locale: AgentLocale) {
  if (locale === 'en') {
    return categoryName
  }

  const normalized = normalizeCategoryLabel(categoryName)
  return CATEGORY_LABELS_HI[normalized] || categoryName
}
