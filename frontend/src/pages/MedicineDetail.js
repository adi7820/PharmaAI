import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Sparkles, Loader2, Pill, ShoppingCart, MapPin, Tag, IndianRupee, FlaskConical } from "lucide-react";
import { toast } from "sonner";

export default function MedicineDetail() {
  const { id } = useParams();
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [alternatives, setAlternatives] = useState(null);
  const [aiInfo, setAiInfo] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [medRes, compRes, altRes] = await Promise.all([
        api.get(`/medicines/${id}`), api.get(`/compare`, { params: { medicine_id: id } }),
        api.get(`/medicines/${id}/alternatives`),
      ]);
      setMedicine(medRes.data);
      setComparisons(compRes.data.comparisons || []);
      setAlternatives(altRes.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, [api, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAiInfo = async () => {
    if (!medicine) return;
    setAiLoading(true);
    try {
      const res = await api.post("/medicines/ai-info", { medicine_name: `${medicine.generic_name} ${medicine.strength}`, language });
      setAiInfo(res.data.info);
    } catch { toast.error("AI failed"); }
    finally { setAiLoading(false); }
  };

  const handleAdd = (comp, type = "strip") => {
    addItem({
      inventory_id: comp.inventory_id, medicine_id: comp.medicine_id,
      generic_name: comp.generic_name, brand_name: comp.brand_name,
      pharmacy_id: comp.pharmacy_id, pharmacy_name: comp.pharmacy_name,
      price: type === "tablet" ? comp.price_per_tablet : comp.selling_price,
      strength: comp.strength, purchase_type: type,
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!medicine) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Not found</div>;

  const aiKeys = ["usage", "how_to_take", "side_effects", "interactions", "food_interactions", "precautions", "storage", "alternatives"];

  return (
    <div className="min-h-screen bg-background" data-testid="medicine-detail-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1.5 text-xs" data-testid="back-btn"><ArrowLeft className="h-3.5 w-3.5" />{t("common.back")}</Button>

        {/* Header */}
        <Card className="mb-5 border-border/30">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center flex-shrink-0"><Pill className="h-7 w-7 text-primary" /></div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge className="bg-primary/8 text-primary text-[10px] border-0">{medicine.category}</Badge>
                  <Badge variant="outline" className="text-[10px]">{medicine.dosage_form}</Badge>
                  <Badge variant="outline" className="text-[10px]">{medicine.strength}</Badge>
                  {medicine.requires_prescription && <Badge className="bg-red-50 text-red-600 text-[10px] border-0">{t("medicine.prescription_required")}</Badge>}
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold mb-1" data-testid="medicine-name">{medicine.generic_name}</h1>
                <p className="text-xs text-muted-foreground mb-0.5">{t("medicine.brand")}: {medicine.brand_names?.join(", ")}</p>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium"><FlaskConical className="h-3 w-3" />{t("medicine.salt")}: {medicine.salt_composition}</div>
                <p className="text-xs text-muted-foreground mt-1">{medicine.tablets_per_strip} {t("medicine.tablets")}{t("medicine.per_strip")}</p>
              </div>
              <Button onClick={fetchAiInfo} disabled={aiLoading} className="bg-primary text-primary-foreground rounded-full px-5 text-xs font-bold gap-1.5 self-start" data-testid="get-ai-info-btn">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{t("medicine.get_ai_info")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jan Aushadhi + Alternatives */}
        {alternatives && (alternatives.jan_aushadhi || alternatives.alternatives?.length > 0) && (
          <Card className="mb-5 border-green-200/60 bg-green-50/30" data-testid="alternatives-section">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-sm flex items-center gap-1.5"><Tag className="h-4 w-4 text-green-600" />{t("medicine.save_with_generic")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {alternatives.jan_aushadhi && (
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200/60">
                  <div><p className="text-xs font-bold text-green-700">{alternatives.jan_aushadhi.name}</p><p className="text-[10px] text-muted-foreground">Government initiative - Same salt composition</p></div>
                  <div className="text-right">
                    <p className="font-heading text-lg font-extrabold text-green-700">Rs.{alternatives.jan_aushadhi.price_per_strip}{t("medicine.per_strip")}</p>
                    {comparisons[0] && <p className="savings-badge text-[9px] px-2 py-0.5 rounded-full font-bold inline-block">{t("medicine.savings")} Rs.{(comparisons[0].selling_price - alternatives.jan_aushadhi.price_per_strip).toFixed(0)}</p>}
                  </div>
                </div>
              )}
              {alternatives.alternatives?.map((alt) => (
                <div key={alt.medicine_id} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-border/30 cursor-pointer hover:border-primary/20" onClick={() => navigate(`/medicine/${alt.medicine_id}`)}>
                  <div><p className="text-xs font-semibold">{alt.generic_name} ({alt.brand_names?.[0]})</p><p className="text-[10px] text-muted-foreground">{alt.salt_composition}</p></div>
                  {alt.cheapest_price && <span className="font-heading text-sm font-bold">Rs.{alt.cheapest_price.toFixed(0)}</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI Info */}
        {aiLoading && <Card className="mb-5 border-primary/20 bg-primary/3"><CardContent className="p-4 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />{t("medicine.loading_ai")}</CardContent></Card>}
        {aiInfo && (
          <Card className="mb-5 border-primary/20 animate-fade-in" data-testid="ai-info-section">
            <CardHeader className="pb-2"><CardTitle className="font-heading text-sm flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" />AI Medicine Guide</CardTitle></CardHeader>
            <CardContent>
              {aiInfo.raw ? <p className="text-xs whitespace-pre-wrap">{aiInfo.raw}</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {aiKeys.map((k) => aiInfo[k] ? (
                    <div key={k} className="bg-muted/30 rounded-xl p-3" data-testid={`ai-${k}`}>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{t(`medicine.${k}`)}</p>
                      <p className="text-xs text-foreground leading-relaxed">{aiInfo[k]}</p>
                    </div>
                  ) : null)}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-3 italic">Disclaimer: AI-generated. Always consult your doctor.</p>
            </CardContent>
          </Card>
        )}

        {/* Price Comparison */}
        <Card data-testid="price-comparison-section">
          <CardHeader className="pb-2"><CardTitle className="font-heading text-sm">{t("medicine.compare_prices")}</CardTitle></CardHeader>
          <CardContent>
            {comparisons.length === 0 ? <p className="text-muted-foreground text-center py-8 text-xs">No pharmacies stock this medicine</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-[11px]">{t("medicine.brand")}</TableHead>
                    <TableHead className="text-[11px]">{t("medicine.price")}</TableHead>
                    <TableHead className="text-[11px]">{t("medicine.pharmacy")}</TableHead>
                    <TableHead className="text-[11px]">{t("medicine.stock")}</TableHead>
                    <TableHead className="text-right text-[11px]">{t("common.actions")}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {comparisons.map((c, i) => (
                      <TableRow key={c.inventory_id} className={i === 0 ? "bg-green-50/40" : ""}>
                        <TableCell><p className="text-xs font-semibold">{c.brand_name}</p><p className="text-[10px] text-muted-foreground">{c.strength} {c.dosage_form}</p></TableCell>
                        <TableCell>
                          <div>
                            {c.mrp > c.selling_price && <span className="text-[10px] text-muted-foreground line-through mr-1">Rs.{c.mrp.toFixed(0)}</span>}
                            <span className="font-heading text-sm font-extrabold">Rs.{c.selling_price.toFixed(0)}</span>
                            {i === 0 && <Badge className="ml-1.5 bg-green-100 text-green-700 text-[9px] border-0">Best</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Rs.{c.price_per_tablet}{t("medicine.per_tablet")}</p>
                        </TableCell>
                        <TableCell><p className="text-xs font-medium">{c.pharmacy_name}</p><p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{c.pharmacy_address}</p></TableCell>
                        <TableCell><Badge className={`text-[10px] border-0 ${c.stock_quantity > 20 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{c.stock_quantity} strips</Badge>
                          {c.loose_tablet_count > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">+{c.loose_tablet_count} loose</p>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col gap-1 items-end">
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAdd(c, "strip"); }} className="bg-primary text-primary-foreground rounded-full text-[10px] h-7 px-3 gap-1" data-testid={`add-strip-${c.inventory_id}`}><ShoppingCart className="h-2.5 w-2.5" />{t("medicine.buy_strip")}</Button>
                            {c.loose_tablet_count > 0 && (
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleAdd(c, "tablet"); }} className="rounded-full text-[10px] h-6 px-2.5" data-testid={`add-tablet-${c.inventory_id}`}>{t("medicine.buy_tablets")}</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
