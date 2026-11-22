# Observatorio de Precios PAC · Respuestas EV3

**Repositorio:** https://github.com/maxsteel19/observatorio-precios · **Versión:** 1.3.0 · **Base de datos:** Supabase `observatorio-precios-pac` (sa-east-1)

> Campos marcados con ✏️ los debe completar el equipo (nombres, enlaces finales).

---

## 1. Implementación

### a) Entorno de desarrollo y estructuras de la base de datos

**Entorno:** Windows 11 · Visual Studio Code (extensión Expo Tools) · Node.js 24 LTS · npm · Git · Expo SDK 58 (React Native 0.88, TypeScript estricto) · Supabase (PostgreSQL 17, Supabase Auth, Edge Functions en Deno). Pasos de instalación en el [README](../README.md#instalación-y-ejecución-local).

**Configuración de Supabase:** se creó el proyecto `observatorio-precios-pac` en la región São Paulo (la más cercana a Chile), plan gratuito. El esquema se aplicó con **7 migraciones SQL versionadas** y se cargaron los datos con `seed.sql`. La app se conecta con la URL del proyecto y la **clave publicable** (`sb_publishable_…`), que es pública por diseño: la seguridad la dan las políticas RLS. La clave `service_role` solo existe dentro de las Edge Functions.

**Tablas (11):** `perfiles`, `categorias`, `productos`, `comercios`, `sucursales`, `precios`, `capturas`, `reportes`, `solicitudes_comerciante`, `auditoria` y `eventos_app`, más la vista `precios_vigentes`.

**Relaciones:** `comercios 1─N sucursales`, `categorias 1─N productos`, `productos 1─N precios`, `sucursales 1─N precios`, `capturas 1─N precios`, `perfiles 1─N comercios` (dueño), `perfiles 1─1 auth.users`. Diagrama completo en [base-de-datos.md](base-de-datos.md#diagrama-de-relaciones).

**Restricciones:** claves foráneas en todas las relaciones; `CHECK` de precio (1 a 10.000.000), vigencia solo con oferta, coordenadas, teléfono y largo de textos; RUT validado en la base con la función `es_rut_valido()` (módulo 11); `UNIQUE` en email, RUT de empresa y (nombre, unidad) de producto; triggers que fijan autor y fecha del precio, protegen campos sensibles y escriben la auditoría.

**Extensiones:** `pg_trgm` (búsqueda aproximada), `unaccent` (búsqueda sin tildes) y `pgcrypto` (bcrypt para las cuentas de prueba).

**Cambios respecto de la EV2:** `comercios` se separó en `comercios` + `sucursales`; `usuarios` pasó a `perfiles` enlazada con Supabase Auth; se agregaron `categorias`, `capturas`, `reportes`, `solicitudes_comerciante` y `eventos_app`; `precios` pasó a ser un historial inmutable y el precio actual sale de la vista `precios_vigentes` ([detalle](base-de-datos.md#cambios-respecto-del-diseño-de-la-ev2)).

**Dónde está el SQL:** [`supabase/migrations/`](../supabase/migrations/) (100 extensiones y tipos → 200 tablas → 300 funciones y triggers → 400 RLS → 500 vistas e índices → 600 y 700 correcciones) y [`supabase/seed.sql`](../supabase/seed.sql).

### b) Datos de prueba e integridad referencial

**Datos cargados** (`supabase/seed.sql`, a partir de los datos de ejemplo de la app): 9 cuentas (admin, 2 fiscalizadores activos y 1 desactivado, 2 comerciantes, 3 comerciantes pendientes), 5 categorías, 14 productos, 7 comercios, 8 sucursales, **258 precios** (43 vigentes + ~30 días de historial), 6 capturas, 3 solicitudes pendientes y 7 registros de auditoría.

**Comprobación** (automatizada en [`tests/integracion/integridad.test.mjs`](../tests/integracion/integridad.test.mjs)):

| Prueba | Resultado |
|---|---|
| Precio con producto y sucursal válidos | `{"precio":1270, "productos":{"nombre":"Arroz grado 1"}, "sucursales":{"nombre_sucursal":"Sucursal Principal","comercios":{"nombre":"Minimarket El Sol"}}}` |
| Precio con producto inexistente | `23503 · insert or update on table "precios" violates foreign key constraint "precios_producto_id_fkey"` |
| Captura en sucursal inexistente | `23503 · insert or update on table "capturas" violates foreign key constraint "capturas_sucursal_id_fkey"` |
| Reporte de sucursal inexistente | `23503 · ... violates foreign key constraint "reportes_sucursal_id_fkey"` |
| Precio negativo, cero o > 10.000.000 | `23514 · violates check constraint "precios_precio_check"` |
| Captura con un producto inexistente entre varios | Se revierte toda la transacción: no quedan precios parciales |

Consulta para la captura en el SQL Editor:

```sql
select p.id, pr.nombre as producto, c.nombre as comercio, s.nombre_sucursal, p.precio, p.registrado_en
  from precios p
  join productos pr on pr.id = p.producto_id
  join sucursales s on s.id = p.sucursal_id
  join comercios c on c.id = s.comercio_id
 order by p.registrado_en desc limit 5;

insert into precios (producto_id, sucursal_id, precio, fuente) values ('no-existe', 1, 1000, 'fiscalizador');
-- ERROR: 23503: insert or update on table "precios" violates foreign key constraint "precios_producto_id_fkey"
```

---

## 2. Optimización y validación

### a) Optimización de consultas

Se optimizaron las consultas del **comparador** (precio vigente de un producto en cada sucursal) y del **historial** (evolución de un producto en una sucursal) con el índice compuesto `precios (producto_id, sucursal_id, registrado_en desc, id desc)`. Sin el índice, Postgres recorría la tabla completa y ordenaba el resultado; con él, salta directo a las filas del producto y ya vienen ordenadas.

Medición con **500.000 precios**, mismas consultas y mismos datos, mediana de 15 ejecuciones:

| Consulta | Antes | Después | Mejora |
|---|---|---|---|
| Comparador | 34,7 ms (Seq Scan + Sort) | 1,7 ms (Index Scan) | **20×** |
| Historial | 35,0 ms (Seq Scan + Sort) | 0,09 ms (Index Scan Backward) | **~400×** |

Planes de ejecución y condiciones en [rendimiento.md](rendimiento.md); script en [`supabase/pruebas/rendimiento_comparador.sql`](../supabase/pruebas/rendimiento_comparador.sql).

### b) Pruebas de carga y seguridad

**Carga** ([`tests/carga/carga.mjs`](../tests/carga/carga.mjs)): 20 conexiones concurrentes, 30 s por escenario, contra la API REST de Supabase (plan gratuito, São Paulo) desde Santiago. **15.848 solicitudes, 0 errores**, unas 176 req/s por escenario, p50 ≈ 106 ms y p97,5 entre 157 y 162 ms (criterio: ≤ 500 ms). Reporte en [`evidencias/reporte-carga.json`](evidencias/reporte-carga.json).

**Seguridad** ([`tests/integracion/seguridad.test.mjs`](../tests/integracion/seguridad.test.mjs), 18 casos, todos pasan):

| Comprobación | Esperado | Obtenido |
|---|---|---|
| Comerciante registra precio en **su** sucursal (7) | Permitido | Guardado |
| Comerciante registra precio en sucursal **ajena** (3) | Denegado | `42501 · new row violates row-level security policy for table "precios"` |
| Comerciante edita sucursal ajena | 0 filas | 0 filas, horario sin cambios |
| Comerciante se cambia el rol a admin | Sin efecto | Sigue siendo `comerciante` |
| Comerciante aprueba una solicitud | Denegado | `Solo un administrador puede aprobar solicitudes` |
| Ciudadano anónimo lee la auditoría | Denegado | `42501 · permission denied for table auditoria` |
| Fiscalizador **desactivado** registra una captura | Denegado | `new row violates row-level security policy for table "capturas"` |
| Comerciante llama a `admin-usuarios` | 403 | `403 · Solo un administrador puede crear usuarios` |

Además se ejecutó el **Security Advisor** de Supabase: detectó 16 advertencias que se corrigieron (ver [incidencias](incidencias.md#2-funciones-de-permisos-expuestas-en-la-api-security-advisor)).

---

## 3. Preparación del entorno de desarrollo

### a) IDE

**Editor:** Visual Studio Code con la extensión **Expo Tools** (recomendada en `.vscode/extensions.json`) y acciones al guardar (`.vscode/settings.json`: corregir con ESLint y ordenar imports).

**Herramientas:** Node.js LTS (probado con 24.22), npm, Git, Expo Go (SDK 58) en el celular, cuenta de Supabase y de Expo (EAS).

**Pasos:**

```bash
git clone https://github.com/maxsteel19/observatorio-precios.git
cd observatorio-precios
npm install
cp .env.example .env.local    # completar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx expo start                # w = navegador · QR = Expo Go
```

**Variables de entorno** (nombres; los valores van en `.env.local`, que no se sube): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_API_URL`, y solo servidor: `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `CHAT_PROVIDER`. Archivo de ejemplo: [`.env.example`](../.env.example).

### b) Control de versiones con Git

**Repositorio:** https://github.com/maxsteel19/observatorio-precios

**Forma de trabajo:** rama principal `master`; cada avance en commits descriptivos en español. Se sincroniza con GitHub Desktop. Los cambios grandes van en una rama y se integran con un *Pull Request* que revisa la otra persona del equipo.

Ejemplos de commits:
- `c3bfee0` App Observatorio de Precios PAC con Expo (versión inicial).
- `d8ab07f` Base de datos en Supabase: esquema, RLS, datos de prueba y Edge Functions.
- `9a2d8e8` App conectada a Supabase: capa de datos, login real, monitoreo y pruebas.

✏️ *Agregar uno o dos enlaces que muestren el aporte de cada integrante (por ejemplo, un commit de cada uno o un Pull Request revisado por la otra persona).*

---

## 4. Implementación del software

### a) Módulos y patrón de diseño

**Módulos implementados:**

| Módulo | Carpeta |
|---|---|
| Ciudadano: comparador, ficha del comercio, historial, reportes, bencinas, Tarjeta Vecina, especiales, asistente IA | `src/app/` (raíz) |
| Autenticación: login, registro de comerciante, cuenta pendiente | `src/app/auth/` |
| Fiscalizador: capturas OCR/manual, historial | `src/app/fiscalizador/` |
| Comerciante: precios, carga masiva, sucursales | `src/app/comerciante/` |
| Administrador: dashboard, catálogo, comercios, cuentas, usuarios, auditoría, monitoreo | `src/app/admin/` |
| Acceso a datos y servicios | `src/services/` |
| Base de datos y lógica en el servidor | `supabase/migrations/`, `supabase/functions/` |

**Patrón utilizado: MVC por capas** (más un backend como servicio):

- **Vista:** pantallas y componentes (`src/app/**`, `src/components/**`). No conocen la base de datos.
- **Controlador / lógica:** `src/state/AppState.tsx`, con las acciones (`savePrices`, `login`, `approveMerchant`…) y el estado compartido. Decide si usa Supabase o el modo demo.
- **Modelo / acceso a datos:** `src/services/repository.ts`, el único archivo que consulta Supabase. `mappers.ts` convierte filas de la base a tipos de la app y `database.types.ts` tipa las tablas, generado desde el esquema real.
- **Reglas en la base de datos:** RLS, CHECK, FK y triggers. Aunque un cliente se salte la app, la base aplica las reglas.

**Flujo concreto, registrar un precio:**
1. `src/app/comerciante/(tabs)/precio.tsx` valida el formulario (precio > 0, oferta menor que el precio normal, formato de fecha).
2. Llama a `useApp().savePrices(storeId, items, 'comerciante')` (`AppState.tsx`).
3. `repository.savePrices()` hace `insert` en `precios` y mide la duración (`logger.measure`).
4. En Postgres: el trigger fija `registrado_por`/`registrado_en`, RLS comprueba que la sucursal sea del comerciante y CHECK/FK validan los datos. El trigger de auditoría registra el cambio.
5. `AppState` recarga `precios_vigentes` y la vista ciudadana muestra el nuevo precio. Si algo falla, el mensaje de `friendlyError()` aparece bajo el formulario.

### b) Estándares de codificación

- **Tipado:** TypeScript en modo `strict` (`tsconfig.json`). Los tipos de las tablas se generan desde Supabase (`src/services/database.types.ts`). Se verifica con `npm run typecheck`.
- **Reglas de código:** ESLint con `eslint-config-expo` (`eslint.config.js`), incluidas las reglas de React Hooks y del React Compiler (por ejemplo, prohíbe leer `ref` durante el render y llamar `setState` dentro de un efecto). Se verifica con `npm run lint`.
- **Nombres:** componentes en PascalCase, funciones y variables en camelCase, tablas y columnas en español y snake_case, rutas en minúsculas (Expo Router).
- **Organización:** solo las pantallas viven en `src/app/`; componentes, lógica y servicios fuera. Una responsabilidad por archivo.
- **Manejo de errores:** las escrituras devuelven `string | null` (mensaje para la persona usuaria). `RepoError` conserva el código de Postgres. `friendlyError()` traduce `42501`, `23503`, `23514` y `23505`. Los errores se registran en `eventos_app`.
- **Formato:** acciones al guardar en VS Code (`.vscode/settings.json`).
- **Verificación conjunta:** `npm run verify` (typecheck + lint + pruebas unitarias). Resultado actual: 0 errores, 20/20 pruebas.

---

## 5. Consideraciones de seguridad

### a) Autenticación y autorización

**Inicio de sesión:**
- **Ciudadano:** no necesita cuenta (rol `anon`).
- **Fiscalizador, comerciante y administrador:** email y contraseña con **Supabase Auth**, que guarda las contraseñas con bcrypt y entrega un JWT. La app lee el rol desde `perfiles` y solo permite entrar si la cuenta está **activa**.
- **Comerciante nuevo:** se registra con la Edge Function `registro-comerciante`. Su cuenta queda inactiva hasta que un administrador la aprueba (RPC `aprobar_solicitud`).

**Dónde se controlan los permisos:**
1. **En la base de datos (control real):** políticas RLS en las 11 tablas ([`20261121000600_correccion_advisors.sql`](../supabase/migrations/20261121000600_correccion_advisors.sql)), con funciones `privado.es_admin()`, `privado.es_duenio_sucursal()`, etc.
2. **En las Edge Functions:** `admin-usuarios` comprueba el JWT y que el perfil sea admin activo.
3. **En la interfaz:** `Stack.Protected` en `src/app/_layout.tsx` muestra cada panel solo al rol correspondiente. Es solo comodidad: la protección está en la base.

**Comprobación:** permitido, el comerciante `comercio@demo.cl` registra un precio en su sucursal 7. Denegado, el mismo comerciante intenta registrar en la sucursal 3 (Supermercado PAC): `42501 · new row violates row-level security policy for table "precios"`. Al editar la sucursal ajena, RLS deja 0 filas afectadas.

### b) Datos sensibles

- **Comunicaciones:** todo va por **HTTPS/TLS** (Supabase y EAS Hosting solo aceptan HTTPS).
- **Credenciales:** las contraseñas las gestiona Supabase Auth (bcrypt) y nunca se guardan en la app ni en las tablas propias. La sesión se guarda en el almacenamiento del dispositivo (SQLite en el celular, `localStorage` en web). Las claves secretas (`service_role`, OpenAI, DeepSeek) solo existen en el servidor; `.env.local` está en `.gitignore`.
- **Datos personales:** RLS impide que un visitante lea perfiles, solicitudes (RUT, teléfono) o la auditoría. La URL de "cuenta pendiente" lleva solo el id, nunca el email.
- **Validación de entradas, en 3 capas:**
  1. Formularios de la app: RUT, email, precio, fechas, teléfono.
  2. **Servidor**: Edge Function `registro-comerciante`, que repite todas las reglas.
  3. **Base de datos**: CHECK, FK y `es_rut_valido()`.

**Ejemplo de dato inválido rechazado:**
- Registro con RUT `12.345.678-9`. La app muestra «RUT no válido (revisa el dígito verificador)» (`evidencias/07-rut-invalido.png`).
- Si se envía directo al servidor, la respuesta es `400 {"error":"Revisa los datos del formulario","campos":{"rut":"RUT no válido (revisa el dígito verificador)","rutEmpresa":"RUT de la empresa no válido"}}`.
- Un precio negativo enviado a la API devuelve `23514 · violates check constraint "precios_precio_check"`.

---

## 6. Preparación del entorno de producción

### a) Requisitos

- **Servicios:**
  - **Supabase**: PostgreSQL, Auth, Edge Functions y API REST.
  - **EAS Hosting**: versión web y ruta `/api/chat` del asistente.
  - **EAS Build**: APK/AAB de Android.
  - Opcional: OpenAI o DeepSeek para el asistente.
- **Herramientas para publicar:** Node.js LTS, npm, `eas-cli` (`npx eas-cli@latest`), Supabase CLI (`npx supabase`) o el SQL Editor.
- **Configuración:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `EXPO_PUBLIC_APP_ENV=produccion` (definidas por perfil en `eas.json`). `EXPO_PUBLIC_API_URL` para el APK. En el servidor: `OPENAI_API_KEY`/`DEEPSEEK_API_KEY` como variables de EAS.
- **Antes de producción real:**
  - Eliminar las cuentas demo del seed.
  - Activar la protección de contraseñas filtradas (plan Pro de Supabase).
  - Configurar un SMTP propio para correos de recuperación.

### b) Servidores, contenedores o nube

Se usan **servicios en la nube** (sin servidores propios ni Docker):

```
Celular (APK) / Navegador ──HTTPS──► EAS Hosting (web estática + /api/chat)
        │
        └──HTTPS (supabase-js, clave publicable + JWT)──► Supabase (sa-east-1)
                                                            ├─ API REST (PostgREST) → PostgreSQL con RLS
                                                            ├─ Auth (JWT)
                                                            └─ Edge Functions (Deno, service_role)
```

La app se conecta directamente a Supabase con la URL y la clave publicable; cada consulta lleva el JWT de la sesión y Postgres aplica RLS según el usuario. Instrucciones para reproducir: [README · Entornos y despliegue](../README.md#entornos-y-despliegue) y [base-de-datos.md · Cómo reproducir](base-de-datos.md#cómo-reproducir-la-base-de-datos).

---

## 7. Despliegue y pruebas en un entorno lo más real posible

### a) Despliegue inicial

- **Base de datos y backend:** desplegados en Supabase (`https://cygqzrdeofngskjwmrir.supabase.co`), con 7 migraciones aplicadas, datos de prueba y 2 Edge Functions activas (`registro-comerciante` v1, `admin-usuarios` v1).
- **App 1.3.0:**
  - Build de producción web generado con `npx expo export -p web` (`EXPO_PUBLIC_APP_ENV=produccion`), probado primero en local con `npx expo serve` contra la base real.
  - **Publicado en EAS Hosting el 22-11-2026** con `npx eas-cli@latest deploy`: **https://observatorio-pac--e3syd60fmo.expo.app** (despliegue de vista previa: tiene su propia URL y no reemplaza la versión anterior). Para dejarla como versión principal en `https://observatorio-pac.expo.app`: `npx eas-cli@latest deploy --prod`.
  - **Limitación conocida de la vista previa:** el asistente con IA responde `503` porque las claves de OpenAI/DeepSeek están guardadas en EAS como variables *secretas*, que EAS Hosting no puede leer. La versión principal actual sí las tiene. Antes de pasar la 1.3.0 a producción hay que poner las claves en `.env.local` (o cambiar su visibilidad en EAS a *sensitive*), volver a desplegar y comprobar que `POST /api/chat` responde `200`.
  - APK (opcional): `npx eas-cli@latest build -p android --profile preview` → enlace de descarga: ✏️
- **Cómo acceder:** abrir la URL web desde el navegador del computador o del celular. La pantalla de inicio muestra «Supabase · produccion · v1.3.0». Las cuentas de prueba están en el README.

### b) Monitoreo y logs

- **Registro de la app (`eventos_app`):** cada operación con el backend se mide (`src/services/logger.ts`): nivel, operación, duración en ms, plataforma, versión y mensaje de error. El administrador lo ve en **Panel → Monitoreo** (total, errores, promedio y p95). Ejemplos: `INFO registrar_precios_comerciante 181 ms` · `ERROR iniciar_sesion · El correo o la contraseña no coinciden` · `WARN cargar_datos_publicos 2876 ms · Operación lenta` (más de 1,5 s).
- **Auditoría (`auditoria`):** quién cambió qué y cuándo (Panel → Auditoría).
- **Logs del servidor (Supabase → Logs):**
  - Postgres: `new row violates row-level security policy for table "precios"`.
  - Edge Functions: `{"evento":"registro_rechazado","campos":["rut","rutEmpresa"]}`.
  - API: códigos HTTP y tiempos.
- **Advisors de Supabase:** seguridad y rendimiento.

### c) Validación en un entorno controlado

Después de desplegar la base y generar el build de producción se ejecutó el flujo completo con Playwright ([`tests/e2e/flujo-precio.spec.ts`](../tests/e2e/flujo-precio.spec.ts)):
1. El comerciante inicia sesión y ve su panel.
2. Registra Harina en su Sucursal Principal a **$860**, tras rechazarse primero una oferta mayor que el precio normal.
3. Aparece la confirmación «Harina guardado: $860».
4. En **otro navegador sin sesión**, el comparador muestra Minimarket El Sol a $860 con la etiqueta «Más barato».

Esto confirmó que la app, la autenticación, la base de datos y las políticas estaban operativas. Capturas `01` a `05` en [`evidencias/`](evidencias/).

Las mismas 4 pruebas E2E se repitieron **contra la URL publicada** (`E2E_BASE_URL=https://observatorio-pac--e3syd60fmo.expo.app npm run test:e2e`): **4/4 en 40,9 s**. Las capturas de `docs/evidencias/` corresponden a esa ejecución; la `08` muestra el entorno «Supabase · produccion · v1.3.0».

### d) Corrección de errores

Se corrigieron 5 incidencias ([incidencias.md](incidencias.md)). Ejemplo: en la prueba de integridad, un precio con producto inexistente devolvía «El producto no está activo» en vez del error de clave foránea. El trigger no distinguía «no existe» de «desactivado». Se cambió en la migración `20261121000700_trigger_precios_fk.sql` y al repetir la prueba el resultado es `23503 · violates foreign key constraint "precios_producto_id_fkey"`. Commit `9a2d8e8`.

---

## 8. Plan de pruebas y protocolos

Detalle completo en [plan-de-pruebas.md](plan-de-pruebas.md).

- **a) Casos de uso y escenarios críticos:** 9 flujos de la EV2 probables en la versión actual (comparador, historial, registrar precio, captura del fiscalizador, registro y aprobación de comerciantes, login por perfil, reportes, sucursales), cada uno con su caso normal y sus entradas límite.
- **b) Alcance, tipos y responsables:** pruebas unitarias (Jest), de integración contra Supabase, funcionales E2E (Playwright), de rendimiento (SQL), de carga/estrés (autocannon) y de seguridad (RLS + Advisor). ✏️ Responsables: completar con los nombres del equipo.
- **c) Scripts automatizados:** `npm test` (20 casos), `npm run test:integracion` (26), `npm run test:e2e` (4) y `npm run test:carga` (3 escenarios). Están en `src/**/__tests__/` y `tests/`.
- **d) Métricas:** todas las pruebas cumplen el criterio definido (tabla de esperado vs. obtenido en [plan-de-pruebas.md](plan-de-pruebas.md#4-métricas-y-resultados)). Por ejemplo: carga p97,5 ≤ 500 ms → 162 ms; comparador ≥ 5× más rápido → 20×; 100 % de casos → 50/50.

---

## Imágenes para enviar

| Pide la pauta | Archivo |
|---|---|
| Esquema real en Supabase | ✏️ Captura de *Database → Schema Visualizer* del panel de Supabase (o el diagrama de [base-de-datos.md](base-de-datos.md#diagrama-de-relaciones)) |
| Precio asociado a producto y sucursal + rechazo de referencia inexistente | ✏️ Captura del SQL Editor con la consulta de la sección 1.b · salida en [`evidencias/salida-pruebas-integracion.txt`](evidencias/salida-pruebas-integracion.txt) |
| Formulario de precio, confirmación y comparador | [`03-formulario-precio.png`](evidencias/03-formulario-precio.png), [`04-confirmacion-precio.png`](evidencias/04-confirmacion-precio.png), [`05-comparador-ciudadano.png`](evidencias/05-comparador-ciudadano.png) |
| Comprobación de permisos | [`salida-pruebas-integracion.txt`](evidencias/salida-pruebas-integracion.txt) (sección «Autorización del comerciante (RLS)») |
| App en ejecución con el entorno identificado + log | [`08-entorno-identificado.png`](evidencias/08-entorno-identificado.png), [`09-monitoreo.png`](evidencias/09-monitoreo.png), [`10-auditoria.png`](evidencias/10-auditoria.png) |
| Rendimiento y correcciones | [rendimiento.md](rendimiento.md), [`reporte-carga.json`](evidencias/reporte-carga.json), [`salida-prueba-carga.txt`](evidencias/salida-prueba-carga.txt), [incidencias.md](incidencias.md) |
| GitHub y colaboración | ✏️ Enlaces a commits o PR de cada integrante |
