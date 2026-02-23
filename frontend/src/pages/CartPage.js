import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, Loader2, ArrowLeft, Pill } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const { api } = useAuth();
  const { t } = useLanguage();
  const { items, removeItem, updateQuantity, clearCart, total, groupedByPharmacy } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ordering, setOrdering] = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      toast.error("Please fill in delivery details");
      return;
    }
    setOrdering(true);
    try {
      const groups = Object.values(groupedByPharmacy);
      for (const group of groups) {
        await api.post("/orders", {
          pharmacy_id: group.pharmacy_id,
          items: group.items.map((i) => ({
            inventory_id: i.inventory_id,
            medicine_id: i.medicine_id,
            brand_name: i.brand_name,
            quantity: i.quantity,
            price: i.price,
          })),
          delivery_address: address,
          delivery_phone: phone,
        });
      }
      clearCart();
      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch {
      toast.error("Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="cart-empty">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-semibold mb-2">{t("cart.empty")}</h2>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-primary-foreground rounded-full mt-4"
            data-testid="browse-medicines-btn"
          >
            {t("cart.browse")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="cart-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2" data-testid="cart-back-btn">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Button>

        <h1 className="font-heading text-3xl font-bold mb-8" data-testid="cart-title">
          {t("cart.title")} ({items.length})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {Object.values(groupedByPharmacy).map((group) => (
              <Card key={group.pharmacy_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("cart.from")} {group.pharmacy_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.inventory_id} className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0" data-testid={`cart-item-${item.inventory_id}`}>
                      <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{item.brand_name}</p>
                        <p className="text-xs text-muted-foreground">{item.generic_name} | {item.strength}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => updateQuantity(item.inventory_id, item.quantity - 1)}
                          data-testid={`cart-decrease-${item.inventory_id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline" size="icon" className="h-7 w-7"
                          onClick={() => updateQuantity(item.inventory_id, item.quantity + 1)}
                          data-testid={`cart-increase-${item.inventory_id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-heading font-bold text-foreground w-20 text-right">
                        Rs.{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.inventory_id)}
                        data-testid={`cart-remove-${item.inventory_id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="font-heading">{t("cart.place_order")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("cart.delivery_address")}</Label>
                  <Input
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    className="mt-1" data-testid="delivery-address-input"
                  />
                </div>
                <div>
                  <Label>{t("cart.delivery_phone")}</Label>
                  <Input
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-XXXXXXXXXX"
                    className="mt-1" data-testid="delivery-phone-input"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t("cart.total")}</span>
                  <span className="font-heading text-2xl font-bold text-foreground">Rs.{total.toFixed(2)}</span>
                </div>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={ordering}
                  className="w-full bg-primary text-primary-foreground rounded-full py-6 text-base"
                  data-testid="place-order-btn"
                >
                  {ordering ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cart.place_order")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
