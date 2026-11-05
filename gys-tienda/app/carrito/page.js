'use client';
import Link from 'next/link';
import { useCart } from '../../lib/cart';
import { useSettings } from '../../lib/settings';
import { usd, bs, num, imgUrl } from '../../lib/format';

export default function Carrito() {
  const { items, setQty, total, ready } = useCart();
  const { settings } = useSettings();
  const tasa = +settings.tasa > 0 ? +settings.tasa : 0;

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
      <h1 className="vt">Tu carrito</h1>
      <div className="two">
        <div className="panel">
          {items.map((l) => (
            <div className="line" key={l.id}>
              <div className="th">{l.image ? <img src={imgUrl(l.image)} alt="" /> : l.name.slice(0, 2).toUpperCase()}</div>
              <div className="li">
                <b>{l.name}</b>
                <span className="bs">
                  {l.vendor || 'GYS'} · {usd(l.price)} c/u
                </span>
              </div>
              <div className="step">
                <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Quitar uno">
                  −
                </button>
                <span>{l.qty}</span>
                <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="Agregar uno">
                  +
                </button>
              </div>
              <b style={{ minWidth: 72, textAlign: 'right' }}>{usd(l.price * l.qty)}</b>
            </div>
          ))}
        </div>
        <div className="panel sticky">
          <h2>Resumen</h2>
          <div className="tot">
            <span>Total</span>
            <span className="big">{usd(total)}</span>
          </div>
          {tasa ? (
            <>
              <div className="tot">
                <span className="bs">Equivale a</span>
                <span>{bs(total * tasa)}</span>
              </div>
              <p className="hint">Tasa del día: {num(tasa)} Bs. por $1.</p>
            </>
          ) : null}
          <Link className="btn" href="/pago">
            Continuar al pago
          </Link>
          <Link className="btn ghost" href="/">
            Seguir comprando
          </Link>
        </div>
      </div>
    </>
  );
}
