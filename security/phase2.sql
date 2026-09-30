-- FASE 2 (aplicar DESPUES de publicar el sitio nuevo y configurar los secretos de la funcion)
-- A.8.26 / A.8.28: el cliente ya no inserta pedidos directamente; solo place_order() (precios y stock del servidor).
alter table public.orders add column if not exists notified_at timestamptz;
drop policy if exists orders_insert on public.orders;
drop policy if exists order_items_insert on public.order_items;
revoke insert on public.orders, public.order_items from authenticated;
