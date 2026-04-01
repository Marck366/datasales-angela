import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.MODE === 'development') {
  console.log('🚀 DatâSales Inicializando en modo:', import.meta.env.MODE);
  console.log('📡 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'OK' : 'MISSING');
  console.log('🔑 Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'OK' : 'MISSING');
  console.log('🔍 Diagnóstico 648: Verificando entorno de ejecución...');
}

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error('❌ Error crítico en el montaje de React:', error);
}
