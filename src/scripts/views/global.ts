import type { Payload, GlobalRow } from "../../lib/types";
import { fmt, initials, esc } from "../format";

const MEDAL: Record<number, string> = {
  1: "from-yellow-200 to-yellow-500 ring-yellow-400",
  2: "from-gray-100 to-gray-400 ring-gray-300",
  3: "from-orange-200 to-orange-500 ring-orange-300",
};

function medal(row: GlobalRow | undefined, place: number, big = false): string {
  if (!row) return `<div></div>`;
  const size = big ? "h-28 w-28 text-5xl" : "h-20 w-20 text-3xl";
  const ear = big ? "-top-5 h-10" : "-top-4 h-8";
  return `
    <div class="flex flex-col items-center ${big ? "sm:-mt-6" : ""}">
      <div class="relative">
        <span class="absolute ${ear} left-[28%] w-2.5 -rotate-12 rounded-full bg-gray-900"></span>
        <span class="absolute ${ear} right-[28%] w-2.5 rotate-12 rounded-full bg-gray-900"></span>
        <div class="relative grid ${size} place-items-center rounded-full bg-gradient-to-b ${MEDAL[place]} font-heading text-gray-900 shadow-md ring-4">
          ${place}
        </div>
      </div>
      <p class="mt-3 max-w-[9rem] text-center text-sm font-bold leading-tight sm:text-base">${esc(row.nombre)}</p>
      <p class="font-heading text-3xl sm:text-4xl">${fmt(row.total)}</p>
    </div>`;
}

function headerRow(): string {
  return `
    <div class="flex items-center gap-3 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-tertiary sm:gap-4">
      <span class="w-6 text-center">#</span>
      <span class="w-10"></span>
      <span class="min-w-0 flex-1">Finalista</span>
      <span class="hidden w-16 text-right sm:block">Mecán.</span>
      <span class="hidden w-16 text-right sm:block">Program.</span>
      <span class="hidden w-16 text-right sm:block">Comunic.</span>
      <span class="w-16 text-right">Total</span>
    </div>`;
}

function tableRow(r: GlobalRow): string {
  return `
    <div class="flex items-center gap-3 rounded-2xl border border-default bg-surface px-4 py-3 transition-colors hover:bg-subtle sm:gap-4">
      <span class="w-6 text-center font-heading text-xl text-secondary">${r.rank}</span>
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-subtle text-xs font-bold text-secondary">${initials(r.nombre)}</span>
      <div class="min-w-0 flex-1">
        <p class="truncate font-bold">${esc(r.nombre)}</p>
        <p class="text-xs font-medium uppercase tracking-wide text-tertiary">Grupo ${esc(r.grupo || "—")}</p>
      </div>
      <span class="hidden w-16 text-right font-semibold tabular-nums sm:block">${fmt(r.mecanica)}</span>
      <span class="hidden w-16 text-right font-semibold tabular-nums sm:block">${fmt(r.programacion)}</span>
      <span class="hidden w-16 text-right font-semibold tabular-nums sm:block">${fmt(r.comunicacion)}</span>
      <span class="w-16 text-right font-heading text-2xl tabular-nums">${fmt(r.total)}</span>
    </div>`;
}

export function renderGlobal(el: HTMLElement, data: Payload) {
  const g = data.global;
  el.innerHTML = `
    <div class="text-center">
      <h2 class="font-heading text-5xl tracking-wide sm:text-7xl">Ranking</h2>
      <p class="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
        Mejores finalistas · Total /100
      </p>
    </div>

    <p class="mt-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Campeón</p>
    <div class="mx-auto mt-3 grid max-w-2xl grid-cols-3 items-end gap-2 sm:gap-6">
      ${medal(g[1], 2)}
      ${medal(g[0], 1, true)}
      ${medal(g[2], 3)}
    </div>

    <div class="mt-10 space-y-2">
      ${headerRow()}
      ${g.map(tableRow).join("")}
    </div>`;
}
