// ==========================================================================
//  Configuración de la fuente de datos (Google Sheets)
// ==========================================================================

/** ID del Google Sheet (debe estar compartido como "cualquiera con el enlace: Lector"). */
// export const SHEET_ID = "1YKqlQFjln-KEckMEZDKETSRvG_cXFIoebTABkUS3VZo";
export const SHEET_ID = import.meta.env.SHEET_ID || "1YKqlQFjln-KEckMEZDKETSRvG_cXFIoebTABkUS3VZo";

/** Cada cuántos milisegundos el navegador vuelve a pedir los datos. */
// export const REFRESH_MS = 3000;
export const REFRESH_MS = Number(import.meta.env.PUBLIC_POLL_INTERVAL_MS) || 3000;

/** Nombres EXACTOS de las pestañas del Sheet. */
export const TABS = {
  global: "Vista Centralizada",
  rondas: "Rondas Oficiales",
  mecanica: "Exposición Mecánica",
  ingenieria: "Area #1 - Ingeniería", // roster: col A = nombre, col B = grupo
  programacion: "Area #2 - Programación",
  comunicacion: "Area #3 - Comunicación",
} as const;

/** Total de rondas a mostrar (se generan aunque aún no tengan datos). */
export const TOTAL_RONDAS = 14;
