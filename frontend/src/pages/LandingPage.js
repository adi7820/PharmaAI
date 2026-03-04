import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, Search, IndianRupee, Truck, ArrowRight, Camera, Pill, MapPin, Star, Sparkles } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Bot, title: t("landing.feat1_t"), desc: t("landing.feat1_d"), gradient: "from-primary/10 to-primary/5" },
    { icon: Search, title: t("landing.feat2_t"), desc: t("landing.feat2_d"), gradient: "from-secondary/10 to-secondary/5" },
    { icon: IndianRupee, title: t("landing.feat3_t"), desc: t("landing.feat3_d"), gradient: "from-green-100/60 to-green-50/40" },
    { icon: Truck, title: t("landing.feat4_t"), desc: t("landing.feat4_d"), gradient: "from-primary/10 to-primary/5" },
  ];

  const steps = [
    { n: "01", icon: Camera, t: t("landing.s1"), d: t("landing.s1d") },
    { n: "02", icon: Search, t: t("landing.s2"), d: t("landing.s2d") },
    { n: "03", icon: Bot, t: t("landing.s3"), d: t("landing.s3d") },
    { n: "04", icon: Truck, t: t("landing.s4"), d: t("landing.s4d") },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-16 md:pb-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-7 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold bg-primary/5 px-3 py-1 rounded-full">MedConnect</span>
                <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-1"><Star className="h-2.5 w-2.5" />Trusted Platform</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-5 leading-[1.08] whitespace-pre-line">
                {t("landing.hero_title")}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-xl">
                {t("landing.hero_subtitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7 py-5 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" data-testid="hero-get-started-btn">
                  {t("landing.get_started")} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/auth?role=pharmacy_owner")} className="border-2 border-primary/30 text-primary hover:bg-primary/5 rounded-full px-7 py-5 text-sm font-bold" data-testid="hero-pharmacy-btn">
                  {t("landing.pharmacy_join")}
                </Button>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-8 mt-10">
                {[{ v: "500+", l: t("landing.stat1") }, { v: "50+", l: t("landing.stat2") }, { v: "40%", l: t("landing.stat3") }].map((s, i) => (
                  <div key={i}>
                    <p className="font-heading text-2xl md:text-3xl font-extrabold text-primary">{s.v}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 animate-fade-in-up delay-200">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-primary/8 to-secondary/8 rounded-3xl -rotate-2" />
                <div className="relative bg-white rounded-2xl shadow-xl p-5 border border-border/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><Pill className="h-5 w-5 text-primary-foreground" /></div>
                    <div><p className="font-heading text-sm font-bold">Paracetamol 500mg</p><p className="text-[11px] text-muted-foreground">Paracetamol 500mg | Tablet</p></div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { brand: "Crocin", price: "Rs.35", sp: "Rs.28", store: "HealthPlus", d: "0.5 km" },
                      { brand: "Dolo 650", price: "Rs.32", sp: "Rs.26", store: "MedLife", d: "1.2 km" },
                      { brand: "Jan Aushadhi", price: "Rs.6.70", sp: "Rs.6.70", store: "Jan Aushadhi Kendra", d: "2.1 km", isSaving: true },
                    ].map((r, i) => (
                      <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs ${r.isSaving ? "bg-green-50 border border-green-200" : "bg-muted/30"}`}>
                        <div><p className="font-semibold">{r.brand}</p><p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{r.store} ({r.d})</p></div>
                        <div className="text-right">
                          <p className="text-muted-foreground line-through text-[10px]">{r.price}</p>
                          <p className="font-heading font-bold text-primary">{r.sp}</p>
                          {r.isSaving && <span className="savings-badge text-[9px] px-1.5 py-0.5 rounded-full font-bold">Save 80%</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 animate-float border border-border/30">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  <div><p className="text-[10px] font-bold">AI Pharmacist</p><p className="text-[9px] text-muted-foreground">Voice + Text</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <Card key={i} className={`bg-gradient-to-br ${f.gradient} border-0 shadow-none rounded-2xl p-6 group cursor-default animate-fade-in-up delay-${(i + 1) * 100}`}>
                <f.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-heading text-base font-bold mb-2 text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">{t("landing.how_t")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/30 group-hover:border-primary/30 transition-colors">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="font-heading text-2xl font-extrabold text-primary/15">{s.n}</span>
                <h3 className="font-heading text-sm font-bold mt-0.5 mb-1">{s.t}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-primary">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-3">{t("landing.cta")}</h2>
          <p className="text-primary-foreground/60 mb-6 text-sm">{t("landing.hero_subtitle")}</p>
          <Button onClick={() => navigate("/auth")} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 py-5 text-sm font-bold shadow-lg" data-testid="cta-btn">
            {t("landing.get_started")} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="py-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Pill className="h-3.5 w-3.5 text-primary" /><span className="font-heading text-xs font-bold">MedConnect</span></div>
          <p className="text-[10px] text-muted-foreground">Educational purposes only. Always consult your doctor.</p>
        </div>
      </footer>
    </div>
  );
}
