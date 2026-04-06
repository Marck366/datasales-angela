# DatâSales CRM: Manual de ADN y Guía de Ingeniería (Premium)

Este archivo es la fuente de verdad estratégica y técnica. **Cualquier desarrollo debe alinearse con estos estándares.**

## 💎 Visión y Estética del Proyecto
CRM Premium diseñado para la economía de impacto (ESG). La estética debe ser **limpia, sofisticada y tecnológica (Apple-style)**, evitando cualquier rastro de diseño "genérico".

### Estándar "Glassmorphism Pro"
- **Fondo de Paneles**: Luz: `bg-white/95` + `backdrop-blur-3xl`. Oscuro: `bg-[#001a2d]/98` + `backdrop-blur-3xl`.
- **Componentes**: Usar clases `.glass-panel` y `.glass-input`. Bordes finos (`border-white/20` o `border-navy/5`).
- **Luminosidad**: Añadir gradientes sutiles (`bg-gradient-to-b from-white/50 to-transparent`) para volumen.

## 🧠 Motor de Alertas (Atención Crítica)
1. **Reunión sin Seguimiento**: 10 días tras fecha agendada sin cambio de estado.
2. **Propuesta Estancada**: 14 días tras envío/entrega de propuesta sin actividad.
3. **Inactividad General**: 21 días sin ninguna actualización.
4. **Consistencia**: Sincronizar siempre `Index.tsx` y `DashboardPage.tsx`.

## ⚙️ Sincronización Backend-Frontend (Crítico)
Para evitar errores de base de datos (`42703: column not found`), sigue este flujo estrictamente:

### 1. Modificación de Esquema
Si necesitas un campo nuevo (ej. `lost_reason`), añade **SIEMPRE** un archivo `.sql` en `supabase/migrations/` ANTES de modificar el frontend.

### 2. Comandos de Sincronización
- **Verificar Estado**: `bun run db:verify`
  - Comprueba si las columnas esperadas por el frontend existen en la DB real.
- **Empujar Cambios**: `npm run db:push` o `./scripts/sync-db.sh`
  - Sincroniza las migraciones locales con el remoto. Requiere `SUPABASE_ACCESS_TOKEN`.

## 🛠️ Stack Tecnológico Detallado
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Componentes**: shadcn/ui + Framer Motion (para animaciones premium)
- **Backend**: Supabase (Auth, DB y Storage)
- **Gestor**: Bun (usar `/Users/marcos/.bun/bin/bun`)

## ✨ Principios de Interacción (UX)
- **Framer Motion**: Obligatorio para todas las transiciones (use `AnimatePresence`).
- **Efecto "Surge"**: Animaciones desde el origen del botón (`scale: 0.8` -> `1`, `y: 20` -> `0`).
- **Feedback Vivo**: Hover effects y escalados sutiles al interactuar.

## 📂 Estructura de Módulos Clave
- `src/components/contacts/`: Gestión de clientes.
- `src/components/contacts/MailSmartDrawer.tsx`: Redacción asistida por IA.
- `src/pages/DashboardPage.tsx`: Centro de mando táctico (Comité).
- `src/index.css`: Definición de tokens y utilidades glass.
