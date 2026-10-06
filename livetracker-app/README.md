# LiveTracker 🎯

App PWA para registrar y analizar ganancias de TikTok Live.

## Cómo publicar en Netlify (5 minutos, gratis)

### Opción A — Drag & Drop (más fácil)
1. Ve a https://app.netlify.com
2. Inicia sesión / crea cuenta gratuita
3. Arrastra la carpeta `livetracker-app` completa al área de deploy
4. ¡Listo! Netlify te da una URL tipo `https://nombre-random.netlify.app`

### Opción B — GitHub + Netlify (recomendado para actualizaciones)
1. Sube la carpeta a un repositorio de GitHub
2. En Netlify → "Add new site" → "Import from Git"
3. Conecta tu repo → Deploy

## Después de publicar

### Configurar Supabase para tu dominio
1. En Supabase → Authentication → URL Configuration
2. Agrega tu URL de Netlify en "Site URL"
3. Agrega también en "Redirect URLs"

### Instalar como app en el celular
- **Android**: Abre la URL en Chrome → menú ⋮ → "Agregar a pantalla de inicio"
- **iPhone**: Abre en Safari → compartir 📤 → "Agregar a pantalla de inicio"

## Stack
- Frontend: HTML/CSS/JS vanilla (PWA)
- Auth + DB: Supabase
- IA: Gemini (Edge Function `ai-coach`) y Claude para el escáner de capturas
- Conversión de divisas: open.er-api.com
