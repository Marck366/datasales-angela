import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://datasales.angelaimpacteconomy.com',
  'https://datasales-angela-git-dev-marck366s-projects.vercel.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Health check — sin datos sensibles
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Validar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado', details: 'Falta encabezado de autorización.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Sesión inválida', details: 'Por favor, inicia sesión de nuevo.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Cargar API Key de Anthropic
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Configuración incompleta', 
        details: 'ANTHROPIC_API_KEY no encontrada en los secrets de Supabase.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { contact, activities } = await req.json();

    // Construir resumen del historial para el prompt
    const historial = activities
      .slice(0, 20)
      .map((a: any) => {
        const fecha = new Date(a.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        const autor = a.created_by_profile?.name ?? 'Comercial';
        if (a.type === 'estado') return `[${fecha}] ${autor}: Cambio de estado → ${a.new_value}${a.content ? ` (${a.content})` : ''}`;
        return `[${fecha}] ${autor} (${a.type}): ${a.content ?? ''}`;
      })
      .join('\n');

    const prompt = `Eres el asistente comercial de Ângela Impact Economy, consultora ESG española (B Corp, CSRD, huella de carbono).

DATOS DEL CONTACTO:
- Empresa: ${contact.company_name ?? 'desconocida'}
- Contacto: ${contact.first_name} ${contact.last_name}
- Estado actual: ${contact.status}
- Prioridad: ${contact.prioridad}
${contact.valor_potencial ? `- Valor potencial: ${contact.valor_potencial.toLocaleString('es-ES')} €` : ''}

HISTORIAL DE INTERACCIONES:
${historial || 'Sin interacciones registradas.'}

TAREA: Prepara al comercial para la próxima reunión/contacto. Responde con exactamente 3 secciones usando títulos en negrita:

**📋 Contexto rápido** (2 frases sobre dónde estamos con este cliente)
**🎯 Objetivo de este contacto** (1 frase concreta sobre qué conseguir hoy)
**💬 Preguntas clave** (2-3 preguntas concretas adaptadas al momento del proceso y contexto ESG)

Sé directo, práctico y breve.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', response.status, JSON.stringify(data));
      return new Response(JSON.stringify({
        error: 'Error al generar el brief. Inténtalo de nuevo.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      summary: data.content[0].text
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Function error:', error.message);
    return new Response(JSON.stringify({
      error: 'Error interno. Inténtalo de nuevo.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
