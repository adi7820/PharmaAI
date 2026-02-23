import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  placed: { icon: Clock, color: "bg-yellow-100 text-yellow-700", step: 0 },
  confirmed: { icon: CheckCircle2, color: "bg-blue-100 text-blue-700", step: 1 },
  preparing: { icon: Package, color: "bg-orange-100 text-orange-700", step: 2 },
  out_for_delivery: { icon: Truck, color: "bg-purple-100 text-purple-700", step: 3 },
  delivered: { icon: CheckCircle2, color: "bg-green-100 text-green-700", step: 4 },
  cancelled: { icon: XCircle, color: "bg-red-100 text-red-700", step: -1 },
};
const statusSteps = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

export default function OrdersPage() {
  const { api } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="orders-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold mb-8">{t("orders.title")}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground" data-testid="no-orders">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p>{t("orders.no_orders")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.placed;
              const StatusIcon = cfg.icon;
              const currentStep = cfg.step;

              return (
                <Card key={order.order_id} className="overflow-hidden" data-testid={`order-${order.order_id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-heading">
                          {t("orders.order_id")}: {order.order_id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.pharmacy_name} | {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${cfg.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" /> {t(`orders.${order.status}`)}
                        </Badge>
                        <span className="font-heading text-lg font-bold">Rs.{order.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Progress bar */}
                    {order.status !== "cancelled" && (
                      <div className="flex items-center gap-1 mb-4">
                        {statusSteps.map((step, idx) => (
                          <div key={step} className="flex-1">
                            <div className={`h-1.5 rounded-full transition-colors ${
                              idx <= currentStep ? "bg-primary" : "bg-muted"
                            }`} />
                            <p className={`text-[10px] mt-1 ${idx <= currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}>
                              {t(`orders.${step}`)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Items */}
                    <div className="flex flex-wrap gap-2">
                      {order.items?.map((item, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded-md">
                          {item.brand_name} x{item.quantity}
                        </span>
                      ))}
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
