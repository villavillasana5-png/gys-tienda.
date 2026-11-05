'use client';
import OrderCard from './OrderCard';

export default function Pagos({ orders, staffMap, settings, run }) {
  const L = orders.filter((o) => o.status === 'por_verificar').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (!L.length)
    return (
      <div className="empty">
        <h2>No hay pagos por verificar</h2>
        <p>
          Cuando un cliente envíe su referencia, el pedido aparece aquí. Compara la referencia con tu banco y confirma el
          pago para dar luz verde.
        </p>
      </div>
    );
  return (
    <>
      <p className="hint" style={{ marginBottom: 14 }}>
        Del más antiguo al más reciente. Compara la referencia y el monto con tu banco antes de confirmar.
      </p>
      <div className="list">
        {L.map((o) => (
          <OrderCard key={o.id} o={o} attn staffMap={staffMap} settings={settings} run={run} />
        ))}
      </div>
    </>
  );
}
