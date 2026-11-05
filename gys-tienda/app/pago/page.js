'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../lib/cart';
import { useSettings } from '../../lib/settings';
import { usd, bs, num } from '../../lib/format';
import Copy from '../../components/Copy';

const ERRORES = {
  datos_invalidos: 'Revisa tus datos: nombre, teléfono, dirección y referencia.',
  carrito_invalido: 'Tu carrito está vacío o es inválido.',
  producto_invalido: 'Uno de los productos ya no está disponible. Revisa tu carrito.',
};

export default function Pago() {
  const router = useRouter();
  const { items, total, clear, ready } = useCart();
  const { settings: s } = useSettings();
  const tasa = +s.tasa > 0 ? +s.tasa : 0;
  const [f, setF] = useState({ name: '', phone: '', address: '', notes: '', reference: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => {
    setErr('');
    setF((x) => ({ ...x, [k]: e.target.value }));
  };
  const payReady = Boolean(s.banco && s.telefono && s.documento);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('gys_draft') || '{}');
      setF((x) => ({ ...x, name: d.name || '', phone: d.phone || '', address: d.address || '', notes: d.notes || '' }));
    } catch (e) {}
  }, []);

  async function enviar() {
    const miss = [];
    if (f.name.trim().length < 2) miss.push('nombre');
    if (f.phone.replace(/\D/g, '').length < 7) miss.push('teléfono');
    if (f.address.trim().length < 5) miss.push('dirección');
    if (f.reference.trim().length < 4) miss.push('referencia del pago');
    if (miss.length) return setErr('Completa: ' + miss.join(', ') + '.');
    setBusy(true);
    const { data, error } = await supabase.rpc('create_order', {
      p_name: f.name,
      p_phone: f.phone,
      p_address: f.address,
      p_notes: f.notes,
      p_reference: f.reference,
      p_items: items.map((i) => ({ id: i.id, qty: i.qty })),
    });
    setBusy(false);
    if (error) {
      const m = String(error.message || '');
      if (m.startsWith('sin_stock')) return setErr('No hay stock suficiente de: ' + m.split(':')[1] + '. Ajusta tu carrito.');
      const k = Object.keys(ERRORES).find((x) => m.includes(x));
      return setErr(k ? ERRORES[k] : 'No se pudo enviar el pedido. Intenta de nuevo.');
    }
    try {
      localStorage.setItem('gys_last', data);
      localStorage.setItem('gys_draft', JSON.stringify({ name: f.name, phone: f.phone, address: f.address, notes: f.notes }));
    } catch (e) {}
    clear();
    router.push('/seguir?n=' + encodeURIComponent(data) + '&nuevo=1');
  }

  if (!ready) return <p className="hint">Cargando…</p>;
  if (!items.length)
    return (
      <div className="empty">
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos desde la tienda para armar tu pedido.</p>
        <Link className="btn" href="/">
          Ir a la tienda
        </Link>
      </div>
    );

  return (
    <>
      <h1 className="vt">Finalizar pedido</h1>
      <div className="two">
        <div className="panel">
          <h2>1. Tus datos</h2>
          <div className="fld">
            <label>
              Nombre completo
              <input value={f.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label>
              Teléfono (WhatsApp)
              <input value={f.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" />
            </label>
            <label>
              Dirección de entrega
              <textarea value={f.address} onChange={set('address')} autoComplete="street-address" />
            </label>
            <label>
              Notas para la entrega (opcional)
              <input value={f.notes} onChange={set('notes')} />
            </label>
          </div>
        </div>

        <div className="panel sticky">
          <h2>2. Paga a GYS</h2>
          <ul className="mini">
            {items.map((l) => (
              <li key={l.id}>
                <span>
                  {l.qty}× {l.name}
                </span>
                <span>{usd(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="tot">
            <span>Total a pagar</span>
            <span className="big">{usd(total)}</span>
          </div>

          {payReady ? (
            <div className="pay">
              {tasa ? (
                <div>
                  <span>Monto en bolívares</span>
                  <b>{bs(total * tasa)}</b>
                  <Copy text={num(total * tasa)} />
                </div>
              ) : null}
              <div>
                <span>Banco</span>
                <b>{s.banco}</b>
              </div>
              <div>
                <span>Teléfono Pago Móvil</span>
                <b>{s.telefono}</b>
                <Copy text={s.telefono} />
              </div>
              <div>
                <span>Cédula / RIF</span>
                <b>{s.documento}</b>
                <Copy text={s.documento} />
              </div>
              {s.titular ? (
                <div>
                  <span>Titular</span>
                  <b>{s.titular}</b>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="note">GYS todavía no publicó sus datos de pago. Vuelve en un momento.</div>
          )}
          {payReady && !tasa ? <p className="hint">Confirma el monto en bolívares con GYS antes de pagar.</p> : null}

          <label>
            Referencia del pago
            <input value={f.reference} onChange={set('reference')} autoComplete="off" placeholder="Número de referencia de tu banco" />
          </label>
          {err ? <div className="note bad">{err}</div> : null}
          <button className="btn" onClick={enviar} disabled={!payReady || busy}>
            {busy ? 'Enviando…' : 'Ya pagué, enviar pedido'}
          </button>
          <p className="hint">Verificamos tu pago y te avisamos. Puedes seguir el pedido con tu número.</p>
        </div>
      </div>
    </>
  );
}
