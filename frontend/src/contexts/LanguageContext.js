import { createContext, useContext, useState, useCallback } from "react";

const T = {
  en: {
    nav: { home: "Home", medicines: "Medicines", orders: "My Orders", dashboard: "Dashboard", inventory: "Inventory", pharmacy_orders: "Orders", cart: "Cart", login: "Login", logout: "Logout", smart_order: "Smart Order", ai_pharmacist: "AI Pharmacist" },
    landing: {
      hero_title: "Smart Medicine,\nBetter Prices", hero_subtitle: "Compare prices across local pharmacies, buy by tablet, get AI-powered medicine guidance, and fastest delivery from your neighborhood stores",
      get_started: "Start Saving", pharmacy_join: "Register Your Pharmacy",
      feat1_t: "AI Pharmacist", feat1_d: "Upload prescription or ask about any medicine. Get info on usage, side effects, interactions in Hindi & English",
      feat2_t: "Price Compare", feat2_d: "Same medicine, different prices. Compare across nearby stores. Buy full strip or just the tablets you need",
      feat3_t: "Generic Savings", feat3_d: "Save up to 80% with generic alternatives. Same salt composition, same effect, fraction of the cost",
      feat4_t: "Fast Delivery", feat4_d: "Order from closest pharmacy. Smart routing picks the fastest combination when medicines span multiple stores",
      how_t: "How It Works", s1: "Search or Upload", s1d: "Type medicine name or upload prescription photo", s2: "Compare & Choose", s2d: "See prices, generics, Jan Aushadhi options", s3: "AI Explains", s3d: "Understand dosage, side effects, interactions", s4: "Order & Deliver", s4d: "Fastest delivery from nearest pharmacy",
      stat1: "Medicines", stat2: "Local Stores", stat3: "Avg Savings", cta: "Find Cheaper Medicines Now",
    },
    auth: { login_title: "Welcome Back", register_title: "Create Account", email: "Email", password: "Password", name: "Full Name", role: "I am a", consumer: "Consumer", pharmacy_owner: "Pharmacy Owner", google_login: "Continue with Google", or: "or", no_account: "Don't have an account?", has_account: "Already have an account?", sign_up: "Sign Up", sign_in: "Sign In" },
    medicine: {
      search_placeholder: "Search medicines, salts, brands...", all_categories: "All", view_details: "View Details",
      get_ai_info: "AI Medicine Info", loading_ai: "AI analyzing...",
      usage: "Usage", how_to_take: "How to Take", side_effects: "Side Effects", interactions: "Drug Interactions", food_interactions: "Food Interactions", precautions: "Precautions", storage: "Storage", alternatives: "Alternatives",
      compare_prices: "Compare Prices", add_to_cart: "Add to Cart", prescription_required: "Rx Required",
      generic: "Generic", brand: "Brand", strength: "Strength", price: "Price", pharmacy: "Pharmacy", stock: "Stock",
      ask_ai: "Ask AI Pharmacist", ask_placeholder: "Ask about any medicine...",
      salt: "Salt Composition", per_strip: "/strip", per_tablet: "/tablet", tablets: "tablets",
      save_with_generic: "Save with Generic", jan_aushadhi: "Jan Aushadhi", savings: "Save",
      upload_rx: "Upload Prescription", buy_tablets: "Buy Tablets", buy_strip: "Buy Strip",
    },
    smart: { title: "Smart Order", subtitle: "Get the best deal across multiple stores", add_medicine: "Add Medicine", optimize: "Find Best Deal", cheapest: "Cheapest", fastest: "Fastest", single_store: "Single Store", stores: "stores", delivery: "Delivery", select_option: "Select This", no_results: "Add medicines to optimize", eta: "min" },
    ai: { title: "AI Pharmacist", subtitle: "Ask anything about medicines", placeholder: "Ask about any medicine, side effect, interaction...", speak: "Speak", listening: "Listening...", disclaimer: "AI-generated info. Always consult your doctor.", upload_rx: "Upload Prescription", extracted: "Extracted Medicines", play_voice: "Listen" },
    cart: { title: "Cart", empty: "Your cart is empty", delivery_address: "Delivery Address", delivery_phone: "Phone Number", total: "Total", place_order: "Place Order", remove: "Remove", browse: "Browse Medicines", qty: "Qty", from: "from" },
    orders: { title: "My Orders", no_orders: "No orders yet", order_id: "Order", status: "Status", total: "Total", placed: "Placed", confirmed: "Confirmed", preparing: "Preparing", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", items: "items" },
    pharmacy: { dashboard: "Pharmacy Dashboard", setup_title: "Register Your Pharmacy", name: "Pharmacy Name", address: "Address", phone: "Phone", create: "Register Pharmacy", inventory: "Inventory", add_medicine: "Add Medicine", total_products: "Products", total_orders: "Orders", total_revenue: "Revenue", brand_name: "Brand Name", select_medicine: "Select Medicine", save: "Save", incoming_orders: "Incoming Orders", update_status: "Update Status", no_inventory: "No inventory yet", expiring_soon: "Expiring Soon", low_stock: "Low Stock", mrp: "MRP", selling_price: "Selling Price", batch: "Batch", expiry: "Expiry", loose_tablets: "Loose Tablets" },
    common: { loading: "Loading...", error: "Something went wrong", back: "Back", close: "Close", actions: "Actions" },
  },
  hi: {
    nav: { home: "होम", medicines: "दवाइयाँ", orders: "मेरे ऑर्डर", dashboard: "डैशबोर्ड", inventory: "इन्वेंटरी", pharmacy_orders: "ऑर्डर", cart: "कार्ट", login: "लॉगिन", logout: "लॉगआउट", smart_order: "स्मार्ट ऑर्डर", ai_pharmacist: "AI फार्मासिस्ट" },
    landing: {
      hero_title: "स्मार्ट दवाई,\nबेहतर कीमत", hero_subtitle: "स्थानीय फार्मेसियों में कीमतें तुलना करें, टैबलेट के हिसाब से खरीदें, AI दवा गाइड पाएं, और सबसे तेज़ डिलीवरी",
      get_started: "बचत शुरू करें", pharmacy_join: "फार्मेसी रजिस्टर करें",
      feat1_t: "AI फार्मासिस्ट", feat1_d: "प्रिस्क्रिप्शन अपलोड करें या किसी भी दवा के बारे में पूछें। हिंदी और अंग्रेजी में जानकारी पाएं",
      feat2_t: "कीमत तुलना", feat2_d: "एक ही दवा, अलग कीमतें। पास की दुकानों में तुलना करें। पूरी स्ट्रिप या सिर्फ़ ज़रूरी गोलियाँ खरीदें",
      feat3_t: "जेनेरिक से बचत", feat3_d: "जेनेरिक विकल्पों से 80% तक बचाएं। एक ही साल्ट, एक ही असर, बहुत कम कीमत",
      feat4_t: "तेज़ डिलीवरी", feat4_d: "सबसे नज़दीकी फार्मेसी से ऑर्डर करें। स्मार्ट रूटिंग सबसे तेज़ रास्ता चुनती है",
      how_t: "यह कैसे काम करता है", s1: "खोजें या अपलोड करें", s1d: "दवा का नाम लिखें या प्रिस्क्रिप्शन फ़ोटो अपलोड करें", s2: "तुलना करें और चुनें", s2d: "कीमतें, जेनेरिक, जन औषधि विकल्प देखें", s3: "AI बताए", s3d: "खुराक, साइड इफेक्ट्स, इंटरैक्शन समझें", s4: "ऑर्डर और डिलीवरी", s4d: "नज़दीकी फार्मेसी से तेज़ डिलीवरी",
      stat1: "दवाइयाँ", stat2: "स्थानीय दुकानें", stat3: "औसत बचत", cta: "सस्ती दवाइयाँ खोजें",
    },
    auth: { login_title: "वापस स्वागत है", register_title: "खाता बनाएं", email: "ईमेल", password: "पासवर्ड", name: "पूरा नाम", role: "मैं हूँ", consumer: "उपभोक्ता", pharmacy_owner: "फार्मेसी मालिक", google_login: "Google से जारी रखें", or: "या", no_account: "खाता नहीं है?", has_account: "पहले से खाता है?", sign_up: "रजिस्टर", sign_in: "लॉगिन" },
    medicine: {
      search_placeholder: "दवा, साल्ट, ब्रांड खोजें...", all_categories: "सभी", view_details: "विवरण",
      get_ai_info: "AI दवा जानकारी", loading_ai: "AI विश्लेषण कर रहा...",
      usage: "उपयोग", how_to_take: "कैसे लें", side_effects: "साइड इफेक्ट्स", interactions: "दवा इंटरैक्शन", food_interactions: "खाने का ध्यान", precautions: "सावधानियाँ", storage: "भंडारण", alternatives: "विकल्प",
      compare_prices: "कीमतें तुलना", add_to_cart: "कार्ट में डालें", prescription_required: "Rx ज़रूरी",
      generic: "जेनेरिक", brand: "ब्रांड", strength: "शक्ति", price: "कीमत", pharmacy: "फार्मेसी", stock: "स्टॉक",
      ask_ai: "AI फार्मासिस्ट से पूछें", ask_placeholder: "किसी भी दवा के बारे में पूछें...",
      salt: "साल्ट कंपोज़िशन", per_strip: "/स्ट्रिप", per_tablet: "/गोली", tablets: "गोलियाँ",
      save_with_generic: "जेनेरिक से बचाएं", jan_aushadhi: "जन औषधि", savings: "बचत",
      upload_rx: "प्रिस्क्रिप्शन अपलोड", buy_tablets: "गोलियाँ खरीदें", buy_strip: "स्ट्रिप खरीदें",
    },
    smart: { title: "स्मार्ट ऑर्डर", subtitle: "कई दुकानों से सबसे अच्छी डील पाएं", add_medicine: "दवा जोड़ें", optimize: "सबसे अच्छी डील खोजें", cheapest: "सबसे सस्ता", fastest: "सबसे तेज़", single_store: "एक दुकान", stores: "दुकानें", delivery: "डिलीवरी", select_option: "यह चुनें", no_results: "ऑप्टिमाइज़ करने के लिए दवाइयाँ जोड़ें", eta: "मिनट" },
    ai: { title: "AI फार्मासिस्ट", subtitle: "दवाओं के बारे में कुछ भी पूछें", placeholder: "किसी भी दवा, साइड इफेक्ट, इंटरैक्शन के बारे में पूछें...", speak: "बोलें", listening: "सुन रहा...", disclaimer: "AI जानकारी। हमेशा डॉक्टर से सलाह लें।", upload_rx: "प्रिस्क्रिप्शन अपलोड", extracted: "निकाली गई दवाइयाँ", play_voice: "सुनें" },
    cart: { title: "कार्ट", empty: "कार्ट खाली है", delivery_address: "डिलीवरी पता", delivery_phone: "फोन नंबर", total: "कुल", place_order: "ऑर्डर दें", remove: "हटाएं", browse: "दवाइयाँ देखें", qty: "मात्रा", from: "से" },
    orders: { title: "मेरे ऑर्डर", no_orders: "कोई ऑर्डर नहीं", order_id: "ऑर्डर", status: "स्थिति", total: "कुल", placed: "रखा गया", confirmed: "पुष्ट", preparing: "तैयारी", out_for_delivery: "रास्ते में", delivered: "डिलीवर", cancelled: "रद्द", items: "आइटम" },
    pharmacy: { dashboard: "फार्मेसी डैशबोर्ड", setup_title: "फार्मेसी रजिस्टर करें", name: "फार्मेसी नाम", address: "पता", phone: "फोन", create: "रजिस्टर करें", inventory: "इन्वेंटरी", add_medicine: "दवा जोड़ें", total_products: "प्रोडक्ट्स", total_orders: "ऑर्डर", total_revenue: "आय", brand_name: "ब्रांड", select_medicine: "दवा चुनें", save: "सेव", incoming_orders: "आने वाले ऑर्डर", update_status: "स्थिति अपडेट", no_inventory: "इन्वेंटरी खाली है", expiring_soon: "जल्द एक्सपायर", low_stock: "कम स्टॉक", mrp: "MRP", selling_price: "बिक्री मूल्य", batch: "बैच", expiry: "एक्सपायरी", loose_tablets: "खुली गोलियाँ" },
    common: { loading: "लोड हो रहा...", error: "कुछ गलत हुआ", back: "वापस", close: "बंद", actions: "कार्रवाई" },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");
  const toggleLanguage = useCallback(() => {
    setLanguage((p) => { const n = p === "en" ? "hi" : "en"; localStorage.setItem("language", n); return n; });
  }, []);
  const t = useCallback((key) => {
    const keys = key.split(".");
    let val = T[language];
    for (const k of keys) val = val?.[k];
    return val || key;
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => { const ctx = useContext(LanguageContext); if (!ctx) throw new Error("useLanguage must be within LanguageProvider"); return ctx; };
