import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, LogOut, Globe, Pill, Package, LayoutDashboard, ClipboardList, Bot, Zap } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/30 shadow-sm" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Pill className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">MedConnect</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {user?.role === "consumer" && (
              <>
                <Link to="/dashboard"><Button variant="ghost" size="sm" className="text-sm gap-1.5" data-testid="nav-medicines"><Pill className="h-3.5 w-3.5" />{t("nav.medicines")}</Button></Link>
                <Link to="/smart-order"><Button variant="ghost" size="sm" className="text-sm gap-1.5" data-testid="nav-smart-order"><Zap className="h-3.5 w-3.5" />{t("nav.smart_order")}</Button></Link>
                <Link to="/ai-pharmacist"><Button variant="ghost" size="sm" className="text-sm gap-1.5" data-testid="nav-ai-pharmacist"><Bot className="h-3.5 w-3.5" />{t("nav.ai_pharmacist")}</Button></Link>
                <Link to="/orders"><Button variant="ghost" size="sm" className="text-sm gap-1.5" data-testid="nav-orders"><Package className="h-3.5 w-3.5" />{t("nav.orders")}</Button></Link>
              </>
            )}
            {user?.role === "pharmacy_owner" && (
              <>
                <Link to="/pharmacy"><Button variant="ghost" size="sm" className="text-sm gap-1.5" data-testid="nav-pharmacy-dashboard"><LayoutDashboard className="h-3.5 w-3.5" />{t("nav.dashboard")}</Button></Link>
                <Link to="/pharmacy/orders"><Button variant="ghost" size="sm" className="text-sm gap-1.5" data-testid="nav-pharmacy-orders"><ClipboardList className="h-3.5 w-3.5" />{t("nav.pharmacy_orders")}</Button></Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1 text-xs font-semibold px-2.5" data-testid="language-toggle">
              <Globe className="h-3.5 w-3.5" />{language === "en" ? "HI" : "EN"}
            </Button>
            {user?.role === "consumer" && (
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="nav-cart">
                  <ShoppingCart className="h-4.5 w-4.5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] flex items-center justify-center p-0 text-[10px] bg-secondary text-secondary-foreground border-0 rounded-full">{itemCount}</Badge>
                  )}
                </Button>
              </Link>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2" data-testid="user-menu-trigger">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.picture ? <img src={user.picture} alt="" className="w-7 h-7 rounded-full" /> : <User className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className="hidden sm:inline text-xs font-medium">{user.name?.split(" ")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await logout(); navigate("/"); }} className="text-destructive" data-testid="logout-btn"><LogOut className="h-3.5 w-3.5 mr-2" />{t("nav.logout")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth"><Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 h-8 text-xs font-semibold" data-testid="nav-login-btn">{t("nav.login")}</Button></Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
