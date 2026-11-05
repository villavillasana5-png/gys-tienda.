'use client';
import { CONFIRMED, usd, dt, r2 } from '../../lib/format';

const sum = (list) => r2(list.reduce((a, o) => a + (+o.total_usd || 0), 0));

export default function Resumen({ orders, staffMap }) {
  const conf = orders.filter((o) => CONFIRMED.includes(o.status));
  const when = (o) => new Date(o.confirmed_at || o.created_at).getTime();
  const now = new Date();
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const pend = orders.filter((o) => o.status === 'por_verificar');
  const road = orders.filter((o) => o.status === 'en_camino');

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const s = d0 - i * 86400000;
    const e = s + 86400000;
    days.push({
      l: new Date(s + 7200000).toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', ''),
      v: sum(conf.filter((o) => when(o) >= s && when(o) < e)),
    });
  }
  const max = Math.max(1, ...days.map((d) => d.v));

  const tp = {};
  conf.forEach((o) =>
    (o.order_items || []).forEach((it) => {
      tp[it.name] = tp[it.name] || { n: it.name, q: 0, v: 0 };
      tp[it.name].q += it.qty;
      tp[it.name].v += it.price * it.qty;
    })
  );
  const top = Object.values(tp).sort((a, b) => b.v - a.v).slice(0, 5);
  const last = conf.slice().sort((a, b) => when(b) - when(a)).slice(0, 6);

  return (
    <>
      <div className="tiles">
        <div className="tile">
          <small>Ventas confirmadas hoy</small>
          <b>{usd(sum(conf.filter((o) => when(o) >= d0)))}</b>
          <span>pagos ya verificados</span>
        </div>
        <div className="tile">
          <small>Este mes</small>
          <b>{usd(sum(conf.filter((o) => when(o) >= m0)))}</b>
          <span>pagos ya verificados</span>
        </div>
        <div className="tile">
          <small>Por verificar</small>
          <b>{pend.length}</b>
          <span>{usd(sum(pend))} en espera</span>
        </div>
        <div className="tile">
          <small>En camino</small>
          <b>{road.length}</b>
          <span>pedidos con el entregador</span>
        </div>
      </div>

      <div className="cols">
        <div className="panel">
          <h2>Ventas, últimos 7 días</h2>
          <div className="bars">
            {days.map((d, i) => (
              <div className="bar" key={i}>
                <span>{d.v ? usd(d.v).replace(/,00$/, '') : ''}</span>
                <i className={d.v ? '' : 'z'} style={{ height: d.v ? Math.max(4, Math.round((d.v / max) * 110)) : 3 }} />
              </div>
            ))}
          </div>
          <div className="barl">
            {days.map((d, i) => (
              <span key={i}>{d.l}</span>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Últimas confirmaciones</h2>
          {last.length ? (
            <ul className="mini">
              {last.map((o) => (
                <li key={o.id}>
                  <span>
                    {o.number} · {o.customer_name}
                    <br />
                    <span className="bs">
                      {dt(o.confirmed_at)} · {staffMap[o.confirmed_by] || 'Equipo GYS'}
                    </span>
                  </span>
                  <span>{usd(o.total_usd)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Aquí verás quién confirmó cada pago y cuándo.</p>
          )}
        </div>

        <div className="panel">
          <h2>Más vendidos</h2>
          {top.length ? (
            <ul className="mini">
              {top.map((t) => (
                <li key={t.n}>
                  <span>
                    {t.n}
                    <br />
                    <span className="bs">{t.q} vendidos</span>
                  </span>
                  <span>{usd(t.v)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Se llenará con los pedidos de pago confirmado.</p>
          )}
        </div>
      </div>
    </>
  );
}
