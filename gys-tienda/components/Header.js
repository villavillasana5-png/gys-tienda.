'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../lib/cart';

export default function Header() {
  const path = usePathname();
  const { count } = useCart();
  const nl = (href, label) => (
    <Link href={href} className={'nl' + (path === href ? ' on' : '')} aria-current={path === href ? 'page' : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="hdr">
      <div className="wrap hrow">
        <Link href="/" className="logo" aria-label="GYS, inicio">
          GYS
        </Link>
        <Link href="/carrito" className={'cartb' + (path === '/carrito' ? ' on' : '')} aria-label={`Carrito, ${count} productos`}>
          Carrito<span className="cnt">{count}</span>
        </Link>
        <nav className="nav" aria-label="Principal">
          {nl('/', 'Tienda')}
          {nl('/seguir', 'Seguir pedido')}
        </nav>
      </div>
    </header>
  );
}
