import { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.inventory_id === item.inventory_id);
      if (existing) {
        return prev.map((i) =>
          i.inventory_id === item.inventory_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success("Added to cart");
  }, []);

  const removeItem = useCallback((inventoryId) => {
    setItems((prev) => prev.filter((i) => i.inventory_id !== inventoryId));
  }, []);

  const updateQuantity = useCallback((inventoryId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.inventory_id !== inventoryId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.inventory_id === inventoryId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Group items by pharmacy
  const groupedByPharmacy = items.reduce((groups, item) => {
    const key = item.pharmacy_id;
    if (!groups[key]) {
      groups[key] = { pharmacy_id: key, pharmacy_name: item.pharmacy_name, items: [] };
    }
    groups[key].items.push(item);
    return groups;
  }, {});

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, groupedByPharmacy }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
