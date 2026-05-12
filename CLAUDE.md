# DatâSales CRM: Manual de ADN y Guía de Ingeniería (Premium)

Este archivo es la fuente de verdad estratégica y técnica. **Cualquier desarrollo debe alinearse con estos estándares.**

---

## 💎 Visión y Estética del Proyecto

CRM Premium diseñado para la economía de impacto (ESG). La estética debe ser **limpia, sofisticada y tecnológica (Apple-style)**, evitando cualquier rastro de diseño "genérico".

### Estándar "Glassmorphism Pro"
- **Fondo de Paneles**: Luz: `bg-white/95` + `backdrop-blur-3xl`. Oscuro: `bg-[#001a2d]/98` + `backdrop-blur-3xl`.
- **Componentes**: Usar clases `.glass-panel` y `.glass-input`. Bordes finos (`border-white/20` o `border-navy/5`).
- **Luminosidad**: Añadir gradientes sutiles (`bg-gradient-to-b from-white/50 to-transparent`) para volumen.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui + Framer Motion |
| Estado / Cache | TanStack React Query v5 |
| HTTP Client | Axios (`src/lib/api.ts`) |
| Backend | FastAPI (Python 3.9+) en `backend/` |
| Base de datos | MySQL — hosted en Nettrim (`database.nettrim.es:33306`) |
| ORM | SQLAlchemy 2.0 async + Alembic |
| Auth | JWT con python-jose + bcrypt (`JWT_EXPIRE_HOURS=24`) |
| IA | Anthropic Claude API |
| Gestor | Bun — usar `/Users/marcos/.bun/bin/bun` |

> **Supabase fue eliminado completamente.** No usar `@supabase/supabase-js` ni importar desde `src/integrations/supabase/`.

---

## ⚙️ Arquitectura Backend-Frontend

### Flujo de datos
```
React (src/) → axios (src/lib/api.ts) → FastAPI (backend/) → MySQL
```

### Arrancar en local
```bash
# Frontend
bun run dev              # → http://localhost:5173

# Backend (en otra terminal)
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000   # → http://localhost:8000
```

### Modificar el esquema de base de datos
Si necesitas un campo nuevo, sigue este orden estrictamente para evitar errores `column not found`:

1. **Crear migración Alembic** en `backend/alembic/versions/`
2. **Actualizar el modelo SQLAlchemy** en `backend/models/`
3. **Actualizar el schema Pydantic** en `backend/schemas/` (ojo con `max_length`)
4. **Actualizar el tipo TypeScript** en `src/types/` y `src/lib/api.ts`
5. **Aplicar la migración**: `alembic upgrade head` desde `backend/`

> ⚠️ Los `max_length` en Pydantic deben ser consistentes con los valores reales en DB. Un `max_length` demasiado corto causa HTTP 500 al serializar la respuesta (el error aparece como CORS en el navegador).

### Autenticación
- El token JWT se guarda en cookie `HttpOnly`; el cliente solo lee `datasales_csrf`
- El interceptor de axios en `src/lib/api.ts` lo inyecta en cada petición
- En 401, el interceptor limpia el token y redirige a `/login`
- `useAuth` valida el token llamando a `/auth/me` al inicializar

---

## 🧠 Motor de Alertas (Atención Crítica)

1. **Reunión sin Seguimiento**: 10 días tras fecha agendada sin cambio de estado.
2. **Propuesta Estancada**: 14 días tras envío/entrega de propuesta sin actividad.
3. **Inactividad General**: 21 días sin ninguna actualización.
4. **Consistencia**: Sincronizar siempre `Index.tsx` y `DashboardPage.tsx`.

---

## 🔐 Roles y Permisos

| Rol | Acceso |
|---|---|
| `admin` | Total — gestión de usuarios, eliminar contactos |
| `jefe_ventas` | Ve todos los contactos del equipo (elevado) |
| `comercial` | Solo sus contactos asignados (`assigned_to = user.id`) |

La lógica de permisos vive en `backend/dependencies/permissions.py`. En el frontend, `useAuth` expone `profile.role`.

---

## ✨ Principios de Interacción (UX)

- **Framer Motion**: Obligatorio para todas las transiciones (`AnimatePresence` en modales y drawers).
- **Efecto "Surge"**: Animaciones desde el origen del botón (`scale: 0.8 → 1`, `y: 20 → 0`).
- **Feedback Vivo**: Hover effects y escalados sutiles al interactuar.
- **React Query**: Invalidar siempre con `invalidateContactCaches(qc)` tras mutaciones, nunca hacer refetch manual.

---

## 📂 Módulos Clave

| Ruta | Responsabilidad |
|---|---|
| `src/lib/api.ts` | Cliente axios, tipos de la API, todos los endpoints |
| `src/hooks/useContacts.ts` | CRUD de contactos + mapeo API → tipo interno |
| `src/hooks/useAuth.tsx` | Sesión JWT, perfil de usuario |
| `src/components/contacts/` | Tarjetas, modales, drawers de gestión de clientes |
| `src/components/contacts/MailSmartDrawer.tsx` | Redacción asistida por IA |
| `src/pages/DashboardPage.tsx` | Centro de mando táctico (Comité) |
| `src/index.css` | Tokens de diseño y utilidades glass |
| `backend/routers/` | Endpoints FastAPI por dominio |
| `backend/schemas/contact.py` | Schema Pydantic de contactos (validación entrada/salida) |

---

## 🌿 Flujo de Ramas

```
main          ← producción (protegida)
  └── develop ← staging / revisión
        └── feature/nombre  ← trabajo individual
```

Siempre abrir PR a `develop`. Nunca pushear directo a `main`.
