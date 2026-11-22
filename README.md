# Observatorio de Precios PAC

App para comparar precios de la canasta básica en Pedro Aguirre Cerda, hecha con **Expo (React Native)** a partir del mockup HTML del Proyecto Integrado. Funciona en **Android, iOS y web** con el mismo código.

Incluye los 5 flujos del mockup:

| Perfil | Qué puede hacer |
|---|---|
| **Ciudadano** (sin cuenta) | Buscar productos (incluye búsqueda semántica: «ingredientes para cazuela»), ver resultados en lista o mapa, filtrar y ordenar, ver la ficha del comercio, el historial de precios con gráfico, comparar entre comercios y reportar precios incorrectos. Además: **bencinas** (93, 95, 97, diésel y parafina por estación), **Tarjeta Vecina PAC** (requisitos, beneficios y comercios con convenio), **especiales de temporada** (Navidad, útiles escolares, Halloween, Fiestas Patrias) y **Acerca del observatorio** (DIDESE, Fomento Productivo y contacto). |
| **Fiscalizador** | Resumen del día, seleccionar comercio, capturar la pizarra de precios (OCR simulado), confirmar los valores según su confianza, ingreso manual e historial de capturas. |
| **Comerciante** | Panel con indicadores, ingresar precios y ofertas (solo productos del catálogo municipal), carga masiva desde CSV (simulada), gestionar sucursales con ubicación en el mapa e historial. |
| **Administrador** | Dashboard con KPIs y evolución de precios por categoría, catálogo de productos, comercios, aprobación de cuentas de comerciantes, usuarios y roles, y log de auditoría. En pantallas anchas usa una barra lateral. |
| **Acceso / registro** | Login, recuperación de contraseña y registro de comerciante en 2 pasos (con validación de RUT). |


Los datos viven en **Supabase** (PostgreSQL + Supabase Auth + Edge Functions): lo que guarda el fiscalizador o el comerciante aparece al instante en la app ciudadana de cualquier dispositivo. Si no hay backend configurado o no hay internet (por ejemplo en la feria), la app pasa a **modo demo** con datos de ejemplo en memoria. La pantalla de inicio muestra en qué entorno está corriendo («Supabase · desarrollo · v1.3.0» o «Modo demo»).

## Arquitectura

La app sigue un patrón **MVC por capas** (vista → lógica → acceso a datos), y la base de datos aplica las reglas por su cuenta:

```
Pantallas (Vista)            src/app/**, src/components/**      Expo Router + React Native
      │  useApp()
Estado y lógica (Controlador) src/state/AppState.tsx            acciones: savePrices, login, approveMerchant…
      │  llama a
Acceso a datos (Modelo)       src/services/repository.ts        único lugar que consulta Supabase
                              src/services/mappers.ts           filas de la BD ↔ tipos de la app
      │  HTTPS (supabase-js)
Supabase                      supabase/migrations/*.sql         tablas, RLS por rol, triggers, RPC
                              supabase/functions/*              registro y alta de usuarios (validan en el servidor)
```

Ejemplo, registrar un precio: `comerciante/(tabs)/precio.tsx` valida el formulario → `useApp().savePrices()` → `repository.savePrices()` inserta en `precios` → Postgres aplica RLS (¿la sucursal es del comerciante?), las restricciones CHECK/FK y el trigger de autoría → `AppState` recarga `precios_vigentes` → el comparador ciudadano muestra el nuevo precio.

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | LTS (probado con 24.22) | Ejecutar Expo, las pruebas y los scripts |
| npm | 10 o superior (viene con Node) | Dependencias |
| Git | 2.4x o superior | Control de versiones |
| Visual Studio Code | reciente | Editor recomendado (extensión **Expo Tools**, sugerida en `.vscode/extensions.json`) |
| Expo Go | SDK 58 | Probar en el celular (Android o iPhone) |
| Cuenta Supabase | plan gratuito | Base de datos, autenticación y Edge Functions |
| Cuenta Expo (EAS) | plan gratuito | Compilar el APK y publicar la versión web |

En Windows puedes revisar lo que falta con `powershell -ExecutionPolicy Bypass -File .\scripts\revisar-entorno.ps1`.

## Instalación y ejecución local

```bash
git clone https://github.com/maxsteel19/observatorio-precios.git
cd observatorio-precios
npm install
cp .env.example .env.local      # en PowerShell: Copy-Item .env.example .env.local
# completa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx expo start
```

- **En el celular:** escanea el QR con Expo Go (celular y computador en la misma red Wi-Fi).
- **En el navegador:** presiona `w` o abre http://localhost:8081.
- **Versión de producción web en local:** `npx expo export -p web` y luego `npx expo serve`.

Para crear tu propia base de datos sigue [docs/base-de-datos.md](docs/base-de-datos.md#cómo-reproducir-la-base-de-datos).

### Variables de entorno

Archivo de ejemplo: [`.env.example`](.env.example). El real (`.env.local`) está en `.gitignore`.

| Variable | Dónde se usa | ¿Secreta? |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | App: URL del proyecto Supabase | No (pública; la protección es RLS) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App: clave publicable `sb_publishable_…` | No (pública; la protección es RLS) |
| `EXPO_PUBLIC_APP_ENV` | App: nombre del entorno que se muestra (`desarrollo`, `pruebas`, `produccion`) | No |
| `EXPO_PUBLIC_API_URL` | App (APK): servidor del asistente | No |
| `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `CHAT_PROVIDER` | Solo servidor (`src/app/api/chat+api.ts`) | **Sí** |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo dentro de las Edge Functions (Supabase la inyecta) | **Sí**; nunca va en la app |

## Cuentas de prueba

Botones de **acceso rápido** en la pantalla de ingreso (Administrador, Fiscalizador, Comercio), o:

| Perfil | Email | Clave |
|---|---|---|
| Administrador | `admin@demo.cl` | `demo1234` |
| Fiscalizador | `fiscalizador@demo.cl` | `demo1234` |
| Comerciante (Minimarket El Sol, sucursales 7 y 8) | `comercio@demo.cl` | `demo1234` |
| Comerciante (Supermercado PAC, sucursal 3) | `superpac@demo.cl` | `demo1234` |
| Fiscalizador desactivado | `rperez@demo.cl` | `demo1234` |
| Comerciantes pendientes de aprobación | `laespiga@ejemplo.cl`, `donlucho@ejemplo.cl`, `sanjoaquin@ejemplo.cl` | `demo1234` |

> Son cuentas de demostración creadas por `supabase/seed.sql`. En un entorno de producción real se eliminan y las cuentas las crea el administrador.

## Guion sugerido para la feria (3–4 minutos)

1. **Ciudadano:** toca la sugerencia «Ingredientes para cazuela baratos» → muestra el banner de búsqueda semántica, la etiqueta «Más barato» y cambia a **Mapa**.
2. Abre un comercio → toca un producto → muestra el **gráfico de historial** (toca los puntos) y «Compara en otros comercios».
3. **Fiscalizador:** Ingresar → Fiscalizador → Nueva captura → elige un comercio → **Capturar** → revisa los campos de baja confianza → Confirmar → «Ver en la app ciudadana»: los precios ya están publicados.
4. **Comerciante:** ingresa una oferta y muéstrala en la app ciudadana.
5. **Registro + Administrador:** registra un comercio nuevo → entra como Administrador → **Cuentas** → apruébalo → revisa la **Auditoría**.

> Con Supabase los cambios quedan guardados en la base de datos y se ven desde cualquier dispositivo. En **modo demo** (sin `.env.local` o sin internet) los datos viven en memoria: al recargar vuelven al estado inicial, lo que sirve para reiniciar la demo entre visitantes.


## Estructura

```
src/
  app/                 Pantallas (Expo Router: cada archivo es una ruta)
    index.tsx            Ciudadano · inicio
    resultados.tsx       Ciudadano · comparador
    comercio/[id].tsx    Ciudadano · ficha del comercio
    historial.tsx        Ciudadano · historial de precio
    auth/                Login, recuperar, registro, pendiente
    fiscalizador/        Perfil fiscalizador
    comerciante/         Perfil comerciante (pestañas + formularios)
    admin/               Panel de administración (incluye Auditoría y Monitoreo)
    api/chat+api.ts      Ruta de servidor del asistente con IA
  components/          Componentes reutilizables (UI, mapa, gráfico, indicador de entorno…)
  state/AppState.tsx   Estado global y lógica de la app (modo Supabase / modo demo)
  services/            Acceso a datos: cliente Supabase, repositorio, mappers, logger, tipos de la BD
  data/                Catálogo y datos de ejemplo (modo demo)
  lib/                 Búsqueda, formato, validación de RUT
supabase/
  migrations/          Esquema SQL versionado (tablas, RLS, triggers, vistas, índices)
  seed.sql             Datos de prueba
  functions/           Edge Functions (Deno): registro-comerciante, admin-usuarios
  pruebas/             Script de la prueba de rendimiento
tests/
  integracion/         Pruebas contra Supabase (integridad y seguridad)
  e2e/                 Pruebas de extremo a extremo con Playwright
  carga/               Prueba de carga con autocannon
docs/                  Documentación de la EV3 y evidencias
```

## Comandos

```bash
npm run typecheck          # TypeScript estricto
npm run lint               # ESLint (eslint-config-expo)
npm test                   # pruebas unitarias (Jest)
npm run test:integracion   # pruebas contra Supabase (necesita .env.local)
npm run test:e2e           # Playwright (levanta la app web si no está corriendo)
npm run test:carga         # prueba de carga (20 conexiones × 30 s)
npm run verify             # typecheck + lint + unitarias
npx expo-doctor            # diagnostica dependencias y configuración
```

## Entornos y despliegue

| Entorno | Dónde | Configuración |
|---|---|---|
| Desarrollo | `npx expo start` en el computador | `.env.local` (`EXPO_PUBLIC_APP_ENV=desarrollo`) |
| Pruebas | APK de EAS (`preview`) / build web local | `eas.json` → perfil `preview` (`EXPO_PUBLIC_APP_ENV=pruebas`) |
| Producción | Web en EAS Hosting: **https://observatorio-pac.expo.app** · APK/AAB de EAS (`production`) | `eas.json` → perfil `production` |
| Base de datos | Supabase `observatorio-precios-pac` (sa-east-1) | Migraciones en `supabase/migrations` |

```bash
npx eas-cli@latest login
npx expo export -p web && npx eas-cli@latest deploy --prod      # versión web en EAS Hosting
npx eas-cli@latest build -p android --profile preview           # APK instalable
```

## Documentación

- [Respuestas de la pauta EV3](docs/EV3-respuestas.md)
- [Base de datos: diagrama, tablas, restricciones, RLS](docs/base-de-datos.md)
- [Plan de pruebas y resultados](docs/plan-de-pruebas.md)
- [Optimización de consultas y pruebas de carga](docs/rendimiento.md)
- [Incidencias corregidas](docs/incidencias.md)
- [Evidencias (capturas y reportes)](docs/evidencias/)

## Asistente con IA

En la pantalla **Asistente** (botón «Pregúntale al asistente» del inicio) las vecinas y vecinos preguntan con sus palabras: «¿dónde está más barato el arroz?», «¿qué bencinera conviene?», «¿cómo saco la Tarjeta Vecina?».

- Sigue el enfoque de [mbot](https://github.com/bemtorres/mbot): API de Chat Completions compatible con **OpenAI** (`gpt-4o-mini`) y **DeepSeek** (`deepseek-chat`), con un mensaje `system` que define la personalidad y las reglas, y el historial de la conversación como memoria.
- La app envía un resumen de sus datos (precios, comercios, bencinas, Tarjeta Vecina, especiales y contacto de la DIDESE) para que la IA responda solo con información del observatorio.
- **Las claves nunca están en la app:** las usa la ruta de servidor `src/app/api/chat+api.ts`, leyendo `OPENAI_API_KEY` y `DEEPSEEK_API_KEY` desde `.env.local` (ignorado por git). Copia `.env.example` como `.env.local` para configurarlas.
- Si un proveedor falla se usa el otro, y si no hay conexión el asistente responde con los datos guardados en la app (respuesta marcada «sin conexión»).
- Para que funcione en el APK, la ruta `/api/chat` debe estar publicada en un servidor (por ejemplo EAS Hosting) y su dirección se define en `EXPO_PUBLIC_API_URL` al compilar.

## Diseño

- **Logo e ícono:** el ícono de la app, la pantalla de carga y el logo interno se generaron desde `assets/images/logo-municipal-original.jpg`, con fondo azul sólido `#124280`, bordes limpios y mayor resolución.
- **Paleta:** tomada del logo municipal, en `src/theme.ts`: azul institucional para la estructura, verde para las acciones, naranja para las ofertas, y amarillo, celeste y rojo como acentos.
- **Tipografía:** Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`) para títulos, precios y botones.
- **Íconos ilustrados propios** en `src/components/icons/`: unas 40 ilustraciones SVG con volumen para productos, categorías, servicios, beneficios y especiales.
  - Se dibujan con `<AppIcon name="arroz" size={40} />`.
  - Las capas están en `definitions.ts` y los colores, la luz y la sombra en `tokens.ts`.
  - Cada instancia usa ids únicos para sus degradados.
  - La galería completa se ve en la ruta `/iconos`.

## Nota técnica (Windows)

En Windows, el generador de tipos de Expo Router (SDK 58) registra las rutas `index` anidadas como `/fiscalizador/index` en vez de `/fiscalizador`. La navegación funciona bien; `src/lib/routes.ts` (`panelHref`) evita ese falso error de TypeScript.
