import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, LogOut, Globe, Pill, Package, LayoutDashboard, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/40" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Pill className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground tracking-tight">
              MedConnect
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {user?.role === "consumer" && (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-sm gap-2" data-testid="nav-medicines">
                    <Pill className="h-4 w-4" /> {t("nav.medicines")}
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="ghost" className="text-sm gap-2" data-testid="nav-orders">
                    <Package className="h-4 w-4" /> {t("nav.orders")}
                  </Button>
                </Link>
              </>
            )}
            {user?.role === "pharmacy_owner" && (
              <>
                <Link to="/pharmacy">
                  <Button variant="ghost" className="text-sm gap-2" data-testid="nav-pharmacy-dashboard">
                    <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                  </Button>
                </Link>
                <Link to="/pharmacy/orders">
                  <Button variant="ghost" className="text-sm gap-2" data-testid="nav-pharmacy-orders">
                    <ClipboardList className="h-4 w-4" /> {t("nav.pharmacy_orders")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost" size="sm"
              onClick={toggleLanguage}
              className="gap-1 text-xs font-medium"
              data-testid="language-toggle"
            >
              <Globe className="h-4 w-4" />
              {language === "en" ? "HI" : "EN"}
            </Button>

            {user?.role === "consumer" && (
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" data-testid="nav-cart">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid="user-menu-trigger">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.picture ? (
                        <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm">{user.name?.split(" ")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                    <LogOut className="h-4 w-4 mr-2" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 text-sm"
                  data-testid="nav-login-btn"
                >
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
