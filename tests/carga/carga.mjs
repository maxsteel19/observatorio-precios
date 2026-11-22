// Prueba de carga contra la API REST de Supabase (PostgREST), con autocannon.
// Simula a muchos vecinos consultando el comparador al mismo tiempo.
// Ejecutar: npm run test:carga   (opcional: CONEXIONES=20 DURACION=30)
import autocannon from 'autocannon';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL || !KEY) throw new Error('Faltan las variables de Supabase (.env.local)');

const CONEXIONES = Number(process.env.CONEXIONES ?? 20);
const DURACION = Number(process.env.DURACION ?? 30);

/** Criterios de aceptación (docs/plan-de-pruebas.md). autocannon no entrega p95: se usa p97,5, que es más exigente. */
const CRITERIOS = { p97_5MaxMs: 500, erroresMax: 0 };

const ESCENARIOS = [
  {
    nombre: 'Comparador: precio vigente de un producto en todas las sucursales',
    ruta: '/rest/v1/precios_vigentes?producto_id=eq.arroz&select=sucursal_id,precio,es_oferta,registrado_en',
  },
  {
    nombre: 'Historial: precios de un producto en una sucursal',
    ruta: '/rest/v1/precios?producto_id=eq.arroz&sucursal_id=eq.7&select=precio,registrado_en&order=registrado_en',
  },
  {
    nombre: 'Catálogo de productos activos',
    ruta: '/rest/v1/productos?select=id,nombre,unidad,categoria_id&order=nombre',
  },
];

function correr(escenario) {
  return new Promise((resolve, reject) => {
    const instancia = autocannon(
      {
        url: URL + escenario.ruta,
        connections: CONEXIONES,
        duration: DURACION,
        headers: { apikey: KEY, Accept: 'application/json' },
      },
      (err, res) => (err ? reject(err) : resolve(res)),
    );
    autocannon.track(instancia, { renderProgressBar: false, renderResultsTable: false });
  });
}

const resultados = [];
console.log(`Prueba de carga · ${CONEXIONES} conexiones concurrentes · ${DURACION} s por escenario · ${new Date().toISOString()}\n`);

for (const escenario of ESCENARIOS) {
  const r = await correr(escenario);
  const errores = r.errors + r.timeouts + r.non2xx;
  const fila = {
    escenario: escenario.nombre,
    solicitudes: r.requests.total,
    solicitudesPorSegundo: Math.round(r.requests.average),
    latenciaPromedioMs: Math.round(r.latency.average),
    p50Ms: r.latency.p50,
    p90Ms: r.latency.p90,
    p97_5Ms: r.latency.p97_5,
    p99Ms: r.latency.p99,
    maxMs: r.latency.max,
    errores,
    cumple: r.latency.p97_5 <= CRITERIOS.p97_5MaxMs && errores <= CRITERIOS.erroresMax,
  };
  resultados.push(fila);
  console.log(`■ ${fila.escenario}`);
  console.log(
    `  ${fila.solicitudes} solicitudes · ${fila.solicitudesPorSegundo} req/s · promedio ${fila.latenciaPromedioMs} ms · p50 ${fila.p50Ms} ms · p90 ${fila.p90Ms} ms · p97,5 ${fila.p97_5Ms} ms · p99 ${fila.p99Ms} ms · máx ${fila.maxMs} ms · errores ${fila.errores} → ${fila.cumple ? 'CUMPLE' : 'NO CUMPLE'}\n`,
  );
}

const reporte = {
  fecha: new Date().toISOString(),
  entorno: `Supabase (${URL.replace('https://', '')}), plan gratuito, región sa-east-1`,
  cliente: `Node ${process.version} · autocannon · ${CONEXIONES} conexiones · ${DURACION} s por escenario`,
  criterios: CRITERIOS,
  resultados,
};
mkdirSync('docs/evidencias', { recursive: true });
writeFileSync('docs/evidencias/reporte-carga.json', JSON.stringify(reporte, null, 2));
console.log('Reporte guardado en docs/evidencias/reporte-carga.json');
process.exit(resultados.every((r) => r.cumple) ? 0 : 1);
