# VARIABLES DE ENTORNO PARA PRODUCCIÓN — Mi Brújula de Salud

Estas son las variables necesarias para el deploy. **Nunca subir los valores al repositorio.**

---

## Variables requeridas

```bash
# Supabase — obtenidas en: Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# URL de la aplicación en producción
NEXT_PUBLIC_APP_URL=
```

---

## Dónde configurarlas

| Plataforma | Cómo |
|---|---|
| **Vercel** | Project Settings → Environment Variables |
| **Netlify** | Site Settings → Environment Variables |
| **Railway** | Service → Variables |

---

## Notas de seguridad

- `SUPABASE_SERVICE_ROLE_KEY` es sensible — solo debe estar disponible en el **servidor**, no en el cliente. En Next.js está correctamente usada solo en `src/lib/supabase/admin.ts`.
- `NEXT_PUBLIC_*` son variables públicas — visibles en el navegador. No poner información sensible en variables con ese prefijo.
- La `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública por diseño — la seguridad de los datos la garantiza RLS en Supabase, no la clave.

---

## Checklist antes del deploy

- [ ] Todas las variables configuradas en el proveedor de hosting
- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio real (no `localhost:3000`)
- [ ] `next.config.mjs` actualizado con `allowedOrigins: ["tu-dominio.com"]`
- [ ] Variables verificadas corriendo `npm run build` localmente con las vars de producción
