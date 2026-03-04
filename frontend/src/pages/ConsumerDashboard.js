import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Pill, ArrowRight, Camera, Loader2, IndianRupee, MapPin, Tag } from "lucide-react";
import { toast } from "sonner";

export default function ConsumerDashboard() {
  const { api } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await api.get("/medicines", { params: { search, category: activeCategory } });
      setMedicines(res.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [api, search, activeCategory]);

  const fetchCategories = useCallback(async () => {
    try { setCategories((await api.get("/medicines/categories")).data); } catch {}
  }, [api]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { const t = setTimeout(fetchMedicines, 300); return () => clearTimeout(t); }, [fetchMedicines]);

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    toast.info("Reading prescription...");
    try {
      const res = await api.post("/prescriptions/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data.extracted_medicines?.length) {
        const names = res.data.extracted_medicines.map(m => m.medicine_name).filter(Boolean).join(", ");
        toast.success(`Found: ${names}`);
        navigate("/ai-pharmacist", { state: { prescription: res.data.extracted_medicines } });
      }
    } catch { toast.error("Failed to read prescription"); }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="consumer-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card className="bg-gradient-to-r from-primary/8 to-primary/3 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById("rx-upload").click()}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Camera className="h-5 w-5 text-primary" /></div>
              <div><p className="font-heading text-sm font-bold">{t("medicine.upload_rx")}</p><p className="text-[11px] text-muted-foreground">Scan & get medicine list</p></div>
              <input id="rx-upload" type="file" accept="image/*" className="hidden" onChange={handlePrescriptionUpload} data-testid="prescription-upload" />
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-secondary/8 to-secondary/3 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/smart-order")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center"><IndianRupee className="h-5 w-5 text-secondary-foreground" /></div>
              <div><p className="font-heading text-sm font-bold">{t("nav.smart_order")}</p><p className="text-[11px] text-muted-foreground">Best prices, smart routing</p></div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-50/50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/ai-pharmacist")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Pill className="h-5 w-5 text-green-700" /></div>
              <div><p className="font-heading text-sm font-bold">{t("nav.ai_pharmacist")}</p><p className="text-[11px] text-muted-foreground">Ask about any medicine</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("medicine.search_placeholder")}
            className="pl-10 h-11 text-sm bg-white rounded-xl border-border/50 focus-visible:ring-primary/30" data-testid="medicine-search-input" />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 no-scrollbar" data-testid="category-filters">
          <button onClick={() => setActiveCategory("")} className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${!activeCategory ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`} data-testid="category-all">{t("medicine.all_categories")}</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`} data-testid={`category-${cat}`}>{cat}</button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No medicines found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="medicine-grid">
            {medicines.map((med) => {
              const discount = med.cheapest_mrp && med.cheapest_price ? Math.round((1 - med.cheapest_price / med.cheapest_mrp) * 100) : 0;
              return (
                <Card key={med.medicine_id} className="bg-white border border-border/30 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/medicine/${med.medicine_id}`)} data-testid={`medicine-card-${med.medicine_id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-primary/8 text-primary text-[10px] font-semibold border-0">{med.category}</Badge>
                      {med.requires_prescription && <Badge className="bg-red-50 text-red-600 text-[10px] border-0">{t("medicine.prescription_required")}</Badge>}
                    </div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 bg-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Pill className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{med.generic_name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{med.salt_composition}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">{med.brand_names?.slice(0, 3).join(", ")} | {med.dosage_form} {med.strength}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {med.cheapest_price && (
                          <>
                            <span className="font-heading text-base font-extrabold text-foreground">Rs.{med.cheapest_price.toFixed(0)}</span>
                            {discount > 0 && <span className="savings-badge text-[9px] px-1.5 py-0.5 rounded-full font-bold">{discount}% off</span>}
                          </>
                        )}
                      </div>
                      {med.jan_aushadhi_available && (
                        <Badge className="bg-green-50 text-green-700 text-[9px] border-green-200 gap-0.5"><Tag className="h-2.5 w-2.5" />{t("medicine.jan_aushadhi")}</Badge>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center text-primary text-[11px] font-semibold group-hover:gap-1.5 transition-all">
                      {t("medicine.view_details")} <ArrowRight className="h-3 w-3 ml-0.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
