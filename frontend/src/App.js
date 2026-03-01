import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import VoiceAssistant from "@/components/VoiceAssistant";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import AuthCallback from "@/pages/AuthCallback";
import ConsumerDashboard from "@/pages/ConsumerDashboard";
import MedicineDetail from "@/pages/MedicineDetail";
import SmartOrderPage from "@/pages/SmartOrderPage";
import AiPharmacistPage from "@/pages/AiPharmacistPage";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import PharmacyDashboard from "@/pages/PharmacyDashboard";
import PharmacyOrders from "@/pages/PharmacyOrders";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="consumer"><ConsumerDashboard /></ProtectedRoute>} />
        <Route path="/medicine/:id" element={<ProtectedRoute requiredRole="consumer"><MedicineDetail /></ProtectedRoute>} />
        <Route path="/smart-order" element={<ProtectedRoute requiredRole="consumer"><SmartOrderPage /></ProtectedRoute>} />
        <Route path="/ai-pharmacist" element={<ProtectedRoute requiredRole="consumer"><AiPharmacistPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute requiredRole="consumer"><CartPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute requiredRole="consumer"><OrdersPage /></ProtectedRoute>} />
        <Route path="/pharmacy" element={<ProtectedRoute requiredRole="pharmacy_owner"><PharmacyDashboard /></ProtectedRoute>} />
        <Route path="/pharmacy/orders" element={<ProtectedRoute requiredRole="pharmacy_owner"><PharmacyOrders /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <VoiceAssistant />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <AppRouter />
            <Toaster richColors position="top-right" />
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
