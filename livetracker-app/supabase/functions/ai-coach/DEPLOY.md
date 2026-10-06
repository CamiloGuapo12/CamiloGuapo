# 🚀 Guía de deployment — Edge Function `ai-coach`

Esta Edge Function es la que permite que TODOS los usuarios (admin, managers, creadores) usen la IA Coach sin tener su propia API key de Gemini. Tu key vive como un **secreto del servidor** de Supabase, nunca toca ningún navegador.

---

## 📋 Requisitos previos

- Tener `npm` o `npx` instalado
- Tener acceso a la consola de Supabase de este proyecto (como admin/owner)
- Tener tu API key de Gemini a la mano (la que ya tenías en `localStorage`)

---

## 🛠 Paso 1 — Instalar Supabase CLI

Abre una terminal en la carpeta del proyecto (donde está `index.html`) y corre:

```bash
npm install -g supabase
```

O si no quieres instalarlo globalmente:

```bash
npx supabase --help
```

(cámbialo en los comandos de abajo: `supabase X` → `npx supabase X`)

---

## 🔑 Paso 2 — Login y link al proyecto

```bash
supabase login
```

Te abrirá el navegador para que apruebes el acceso. Luego:

```bash
supabase link --project-ref <TU_PROJECT_REF>
```

Tu `project_ref` es la parte que viene en tu URL de Supabase: `https://<PROJECT_REF>.supabase.co`. O lo puedes copiar desde **Settings → General → Reference ID** en la consola de Supabase.

---

## 🔐 Paso 3 — Guardar la API key como secreto del servidor

```bash
supabase secrets set GEMINI_API_KEY=TU_KEY_DE_GEMINI_AQUI
```

Reemplaza `TU_KEY_DE_GEMINI_AQUI` con tu key real (la que empieza con `AIza...` o `AQ...`).

**Verifica que se guardó:**

```bash
supabase secrets list
```

Deberías ver `GEMINI_API_KEY` en la lista. El valor aparece como `****` por seguridad.

---

## 🚢 Paso 4 — Desplegar la Edge Function

Desde la carpeta raíz del proyecto (donde está la carpeta `supabase/`):

```bash
supabase functions deploy ai-coach
```

Si todo sale bien verás algo como:

```
Deployed Function ai-coach on project <tu-proyecto>
Function URL: https://<PROJECT_REF>.supabase.co/functions/v1/ai-coach
```

---

## ✅ Paso 5 — Probar

1. Recarga tu app en `livetracker.netlify.app` (o donde la tengas desplegada)
2. Entra a la pestaña **IA Coach**
3. Tu vista como admin debe mostrar: **"✅ IA Coach activa para todo el equipo (servidor)"**
4. Haz una pregunta. Debe responder normalmente.
5. Cierra sesión y entra con una cuenta NO admin (o pide a un miembro del equipo que pruebe) — **ahora también puede usar la IA** sin configurar nada.

---

## 🔄 Cómo rotar la API key en el futuro

Si alguna vez necesitas cambiar tu key de Gemini (porque se filtró, expiró, o simplemente quieres rotarla):

```bash
supabase secrets set GEMINI_API_KEY=NUEVA_KEY
```

No necesitas re-desplegar la función — los secretos se actualizan en caliente.

---

## ❓ Troubleshooting

**"AI service not configured by admin" (503)**
→ No configuraste el secreto `GEMINI_API_KEY` correctamente. Verifica con `supabase secrets list`.

**"Invalid or expired session" (401)**
→ El usuario no está autenticado en la app. Dile que cierre sesión y vuelva a entrar.

**"All models failed" (502)**
→ La API de Gemini está caída o tu key se quedó sin cuota. Verifica en https://aistudio.google.com/

**"Method not allowed" (405)**
→ Alguien está haciendo GET en lugar de POST. Normal si visitas la URL directo en el browser.

**La función no responde desde la app**
→ Revisa los logs: `supabase functions logs ai-coach --tail`

---

## 🛡 ¿Qué tan seguro es esto?

- ✅ Tu `GEMINI_API_KEY` vive como variable de entorno del servidor de Supabase — **nunca** se envía a ningún navegador
- ✅ Solo usuarios con sesión real en tu app pueden invocar la función (la función consulta a Supabase Auth; la anon key pública NO basta)
- ✅ Los clientes solo reciben la respuesta de texto de la IA, nunca la key
- ✅ Si mañana se filtra el código del frontend al público, tu key sigue a salvo

La única forma en que alguien use tu cuota de Gemini es si se crea una cuenta en tu app (lo cual ya está controlado por tu flujo de signup).
