import { createContext, useContext, useState, useCallback } from "react";

const translations = {
  en: {
    nav: { home: "Home", medicines: "Medicines", orders: "My Orders", dashboard: "Dashboard", inventory: "Inventory", pharmacy_orders: "Orders", cart: "Cart", login: "Login", logout: "Logout" },
    landing: {
      hero_title: "Your Medicine, Made Simple",
      hero_subtitle: "Compare prices, understand your medicines, and get them delivered from local pharmacies",
      get_started: "Get Started",
      pharmacy_join: "Join as Pharmacy",
      feature1_title: "AI Medicine Guide",
      feature1_desc: "Understand your medicines - usage, side effects, interactions explained in simple language",
      feature2_title: "Price Comparison",
      feature2_desc: "Compare medicine prices across local pharmacies. Same generic medicine, different brands, best price",
      feature3_title: "Fast Local Delivery",
      feature3_desc: "Order from nearby pharmacies and get medicines delivered to your doorstep",
      how_title: "How It Works",
      step1: "Search Medicine",
      step1_desc: "Search by name, generic name, or condition",
      step2: "Compare Prices",
      step2_desc: "See prices across all local pharmacies",
      step3: "Get AI Info",
      step3_desc: "Understand usage, side effects & interactions",
      step4: "Order & Deliver",
      step4_desc: "Choose the best deal and get it delivered",
    },
    auth: {
      login_title: "Welcome Back", register_title: "Create Account",
      email: "Email", password: "Password", name: "Full Name",
      role: "I am a", consumer: "Consumer", pharmacy_owner: "Pharmacy Owner",
      google_login: "Continue with Google", or: "or",
      no_account: "Don't have an account?", has_account: "Already have an account?",
      sign_up: "Sign Up", sign_in: "Sign In",
    },
    medicine: {
      search_placeholder: "Search medicines by name, generic name, or category...",
      all_categories: "All", view_details: "View Details",
      get_ai_info: "Get AI Medicine Info", loading_ai: "AI is analyzing this medicine...",
      usage: "Usage", how_to_take: "How to Take", side_effects: "Side Effects",
      interactions: "Drug Interactions", precautions: "Precautions", alternatives: "Alternatives",
      compare_prices: "Compare Prices", add_to_cart: "Add to Cart",
      prescription_required: "Rx Required", generic: "Generic", brand: "Brand",
      strength: "Strength", price: "Price", pharmacy: "Pharmacy", stock: "In Stock",
      ask_ai: "Ask AI Pharmacist", ask_placeholder: "Ask about any medicine...",
    },
    cart: {
      title: "Your Cart", empty: "Your cart is empty", delivery_address: "Delivery Address",
      delivery_phone: "Phone Number", total: "Total", place_order: "Place Order",
      remove: "Remove", browse: "Browse Medicines", qty: "Qty", from: "from",
    },
    orders: {
      title: "My Orders", no_orders: "No orders yet", order_id: "Order",
      status: "Status", total: "Total", placed: "Placed", confirmed: "Confirmed",
      preparing: "Preparing", out_for_delivery: "Out for Delivery",
      delivered: "Delivered", cancelled: "Cancelled", items: "items",
    },
    pharmacy: {
      dashboard: "Pharmacy Dashboard", setup_title: "Set Up Your Pharmacy",
      name: "Pharmacy Name", address: "Address", phone: "Phone",
      create: "Create Pharmacy", inventory: "Manage Inventory",
      add_medicine: "Add Medicine", total_products: "Total Products",
      total_orders: "Total Orders", brand_name: "Brand Name",
      select_medicine: "Select Medicine", save: "Save",
      incoming_orders: "Incoming Orders", update_status: "Update Status",
      no_inventory: "No items in inventory yet",
    },
    common: { loading: "Loading...", error: "Something went wrong", back: "Back", close: "Close", actions: "Actions" },
  },
  hi: {
    nav: { home: "होम", medicines: "दवाइयाँ", orders: "मेरे ऑर्डर", dashboard: "डैशबोर्ड", inventory: "इन्वेंटरी", pharmacy_orders: "ऑर्डर", cart: "कार्ट", login: "लॉगिन", logout: "लॉगआउट" },
    landing: {
      hero_title: "आपकी दवाई, आसान बनाई",
      hero_subtitle: "कीमतों की तुलना करें, अपनी दवाइयों को समझें, और स्थानीय फार्मेसी से डिलीवरी पाएं",
      get_started: "शुरू करें",
      pharmacy_join: "फार्मेसी के रूप में जुड़ें",
      feature1_title: "AI दवा गाइड",
      feature1_desc: "अपनी दवाइयों को समझें - उपयोग, साइड इफेक्ट्स, इंटरैक्शन सरल भाषा में",
      feature2_title: "कीमत तुलना",
      feature2_desc: "स्थानीय फार्मेसियों में दवा की कीमतों की तुलना करें। एक ही जेनेरिक दवा, अलग ब्रांड, सबसे अच्छी कीमत",
      feature3_title: "तेज़ स्थानीय डिलीवरी",
      feature3_desc: "नज़दीकी फार्मेसी से ऑर्डर करें और दवाइयाँ अपने घर पर पाएं",
      how_title: "यह कैसे काम करता है",
      step1: "दवा खोजें", step1_desc: "नाम, जेनेरिक नाम, या स्थिति से खोजें",
      step2: "कीमतें तुलना करें", step2_desc: "सभी स्थानीय फार्मेसियों में कीमतें देखें",
      step3: "AI जानकारी पाएं", step3_desc: "उपयोग, साइड इफेक्ट्स और इंटरैक्शन समझें",
      step4: "ऑर्डर और डिलीवरी", step4_desc: "सबसे अच्छी डील चुनें और डिलीवरी पाएं",
    },
    auth: {
      login_title: "वापस स्वागत है", register_title: "खाता बनाएं",
      email: "ईमेल", password: "पासवर्ड", name: "पूरा नाम",
      role: "मैं हूँ", consumer: "उपभोक्ता", pharmacy_owner: "फार्मेसी मालिक",
      google_login: "Google से जारी रखें", or: "या",
      no_account: "खाता नहीं है?", has_account: "पहले से खाता है?",
      sign_up: "रजिस्टर", sign_in: "लॉगिन",
    },
    medicine: {
      search_placeholder: "नाम, जेनेरिक नाम या श्रेणी से दवा खोजें...",
      all_categories: "सभी", view_details: "विवरण देखें",
      get_ai_info: "AI दवा जानकारी पाएं", loading_ai: "AI दवा का विश्लेषण कर रहा है...",
      usage: "उपयोग", how_to_take: "कैसे लें", side_effects: "साइड इफेक्ट्स",
      interactions: "दवा इंटरैक्शन", precautions: "सावधानियाँ", alternatives: "विकल्प",
      compare_prices: "कीमतें तुलना करें", add_to_cart: "कार्ट में डालें",
      prescription_required: "Rx ज़रूरी", generic: "जेनेरिक", brand: "ब्रांड",
      strength: "शक्ति", price: "कीमत", pharmacy: "फार्मेसी", stock: "स्टॉक में",
      ask_ai: "AI फार्मासिस्ट से पूछें", ask_placeholder: "किसी भी दवा के बारे में पूछें...",
    },
    cart: {
      title: "आपका कार्ट", empty: "आपका कार्ट खाली है", delivery_address: "डिलीवरी पता",
      delivery_phone: "फोन नंबर", total: "कुल", place_order: "ऑर्डर दें",
      remove: "हटाएं", browse: "दवाइयाँ देखें", qty: "मात्रा", from: "से",
    },
    orders: {
      title: "मेरे ऑर्डर", no_orders: "अभी कोई ऑर्डर नहीं", order_id: "ऑर्डर",
      status: "स्थिति", total: "कुल", placed: "रखा गया", confirmed: "पुष्ट",
      preparing: "तैयार हो रहा", out_for_delivery: "डिलीवरी के लिए निकला",
      delivered: "डिलीवर हुआ", cancelled: "रद्द", items: "आइटम",
    },
    pharmacy: {
      dashboard: "फार्मेसी डैशबोर्ड", setup_title: "अपनी फार्मेसी सेट करें",
      name: "फार्मेसी का नाम", address: "पता", phone: "फोन",
      create: "फार्मेसी बनाएं", inventory: "इन्वेंटरी प्रबंधन",
      add_medicine: "दवा जोड़ें", total_products: "कुल प्रोडक्ट्स",
      total_orders: "कुल ऑर्डर", brand_name: "ब्रांड का नाम",
      select_medicine: "दवा चुनें", save: "सेव करें",
      incoming_orders: "आने वाले ऑर्डर", update_status: "स्थिति अपडेट",
      no_inventory: "इन्वेंटरी में कोई आइटम नहीं",
    },
    common: { loading: "लोड हो रहा...", error: "कुछ गलत हुआ", back: "वापस", close: "बंद", actions: "कार्रवाई" },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === "en" ? "hi" : "en";
      localStorage.setItem("language", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key) => {
      const keys = key.split(".");
      let val = translations[language];
      for (const k of keys) {
        val = val?.[k];
      }
      return val || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
