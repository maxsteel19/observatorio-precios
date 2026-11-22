// Flujo completo: el comerciante registra un precio y el ciudadano lo ve en el comparador.
// También comprueba que el sistema rechaza un precio inválido y una contraseña incorrecta.
import { expect, test, type Page } from '@playwright/test';

const EVIDENCIAS = 'docs/evidencias';

/** Navega y espera a que React termine de hidratar la página y se carguen los datos de Supabase. */
async function abrir(page: Page, ruta: string) {
  await page.goto(ruta, { waitUntil: 'networkidle' });
  await expect(page.getByLabel('Cargando datos del observatorio')).toHaveCount(0);
}

async function iniciarSesion(page: Page, email: string, password: string) {
  await abrir(page, '/auth/login');
  await page.getByPlaceholder('correo@ejemplo.cl').fill(email);
  await page.getByPlaceholder('Tu contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

test('el comerciante registra un precio y aparece en el comparador ciudadano', async ({ page, browser }) => {
  // Precio único para reconocerlo en el comparador (entre $800 y $879, más barato que el resto de la harina).
  const precio = 800 + Math.floor(Math.random() * 8) * 10;
  const texto = `$${precio}`;

  await iniciarSesion(page, 'comercio@demo.cl', 'demo1234');
  await expect(page.getByText('Hola, Minimarket El Sol')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/01-panel-comerciante.png` });

  // Formulario de registro de precio
  await page.getByRole('tab', { name: 'Precio' }).click();
  await expect(page.getByText('Producto (catálogo municipal)')).toBeVisible();
  await page.getByText('Sucursal Principal', { exact: true }).click();
  await page.getByText('Buscar producto…').click();
  await page.getByPlaceholder('Buscar en el catálogo…').fill('harina');
  await page.getByText('Harina · 1 kg', { exact: true }).click();

  // Validación en la app: un precio de oferta mayor al normal se rechaza antes de enviar.
  await page.getByPlaceholder('1290').fill('900');
  await page.getByText('Es oferta / precio especial').click();
  await page.getByPlaceholder('990').fill('950');
  await page.getByRole('button', { name: 'Guardar precio' }).click();
  await expect(page.getByText('El precio oferta debe ser menor al precio normal')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/02-validacion-oferta.png` });
  await page.getByText('Es oferta / precio especial').click();

  await page.getByPlaceholder('1290').fill(String(precio));
  await page.screenshot({ path: `${EVIDENCIAS}/03-formulario-precio.png` });
  await page.getByRole('button', { name: 'Guardar precio' }).click();
  await expect(page.getByText(`Harina guardado: ${texto}`)).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/04-confirmacion-precio.png` });

  // Un ciudadano, en otro dispositivo y sin cuenta, busca el producto en el comparador.
  const ciudadano = await browser.newContext({ ...test.info().project.use });
  const vecina = await ciudadano.newPage();
  await abrir(vecina, '/resultados?q=harina');
  await expect(vecina.getByText(texto).first()).toBeVisible();
  await expect(vecina.getByText('Minimarket El Sol').first()).toBeVisible();
  await vecina.screenshot({ path: `${EVIDENCIAS}/05-comparador-ciudadano.png` });
  await ciudadano.close();
});

test('la app muestra el entorno y el administrador ve el monitoreo y la auditoría', async ({ page }) => {
  await abrir(page, '/');
  await expect(page.getByText(/Supabase · /)).toBeVisible();
  await page.getByText(/Supabase · /).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${EVIDENCIAS}/08-entorno-identificado.png` });

  await page.setViewportSize({ width: 1280, height: 860 });
  await iniciarSesion(page, 'admin@demo.cl', 'demo1234');
  await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();
  await page.goto('/admin/monitoreo', { waitUntil: 'networkidle' });
  await expect(page.getByText('Registro de actividad', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('registrar_precios_comerciante').first()).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/09-monitoreo.png` });
  await page.goto('/admin/auditoria', { waitUntil: 'networkidle' });
  await expect(page.getByText('Log de auditoría', { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/10-auditoria.png` });
});

test('una contraseña incorrecta muestra un mensaje de error', async ({ page }) => {
  await iniciarSesion(page, 'comercio@demo.cl', 'clave-incorrecta');
  await expect(page.getByText('El correo o la contraseña no coinciden')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/06-login-rechazado.png` });
});

test('el registro de comerciante rechaza un RUT inválido', async ({ page }) => {
  await abrir(page, '/auth/registro');
  await page.getByPlaceholder('Nombre', { exact: true }).fill('Ana');
  await page.getByPlaceholder('Apellido').fill('Prueba');
  await page.getByPlaceholder('correo@ejemplo.cl').fill('ana.prueba@ejemplo.cl');
  await page.getByPlaceholder('12.345.678-5').fill('12.345.678-9');
  await page.getByPlaceholder('Mínimo 8 caracteres').fill('segura123');
  await page.getByPlaceholder('Repite la contraseña').fill('segura123');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('RUT no válido (revisa el dígito verificador)')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCIAS}/07-rut-invalido.png` });
});
