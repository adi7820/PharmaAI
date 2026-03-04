import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Zap, Plus, Trash2, Loader2, IndianRupee, Clock, Store, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SmartOrderPage() {
  const { api } = useAuth();
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState([]);
  const [orderList, setOrderList] = useState([{ medicine_id: "", quantity: 1, purchase_type: "strip" }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMedicines = useCallback(async () => {
    try { setMedicines((await api.get("/medicines")).data); } catch {}
  }, [api]);
  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const addRow = () => setOrderList([...orderList, { medicine_id: "", quantity: 1, purchase_type: "strip" }]);
  const removeRow = (i) => setOrderList(orderList.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => {
    const updated = [...orderList];
    updated[i] = { ...updated[i], [field]: val };
    setOrderList(updated);
  };

  const optimize = async () => {
    const valid = orderList.filter((r) => r.medicine_id);
    if (!valid.length) { toast.error("Add at least one medicine"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/smart-order/optimize", {
        user_lat: 28.6139, user_lng: 77.2090, radius_km: 5,
        medicines: valid.map((r) => ({ medicine_id: r.medicine_id, quantity: parseInt(r.quantity) || 1, purchase_type: r.purchase_type })),
      });
      setResult(res.data);
    } catch { toast.error("Optimization failed"); }
    finally { setLoading(false); }
  };

  const renderOption = (label, icon, data, color) => {
    if (!data?.items || Object.keys(data.items).length === 0) return null;
    return (
      <Card className={`border-${color}/20`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-sm flex items-center gap-1.5">
            {icon}<span>{label}</span>
            <Badge className={`ml-auto bg-${color}/10 text-${color} text-[10px] border-0`}>{data.store_count || 1} {t("smart.stores")}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 mb-3">
            {Object.entries(data.items).map(([mid, item]) => {
              const med = medicines.find((m) => m.medicine_id === mid);
              return (
                <div key={mid} className="flex items-center justify-between py-1.5 px-2.5 bg-muted/30 rounded-lg text-xs">
                  <div><p className="font-semibold">{med?.generic_name || mid}</p><p className="text-[10px] text-muted-foreground">{item.brand_name} from {item.pharmacy_name}</p></div>
                  <span className="font-heading font-bold">Rs.{item.selling_price?.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-border/30 pt-2.5">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{data.estimated_delivery_min} {t("smart.eta")}</span>
              <span className="flex items-center gap-1"><Store className="h-3 w-3" />{data.store_count || 1} {t("smart.stores")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-extrabold">Rs.{data.total?.toFixed(0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background" data-testid="smart-order-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center"><Zap className="h-5 w-5 text-secondary-foreground" /></div>
          <div><h1 className="font-heading text-2xl font-extrabold">{t("smart.title")}</h1><p className="text-xs text-muted-foreground">{t("smart.subtitle")}</p></div>
        </div>

        {/* Medicine List Builder */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-2.5">
            {orderList.map((row, i) => (
              <div key={i} className="flex items-center gap-2" data-testid={`smart-row-${i}`}>
                <Select value={row.medicine_id} onValueChange={(v) => updateRow(i, "medicine_id", v)}>
                  <SelectTrigger className="flex-1 h-9 text-xs"><SelectValue placeholder={t("pharmacy.select_medicine")} /></SelectTrigger>
                  <SelectContent>{medicines.map((m) => (<SelectItem key={m.medicine_id} value={m.medicine_id}><span className="text-xs">{m.generic_name} ({m.strength})</span></SelectItem>))}</SelectContent>
                </Select>
                <Input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(i, "quantity", e.target.value)} className="w-16 h-9 text-xs" />
                <Select value={row.purchase_type} onValueChange={(v) => updateRow(i, "purchase_type", v)}>
                  <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="strip"><span className="text-xs">Strip</span></SelectItem><SelectItem value="tablet"><span className="text-xs">Tablet</span></SelectItem></SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(i)} disabled={orderList.length === 1}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={addRow} className="text-xs rounded-full gap-1" data-testid="add-medicine-row"><Plus className="h-3 w-3" />{t("smart.add_medicine")}</Button>
              <Button size="sm" onClick={optimize} disabled={loading} className="bg-primary text-primary-foreground text-xs rounded-full gap-1 ml-auto" data-testid="optimize-btn">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}{t("smart.optimize")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in" data-testid="smart-results">
            {result.unavailable?.length > 0 && (
              <Card className="border-red-200 bg-red-50/30"><CardContent className="p-3 text-xs text-red-600">
                Some medicines unavailable nearby: {result.unavailable.join(", ")}
              </CardContent></Card>
            )}
            {renderOption(t("smart.cheapest"), <IndianRupee className="h-4 w-4 text-green-600" />, result.cheapest, "green")}
            {renderOption(t("smart.fastest"), <Clock className="h-4 w-4 text-blue-600" />, result.fastest, "blue")}
            {result.single_store && (
              <Card className="border-purple-200/60">
                <CardHeader className="pb-2"><CardTitle className="font-heading text-sm flex items-center gap-1.5"><Store className="h-4 w-4 text-purple-600" />{t("smart.single_store")}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs font-semibold mb-2">{result.single_store.pharmacy?.name} - {result.single_store.pharmacy?.address}</p>
                  <div className="space-y-1 mb-2">
                    {Object.entries(result.single_store.items).map(([mid, item]) => {
                      const med = medicines.find((m) => m.medicine_id === mid);
                      return (<div key={mid} className="flex justify-between text-xs bg-muted/30 rounded-lg p-2"><span>{med?.generic_name} ({item.brand_name})</span><span className="font-bold">Rs.{item.selling_price?.toFixed(0)}</span></div>);
                    })}
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{result.single_store.estimated_delivery_min} {t("smart.eta")}</span>
                    <span className="font-heading text-lg font-extrabold">Rs.{result.single_store.total?.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {!result && !loading && <div className="text-center py-12 text-muted-foreground text-xs">{t("smart.no_results")}</div>}
      </div>
    </div>
  );
}
