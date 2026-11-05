'use client';
import { useState } from 'react';

export default function Copy({ text }) {
  const [ok, setOk] = useState(false);
  async function go() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch (e) {
      window.prompt('Copia el texto:', text);
    }
  }
  return (
    <button type="button" className="cp" onClick={go}>
      {ok ? 'Copiado' : 'Copiar'}
    </button>
  );
}
