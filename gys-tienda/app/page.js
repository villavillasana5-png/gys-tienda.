'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase, configured } from '../lib/supabase';
import { useCart } from '../lib/cart';
import { useSettings } from '../lib/settings';
import { usd, bs, imgUrl } from '../lib/format';

function Card({ p, tasa }) {
  const { add, setQty, qtyOf } = useCart();
  const q = qtyOf(p.id);
  const out = p.stock === 0;
  const src = imgUrl(p.image_path);
  return (
    <article className="card">
      <div className="ph">
        {src ? (
          <img src={src} alt={p.name} loading="lazy" />
        ) : (
          <span className="mono" aria-hidden="true">
            {p.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="cb">
        <span className="vend">{p.vendor || 'GYS'}</span>
        <h3>{p.name}</h3>
        {p.description ? <p className="desc">{p.description}</p> : null}
        {p.stock != null && p.stock > 0 && p.stock <= 3 ? <span className="low">Quedan {p.stock}</span> : null}
        <div className="pr">
          <b>{usd(p.price)}</b>
          {tasa ? <span className="bs">{bs(p.price * tasa)}</span> : null}
        </div>
        {out ? (
          <button className="btn" disabled>
            Agotado
          </button>
        ) : q > 0 ? (
          <div className="step" role="group" aria-label="Cantidad">
            <button onClick={() => setQty(p.id, q - 1)} aria-label="Quitar uno">
              −
            </button>
            <span>{q}</span>
            <button onClick={() => setQty(p.id, q + 1)} aria-label="Agregar uno">
              +
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => add(p)}>
            Agregar
          </button>
        )}
      </div>
    </article>
  );
}

export default function Tienda() {
  const { settings } = useSettings();
  const tasa = +settings.tasa > 0 ? +settings.tasa : 0;
  const [products, setProducts] = useState([]);
  const [state, setState] = useState('loading');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');
  const [vendor, setVendor] = useState('Todos');

  useEffect(() => {
    if (!configured) {
      setState('config');
      return;
    }
    supabase
      .from('products')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) return setState('error');
        setProducts(data || []);
        setState('ready');
      });
  }, []);

  const cats = useMemo(() => ['Todos', ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const vendors = useMemo(() => ['Todos', ...new Set(products.map((p) => p.vendor || 'GYS'))], [products]);
  const list = products.filter(
    (p) =>
      (cat === 'Todos' || p.category === cat) &&
      (vendor === 'Todos' || (p.vendor || 'GYS') === vendor) &&
      (!q.trim() || (p.name + ' ' + (p.description || '')).toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <>
      <section className="hero">
        <div>
          <h1>GYS</h1>
          <div className="tag">TODO A TU GUSTO.</div>
        </div>
        <div>
          <p>
            Tienda y distribuidora. Compra los productos de GYS y de los vendedores aliados; nosotros recibimos tu pedido
            y te lo entregamos.
          </p>
          <ul className="facts">
            <li>
              <b>1. Eliges</b>
              <span>y armas tu carrito</span>
            </li>
            <li>
              <b>2. Pagas</b>
              <span>por Pago Móvil o transferencia</span>
            </li>
            <li>
              <b>3. Recibes</b>
              <span>cuando verificamos tu pago</span>
            </li>
          </ul>
        </div>
      </section>

      {state === 'ready' && products.length > 0 && (
        <div className="tb">
          <div className="grow">
            <input type="search" placeholder="Buscar producto" aria-label="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {cats.length > 2 && (
            <div className="chips" role="group" aria-label="Categorías">
              {cats.map((c) => (
                <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
          {vendors.length > 2 && (
            <div className="chips" role="group" aria-label="Vendedores">
              {vendors.map((c) => (
                <button key={c} className={'chip' + (vendor === c ? ' on' : '')} onClick={() => setVendor(c)}>
                  {c === 'Todos' ? 'Todos los vendedores' : c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {state === 'loading' && <p className="hint">Cargando productos…</p>}
      {state === 'config' && (
        <div className="empty">
          <h2>Falta conectar la base de datos</h2>
          <p>Agrega las claves de Supabase en las variables de entorno (ver README).</p>
        </div>
      )}
      {state === 'error' && (
        <div className="empty">
          <h2>No pudimos cargar la tienda</h2>
          <p>Revisa tu conexión y vuelve a intentar.</p>
        </div>
      )}
      {state === 'ready' && products.length === 0 && (
        <div className="empty">
          <h2>Estamos cargando los primeros productos</h2>
          <p>GYS está abriendo su catálogo. Vuelve pronto, o sigue un pedido si ya hiciste uno.</p>
          <Link className="btn ghost" href="/seguir">
            Seguir pedido
          </Link>
        </div>
      )}
      {state === 'ready' && products.length > 0 && list.length === 0 && <p className="hint">No hay productos que coincidan con tu búsqueda.</p>}
      {state === 'ready' && list.length > 0 && (
        <div className="grid">
          {list.map((p) => (
            <Card key={p.id} p={p} tasa={tasa} />
          ))}
        </div>
      )}
    </>
  );
}
