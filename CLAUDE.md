# DatâSales CRM: Guía para Agentes (Antigravity/Claude)

## 💎 Sincronización Backend-Frontend

Para evitar errores de base de datos (`42703: column not found`), sigue este flujo de trabajo:

### 1. Modificación de Esquema
Si necesitas un campo nuevo (ej. `lost_reason`), añade **SIEMPRE** un archivo `.sql` en `supabase/migrations/` ANTES de modificar el frontend.

### 2. Comandos de Sincronización
- **Verificar Estado**: `bun run db:verify`
  - Comprueba si las columnas esperadas por el frontend existen en la DB real.
- **Empujar Cambios**: `npm run db:push` o `./scripts/sync-db.sh`
  - Sincroniza las migraciones locales con el remoto. Requiere `SUPABASE_ACCESS_TOKEN`.

## 🛠️ Stack Tecnológico
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Componentes**: shadcn/ui + Framer Motion (para animaciones premium)
- **Backend**: Supabase (Auth, DB y Storage)
- **Gestor**: Bun (usar `/Users/marcos/.bun/bin/bun`)

## 🎨 Estándares de Diseño
- Estética: **Glassmorphism Premium** (usar clase `.glass` y `backdrop-blur`).
- Colores: #03A7E1 (Cerulean), #0284C7 (Sky), #0C2139 (Navy).
- Tipografía: Heading en Black/Bold para jerarquías.
