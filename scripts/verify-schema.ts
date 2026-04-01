import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Usamos la key pública por defecto

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY no están en el .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REQUIRED_COLUMNS = [
  { table: 'contacts', column: 'lost_reason', type: 'text' },
  { table: 'contacts', column: 'status_changed_at', type: 'timestamp with time zone' },
  { table: 'contacts', column: 'last_activity_at', type: 'timestamp with time zone' }
];

async function verify() {
  console.log('🔍 Verificando integridad del esquema en Supabase...');

  // Intentamos obtener una fila para ver si las columnas existen
  // Nota: Si RLS lo permite, esto fallará si la columna no existe en la consulta
  const { data, error } = await supabase
    .from('contacts')
    .select('id, lost_reason, status_changed_at, last_activity_at')
    .limit(1);

  if (error) {
    if (error.message.includes('column') || error.code === '42703') {
      console.error('\n🚨 DESINCRONIZACIÓN DETECTADA');
      console.error('-------------------------------------------');
      console.error('Faltan columnas críticas en la tabla "contacts".');
      console.error('Esto indica que el backend no está al día con el código frontend.');
      console.error('\n🛠️  SOLUCIÓN:');
      console.error('Ejecuta: ./scripts/sync-db.sh');
      console.error('-------------------------------------------');
    } else {
      console.error('❌ Error al conectar con Supabase:', error.message);
    }
    process.exit(1);
  }

  console.log('✅ Esquema sincronizado. Todas las columnas esperadas están presentes.');
}

verify();
