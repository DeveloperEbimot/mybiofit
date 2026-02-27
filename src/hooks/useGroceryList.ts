import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
}

export function useGroceryList() {
  const { user } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);

  // Load items
  useEffect(() => {
    if (user) {
      supabase.from("grocery_items").select("*").eq("user_id", user.id).order("created_at").then(({ data }) => {
        if (data) setItems(data.map(d => ({ id: d.id, name: d.name, checked: d.checked || false, category: d.category || undefined })));
      });
    } else {
      const saved = localStorage.getItem("biofit-grocery");
      if (saved) setItems(JSON.parse(saved));
    }
  }, [user]);

  const saveLocal = (newItems: GroceryItem[]) => {
    if (!user) localStorage.setItem("biofit-grocery", JSON.stringify(newItems));
  };

  const addItem = useCallback(async (name: string, category?: string) => {
    const id = crypto.randomUUID();
    const newItem: GroceryItem = { id, name, checked: false, category };
    setItems(prev => { const n = [...prev, newItem]; saveLocal(n); return n; });
    if (user) {
      await supabase.from("grocery_items").insert({ id, user_id: user.id, name, checked: false, category });
    }
  }, [user]);

  const toggleItem = useCallback(async (id: string) => {
    setItems(prev => {
      const n = prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
      saveLocal(n);
      return n;
    });
    if (user) {
      const item = items.find(i => i.id === id);
      if (item) await supabase.from("grocery_items").update({ checked: !item.checked }).eq("id", id);
    }
  }, [user, items]);

  const removeItem = useCallback(async (id: string) => {
    setItems(prev => { const n = prev.filter(i => i.id !== id); saveLocal(n); return n; });
    if (user) await supabase.from("grocery_items").delete().eq("id", id);
  }, [user]);

  const clearChecked = useCallback(async () => {
    const checkedIds = items.filter(i => i.checked).map(i => i.id);
    setItems(prev => { const n = prev.filter(i => !i.checked); saveLocal(n); return n; });
    if (user && checkedIds.length > 0) {
      await supabase.from("grocery_items").delete().in("id", checkedIds);
    }
  }, [user, items]);

  const addMultiple = useCallback(async (names: string[]) => {
    const newItems = names.map(name => ({ id: crypto.randomUUID(), name, checked: false }));
    setItems(prev => { const n = [...prev, ...newItems]; saveLocal(n); return n; });
    if (user) {
      await supabase.from("grocery_items").insert(newItems.map(i => ({ ...i, user_id: user.id })));
    }
  }, [user]);

  return { items, addItem, toggleItem, removeItem, clearChecked, addMultiple };
}
