#!/bin/bash

# --- DatâSales: Sync DB Utility ---
# Este script sincroniza las migraciones locales con el proyecto remoto de Supabase.

PROJECT_REF="REMOVED"

echo "💎 Sincronizando Base de Datos (Supabase)..."

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "⚠️  SUPABASE_ACCESS_TOKEN no encontrado en el entorno."
    echo "👉 Por favor, corre este comando antes:"
    echo "   export SUPABASE_ACCESS_TOKEN=<tu_token>"
    echo "   (Puedes obtener uno en: https://supabase.com/dashboard/account/tokens)"
    echo ""
    echo "Intentando push sin token (requerirá login previo o password)..."
fi

# Intentar push usando bun x para asegurar que usamos el binario correcto
/Users/marcos/.bun/bin/bun x supabase db push --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ ¡Base de Datos Sincronizada con Éxito!"
else
    echo "❌ Error al sincronizar. Es probable que necesites identificarte."
    echo "Comando sugerido: /Users/marcos/.bun/bin/bun x supabase link --project-ref $PROJECT_REF"
fi
