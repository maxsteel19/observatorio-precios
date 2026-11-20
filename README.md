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

Todo funciona **sin internet** con datos de ejemplo en memoria, pensado para la feria. Los cambios se ven al instante entre perfiles: lo que guarda el fiscalizador o el comerciante aparece de inmediato en la app ciudadana.

## Cómo ejecutarla

Requisitos: Node.js LTS y la app **Expo Go** en tu celular (Android o iPhone).

```bash
npm install
npx expo start
```

- **En el celular:** escanea el QR que aparece en la terminal con Expo Go (el celular y el computador deben estar en la misma red Wi-Fi).
- **En el navegador:** presiona `w` en la terminal o abre http://localhost:8081.

## Cuentas de prueba

En la pantalla de acceso hay botones de **acceso directo demo** (Administrador, Fiscalizador, Comercio). También puedes escribir:

| Perfil | Email | Clave |
|---|---|---|
| Administrador | `admin@demo.cl` | `demo1234` |
| Fiscalizador | `fiscalizador@demo.cl` | `demo1234` |
| Comerciante | `comercio@demo.cl` | `demo1234` |

> Son cuentas de demostración definidas en `src/data/seed.ts`; no hay backend real todavía.

## Guion sugerido para la feria (3–4 minutos)

1. **Ciudadano:** toca la sugerencia «Ingredientes para cazuela baratos» → muestra el banner de búsqueda semántica, la etiqueta «Más barato» y cambia a **Mapa**.
2. Abre un comercio → toca un producto → muestra el **gráfico de historial** (toca los puntos) y «Compara en otros comercios».
3. **Fiscalizador:** Ingresar → Fiscalizador → Nueva captura → elige un comercio → **Capturar** → revisa los campos de baja confianza → Confirmar → «Ver en la app ciudadana»: los precios ya están publicados.
4. **Comerciante:** ingresa una oferta y muéstrala en la app ciudadana.
5. **Registro + Administrador:** registra un comercio nuevo → entra como Administrador → **Cuentas** → apruébalo → revisa la **Auditoría**.

> Los datos viven en memoria: al recargar la app vuelven al estado inicial (útil para reiniciar la demo entre visitantes). Navega dentro de la app en vez de recargar la página para conservar los cambios.

## Estructura

```
src/
  app/                 Pantallas (Expo Router: cada archivo es una ruta)
    index.tsx            Ciudadano · inicio
    resultados.tsx       Ciudadano · resultados de búsqueda
    comercio/[id].tsx    Ciudadano · ficha del comercio
    historial.tsx        Ciudadano · historial de precio
    reportar.tsx         Ciudadano · reportar precio
    auth/                Login, recuperar, registro, pendiente
    fiscalizador/        Perfil fiscalizador
    comerciante/         Perfil comerciante (pestañas + formularios)
    admin/               Panel de administración
  components/          Componentes reutilizables (UI, mapa ilustrado, gráfico, etc.)
  data/                Catálogo, comercios y datos de ejemplo
  lib/                 Búsqueda, formato de precios/fechas, validación de RUT
  state/AppState.tsx   Estado global (único lugar a cambiar para conectar un backend)
  theme.ts             Colores y medidas del mockup
```

## Comandos útiles

```bash
npm run typecheck   # revisa tipos (TypeScript)
npm run lint        # revisa el código (ESLint)
npx expo-doctor     # diagnostica dependencias y configuración
```

## Próximos pasos sugeridos

- **Backend con Supabase:** tablas `productos`, `comercios`, `precios`, `usuarios`, `auditoria`; login con Supabase Auth y permisos por rol con Row Level Security. Solo hay que reemplazar las acciones de `src/state/AppState.tsx`.
- **Cámara y OCR reales:** `expo-camera` para la captura y un servicio de OCR/IA para leer la pizarra.
- **APK para la feria:** `npx eas-cli@latest build -p android --profile preview` genera un APK instalable sin Android Studio.

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
