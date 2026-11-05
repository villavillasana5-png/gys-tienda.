'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Ajustes({ settings, reload, toast }) {
  const [f, setF] = useState({
    banco: settings.banco || '',
    telefono: settings.telefono || '',
    documento: settings.documento || '',
    titular: settings.titular || '',
    tasa: settings.tasa || '',
    whatsapp: settings.whatsapp || '',
    entregador: settings.entregador || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function guardar() {
    setBusy(true);
    const { error } = await supabase.from('settings').upsert({
      id: 1,
      banco: f.banco.trim(),
      telefono: f.telefono.trim(),
      documento: f.documento.trim(),
      titular: f.titular.trim(),
      tasa: parseFloat(f.tasa) || 0,
      whatsapp: f.whatsapp.trim(),
      entregador: f.entregador.trim(),
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    toast(error ? 'No se pudo guardar: ' + error.message : 'Ajustes guardados. Los clientes ya los ven.');
    if (!error) reload();
  }

  return (
    <div className="two">
      <div className="panel">
        <h2>Datos de cobro</h2>
        <div className="fld">
          <label>
            Banco
            <input value={f.banco} onChange={set('banco')} />
          </label>
          <label>
            Teléfono de Pago Móvil
            <input type="tel" value={f.telefono} onChange={set('telefono')} />
          </label>
          <label>
            Cédula / RIF
            <input value={f.documento} onChange={set('documento')} />
          </label>
          <label>
            Titular
            <input value={f.titular} onChange={set('titular')} />
          </label>
          <label>
            Tasa del día (Bs. por $1)
            <input type="number" step="0.01" min="0" inputMode="decimal" value={f.tasa} onChange={set('tasa')} />
          </label>
        </div>
      </div>
      <div className="panel">
        <h2>Contacto</h2>
        <div className="fld">
          <label>
            WhatsApp de GYS (atención)
            <input type="tel" value={f.whatsapp} onChange={set('whatsapp')} />
          </label>
          <label>
            WhatsApp del entregador
            <input type="tel" value={f.entregador} onChange={set('entregador')} />
          </label>
        </div>
        <p className="hint">Escribe los teléfonos con código de área. Si empiezan con 0, se envían como Venezuela (+58).</p>
        <button className="btn" onClick={guardar} disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar ajustes'}
        </button>
      </div>
    </div>
  );
}
