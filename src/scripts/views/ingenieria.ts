import type { Payload, Ronda, AlianzaEquipo, MecTeam } from "../../lib/types";
import { fmt, esc } from "../format";
import { paintKeepingOpen, chevron } from "../dom";

let activeSub: "rondas" | "tabla" = "rondas";
let latest: Payload | null = null;

// ==========================================================================
//  RONDAS — replica del diseño "Igniting Innovation"
// ==========================================================================
function estadoBadge(estado: string): string {
  if (estado === "Finalizada")
    return `<span class="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Finalizada</span>`;
  if (estado === "En curso")
    return `<span class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">En curso</span>`;
  return `<span class="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tertiary">Pendiente</span>`;
}

const smallChevron = (grp: string) =>
  `<svg class="h-4 w-4 text-secondary transition-transform ${grp}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

/** Tarjeta de un equipo dentro de una alianza (desplegable con integrantes). */
function teamCard(n: number, side: "rojo" | "azul", e: AlianzaEquipo, defaultOpen: boolean): string {
  const red = side === "rojo";
  const color = red ? "text-red-500" : "text-blue-500";
  const dot = red ? "bg-red-500" : "bg-blue-500";
  const border = red ? "border-red-100" : "border-blue-100";
  const dotBig = `<span class="h-3 w-3 rounded-full ${dot}"></span>`;
  const chev = smallChevron("group-open/t:rotate-180");

  const members = e.integrantes.length
    ? e.integrantes
        .map((m) =>
          red
            ? `<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 shrink-0 rounded-full ${dot}"></span>${esc(m)}</li>`
            : `<li class="flex items-center justify-end gap-2">${esc(m)}<span class="h-1.5 w-1.5 shrink-0 rounded-full ${dot}"></span></li>`
        )
        .join("")
    : `<li class="italic text-tertiary">Integrantes por asignar</li>`;

  const head = red
    ? `<span class="font-heading text-xl ${color}">Equipo ${esc(e.letra)}</span><span class="flex items-center gap-2">${chev}${dotBig}</span>`
    : `<span class="flex items-center gap-2">${dotBig}${chev}</span><span class="font-heading text-xl ${color}">Equipo ${esc(e.letra)}</span>`;

  return `
    <details data-key="ronda-${n}-${side}-${esc(e.letra)}" ${defaultOpen ? "open" : ""} class="group/t rounded-2xl border ${border} bg-surface px-4 py-3 shadow-sm">
      <summary class="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">${head}</summary>
      <ul class="mt-2 space-y-1.5 border-t ${border} pt-2 text-sm text-secondary">${members}</ul>
    </details>`;
}

function regionalBox(side: "rojo" | "azul", val: number): string {
  const red = side === "rojo";
  return `
    <div class="rounded-2xl border ${red ? "border-red-100 bg-red-50" : "border-blue-100 bg-blue-50"} px-5 py-4 text-center">
      <p class="text-[10px] font-bold uppercase tracking-wide ${red ? "text-red-500" : "text-blue-500"}">Alianza Regional ${red ? "Rojo" : "Azul"}</p>
      <p class="font-heading text-4xl leading-none ${red ? "text-red-600" : "text-blue-600"}">${fmt(val)}</p>
    </div>`;
}

function buddyPill(side: "rojo" | "azul", val: number): string {
  if (!val) return "";
  const red = side === "rojo";
  return `
    <div class="${red ? "text-left" : "text-right"}">
      <span class="inline-block rounded-full ${red ? "bg-red-500" : "bg-blue-500"} px-4 py-1.5 text-xs font-semibold text-white">+${fmt(val)} Buddy climb</span>
    </div>`;
}

function centerChip(label: string, val: string): string {
  return `
    <div class="rounded-2xl border border-default bg-surface px-3 py-3 text-center shadow-sm">
      <p class="text-[10px] font-bold uppercase tracking-wide text-tertiary">${label}</p>
      <p class="mt-0.5 font-heading text-3xl leading-none">${val}</p>
    </div>`;
}

const emptyAlliance = (side: "rojo" | "azul") =>
  `<div class="rounded-2xl border ${side === "rojo" ? "border-red-100" : "border-blue-100"} bg-surface px-4 py-6 text-center text-sm italic text-tertiary shadow-sm">Alianza por definir</div>`;

function roundBody(r: Ronda): string {
  if (!r.hasData)
    return `<div class="border-t border-default px-6 py-8 text-center text-sm italic text-tertiary">Esta ronda aún no tiene datos cargados.</div>`;

  return `
    <div class="border-t border-default bg-gradient-to-r from-red-50 via-surface to-blue-50 px-3 py-6 sm:px-6 lg:px-8">
      <div class="mb-6 text-center">
        <h3 class="font-heading text-3xl leading-none sm:text-4xl">Igniting Innovation</h3>
        <p class="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
          Ronda ${r.n}${r.descansa ? ` · Descansa ${esc(r.descansa)}` : ""}
        </p>
      </div>

      <div class="grid items-start gap-4 lg:grid-cols-[1fr_16rem_1fr]">
        <!-- ALIANZA ROJA -->
        <div class="space-y-3">
          ${r.rojo.equipos.length ? r.rojo.equipos.map((e, i) => teamCard(r.n, "rojo", e, i < 2)).join("") : emptyAlliance("rojo")}
          ${regionalBox("rojo", r.rojo.totalRegional)}
          ${buddyPill("rojo", r.rojo.buddy)}
        </div>

        <!-- CENTRO -->
        <div class="flex flex-col items-center gap-4">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Score total</p>
          <div class="w-full rounded-2xl border border-default bg-surface px-4 py-5 text-center shadow-sm">
            <div class="flex items-center justify-center gap-3 font-heading text-5xl leading-none sm:text-6xl">
              <span class="text-red-500">${fmt(r.rojo.score)}</span>
              <span class="text-lg italic text-tertiary">vs</span>
              <span class="text-blue-500">${fmt(r.azul.score)}</span>
            </div>
          </div>
          <div class="grid w-full grid-cols-2 gap-3">
            ${centerChip("Extintor global", fmt(r.wildfireExt))}
            ${centerChip("Coopertition", "+" + fmt(r.coopBonus))}
          </div>
        </div>

        <!-- ALIANZA AZUL -->
        <div class="space-y-3 text-right">
          ${r.azul.equipos.length ? r.azul.equipos.map((e, i) => teamCard(r.n, "azul", e, i < 2)).join("") : emptyAlliance("azul")}
          ${regionalBox("azul", r.azul.totalRegional)}
          ${buddyPill("azul", r.azul.buddy)}
        </div>
      </div>
    </div>`;
}

function roundCard(r: Ronda): string {
  const score = r.hasData
    ? `<span class="text-red-500">${fmt(r.rojo.score)}</span> <span class="text-sm text-tertiary">vs</span> <span class="text-blue-500">${fmt(r.azul.score)}</span>`
    : `<span class="text-base text-tertiary">Sin datos</span>`;
  const openByDefault = r.hasData && r.estado === "En curso";

  return `
    <details data-key="ronda-${r.n}" ${openByDefault ? "open" : ""} class="group overflow-hidden rounded-2xl border border-default bg-surface ${r.hasData ? "" : "opacity-70"}">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden sm:px-5">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-subtle font-heading text-lg text-secondary">${r.n}</span>
          <div>
            <p class="font-bold">Ronda ${r.n}</p>
            <p class="mt-0.5 flex items-center gap-2 text-xs text-tertiary">
              ${estadoBadge(r.estado)}${r.descansa ? `<span>· Descansa ${esc(r.descansa)}</span>` : ""}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-heading text-2xl tabular-nums">${score}</span>
          ${chevron}
        </div>
      </summary>
      ${roundBody(r)}
    </details>`;
}

// ==========================================================================
//  TABLA MECÁNICA
// ==========================================================================
function mecTable(tabla: MecTeam[]): string {
  const rows = tabla
    .map(
      (t) => `
      <tr class="border-t border-default">
        <td class="px-3 py-3 font-bold">${esc(t.equipo)}</td>
        <td class="px-3 py-3 text-secondary">${t.integrantes.length ? t.integrantes.map(esc).join(", ") : `<span class="italic text-tertiary">Por asignar</span>`}</td>
        <td class="px-3 py-3 text-right tabular-nums">${fmt(t.exposicion)}</td>
        <td class="px-3 py-3 text-right tabular-nums">${fmt(t.rondas)}</td>
        <td class="px-3 py-3 text-right font-heading text-2xl tabular-nums">${fmt(t.total)}</td>
      </tr>`
    )
    .join("");
  return `
    <div class="overflow-x-auto">
      <table class="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr class="text-left text-xs font-semibold uppercase tracking-wide text-tertiary">
            <th class="px-3 pb-2">Equipo</th>
            <th class="px-3 pb-2">Integrantes</th>
            <th class="px-3 pb-2 text-right">Exposición <span class="text-[10px]">/10</span></th>
            <th class="px-3 pb-2 text-right">Rondas <span class="text-[10px]">/30</span></th>
            <th class="px-3 pb-2 text-right">Total <span class="text-[10px]">/40</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ==========================================================================
//  Sub-tabs + render principal
// ==========================================================================
function subTab(id: "rondas" | "tabla", label: string): string {
  const on = activeSub === id;
  return `<button data-sub="${id}" class="rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${on ? "bg-brand text-inverse" : "text-secondary hover:text-primary"}">${label}</button>`;
}

function paint(el: HTMLElement, data: Payload) {
  const content =
    activeSub === "rondas"
      ? `<div class="space-y-3">${data.ingenieria.rondas.map(roundCard).join("")}</div>`
      : mecTable(data.ingenieria.tabla);

  paintKeepingOpen(
    el,
    `
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Área 1</p>
    <h2 class="font-heading text-4xl tracking-wide sm:text-5xl">Robot, Pista e Ingeniería</h2>
    <p class="mt-2 max-w-2xl text-sm text-secondary">
      Competencia por rondas entre 6 equipos y evaluación de la exposición mecánica por grupo.
    </p>
    <div class="mt-5 mb-6 inline-flex rounded-full border border-default bg-canvas p-1">
      ${subTab("rondas", "Rondas")}
      ${subTab("tabla", "Tabla Mecánica")}
    </div>
    ${content}`
  );
}

export function renderIngenieria(el: HTMLElement, data: Payload) {
  latest = data;
  if (!el.dataset.bound) {
    el.dataset.bound = "1";
    el.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-sub]") as HTMLElement | null;
      if (!btn) return;
      activeSub = btn.dataset.sub as "rondas" | "tabla";
      if (latest) paint(el, latest);
    });
  }
  paint(el, data);
}
