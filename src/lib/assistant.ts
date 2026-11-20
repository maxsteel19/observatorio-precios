// Asistente del Observatorio (cliente): arma el resumen de datos que recibe la IA,
// llama a la ruta /api/chat y, si no hay conexión, responde con los datos locales.
import type { Product } from '@/data/catalog';
import { DIDESE, TARJETA_VECINA } from '@/data/didese';
import { FUELS, FUEL_UPDATED, STATIONS, type FuelType } from '@/data/fuel';
import type { PriceEntry } from '@/data/seed';
import { SPECIALS, STATUS_LABEL, sortedOptions, specialStatus } from '@/data/specials';
import { storeLabel, type Store } from '@/data/stores';
import { formatDistance, formatPrice, formatRelativeDay, normalize } from '@/lib/format';
import { distanceFromUser, interpretQuery } from '@/lib/search';

export type AssistantData = { stores: Store[]; catalog: Product[]; prices: PriceEntry[] };
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** URL del servidor del asistente. En desarrollo basta la ruta relativa; en el APK se define al compilar. */
const API_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/chat`;

// ---------- Resumen de datos para la IA ----------

export function buildContext({ stores, catalog, prices }: AssistantData) {
  const active = stores.filter((s) => s.active);
  const lines: string[] = [];

  lines.push('COMERCIOS (nombre · dirección · horario · distancia desde el centro de la comuna):');
  for (const s of active) {
    lines.push(
      `- ${storeLabel(s)} · ${s.address} · ${s.hours} · ${formatDistance(distanceFromUser(s))}` +
        (s.tarjetaVecina ? ` · Convenio Tarjeta Vecina: ${s.tarjetaVecina}` : ''),
    );
  }

  lines.push('', 'PRECIOS DE LA CANASTA BÁSICA (de menor a mayor por producto):');
  for (const product of catalog.filter((p) => p.active)) {
    const options = prices
      .filter((p) => p.productId === product.id && active.some((s) => s.id === p.storeId))
      .sort((a, b) => a.price - b.price);
    if (options.length === 0) continue;
    const list = options
      .map((o) => {
        const store = active.find((s) => s.id === o.storeId)!;
        return `${storeLabel(store)} ${formatPrice(o.price)}${o.offer ? ' (oferta)' : ''}, act. ${formatRelativeDay(o.updatedAt)}`;
      })
      .join('; ');
    lines.push(`- ${product.name} (${product.unit}): ${list}`);
  }

  lines.push('', `BENCINAS (precio por litro, revisado ${formatRelativeDay(FUEL_UPDATED)}):`);
  for (const fuel of FUELS) {
    const list = STATIONS.filter((s) => s.prices[fuel.id] != null)
      .sort((a, b) => a.prices[fuel.id]! - b.prices[fuel.id]!)
      .map((s) => `${s.name} (${s.address}) ${formatPrice(s.prices[fuel.id]!)}`)
      .join('; ');
    lines.push(`- ${fuel.label}: ${list}`);
  }

  lines.push(
    '',
    'TARJETA VECINA PAC:',
    `- Tarjeta de beneficios de la Municipalidad. ${TARJETA_VECINA.members} vecinas y vecinos la tienen.`,
    `- Requisitos: ${TARJETA_VECINA.requirements.join('; ')}.`,
    `- Se pide escaneando el código QR de las publicaciones de la DIDESE o en la oficina (${DIDESE.address}). Consultas: ${TARJETA_VECINA.email}.`,
    `- Beneficios: ${TARJETA_VECINA.categories.map((c) => `${c.label} (${c.detail})`).join('; ')}.`,
  );

  lines.push('', 'ESPECIALES DE TEMPORADA:');
  for (const s of SPECIALS) {
    const items = s.items
      .map((i) => {
        const [best] = sortedOptions(i);
        return `${i.name} ${i.unit}: más barato en ${best!.store} ${formatPrice(best!.price)}${best!.local ? ' (emprendimiento local)' : ''}`;
      })
      .join('; ');
    lines.push(`- ${s.title} (${STATUS_LABEL[specialStatus(s)]}, ${s.period}): ${items}`);
  }

  lines.push(
    '',
    'OBSERVATORIO Y DIDESE:',
    `- ${DIDESE.name} (${DIDESE.short}), ${DIDESE.address}. Teléfonos ${DIDESE.phones.join(' / ')}. Correo ${DIDESE.email}.`,
    `- Horario: ${DIDESE.hours.map((h) => `${h.days} ${h.time}`).join('; ')}.`,
    '- Fomento Productivo apoya a negocios locales: capacitaciones, asesoría técnica, postulación a fondos, formalización y comercialización.',
    '- Los precios los registran fiscalizadores municipales (con lectura OCR de pizarras), comercios adheridos y avisos de vecinos.',
    '- Recetas: cazuela = pollo, carne, papa, cebolla, zanahoria, arroz, aceite y tomate; desayuno u once = pan, leche, huevos y azúcar.',
  );

  return lines.join('\n');
}

// ---------- Llamada al servidor ----------

export async function askAssistant(history: ChatTurn[], context: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, context }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
    if (!res.ok || !data.reply) throw new Error(data.error ?? `Error ${res.status}`);
    return data.reply;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Respuestas sin conexión ----------

const FUEL_PATTERNS: [RegExp, FuelType][] = [
  [/parafina|kerosen/, 'parafina'],
  [/diesel|petroleo/, 'diesel'],
  [/\b97\b/, '97'],
  [/\b95\b/, '95'],
  [/\b93\b|bencina|combustible|gasolina|cargar|estacion|bencinera|servicentro/, '93'],
];

const NOISE = new Set(['donde', 'esta', 'estan', 'mas', 'menos', 'cuanto', 'cuesta', 'vale', 'hay', 'que', 'cual', 'me', 'conviene', 'hoy', 'en', 'comuna', 'pac']);

export function localAnswer(question: string, { stores, catalog, prices }: AssistantData) {
  const q = normalize(question)
    .replace(/[¿?¡!.,;:()"«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const active = stores.filter((s) => s.active);

  const fuel = FUEL_PATTERNS.find(([re]) => re.test(q))?.[1];
  if (fuel) {
    const list = STATIONS.filter((s) => s.prices[fuel] != null).sort((a, b) => a.prices[fuel]! - b.prices[fuel]!);
    const label = FUELS.find((f) => f.id === fuel)!.label;
    const [best, second] = list;
    return `La ${label.toLowerCase()} más barata está en **${best!.name}** (${best!.address}): **${formatPrice(best!.prices[fuel]!)}** el litro.${
      second ? ` Le sigue ${second.name} con ${formatPrice(second.prices[fuel]!)}.` : ''
    }`;
  }

  if (/tarjeta|vecina|convenio|descuento/.test(q)) {
    const partners = active.filter((s) => s.tarjetaVecina).map((s) => `- ${storeLabel(s)}: ${s.tarjetaVecina}`);
    return [
      `La **Tarjeta Vecina PAC** da descuentos en comercios con convenio. Requisitos: ${TARJETA_VECINA.requirements
        .map((r) => r.charAt(0).toLowerCase() + r.slice(1))
        .join(' y ')}.`,
      `Se pide con el código QR de las publicaciones de la DIDESE o en ${DIDESE.address}.`,
      partners.length ? `Comercios del observatorio con convenio:\n${partners.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const special = SPECIALS.find((s) =>
    s.id === 'fiestas-patrias'
      ? /fiestas|patrias|dieciocho|18|empanada|asado|volantin/.test(q)
      : s.id === 'utiles'
        ? /utiles|escolar|colegio|cuaderno|mochila/.test(q)
        : new RegExp(normalize(s.title)).test(q),
  );
  if (special) {
    const items = special.items.map((i) => {
      const [best] = sortedOptions(i);
      return `- ${i.name}: **${formatPrice(best!.price)}** en ${best!.store}`;
    });
    return `Especial de **${special.title}** (${STATUS_LABEL[specialStatus(special)].toLowerCase()}):\n${items.join('\n')}`;
  }

  if (/horario|direccion|telefono|contacto|didese|municipal|fomento|oficina|correo/.test(q)) {
    return `La **${DIDESE.name}** está en ${DIDESE.address}. Atiende ${DIDESE.hours
      .map((h) => `${h.days.toLowerCase()} de ${h.time}`)
      .join(' y ')}. Teléfonos ${DIDESE.phones.join(' / ')} y correo ${DIDESE.email}.`;
  }

  const cleaned = q
    .split(/\s+/)
    .filter((w) => !NOISE.has(w))
    .join(' ');
  const { productIds, semanticLabel } = interpretQuery(cleaned, catalog);
  const matched = productIds.length > 0 && productIds.length < catalog.length;
  if (matched) {
    const rows = productIds
      .map((id) => {
        const product = catalog.find((p) => p.id === id);
        const best = prices
          .filter((p) => p.productId === id && active.some((s) => s.id === p.storeId))
          .sort((a, b) => a.price - b.price)[0];
        if (!product || !best) return null;
        const store = active.find((s) => s.id === best.storeId)!;
        return `- ${product.name} (${product.unit}): **${formatPrice(best.price)}** en ${storeLabel(store)}${best.offer ? ' (oferta)' : ''}`;
      })
      .filter((r) => r !== null)
      .slice(0, 8);
    if (rows.length > 0) {
      return `${semanticLabel ? `Para ${semanticLabel}, estos` : 'Estos'} son los precios más bajos de hoy:\n${rows.join('\n')}`;
    }
  }

  return 'Puedo ayudarte con precios de la canasta básica, bencinas, la Tarjeta Vecina, los especiales de temporada y los datos de contacto de la DIDESE. Por ejemplo: «¿Dónde está más barato el arroz?» o «¿Qué bencinera es la más barata?».';
}
