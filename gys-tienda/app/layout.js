import './globals.css';
import Link from 'next/link';
import Providers from '../components/Providers';
import Header from '../components/Header';

export const metadata = {
  title: 'GYS · Todo a tu gusto',
  description: 'Tienda y distribuidora GYS. Compra, paga por Pago Móvil o transferencia y recibe en tu dirección.',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Caprasimo&display=swap"
        />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="wrap" id="app">
            {children}
          </main>
          <footer className="wrap ftr">
            <span>GYS · Todo a tu gusto.</span>
            <span>
              Pagos por Pago Móvil o transferencia · Entregamos tu pedido · <Link href="/admin">Equipo</Link>
            </span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
