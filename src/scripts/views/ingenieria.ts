import type { Payload, Ronda, AlianzaEquipo, MecTeam } from "../../lib/types";
import { fmt, esc } from "../format";
import { paintKeepingOpen, chevron } from "../dom";

let activeSub: "rondas" | "tabla" = "rondas";
let latest: Payload | null = null;

const LOW_POLY_BACKDROP = buildStageBackdrop();

const seenOpenRounds = new Set<string>();
const metricSnapshot = new Map<string, number>();
const activeMetricFrames = new Set<number>();

function caretIcon(className: string): string {
  return `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>`;
}

function buildStageBackdrop(): string {
  let seed = 987654321;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };

  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const W = 1000;
  const H = 560;
  const cols = 17;
  const rows = 10;
  const cw = W / cols;
  const ch = H / rows;
  const pts: Array<Array<{ x: number; y: number }>> = [];

  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    for (let c = 0; c <= cols; c++) {
      const edge = r === 0 || c === 0 || r === rows || c === cols;
      const jx = edge ? 0 : (rand() - 0.5) * cw * 0.72;
      const jy = edge ? 0 : (rand() - 0.5) * ch * 0.72;
      pts[r][c] = { x: c * cw + jx, y: r * ch + jy };
    }
  }

  const polygons: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pts[r][c];
      const b = pts[r][c + 1];
      const d = pts[r + 1][c];
      const e = pts[r + 1][c + 1];
      const quads = [
        [a, b, d],
        [b, e, d],
      ];

      for (const tri of quads) {
        const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
        const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
        const tx = cx / W;
        const vy = cy / H;
        const redAmt = Math.max(0, 1 - tx * 1.85);
        const blueAmt = Math.max(0, (tx - 0.06) * 1.15);

        let R = 246;
        let G = 243;
        let B = 248;

        R += redAmt * 6;
        G += redAmt * (-20 * (0.4 + vy * 0.7));
        B += redAmt * (-14 * (0.4 + vy * 0.7));
        R += blueAmt * (-22 * (0.4 + vy * 0.7));
        G += blueAmt * -8;
        B += blueAmt * 6;

        const variance = (rand() - 0.5) * 10;
        const fill = `rgb(${clamp(R + variance)},${clamp(G + variance)},${clamp(B + variance)})`;
        const animate = rand() < 0.24;
        const duration = (4 + rand() * 6).toFixed(2);
        const delay = (rand() * 6).toFixed(2);

        polygons.push(
          `<polygon class="round-stage__facet${animate ? " round-stage__facet--animated" : ""}" points="${tri
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ")}" style="fill:${fill};--facet-duration:${duration}s;--facet-delay:${delay}s" />`
        );
      }
    }
  }

  return `
    <div class="round-stage__backdrop" aria-hidden="true">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="round-stage__mesh">
        ${polygons.join("")}
      </svg>
      <span class="round-stage__shine"></span>
      <span class="round-stage__orb round-stage__orb--red"></span>
      <span class="round-stage__orb round-stage__orb--blue"></span>
      <span class="round-stage__orb round-stage__orb--white"></span>
    </div>`;
}

function renderMetric(key: string, value: number, extraClass = "", prefix = "", suffix = ""): string {
  return `<span class="js-round-metric ${extraClass}" data-metric="${key}" data-value="${value}" data-prefix="${esc(prefix)}" data-suffix="${esc(suffix)}">${prefix}${fmt(value, 0)}${suffix}</span>`;
}

function estadoChip(estado: string): string {
  const label = estado === "Finalizada" ? "Finalizado" : estado || "Pendiente";
  const tone =
    label === "Finalizado"
      ? "round-status-chip round-status-chip--finalizado"
      : label === "En curso"
        ? "round-status-chip round-status-chip--curso"
        : "round-status-chip round-status-chip--pendiente";

  return `<span class="${tone}">${esc(label)}</span>`;
}

function compactTeamItem(side: "rojo" | "azul", equipo: AlianzaEquipo): string {
  const dot = `<span class="round-accordion__team-dot" aria-hidden="true"></span>`;
  const label = `<span class="round-accordion__team-label">Equipo ${esc(equipo.letra)}</span>`;
  return side === "rojo"
    ? `<div class="round-accordion__team-item round-accordion__team-item--red">${dot}${label}</div>`
    : `<div class="round-accordion__team-item round-accordion__team-item--blue">${label}${dot}</div>`;
}

function compactTeamList(side: "rojo" | "azul", equipos: AlianzaEquipo[]): string {
  const items = equipos.length
    ? equipos.map((equipo) => compactTeamItem(side, equipo)).join("")
    : `<div class="round-accordion__team-item round-accordion__team-item--empty">
        <span class="round-accordion__team-label">Sin equipos</span>
      </div>`;

  return `
    <div class="round-accordion__summary-side round-accordion__summary-side--${side}">
      ${items}
    </div>`;
}

function regionalBox(side: "rojo" | "azul", val: number, round: number): string {
  const red = side === "rojo";
  return `
    <div class="round-regional ${red ? "round-regional--red" : "round-regional--blue"}">
      <p class="round-regional__label">Alianza Regional ${red ? "Rojo" : "Azul"}</p>
      <p class="round-regional__value">${renderMetric(`ronda-${round}-${side}-regional`, val, "", "")}</p>
    </div>`;
}

function buddyPill(side: "rojo" | "azul", val: number, round: number): string {
  return `
    <div class="round-buddy-wrap ${side === "rojo" ? "round-buddy-wrap--left" : "round-buddy-wrap--right"}">
      <span class="round-buddy ${side === "rojo" ? "round-buddy--red" : "round-buddy--blue"}">${renderMetric(`ronda-${round}-${side}-buddy`, val, "", "+", " Buddy climb")}</span>
    </div>`;
}

function penaltyPill(side: "rojo" | "azul", val: number, obs: string): string {
  if (!val) return "";
  const hasObs = obs.trim().length > 0;
  const warnIcon = `<svg class="round-penalty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  return `
    <div class="round-penalty-wrap ${side === "rojo" ? "round-penalty-wrap--left" : "round-penalty-wrap--right"}">
      <span class="round-penalty round-penalty--${side === "rojo" ? "red" : "blue"}" tabindex="0" role="note"
        aria-label="Penalización de ${fmt(val, 0)} puntos${hasObs ? `: ${esc(obs)}` : ""}">
        ${warnIcon}
        <span class="round-penalty__value">−${fmt(val, 0)} pts</span>
        ${hasObs ? `<span class="round-penalty__tip" role="tooltip">${esc(obs)}</span>` : ""}
      </span>
    </div>`;
}

function centerChip(label: string, metricKey: string, val: number, prefix = ""): string {
  return `
    <div class="round-chip">
      <p class="round-chip__label">${esc(label)}</p>
      <p class="round-chip__value">${renderMetric(metricKey, val, "", prefix)}</p>
    </div>`;
}

function roundScorePreview(r: Ronda): string {
  if (!r.hasData) {
    return `<span class="round-accordion__score-preview round-accordion__score-preview--muted">Sin datos</span>`;
  }

  return `
    <span class="round-accordion__score-preview">
      <span class="round-score-preview__red">${fmt(r.rojo.score, 0)}</span>
      <span class="round-score-preview__vs">vs</span>
      <span class="round-score-preview__blue">${fmt(r.azul.score, 0)}</span>
    </span>`;
}

function roundBody(r: Ronda): string {
  if (!r.hasData) {
    return `
      <div class="round-stage">
        <div class="round-stage__panel">
          ${LOW_POLY_BACKDROP}
          <div class="round-stage__surface">
            <div class="round-stage__empty">Esta ronda aún no tiene datos cargados.</div>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="round-stage">
      <div class="round-stage__panel">
        ${LOW_POLY_BACKDROP}
        <div class="round-stage__surface">
          <div class="round-stage__grid">
            <div class="round-stage__column round-stage__column--red">
              ${regionalBox("rojo", r.rojo.totalRegional, r.n)}
              ${buddyPill("rojo", r.rojo.buddy, r.n)}
              ${penaltyPill("rojo", r.rojo.penal, r.rojo.penalObs)}
            </div>

            <div class="round-stage__center">
              <div class="round-chip-grid">
                ${centerChip("EXTINTOR GLOBAL", `ronda-${r.n}-extintor`, r.wildfireExt)}
                ${centerChip("COOPERTITION", `ronda-${r.n}-coop`, r.coopBonus, "+")}
              </div>
            </div>

            <div class="round-stage__column round-stage__column--blue">
              ${regionalBox("azul", r.azul.totalRegional, r.n)}
              ${buddyPill("azul", r.azul.buddy, r.n)}
              ${penaltyPill("azul", r.azul.penal, r.azul.penalObs)}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function roundCard(r: Ronda): string {
  const openByDefault = r.hasData && r.estado === "En curso";

  return `
    <details data-key="ronda-${r.n}" ${openByDefault ? "open" : ""} class="round-accordion ${r.hasData ? "" : "round-accordion--muted"}">
      <summary class="round-accordion__summary">
        ${compactTeamList("rojo", r.rojo.equipos)}

        <div class="round-accordion__summary-center">
          ${estadoChip(r.estado)}
          <p class="round-accordion__title">Ronda ${r.n}</p>
          <span class="round-accordion__caret">${caretIcon("round-accordion__caret-icon")}</span>
          ${roundScorePreview(r)}
        </div>

        ${compactTeamList("azul", r.azul.equipos)}
      </summary>
      ${roundBody(r)}
    </details>`;
}

function mecStat(label: string, value: number): string {
  return `
    <div class="text-center">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-tertiary">${label}</p>
      <p class="mt-1 font-heading text-xl leading-none tabular-nums text-primary">${fmt(value)}</p>
    </div>`;
}

// Tonos de avatar tomados de las escalas ya definidas en global.css.
const AVATAR_TONES = [
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-700",
  "bg-red-100 text-red-600",
  "bg-orange-100 text-orange-600",
  "bg-indigo-100 text-indigo-600",
  "bg-yellow-100 text-yellow-700",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function toneFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/** Chip de estudiante: avatar con iniciales de color + nombre. */
function studentChip(name: string): string {
  return `
    <div class="flex items-center gap-2.5 rounded-2xl border border-default bg-surface px-3 py-2.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneFor(name)} font-heading text-sm font-bold ring-1 ring-black/5">${esc(initials(name))}</span>
      <span class="min-w-0 text-sm font-semibold leading-tight text-primary">${esc(name)}</span>
    </div>`;
}

function mecMobileTile(label: string, value: number, max: string): string {
  return `
    <div class="rounded-xl bg-subtle px-4 py-3 text-center">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-tertiary">${label}</p>
      <p class="mt-1 font-heading text-2xl leading-none tabular-nums">${fmt(value)}</p>
      <p class="text-[10px] text-tertiary">${max}</p>
    </div>`;
}

function mecCard(t: MecTeam, rank: number): string {
  const letra = t.equipo.replace(/equipo/i, "").trim() || t.equipo;
  const n = t.integrantes.length;
  const integrantes = n
    ? t.integrantes.map(studentChip).join("")
    : `<p class="text-sm italic text-tertiary">Integrantes por asignar</p>`;

  return `
    <details data-key="mec-${esc(t.equipo)}" class="group overflow-hidden rounded-2xl border border-default bg-surface">
      <summary class="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden sm:gap-5">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-subtle font-heading text-lg text-secondary">
          <span class="sm:hidden">${rank}</span>
          <span class="hidden sm:block">${esc(letra)}</span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-bold">${esc(t.equipo)}</p>
          <p class="text-xs text-tertiary">${n} integrante${n === 1 ? "" : "s"}</p>
        </div>
        <div class="hidden items-center gap-4 sm:flex sm:gap-6">
          ${mecStat("Expos.", t.exposicion)}
          ${mecStat("Rondas", t.rondas)}
        </div>
        <div class="pl-3 text-right sm:border-l sm:border-default sm:pl-5">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-tertiary">Total</p>
          <p class="font-heading text-3xl leading-none tabular-nums text-primary">${fmt(t.total)}</p>
        </div>
        ${chevron}
      </summary>
      <div class="border-t border-default px-4 py-4">
        <div class="mb-4 grid grid-cols-2 gap-3 sm:hidden">
          ${mecMobileTile("Exposición", t.exposicion, "/10")}
          ${mecMobileTile("Rondas", t.rondas, "/30")}
        </div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">Integrantes</p>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">${integrantes}</div>
      </div>
    </details>`;
}

function mecTable(tabla: MecTeam[]): string {
  const rankOf = new Map<string, number>();
  [...tabla]
    .sort((a, b) => b.total - a.total)
    .forEach((t, i) => rankOf.set(t.equipo, i + 1));
  return `<div class="space-y-3">${tabla.map((t) => mecCard(t, rankOf.get(t.equipo) ?? 0)).join("")}</div>`;
}

function subTab(id: "rondas" | "tabla", label: string): string {
  const on = activeSub === id;
  return `<button data-sub="${id}" class="rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${on ? "bg-brand text-inverse" : "text-secondary hover:text-primary"}">${label}</button>`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cancelMetricAnimations() {
  activeMetricFrames.forEach((id) => window.cancelAnimationFrame(id));
  activeMetricFrames.clear();
}

function setMetricText(node: HTMLElement, value: number) {
  const prefix = node.dataset.prefix ?? "";
  const suffix = node.dataset.suffix ?? "";
  node.textContent = `${prefix}${fmt(value, 0)}${suffix}`;
}

function animateMetric(node: HTMLElement, from: number, to: number, duration = 1300) {
  const prefix = node.dataset.prefix ?? "";
  const suffix = node.dataset.suffix ?? "";
  const start = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = Math.round(from + (to - from) * eased);
    node.textContent = `${prefix}${fmt(next, 0)}${suffix}`;

    if (progress < 1) {
      const nextId = window.requestAnimationFrame((frameNow) => {
        activeMetricFrames.delete(nextId);
        tick(frameNow);
      });
      activeMetricFrames.add(nextId);
    } else {
      setMetricText(node, to);
    }
  };

  const id = window.requestAnimationFrame((now) => {
    activeMetricFrames.delete(id);
    tick(now);
  });
  activeMetricFrames.add(id);
}

function hydrateRoundMetrics(root: HTMLElement) {
  const reduced = prefersReducedMotion();
  const rounds = Array.from(root.querySelectorAll<HTMLDetailsElement>(".round-accordion[open]"));
  const freshRounds = new Set(
    rounds
      .filter((round) => {
        const key = round.dataset.key;
        return Boolean(key && !round.dataset.restoredOpen && !seenOpenRounds.has(key));
      })
      .map((round) => round.dataset.key!)
  );

  rounds.forEach((round) => {
    const roundKey = round.dataset.key;
    if (!roundKey) return;

    round.querySelectorAll<HTMLElement>(".js-round-metric").forEach((node) => {
      const metricKey = node.dataset.metric;
      if (!metricKey) return;

      const value = Number(node.dataset.value ?? "0");
      const prev = metricSnapshot.get(metricKey);
      const shouldAnimate = !reduced && (freshRounds.has(roundKey) || prev === undefined || prev !== value);

      if (shouldAnimate) {
        animateMetric(node, prev ?? 0, value);
      } else {
        setMetricText(node, value);
      }

      metricSnapshot.set(metricKey, value);
    });

    seenOpenRounds.add(roundKey);
  });
}

function viewSignature(data: Payload): string {
  return activeSub === "rondas"
    ? JSON.stringify(data.ingenieria.rondas)
    : JSON.stringify(data.ingenieria.tabla);
}

function paint(el: HTMLElement, data: Payload) {
  const signature = `${activeSub}:${viewSignature(data)}`;
  if (el.dataset.viewSignature === signature) return;

  cancelMetricAnimations();

  const content =
    activeSub === "rondas"
      ? `<div class="space-y-4">${data.ingenieria.rondas.map(roundCard).join("")}</div>`
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

  el.dataset.viewSignature = signature;

  if (activeSub === "rondas") {
    hydrateRoundMetrics(el);
  }
}

export function renderIngenieria(el: HTMLElement, data: Payload) {
  latest = data;

  if (!el.dataset.bound) {
    el.dataset.bound = "1";
    el.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("[data-sub]") as HTMLElement | null;

      if (btn) {
        activeSub = btn.dataset.sub as "rondas" | "tabla";
        if (latest) paint(el, latest);
        return;
      }

      const summary = target.closest("summary");
      const round = summary?.closest(".round-accordion") as HTMLDetailsElement | null;
      if (!round) return;

      if (round.dataset.restoredOpen === "1") {
        delete round.dataset.restoredOpen;
      }

      window.requestAnimationFrame(() => hydrateRoundMetrics(el));
    });
  }

  paint(el, data);
}
