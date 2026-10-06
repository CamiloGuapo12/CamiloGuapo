# Revisión de seguridad — LiveTracker (6 oct 2026)

## Ya corregido en este código
| Gravedad | Problema | Arreglo |
|---|---|---|
| Alta | XSS almacenado: nombres, notas, descripciones, usernames, avatar y nombre de equipo se insertaban con `innerHTML` sin escapar. Un creador podía ejecutar JS en la sesión de su manager o del admin. | `esc()` / `escJs()` aplicados a esos campos; pruebas en `tests/security.spec.ts`. |
| Media | supabase-js cargado de un CDN con versión flotante (`@2`) y sin SRI. | Incluido en `vendor/supabase.js` (v2.117.2). |
| Media | Sin CSP ni cabeceras de seguridad. | CSP en `index.html` + `_headers` (HSTS, nosniff, frame-ancestors, etc.). |
| Media | `ai-coach` aceptaba la `anon key` pública (el JWT es válido), así que cualquiera podía gastar tu cuota de Gemini. | Verifica la sesión real contra Supabase Auth, limita tamaños, valida tipo de imagen, key de Gemini por cabecera y errores genéricos. |
| Baja | Íconos del manifest en base64; service worker cacheaba terceros. | Íconos reales; el SW solo cachea el mismo origen. |

## Pendiente de aplicar en Supabase (no se aplicó nada en producción)
Todo está en `supabase/migrations/20261006000000_security_hardening.sql`.
1. **Crítico:** cualquier usuario puede hacerse admin con `update profiles set is_admin = true` sobre su propia fila (`profiles_update` no restringe columnas). Un admin lee los lives y pagos de todos. El SQL agrega un trigger que lo impide.
2. **Alto:** `kick_from_team` puede ejecutarse sin sesión y saca a cualquiera de su equipo (la validación evalúa a NULL). Corregido en el SQL y con `REVOKE` a `anon`.
3. `rls_auto_enable` y `handle_new_user` no deben ser invocables por `/rest/v1/rpc`.
4. Desplegar la nueva `ai-coach`: `supabase functions deploy ai-coach`.

## Pendiente por decidir (no lo toqué)
- **`teams_select_all` (USING true):** cualquiera, incluso sin cuenta, puede listar todos los equipos con su `invite_code`. Lo ideal es un RPC `join_team(code)` y restringir el SELECT; requiere cambiar el flujo de unirse a un equipo.
- **Tablas `church_*`:** políticas `public_read_write` con `true`: cualquiera con la anon key puede crear, editar y borrar eventos, roles y asignaciones. Es de otra app del mismo proyecto; hay que decidir cómo autenticarla.
- **Protección contra contraseñas filtradas** desactivada en Supabase Auth (Authentication → Policies).
- **Clave de Gemini propia en el navegador:** el frontend en vivo usa `ai-coach` primero, pero conserva un respaldo donde el usuario puede pegar su propia key de Gemini, guardada en `localStorage`. Si ya no la necesitas, conviene quitar ese respaldo.
- El bucket `avatars` es público (esperable) con límite de 2 MB y solo jpeg/png/webp: correcto.
- La sincronización de TikTok pasa por `api.allorigins.win` (tercero); el resultado ya se escapa, pero ese proxy ve los usernames consultados.
- El export CSV no neutraliza fórmulas (`=`, `+`, `-`, `@`) al inicio de las notas.
