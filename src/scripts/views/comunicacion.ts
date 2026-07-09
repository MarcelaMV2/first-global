import type { Payload, ComRow } from "../../lib/types";
import { fmt, esc } from "../format";
import { paintKeepingOpen, chevron } from "../dom";

function video(label: string, value: number): string {
  return `
    <div class="rounded-xl bg-subtle px-4 py-4 text-center">
      <p class="text-xs font-semibold uppercase tracking-wide text-tertiary">${label}</p>
      <p class="mt-1 font-heading text-3xl leading-none">${fmt(value)}</p>
    </div>`;
}

function row(r: ComRow): string {
  return `
    <details data-key="com-${esc(r.nombre)}" class="group overflow-hidden rounded-2xl border border-default bg-surface">
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
      <div class="grid grid-cols-1 gap-3 border-t border-default px-4 py-4 sm:grid-cols-3">
        ${video("Video 1", r.video1)}
        ${video("Video 2", r.video2)}
        ${video("Video 3", r.video3)}
      </div>
    </details>`;
}

export function renderComunicacion(el: HTMLElement, data: Payload) {
  paintKeepingOpen(
    el,
    `
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Área 3</p>
    <h2 class="font-heading text-4xl tracking-wide sm:text-5xl">Comunicación y narrativa audiovisual</h2>
    <p class="mt-2 max-w-2xl text-sm text-secondary">
      Cada finalista se presenta como una secuencia de tres entregables con su consolidado total.
    </p>
    <div class="mt-6 space-y-3">
      ${data.comunicacion.map(row).join("")}
    </div>`
  );
}
