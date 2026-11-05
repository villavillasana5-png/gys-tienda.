'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase, configured } from '../../lib/supabase';
import Resumen from '../../components/admin/Resumen';
import Pagos from '../../components/admin/Pagos';
import Pedidos from '../../components/admin/Pedidos';
import Productos from '../../components/admin/Productos';
import Ajustes from '../../components/admin/Ajustes';

function Login({ onError }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function entrar(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error) setErr('Correo o contraseña incorrectos.');
  }
  return (
    <div className="two">
      <form className="panel" onSubmit={entrar}>
        <h2>Entrar al panel</h2>
        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
        </label>
        {err ? <div className="note bad">{err}</div> : null}
        <button className="btn" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [me, setMe] = useState(undefined); // undefined = cargando, false = sin acceso, objeto = staff
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [staffMap, setStaffMap] = useState({});
  const [tab, setTab] = useState(null);
  const [msg, setMsg] = useState('');

  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(toast.t);
    toast.t = setTimeout(() => setMsg(''), 3600);
  }, []);

  useEffect(() => {
    if (!configured) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setMe(undefined);
      return;
    }
    supabase
      .from('staff')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setMe(data || false));
  }, [session]);

  const load = useCallback(async () => {
    const [o, p, s, st] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('name'),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('staff').select('user_id,name'),
    ]);
    if (o.data) setOrders(o.data);
    if (p.data) setProducts(p.data);
    if (s.data) setSettings(s.data);
    if (st.data) setStaffMap(Object.fromEntries(st.data.map((x) => [x.user_id, x.name])));
  }, []);

  useEffect(() => {
    if (!me) return;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [me, load]);

  async function run(fn, okMsg) {
    const { error } = await fn();
    toast(error ? 'No se pudo completar: ' + error.message : okMsg);
    await load();
  }

  const isAdmin = me && me.role === 'admin';
  const pend = orders.filter((o) => o.status === 'por_verificar').length;
  const tabs = isAdmin
    ? [['resumen', 'Resumen'], ['pagos', 'Pagos', pend], ['pedidos', 'Pedidos'], ['productos', 'Productos'], ['ajustes', 'Ajustes']]
    : [['pagos', 'Pagos', pend], ['pedidos', 'Pedidos']];
  const cur = tab || (pend || !isAdmin ? 'pagos' : 'resumen');

  if (!configured)
    return (
      <div className="empty">
        <h2>Falta conectar la base de datos</h2>
        <p>Agrega las claves de Supabase en las variables de entorno (ver README).</p>
      </div>
    );
  if (session === undefined) return <p className="hint">Cargando…</p>;
  if (!session) return (<><h1 className="vt">Gerencia</h1><Login /></>);
  if (me === undefined) return <p className="hint">Cargando…</p>;
  if (me === false)
    return (
      <div className="empty">
        <h2>Tu cuenta no tiene acceso</h2>
        <p>Pide a la gerencia de GYS que te agregue al equipo.</p>
        <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
    );

  return (
    <>
      <div className="oh" style={{ marginBottom: 12 }}>
        <h1 className="vt" style={{ margin: 0 }}>Gerencia</h1>
        <span className="inl">
          <span className="hint">
            {me.name} · {isAdmin ? 'Gerencia' : 'Agente de pagos'}
          </span>
          <button className="btn ghost sm" onClick={load}>
            Actualizar
          </button>
          <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </span>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t[0]} className={'tab' + (cur === t[0] ? ' on' : '')} role="tab" aria-selected={cur === t[0]} onClick={() => setTab(t[0])}>
            {t[1]}
            {t[2] ? <span className="cnt warn">{t[2]}</span> : null}
          </button>
        ))}
      </div>
      {cur === 'resumen' && isAdmin && <Resumen orders={orders} staffMap={staffMap} />}
      {cur === 'pagos' && <Pagos orders={orders} staffMap={staffMap} settings={settings} run={run} />}
      {cur === 'pedidos' && <Pedidos orders={orders} staffMap={staffMap} settings={settings} run={run} />}
      {cur === 'productos' && isAdmin && <Productos products={products} reload={load} toast={toast} />}
      {cur === 'ajustes' && isAdmin && <Ajustes key={settings.updated_at || 'nuevo'} settings={settings} reload={load} toast={toast} />}
      {msg ? (
        <div className="toast" role="status">
          {msg}
        </div>
      ) : null}
    </>
  );
}
