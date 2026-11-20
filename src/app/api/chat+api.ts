// Asistente del Observatorio (servidor). Recibe la conversación y un resumen de los datos de la app,
// y responde usando OpenAI o DeepSeek con la API compatible de Chat Completions (como en mbot).
// Las claves se leen de variables de entorno del servidor: nunca viajan al celular ni a la web.

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Provider = 'openai' | 'deepseek';

const PROVIDERS: Record<Provider, { url: string; key: () => string | undefined; model: () => string }> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: () => process.env.OPENAI_API_KEY,
    model: () => process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    key: () => process.env.DEEPSEEK_API_KEY,
    model: () => process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },
};

// Límites para que el asistente no se use como chat general ni gaste de más.
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 600;
const MAX_CONTEXT_CHARS = 16000;
const MAX_PER_MINUTE = 12;

function systemPrompt(context: string) {
  return `Eres el Asistente del Observatorio Municipal de Precios de Pedro Aguirre Cerda (Santiago, Chile), un servicio de la Dirección de Desarrollo Económico (DIDESE) de la Municipalidad. Ayudas a vecinas y vecinos a comparar precios y ahorrar.

Reglas:
- Responde siempre en español de Chile, con tono cercano y respetuoso, en pocas frases o una lista corta con guiones.
- Usa SOLO la información de DATOS DEL OBSERVATORIO para precios, comercios, bencinas, convenios, especiales y contactos. Si algo no está ahí, dilo y sugiere revisar la app o contactar a la DIDESE. Nunca inventes precios ni comercios.
- Escribe los precios en pesos chilenos con punto de miles, por ejemplo $1.290.
- Cuando compares, indica el comercio más barato y su precio, y si corresponde la diferencia con otros.
- Si te preguntan algo ajeno al observatorio (tareas, programación, temas generales), explica amablemente que solo ayudas con precios y servicios del observatorio.
- No pidas datos personales.
- Puedes destacar con **negrita** precios o nombres. No uses tablas, títulos ni enlaces.
- Los datos son de demostración para una feria de proyectos; menciónalo solo si te preguntan si son reales.

DATOS DEL OBSERVATORIO:
${context || '(no se recibieron datos)'}`;
}

async function complete(provider: Provider, messages: { role: string; content: string }[]) {
  const p = PROVIDERS[provider];
  const key = p.key();
  if (!key) throw new Error(`${provider}: falta la clave`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: p.model(), messages, temperature: 0.4, max_tokens: 450 }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${provider}: respondió ${res.status}`);
    const data = (await res.json()) as { model?: string; choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error(`${provider}: respuesta vacía`);
    return { content, model: data.model ?? p.model() };
  } finally {
    clearTimeout(timer);
  }
}

// Límite simple por dirección IP (en memoria del servidor).
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_MINUTE;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function isChatMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== 'object') return false;
  const { role, content } = m as Record<string, unknown>;
  return (role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim().length > 0;
}

export async function POST(request: Request) {
  let body: { messages?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Solicitud no válida' }, 400);
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter(isChatMessage)
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  if (history.length === 0 || history[history.length - 1]!.role !== 'user') {
    return json({ error: 'Falta la pregunta' }, 400);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (rateLimited(ip)) return json({ error: 'Muchas preguntas seguidas. Espera un minuto e inténtalo de nuevo.' }, 429);

  const context = typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_CHARS) : '';
  const messages = [{ role: 'system', content: systemPrompt(context) }, ...history];

  // Proveedor principal y respaldo: si uno falla, se intenta con el otro.
  const primary: Provider = process.env.CHAT_PROVIDER === 'deepseek' ? 'deepseek' : 'openai';
  const order: Provider[] = primary === 'openai' ? ['openai', 'deepseek'] : ['deepseek', 'openai'];
  const errors: string[] = [];
  for (const provider of order) {
    try {
      const { content, model } = await complete(provider, messages);
      return json({ reply: content, provider, model });
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  console.error('[asistente] sin respuesta:', errors.join(' | '));
  return json({ error: 'El asistente no está disponible en este momento.' }, 503);
}
