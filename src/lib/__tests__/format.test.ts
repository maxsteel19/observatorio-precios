import { formatPercent, formatPrice, normalize, parsePrice } from '../format';

describe('Formato de precios y textos', () => {
  it('formatea precios en pesos chilenos con separador de miles', () => {
    expect(formatPrice(1290)).toBe('$1.290');
    expect(formatPrice(1000000)).toBe('$1.000.000');
    expect(formatPrice(990)).toBe('$990');
    expect(formatPrice(-1500)).toBe('-$1.500');
  });

  it('interpreta precios escritos por la persona usuaria', () => {
    expect(parsePrice('1.290')).toBe(1290);
    expect(parsePrice('$ 1290')).toBe(1290);
    expect(parsePrice('abc')).toBeNaN();
    expect(parsePrice('')).toBeNaN();
  });

  it('normaliza tildes y mayúsculas para la búsqueda', () => {
    expect(normalize('  Azúcar Granulada ')).toBe('azucar granulada');
    expect(normalize('Lácteos')).toBe('lacteos');
  });

  it('formatea porcentajes con coma decimal y signo', () => {
    expect(formatPercent(7.6)).toBe('+7,6%');
    expect(formatPercent(-14.6)).toBe('-14,6%');
  });
});
