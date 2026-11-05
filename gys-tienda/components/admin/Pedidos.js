'use client';
import { useState } from 'react';
import OrderCard from './OrderCard';
import { STATUS } from '../../lib/format';

export default function Pedidos({ orders, staffMap, settings, run }) {
  const [filter, setFilter] = useState('todos');
  const [open, setOpen] = useState({});
  const L = orders.filter((o) => filter === 'todos' || o.status === filter);
  return (
    <>
      <div className="tb">
        <label style={{ minWidth: 200 }}>
          Estado
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="todos">Todos</option>
            {Object.keys(STATUS).map((k) => (
              <option key={k} value={k}>
                {STATUS[k].l}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!L.length ? (
        <div className="empty">
          <h2>Sin pedidos</h2>
          <p>Los pedidos de clientes aparecerán aquí con su estado y las acciones para avanzarlos.</p>
        </div>
      ) : (
        <div className="list">
          {L.map((o) => (
            <OrderCard
              key={o.id}
              o={o}
              staffMap={staffMap}
              settings={settings}
              run={run}
              open={!!open[o.id]}
              toggle={() => setOpen((x) => ({ ...x, [o.id]: !x[o.id] }))}
            />
          ))}
        </div>
      )}
    </>
  );
}
