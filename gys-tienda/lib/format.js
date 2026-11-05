import { supabase } from './supabase';

const nf = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const usd = (n) => '$' + nf.format(+n || 0);
export const bs = (n) => 'Bs. ' + nf.format(+n || 0);
export const num = (n) => nf.format(+n || 0);
export const r2 = (n) => Math.round(n * 100) / 100;

export const dt = (d) =>
  d
    ? new Date(d).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

// Enlace de WhatsApp. Los teléfonos que empiezan con 0 se envían como Venezuela (+58).
export function wa(phone, text) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = '58' + d.slice(1);
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(text);
}

export function imgUrl(path) {
  if (!path) return '';
  return supabase.storage.from('productos').getPublicUrl(path).data.publicUrl;
}

export const STATUS = {
  por_verificar: { l: 'Por verificar', c: 'warn' },
  pago_confirmado: { l: 'Pago confirmado', c: 'ok' },
  preparando: { l: 'Preparando', c: 'info' },
  en_camino: { l: 'En camino', c: 'info' },
  entregado: { l: 'Entregado', c: 'ok' },
  rechazado: { l: 'Rechazado', c: 'bad' },
};

export const CONFIRMED = ['pago_confirmado', 'preparando', 'en_camino', 'entregado'];

export const STEPS = [
  ['por_verificar', 'Pedido recibido', 'Estamos verificando tu pago.'],
  ['pago_confirmado', 'Pago confirmado', 'Ya podemos preparar tu pedido.'],
  ['preparando', 'Preparando', 'Estamos armando tu pedido.'],
  ['en_camino', 'En camino', 'Tu pedido salió hacia tu dirección.'],
  ['entregado', 'Entregado', 'Gracias por comprar en GYS.'],
];
