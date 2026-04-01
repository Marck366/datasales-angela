import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  try {
    // Solo permite peticiones con la service role key como Bearer token
    const authHeader = req.headers.get('Authorization') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    const password = 'Datasales2026';

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const TEST_DOMAIN = '@test.com';
    const results = [];

    for (const user of users) {
      // SEC-004: Solo procesar usuarios con el dominio de prueba permitido
      if (!user.email?.endsWith(TEST_DOMAIN)) {
        console.log(`[SEC-004] Saltando usuario real: ${user.email}`);
        results.push({ email: user.email, status: 'ignored (non-test domain)' });
        continue;
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
      });
      results.push({ email: user.email, status: error ? 'error' : 'success' });
    }

    // No devolver la contraseña en la respuesta
    return new Response(
      JSON.stringify({ message: 'Passwords updated', count: results.length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
