# Observatorio de Precios PAC

App para comparar precios de la canasta básica en Pedro Aguirre Cerda, hecha con **Expo (React Native)** a partir del mockup HTML del Proyecto Integrado. Funciona en **Android, iOS y web** con el mismo código.

Incluye los 5 flujos del mockup:

| Perfil | Qué puede hacer |
|---|---|
| **Ciudadano** (sin cuenta) | Buscar productos (incluye búsqueda semántica: «ingredientes para cazuela»), ver resultados en lista o mapa, filtrar y ordenar, ver la ficha del comercio, el historial de precios con gráfico, comparar entre comercios y reportar precios incorrectos. |
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
3. **Fiscalizador:** Iniciar sesión → Fiscalizador → Nueva captura → elige un comercio → **Capturar** → revisa los campos de baja confianza → Confirmar → «Ver en la app ciudadana»: los precios ya están publicados.
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
- **Ícono y pantalla de inicio propios** en `assets/images/` (hoy son los de Expo).

## Nota técnica (Windows)

En Windows, el generador de tipos de Expo Router (SDK 58) registra las rutas `index` anidadas como `/fiscalizador/index` en vez de `/fiscalizador`. La navegación funciona bien; `src/lib/routes.ts` (`panelHref`) evita ese falso error de TypeScript.
