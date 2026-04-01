# DatâSales CRM

CRM PWA para equipos comerciales del sector ESG. Desarrollado para **Ângela Impact Economy**, consultora especializada en B Corp, CSRD, Huella de Carbono y ESG Reporting.

**Filosofía:** _Fricción Cero_ — 90% del tiempo con clientes, 10% registrando.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + Framer Motion |
| Componentes | shadcn/ui (Radix UI) |
| Routing | React Router v6 |
| Estado / Cache | TanStack React Query v5 |
| Formularios | React Hook Form + Zod |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (WebSocket) |
| Edge Functions | Deno (Supabase) |
| IA | Anthropic Claude API (claude-haiku-4-5) |
| 3D (login) | Three.js + React Three Fiber |
| Gráficos | Recharts |
| Gestor de paquetes | Bun |

---

## Funcionalidades online y operativas

### Autenticación y roles

- Login con email y contraseña vía Supabase Auth
- Tres roles con permisos diferenciados mediante Row Level Security (RLS):
  - `comercial` — ve y gestiona sus propios contactos
  - `jefe_ventas` — visibilidad completa del equipo
  - `admin` — acceso total + utilidades de administración
- Perfil de usuario editable (nombre, avatar con color personalizable)
- Sesión persistente con refresco automático de token

---

### Gestión de contactos

**Lista de contactos (`/`)**
- Visualización en tarjetas expandibles con animaciones spring (Framer Motion)
- Filtros por estado del pipeline, prioridad y tipo de contacto
- Búsqueda por nombre, empresa y contenido de notas
- Ordenación por lead score (algoritmo propio)
- Botón "Requieren atención" — filtra contactos con seguimiento vencido >3 días, sin contacto >21 días o estancados en agendado >28 días
- Vista de equipo para jefe_ventas / admin
- Añadir nuevo contacto desde drawer deslizante

**Estados del pipeline**
```
nuevo → agendado → cerrado
              ↘ perdido
              ↘ pospuesto
```

**Tarjeta de contacto (expandible)**
- Nombre, empresa, estado, prioridad (punto de color), valor potencial, lead score
- Al expandir: acciones rápidas (llamar, WhatsApp, email, agendar), alerta si hay seguimiento vencido o inactividad
- Navegación directa a la ficha completa
- Botón "Añadir nota" inline

**Ficha de cliente (`/contact/:id`)**
- Datos completos: nombre, empresa, cargo, teléfono, email, LinkedIn
- Valor potencial (€) + probabilidad de cierre (%) + fecha estimada de cierre
- Campos ESG: servicio de interés, estado de certificación, tamaño de empresa, decisor confirmado
- Campo "Próximo paso" — acción pendiente con el contacto
- Estado en el pipeline con días transcurridos y alertas de estancamiento
- Motivo de pérdida cuando aplica (badge visible en ficha)
- Acciones: editar, cambiar estado, agendar reunión, registrar interacción, preparar reunión con IA
- Timeline completo de actividades con separadores de silencio ("⏳ X días sin contacto") cuando el gap entre actividades es ≥ 7 días

---

### Registro de actividades

Tipos de actividad soportados:
- `nota` — anotación libre
- `llamada` — llamada telefónica
- `email` — correo electrónico
- `whatsapp` — mensaje de WhatsApp
- `reunion` — reunión presencial, telemática o videoconferencia
- `estado` — cambio de estado en el pipeline (generado automáticamente)

Automatizaciones en base de datos:
- `last_activity_at` — se actualiza automáticamente vía trigger cuando se registra una interacción real (llamada, email, WhatsApp, reunión)
- `status_changed_at` — se actualiza automáticamente vía trigger cuando cambia el estado del contacto

Input por voz disponible en todos los campos de texto libre (Web Speech API).

---

### Modales de cambio de estado

**Marcar como perdido (`PerdidoModal`)**
- Selección del motivo de pérdida entre 5 opciones predefinidas: Precio, Competencia, Timing, Sin interés, Sin respuesta
- Campo de notas adicionales (con voz)
- Guarda el motivo en `lost_reason` + crea actividad de tipo `estado`

**Posponer contacto (`PospuestoModal`)**
- Selección de fecha de seguimiento (date picker)
- Actualiza `seguimiento_date` en el contacto

**Agendar reunión (`AgendarModal`)**
- Fecha, tipo de reunión (presencial / telemática / llamada / videoconferencia)
- Notas de preparación
- Actualiza `scheduled_date` y `meeting_type`

---

### Preparación de reunión con IA

Edge Function `preparar-reunion` (Deno + Claude API):
- Se activa desde la ficha del contacto con el botón "Preparar reunión"
- Genera automáticamente al abrirse (sin clic adicional)
- Envía al modelo: nombre, empresa, estado, historial de actividades, servicio de interés, notas previas
- Devuelve tres secciones:
  1. **Contexto rápido** — quién es el cliente y dónde estamos
  2. **Objetivo** — qué queremos conseguir en esta reunión
  3. **Preguntas clave** — preguntas adaptadas al contexto ESG
- Botón "Regenerar" para obtener una nueva versión
- Modelo: `claude-haiku-4-5-20251001`

---

### Lead Scoring

Dos algoritmos de puntuación propios (`src/lib/scoring.ts`):

**`calcContactScore(contact)`** — solo con datos del contacto (usado en lista, sin queries extra)
- Base: 50 puntos
- Bonus por prioridad: +20 alta / -15 baja
- Bonus por valor potencial
- Bonus por estado en pipeline (cerrado = techo, agendado = premium)
- Bonus por seguimiento vigente
- Bonus por perfil ESG completo (servicio, certificación, tamaño, decisor)
- Rango: 0–100 → etiquetas hot / warm / cold con colores

**`calcFullScore(contact, activities)`** — con historial completo (usado en ficha detalle)
- Incluye ponderación por tipo de interacción: reunión=10pts, llamada=6, WhatsApp=4, email=2
- Detección de momentum: actividad reciente (últimos 30 días) vs anterior
- Penalización por inactividad prolongada
- Bonus máximo por interacciones: +25 pts

---

### Página de notas (`/notes`)

- Dos tabs: **Clientes** (agrupado por contacto con StatusBadge) y **Feed** (cronológico por día)
- Filtro por tipo: Todas / Reuniones / Llamadas / Notas / Cambios
- Filtro por período: Esta semana / Este mes / Todo
- Búsqueda en tiempo real: busca en nombre de contacto, empresa y contenido de la actividad
- Resultados con contenido coincidente resaltados con borde azul
- QuickNote inline con input de voz
- Navegación directa a la ficha del contacto desde cualquier entrada

---

### Dashboard (`/dashboard`)

- Estadísticas en tiempo real: nuevos, agendados, cerrados, perdidos, pospuestos
- Previsión de ingresos:
  - Bruto: suma de valor_potencial de deals activos
  - **Ponderado**: suma de `valor_potencial × (probabilidad_cierre / 100)` — con probabilidades por defecto según estado cuando no hay valor manual
- Ranking de comerciales por deals cerrados y reuniones agendadas
- Tabla de contactos ordenable con todos los estados
- Próximas reuniones agendadas

---

### Calendario (`/calendar`)

- Vista de calendario con eventos y reuniones del equipo
- Integración con `scheduled_date` de los contactos

---

### Eventos ESG (`/events`)

- Listado de eventos del sector (ferias, conferencias B Corp, CSRD, etc.)
- Toggle de asistencia por evento
- Notas por evento

---

### Sincronización en tiempo real

- Suscripciones Supabase Realtime activas sobre las tablas `contacts`, `activities` y `events`
- Al detectar cambios remotos, invalida automáticamente las queries de React Query afectadas
- Sincronización entre pestañas y entre dispositivos del mismo equipo

---

## Base de datos

**Proyecto Supabase:** `REMOVED`

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuario vinculados a `auth.users` |
| `companies` | Empresas cliente |
| `contacts` | Contactos/leads con todos los campos del pipeline |
| `activities` | Historial de interacciones por contacto |
| `events` | Eventos ESG del sector |

### Campos destacados de `contacts`

```sql
-- Pipeline
status              TEXT        -- nuevo|agendado|cerrado|perdido|pospuesto
prioridad           TEXT        -- alta|media|baja
tipo                TEXT        -- Cliente|Prospecto|Partner
lost_reason         TEXT        -- Precio|Competencia|Timing|Sin interés|Sin respuesta
status_changed_at   TIMESTAMPTZ -- auto-actualizado por trigger

-- Tracking
seguimiento_date    DATE        -- fecha de próximo seguimiento
last_activity_at    TIMESTAMPTZ -- auto-actualizado por trigger
next_step           TEXT        -- próxima acción pendiente

-- Previsión
valor_potencial     NUMERIC
probabilidad_cierre INTEGER     -- 0-100
fecha_cierre_probable DATE

-- ESG
servicio_interes    TEXT        -- B Corp|CSRD|Huella Carbono|ESG Reporting|Otro
estado_certificacion TEXT
empleados_empresa   TEXT        -- tramos de tamaño
decision_maker      BOOLEAN
```

### Migraciones aplicadas

| Archivo | Contenido |
|---------|-----------|
| `20260314_*` | Esquema inicial: tablas, RLS, triggers, realtime |
| `20260328000000` | Renombrado nevera → pospuesto + actualización de RPC |
| `20260328100000` | Sprint 1: lost_reason, status_changed_at, last_activity_at + triggers |
| `20260328200000` | Sprint 3: campos ESG + previsión (probabilidad, fecha cierre) |
| `20260329110000` | Sprint 4: next_step, score_ai |

---

## Edge Functions

### `preparar-reunion`
```
POST /functions/v1/preparar-reunion
Body: { contact, activities, profile }
Returns: { brief: string }
Requiere: ANTHROPIC_API_KEY en secrets de Supabase
```

### `create-test-users`
```
POST /functions/v1/create-test-users
Uso exclusivo admin: resetea contraseñas de todos los usuarios a "Datasales2026"
```

---

## Desarrollo local

```bash
# Instalar dependencias
bun install

# Arrancar en desarrollo
bun run dev
# → http://localhost:8080

# Verificar sincronización con la DB
bun run db:verify

# Empujar migraciones a producción
bun run db:push

# Deploy de Edge Function
bun x supabase functions deploy preparar-reunion --project-ref REMOVED

# Configurar secrets de la función
bun x supabase secrets set ANTHROPIC_API_KEY=sk-...
```

### Variables de entorno (`.env`)

```env
VITE_SUPABASE_URL=https://REMOVED.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=REMOVED
```

---

## Estructura del proyecto

```
src/
├── pages/
│   ├── Index.tsx              # Lista de contactos + filtros
│   ├── ClientDetailPage.tsx   # Ficha completa del contacto
│   ├── DashboardPage.tsx      # Métricas y pipeline
│   ├── NotesPage.tsx          # Feed de actividades
│   ├── CalendarPage.tsx       # Calendario de reuniones
│   ├── EventsPage.tsx         # Eventos ESG del sector
│   ├── ProfilePage.tsx        # Perfil de usuario
│   └── LoginPage.tsx          # Autenticación
├── components/
│   ├── contacts/              # Tarjetas, modales, drawers
│   └── ui/                    # shadcn/ui (52+ componentes)
├── hooks/
│   ├── useContacts.ts         # CRUD de contactos
│   ├── useActivities.ts       # Actividades
│   ├── useAuth.tsx            # Sesión y perfil
│   ├── useRealtimeSync.ts     # Suscripciones Supabase
│   ├── useEvents.ts           # Eventos ESG
│   └── useProfiles.ts         # Perfiles del equipo
├── lib/
│   ├── scoring.ts             # Algoritmo de lead scoring
│   └── utils.ts
└── types/index.ts             # Tipos TypeScript

supabase/
├── functions/
│   ├── preparar-reunion/      # IA con Claude API
│   └── create-test-users/     # Utilidad admin
└── migrations/                # 14 migraciones aplicadas
```

---

## Diseño

- Estética **Glassmorphism Premium**: tarjetas con `backdrop-blur`, bordes sutiles, profundidad sin peso
- Colores principales: Cerulean `#03A7E1`, Sky `#0284C7`, Navy `#0C2139`
- Animaciones con spring physics (Framer Motion)
- Iconografía: Lucide Icons (trazo fino)
- Modo claro y oscuro (next-themes)
- PWA: instalable en móvil, optimizado para uso en movilidad

---

_DatâSales — Datos con propósito. Ventas con impacto._
