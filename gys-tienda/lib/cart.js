'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('gys_cart') || '[]'));
    } catch (e) {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('gys_cart', JSON.stringify(items));
    } catch (e) {}
  }, [items, ready]);

  const add = (p) =>
    setItems((c) => {
      const max = p.stock == null ? 99 : p.stock;
      const f = c.find((i) => i.id === p.id);
      if (f) return c.map((i) => (i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, max) } : i));
      return [...c, { id: p.id, name: p.name, price: +p.price, vendor: p.vendor, image: p.image_path, stock: p.stock, qty: 1 }];
    });

  const setQty = (id, q) =>
    setItems((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: Math.min(q, i.stock == null ? 99 : i.stock) } : i))
        .filter((i) => i.qty > 0)
    );

  const clear = () => setItems([]);
  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = Math.round(items.reduce((a, i) => a + i.price * i.qty, 0) * 100) / 100;
  const qtyOf = (id) => (items.find((i) => i.id === id) || { qty: 0 }).qty;

  return <Ctx.Provider value={{ items, add, setQty, clear, count, total, qtyOf, ready }}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
