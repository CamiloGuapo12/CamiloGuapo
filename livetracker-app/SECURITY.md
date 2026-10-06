# Revisión de seguridad — LiveTracker (6 oct 2026)

## Ya corregido en este código
| Gravedad | Problema | Arreglo |
|---|---|---|
| Alta | XSS almacenado: nombres, notas, descripciones, usernames, avatar y nombre de equipo se insertaban con `innerHTML` sin escapar. Un creador podía ejecutar JS en la sesión de su manager o del admin. | `esc()` / `escJs()` aplicados a esos campos; pruebas en `tests/security.spec.ts`. |
| Media | supabase-js cargado de un CDN con versión flotante (`@2`) y sin SRI. | Incluido en `vendor/supabase.js` (v2.117.2). |
| Media | Sin CSP ni cabeceras de seguridad. | CSP en `index.html` + `_headers` (HSTS, nosniff, frame-ancestors, etc.). |
| Media | `ai-coach` aceptaba la `anon key` pública (el JWT es válido), así que cualquiera podía gastar tu cuota de Gemini. | Verifica la sesión real contra Supabase Auth, limita tamaños, valida tipo de imagen, key de Gemini por cabecera y errores genéricos. |
| Baja | Íconos del manifest en base64; service worker cacheaba terceros. | Íconos reales; el SW solo cachea el mismo origen. |

## Aplicado en Supabase (6 oct 2026)
Probado en la base de datos: un usuario no admin ya no puede hacerse admin.
1. Trigger `protect_profile_privileges`: solo un admin puede cambiar `is_admin`.
2. `kick_from_team` y `set_co_manager` rechazan llamadas sin sesión; `anon` ya no puede ejecutarlas.
3. `rls_auto_enable` y `handle_new_user` ya no se pueden invocar por `/rest/v1/rpc`.
4. `ai-coach` v11 desplegada: exige sesión real, no solo la anon key.
Los avisos que quedan en el linter son esperados: `is_admin`, `is_current_user_admin` y `is_team_manager_of` solo devuelven datos del propio usuario, y `kick_from_team` y `set_co_manager` deben poder llamarlas usuarios con sesión.

## Pendiente por decidir (no lo toqué)
- **`teams_select_all` (USING true):** cualquiera, incluso sin cuenta, puede listar todos los equipos con su `invite_code`. Lo ideal es un RPC `join_team(code)` y restringir el SELECT; requiere cambiar el flujo de unirse a un equipo.
- **Tablas `church_*`:** políticas `public_read_write` con `true`: cualquiera con la anon key puede crear, editar y borrar eventos, roles y asignaciones. Es de otra app del mismo proyecto; hay que decidir cómo autenticarla.
- **Protección contra contraseñas filtradas** desactivada en Supabase Auth (Authentication → Policies).
- **Clave de Gemini propia en el navegador:** el frontend en vivo usa `ai-coach` primero, pero conserva un respaldo donde el usuario puede pegar su propia key de Gemini, guardada en `localStorage`. Si ya no la necesitas, conviene quitar ese respaldo.
- El bucket `avatars` es público (esperable) con límite de 2 MB y solo jpeg/png/webp: correcto.
- La sincronización de TikTok pasa por `api.allorigins.win` (tercero); el resultado ya se escapa, pero ese proxy ve los usernames consultados.
- El export CSV no neutraliza fórmulas (`=`, `+`, `-`, `@`) al inicio de las notas.
