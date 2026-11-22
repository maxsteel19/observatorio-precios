import { cleanRut, computeDv, formatRut, isValidRut } from '../rut';

describe('Validación de RUT chileno (módulo 11)', () => {
  it('acepta RUT con dígito verificador correcto, con o sin formato', () => {
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('123456785')).toBe(true);
    expect(isValidRut('9.876.543-3')).toBe(true);
  });

  it('acepta dígito verificador K (mayúscula o minúscula) y 0', () => {
    expect(computeDv('76555666')).toBe('K');
    expect(isValidRut('76.555.666-k')).toBe(true);
    expect(computeDv('76777888')).toBe('0');
    expect(isValidRut('76.777.888-0')).toBe(true);
  });

  it('rechaza un dígito verificador incorrecto (caso real encontrado en los datos de prueba)', () => {
    expect(isValidRut('76.999.888-1')).toBe(false);
    expect(isValidRut('76.999.888-8')).toBe(true);
  });

  it('rechaza entradas vacías, muy cortas o con letras en el cuerpo', () => {
    expect(isValidRut('')).toBe(false);
    expect(isValidRut('1-9')).toBe(false);
    expect(isValidRut('12.3A5.678-5')).toBe(false);
  });

  it('limpia y formatea con puntos y guion', () => {
    expect(cleanRut(' 12.345.678-k ')).toBe('12345678K');
    expect(formatRut('123456785')).toBe('12.345.678-5');
  });
});
