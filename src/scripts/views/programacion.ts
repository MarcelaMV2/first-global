import type { Payload, ProgRow } from "../../lib/types";
import { fmt, esc } from "../format";
import { paintKeepingOpen, chevron } from "../dom";

function measure(label: string, value: number, max: string): string {
  return `
    <div class="rounded-xl bg-subtle px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-wide text-tertiary">${label}</p>
      <p class="font-heading text-2xl leading-none">${fmt(value)}</p>
      <p class="mt-0.5 text-xs text-tertiary">${max}</p>
    </div>`;
}

function row(r: ProgRow): string {
  const pct = Math.round((r.total / 30) * 100);
  return `
    <details data-key="prog-${esc(r.nombre)}" class="group overflow-hidden rounded-2xl border border-default bg-surface">
      <summary class="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden sm:gap-5">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-subtle font-heading text-lg text-secondary">${r.rank}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-bold">${esc(r.nombre)}</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-semibold uppercase tracking-wide text-tertiary">Total</p>
          <p class="font-heading text-3xl leading-none tabular-nums">${fmt(r.total)}</p>
          <p class="text-xs text-tertiary">/30</p>
        </div>
        ${chevron}
      </summary>
      <div class="grid grid-cols-2 gap-3 border-t border-default px-4 py-4 sm:grid-cols-5">
        ${measure("Cumplim.", r.cumpl, "/15")}
        ${measure("Modular.", r.modular, "/5")}
        ${measure("Escala.", r.escala, "/5")}
        ${measure("Efic.", r.efic, "/5")}
        <div class="col-span-2 rounded-xl bg-subtle px-4 py-3 sm:col-span-1">
          <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-tertiary">
            <span>Rendimiento</span><span class="text-primary">${pct}%</span>
          </div>
          <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-brand" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    </details>`;
}

export function renderProgramacion(el: HTMLElement, data: Payload) {
  paintKeepingOpen(
    el,
    `
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Área 2</p>
    <h2 class="font-heading text-4xl tracking-wide sm:text-5xl">Programación aplicada a robótica</h2>
    <p class="mt-2 max-w-2xl text-sm text-secondary">
      Cumplimiento de retos, modularidad, escalabilidad y eficiencia en una lectura pensada para comparación rápida.
    </p>
    <div class="mt-6 space-y-3">
      ${data.programacion.map(row).join("")}
    </div>`
  );
}
