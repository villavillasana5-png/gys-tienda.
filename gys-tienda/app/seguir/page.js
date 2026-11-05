'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../lib/settings';
import { STEPS, wa } from '../../lib/format';
import Copy from '../../components/Copy';

const FORMATO = /^GYS-[A-Z0-9]{6}$/;

export default function Seguir() {
  const { settings } = useSettings();
  const [input, setInput] = useState('');
  const [num, setNum] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const [res, setRes] = useState(null); // { state, status }
  const [last, setLast] = useState('');
  const timer = useRef(null);

  async function consultar(n, silent) {
    n = String(n || '').trim().toUpperCase();
    setNum(n);
    clearInterval(timer.current);
    if (!n) return setRes(null);
    if (!FORMATO.test(n)) return setRes({ state: 'bad' });
    if (!silent) setRes({ state: 'loading' });
    const { data, error } = await supabase.rpc('track_order', { p_number: n });
    if (error) return setRes({ state: 'err' });
    setRes({ state: 'ok', status: data && data[0] ? data[0].status : null });
    timer.current = setInterval(async () => {
      const r = await supabase.rpc('track_order', { p_number: n });
      if (!r.error) setRes({ state: 'ok', status: r.data && r.data[0] ? r.data[0].status : null });
    }, 20000);
  }

  useEffect(() => {
    let l = '';
    try {
      l = localStorage.getItem('gys_last') || '';
    } catch (e) {}
    setLast(l);
    const p = new URLSearchParams(window.location.search);
    const n = p.get('n') || l;
    setNuevo(p.get('nuevo') === '1');
    if (n) {
      setInput(n);
      consultar(n);
    }
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const st = res && res.status;
  const idx = st ? STEPS.map((x) => x[0]).indexOf(st) : 0;
  const link = wa(settings.whatsapp, 'Hola GYS, consulto por mi pedido ' + num + '.');

  return (
    <>
      <h1 className="vt">Seguir pedido</h1>
      <div className="two">
        <div className="panel">
          {nuevo && num ? (
            <div className="note ok">
              <b>Pedido enviado.</b> Guarda tu número; lo necesitas para seguirlo.
            </div>
          ) : null}
          <form
            className="fld"
            onSubmit={(e) => {
              e.preventDefault();
              setNuevo(false);
              consultar(input);
            }}
          >
            <label>
              Número de pedido
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="GYS-XXXXXX" autoComplete="off" />
            </label>
            <button className="btn" type="submit">
              Ver estado
            </button>
          </form>
        </div>

        <div className="panel">
          {!res && (
            <>
              <h2>Estado</h2>
              <p className="hint">Escribe tu número de pedido para ver en qué paso va.</p>
            </>
          )}
          {res && res.state === 'bad' && <div className="note bad">El número debe verse así: GYS-A1B2C3.</div>}
          {res && res.state === 'err' && <div className="note bad">No pudimos consultar el pedido. Intenta de nuevo.</div>}
          {res && res.state === 'loading' && <p className="hint">Consultando…</p>}
          {res && res.state === 'ok' && (
            <>
              <div>
                <span className="hint">Pedido</span>
                <div className="big-num">{num}</div>
                <Copy text={num} />
              </div>
              {st === 'rechazado' ? (
                <div className="note bad">
                  <b>No pudimos verificar tu pago.</b> Escríbenos con tu comprobante para resolverlo.
                </div>
              ) : !st && num !== last ? (
                <div className="note">Todavía no hay movimiento para este número. Si lo enviaste hace poco, tu pago está por verificarse.</div>
              ) : (
                <ol className="tl">
                  {STEPS.map((x, i) => (
                    <li key={x[0]} className={i < idx ? 'done' : i === idx ? 'now' : 'todo'}>
                      <span className="dot">{i < idx ? '✓' : i + 1}</span>
                      <div>
                        <b>{x[1]}</b>
                        <small>{i === idx ? x[2] : ''}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {link ? (
                <a className="btn ghost" href={link} target="_blank" rel="noopener noreferrer">
                  Escribir a GYS por WhatsApp
                </a>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
