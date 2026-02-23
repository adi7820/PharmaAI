import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill, Search, Truck, ArrowRight, Sparkles, ShieldCheck, MapPin, Clock } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Sparkles, title: t("landing.feature1_title"), desc: t("landing.feature1_desc"), color: "bg-primary/10 text-primary" },
    { icon: Search, title: t("landing.feature2_title"), desc: t("landing.feature2_desc"), color: "bg-accent/10 text-accent" },
    { icon: Truck, title: t("landing.feature3_title"), desc: t("landing.feature3_desc"), color: "bg-primary/10 text-primary" },
  ];

  const steps = [
    { num: "01", icon: Search, title: t("landing.step1"), desc: t("landing.step1_desc") },
    { num: "02", icon: Pill, title: t("landing.step2"), desc: t("landing.step2_desc") },
    { num: "03", icon: Sparkles, title: t("landing.step3"), desc: t("landing.step3_desc") },
    { num: "04", icon: Truck, title: t("landing.step4"), desc: t("landing.step4_desc") },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Hero */}
      <section className="relative overflow-hidden noise-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
            <div className="md:col-span-7 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs uppercase tracking-widest text-primary font-semibold bg-primary/5 px-3 py-1 rounded-full">
                  MedConnect
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Trusted by local pharmacies
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                {t("landing.hero_title")}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                {t("landing.hero_subtitle")}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  data-testid="hero-get-started-btn"
                >
                  {t("landing.get_started")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/auth?role=pharmacy_owner")}
                  className="border-2 border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-6 text-base font-medium transition-colors"
                  data-testid="hero-pharmacy-btn"
                >
                  {t("landing.pharmacy_join")}
                </Button>
              </div>
            </div>
            <div className="md:col-span-5 animate-fade-in-up delay-200">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-3xl -rotate-3" />
                <img
                  src="https://images.pexels.com/photos/14797854/pexels-photo-14797854.jpeg"
                  alt="Pharmacist"
                  className="relative rounded-2xl shadow-xl object-cover w-full h-[340px] md:h-[420px]"
                />
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 animate-fade-in-up delay-400">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">3 pharmacies nearby</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 15 min delivery
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <Card
                key={i}
                className={`bg-white rounded-xl border border-border/40 shadow-sm hover:shadow-lg transition-all duration-300 p-8 group cursor-default animate-fade-in-up delay-${(i + 1) * 100}`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-center mb-16 text-foreground">
            {t("landing.how_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="font-heading text-3xl font-bold text-primary/20">{s.num}</span>
                <h3 className="font-heading text-lg font-semibold mt-1 mb-2 text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t("landing.get_started")}
          </h2>
          <p className="text-primary-foreground/70 mb-8 text-lg">
            {t("landing.hero_subtitle")}
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-6 text-base font-medium shadow-lg"
            data-testid="cta-get-started-btn"
          >
            {t("landing.get_started")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-semibold">MedConnect</span>
          </div>
          <p className="text-xs text-muted-foreground">For educational purposes only. Always consult your doctor.</p>
        </div>
      </footer>
    </div>
  );
}
