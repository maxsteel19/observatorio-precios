import { describe, expect, it } from '@jest/globals';

import { productSlug } from '../repository';

describe('Identificador de productos nuevos', () => {
  it('genera un id sin tildes ni espacios a partir del nombre y la unidad', () => {
    expect(productSlug('Azúcar flor', '1 kg')).toBe('azucar-flor-1-kg');
    expect(productSlug('  Té  en bolsitas ', 'unidad')).toBe('te-en-bolsitas-unidad');
  });

  it('cumple la restricción CHECK de la tabla productos (^[a-z0-9_-]+$)', () => {
    expect(productSlug('Ñoquis "caseros" (500 g)', '400 g')).toMatch(/^[a-z0-9_-]+$/);
  });
});
