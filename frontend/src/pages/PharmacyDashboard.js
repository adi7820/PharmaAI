import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Package, Edit, Store, Pill } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export default function PharmacyDashboard() {
  const { api } = useAuth();
  const { t } = useLanguage();

  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [setupForm, setSetupForm] = useState({ name: "", address: "", phone: "" });
  const [addForm, setAddForm] = useState({ medicine_id: "", brand_name: "", mrp: "", selling_price: "", stock_quantity: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ selling_price: "", stock_quantity: "" });

  const fetchPharmacy = useCallback(async () => {
    try {
      const res = await api.get("/pharmacies/my");
      if (res.data) {
        setPharmacy(res.data);
        const invRes = await api.get(`/inventory/${res.data.pharmacy_id}`);
        setInventory(invRes.data);
      } else {
        setShowSetup(true);
      }
    } catch {
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await api.get("/medicines");
      setMedicines(res.data);
    } catch {}
  }, [api]);

  useEffect(() => {
    fetchPharmacy();
    fetchMedicines();
  }, [fetchPharmacy, fetchMedicines]);

  const handleCreatePharmacy = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/pharmacies", setupForm);
      setPharmacy(res.data);
      setShowSetup(false);
      toast.success("Pharmacy created!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create pharmacy"));
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post("/inventory", {
        medicine_id: addForm.medicine_id,
        brand_name: addForm.brand_name,
        mrp: parseFloat(addForm.mrp),
        selling_price: parseFloat(addForm.selling_price),
        stock_quantity: parseInt(addForm.stock_quantity),
      });
      setShowAddDialog(false);
      setAddForm({ medicine_id: "", brand_name: "", mrp: "", selling_price: "", stock_quantity: "" });
      const invRes = await api.get(`/inventory/${pharmacy.pharmacy_id}`);
      setInventory(invRes.data);
      toast.success("Item added!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add item"));
    }
  };

  const handleUpdateInventory = async (inventoryId) => {
    try {
      await api.put(`/inventory/${inventoryId}`, {
        selling_price: parseFloat(editForm.selling_price),
        stock_quantity: parseInt(editForm.stock_quantity),
      });
      setEditingId(null);
      const invRes = await api.get(`/inventory/${pharmacy.pharmacy_id}`);
      setInventory(invRes.data);
      toast.success("Updated!");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDeleteInventory = async (inventoryId) => {
    try {
      await api.delete(`/inventory/${inventoryId}`);
      setInventory((prev) => prev.filter((i) => i.inventory_id !== inventoryId));
      toast.success("Deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="pharmacy-setup">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-2xl">{t("pharmacy.setup_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePharmacy} className="space-y-4">
              <div>
                <Label>{t("pharmacy.name")}</Label>
                <Input value={setupForm.name} onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })} required data-testid="pharmacy-name-input" />
              </div>
              <div>
                <Label>{t("pharmacy.address")}</Label>
                <Input value={setupForm.address} onChange={(e) => setSetupForm({ ...setupForm, address: e.target.value })} required data-testid="pharmacy-address-input" />
              </div>
              <div>
                <Label>{t("pharmacy.phone")}</Label>
                <Input value={setupForm.phone} onChange={(e) => setSetupForm({ ...setupForm, phone: e.target.value })} required data-testid="pharmacy-phone-input" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-full" data-testid="create-pharmacy-btn">
                {t("pharmacy.create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="pharmacy-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">{pharmacy?.name}</h1>
            <p className="text-sm text-muted-foreground">{pharmacy?.address} | {pharmacy?.phone}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("pharmacy.total_products")}</p>
                <p className="font-heading text-3xl font-bold">{inventory.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("pharmacy.total_orders")}</p>
                <p className="font-heading text-3xl font-bold">--</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading">{t("pharmacy.inventory")}</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground rounded-full gap-2" data-testid="add-inventory-btn">
                  <Plus className="h-4 w-4" /> {t("pharmacy.add_medicine")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-heading">{t("pharmacy.add_medicine")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddInventory} className="space-y-4">
                  <div>
                    <Label>{t("pharmacy.select_medicine")}</Label>
                    <Select value={addForm.medicine_id} onValueChange={(v) => setAddForm({ ...addForm, medicine_id: v })}>
                      <SelectTrigger data-testid="select-medicine-trigger"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {medicines.map((m) => (
                          <SelectItem key={m.medicine_id} value={m.medicine_id}>
                            {m.generic_name} ({m.strength})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("pharmacy.brand_name")}</Label>
                    <Input value={addForm.brand_name} onChange={(e) => setAddForm({ ...addForm, brand_name: e.target.value })} required data-testid="add-brand-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t("pharmacy.mrp")} (Rs.)</Label>
                      <Input type="number" step="0.01" value={addForm.mrp} onChange={(e) => setAddForm({ ...addForm, mrp: e.target.value })} required data-testid="add-mrp-input" />
                    </div>
                    <div>
                      <Label>{t("pharmacy.selling_price")} (Rs.)</Label>
                      <Input type="number" step="0.01" value={addForm.selling_price} onChange={(e) => setAddForm({ ...addForm, selling_price: e.target.value })} required data-testid="add-price-input" />
                    </div>
                  </div>
                  <div>
                    <Label>{t("medicine.stock")}</Label>
                    <Input type="number" value={addForm.stock_quantity} onChange={(e) => setAddForm({ ...addForm, stock_quantity: e.target.value })} required data-testid="add-stock-input" />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground rounded-full" data-testid="save-inventory-btn">
                    {t("pharmacy.save")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {inventory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{t("pharmacy.no_inventory")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("medicine.generic")}</TableHead>
                      <TableHead>{t("medicine.brand")}</TableHead>
                      <TableHead>{t("medicine.price")}</TableHead>
                      <TableHead>{t("medicine.stock")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.inventory_id} data-testid={`inventory-row-${item.inventory_id}`}>
                        <TableCell>
                          <p className="font-medium">{item.medicine?.generic_name || item.medicine_id}</p>
                          <p className="text-xs text-muted-foreground">{item.medicine?.strength}</p>
                        </TableCell>
                        <TableCell>{item.brand_name}</TableCell>
                        <TableCell>
                          {editingId === item.inventory_id ? (
                            <Input type="number" step="0.01" className="w-20 h-8" value={editForm.selling_price}
                              onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })} />
                          ) : (
                            <span className="font-heading font-bold">Rs.{(item.selling_price || item.price)?.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === item.inventory_id ? (
                            <Input type="number" className="w-20 h-8" value={editForm.stock_quantity}
                              onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })} />
                          ) : (
                            <Badge variant={item.stock_quantity > 20 ? "default" : "destructive"}
                              className={item.stock_quantity > 20 ? "bg-green-100 text-green-700" : ""}>
                              {item.stock_quantity}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingId === item.inventory_id ? (
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" onClick={() => handleUpdateInventory(item.inventory_id)} className="bg-primary text-primary-foreground" data-testid={`save-edit-${item.inventory_id}`}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <Button size="icon" variant="ghost" className="h-8 w-8"
                                onClick={() => { setEditingId(item.inventory_id); setEditForm({ selling_price: item.selling_price || item.price, stock_quantity: item.stock_quantity }); }}
                                data-testid={`edit-inventory-${item.inventory_id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteInventory(item.inventory_id)}
                                data-testid={`delete-inventory-${item.inventory_id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
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
