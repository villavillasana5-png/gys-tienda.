'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, configured } from './supabase';

const Ctx = createContext({ settings: {}, loaded: false });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!configured) {
      setLoaded(true);
      return;
    }
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data || {});
        setLoaded(true);
      });
  }, []);

  return <Ctx.Provider value={{ settings, loaded }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
