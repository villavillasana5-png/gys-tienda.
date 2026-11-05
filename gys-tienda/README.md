# GYS · Tienda web

Tienda y distribuidora con carrito, pago por Pago Móvil/transferencia, seguimiento de pedidos y panel de gerencia.
Hecha con Next.js (la web) y Supabase (base de datos, usuarios y fotos). Se publica gratis en Vercel.

**Qué incluye esta versión**
- Tienda con catálogo, búsqueda, carrito y checkout con tus datos de pago (en USD y Bs. según la tasa del día).
- Seguimiento: el cliente consulta su pedido con su número (GYS-XXXXXX).
- Panel `/admin` con acceso por correo y contraseña:
  - **Gerencia** (rol `admin`): Resumen de ventas, Pagos, Pedidos, Productos y Ajustes.
  - **Agente de pagos** (rol `agent`): solo Pagos y Pedidos. Confirma el pago (luz verde), marca preparando, en camino y entregado, y avisa por WhatsApp al entregador y al cliente.
- Los precios se calculan en la base de datos, no en el navegador del cliente.

**Todavía no incluye:** registro y panel de vendedores aliados, cobro de comisiones, notificaciones automáticas. Eso sigue en las fases 5 y 6.

---

## Puesta en línea, paso a paso

Necesitas tres cuentas gratuitas: **Supabase**, **GitHub** y **Vercel**.

### 1. Base de datos (Supabase)
1. Entra a supabase.com, crea una cuenta y un proyecto nuevo (guarda la contraseña de la base de datos).
2. Abre **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y pulsa **Run**.
3. Ve a **Authentication → Users → Add user**: crea tu usuario con tu correo y una contraseña (marca *Auto Confirm User*).
4. Vuelve al **SQL Editor** y ejecuta esto (cambia el correo por el tuyo) para darte acceso de gerencia:
   ```sql
   insert into public.staff (user_id, role, name)
   select id, 'admin', 'Gerencia GYS' from auth.users where email = 'tu@correo.com';
   ```
5. Para el agente de pagos: crea su usuario igual en Authentication y ejecuta:
   ```sql
   insert into public.staff (user_id, role, name)
   select id, 'agent', 'Agente de pagos' from auth.users where email = 'agente@correo.com';
   ```
6. Ve a **Project Settings → API** y copia dos datos: **Project URL** y la clave **anon public**.

### 2. Subir el código a GitHub
1. Entra a github.com, crea una cuenta y un repositorio nuevo llamado `gys-tienda` (privado está bien).
2. En el repositorio pulsa **Add file → Upload files** y arrastra **el contenido** de esta carpeta (no subas `node_modules` ni `.next`). Pulsa **Commit changes**.

### 3. Publicar (Vercel)
1. Entra a vercel.com e inicia sesión con tu cuenta de GitHub.
2. **Add New → Project**, elige el repositorio `gys-tienda` y pulsa **Import**.
3. Antes de desplegar, abre **Environment Variables** y agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = el Project URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la clave anon public
4. Pulsa **Deploy**. En un par de minutos tendrás un enlace público como `gys-tienda.vercel.app`.

### 4. Primer uso
1. Entra a `tu-enlace/admin` e inicia sesión con tu correo.
2. En **Ajustes** carga banco, teléfono de Pago Móvil, cédula/RIF, titular, tasa del día y los WhatsApp.
3. En **Productos** agrega tus primeros productos con foto.
4. Haz un pedido de prueba desde la tienda y confírmalo en **Pagos**.

### Dominio propio (opcional)
En Vercel: **Settings → Domains**, escribe tu dominio y sigue las instrucciones para apuntarlo.

---

## Probar en tu computadora (opcional)
```bash
npm install
cp .env.example .env.local   # y pega tus claves
npm run dev                  # abre http://localhost:3000
```

## Mantenimiento
- La tasa del día se cambia en **Ajustes**; los precios en Bs. se actualizan al instante.
- El stock baja solo cuando se confirma un pago. Si dejas el stock vacío, el producto no tiene límite.
- Las fotos se guardan en Supabase Storage (bucket `productos`).
