// Utilidades de formato y helpers para render en el cliente.

/** Número con coma decimal (es-BO), sin ceros de más. Ej: 39.3 -> "39,3" */
export function fmt(n: number, decimals = 1): string {
  return n.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** Iniciales de un nombre para el avatar. Ej: "Andree Mitchell" -> "AM" */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Escapa HTML para insertar texto de forma segura. */
export function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
  );
}
