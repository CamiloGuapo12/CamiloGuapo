# Army's Home & More: seguridad de la información (alineado con ISO/IEC 27001:2022)

**Alcance:** tienda web (Netlify), base de datos y autenticación (Supabase, proyecto "Armys Home Store"), función de avisos (Edge Function `notify-order`) y correo transaccional (Resend).
**Aclaración:** ISO 27001 certifica un Sistema de Gestión de Seguridad de la Información (SGSI) de una organización, no un código. Este documento alinea los controles técnicos con el Anexo A y deja listos los procedimientos mínimos. Para certificarse hacen falta además política aprobada por la dirección, análisis de riesgos formal, auditoría interna y auditoría externa.

## 1. Hallazgos corregidos

| # | Hallazgo | Gravedad | Corrección | Control Anexo A |
|---|----------|----------|------------|-----------------|
| 1 | Cualquier usuario podía cambiar su propio `role` a `admin` (política `profiles_update` sin límite de columnas) | Crítica | Solo `name` y `phone` son actualizables; la inserción exige `role='user'` | A.5.15, A.5.18, A.8.2 |
| 2 | `profiles_select = true`: nombre, teléfono y rol de todos los usuarios eran legibles por cualquiera, incluso sin sesión | Alta | Cada usuario ve su perfil; el admin ve todos (función `private.is_admin()`) | A.5.34, A.8.3 |
| 3 | El cliente fijaba precio, total y estado del pedido; se podía comprar a cualquier precio y el stock no se descontaba de forma fiable | Alta | `place_order()` calcula precios y stock en el servidor, bloquea filas, valida cantidades y limita 10 pedidos por hora | A.8.26, A.8.28 |
| 4 | La función `notify-order` no exigía sesión, aceptaba datos arbitrarios e insertaba HTML sin escapar en el correo | Alta | Exige usuario autenticado, lee el pedido desde la base (RLS), escapa HTML, un aviso por pedido, CORS restringido | A.8.5, A.8.26, A.8.28 |
| 5 | Llave de la API de Resend escrita en el código de la función | Alta | La versión nueva lee `RESEND_API_KEY` y `NOTIFY_EMAIL` de secretos. **La llave vieja debe rotarse** (ver sección 2) | A.5.17, A.8.24 |
| 6 | XSS almacenado: nombres, descripciones, direcciones y mensajes se insertaban como HTML sin escapar (incluido el panel del admin) | Alta | Función `esc()` en todos los puntos; URLs de imagen limitadas al bucket propio; botón "Copiar" sin valores dentro de `onclick` | A.8.28 |
| 7 | Permisos de tabla excesivos para `anon` (incluido `TRUNCATE`) | Media | `REVOKE` total y concesiones mínimas por tabla y columna; políticas solo para `authenticated` salvo el catálogo activo | A.5.15, A.8.3 |
| 8 | Bucket de imágenes sin límite de tamaño ni de tipo; nombres predecibles y `upsert` | Media | 5 MB, solo JPG/PNG/WEBP/GIF, nombre aleatorio, sin sobrescritura, validación en cliente y en el bucket | A.8.26 |
| 9 | Productos inactivos visibles por API | Media | El público solo ve `active = true` | A.8.3 |
| 10 | Función `handle_new_user` con `search_path` mutable y ejecutable por la API | Media | `search_path` fijo, nombre y teléfono acotados, `EXECUTE` revocado | A.8.9, A.8.26 |
| 11 | Sin restricciones de datos (precios negativos, cantidades absurdas, estados libres) | Media | Restricciones `CHECK` en productos, pedidos y artículos | A.8.26 |
| 12 | Sin registro de cambios sensibles | Media | Tabla `private.audit_log` con cambios de rol, estado de pedidos y productos (quién, cuándo, antes y después) | A.8.15, A.8.16 |
| 13 | Librería cargada desde un CDN externo sin verificación | Media | `supabase-js 2.117.2` incluida en el sitio (`vendor/supabase.js`) | A.5.21, A.8.30 |
| 14 | Sin cabeceras de seguridad | Media | `_headers`: CSP, HSTS, `nosniff`, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy | A.8.23, A.8.26 |
| 15 | Contraseña mínima de 6 caracteres; el login revelaba mensajes del servidor | Baja | Mínimo 10 con letras y números; mensaje de login genérico; atributos `autocomplete` y longitudes máximas | A.5.17, A.8.5 |

La migración de base de datos se aplicó en Supabase con el nombre `security_hardening_phase1` (ver Database → Migrations).

## 2. Acciones que solo puede hacer la persona responsable (en orden)

1. **Rotar la llave de Resend.** La anterior estuvo escrita en el código de la función: créala de nuevo en Resend y revoca la vieja.
2. **Crear los secretos de la función:** Supabase → Edge Functions → Secrets: `RESEND_API_KEY` (la nueva) y `NOTIFY_EMAIL`. Opcional: `ALLOWED_ORIGINS` si usas dominio propio.
3. **Subir el sitio nuevo** (`armys-home-and-more.zip`) a Netlify.
4. **Avisar a quien administra el proyecto** para aplicar la fase 2: desplegar `security/notify-order/index.ts` con `verify_jwt` activado y ejecutar `security/phase2.sql`. Hasta entonces el sitio nuevo funciona, pero los correos de aviso no se envían.
5. **Activar la protección contra contraseñas filtradas:** Supabase → Authentication → Sign In / Providers → Password (requiere plan Pro).
6. **Activar verificación de correo** en Authentication y definir en Auth → Rate limits los límites de registro e inicio de sesión. Considera CAPTCHA (Cloudflare Turnstile).
7. **Activar 2FA** en las cuentas de Supabase, Netlify, Resend y GitHub.
8. **Copias de seguridad:** confirmar la política de backups del plan de Supabase; probar una restauración al menos una vez al año.

## 3. Procedimientos mínimos

- **Control de acceso (A.5.15, A.5.18):** el rol `admin` se asigna en la base, nunca desde la web. Revisar la lista de administradores cada trimestre: `select id, name, role from profiles where role = 'admin';`.
- **Cambios (A.8.32):** toda modificación de base de datos pasa por una migración versionada; el sitio se publica desde este repositorio con revisión previa.
- **Registros (A.8.15):** consultar `private.audit_log` desde el editor SQL de Supabase; revisar los registros de Auth y de Edge Functions cuando haya incidentes.
- **Incidentes (A.5.24 a A.5.26):** (1) contener: revocar sesiones y rotar llaves; (2) evaluar: qué datos y qué usuarios; (3) corregir; (4) avisar a las personas afectadas si hubo datos personales; (5) registrar lo aprendido.
- **Datos personales (A.5.34):** se guardan nombre, teléfono, correo y dirección de envío. Conservar solo el tiempo necesario y atender solicitudes de acceso o borrado.
- **Proveedores (A.5.19 a A.5.22):** Supabase, Netlify y Resend procesan datos; revisar sus condiciones y certificaciones cada año.

## 4. Riesgos residuales

- La CSP mantiene `'unsafe-inline'` para scripts porque la página usa manejadores `onclick` en línea. Mitigado con el escapado de todo dato dinámico; conviene refactorizar a `addEventListener` para quitarlo.
- El correo del administrador inicial está fijado en el disparador de alta de usuario. Solo aplica al registrar esa cuenta; conviene asignar el rol a mano y quitar la condición.
- Un solo administrador: definir una segunda persona de respaldo.
