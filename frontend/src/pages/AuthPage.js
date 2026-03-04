import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pill, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") || "consumer";

  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: defaultRole });

  useEffect(() => {
    if (user) navigate(user.role === "consumer" ? "/dashboard" : "/pharmacy", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(u.role === "consumer" ? "/dashboard" : "/pharmacy");
    } catch (err) {
      toast.error(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await register(form.email, form.password, form.name, form.role);
      navigate(u.role === "consumer" ? "/dashboard" : "/pharmacy");
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("pendingRole", form.role);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12" data-testid="auth-page">
      <Card className="w-full max-w-md border border-border/40 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <Pill className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-heading text-2xl">MedConnect</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">{t("auth.sign_in")}</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">{t("auth.sign_up")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">{t("auth.email")}</Label>
                  <Input
                    id="login-email" type="email" required
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com" data-testid="login-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">{t("auth.password")}</Label>
                  <Input
                    id="login-password" type="password" required
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" data-testid="login-password-input"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-full" disabled={loading} data-testid="login-submit-btn">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.sign_in")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name">{t("auth.name")}</Label>
                  <Input
                    id="reg-name" required
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name" data-testid="register-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email">{t("auth.email")}</Label>
                  <Input
                    id="reg-email" type="email" required
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com" data-testid="register-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">{t("auth.password")}</Label>
                  <Input
                    id="reg-password" type="password" required minLength={6}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" data-testid="register-password-input"
                  />
                </div>
                <div>
                  <Label>{t("auth.role")}</Label>
                  <div className="flex gap-3 mt-1">
                    {["consumer", "pharmacy_owner"].map((role) => (
                      <button
                        key={role} type="button"
                        onClick={() => setForm({ ...form, role })}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${
                          form.role === role
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                        data-testid={`role-${role}-btn`}
                      >
                        {t(`auth.${role}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-full" disabled={loading} data-testid="register-submit-btn">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.sign_up")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>

          <Button
            variant="outline" className="w-full rounded-full gap-2"
            onClick={handleGoogleLogin}
            data-testid="google-login-btn"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("auth.google_login")}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {tab === "login" ? t("auth.no_account") : t("auth.has_account")}{" "}
            <button
              onClick={() => setTab(tab === "login" ? "register" : "login")}
              className="text-primary font-medium hover:underline"
              data-testid="toggle-auth-mode"
            >
              {tab === "login" ? t("auth.sign_up") : t("auth.sign_in")}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
