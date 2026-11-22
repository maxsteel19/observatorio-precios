// Edge Function · Alta de usuarios por el administrador.
// Comprueba en el servidor que quien llama sea un administrador activo y crea la cuenta con una
// contraseña temporal. La clave service_role solo existe aquí, nunca en la app.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { CORS, ROLES, esEmailValido, respuesta, texto } from '../_shared/validacion.ts';

function passwordTemporal() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return respuesta(405, { error: 'Método no permitido' });

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return respuesta(401, { error: 'Debes iniciar sesión' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Autenticación: el token debe ser una sesión válida.
  const { data: quien, error: errorToken } = await admin.auth.getUser(jwt);
  if (errorToken || !quien.user) return respuesta(401, { error: 'Sesión no válida o expirada' });

  // 2) Autorización: solo un administrador activo puede crear cuentas.
  const { data: perfil } = await admin.from('perfiles').select('rol, activo').eq('id', quien.user.id).maybeSingle();
  if (!perfil || perfil.rol !== 'admin' || !perfil.activo) {
    console.warn(JSON.stringify({ evento: 'alta_usuario_denegada', usuario: quien.user.id }));
    return respuesta(403, { error: 'Solo un administrador puede crear usuarios' });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return respuesta(400, { error: 'El cuerpo debe ser JSON' });
  }
  const nombre = texto(body.nombre, 2, 120);
  const email = esEmailValido(body.email) ? body.email.trim().toLowerCase() : null;
  const rol = ROLES.includes(body.rol as (typeof ROLES)[number]) ? (body.rol as string) : null;
  if (!nombre || !email || !rol) {
    return respuesta(400, {
      error: 'Revisa los datos',
      campos: {
        ...(nombre ? {} : { nombre: 'Ingresa un nombre' }),
        ...(email ? {} : { email: 'Email no válido' }),
        ...(rol ? {} : { rol: 'Rol no válido' }),
      },
    });
  }

  const password = passwordTemporal();
  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });
  if (errorAuth || !creado.user) {
    const yaExiste = errorAuth?.message?.toLowerCase().includes('already');
    return respuesta(yaExiste ? 409 : 500, { error: yaExiste ? 'Ya existe un usuario con ese email' : 'No se pudo crear la cuenta' });
  }

  const { error: errorPerfil } = await admin.from('perfiles').insert({ id: creado.user.id, nombre, email, rol, activo: true });
  if (errorPerfil) {
    await admin.auth.admin.deleteUser(creado.user.id);
    return respuesta(400, { error: 'La base de datos rechazó los datos', detalle: errorPerfil.message });
  }

  console.log(JSON.stringify({ evento: 'alta_usuario_ok', rol, por: quien.user.id }));
  return respuesta(201, { id: creado.user.id, passwordTemporal: password });
});
