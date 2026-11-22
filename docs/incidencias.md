# Incidencias encontradas y corregidas antes de la puesta en marcha

Cada incidencia indica cómo se detectó, el cambio que la resolvió y el resultado al repetir la prueba.

## 1. RUT con dígito verificador inválido en los datos de prueba

- **Cómo se detectó:** al preparar `supabase/seed.sql`, la restricción `CHECK (public.es_rut_valido(rut_empresa))` de `solicitudes_comerciante` rechazaba la solicitud de *Almacén San Joaquín*. El dato venía de `src/data/seed.ts`: `76.999.888-1`; el dígito correcto para `76.999.888` es **8**.
- **Cambio:** el seed usa `76.999.888-8` (comentario en `supabase/seed.sql`). Se agregó una prueba unitaria con ese caso real: `src/lib/__tests__/rut.test.ts` («rechaza un dígito verificador incorrecto»).
- **Resultado:** la carga de datos termina sin errores y la base rechaza el RUT antiguo: `select es_rut_valido('76.999.888-1')` → `false`.
- **Commit:** `d8ab07f`.

## 2. Funciones de permisos expuestas en la API (Security Advisor)

- **Cómo se detectó:** el *Security Advisor* de Supabase, ejecutado después de aplicar las migraciones, reportó **16 advertencias** `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable`: las funciones `es_admin()`, `rol_actual()`, etc. y las funciones de trigger se podían invocar por `/rest/v1/rpc/...` sin sesión. El *Performance Advisor* reportó **9 políticas permisivas duplicadas**.
- **Cambio:** migración `supabase/migrations/20261121000600_correccion_advisors.sql`: las funciones pasaron al esquema `privado` (no expuesto por la API), se revocó `EXECUTE` a `anon`/`authenticated` en las funciones de trigger y se consolidaron las políticas en una por rol y acción.
- **Resultado:** el advisor de seguridad quedó con **2 advertencias intencionales** (`aprobar_solicitud` y `rechazar_solicitud`, que la app sí llama y que validan internamente que quien llama sea administrador) más la protección de contraseñas filtradas (opción del plan pagado). El de rendimiento quedó sin políticas duplicadas. Las 26 pruebas de integración siguen pasando.
- **Commit:** `d8ab07f`.

## 3. El trigger de precios ocultaba los errores de clave foránea

- **Cómo se detectó:** en la prueba de integridad referencial, registrar un precio con `producto_id = 'producto-inexistente'` devolvía `P0001 · El producto ... no está activo` en vez del error de clave foránea esperado (`23503`). El trigger `antes_de_insertar_precio` consultaba `exists(... and activo)` y no distinguía «no existe» de «está desactivado».
- **Cambio:** migración `20261121000700_trigger_precios_fk.sql`: el trigger solo rechaza productos o sucursales que **existen pero están desactivados**; una referencia inexistente la rechaza la restricción `FOREIGN KEY`.
- **Resultado:** `tests/integracion/integridad.test.mjs` → `23503 · insert or update on table "precios" violates foreign key constraint "precios_producto_id_fkey"`.
- **Commit:** `9a2d8e8`.

## 4. Al recargar una pantalla protegida, la app expulsaba al usuario

- **Cómo se detectó:** prueba manual en el navegador. Con la sesión de administrador abierta, recargar `/admin/monitoreo` enviaba a la pantalla de inicio. La sesión se restaura de forma asíncrona y, mientras tanto, `Stack.Protected` veía `session = null` y redirigía.
- **Cambio:** `src/app/_layout.tsx`: mientras `loading` es `true` las rutas protegidas no redirigen y se muestra una pantalla de carga. Además, `AppState` arranca vacío en modo Supabase (antes mostraba un instante los datos de demo).
- **Resultado:** recargar `/admin/monitoreo` con sesión vuelve a la misma pantalla. Los datos siguen protegidos por RLS aunque la interfaz se muestre un instante.
- **Commit:** `9a2d8e8`.

## 5. Pruebas E2E inestables contra el servidor de desarrollo

- **Cómo se detectó:** las pruebas con Playwright fallaban de forma intermitente: botones deshabilitados (se escribía en el formulario antes de que React hidratara la página) y pantallas en blanco ("Bundling…": en desarrollo cada ruta se compila al abrirla por primera vez). Después de muchos cambios, Metro empezó a fallar con `Requiring unknown module`.
- **Cambio:** las pruebas esperan a que termine la carga (`abrir()` en `tests/e2e/flujo-precio.spec.ts`) y se ejecutan contra la **versión de producción** (`npx expo export -p web` + `npx expo serve`), que responde en ~10 ms en vez de 20 s.
- **Resultado:** las pruebas E2E pasan de forma estable (4 de 4 en 16,1 s).

## 6. El asistente con IA no respondía en la nueva versión web (resuelta)

- **Cómo se detectó:** antes de pasar la versión 1.3.0 a producción se probó `POST /api/chat` en ambas versiones. La producción actual (`observatorio-pac.expo.app`) respondió `200 {"reply":"Ok.","provider":"openai"}`; la vista previa 1.3.0 respondió `503 · El asistente no está disponible en este momento`.
- **Causa:** las claves `OPENAI_API_KEY` y `DEEPSEEK_API_KEY` existen en EAS, pero con visibilidad *secret* («solo accesibles en EAS Build»), así que EAS Hosting no las entrega a la ruta `/api/chat`, ni siquiera con `eas deploy --environment production`.
- **Decisión:** no se promovió la 1.3.0 a producción para no dejar sin asistente al APK 1.2.0, que usa `observatorio-pac.expo.app/api/chat`.
- **Cómo cerrarla:** poner las claves en `.env.local` del equipo que despliega (o cambiar su visibilidad a *sensitive* en EAS), volver a desplegar, comprobar `POST /api/chat` → `200` y recién entonces `npx eas-cli@latest deploy --prod`.
- **Resolución (22-11-2026):** las claves se cargaron en `.env.local` del equipo que despliega (archivo ignorado por Git) y se volvió a desplegar con `npx eas-cli@latest deploy`, que sube esas variables solo al servidor de EAS Hosting. Resultado al repetir la prueba: `POST /api/chat` → `200` en ~2,6 s con OpenAI; la clave de DeepSeek (respaldo) también respondió. La prueba E2E «el asistente con IA responde con los precios del observatorio» pasa contra la URL publicada (`evidencias/11-asistente-ia.png`).
