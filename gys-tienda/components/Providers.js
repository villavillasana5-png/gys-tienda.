'use client';
import { CartProvider } from '../lib/cart';
import { SettingsProvider } from '../lib/settings';

export default function Providers({ children }) {
  return (
    <SettingsProvider>
      <CartProvider>{children}</CartProvider>
    </SettingsProvider>
  );
}
