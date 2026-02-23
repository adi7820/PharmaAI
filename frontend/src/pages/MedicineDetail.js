import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Sparkles, Loader2, Pill, ShoppingCart, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export default function MedicineDetail() {
  const { id } = useParams();
  const { api } = useAuth();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [aiInfo, setAiInfo] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [medRes, compRes] = await Promise.all([
        api.get(`/medicines/${id}`),
        api.get(`/compare`, { params: { medicine_id: id } }),
      ]);
      setMedicine(medRes.data);
      setComparisons(compRes.data.comparisons || []);
    } catch {
      toast.error("Failed to load medicine");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAiInfo = async () => {
    if (!medicine) return;
    setAiLoading(true);
    try {
      const res = await api.post("/medicines/ai-info", {
        medicine_name: `${medicine.generic_name} ${medicine.strength}`,
        language,
      });
      setAiInfo(res.data.info);
    } catch {
      toast.error("Failed to get AI info");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToCart = (comp) => {
    addItem({
      inventory_id: comp.inventory_id,
      medicine_id: comp.medicine_id,
      generic_name: comp.generic_name,
      brand_name: comp.brand_name,
      pharmacy_id: comp.pharmacy_id,
      pharmacy_name: comp.pharmacy_name,
      price: comp.price,
      strength: comp.strength,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Medicine not found
      </div>
    );
  }

  const aiKeys = ["usage", "how_to_take", "side_effects", "interactions", "precautions", "alternatives"];

  return (
    <div className="min-h-screen bg-background" data-testid="medicine-detail-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2" data-testid="back-btn">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Button>

        {/* Medicine Header */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Pill className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-primary/10 text-primary">{medicine.category}</Badge>
                  <Badge variant="outline">{medicine.dosage_form}</Badge>
                  <Badge variant="outline">{medicine.strength}</Badge>
                  {medicine.requires_prescription && (
                    <Badge className="bg-accent/10 text-accent border-accent/20">{t("medicine.prescription_required")}</Badge>
                  )}
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="medicine-name">
                  {medicine.generic_name}
                </h1>
                <p className="text-muted-foreground mb-1">
                  {t("medicine.brand")}: {medicine.brand_names?.join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">{medicine.description}</p>
              </div>
              <Button
                onClick={fetchAiInfo}
                disabled={aiLoading}
                className="bg-primary text-primary-foreground rounded-full px-6 gap-2 self-start"
                data-testid="get-ai-info-btn"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t("medicine.get_ai_info")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Info */}
        {aiLoading && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">{t("medicine.loading_ai")}</span>
            </CardContent>
          </Card>
        )}
        {aiInfo && (
          <Card className="mb-8 border-primary/20 animate-fade-in" data-testid="ai-info-section">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Medicine Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiInfo.raw ? (
                <p className="text-sm whitespace-pre-wrap">{aiInfo.raw}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiKeys.map((key) =>
                    aiInfo[key] ? (
                      <div key={key} className="bg-muted/30 rounded-xl p-4" data-testid={`ai-info-${key}`}>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                          {t(`medicine.${key}`)}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{aiInfo[key]}</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4 italic">
                Disclaimer: This is AI-generated info for educational purposes. Always consult your doctor.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Price Comparison */}
        <Card data-testid="price-comparison-section">
          <CardHeader>
            <CardTitle className="font-heading">{t("medicine.compare_prices")}</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pharmacies currently stock this medicine</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("medicine.brand")}</TableHead>
                      <TableHead>{t("medicine.price")}</TableHead>
                      <TableHead>{t("medicine.pharmacy")}</TableHead>
                      <TableHead>{t("medicine.stock")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisons.map((comp, idx) => (
                      <TableRow key={comp.inventory_id} className={idx === 0 ? "bg-green-50/50" : ""}>
                        <TableCell>
                          <p className="font-medium">{comp.brand_name}</p>
                          <p className="text-xs text-muted-foreground">{comp.strength} {comp.dosage_form}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-heading text-lg font-bold text-foreground">
                            Rs.{comp.price.toFixed(2)}
                          </span>
                          {idx === 0 && <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Best</Badge>}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{comp.pharmacy_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {comp.pharmacy_address}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={comp.stock_quantity > 20 ? "default" : "destructive"} className={comp.stock_quantity > 20 ? "bg-green-100 text-green-700" : ""}>
                            {comp.stock_quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(comp)}
                            className="bg-primary text-primary-foreground rounded-full gap-1"
                            data-testid={`add-to-cart-${comp.inventory_id}`}
                          >
                            <ShoppingCart className="h-3 w-3" /> {t("medicine.add_to_cart")}
                          </Button>
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
