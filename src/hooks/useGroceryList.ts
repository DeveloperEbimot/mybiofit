import { useState } from "react";

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
}

export function useGroceryList() {
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem("biofit-grocery");
    return saved ? JSON.parse(saved) : [];
  });

  const save = (newItems: GroceryItem[]) => {
    setItems(newItems);
    localStorage.setItem("biofit-grocery", JSON.stringify(newItems));
  };

  const addItem = (name: string, category?: string) => {
    const newItem: GroceryItem = { id: crypto.randomUUID(), name, checked: false, category };
    save([...items, newItem]);
  };

  const toggleItem = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const removeItem = (id: string) => {
    save(items.filter(i => i.id !== id));
  };

  const clearChecked = () => {
    save(items.filter(i => !i.checked));
  };

  const addMultiple = (names: string[]) => {
    const newItems = names.map(name => ({ id: crypto.randomUUID(), name, checked: false }));
    save([...items, ...newItems]);
  };

  return { items, addItem, toggleItem, removeItem, clearChecked, addMultiple };
}
