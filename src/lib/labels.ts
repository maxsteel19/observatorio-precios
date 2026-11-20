import type { PriceSource } from '@/data/seed';

export const SOURCE_LABEL: Record<PriceSource, string> = {
  fiscalizador: 'Fiscalizador municipal',
  ocr: 'OCR validado',
  comerciante: 'Informado por el comercio',
  carga: 'Carga masiva del comercio',
};
