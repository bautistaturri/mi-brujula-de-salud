-- ============================================================
-- MI BRÚJULA DE SALUD - Schema inicial
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: users (perfil extendido de auth.users)
-- ============================================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nombre text not null,
  role text not null check (role in ('paciente', 'facilitador')),
  avatar_url text,
  onboarding_completado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;

create policy "Los usuarios pueden ver su propio perfil"
  on public.users for select
  using (auth.uid() = id);

create policy "Los usuarios pueden actualizar su propio perfil"
  on public.users for update
  using (auth.uid() = id);

create policy "Los usuarios pueden insertar su propio perfil"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================================
-- TABLA: conductas_ancla (comportamientos diarios configurables)
-- ============================================================
create table public.conductas_ancla (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  nombre text not null,
  icono text not null default '✓',
  orden smallint not null default 0,
  activa boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.conductas_ancla enable row level security;

create policy "Usuarios ven sus propias conductas"
  on public.conductas_ancla for all
  using (auth.uid() = user_id);

-- Conductas por defecto (función llamada en onboarding)
create or replace function public.crear_conductas_default(p_user_id uuid)
returns void as $$
begin
  insert into public.conductas_ancla (user_id, nombre, icono, orden) values
    (p_user_id, 'Me hidraté correctamente', '💧', 0),
    (p_user_id, 'Hice actividad física', '🏃', 1),
    (p_user_id, 'Dormí bien (7-8 hrs)', '😴', 2),
    (p_user_id, 'Comí saludable', '🥗', 3),
    (p_user_id, 'Tomé mi medicación', '💊', 4);
end;
$$ language plpgsql security definer;

-- ============================================================
-- TABLA: checkins (registro diario del paciente)
-- ============================================================
create table public.checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  fecha date not null default current_date,
  -- Conductas completadas (array de IDs de conductas_ancla)
  conductas_completadas uuid[] default '{}',
  -- IEM: Índice de Energía Motivacional (1-7)
  iem smallint not null check (iem between 1 and 7),
  -- Emoción: emoji seleccionado
  emocion text not null check (emocion in ('😄', '🙂', '😐', '😔', '😰')),
  -- Semáforo calculado
  semaforo text not null check (semaforo in ('verde', 'amarillo', 'rojo')),
  -- Notas opcionales
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Un check-in por día por usuario
  unique(user_id, fecha)
);

-- RLS
alter table public.checkins enable row level security;

create policy "Pacientes ven sus propios checkins"
  on public.checkins for select
  using (auth.uid() = user_id);

create policy "Pacientes crean sus propios checkins"
  on public.checkins for insert
  with check (auth.uid() = user_id);

create policy "Pacientes actualizan sus propios checkins del día"
  on public.checkins for update
  using (auth.uid() = user_id and fecha = current_date);

-- Índices
create index checkins_user_fecha_idx on public.checkins(user_id, fecha desc);
create index checkins_semaforo_idx on public.checkins(semaforo, fecha desc);

-- ============================================================
-- TABLA: grupos
-- ============================================================
create table public.grupos (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  descripcion text,
  facilitador_id uuid references public.users(id) on delete cascade not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.grupos enable row level security;

create policy "Facilitadores ven y gestionan sus grupos"
  on public.grupos for all
  using (auth.uid() = facilitador_id);

-- ============================================================
-- TABLA: grupo_miembros
-- ============================================================
create table public.grupo_miembros (
  grupo_id uuid references public.grupos(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  fecha_ingreso date default current_date,
  activo boolean default true,
  primary key (grupo_id, user_id)
);

-- RLS
alter table public.grupo_miembros enable row level security;

create policy "Facilitadores gestionan miembros de sus grupos"
  on public.grupo_miembros for all
  using (
    exists (
      select 1 from public.grupos
      where id = public.grupo_miembros.grupo_id
        and facilitador_id = auth.uid()
    )
  );

create policy "Pacientes ven su propia membresía"
  on public.grupo_miembros for select
  using (auth.uid() = user_id);

-- Policies que requieren grupo_miembros (agregadas después de crear la tabla)
create policy "Los facilitadores pueden ver sus pacientes"
  on public.users for select
  using (
    exists (
      select 1 from public.grupo_miembros gm
      join public.grupos g on g.id = gm.grupo_id
      where gm.user_id = public.users.id
        and g.facilitador_id = auth.uid()
    )
  );

create policy "Facilitadores ven checkins de sus pacientes"
  on public.checkins for select
  using (
    exists (
      select 1 from public.grupo_miembros gm
      join public.grupos g on g.id = gm.grupo_id
      where gm.user_id = public.checkins.user_id
        and g.facilitador_id = auth.uid()
    )
  );

create policy "Pacientes ven los grupos a los que pertenecen"
  on public.grupos for select
  using (
    exists (
      select 1 from public.grupo_miembros
      where grupo_id = public.grupos.id
        and user_id = auth.uid()
    )
  );

-- ============================================================
-- TABLA: alertas
-- ============================================================
create table public.alertas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tipo text not null check (tipo in ('ausencia', 'iem_bajo', 'semaforo_rojo', 'racha_rota', 'riesgo_alto')),
  descripcion text not null,
  fecha date not null default current_date,
  resuelta boolean default false,
  resuelta_at timestamptz,
  resuelta_por uuid references public.users(id),
  prioridad text not null check (prioridad in ('urgente', 'observacion')) default 'observacion',
  created_at timestamptz default now()
);

-- RLS
alter table public.alertas enable row level security;

create policy "Facilitadores ven alertas de sus pacientes"
  on public.alertas for all
  using (
    exists (
      select 1 from public.grupo_miembros gm
      join public.grupos g on g.id = gm.grupo_id
      where gm.user_id = public.alertas.user_id
        and g.facilitador_id = auth.uid()
    )
  );

create policy "Pacientes ven sus propias alertas"
  on public.alertas for select
  using (auth.uid() = user_id);

-- Índices
create index alertas_user_resuelta_idx on public.alertas(user_id, resuelta, fecha desc);
create index alertas_prioridad_idx on public.alertas(prioridad, resuelta, fecha desc);

-- ============================================================
-- FUNCIÓN: Calcular semáforo automáticamente
-- ============================================================
create or replace function public.calcular_semaforo(
  p_iem smallint,
  p_conductas_completadas int
) returns text as $$
begin
  -- Verde: IEM >= 5 y 4-5 conductas completadas
  if p_iem >= 5 and p_conductas_completadas >= 4 then
    return 'verde';
  -- Rojo: IEM <= 2 o 0-1 conductas completadas
  elsif p_iem <= 2 or p_conductas_completadas <= 1 then
    return 'rojo';
  -- Amarillo: todo lo demás
  else
    return 'amarillo';
  end if;
end;
$$ language plpgsql immutable;

-- ============================================================
-- FUNCIÓN: Calcular score de riesgo de un paciente (0-100)
-- ============================================================
create or replace function public.calcular_score_riesgo(p_user_id uuid)
returns int as $$
declare
  v_score int := 0;
  v_dias_sin_registro int;
  v_iem_promedio numeric;
  v_dias_rojo int;
  v_dias_periodo int := 7;
begin
  -- Días sin registro en los últimos 7 días
  select (v_dias_periodo - count(*))
  into v_dias_sin_registro
  from public.checkins
  where user_id = p_user_id
    and fecha >= current_date - v_dias_periodo;

  -- Promedio de IEM en los últimos 7 días
  select coalesce(avg(iem), 0)
  into v_iem_promedio
  from public.checkins
  where user_id = p_user_id
    and fecha >= current_date - v_dias_periodo;

  -- Días en rojo en los últimos 7 días
  select count(*)
  into v_dias_rojo
  from public.checkins
  where user_id = p_user_id
    and fecha >= current_date - v_dias_periodo
    and semaforo = 'rojo';

  -- Calcular score
  v_score := v_score + (v_dias_sin_registro * 10); -- hasta 70 pts

  if v_iem_promedio < 3 then
    v_score := v_score + 20;
  elsif v_iem_promedio < 4 then
    v_score := v_score + 10;
  end if;

  v_score := v_score + (v_dias_rojo * 5); -- hasta 35 pts

  return least(v_score, 100);
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN: Calcular racha de días consecutivos
-- ============================================================
create or replace function public.calcular_racha(p_user_id uuid)
returns int as $$
declare
  v_racha int := 0;
  v_fecha date := current_date;
  v_tiene_checkin boolean;
begin
  loop
    select exists(
      select 1 from public.checkins
      where user_id = p_user_id and fecha = v_fecha
    ) into v_tiene_checkin;

    exit when not v_tiene_checkin;

    v_racha := v_racha + 1;
    v_fecha := v_fecha - 1;
  end loop;

  return v_racha;
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN: Generar alertas automáticas (cron o trigger)
-- ============================================================
create or replace function public.generar_alertas_automaticas()
returns void as $$
declare
  v_user record;
begin
  -- Alerta por 2+ días sin registro
  for v_user in
    select distinct gm.user_id
    from public.grupo_miembros gm
    join public.grupos g on g.id = gm.grupo_id
    where gm.activo = true
  loop
    -- Si no registró ayer ni antes de ayer
    if not exists (
      select 1 from public.checkins
      where user_id = v_user.user_id
        and fecha >= current_date - 2
    ) then
      -- Solo crear si no existe alerta reciente no resuelta
      if not exists (
        select 1 from public.alertas
        where user_id = v_user.user_id
          and tipo = 'ausencia'
          and resuelta = false
          and fecha >= current_date - 3
      ) then
        insert into public.alertas (user_id, tipo, descripcion, prioridad)
        values (
          v_user.user_id,
          'ausencia',
          'Sin registro por 2 o más días consecutivos',
          'urgente'
        );
      end if;
    end if;

    -- Alerta por IEM bajo (promedio últimos 3 días < 3)
    if (
      select coalesce(avg(iem), 0) from public.checkins
      where user_id = v_user.user_id
        and fecha >= current_date - 3
    ) < 3 then
      if not exists (
        select 1 from public.alertas
        where user_id = v_user.user_id
          and tipo = 'iem_bajo'
          and resuelta = false
          and fecha >= current_date - 3
      ) then
        insert into public.alertas (user_id, tipo, descripcion, prioridad)
        values (
          v_user.user_id,
          'iem_bajo',
          'IEM promedio por debajo de 3 en los últimos 3 días',
          'urgente'
        );
      end if;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- ============================================================
-- TRIGGER: Auto-crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'paciente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-actualizar updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger checkins_updated_at
  before update on public.checkins
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER: Generar alerta cuando semáforo = rojo
-- ============================================================
create or replace function public.handle_checkin_alerta()
returns trigger as $$
begin
  if new.semaforo = 'rojo' then
    -- Evitar duplicados del mismo día
    if not exists (
      select 1 from public.alertas
      where user_id = new.user_id
        and tipo = 'semaforo_rojo'
        and fecha = new.fecha
    ) then
      insert into public.alertas (user_id, tipo, descripcion, prioridad, fecha)
      values (
        new.user_id,
        'semaforo_rojo',
        'Semáforo en ROJO: IEM ' || new.iem || '/7, emoción ' || new.emocion,
        'urgente',
        new.fecha
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger checkin_alerta_rojo
  after insert or update on public.checkins
  for each row execute procedure public.handle_checkin_alerta();

-- ============================================================
-- VISTA: Estado actual de pacientes (para facilitadores)
-- ============================================================
create or replace view public.vista_estado_pacientes as
select
  u.id,
  u.nombre,
  u.email,
  u.avatar_url,
  c.fecha as ultimo_checkin,
  c.iem,
  c.emocion,
  c.semaforo,
  array_length(c.conductas_completadas, 1) as conductas_completadas,
  public.calcular_racha(u.id) as racha_actual,
  public.calcular_score_riesgo(u.id) as score_riesgo,
  (select count(*) from public.alertas a
   where a.user_id = u.id and a.resuelta = false) as alertas_pendientes,
  gm.grupo_id
from public.users u
left join public.checkins c on c.user_id = u.id and c.fecha = current_date
join public.grupo_miembros gm on gm.user_id = u.id
where u.role = 'paciente';

-- Permisos sobre la vista
grant select on public.vista_estado_pacientes to authenticated;
