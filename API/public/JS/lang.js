console.log('lang.js loaded!');

const translations = {
  "Dashboard": "ڈیش بورڈ",
  "Map": "نقشہ",
  "Reports": "رپورٹس",
  "Events": "تقریبات",
  "Analytics": "تجزیات",
  "Community": "کمیونٹی",
  "Help": "مدد",
  "Sign In / Sign Up": "سائن ان / سائن اپ",
  "Signup/Signin": "سائن اپ / سائن ان",
  "Logout": "لاگ آؤٹ",
  "EcoTracker": "ایکو ٹریکر",
  "Admin Panel": "ایڈمن پینل",
  "Admin": "ایڈمن",
  "Moderate Reports": "رپورٹس کی نگرانی",
  "Manage Events": "تقریبات کا انتظام",
  "Inbox Messages": "ان باکس پیغامات",
  "User Management": "صارف کا انتظام",
  "Dashboard Overview": "ڈیش بورڈ کا جائزہ",
  "Welcome back! Here's what's happening in your area.": "خوش آمدید! آپ کے علاقے میں یہ ہو رہا ہے۔",
  "Report Incident": "واقعہ رپورٹ کریں",
  "Total Reports": "کل رپورٹس",
  "Recent reports in your area": "آپ کے علاقے میں حالیہ رپورٹس",
  "View Reports": "رپورٹس دیکھیں",
  "Critical Incidents": "اہم واقعات",
  "Require immediate attention": "فوری توجہ کی ضرورت ہے",
  "View Alerts": "الرٹس دیکھیں",
  "Resolution Progress": "حل کی پیش رفت",
  "Recent Activity": "حالیہ سرگرمی",
  "View All": "سب دیکھیں",
  "See Details": "تفصیلات دیکھیں",
  "Loading report statistics...": "لوڈ ہو رہا ہے...",
  "All reports resolved!": "تمام رپورٹس حل ہو گئیں!",
  "All Reports": "تمام رپورٹس",
  "My Reports": "میری رپورٹس",
  "Reported Incidents": "رپورٹ شدہ واقعات",
  "Reports Overview": "رپورٹس کا جائزہ",
  "Reports by Area & Category": "علاقے اور زمرے کے مطابق رپورٹس",
  "View and manage environmental reports from the community": "کمیونٹی کی ماحولیاتی رپورٹس دیکھیں",
  "All Categories": "تمام زمرے",
  "All Statuses": "تمام حالات",
  "All Areas": "تمام علاقے",
  "All": "تمام",
  "All Events": "تمام تقریبات",
  "Select Status": "حالت منتخب کریں",
  "Pending Review": "زیر التواء",
  "Pending": "زیر التواء",
  "pending": "زیر التواء",
  "Resolved": "حل شدہ",
  "resolved": "حل شدہ",
  "Resolved Today": "آج حل شدہ",
  "Reported": "رپورٹ شدہ",
  "reported": "رپورٹ شدہ",
  "In Review": "جائزے میں",
  "in review": "جائزے میں",
  "inreview": "جائزے میں",
  "Inreview": "جائزے میں",
  "Verified": "تصدیق شدہ",
  "verified": "تصدیق شدہ",
  "Completed": "مکمل",
  "completed": "مکمل",
  "Upcoming": "آنے والا",
  "upcoming": "آنے والا",
  "Accepted": "قبول شدہ",
  "accepted": "قبول شدہ",
  "No reports found": "کوئی رپورٹ نہیں ملی",
  "Loading reports for moderation...": "رپورٹس لوڈ ہو رہی ہیں...",
  "Upvote": "حق میں ووٹ",
  "Downvote": "خلاف ووٹ",
  "Comments": "تبصرے",
  "Add Comment": "تبصرہ شامل کریں",
  "Delete": "حذف کریں",
  "Edit": "ترمیم",
  "Submit": "جمع کریں",
  "Cancel": "منسوخ کریں",
  "Report Environmental Incident": "ماحولیاتی واقعہ رپورٹ کریں",
  "Track and report environmental issues in your community": "اپنی کمیونٹی میں ماحولیاتی مسائل رپورٹ کریں",
  "Title": "عنوان",
  "Description": "تفصیل",
  "Category": "زمرہ",
  "Location": "مقام",
  "Severity": "شدت",
  "Severity Level": "شدت کی سطح",
  "Low": "کم",
  "Medium": "درمیانہ",
  "High": "زیادہ",
  "Critical": "اہم",
  "Select a category": "زمرہ منتخب کریں",
  "Select a location": "مقام منتخب کریں",
  "Select severity": "شدت منتخب کریں",
  "Upload a file": "فائل اپلوڈ کریں",
  "or drag and drop": "یا گھسیٹ کر چھوڑیں",
  "PNG, JPG, GIF up to 10MB": "PNG, JPG, GIF 10MB تک",
  "Submit Report": "رپورٹ جمع کریں",
  "Submit anonymously": "گمنام جمع کریں",
  "Photo (optional)": "تصویر (اختیاری)",
  "Document": "دستاویز",
  "Infrastructure": "بنیادی ڈھانچہ",
  "Garbage": "کچرا",
  "Water": "پانی",
  "Safety": "حفاظت",
  "Electricity": "بجلی",
  "Transport": "نقل و حمل",
  "Environment": "ماحولیات",
  "Waste Dumping": "کچرا پھینکنا",
  "Water Pollution": "آبی آلودگی",
  "Air Quality": "ہوا کا معیار",
  "Noise Pollution": "شور آلودگی",
  "Other": "دیگر",
  "Incident Map": "واقعات کا نقشہ",
  "Select location": "مقام منتخب کریں",
  "Search & View": "تلاش کریں",
  "Areas in Karachi": "کراچی کے علاقے",
  "Clifton": "کلفٹن",
  "Gulshan": "گلشن",
  "DHA": "ڈی ایچ اے",
  "Korangi": "کورنگی",
  "– Clifton": "– کلفٹن",
  "Login": "لاگ ان",
  "Sign Up": "سائن اپ",
  "Email": "ای میل",
  "Email Address": "ای میل پتہ",
  "Password": "پاس ورڈ",
  "Password (leave blank to keep current)": "پاس ورڈ (خالی چھوڑیں تو پرانا رہے گا)",
  "Full Name": "پورا نام",
  "Name": "نام",
  "Confirm Password": "پاس ورڈ کی تصدیق کریں",
  "Don't have an account?": "اکاؤنٹ نہیں ہے؟",
  "Already have an account?": "پہلے سے اکاؤنٹ ہے؟",
  "Forgot Password?": "پاس ورڈ بھول گئے؟",
  "Welcome to": "خوش آمدید",
  "Help us protect the environment": "ماحول کی حفاظت میں مدد کریں",
  "Create your account to start tracking environmental issues": "ماحولیاتی مسائل ٹریک کرنے کے لیے اکاؤنٹ بنائیں",
  "Privacy Policy": "رازداری کی پالیسی",
  "Terms": "شرائط",
  "Community Hub": "کمیونٹی مرکز",
  "Community Chat": "کمیونٹی چیٹ",
  "Connect with environmental activists and share insights": "ماحولیاتی کارکنوں سے جڑیں",
  "Eco Feed": "ایکو فیڈ",
  "Discussions": "بحث و مباحثہ",
  "Send Message": "پیغام بھیجیں",
  "Select Area": "علاقہ منتخب کریں",
  "Send": "بھیجیں",
  "No messages yet. Start the conversation!": "ابھی تک کوئی پیغام نہیں۔ بات چیت شروع کریں!",
  "15 discussions": "15 بحث",
  "18 discussions": "18 بحث",
  "24 discussions": "24 بحث",
  "32 discussions": "32 بحث",
  "Join": "شامل ہوں",
  "EcoTracker Events": "ایکو ٹریکر تقریبات",
  "Manage and participate in environmental events": "ماحولیاتی تقریبات میں حصہ لیں",
  "Upcoming Events": "آنے والی تقریبات",
  "Event Log": "تقریبات کا ریکارڈ",
  "Create New Event": "نئی تقریب بنائیں",
  "RSVP": "شرکت کی تصدیق کریں",
  "Date": "تاریخ",
  "Venue": "مقام",
  "Status": "حالت",
  "No upcoming events": "کوئی آنے والی تقریب نہیں",
  "Eco Tracker Analytics": "ایکو ٹریکر تجزیات",
  "Track environmental trends and community impact": "ماحولیاتی رجحانات ٹریک کریں",
  "Reports by Category": "زمرے کے مطابق رپورٹس",
  "Reports by Status": "حالت کے مطابق رپورٹس",
  "Monthly Trends": "ماہانہ رجحانات",
  "Top Locations": "اہم مقامات",
  "Most Reported Category": "سب سے زیادہ رپورٹ شدہ زمرہ",
  "Top Area": "اہم علاقہ",
  "Critical Reports": "اہم رپورٹس",
  "% Critical Reports": "% اہم رپورٹس",
  "Help Center": "مدد مرکز",
  "Help & Support": "مدد اور سپورٹ",
  "Find answers to your questions and get support": "اپنے سوالات کے جوابات تلاش کریں",
  "Frequently Asked Questions": "اکثر پوچھے گئے سوالات",
  "Technical Support": "تکنیکی مدد",
  "Reporting Problems": "رپورٹنگ کے مسائل",
  "Account Issues": "اکاؤنٹ کے مسائل",
  "Feature Request": "فیچر کی درخواست",
  "Select a topic": "موضوع منتخب کریں",
  "Contact Support": "سپورٹ سے رابطہ کریں",
  "Contact Information": "رابطہ کی معلومات",
  "Contact us": "ہم سے رابطہ کریں",
  "Can't find your answer?": "جواب نہیں ملا؟",
  "Can't find what you're looking for? Our support team is here to help.": "ہماری سپورٹ ٹیم آپ کی مدد کے لیے موجود ہے۔",
  "Your Email": "آپ کی ای میل",
  "Subject": "موضوع",
  "Message": "پیغام",
  "Technical": "تکنیکی",
  "Reporting": "رپورٹنگ",
  "General": "عمومی",
  "How do I create an account?": "اکاؤنٹ کیسے بنائیں؟",
  "What happens after I submit a report?":"رپورٹ جمع کرنے کے بعد کیا ہوتا ہے؟",
  "Is EcoTracker free to use?": "کیا ایکو ٹریکر مفت ہے؟",
  "Can I organize cleanup events through EcoTracker?":"کیا میں ایکو ٹریکر کے ذریعے صفائی کی تقریبات منظم کر سکتا ہوں؟",
  "The map isn't loading properly. What should I do?":"نقشہ صحیح طریقے سے لوڈ نہیں ہو رہا۔ مجھے کیا کرنا چاہیے؟",
  "How do I report an environmental issue?": "ماحولیاتی مسئلہ کیسے رپورٹ کریں؟",
  "How do I join community discussions?": "کمیونٹی بحث میں کیسے شامل ہوں؟",
  "How do I reset my password?": "پاس ورڈ کیسے ری سیٹ کریں؟",
  "User Profile Page": "صارف پروفائل",
  "My Profile": "میری پروفائل",
  "Update User": "صارف اپ ڈیٹ کریں",
  "Settings": "ترتیبات",
  "Update Profile": "پروفائل اپ ڈیٹ کریں",
  "Change Password": "پاس ورڈ تبدیل کریں",
  "Badges": "بیجز",
  "Joined": "شامل ہوئے",
  "Approve": "منظور کریں",
  "Reject": "رد کریں",
  "Ban User": "صارف کو بین کریں",
  "Mark Resolved": "حل شدہ نشان کریں",
  "Users": "صارفین",
  "Active": "فعال",
  "Banned": "بین شدہ",
  "Loading...": "لوڈ ہو رہا ہے...",
  "Save": "محفوظ کریں",
  "Close": "بند کریں",
  "Back": "واپس",
  "Search": "تلاش",
  "Filter": "فلٹر",
  "Yes": "ہاں",
  "No": "نہیں",
  "Confirm": "تصدیق کریں",
  "Success": "کامیابی",
  "Error": "خرابی",
  "No data available": "کوئی ڈیٹا دستیاب نہیں",
};

// Global status translator for dynamically injected content
window.translateStatus = function(status) {
  const lang = localStorage.getItem('ecoLang') || 'en';
  if (lang !== 'ur') return status;
  const map = {
    'reported': 'رپورٹ شدہ',
    'inreview': 'جائزے میں',
    'in review': 'جائزے میں',
    'InReview': 'جائزے میں',
    'verified': 'تصدیق شدہ',
    'resolved': 'حل شدہ',
    'pending': 'زیر التواء',
    'completed': 'مکمل',
    'upcoming': 'آنے والا',
    'accepted': 'قبول شدہ',
    'unknown': 'نامعلوم'
  };
  return map[status.toLowerCase()] || status;
};

(function () {
  let lang = localStorage.getItem('ecoLang') || 'en';

  function injectBtn() {
    if (document.getElementById('lang-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.innerHTML = lang === 'en' ? '🇵🇰 اردو' : '🇬🇧 English';
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#10b981;color:#fff;border:none;border-radius:50px;padding:10px 18px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.25);';
    btn.onclick = () => {
      lang = lang === 'en' ? 'ur' : 'en';
      localStorage.setItem('ecoLang', lang);
      btn.innerHTML = lang === 'en' ? '🇵🇰 اردو' : '🇬🇧 English';
      applyLang();
    };
    document.body.appendChild(btn);
  }

  function applyLang() {
    const isUr = lang === 'ur';
    document.querySelectorAll('span, h1, h2, h3, p, a, button, label, th, td, li, option').forEach(el => {
      // Allow elements with only an <i> icon tag as child

       if (el.id === 'user-name-text') return;
      if (el.children.length > 1) return;
      if (el.children.length === 1 && el.children[0].tagName !== 'I') return;

      // Get text (excluding icon text)
      let text = '';
      el.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
      });
      text = text.trim();
      if (!text) return;

      if (!el.dataset.en) el.dataset.en = text;

      if (isUr && translations[el.dataset.en]) {
        // Replace only text node, keep icon
        el.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = ' ' + translations[el.dataset.en];
          }
        });
      } else if (!isUr && el.dataset.en) {
        el.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = ' ' + el.dataset.en;
          }
        });
      }
    });

    document.documentElement.dir = isUr ? 'rtl' : 'ltr';
    if (isUr) {
      document.body.style.fontFamily = "'Noto Nastaliq Urdu', serif";
      if (!document.getElementById('urdu-font')) {
        const l = document.createElement('link');
        l.id = 'urdu-font'; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap';
        document.head.appendChild(l);
      }
    } else {
      document.body.style.fontFamily = "'Inter', sans-serif";
    }
  }

  let observerTimeout;
  const observer = new MutationObserver(() => {
    if (lang === 'ur') {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(applyLang, 150);
    }
  });

  function init() {
    injectBtn();
    applyLang();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();