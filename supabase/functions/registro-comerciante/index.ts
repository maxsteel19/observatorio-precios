// Edge Function · Registro de comerciante.
// Crea la cuenta en Supabase Auth (inactiva) y la solicitud que el administrador debe aprobar.
// Es pública (sin sesión), por eso valida todo en el servidor antes de escribir.
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  CORS,
  TIPOS_COMERCIO,
  esEmailValido,
  esRutValido,
  formatearRut,
  respuesta,
  texto,
  type ErroresCampos,
} from '../_shared/validacion.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return respuesta(405, { error: 'Método no permitido' });

  const inicio = Date.now();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return respuesta(400, { error: 'El cuerpo debe ser JSON' });
  }

  const errores: ErroresCampos = {};
  const nombre = texto(body.nombre, 2, 120);
  const comercio = texto(body.comercio, 2, 120);
  const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const email = esEmailValido(body.email) ? body.email.trim().toLowerCase() : null;

  if (!nombre) errores.nombre = 'Ingresa tu nombre (2 a 120 caracteres)';
  if (!email) errores.email = 'Email no válido';
  if (!esRutValido(body.rut)) errores.rut = 'RUT no válido (revisa el dígito verificador)';
  if (password.length < 8 || password.length > 72) errores.password = 'La contraseña debe tener entre 8 y 72 caracteres';
  if (!comercio) errores.comercio = 'Ingresa el nombre del comercio';
  if (!esRutValido(body.rutEmpresa)) errores.rutEmpresa = 'RUT de la empresa no válido';
  if (!TIPOS_COMERCIO.includes(body.tipo as (typeof TIPOS_COMERCIO)[number])) errores.tipo = 'Tipo de comercio no válido';
  if (!/^\+?[0-9 ]{8,16}$/.test(telefono)) errores.telefono = 'Teléfono no válido';

  if (Object.keys(errores).length > 0) {
    console.warn(JSON.stringify({ evento: 'registro_rechazado', campos: Object.keys(errores) }));
    return respuesta(400, { error: 'Revisa los datos del formulario', campos: errores });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: email!,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  });
  if (errorAuth || !creado.user) {
    const yaExiste = errorAuth?.message?.toLowerCase().includes('already');
    console.warn(JSON.stringify({ evento: 'registro_error_auth', mensaje: errorAuth?.message }));
    return respuesta(yaExiste ? 409 : 500, {
      error: yaExiste ? 'Ya existe una cuenta con ese email' : 'No se pudo crear la cuenta',
    });
  }
  const userId = creado.user.id;

  const { error: errorPerfil } = await admin
    .from('perfiles')
    .insert({ id: userId, nombre, email, rol: 'comerciante', activo: false });

  const { data: solicitud, error: errorSolicitud } = errorPerfil
    ? { data: null, error: errorPerfil }
    : await admin
        .from('solicitudes_comerciante')
        .insert({
          usuario_id: userId,
          comercio,
          rut_empresa: formatearRut(body.rutEmpresa as string),
          tipo: body.tipo,
          telefono,
          nombre,
          email,
          rut: formatearRut(body.rut as string),
        })
        .select('id')
        .single();

  if (errorSolicitud || !solicitud) {
    // Compensación: si falla el perfil o la solicitud, no deja una cuenta huérfana.
    await admin.auth.admin.deleteUser(userId);
    console.error(JSON.stringify({ evento: 'registro_error_bd', mensaje: errorSolicitud?.message, codigo: errorSolicitud?.code }));
    const duplicado = errorSolicitud?.code === '23505';
    return respuesta(duplicado ? 409 : 400, {
      error: duplicado ? 'El comercio o la cuenta ya están registrados' : 'La base de datos rechazó los datos',
      detalle: errorSolicitud?.message,
    });
  }

  console.log(JSON.stringify({ evento: 'registro_ok', solicitud: solicitud.id, duracion_ms: Date.now() - inicio }));
  return respuesta(201, { id: solicitud.id });
});
