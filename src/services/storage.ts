// Almacenamiento de la sesión en web: localStorage del navegador.
// Durante el renderizado en servidor (web output "server") no existe window, así que no se guarda nada.
export const authStorage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined;
