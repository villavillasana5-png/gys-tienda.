'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { STATUS, usd, bs, dt, wa } from '../../lib/format';
import Copy from '../Copy';

// Mensaje para el cliente según el estado del pedido
function msgCliente(o) {
  const n = o.number;
  return (
    {
      por_verificar: `recibimos tu pedido ${n} y estamos verificando el pago.`,
      pago_confirmado: `confirmamos tu pago del pedido ${n}. Ya lo vamos a preparar.`,
      preparando: `estamos preparando tu pedido ${n}.`,
      en_camino: `tu pedido ${n} va en camino.`,
      entregado: `tu pedido ${n} fue entregado. Gracias por comprar en GYS.`,
      rechazado: `no pudimos verificar el pago del pedido ${n}. ¿Nos envías tu comprobante?`,
    }[o.status] || `te escribimos de GYS sobre tu pedido ${n}.`
  );
}

export default function OrderCard({ o, attn, staffMap, settings, run, open, toggle }) {
  const [askReject, setAskReject] = useState(false);
  const st = STATUS[o.status] || { l: o.status, c: 'info' };
  const items = o.order_items || [];
  const rpcStatus = (s, msg) => run(() => supabase.rpc('set_status', { p_number: o.number, p_status: s }), msg);
  const who = o.confirmed_by ? (staffMap[o.confirmed_by] || 'Equipo GYS') : '';
  const resumen = items.map((i) => `${i.qty}x ${i.name}`).join(', ');
  const courier = wa(
    settings.entregador,
    `Pedido ${o.number}\nCliente: ${o.customer_name} · ${o.phone}\nDirección: ${o.address}${o.notes ? '\nNotas: ' + o.notes : ''}\nProductos: ${resumen}\nTotal: ${usd(o.total_usd)}`
  );
  const cliente = wa(o.phone, `Hola ${o.customer_name}, ${msgCliente(o)}`);
  const show = open || attn;

  return (
    <article className={'oc' + (attn ? ' attn' : '')}>
      <div className="oh">
        <b>{o.number}</b>
        <span className={'pill ' + st.c}>{st.l}</span>
      </div>
      <div className="meta">
        {dt(o.created_at)} · {o.customer_name} · {o.phone}
      </div>
      <div className="tot">
        <span>{items.reduce((a, i) => a + i.qty, 0)} artículos</span>
        <span>
          {usd(o.total_usd)} {o.total_bs ? <span className="bs">{bs(o.total_bs)}</span> : null}
        </span>
      </div>
      <div>
        <span className="hint">Referencia del pago</span>
        <br />
        <span className="ref">{o.reference}</span> <Copy text={o.reference} />
      </div>

      {show && (
        <>
          <ul className="mini">
            {items.map((i) => (
              <li key={i.id}>
                <span>
                  {i.qty}× {i.name} <span className="bs">({i.vendor})</span>
                </span>
                <span>{usd(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="meta">
            Entrega: {o.address}
            {o.notes ? ' · ' + o.notes : ''}
          </div>
          {o.confirmed_at ? (
            <div className="meta">
              Pago confirmado por {who} · {dt(o.confirmed_at)}
            </div>
          ) : null}
        </>
      )}

      <div className="acts">
        {o.status === 'por_verificar' && (
          <>
            <button className="btn" onClick={() => run(() => supabase.rpc('confirm_payment', { p_number: o.number }), 'Pago confirmado. Luz verde para preparar el pedido.')}>
              Confirmar pago
            </button>
            {askReject ? (
              <span className="inl">
                ¿Rechazar este pago?
                <button className="btn danger sm" onClick={() => { setAskReject(false); rpcStatus('rechazado', 'Pago rechazado.'); }}>
                  Sí, rechazar
                </button>
                <button className="btn ghost sm" onClick={() => setAskReject(false)}>
                  Cancelar
                </button>
              </span>
            ) : (
              <button className="btn ghost" onClick={() => setAskReject(true)}>
                Rechazar
              </button>
            )}
          </>
        )}
        {o.status === 'pago_confirmado' && (
          <button className="btn" onClick={() => rpcStatus('preparando', 'Estado: Preparando.')}>
            Pasar a preparando
          </button>
        )}
        {o.status === 'preparando' && (
          <button className="btn" onClick={() => rpcStatus('en_camino', 'Estado: En camino.')}>
            Marcar en camino
          </button>
        )}
        {o.status === 'en_camino' && (
          <button className="btn" onClick={() => rpcStatus('entregado', 'Estado: Entregado.')}>
            Marcar entregado
          </button>
        )}
        {o.status === 'rechazado' && (
          <button className="btn ghost" onClick={() => rpcStatus('por_verificar', 'Pedido reabierto.')}>
            Reabrir
          </button>
        )}
        {(o.status === 'preparando' || o.status === 'en_camino') &&
          (courier ? (
            <a className="btn ghost" href={courier} target="_blank" rel="noopener noreferrer">
              Avisar al entregador
            </a>
          ) : (
            <span className="hint">Agrega el WhatsApp del entregador en Ajustes.</span>
          ))}
        {cliente ? (
          <a className="btn ghost sm" href={cliente} target="_blank" rel="noopener noreferrer">
            Avisar al cliente
          </a>
        ) : null}
        {!attn && (
          <button className="btn ghost sm" onClick={toggle}>
            {open ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
        )}
      </div>
    </article>
  );
}
