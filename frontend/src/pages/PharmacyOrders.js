import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Package, Clock, CheckCircle2, Truck, User } from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "confirmed", label: "Confirm" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancel" },
];

const statusColors = {
  placed: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PharmacyOrders() {
  const { api } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders/pharmacy");
      setOrders(res.data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.order_id === orderId ? res.data : o)));
      toast.success(`Order ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="pharmacy-orders-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold mb-8">{t("pharmacy.incoming_orders")}</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.order_id} data-testid={`pharmacy-order-${order.order_id}`}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-heading">
                        Order #{order.order_id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {order.consumer_name || "Customer"}
                        <span>|</span>
                        <Clock className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[order.status] || ""}>
                        {t(`orders.${order.status}`)}
                      </Badge>
                      <span className="font-heading text-xl font-bold">Rs.{order.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Items */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="text-xs bg-muted px-3 py-1.5 rounded-lg">
                        <span className="font-medium">{item.brand_name}</span> x{item.quantity} — Rs.{item.price}
                      </div>
                    ))}
                  </div>
                  {/* Delivery Info */}
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Deliver to: {order.delivery_address}</p>
                    <p>Phone: {order.delivery_phone}</p>
                  </div>
                  {/* Status Update */}
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("pharmacy.update_status")}:</span>
                      <Select onValueChange={(v) => handleStatusUpdate(order.order_id, v)}>
                        <SelectTrigger className="w-48" data-testid={`status-select-${order.order_id}`}>
                          <SelectValue placeholder="Change status..." />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions
                            .filter((opt) => opt.value !== order.status)
                            .map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
