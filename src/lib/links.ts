// Abrir enlaces externos (mapas, correo, teléfono, redes) sin romper la app si fallan.
import { Linking } from 'react-native';

export async function openLink(url: string) {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export const mailUrl = (email: string) => `mailto:${email}`;
export const phoneUrl = (phone: string) => `tel:${phone.replace(/\s/g, '')}`;
