import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Pill, ArrowRight, Sparkles, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function ConsumerDashboard() {
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // AI Ask
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await api.get("/medicines", { params: { search, category: activeCategory } });
      setMedicines(res.data);
    } catch {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, [api, search, activeCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/medicines/categories");
      setCategories(res.data);
    } catch {}
  }, [api]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { const timer = setTimeout(fetchMedicines, 300); return () => clearTimeout(timer); }, [fetchMedicines]);

  const handleAiAsk = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post("/medicines/ai-info", { medicine_name: aiQuery, language });
      setAiResponse(res.data);
    } catch {
      toast.error("AI query failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="consumer-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Ask Section */}
        <Card className="mb-8 bg-primary/5 border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">{t("medicine.ask_ai")}</h2>
            </div>
            <div className="flex gap-2">
              <Input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                placeholder={t("medicine.ask_placeholder")}
                className="flex-1 bg-white"
                data-testid="ai-query-input"
              />
              <Button onClick={handleAiAsk} disabled={aiLoading} className="bg-primary text-primary-foreground rounded-lg" data-testid="ai-query-submit">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {aiLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground animate-pulse-gentle">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("medicine.loading_ai")}
              </div>
            )}
            {aiResponse && (
              <div className="mt-4 bg-white rounded-lg p-4 space-y-3 animate-fade-in" data-testid="ai-response">
                <h3 className="font-heading font-semibold text-primary">{aiResponse.medicine_name}</h3>
                {aiResponse.info?.raw ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{aiResponse.info.raw}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["usage", "how_to_take", "side_effects", "interactions", "precautions", "alternatives"].map((key) =>
                      aiResponse.info?.[key] ? (
                        <div key={key} className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{t(`medicine.${key}`)}</p>
                          <p className="text-sm text-foreground">{aiResponse.info[key]}</p>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("medicine.search_placeholder")}
            className="pl-12 h-12 text-base bg-white rounded-xl"
            data-testid="medicine-search-input"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2" data-testid="category-filters">
          <button
            onClick={() => setActiveCategory("")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid="category-all"
          >
            {t("medicine.all_categories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`category-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Medicine Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No medicines found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="medicine-grid">
            {medicines.map((med) => (
              <Card
                key={med.medicine_id}
                className="bg-white border border-border/40 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/medicine/${med.medicine_id}`)}
                data-testid={`medicine-card-${med.medicine_id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="text-xs bg-primary/5 text-primary">
                      {med.category}
                    </Badge>
                    {med.requires_prescription && (
                      <Badge variant="outline" className="text-xs border-accent text-accent">
                        {t("medicine.prescription_required")}
                      </Badge>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center mb-3">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {med.generic_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">{med.brand_names?.join(", ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {med.dosage_form} | {med.strength}
                  </p>
                  <div className="mt-4 flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    {t("medicine.view_details")} <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
