// ==========================================================================
//  Lectura de una pestaña del Google Sheet vía gviz (formato CSV).
//  - Baja latencia (refleja ediciones en segundos, sin la caché de "Publicar").
//  - gviz fusiona cabeceras multi-fila en una sola fila de encabezado.
// ==========================================================================

import { SHEET_ID } from "./config";

/** Parser CSV mínimo: soporta comillas, comillas escapadas ("") y saltos de línea dentro de celdas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\r") {
      // ignorar
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Descarga una pestaña y devuelve sus filas de DATOS (sin la cabecera). */
export async function fetchTab(sheet: string): Promise<string[][]> {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`gviz "${sheet}" respondió ${res.status}`);
  const rows = parseCsv(await res.text());
  return rows.slice(1); // descartar fila de cabecera
}

/** Convierte texto de celda a número (admite coma decimal y celdas vacías -> 0). */
export function num(v: string | undefined): number {
  if (v == null) return 0;
  const t = v.trim().replace(",", ".");
  if (t === "") return 0;
  const x = Number(t);
  return Number.isNaN(x) ? 0 : x;
}
