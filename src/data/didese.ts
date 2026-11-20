// Información pública de la Dirección de Desarrollo Económico (DIDESE) de Pedro Aguirre Cerda,
// según sus publicaciones en Facebook (noviembre de 2026). El Observatorio Municipal de Precios depende de ella.
import type { IconName } from '@/components/icons';

const ADDRESS = 'Av. Club Hípico 6238, Pedro Aguirre Cerda';

export const DIDESE = {
  name: 'Dirección de Desarrollo Económico',
  short: 'DIDESE',
  address: ADDRESS,
  phones: ['22 396 5332', '22 396 5338'],
  email: 'fomentoproductivo@pedroaguirrecerda.cl',
  hours: [
    { days: 'Lunes a jueves', time: '09:00 a 13:00 y 15:00 a 18:00' },
    { days: 'Viernes', time: '09:00 a 13:00' },
  ],
  facebook: 'https://www.facebook.com/DidesePedroAguirreCerda',
  web: 'https://www.pedroaguirrecerda.cl',
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
};

export const TARJETA_VECINA = {
  email: 'tarjetavecina@pedroaguirrecerda.cl',
  members: 'Más de 10.000',
  requirements: ['Tener 18 años o más', 'Vivir o trabajar en Pedro Aguirre Cerda'],
  categories: [
    { icon: 'salud', label: 'Salud', detail: 'Atención médica, dental y psicológica' },
    { icon: 'optica', label: 'Ópticas', detail: 'Salud visual y lentes' },
    { icon: 'farmacia', label: 'Farmacia', detail: 'Medicamentos y productos veterinarios' },
    { icon: 'mascotas', label: 'Mascotas', detail: 'Alimento, accesorios, consultas y vacunas' },
    { icon: 'hogar', label: 'Hogar y gas', detail: 'Gas, decoración y limpieza' },
    { icon: 'ferreteria', label: 'Ferretería', detail: 'Fijaciones y suministros hidráulicos' },
    { icon: 'automovil', label: 'Automóvil', detail: 'Mecánica, estacionamiento y cambio de aceite' },
    { icon: 'gastronomia', label: 'Gastronomía', detail: 'Pastelería, helados, almuerzos y café' },
    { icon: 'belleza', label: 'Belleza', detail: 'Peluquería, cosmética y estética' },
    { icon: 'mayores', label: 'Personas mayores', detail: 'Productos y servicios especiales' },
  ] as { icon: IconName; label: string; detail: string }[],
};

/** Apoyo de la Oficina de Fomento Productivo a los negocios de la comuna. */
export const FOMENTO = [
  { icon: 'school-outline', label: 'Capacitaciones para fortalecer tus conocimientos' },
  { icon: 'construct-outline', label: 'Asesoría técnica para mejorar tu emprendimiento' },
  { icon: 'cash-outline', label: 'Orientación para postular a fondos' },
  { icon: 'document-text-outline', label: 'Apoyo para formalizar tu negocio' },
  { icon: 'trending-up-outline', label: 'Ayuda para vender mejor tus productos' },
] as const;
