// Edge Function notify-order (endurecida). Despliegue: supabase functions deploy notify-order (verify_jwt = true)
// Secretos requeridos: RESEND_API_KEY, NOTIFY_EMAIL. Opcional: ALLOWED_ORIGINS (separados por coma).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://armys-home-and-more.netlify.app').split(',').map((s) => s.trim());

const corsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
};

Deno.serve(async (req: Request) => {
  const h = corsHeaders(req);
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: h });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return reply(405, { error: 'Método no permitido' });

  const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
  const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL');
  if (!RESEND_KEY || !NOTIFY_EMAIL) return reply(500, { error: 'Servicio no configurado' });

  // 1) Autenticación: solo usuarios con sesión (no basta la llave anónima)
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user) return reply(401, { error: 'No autorizado' });

  // 2) Entrada mínima: solo el id del pedido; los datos salen de la base (RLS: solo pedidos propios)
  let body: { order_id?: unknown };
  try { body = await req.json(); } catch { return reply(400, { error: 'Solicitud inválida' }); }
  const orderId = Number(body?.order_id);
  if (!Number.isInteger(orderId) || orderId <= 0) return reply(400, { error: 'Solicitud inválida' });

  const { data: o } = await userClient.from('orders').select('*, order_items(*)').eq('id', orderId).maybeSingle();
  if (!o) return reply(404, { error: 'Pedido no encontrado' });
  if (Date.now() - new Date(o.created_at).getTime() > 10 * 60 * 1000) return reply(410, { error: 'Pedido demasiado antiguo' });

  // 3) Un solo aviso por pedido (evita spam por repetición)
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: claimed } = await admin.from('orders')
    .update({ notified_at: new Date().toISOString() }).eq('id', orderId).is('notified_at', null).select('id');
  if (!claimed?.length) return reply(409, { error: 'Pedido ya notificado' });

  const rows = (o.order_items ?? []).map((i: any) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(i.product_name)}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">x${esc(i.quantity)}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">L ${esc((Number(i.price) * Number(i.quantity)).toLocaleString('es-HN'))}</td></tr>`).join('');

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<div style="background:#2d1450;padding:20px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#d4a5ee;margin:0;font-size:24px">Army's Home &amp; More</h1><p style="color:#c9a0dc;margin:4px 0 0">Nuevo pedido recibido</p></div>
<div style="padding:24px;background:#fff;border:1px solid #e0dae8"><h2 style="color:#2d1450;margin:0 0 16px">Pedido #${esc(o.id)}</h2>
<p><strong>Cliente:</strong> ${esc(o.user_name)}</p>
<p><strong>Total:</strong> <span style="color:#5a2d91;font-size:20px;font-weight:bold">L ${esc(Number(o.total).toLocaleString('es-HN'))}</span></p>
<table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f5ebfc"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Subtotal</th></tr>${rows}</table>
<h3 style="color:#2d1450;margin:20px 0 8px">Datos de envío</h3>
<p>${esc(o.ship_name)}<br>${esc(o.ship_phone)}<br>${esc(o.ship_email || 'N/A')}<br>${esc(o.ship_address)}, ${esc(o.ship_muni)}, ${esc(o.ship_dept)}<br>${esc(o.ship_type)}</p>
${o.ship_notes ? `<p><strong>Notas:</strong> ${esc(o.ship_notes)}</p>` : ''}</div></div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: "Army's Home & More <onboarding@resend.dev>",
      to: [NOTIFY_EMAIL],
      subject: `Nuevo pedido #${Number(o.id)} — L ${Number(o.total)}`,
      html,
    }),
  });
  if (!res.ok) {
    await admin.from('orders').update({ notified_at: null }).eq('id', orderId); // permitir reintento
    return reply(502, { error: 'No se pudo enviar el aviso' });
  }
  return reply(200, { success: true });
});
