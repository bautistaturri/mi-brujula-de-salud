-- Fix: crear_conductas_default ahora verifica si el usuario ya tiene conductas
-- antes de insertar, evitando duplicados si se llama más de una vez.
create or replace function public.crear_conductas_default(p_user_id uuid)
returns void as $$
begin
  if not exists (
    select 1 from public.conductas_ancla where user_id = p_user_id
  ) then
    insert into public.conductas_ancla (user_id, nombre, icono, orden) values
      (p_user_id, 'Me hidraté correctamente', '💧', 0),
      (p_user_id, 'Hice actividad física', '🏃', 1),
      (p_user_id, 'Dormí bien (7-8 hrs)', '😴', 2),
      (p_user_id, 'Comí saludable', '🥗', 3),
      (p_user_id, 'Tomé mi medicación', '💊', 4);
  end if;
end;
$$ language plpgsql security definer;
