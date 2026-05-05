# DatâSales CRM

CRM premium para la economía de impacto (ESG), diseñado para equipos comerciales de **Ângela Impact Economy**. Filosofía _Fricción Cero_ — 90% del tiempo con clientes, 10% registrando.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui + Framer Motion |
| Estado / Cache | TanStack React Query v5 |
| Routing | React Router v6 |
| Formularios | React Hook Form + Zod |
| HTTP Client | Axios |
| Backend | FastAPI (Python 3.9+) |
| Base de datos | MySQL (hosted en Nettrim) |
| ORM | SQLAlchemy 2.0 async + Alembic |
| Auth | JWT — python-jose + bcrypt |
| IA | Anthropic Claude API |
| Gestor paquetes | Bun (frontend) / pip + venv (backend) |

---

## Estructura del Proyecto

```
datasales-angela/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── contacts/             # Módulo principal de clientes
│   │   ├── layout/               # AppLayout, navegación
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/                    # useContacts, useAuth, useEvents…
│   ├── lib/
│   │   └── api.ts                # Cliente axios → FastAPI
│   ├── pages/                    # Index, DashboardPage, LoginPage…
│   └── types/                    # Tipos TypeScript globales
├── backend/                      # API FastAPI
│   ├── routers/                  # auth, contacts, companies, events, dashboard, ai
│   ├── models/                   # SQLAlchemy ORM (User, Contact, Company…)
│   ├── schemas/                  # Pydantic I/O schemas
│   ├── dependencies/             # Auth JWT, permisos por rol
│   ├── alembic/                  # Migraciones de base de datos
│   ├── main.py                   # Entry point FastAPI
│   ├── config.py                 # Settings desde .env
│   └── requirements.txt
├── .env.example                  # Variables de entorno requeridas
└── CLAUDE.md                     # Guía de ingeniería del proyecto
```

---

## Puesta en Marcha Local

### Requisitos previos

- **Bun** ≥ 1.0 — [bun.sh](https://bun.sh)
- **Python** 3.9+
- Acceso a MySQL (credenciales en `.env` — pedir a Marcos)

---

### 1. Clonar y configurar variables

```bash
git clone https://github.com/Marck366/datasales-angela.git
cd datasales-angela
git checkout develop

cp .env.example .env
# Editar .env con las credenciales reales (pedir a Marcos)
```

---

### 2. Frontend

```bash
bun install
bun run dev
# → http://localhost:5173
```

---

### 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → Swagger UI: http://localhost:8000/docs
```

---

## Variables de Entorno

Copia `.env.example` a `.env` en la raíz del proyecto y rellena los valores:

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL del backend (`http://localhost:8000`) |
| `DB_HOST` | Host MySQL |
| `DB_PORT` | Puerto MySQL (por defecto 3306) |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario MySQL |
| `DB_PASSWORD` | Contraseña MySQL |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `JWT_EXPIRE_HOURS` | Duración del token (recomendado: 24) |
| `ANTHROPIC_API_KEY` | API Key de Claude para funciones de IA |
| `ALLOWED_ORIGINS` | CORS origins permitidos (separados por coma) |

---

## API Endpoints

Documentación interactiva completa en `http://localhost:8000/docs`.

| Endpoint | Descripción |
|---|---|
| `POST /auth/login` | Login → devuelve JWT |
| `GET /auth/me` | Perfil del usuario autenticado |
| `GET /auth/users` | Listar usuarios del equipo (admin) |
| `POST /auth/users` | Crear usuario (admin) |
| `GET /contacts/` | Listar contactos (filtro por `assigned_to`, `company_id`) |
| `POST /contacts/` | Crear contacto |
| `PATCH /contacts/{id}` | Actualizar contacto |
| `DELETE /contacts/{id}` | Eliminar contacto (admin) |
| `GET /companies/` | Listar empresas |
| `POST /companies/` | Crear empresa |
| `GET /activities/` | Listar actividades (filtro por `contact_id`) |
| `POST /activities/` | Registrar actividad |
| `GET /events/` | Listar eventos de networking |
| `POST /events/` | Crear evento |
| `GET /dashboard/stats` | KPIs globales del pipeline |
| `GET /dashboard/ranking` | Ranking de comerciales |
| `POST /ai/preparar-reunion` | Briefing IA pre-reunión (Claude) |

---

## Roles y Permisos

| Rol | Permisos |
|---|---|
| `admin` | Acceso total, gestión de usuarios, eliminación de contactos |
| `jefe_ventas` | Ve todos los contactos del equipo, no puede eliminar |
| `comercial` | Solo ve y gestiona sus propios contactos asignados |

---

## Funcionalidades Principales

### Gestión de Contactos
- Lista con tarjetas expandibles, filtros por estado/prioridad/tipo y búsqueda en tiempo real
- Sub-contactos por empresa con contacto principal marcado (`is_primary`)
- Pipeline visual: `nuevo → agendado → propuesta → cerrado / perdido / aplazado`
- Lead scoring automático (0–100) con etiquetas hot / warm / cold

### Actividades y Timeline
- Registro de notas, llamadas, emails, WhatsApp y reuniones
- Timeline por contacto con separadores de silencio (gaps ≥ 7 días)
- Input por voz en todos los campos de texto libre

### Dashboard (Comité)
- KPIs en tiempo real: nuevos, agendados, propuestas, cerrados
- Previsión de ingresos ponderada por probabilidad de cierre
- Ranking de comerciales
- Alertas de motor: reuniones sin seguimiento, propuestas estancadas, inactividad general

### IA — Preparar Reunión
- Briefing automático pre-reunión con contexto del cliente
- Generado por Claude con: historial de actividades, estado del pipeline, campos ESG
- Devuelve: contexto rápido, objetivo de la reunión y preguntas clave

---

## Flujo de Ramas

```
main          ← producción (protegida, requiere PR aprobado)
  └── develop ← staging y revisión de equipo
        └── feature/nombre-feature  ← trabajo individual
```

1. Crear rama `feature/` desde `develop`
2. PR → `develop` para revisión
3. Validado `develop` → PR → `main` para producción

---

## Diseño

- **Glassmorphism Premium**: `backdrop-blur`, bordes `white/20`, gradientes sutiles
- Paleta: Cerulean `#03A7E1` · Sky `#0284C7` · Navy `#0C2139`
- Animaciones spring con Framer Motion (`AnimatePresence` en todos los modales)
- Modo claro y oscuro (next-themes)
- Optimizado para uso en movilidad (PWA-ready)

---

## Contacto

Proyecto interno de [Ângela Impact Economy](https://angelaimpacteconomy.com).
Dudas técnicas → **Marcos** · marcosmihalea@angelaie.com

---

_DatâSales — Datos con propósito. Ventas con impacto._
