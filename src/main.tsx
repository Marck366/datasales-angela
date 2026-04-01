console.log('🚀 DatâSales: Iniciando diagnóstico de arranque...');
console.log('📡 Entorno:', import.meta.env.MODE);
console.log('🔑 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('🔑 Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'DEFINED' : 'UNDEFINED');

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
