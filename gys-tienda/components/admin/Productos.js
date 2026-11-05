'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usd, imgUrl } from '../../lib/format';

const VACIO = { name: '', description: '', price: '', category: '', stock: '', vendor: 'GYS', visible: true, image_path: null };

export default function Productos({ products, reload, toast }) {
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [f, setF] = useState(VACIO);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [del, setDel] = useState(null);
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function nuevo() {
    setF(VACIO);
    setEditing('new');
    setErr('');
  }
  function editar(p) {
    setF({
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category || '',
      stock: p.stock == null ? '' : p.stock,
      vendor: p.vendor || 'GYS',
      visible: p.visible,
      image_path: p.image_path || null,
    });
    setEditing(p.id);
    setErr('');
  }

  async function subir(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    toast('Subiendo foto…');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('productos').upload(path, file, { contentType: file.type, upsert: false });
    if (error) return toast('No se pudo subir la foto: ' + error.message);
    setF((x) => ({ ...x, image_path: path }));
    toast('Foto lista.');
  }

  async function guardar() {
    const price = parseFloat(f.price);
    if (!f.name.trim() || !(price >= 0) || f.price === '') return setErr('Escribe el nombre y el precio.');
    setBusy(true);
    setErr('');
    const row = {
      name: f.name.trim(),
      description: (f.description || '').trim(),
      price: Math.round(price * 100) / 100,
      category: (f.category || '').trim(),
      stock: f.stock === '' ? null : Math.max(0, parseInt(f.stock, 10) || 0),
      vendor: (f.vendor || '').trim() || 'GYS',
      visible: !!f.visible,
      image_path: f.image_path || null,
    };
    const q = editing === 'new' ? supabase.from('products').insert(row) : supabase.from('products').update(row).eq('id', editing);
    const { error } = await q;
    setBusy(false);
    if (error) return setErr('No se pudo guardar: ' + error.message);
    setEditing(null);
    toast('Producto guardado.');
    reload();
  }

  async function quitar(id) {
    setDel(null);
    const { error } = await supabase.from('products').delete().eq('id', id);
    toast(error ? 'No se pudo eliminar: ' + error.message : 'Producto eliminado.');
    reload();
  }

  async function ocultar(p) {
    const { error } = await supabase.from('products').update({ visible: !p.visible }).eq('id', p.id);
    if (error) toast('No se pudo actualizar.');
    reload();
  }

  const L = products.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return (
    <>
      {editing ? (
        <div className="panel" style={{ marginBottom: 22 }}>
          <h2>{editing === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
          <div className="fld">
            <div className="row2">
              <label>
                Nombre
                <input value={f.name} onChange={set('name')} />
              </label>
              <label>
                Precio en USD
                <input type="number" step="0.01" min="0" inputMode="decimal" value={f.price} onChange={set('price')} />
              </label>
            </div>
            <label>
              Descripción
              <textarea value={f.description} onChange={set('description')} />
            </label>
            <div className="row2">
              <label>
                Categoría
                <input list="cats" value={f.category} onChange={set('category')} />
                <datalist id="cats">
                  {cats.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label>
                Stock (vacío = sin límite)
                <input type="number" min="0" step="1" inputMode="numeric" value={f.stock} onChange={set('stock')} />
              </label>
              <label>
                Vendedor
                <input value={f.vendor} onChange={set('vendor')} />
              </label>
            </div>
            <div className="prow" style={{ border: 0, padding: 0 }}>
              <div className="th">{f.image_path ? <img src={imgUrl(f.image_path)} alt="" /> : 'Foto'}</div>
              <label style={{ flex: 1, minWidth: 200 }}>
                Foto del producto
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={subir} />
              </label>
            </div>
            <label className="chk">
              <input type="checkbox" checked={!!f.visible} onChange={set('visible')} /> Visible en la tienda
            </label>
            <div className="acts">
              <button className="btn" onClick={guardar} disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar producto'}
              </button>
              <button className="btn ghost" onClick={() => setEditing(null)}>
                Cancelar
              </button>
            </div>
            {err ? <div className="note bad">{err}</div> : null}
          </div>
        </div>
      ) : (
        <div className="acts" style={{ marginBottom: 18 }}>
          <button className="btn" onClick={nuevo}>
            Nuevo producto
          </button>
          <span className="hint">{products.length} en el catálogo</span>
        </div>
      )}

      {!products.length ? (
        <div className="empty">
          <h2>Catálogo vacío</h2>
          <p>Empieza con tus primeros productos de GYS. El stock puede ser pequeño y crecer con el tiempo.</p>
        </div>
      ) : (
        <div className="panel">
          {L.map((p) => (
            <div className="prow" key={p.id}>
              <div className="th">{p.image_path ? <img src={imgUrl(p.image_path)} alt="" /> : p.name.slice(0, 2).toUpperCase()}</div>
              <div className="li">
                <b>{p.name}</b>
                <span className="bs">
                  {p.vendor || 'GYS'} · {usd(p.price)} · {p.stock == null ? 'sin límite' : p.stock + ' en stock'}
                  {p.visible ? '' : ' · oculto'}
                </span>
              </div>
              <div className="acts">
                <button className="btn ghost sm" onClick={() => editar(p)}>
                  Editar
                </button>
                <button className="btn ghost sm" onClick={() => ocultar(p)}>
                  {p.visible ? 'Ocultar' : 'Mostrar'}
                </button>
                {del === p.id ? (
                  <>
                    <button className="btn danger sm" onClick={() => quitar(p.id)}>
                      Sí, eliminar
                    </button>
                    <button className="btn ghost sm" onClick={() => setDel(null)}>
                      No
                    </button>
                  </>
                ) : (
                  <button className="btn danger sm" onClick={() => setDel(p.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
