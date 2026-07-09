// Repinta el contenido preservando el estado abierto/cerrado de cada
// <details data-key>. Los keys nuevos conservan su atributo `open` por defecto.
export function paintKeepingOpen(el: HTMLElement, html: string) {
  const prev = new Map<string, boolean>();
  el.querySelectorAll<HTMLDetailsElement>("details[data-key]").forEach((d) => {
    if (d.dataset.key) prev.set(d.dataset.key, d.open);
  });
  el.innerHTML = html;
  el.querySelectorAll<HTMLDetailsElement>("details[data-key]").forEach((d) => {
    const k = d.dataset.key;
    if (k && prev.has(k)) {
      d.open = prev.get(k)!;
      if (d.open) d.dataset.restoredOpen = "1";
      else delete d.dataset.restoredOpen;
    } else {
      delete d.dataset.restoredOpen;
    }
  });
}

/** Chevron para los summary desplegables. */
export const chevron = `
  <svg class="h-5 w-5 shrink-0 text-secondary transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
