console.log('🚀 DatâSales: Iniciando diagnóstico de arranque...');
console.log('📡 Entorno:', import.meta.env.MODE);
console.log('🔑 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'DEFINED' : 'UNDEFINED');
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "REMOVED";
console.log('🔑 Supabase Key Check:', key ? `DEFINED (${key.substring(0, 5)}...)` : 'UNDEFINED');

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("No se encontró el elemento raíz 'root'");
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('❌ Error crítico en el montaje de DatâSales:', error);
}
